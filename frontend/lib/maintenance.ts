// Lightweight maintenance scheduler & lifespan estimation
// This is intentionally heuristic; future versions can call AI edge functions.

import { Appliance, MaintenanceTask, LifespanEstimate, MaintenancePlanResult, RegionContext } from '../types/models';
import { supabase } from './supabase';

// Expected replacement lifespans (years) by canonical type
const LIFESPAN_YEARS: Record<string, number> = {
  water_heater: 10,
  dishwasher: 9,
  fridge: 15,
  washer: 12,
  dryer: 12,
  ac: 15,
  hvac: 15,
  furnace: 20,
  boiler: 25,
  disposal: 8,
  oven: 18,
  microwave: 8,
};

// Recurring routine tasks (months between) by category & appliance type
const ROUTINE_RULES: Array<{
  type: string; // appliance type or '*'
  everyMonths: number;
  category: MaintenanceTask['category'];
  title: (a: Appliance) => string;
  description?: (a: Appliance) => string;
}> = [
  {
    type: 'ac',
    everyMonths: 3,
    category: 'filter',
    title: () => 'Change AC Filter',
    description: () => 'Replace or clean the HVAC/AC air filter to maintain efficiency.'
  },
  {
    type: 'hvac',
    everyMonths: 3,
    category: 'filter',
    title: () => 'Change HVAC Filter',
    description: () => 'Routine filter change improves air quality and lowers energy usage.'
  },
  {
    type: 'water_heater',
    everyMonths: 12,
    category: 'inspection',
    title: () => 'Flush Water Heater Tank',
    description: () => 'Annual flush reduces sediment buildup and extends lifespan.'
  },
  {
    type: 'dishwasher',
    everyMonths: 6,
    category: 'cleaning',
    title: () => 'Deep Clean Dishwasher',
    description: () => 'Clean spray arms, filter, and run a cleaning cycle.'
  },
  {
    type: '*',
    everyMonths: 12,
    category: 'inspection',
    title: (a) => `Annual Inspection: ${pretty(a.type)}`,
    description: (a) => `General annual inspection for ${pretty(a.type)} to spot early issues.`
  }
];

function pretty(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
}

