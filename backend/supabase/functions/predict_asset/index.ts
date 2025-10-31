// supabase/functions/predict_asset/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

type Body = {
  appliance_id: string;
  location?: { city?: string | null; state?: string | null; country?: string | null } | null;
  budget_usd?: number | null;
};

const SB_URL  = Deno.env.get("SUPABASE_URL")!;
const ANON    = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // kept for future writes if needed

const geocodeUrl = (q: string) =>
  `https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&name=${encodeURIComponent(q)}`;

const climateNormalsUrl = (lat: number, lon: number) =>
  `https://archive-api.open-meteo.com/v1/era5?latitude=${lat}&longitude=${lon}&daily=temperature_2m_mean,relative_humidity_2m_mean&start_date=1991-01-01&end_date=2020-12-31`;

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Use POST", { status: 405 });

    // Auth
    const jwt = (req.headers.get("authorization") || "").replace("Bearer ", "");
    const asUser = createClient(SB_URL, ANON, { global: { fetch }, auth: { persistSession: false } });
    const { data: u } = await asUser.auth.getUser(jwt);
    const userId = u?.user?.id;
    if (!userId) return new Response("Unauthorized", { status: 401 });

    // Body
    const body = (await req.json()) as Body;
    if (!body?.appliance_id) return new Response("appliance_id required", { status: 400 });

    // Load appliance (RLS will enforce ownership)
    const { data: app, error: appErr } = await asUser
      .from("appliances")
      .select("id, type, install_year, home_id")
      .eq("id", body.appliance_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (appErr) throw appErr;
    if (!app) return new Response("Appliance not found", { status: 404 });

    // Resolve location: override -> appliance.home -> profile
    let locStr: string | null = null;

    if (body.location && (body.location.city || body.location.state || body.location.country)) {
      locStr = [body.location.city, body.location.state, body.location.country].filter(Boolean).join(", ");
    } else if (app.home_id) {
      const { data: home } = await asUser
        .from("homes")
        .select("city, state, country")
        .eq("id", app.home_id)
        .maybeSingle();
      if (home) locStr = [home.city, home.state, home.country].filter(Boolean).join(", ");
    }

    if (!locStr) {
      const { data: prof } = await asUser
        .from("profiles")
        .select("city, state, country")
        .eq("user_id", userId)
        .maybeSingle();
      if (prof) locStr = [prof.city, prof.state, prof.country].filter(Boolean).join(", ");
    }

    if (!locStr) {
      return new Response(
        JSON.stringify({ error: "No location available. Add city/state/country on the home or profile." }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Geocode & climate normals (free, no key)
    const g = await (await fetch(geocodeUrl(locStr))).json();
    const g1 = g?.results?.[0];
    if (!g1) return new Response(JSON.stringify({ error: "Geocoding failed" }), { status: 400 });

    const { latitude, longitude } = g1;
    const c = await (await fetch(climateNormalsUrl(latitude, longitude))).json();

    // simple averages across the ERA5 normals period (1991–2020)
    const temps: number[] = c?.daily?.temperature_2m_mean ?? [];
    const rhs:   number[] = c?.daily?.relative_humidity_2m_mean ?? [];
    const avgT  = temps.length ? temps.reduce((a,b)=>a+b,0)/temps.length : 22;
    const avgRH = rhs.length   ? rhs.reduce((a,b)=>a+b,0)/rhs.length     : 60;

    // --- Lifespan model (defaults for now; you can replace with DB-driven priors later) ---
    // Base lifespan by type (years)
    const baseByType: Record<string, number> = {
      water_heater: 12,
      dishwasher: 10,
      hvac: 15,
      ac: 12,
      furnace: 18,
      boiler: 20,
      fridge: 13,
      washer: 11,
      dryer: 12,
      disposal: 8,
      oven: 15,
      microwave: 8,
    };
    const t = (app.type || "").toLowerCase().replace(/[^\w]/g, "_");
    const baseYears = baseByType[t] ?? 12;

    // Sensitivity settings (percent per unit)
    const tBase = 22;              // baseline mean temp °C
    const rhBase = 60;             // baseline RH %
    const heatPerC = 0.5 / 100;    // -0.5% lifespan per +1°C
    const humidPer = 0.25 / 100;   // -0.25% per +1% RH
    const heatCap = 15 / 100;      // max -15% from heat
    const humidCap = 10 / 100;     // max -10% from humidity

    const heatPenalty  = Math.min(heatCap,  Math.max(0, avgT  - tBase) * heatPerC);
    const humidPenalty = Math.min(humidCap, Math.max(0, avgRH - rhBase) * humidPer);
    const totalPenalty = heatPenalty + humidPenalty;
    const adjYears     = +(baseYears * (1 - totalPenalty)).toFixed(1);

    // Install → Replacement
    const year = Number(app.install_year);
    const installed_on = Number.isFinite(year) && year > 1900 ? new Date(`${year}-06-01`) : new Date();
    const replace = new Date(installed_on);
    replace.setFullYear(replace.getFullYear() + Math.max(1, Math.floor(adjYears)));

    // Savings plan
    const today      = new Date();
    const monthsLeft = Math.max(1, (replace.getFullYear() - today.getFullYear()) * 12 + (replace.getMonth() - today.getMonth()));
    const defaultBudget = t === "water_heater" ? 1400 : (t === "dishwasher" ? 600 : 2000);
    const budget     = body.budget_usd ?? defaultBudget;
    const monthly    = +(budget / monthsLeft).toFixed(2);

    // Respond
    return new Response(JSON.stringify({
      appliance_id: app.id,
      type: app.type,
      install_year: app.install_year,
      base_lifespan_years: baseYears,
      adj_lifespan_years: adjYears,
      replace_on: replace.toISOString().slice(0, 10),
      monthly_target: monthly,
      inputs: {
        location_query: locStr,
        latitude, longitude,
        avg_temp_c: +avgT.toFixed(2),
        avg_rh_pct: +avgRH.toFixed(2),
        penalties: { heatPenalty: +heatPenalty.toFixed(4), humidPenalty: +humidPenalty.toFixed(4), totalPenalty: +totalPenalty.toFixed(4) },
        baselines: { tBase, rhBase },
      },
      // source_urls: [] // optionally attach citations later
    }), { headers: { "content-type": "application/json" } });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }
});
