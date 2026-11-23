# Sidhaarth Krishnan

Full-stack and AI software engineer in Melbourne. I work directly with founders and business teams to uncover what is actually broken, obsess over performance and quality, and ship production software people rely on every day.

**[realsid08.me](https://realsid08.me)** · [Blog](https://blog.realsid08.me) · [GitHub](https://github.com/RealSid08) · [LinkedIn](https://www.linkedin.com/in/sidhaarth-krishnan) · [Email](mailto:krishnansidhaarth@gmail.com)

## Now

- **[Stretch](https://getstretch.app)**, founder. Personal food agent planning weekly meals around your budget and taste (490+ devices in six weeks). Won Builders Hack: Unlocked (Lyra x Product Counsel, 90+ teams), October 2026.
- **Kenspire Advisors**, contract. Sole engineer (1,000+ PRs across web, iOS, Android and backend): Kenspire Argo runs client consulting across 20+ companies (90% DB I/O cut), and Kenspire Connect is its team's task and timesheet app on TanStack Start, Expo and Convex.
- **Besmak Components**, contract. Led commercial and technical scoping with IT and plant leadership, closed an annual SaaS licence, and launched a web, iOS and Android task platform to 220+ staff in two weeks, self-hosted in Besmak's Mumbai AWS account via OpenTofu.
- **Complete Leader**, casual. Psychometric assessments and reliable server-side AI summaries across five client teams in Next.js and Supabase.

## Building

- **[Runaway](https://github.com/RealSid08/runaway)**: a Unity battery-fire simulator where a graph neural network forecasts spread and a Codex agent tests each plan before advising a human commander.
- **[Switchyard](https://github.com/RealSid08/switchyard)**: an open-source Rust gateway that puts every coding agent and account behind one local endpoint.
- **[Stack](https://stack.realsid08.me)**: any 56 file types in, one PDF out. No sign-up, no ads.
- **[Foodly](https://foodly-app-mauve.vercel.app)**: final-year capstone for a real client. Instagram and TikTok food reels become saved places on a personal map (9s to 1.1s load).
- **[ParkAlong](https://github.com/OpenRenderKit/ParkAlong)**: is there parking, how long can I stay, and what will it cost, on one map for Victoria.
- **[ServoGrid](https://github.com/RealSid08/ServoGrid)**: a native iOS fuel map that refuses to fake a fresh price.
- **[Do coding agents cooperate?](https://github.com/RealSid08/llm-cooperation-pilot)**: a pilot study of coding agents in the repeated prisoner's dilemma.

## Open source

- **[pptx-react-renderer](https://www.npmjs.com/package/pptx-react-renderer)**: an npm package that renders PowerPoint files as HTML. 1,780+ downloads.
- **[shared-memory-mcp](https://github.com/RealSid08/shared-memory-mcp)**: a self-hosted MCP server that syncs agent memory across machines over SSH.
- **[p3stack](https://github.com/RealSid08/p3stack)**: pstack, ported to T3 Code.
- Co-author on [pluggable agent CLIs](https://github.com/openclaw/openclaw/commit/f31e89d5af) in OpenClaw.

## Writing

- **[blog.realsid08.me](https://blog.realsid08.me)**: field notes from what I build and what I cut, each post readable or listenable in three voices.

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

Other branches automatically get Workers Builds preview uploads with preview URLs (`npm run build`, then `npx wrangler preview`).

The chat assistant runs on Vercel instead (project `realsid08`, `https://realsid08.vercel.app`), because code mode needs Node worker threads, which Workers do not have. The Worker forwards `/api/chat` to `AGENT_ORIGIN` in `wrangler.jsonc`. Deploy the assistant with `vercel deploy --prod`; its `OPENAI_API_KEY` is set on the Vercel project. Branch previews use the next assistant instead: deploy it with `vercel deploy --prod --skip-domain`, then `vercel alias set <deployment-url> realsid08-next.vercel.app`. Previews reach it through Vercel's protection bypass, stored as the `AGENT_BYPASS` secret on the Worker's Preview base config.

Set `OPENAI_API_KEY` (for dictation) and `GITHUB_TOKEN` as Worker secrets with `npx wrangler secret put <NAME>`. Use a classic GitHub token with no scopes, which only raises the public rate limit.
