# Known Bugs & Issues

> Confirmed issues from secondary audit — 2026-05-23

## Backend — `backend/src/index.ts`

| # | Line | Issue | Severity |
|---|---|---|---|
| 1 | 15 | `cors: { origin: '*' }` — wildcard allows any origin | High |
| 2 | 7 | `pg` imported and Pool initialized but never used | Medium |
| 3 | 40-56 | `draw_stroke` handler broadcasts but never saves to DB | High |
| 4 | 58-61 | `clear_board` handler broadcasts but never clears DB records | Medium |
| 5 | — | No input validation on any socket event payload | High |
| 6 | — | No reconnect logic or error event handlers | Medium |
| 7 | — | No stroke history sent to users who `join_board` | High |

## Frontend — `CanvasOverlay.tsx`

| # | Line | Issue | Severity |
|---|---|---|---|
| 8 | 64 | `setTrackingConfidence('high')` fires on socket connect — wrong, should come from MediaPipe | Medium |
| 9 | ~178 | `handleMouseMove` emits `draw_stroke` on EVERY mouse event — no throttle | High |
| 10 | 29-36 | Board ID from `Math.random().toString(36)` — low entropy, collision risk | Medium |
| 11 | — | Remote strokes in `remoteActiveStrokes` never time out if remote user pauses | Medium |
| 12 | — | No reconnect event listener — UI stays stale if socket reconnects | Low |

## Frontend — `Toolbar.tsx`

| # | Line | Issue | Severity |
|---|---|---|---|
| 13 | ~97 | `hover:scale-115` class doesn't exist in Tailwind (valid: scale-110, scale-125) | Low |
| 14 | — | Keyboard shortcut hints in tooltips (V, P, E, T, C) but no `keydown` listeners | Medium |
| 15 | — | No brush width slider despite `brushWidth` in canvasStore | Low |

## Frontend — `package.json`

| # | Issue | Severity |
|---|---|---|
| 16 | `@mediapipe/hands` NOT in dependencies — core feature can't work | Critical |
| 17 | `@splinetool/react-spline` + `@splinetool/runtime` installed but never used | Low |
| 18 | `dompurify` installed but never called in any component | Low |

## Frontend — `socket.ts`

| # | Issue | Severity |
|---|---|---|
| 19 | Hardcoded fallback `'http://localhost:4000'` — will silently use wrong URL in prod | Medium |
| 20 | No error event handlers on socket client | Medium |

## General

| # | Issue | Severity |
|---|---|---|
| 21 | No `.env` files anywhere — `DATABASE_URL`, `JWT_SECRET` never defined | Critical |
| 22 | Zero git commits — all work is uncommitted | High |
| 23 | `frontend/dist/` exists but is empty (not built) | Low |
| 24 | `canvasStore.ts`: initial `brushWidth: 6` not user-configurable via UI | Low |
| 25 | NavBar "Sign In" button has no `onClick` handler | Low |