export async function generateMaintenancePlan(
  appliances: Appliance[],
  region: RegionContext,
  today = new Date()
): Promise<MaintenancePlanResult> {
  const tasks: MaintenanceTask[] = [];
  const lifespan: LifespanEstimate[] = [];
  const year = today.getFullYear();
  const homeId = region.homeId || appliances[0]?.home_id; // prefer homeId from region
  // Obtain climate zone: prefer region.climateZone provided; else fetch via edge function using lat/lon; fallback heuristic
  let climateZone: 'cold' | 'harsh' | 'moderate' | undefined = (region as any).climateZone;
  if (!climateZone && region?.lat && region?.lon) {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/climate_zone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ lat: region.lat, lon: region.lon })
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.zone) climateZone = json.zone;
        // Cache to homes table if homeId known
        if (json?.zone && homeId) {
          await supabase.from('homes').update({ climate_zone: json.zone }).eq('id', homeId);
        }
      }
    } catch {}
  }
  if (!climateZone) climateZone = inferClimateZone(region.state);

  for (const a of appliances) {
    // Lifespan
    const expectedYears = LIFESPAN_YEARS[a.type];
    if (expectedYears && a.install_year) {
      const estReplaceYear = a.install_year + expectedYears;
      const remaining = estReplaceYear - year;
      lifespan.push({
        type: a.type,
        estimated_replacement_year: estReplaceYear,
        years_remaining: remaining,
        confidence: remaining < 0 ? 'high' : remaining < 3 ? 'medium' : 'low',
      });
      // Replacement advisory if near or overdue
      if (remaining <= 1) {
        tasks.push({
          id: `replace-${a.id}`,
            appliance_id: a.id,
            home_id: a.home_id,
            due_date: isoDate(addMonths(today, remaining <= 0 ? 0 : remaining * 12)),
            title: `Plan Replacement: ${pretty(a.type)}`,
            description: remaining <= 0
              ? `${pretty(a.type)} likely exceeded typical lifespan. Budget & plan replacement.`
              : `${pretty(a.type)} nearing end of typical lifespan. Begin budgeting & vendor research.`,
            severity: remaining <= 0 ? 'overdue' : 'soon',
            category: 'replacement',
            source: 'prediction',
        });
      }
    } else {
      lifespan.push({ type: a.type, confidence: 'low' });
    }

    // Routine rules
    for (const r of ROUTINE_RULES) {
      if (r.type !== '*' && r.type !== a.type) continue;
      // Compute next due month referencing install date or start of year fallback
      const anchorYear = a.install_year || year;
      const monthsSinceAnchor = (year - anchorYear) * 12 + today.getMonth();
      const periods = Math.floor(monthsSinceAnchor / r.everyMonths);
      const nextPeriodStartMonths = (periods + 1) * r.everyMonths;
      const nextDue = addMonths(new Date(anchorYear, 0, 1), nextPeriodStartMonths);
      const severity: MaintenanceTask['severity'] = nextDue < today ? 'overdue' : (nextDue.getTime() - today.getTime()) / (1000*60*60*24) < 30 ? 'soon' : 'info';
      tasks.push({
        id: `${r.type}-${r.category}-${a.id}-${periods+1}`,
        appliance_id: a.id,
        home_id: a.home_id,
        due_date: isoDate(nextDue),
        title: r.title(a),
        description: r.description?.(a),
        severity,
        category: r.category,
        source: 'rule',
      });
    }
  }

  // Home-level generic tasks influenced by home attributes
  if (homeId) {
    // Smoke alarm battery check per floor (semi-annual)
    const floors = region.floors ?? 1;
    const semiAnnualMonths = [0, 6]; // Jan, Jul
    for (const m of semiAnnualMonths) {
      tasks.push({
        id: `home-smoke-alarms-${m}`,
        home_id: homeId,
        due_date: isoDate(new Date(year, m, 1)),
        title: `Test smoke/CO alarms (all floors x${floors})`,
        description: `Press test buttons and replace batteries if weak. Ensure alarms on each level (${floors}).`,
        severity: new Date(year, m, 1) < today ? 'overdue' : 'soon',
        category: 'inspection',
        source: 'rule',
      });
    }

    // Gutter cleaning recommendation for multi-story or tree-heavy regions (twice a year)
    if ((region.floors ?? 1) > 1) {
      const months = [3, 10]; // Apr, Nov
      for (const m of months) {
        tasks.push({
          id: `home-gutters-${m}`,
          home_id: homeId,
          due_date: isoDate(new Date(year, m, 15)),
          title: 'Clean gutters and downspouts',
          description: 'Prevent overflow and foundation damage. Consider guards if frequent clogs.',
          severity: new Date(year, m, 15) < today ? 'overdue' : 'soon',
          category: 'cleaning',
          source: 'rule',
        });
      }
    }

    // Bathroom caulk/mold inspection annually based on bathroom count
    const baths = region.bathrooms ?? 1;
    tasks.push({
      id: `home-bath-caulk-${year}`,
      home_id: homeId,
      due_date: isoDate(new Date(year, 1, 20)),
      title: `Inspect bathroom caulk/grout (x${baths})`,
      description: 'Clean and recaulk areas with mold, gaps, or peeling to prevent leaks.',
      severity: new Date(year, 1, 20) < today ? 'overdue' : 'soon',
      category: 'inspection',
      source: 'rule',
    });

    // Seasonal HVAC tune-up (spring & fall) based on climate zone
    const hvacMonths = climateZone === 'cold' ? [8] : [3, 9]; // Cold: pre-winter; Moderate: spring & fall
    for (const m of hvacMonths) {
      tasks.push({
        id: `home-hvac-tune-${m}-${year}`,
        home_id: homeId,
        due_date: isoDate(new Date(year, m, 10)),
        title: 'Schedule HVAC professional tune-up',
        description: 'Optimize efficiency and identify issues before peak season usage.',
        severity: new Date(year, m, 10) < today ? 'overdue' : 'soon',
        category: 'service',
        source: 'rule',
      });
    }

    // Roof inspection yearly (late summer) for multi-floor or harsh climates
    if ((region.floors ?? 1) > 1 || climateZone === 'harsh') {
      tasks.push({
        id: `home-roof-inspect-${year}`,
        home_id: homeId,
        due_date: isoDate(new Date(year, 7, 25)),
        title: 'Roof inspection (visual / professional if issues)',
        description: 'Check for lifted shingles, damaged flashing, moss growth, and leaks.',
        severity: new Date(year, 7, 25) < today ? 'overdue' : 'soon',
        category: 'inspection',
        source: 'rule',
      });
    }

    // Move-in year adjustment: if older than 20 years, add plumbing check
    if (region.moveInYear && year - region.moveInYear >= 20) {
      tasks.push({
        id: `home-plumbing-aging-${year}`,
        home_id: homeId,
        due_date: isoDate(new Date(year, 2, 5)),
        title: 'Whole-home plumbing inspection',
        description: 'Older homes benefit from checking for corrosion, leaks, and shutoff valve function.',
        severity: new Date(year, 2, 5) < today ? 'overdue' : 'soon',
        category: 'inspection',
        source: 'rule',
      });
    }
  }

  // Sort tasks by due date ascending
  tasks.sort((a,b) => a.due_date.localeCompare(b.due_date));

  return { tasks, lifespan, generated_at: new Date().toISOString() };
}

function isoDate(d: Date): string { return d.toISOString().split('T')[0]; }
function addMonths(d: Date, m: number): Date { return new Date(d.getFullYear(), d.getMonth() + m, d.getDate()); }
function inferClimateZone(state?: string): 'cold' | 'harsh' | 'moderate' {
  if (!state) return 'moderate';
  const cold = ['ME','VT','NH','ND','SD','MN','WI','MI','MT','WY','ID'];
  const harsh = ['AZ','NV','NM','TX','FL']; // heat or humidity extremes
  if (cold.includes(state.toUpperCase())) return 'cold';
  if (harsh.includes(state.toUpperCase())) return 'harsh';
  return 'moderate';
}
