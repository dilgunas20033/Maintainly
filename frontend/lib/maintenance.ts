// Lightweight maintenance scheduler & lifespan estimation
// This is intentionally heuristic; future versions can call AI edge functions.

import { Appliance, MaintenanceTask, LifespanEstimate, MaintenancePlanResult, RegionContext } from '../types/models';

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

export function generateMaintenancePlan(
  appliances: Appliance[],
  region: RegionContext,
  today = new Date()
): MaintenancePlanResult {
  const tasks: MaintenanceTask[] = [];
  const lifespan: LifespanEstimate[] = [];
  const year = today.getFullYear();

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

  // Sort tasks by due date ascending
  tasks.sort((a,b) => a.due_date.localeCompare(b.due_date));

  return { tasks, lifespan, generated_at: new Date().toISOString() };
}

function isoDate(d: Date): string { return d.toISOString().split('T')[0]; }
function addMonths(d: Date, m: number): Date { return new Date(d.getFullYear(), d.getMonth() + m, d.getDate()); }
