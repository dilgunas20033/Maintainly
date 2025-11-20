import { generateMaintenancePlan } from '../lib/maintenance';
import type { Appliance } from '../types/models';

describe('maintenance scheduler', () => {
  it('produces replacement advisory when near end-of-life', () => {
    const thisYear = new Date().getFullYear();
    const appliances: Appliance[] = [
      { id: 'a1', user_id: 'u', home_id: 'h', type: 'water_heater', install_year: thisYear - 10 },
    ];
    const plan = generateMaintenancePlan(appliances, {});
    expect(plan.tasks.some(t => t.title.includes('Plan Replacement'))).toBe(true);
  });

  it('creates routine tasks', () => {
    const appliances: Appliance[] = [
      { id: 'a2', user_id: 'u', home_id: 'h', type: 'dishwasher', install_year: 2020 },
    ];
    const plan = generateMaintenancePlan(appliances, {});
    expect(plan.tasks.find(t => t.title.toLowerCase().includes('deep clean'))).toBeTruthy();
  });
});
