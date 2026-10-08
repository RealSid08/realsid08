# Sidhaarth Krishnan

Software engineer in Melbourne. When a company or my own day has a problem, I build software that solves it.

**[realsid08.me](https://realsid08.me)** · [GitHub](https://github.com/RealSid08) · [LinkedIn](https://www.linkedin.com/in/sidhaarth-krishnan) · [Email](mailto:krishnansidhaarth@gmail.com)

## Now

- **Kenspire Advisors**, contract. A multi-tenant platform that turns clients' goals and procedures into scheduled work, on TanStack Start, Expo and Convex. Planned rollout to 500 organisations.
- **Besmak Components**, contract. A web and mobile task platform for about 600 staff, with Convex self-hosted on AWS and provisioned with OpenTofu.
- **Complete Leader**, casual. Psychometric assessments, scoring and AI-generated reports in Next.js and Supabase.

## Building

- **[Foodly](https://foodly-app-mauve.vercel.app)**: honours project. Instagram and TikTok food reels become saved places on a personal map.
- **[Switchyard](https://github.com/RealSid08/switchyard)**: an open-source Rust gateway that puts every coding agent and account behind one local endpoint.
- **[ParkAlong](https://github.com/OpenRenderKit/ParkAlong)**: is there parking, how long can I stay, and what will it cost, on one map for Victoria.
- **[ServoGrid](https://github.com/RealSid08/ServoGrid)**: a native iOS fuel map that tells you when a price might be stale.
- **[Do coding agents cooperate?](https://github.com/RealSid08/llm-cooperation-pilot)**: a pilot study of coding agents in the repeated prisoner's dilemma.

## Open source

- **[Codex Shared Memory](https://github.com/RealSid08/codex-shared-memory)**: a self-hosted MCP server that shares agent memory across machines.
- **[pptx-react-renderer](https://github.com/OpenRenderKit/pptx-react-renderer)**: an npm package that renders PowerPoint files as HTML.

This repository is the source for the portfolio site.

## License

The website source code is available under the [MIT License](LICENSE). The résumé, personal portfolio copy, and project screenshots in `public/` are not licensed for reuse under MIT.

## Development

Use Node 24 and `npm ci`, then `npm run dev`. `npm run verify:agent` checks the assistant's wiring, including a real code-mode run. Pull requests and pushes to `main` run the build and those checks in GitHub Actions.

## How the site works

The site is a notebook on a desk (`components/notebook/`). React renders the pages once; `engine.ts` turns them: CSS 3D leaves, riffling to a section, drag to turn, swipe on phones (one tall page at a time), and arrow keys. Every page, role and project has a `data-target` id, listed in `lib/portfolioIds.ts`.

The assistant (`components/agent/`) is an index card on the desk. On wide screens it docks beside the book, which slides over to make room; on phones it opens as a sheet and tucks away when it turns a page. Answers move the notebook: `turn_to` turns to a page and rings its title in pen, `mark_work` ticks every contents entry that uses a technology, and `tour`, `focus`, `set_theme` and `reset_view` do what they say. Every change shows in a note with Undo. Typing `/` opens shortcuts such as `/parkalong` and `/find swift`, built on the same tool registry WebMCP exposes to external agents.

On the server (`lib/portfolioChat.ts`) the model gets two tools up front: `code`, which runs AI SDK code mode, and the direct page tools. Lookups run inside code mode, so the model writes a short program, calls several lookups at once and keeps only what it needs. Only the core lookups (`listWork`, `lookupRole`, `lookupProject`, `findWorkByTech`) load at the start; skills, profile and the GitHub tools load through `toolSearch` when a question needs them. GitHub lookups cover public, non-fork, non-archived repositories in `RealSid08` and `OpenRenderKit` only, and are read-only.

## Deploy

Cloudflare Workers serves the Vite build and the `/api/transcribe` and `/api/github` routes. Pushing to `main` triggers Cloudflare Builds (`npm run build`, then `npx wrangler deploy`).

The chat assistant runs on Vercel instead (project `realsid08`, `https://realsid08.vercel.app`), because code mode needs Node worker threads, which Workers do not have. The Worker forwards `/api/chat` to `AGENT_ORIGIN` in `wrangler.jsonc`. Deploy the assistant with `vercel deploy --prod`; its `OPENAI_API_KEY` is set on the Vercel project.

Set `OPENAI_API_KEY` (for dictation) and `GITHUB_TOKEN` as Worker secrets with `npx wrangler secret put <NAME>`. Use a classic GitHub token with no scopes, which only raises the public rate limit.
