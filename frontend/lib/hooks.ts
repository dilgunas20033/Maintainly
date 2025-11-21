import { useQuery } from '@tanstack/react-query';
import { fetchHomes, fetchAppliances, fetchHome } from './services';
import { generateMaintenancePlan } from './maintenance';
import type { Appliance, MaintenancePlanResult } from '../types/models';

export function useHomes() {
  return useQuery({
    queryKey: ['homes'],
    queryFn: fetchHomes,
    staleTime: 1000 * 60, // 1 min
  });
}

export function useAppliances(homeId?: string) {
  return useQuery<Appliance[]>({
    queryKey: ['appliances', homeId],
    queryFn: () => homeId ? fetchAppliances(homeId) : Promise.resolve([]),
    enabled: !!homeId,
    staleTime: 1000 * 30,
  });
}

export function useMaintenancePlan(homeId?: string) {
  const apq = useAppliances(homeId);
  return useQuery<MaintenancePlanResult>({
    queryKey: ['maintenance-plan', homeId, apq.data?.length],
    queryFn: async () => {
      const home = homeId ? await fetchHome(homeId) : null;
      const region = {
        city: home?.city,
        state: home?.state,
        country: home?.country,
        bedrooms: home?.bedrooms ?? undefined,
        bathrooms: home?.bathrooms ?? undefined,
        floors: home?.floors ?? undefined,
        homeId: home?.id,
        lat: home?.lat ?? undefined,
        lon: home?.lon ?? undefined,
        moveInYear: home?.move_in_year ?? undefined,
      } as any;
      return generateMaintenancePlan(apq.data || [], region);
    },
    enabled: apq.status === 'success' && !!homeId,
  });
}
