import { generateMaintenancePlan } from '../lib/maintenance';
import type { Appliance } from '../types/models';

describe('maintenance scheduler', () => {
  it('produces replacement advisory when near end-of-life', async () => {
    const thisYear = new Date().getFullYear();
    const appliances: Appliance[] = [
      { id: 'a1', user_id: 'u', home_id: 'h', type: 'water_heater', install_year: thisYear - 10 },
    ];
    const plan = await generateMaintenancePlan(appliances, {} as any);
    expect(plan.tasks.some((t: any) => t.title.includes('Plan Replacement'))).toBe(true);
  });

  it('creates routine tasks', async () => {
    const appliances: Appliance[] = [
      { id: 'a2', user_id: 'u', home_id: 'h', type: 'dishwasher', install_year: 2020 },
    ];
    const plan = await generateMaintenancePlan(appliances, {} as any);
    expect(plan.tasks.find((t: any) => t.title.toLowerCase().includes('deep clean'))).toBeTruthy();
  });
});
