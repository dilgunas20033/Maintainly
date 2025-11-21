-- Add geolocation & climate columns to homes
alter table homes add column if not exists lat decimal;
alter table homes add column if not exists lon decimal;
alter table homes add column if not exists move_in_year int;
alter table homes add column if not exists climate_zone text;

-- Providers table (if not exists)
create table if not exists providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  phone text,
  website text,
  rating numeric,
  reviews int,
  lat decimal,
  lon decimal,
  created_at timestamptz default now()
);

-- Basic index for geo queries
create index if not exists providers_lat_lon_idx on providers(lat, lon);
