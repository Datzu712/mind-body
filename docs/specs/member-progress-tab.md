# Spec: Member Progress Tab (Dashboard)

## Objective

Add a new **"Progreso"** tab to the member profile detail view in the dashboard so that
trainers, staff, and admins can **view** a member's body measurements and general
activity — mirroring what the member sees in the mobile app, but read‑only and scoped
to any member they open.

- **User:** trainer / staff / admin viewing a member's profile in the dashboard.
- **Trigger:** opening `/dashboard/users/members/$id` and selecting the new tab.
- **Success:** the tab shows the member's measurement evolution (chart + first‑vs‑latest
  comparison + history) and their activity summaries (steps / calories / active minutes /
  exercises over a selectable period), with sensible empty states when the member has no data.

### Decisions (confirmed with user)

1. **Read‑only.** No creating/editing measurements from the dashboard in this version.
   Backend exposes only `GET` endpoints.
2. **One tab with stacked sub‑sections** (not separate tabs, not inner sub‑tabs): a single
   "Progreso" tab containing a Measurements section followed by an Activity section.
3. **Scope = equivalent to mobile:** metric evolution chart with period selector,
   comparison card (first vs latest with deltas), measurement history, and activity charts
   with totals.

## Tech Stack

- **Dashboard:** Vite + React 19 + TanStack Router + TanStack Query v5 + Tailwind v4 +
  shadcn/ui. Charts via **recharts 3.8.0** (already a dependency) + shadcn
  `src/components/ui/chart.tsx`. (Mobile uses `react-native-gifted-charts`; the dashboard
  must use recharts — do **not** port the mobile chart lib.)
- **Backend:** NestJS REST API (`apps/restapi`), Drizzle/pg.

## Commands

- Dashboard dev: `pnpm --filter dashboard dev`
- Dashboard typecheck/build: `pnpm --filter dashboard build`
- Backend dev: `pnpm --filter restapi start:dev`
- Backend typecheck/build: `pnpm --filter restapi build`
- (Lint intentionally not used as a verification gate — per project working style.)

## Project Structure (files touched / added)

### Backend (`apps/restapi/src/modules/`)

- `measurements/measurements.controller.ts` — **add** read routes nested under a member id.
- `measurements/measurements.service.ts` — resolve `memberId` from a `userId` and reuse
  existing `findAll` / `getSummary` logic (currently keyed off the authenticated user).
- `activity/activity.controller.ts` — **add** a read route for a member's activity range.
- `activity/activity.service.ts` — resolve `memberId` from `userId`, reuse `getRange`.
- Authorization: reuse the same guard/role setup that already protects `GET /users/:id`
  in the dashboard (admin/staff/trainer). No new per‑trainer assignment check in v1
  (matches current `GET /users/:id` behavior).

**New endpoints (all read‑only):**

```
GET /api/v1/users/:id/measurements?from=YYYY-MM-DD&to=YYYY-MM-DD   -> Measurement[]
GET /api/v1/users/:id/measurements/summary                         -> MeasurementSummary
GET /api/v1/users/:id/activity/daily/range?from=...&to=...          -> DailyActivity[]
```

`:id` is the **user id** (same param as the profile route); the service maps it to the
member profile / `memberId`. Returns `404`/empty if the user has no member profile.

> Placement note: nesting under `users/:id/...` keeps these reads beside the existing
> `GET /users/:id` and inherits its dashboard authorization. The member‑scoped self
> endpoints (`GET /measurements`, `GET /activity/daily/range`) stay untouched for mobile.

### Dashboard (`apps/dashboard/src/src/features/dashboard/users/`)

- `components/user-profile-detail.tsx` — add `<TabsTrigger value="progress">Progreso</TabsTrigger>`
  and a `<TabsContent value="progress">` (only when the user has the `MEMBER` profile).
- `components/progress/` (new folder):
    - `MemberProgressTab.tsx` — orchestrates the two sections for a given `userId`.
    - `MeasurementsSection.tsx` — metric selector + period selector + recharts line chart.
    - `MeasurementComparisonCard.tsx` — first vs latest with deltas (good/bad coloring).
    - `MeasurementHistory.tsx` — table/list of measurements, newest first, expandable.
    - `ActivitySection.tsx` — period selector + recharts bar chart + totals row.
    - `constants.ts` — METRICS, PERIODS, date‑range + formatting helpers (ported from
      `apps/mobile/components/measurements/constants.ts`, adapted to web).
