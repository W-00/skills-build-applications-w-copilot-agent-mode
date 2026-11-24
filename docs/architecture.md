# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Implement route components in `octofit-tracker/frontend/src` to fetch relative `/api` endpoints (respecting Vite proxy / `VITE_API_BASE_URL`), manage loading, empty, error, and success states, and render accessible content (`role="status"` for loading, `role="alert"` for failures). Reuse or add a small shared API helper only if it reduces duplication; keep browser calls on `/api/*`.
- Logic tier decision: Implement Express service/route behavior in `octofit-tracker/backend/src` to satisfy the `/api` contract: validate request payloads and ObjectIds, confirm referenced users/teams exist, return deliberate 4xx responses (never cast-error 500s), compute derived fields, and shape responses exactly as expected by contract tests.
- Data tier decision: Define required Mongoose schema constraints/defaults in `octofit-tracker/backend/src/models` for users, teams, activities, and workouts; keep `src/scripts/seed.ts` idempotent and non-destructive to unrelated data while ensuring representative fixtures for all four capabilities.
- Activity tracking approach: `POST /api/activities` accepts `userId`, `teamId`, `type`, and `minutes`; reject malformed IDs, missing/invalid input, or unknown user/team with 4xx. On success, persist `user`, `team`, `type`, `minutes`, computed `points`, and `occurredAt`, and return/list the stored activity.
- Team management approach: `POST /api/teams` requires `name` (400 when missing) and stores `name`, `mascot`, and `members` (default/array-safe). `GET /api/teams` returns teams with submitted identity and member references as expected by the contract.
- Leaderboard approach: `GET /api/leaderboard` aggregates total activity points per team from persisted activities and returns entries with `teamName`, `totalPoints`, and 1-based `rank`, ordered highest points first.
- Workout suggestions approach: `GET /api/workouts/suggestions/:userEmail` resolves the seeded user by email, selects suggestions from workout data based on the user's fitness goal and/or recent activity patterns, and returns the first suggestion with matching `focus` and an explanatory `reason`; return a deliberate 4xx (e.g. 404) for unknown emails.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Meaning: validates Mongoose schema requirements/defaults and seed behavior (`tests/data.contract.test.ts`).
  - Current baseline: **4 failed / 1 passed** — missing required validation for `User` (`name/email/fitnessGoal`), `Team` (`name/mascot`), `Activity` (`type/user/team/minutes/points/occurredAt`), and `Workout` (`focus/minutes/difficulty`); seed idempotency/representative-data test passes.
  - Pass criteria: schema validation errors are enforced as required and seed remains idempotent/non-destructive.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Meaning: validates `/api/*` contract behavior, validation/error handling, response shapes, aggregation, and suggestion logic (`tests/api.contract.test.ts`).
  - Current baseline: **4 failed** — invalid/missing/malformed activity/team requests return `501` instead of deliberate 4xx, valid create/list flows incomplete, leaderboard returns empty instead of ranked totals, and workout suggestions return incorrect focus/reason with no 4xx for unknown user.
  - Pass criteria: all activity/team/leaderboard/workout endpoints satisfy status codes, payloads, computed fields, ranking, and suggestion matching rules.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Meaning: validates presentation contract for each route (data rendering, loading/empty/error states, accessibility, and workouts request target) (`tests/app.contract.test.tsx`).
  - Current baseline: **15 failed** — placeholder "Implementation pending" UI with no fetch/state handling, no rendered contract data, no loading/empty/alert states, and no request to `/api/workouts/suggestions/mona@example.com`.
  - Pass criteria: each capability view fetches its `/api` data, announces loading, renders expected content/empty states, and surfaces failures via accessible alerts.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Meaning: TypeScript compilation/build health for backend changes; run after backend contract fixes to catch type or import issues introduced by implementation.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Meaning: Vite/TypeScript production build health for frontend changes; run after frontend contract fixes to catch bundling/type issues introduced by implementation.
