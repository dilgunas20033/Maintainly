// Edge Function: climate_zone
// Classifies climate zone using Open-Meteo average temperatures (simple heuristic)
// Returns { zone: 'cold' | 'moderate' | 'harsh', avgTempC }
// Deploy via: supabase functions deploy climate_zone

import type { Serve } from 'https://deno.land/x/sift@0.6.0/mod.ts';

function classify(avgC: number): 'cold' | 'moderate' | 'harsh' {
  if (avgC < 7) return 'cold'; // <45F
  if (avgC > 26) return 'harsh'; // >78F (heat/humidity extreme)
  return 'moderate';
}

export const serve: Serve = async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { lat, lon } = await request.json();
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return new Response(JSON.stringify({ error: 'lat/lon required' }), { status: 400 });
    }
    // Fetch daily temps for last 30 days to compute average
    const today = new Date();
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&start_date=${past.toISOString().split('T')[0]}&end_date=${today.toISOString().split('T')[0]}&daily=temperature_2m_max,temperature_2m_min&timezone=UTC`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Upstream weather failed');
    const json = await res.json();
    const highs: number[] = json?.daily?.temperature_2m_max || [];
    const lows: number[] = json?.daily?.temperature_2m_min || [];
    let sum = 0; let count = 0;
    for (let i = 0; i < highs.length; i++) {
      if (typeof highs[i] === 'number' && typeof lows[i] === 'number') {
        sum += (highs[i] + lows[i]) / 2;
        count++;
      }
    }
    const avgC = count ? sum / count : 15; // fallback moderate
    const zone = classify(avgC);
    return new Response(JSON.stringify({ zone, avgTempC: avgC }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
};

serve(async (req) => await serve(req));
