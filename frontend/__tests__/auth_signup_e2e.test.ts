import { supabase } from '../lib/supabase';
import { generateMaintenancePlan } from '../lib/maintenance';

function randEmail() {
  const ts = Date.now();
  return `maintainly.test+${ts}@example.com`;
}

describe('E2E signup → profile → home → appliances → maintenance plan', () => {
  const email = randEmail();
  const password = 'TestPass123!';
  let homeId: string | undefined;
  let userId: string | undefined;

  it('signs up (or signs in) and creates dependent data', async () => {
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase env vars missing; skipping E2E.');
      return;
    }

    const signUp = await supabase.auth.signUp({ email, password });
    userId = signUp.data.user?.id;
    if (!signUp.data.session) {
      // If email confirmation required, attempt sign-in (test env may have disabled confirm)
      const si = await supabase.auth.signInWithPassword({ email, password });
      userId = si.data.user?.id;
    }
    expect(userId).toBeTruthy();

    // Upsert profile minimal
    const { error: pErr } = await supabase.from('profiles').upsert({
      user_id: userId,
      updated_at: new Date().toISOString(),
      city: 'Fort Myers', state: 'FL', country: 'USA'
    }, { onConflict: 'user_id' });
    expect(pErr).toBeNull();

    // Create home
    const { data: home, error: hErr } = await supabase.from('homes').insert({
      user_id: userId,
      nickname: 'Test Home',
      country: 'USA', state: 'FL', city: 'Fort Myers',
      lat: 26.560, lon: -81.870,
      move_in_year: 2010
    }).select('id').single();
    expect(hErr).toBeNull();
    homeId = home?.id;
    expect(homeId).toBeTruthy();

    // Insert appliances
    const { error: aErr } = await supabase.from('appliances').insert([
      { user_id: userId, home_id: homeId, type: 'water_heater', install_year: 2015 },
      { user_id: userId, home_id: homeId, type: 'dishwasher', install_year: 2020 }
    ]);
    expect(aErr).toBeNull();

    // Fetch appliances
    const { data: appliances, error: fErr } = await supabase.from('appliances').select('*').eq('home_id', homeId);
    expect(fErr).toBeNull();
    expect(appliances?.length).toBeGreaterThanOrEqual(2);

    // Generate maintenance plan (async)
    const plan = await generateMaintenancePlan(appliances!, { state: 'FL', lat: 26.560, lon: -81.870, homeId });
    expect(plan.tasks.length).toBeGreaterThan(0);
    expect(plan.lifespan.length).toBeGreaterThan(0);
  }, 60000); // allow up to 60s for network
});
