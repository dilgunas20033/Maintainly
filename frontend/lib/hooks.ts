import { useQuery } from '@tanstack/react-query';
import { fetchHomes, fetchAppliances } from './services';
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
    queryFn: () => Promise.resolve(generateMaintenancePlan(apq.data || [], {})),
    enabled: apq.status === 'success' && !!homeId,
  });
}
