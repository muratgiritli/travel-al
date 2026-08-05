# Turkey Travel Assistant

A premium AI chat assistant for Turkey travel planning. Users select their passport country inside the chat, then get personalized travel guidance for Turkey.

## Run & Operate

- `pnpm --filter @workspace/turkey-travel run dev` — run the frontend (port auto-assigned)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `MAX_HISTORY_MESSAGES` (default `20`) — number of past chat messages sent to OpenAI per request; lower to reduce API costs, raise for more context

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, TanStack Query, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/turkey-travel/src/` — React frontend
- `artifacts/api-server/src/routes/` — API routes (countries, chat)
- `lib/db/src/schema/` — DB schema (chatSessions, chatMessages)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)

## Architecture decisions

- Passport country selection lives inline in the chat (not a modal), matching the design mockup
- Backend generates contextual travel responses; swap `generateTravelResponse()` in `chat.ts` for a real LLM call
- Countries list served from the API to allow future filtering/customization
- Chat sessions persisted in PostgreSQL; messages stored per session

## Product

- Phase 1: Passport country selection + chat interface opening screen
- Phase 2 (future): Real AI responses, visa requirement lookups, booking integrations

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
