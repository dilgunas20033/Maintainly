// supabase/functions/chat_plan/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY")!;
const OPENAI_KEY   = Deno.env.get("OPENAI_API_KEY") || ""; // optional; we handle no-quota gracefully
const DEBUG        = (Deno.env.get("DEBUG_CHAT") || "false").toLowerCase() === "true";

// ---------- tiny intent & kind detection (no LLM needed) ----------
const ALIASES: Record<string, string[]> = {
  water_heater: ["water heater","water-heater","hot water heater","waterheater"],
  dishwasher:   ["dishwasher","dish washer"],
  hvac:         ["hvac"],
  ac:           ["ac","a/c","air conditioner","air-conditioning"],
  furnace:      ["furnace"],
  boiler:       ["boiler"],
  fridge:       ["fridge","refrigerator"],
  washer:       ["washer","washing machine"],
  dryer:        ["dryer"],
  disposal:     ["garbage disposal","disposal"],
  oven:         ["oven","range","stove"],
  microwave:    ["microwave"],
};
const norm = (s?: string | null) => (s || "").toLowerCase().replace(/[^\w]/g, "_");

console.log('DBG SUPABASE_URL prefix:', (SUPABASE_URL || '').slice(0, 40));

function detectKindFromText(text: string): string | null {
  const t = text.toLowerCase();
  for (const [canon, list] of Object.entries(ALIASES)) {
    for (const phrase of list) {
      const rx = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i");
      if (rx.test(t)) return canon;
    }
  }
  return null;
}
function isLifespanQuery(text: string) {
  const t = text.toLowerCase();
  return /\b(when|how\s+long|lifespan|life\s*left|die|replace|replacement)\b/.test(t);
}

// ---------- LLM wrapper with safe fallback ----------
async function askLLM(messages: any[], json = false): Promise<string | null> {
  if (!OPENAI_KEY) return null;
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages,
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      console.error("LLM error:", txt);
      return null;
    }
    const jsonResp = await resp.json();
    return jsonResp?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.error("LLM network error:", e);
    return null;
  }
}

