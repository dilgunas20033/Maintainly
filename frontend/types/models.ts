// Domain model & shared types for Maintainly MVP
// Keep extremely lean; expand as needed.

export interface Profile {
  user_id: string;
  first_name?: string | null;
  last_home_id?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  updated_at?: string;
}

export interface Home {
  id: string;
  user_id: string;
  nickname: string;
  country: string;
  state: string;
  city: string;
  zip?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floors?: number | null;
  created_at?: string;
}

export interface Appliance {
  id: string;
  user_id: string;
  home_id: string;
  type: string; // canonical snake_case (e.g., water_heater)
  install_year?: number | null;
  brand?: string | null;
  model?: string | null;
  location?: string | null;
  created_at?: string;
}

// Maintenance task produced by scheduler
export interface MaintenanceTask {
  id: string; // synthetic UUID or composed key
  appliance_id?: string; // optional linkage
  home_id: string;
  due_date: string; // ISO date
  title: string; // short action e.g., "Change HVAC Filter"
  description?: string;
  severity: 'info' | 'soon' | 'overdue';
  category: 'filter' | 'inspection' | 'cleaning' | 'replacement' | 'general';
  source: 'rule' | 'prediction';
}

export interface LifespanEstimate {
  type: string; // appliance type
  estimated_replacement_year?: number; // when you likely replace (install_year + expected lifespan)
  years_remaining?: number;
  confidence: 'low' | 'medium' | 'high';
}

// Weather / region stub (future external integration)
export interface RegionContext {
  city?: string | null;
  state?: string | null;
  country?: string | null;
  climateZone?: string; // e.g., 'humid_subtropical'
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  homeId?: string;
}

// Simple result bundling
export interface MaintenancePlanResult {
  tasks: MaintenanceTask[];
  lifespan: LifespanEstimate[];
  generated_at: string;
}