- `hooks.ts` — add `useMemberMeasurements(userId, range)`,
  `useMemberMeasurementSummary(userId)`, `useMemberActivity(userId, range)`.
- `types.ts` — add `Measurement`, `MeasurementSummary`, `MeasurementVariation`,
  `DailyActivity` (mirroring `apps/mobile/lib/api/types/`).

## Data Shapes (from mobile, reused verbatim)

```ts
Measurement = {
  id: string; memberId: string; measuredAt: string;        // 'YYYY-MM-DD'
  weightKg: number | null; heightCm: number | null;
  bodyFatPercentage: number | null; waistCm: number | null;
  notes: string | null; createdAt: string;
}
MeasurementSummary = { first: Measurement | null; latest: Measurement | null;
  variations: MeasurementVariation; totalRecords: number }
DailyActivity = { id; memberId; date: 'YYYY-MM-DD'; steps: number;
  caloriesTotal: string; activeMinutes: number; exerciseCount: number;
  distanceMeters: string; source: 'HEALTH_CONNECT' | 'MANUAL'; createdAt; updatedAt }
```

Metrics: `weightKg`, `heightCm`, `bodyFatPercentage`, `waistCm`.
Periods: `3m`, `6m`, `1y`, `all` (measurements); `week`, `month`, `3months` (activity).

## Code Style

Match the existing dashboard feature code. Example tab wiring already in
`user-profile-detail.tsx`:

```tsx
<TabsList variant="line" className="mb-4">
  <TabsTrigger value="general">General</TabsTrigger>
  {showMembershipTab && <TabsTrigger value="membership">Membresía</TabsTrigger>}
  {isMember && <TabsTrigger value="progress">Progreso</TabsTrigger>}
</TabsList>
...
{isMember && (
  <TabsContent value="progress">
    <MemberProgressTab userId={user.id} />
  </TabsContent>
)}
```

Query hooks follow the existing `userKeys` / `useUser` pattern in `hooks.ts`:

```ts
export const memberProgressKeys = {
    measurements: (id: string, range: Range) => ['members', id, 'measurements', range] as const,
    summary: (id: string) => ['members', id, 'measurements', 'summary'] as const,
    activity: (id: string, range: Range) => ['members', id, 'activity', range] as const,
};
```

- Spanish UI strings (matches dashboard).
- Currency/number/date formatting consistent with existing dashboard utilities.
- No new top‑level dependencies.

## Testing Strategy

- **Backend:** unit test the new service methods (userId → memberId resolution, date‑range
  passthrough, empty/no‑member‑profile case) following existing `*.service.spec.ts` patterns
  if present; otherwise a focused manual `curl` check against a seeded member.
- **Dashboard:** primary verification is `pnpm --filter dashboard build` (typecheck passes)
  plus manual smoke: open a member with data → chart/comparison/history render; open a
  member without data → empty states; switch metric and period; activity totals match range.
- No new e2e harness introduced in this task.

## Boundaries

- **Always:** keep mobile self‑scoped endpoints untouched; reuse existing dashboard authz;
  Spanish UI; typecheck/build before considering a task done.
- **Ask first:** any schema/DDL change; adding a dependency; changing existing endpoint
  signatures used by mobile; granting write access from the dashboard.
- **Never:** expose another member's data without the existing dashboard guard; commit
  secrets; remove or weaken the mobile `@CurrentUser()` scoping.

## Success Criteria

1. New "Progreso" tab appears only for users with a `MEMBER` profile.
2. Measurements section renders a recharts line chart with working metric + period selectors,
   a first‑vs‑latest comparison card with correct deltas, and a history list.
3. Activity section renders period‑based bar charts (steps/calories/active minutes/exercises)
   with a totals row.
4. Trainer/staff/admin can view **any** opened member's data; mobile users still only see
   their own (existing endpoints unchanged).
5. Graceful empty states when a member has no measurements and/or no activity.
6. `pnpm --filter dashboard build` and `pnpm --filter restapi build` both pass.

## Open Questions

- None blocking. (Per‑trainer "assigned members only" restriction is explicitly out of scope
  for v1 and can be layered on later if the product requires it.)
