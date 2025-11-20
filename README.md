# Maintainly

## Mission
Make it easier for homeowners to proactively maintain their property in one single app using AI for accurate predictions and generated calendar reminders.

## Vision
Simple, reliable prediction of any home service need so owners are prepared before it’s too late.

## Core Values
- **Reliability** – Every reminder, alert, and prediction is timely & accurate.
- **Simplicity** – Clear design, intuitive flows, minimal learning curve.
- **Trust & Transparency** – Secure, open handling of data; no hidden fees or biased recommendations.
- **Proactive Care** – Prevention over expensive repairs.
- **Innovation** – Continuous improvement through AI, data, and integrations.

## The Problem
Homeowners & renters forget routine and lifecycle events (filters, inspections, pest control) leading to premature failures (e.g., water heater at end-of-life) and unexpected costs.

## The Solution
"Carfax for your house" – Track, predict, and remind. Maintainly centralizes appliances, schedules care tasks, estimates replacements, and connects you to local service providers.

## Unique Value Proposition
Regional weather + typical product lifetimes + actual install dates + receipt/warranty tracking = more accurate, contextual predictions than review‑only AI approaches.

## Differentiation
Radically simple UX to understand home status and trigger service with one tap.

## Strategic Go-To-Market
Partner with local realtors/property managers to onboard new homeowners at point of purchase/lease.

---
## MVP Scope (Current Sprint)
1. Auth (Supabase) basic email sign in & profile.
2. Home onboarding: add one or more homes with location metadata.
3. Appliance catalog: add canonical appliance entries (type, year, brand, location).
4. Maintenance preview: heuristic generator of upcoming tasks & lifespan estimates.
5. AI Chat placeholder: edge function `chat_plan` returning advisory text.
6. Simple dashboard with next tasks and appliance management.
7. Scaffolding for future receipt scan & service marketplace (placeholder screens).

## Data Model (Initial)
- `profiles`: user profile + last_home_id, location fallback.
- `homes`: user-owned home records.
- `appliances`: canonical appliance entries per home.
- (Future) `maintenance_tasks` persisted; currently generated transiently.

## Tech Stack
- React Native + Expo
- Supabase (Auth, Postgres, Edge Functions)
- React Navigation (stack)
- React Query (fetch caching – partially integrated)
- Zod (validation – planned)
- Jest + ts-jest (unit tests – added)

## Setup
1. Duplicate `.env.development` → `.env` or configure Expo env vars (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
2. Ensure Supabase tables (`profiles`, `homes`, `appliances`) match fields used in code & RLS policies allow user row access.
3. Install dependencies:
```bash
npm install
```
4. Start Expo:
```bash
npm run start
```
5. Run tests:
```bash
npm test
```

## Maintenance Logic (Heuristic)
`lib/maintenance.ts` computes:
- Routine tasks (filter changes, flushes, inspections) based on month cadence.
- Lifespan estimates using install_year + typical lifespan per type.
- Replacement advisories when ≤1 year remaining.

## Notifications (MVP)
On dashboard load we request notification permission and immediately fire local notifications for urgent tasks (due ≤3 days or overdue). Future iterations will schedule triggers near due dates, include user snooze/dismiss controls, and leverage a persisted `maintenance_tasks` table.

## Next Enhancements
- Persist generated tasks & user dismissals.
- Weather/climate integration for dynamic frequency tuning.
- Receipt OCR & warranty tracking.
- Local service provider marketplace & booking.
- Push notification scheduling for due tasks.

## Contributing (Internal MVP Phase)
Keep PRs small & focused. Include reasoning in description, reference strategic goals above, and update README sections if expanding scope.
