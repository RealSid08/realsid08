# Sidhaarth Krishnan

Interactive portfolio for a full-stack software engineer in Melbourne. Live at [realsid08.vercel.app](https://realsid08.vercel.app).

The page is built as a control plane: current contracts as running worktrees, a skill graph, project exhibits (Foodly, ParkAlong, TBRGS, RAG), and two live AI surfaces at the bottom.

## What’s on the site

- **Workstreams** — Besmak, Complete Leader, Kenspire, plus an archive of earlier roles
- **Skill graph** — languages through agentic engineering, cloud, and delivery
- **Project exhibits** — canvas visualizers for Foodly, ParkAlong, traffic routing, and RAG
- **Voice Hub** — browser WebRTC session against OpenAI Realtime (`gpt-realtime-2.1-mini`)
- **Assistant** — streaming chat with GPT 5.6 Luna via the Vercel AI SDK, with resume lookup tools

## Stack

React, TypeScript, Vite, Three.js, Vercel serverless routes, Vercel AI SDK, OpenAI Realtime + Responses APIs.

## Local

Needs Node 18+.

```bash
npm install
```

Create `.env.local`:

```
OPENAI_API_KEY=sk-...
```

The key stays on the server. Vite exposes `/api/token` (ephemeral Realtime secret) and `/api/chat` (Luna stream). The browser never sees the secret key.

```bash
npm run dev
```

Then open the printed local URL (often `http://localhost:5173`).

```bash
npm run build
npm start
```

Production on Vercel also needs `OPENAI_API_KEY` set in the project environment.

## Layout

```
api/chat.ts      Luna chat stream
api/token.ts     Realtime client secret
components/      page sections + Voice Hub + Beautiful UI chat primitives
lib/             OpenAI Realtime + portfolio chat tools
services/        WebRTC session + local resume fallback
```
