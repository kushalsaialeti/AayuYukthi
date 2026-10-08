# AayuYukthi

Healthcare support and care-coordination platform (modular monolith).

**Phase 0 — Project Foundation** is implemented in this tree:

- `server/` — Express API (`/api/v1`), request IDs, structured logging, centralized errors, pagination utils, `pg` pool, migration runner
- `apps/web/` — Public + customer React app (CMS-driven pages land in Phase 4)
- `apps/operations/` — CMS/Operations React shell (full CMS lands in Phase 3)
- `packages/ui/tokens.css` — Brand design tokens (teal `#0F766E`, Inter + Noto Sans Telugu)
- `migrations/` — SQL migrations, applied in order via `npm run migrate --workspace=server`
- `docs/` — Architecture, environment, API, database notes

## Quickstart (Phase 0)

1. Copy env: `cp .env.example .env` and `cp server/.env.example server/.env`, edit `DATABASE_URL` + `JWT_SECRET`.
2. Start Postgres 16 locally and create DB `aayuyukthi_dev`.
3. `npm install`
4. `npm run migrate --workspace=server`
5. `npm run dev --workspace=server` (http://localhost:4000/api/v1/health)
6. `npm run dev --workspace=apps/web` (http://localhost:5173)

## repo scripts

- `npm test --workspaces --if-present`
- `npm run lint` / `npm run format:check`
- `npm run build --workspaces --if-present`
