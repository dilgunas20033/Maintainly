## Maintainly Architecture (MVP)

### Overview
Mobile-first (Expo) client backed by Supabase Postgres + Auth + Edge Functions. Thin service layer abstracts table access; transient maintenance logic runs client-side (future: persisted & AI-enhanced). Global context supplies session/profile/home state; React Query caches network calls.

### Layers
| Layer | Purpose |
|-------|---------|
| UI Screens (`screens/*`) | Presentation & navigation only. Minimal data logic. |
| Components (`screens/ui.tsx`, `screens/shared.tsx`) | Reusable UI primitives (buttons, inputs, tiles). |
| Domain Types (`types/models.ts`) | Canonical shape for profile, home, appliance, maintenance task. |
| Services (`lib/services.ts`) | CRUD wrappers around Supabase (homes/appliances/profile). |
| Context (`lib/appContext.tsx`) | Session tracking, profile + homes, currentHome selection. |
| Maintenance Logic (`lib/maintenance.ts`) | Heuristic scheduler & lifespan estimation. |
| Supabase Client (`lib/supabase.ts`) | Initialized SDK + auth settings. |
| Theme (`lib/theme.ts`) | Tokens: palette, spacing, radius, shadow. |
| Edge Functions (backend/supabase/functions/*) | AI chat / prediction extensions (invoked via `supabase.functions.invoke`). |

### State Management
- **Ephemeral UI State**: Local component `useState`.
- **Global Session/Profile/Homes**: `AppProvider` context.
- **Server Data Caching**: React Query (future: wrap `fetchHomes`, `fetchAppliances` with `useQuery`).
- **Derived Maintenance Plan**: Generated on demand in `HomeDashboard` (will move to persisted table for audit + notifications).

### Navigation
Single native stack. Auth screens conditionally rendered until session exists. Future improvement: split `AuthStack` and `AppStack` + deep linking.

### Maintenance Plan Generation
Rules + lifespan tables produce tasks; tasks filtered for near-due/overdue display. Severity derives from days until due.

### Security & RLS
All inserts include `user_id`. Supabase RLS policies must enforce row ownership (not shown, assumed). Edge functions rely on service role (through platform) or user auth token.

### Extension Points
1. Persist tasks & user overrides (skip/postpone).  
2. Notification scheduler (Expo Notifications + server cron).  
3. AI enhancement: pass region + appliance metadata to edge function for adaptive intervals.  
4. Receipt OCR (FileSystem + Vision API).  
5. Service marketplace (provider directory + booking flow).  

### Testing Strategy
Unit tests focus on pure logic (`maintenance.ts`). Integration tests later for service layer with mock Supabase or local Postgres.

### Performance Considerations
Lightweight queries (homes/appliances). React Query will de-duplicate & cache. Maintenance generation O(n * rules), negligible for typical home counts.

### Future Data Additions
`maintenance_tasks` table with columns: id, home_id, appliance_id, due_date, title, description, severity, category, source, status, created_at, updated_at.