// ---------- predictor call ----------
async function runPredict(jwt: string, applianceId: string, loc?: { city?: string|null; state?: string|null; country?: string|null }) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/predict_asset`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: JSON.stringify({ appliance_id: applianceId, location: loc ?? null }),
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(json?.error || "prediction failed");
  return json;
}

// ---------- selection logic ----------
function pickBestApplianceFromMessage(
  message: string,
  appliances: Array<{ id: string; type: string | null; install_year: number | null; created_at?: string | null }>
) {
  const detected = detectKindFromText(message);
  const m = norm(message);

  if (detected) {
    const k = norm(detected);
    const exact = appliances.filter(a => norm(a.type) === k);
    if (exact.length) {
      exact.sort((a,b) => (b.install_year ?? 0) - (a.install_year ?? 0));
      return exact[0];
    }
    const contains = appliances.filter(a => norm(a.type).includes(k));
    if (contains.length) {
      contains.sort((a,b) => (b.install_year ?? 0) - (a.install_year ?? 0));
      return contains[0];
    }
  }

  // fuzzy by tokens
  const scored = appliances.map(a => {
    const n = norm(a.type);
    const score =
      (n && (m.includes(n) ? 2 : 0)) +
      (n && n.split("_").some(tok => tok && m.includes(tok)) ? 1 : 0);
    return { a, score };
  }).filter(x => x.score > 0);

  if (scored.length) {
    scored.sort((x,y) => (y.score - x.score) || ((y.a.install_year ?? 0) - (x.a.install_year ?? 0)));
    return scored[0].a;
  }

  if (appliances.length === 1) return appliances[0];
  return null;
}

// ---------- main ----------
serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Use POST", { status: 405 });
    const jwt = (req.headers.get("authorization") || "").replace("Bearer ", "");
    const { message } = await req.json();
    const userMsg: string = (message || "").toString();

    const sb = createClient(SUPABASE_URL, ANON_KEY, { global: { fetch }, auth: { persistSession: false } });
    const { data: u } = await sb.auth.getUser(jwt);
    const userId = u?.user?.id;
    if (!userId) return new Response("Unauthorized", { status: 401 });

    // Load personalized context
    const [{ data: prof }, { data: homes }, { data: appliances }] = await Promise.all([
      sb.from("profiles").select("first_name, city, state, country").eq("user_id", userId).maybeSingle(),
      sb.from("homes").select("id, nickname, city, state, country").eq("user_id", userId).order("created_at", { ascending: false }),
      sb.from("appliances").select("id, type, install_year, home_id, brand, model, location, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);

    const lastHome = (prof?.last_home_id
        ? (homes || []).find(h => h.id === prof.last_home_id)
        : (homes || [])[0]) || null;


    if (DEBUG) {
        console.log("DBG user:", userId);
        console.log("DBG profile:", prof);
        console.log("DBG homes count:", homes?.length);
        console.log("DBG appliances count:", appliances?.length);
        if (appliances?.length) console.log("DBG sample appliance:", appliances[0]);
    }


    const ctx = {
      profile: prof || null,
      home: homes?.[0] || null,
      appliances: (appliances || []).slice(0, 50),
    };

    if (DEBUG) {
      console.log("DBG user:", userId);
      console.log("DBG appliances count:", ctx.appliances.length);
      console.log("DBG first appliance:", ctx.appliances[0]);
    }

    // Try to serve a prediction when the user asks lifespan-ish + we can find a match
    let pred: any = null;
    let usedApplianceId: string | null = null;

    const looksLikeLifespan = isLifespanQuery(userMsg);
    if (looksLikeLifespan && ctx.appliances.length) {
      const picked = pickBestApplianceFromMessage(userMsg, ctx.appliances);
      if (picked) {
        usedApplianceId = picked.id;
        // Build location: picked.home -> profile
        let loc: any = null;
        if (picked.home_id) {
          const { data: h } = await sb.from("homes").select("city,state,country").eq("id", picked.home_id).maybeSingle();
          if (h) loc = { city: h.city ?? null, state: h.state ?? null, country: h.country ?? null };
        }
        if (!loc && ctx.home) loc = { city: ctx.home.city ?? null, state: ctx.home.state ?? null, country: ctx.home.country ?? null };
        if (!loc && ctx.profile) loc = { city: ctx.profile.city ?? null, state: ctx.profile.state ?? null, country: ctx.profile.country ?? null };

        // Only call predictor if we have at least an install_year (prediction assumes a start year)
        if (picked.install_year) {
          try {
            pred = await runPredict(jwt, picked.id, loc || undefined);
          } catch (e) {
            console.error("predict_asset error", e);
            pred = null;
          }
        }
      }
    }

    // Compose an assistant answer using LLM if available, with context JSON
    const systemPrompt =
`You are Maintainly — a friendly, expert home-maintenance assistant.
• Always answer the user's question conversationally.
• Personalize with first name and home nickname when available.
• If a prediction is included, summarize it clearly (remaining life, replacement date, monthly saving).
• If data is missing (e.g., no install year), ask ONE concise follow-up while still giving helpful guidance.
• Keep answers focused and actionable.`;

    const contextForLLM = {
      user_message: userMsg,
      profile: ctx.profile,
      home: ctx.home,
      appliances: ctx.appliances,
      prediction: pred,              // may be null
      used_appliance_id: usedApplianceId, // may be null
    };

    const llmMessages = [
      { role: "system", content: systemPrompt },
      { role: "user",   content: `CONTEXT:\n${JSON.stringify(contextForLLM, null, 2)}\n\nUSER:\n${userMsg}` }
    ];

    let answer: string | null = await askLLM(llmMessages, false);

    // Strong fallback (no LLM / no prediction)
    if (!answer) {
      if (pred) {
        const name  = ctx.profile?.first_name ? ` ${ctx.profile.first_name}` : "";
        const label = (ctx.appliances.find(a => a.id === usedApplianceId)?.type || "appliance").replace(/_/g, " ");
        answer =
          `Okay${name}, for your ${label}:\n` +
          `• Estimated remaining life: ~${pred.adj_lifespan_years} years\n` +
          `• Target replacement date: ${pred.replace_on}\n` +
          `• Suggested monthly saving: $${pred.monthly_target}\n` +
          `Want tips to extend its lifespan or set a reminder?`;
      } else {
        // No LLM and no prediction → still be helpful and ask one follow-up
        const name  = ctx.profile?.first_name ? ` ${ctx.profile.first_name}` : "";
        answer =
          `Hi${name}! I can help with maintenance, troubleshooting, and budgeting.\n` +
          `Try asking “When should I replace my water heater?” or tell me: “Dishwasher installed 2018 in Austin, TX.”\n` +
          `If you’d like, I can also help you add or update your appliances so estimates get more accurate.`;
      }
    }

    return new Response(JSON.stringify({
      answer,
      prediction: pred,              // may be null
      used_appliance_id: usedApplianceId, // may be null
    }), { headers: { "content-type": "application/json" } });

  } catch (e) {
    console.error(e);
    // Never 500 the app — return a graceful error
    return new Response(JSON.stringify({
      answer: "Sorry—something went wrong. You can still ask me a question while I recover.",
      error: String(e)
    }), { status: 200, headers: { "content-type": "application/json" } });
  }
});
