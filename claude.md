# diablo / diablo.slvsansend.com

Companion quiz app to the slvsansend project. First content pack is Diablo 2
Resurrected; the engine is topic-agnostic so future packs (harry-potter, lotr)
drop in as JSON.

## Stack
- Frontend: React 19 + Vite 7 + TypeScript + Tailwind CSS 4, React Router 7, Zustand
- Backend: Node.js 22 / arm64 Lambda + API Gateway HTTP API + S3 JSON score store
- Hosting: S3 + CloudFront at `diablo.slvsansend.com` (same pattern as parent slvsansend)
- AWS profile: `kgdevops`, region `us-east-1`

## Local dev
```bash
cd frontend && npm install && npm run dev
```
Mock mode (`VITE_USE_MOCK_DATA=true`) stores scores in localStorage, so no AWS
needed for local iteration. Seed leaderboard entries are added on first load.

## Deploy
See `infrastructure/README.md` for one-time AWS console setup. After that,
deploys are two shell commands (sync to S3, invalidate CloudFront) documented there.

## Content
- Each quiz is 10 questions, ramping difficulty 1 -> 5.
- Questions live in `frontend/src/content/<topic>/quiz-NN.json`.
- Each question carries a `source` URL back to its wiki page (grounding).
- To add a topic: create `content/<topic>/quiz-01.json` + `index.ts`, register a
  route if needed.

## Conventions
- No em dashes in user-facing copy (parent project convention).
- Quiz IDs are kebab-case, e.g. `diablo2-01`, `harrypotter-01`.
- Username max 20 chars, `[A-Za-z0-9_-]`. Stored in localStorage.
- The scoreboard is sorted by score DESC, then durationMs ASC (tiebreaker by speed).
