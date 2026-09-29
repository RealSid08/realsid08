# Sidhaarth Krishnan

Full-stack software engineer in Melbourne. Final-year Software Engineering student at Swinburne. Available for full-time graduate roles from December 2026.

I ship production web, mobile, and AI-enabled products. I treat AI as an engineering system: decompose work across parallel agents, isolate changes in Git worktrees, and validate outputs through human review, automated tests, and real app interaction.

**[realsid08.me](https://realsid08.me)** · [LinkedIn](https://www.linkedin.com/in/sidhaarth-krishnan-75b5971a7/) · [Email](mailto:krishnansidhaarth@gmail.com)

## Now

- **Besmak Components** — freelance contract. Web + React Native operations platform for 600 users. Self-hosted Convex on AWS.
- **Complete Leader** — casual. Turning in-person psychometric testing into a Next.js / Supabase client platform.
- **Kenspire Advisors** — freelance contract. TanStack Start + Convex, access control, migrations, CI/CD, aimed at a 500-org rollout.

## Building

- **[Foodly](https://realsid08.me/#projects)** — final-year project. Instagram / TikTok links become mapped restaurant places.
- **[ParkAlong](https://github.com/OpenRenderKit/ParkAlong)** — Victorian parking finder with live City of Melbourne occupancy and 34k integrity-manifested records.

## Stack I actually use

TypeScript, JavaScript, Python, SQL, Swift, C++, Go. React, React Native, Expo, Next.js, TanStack Start, Convex, PostgreSQL, Supabase. AWS, Playwright, Vitest, GitHub Actions.

This repository is the source for the portfolio site.

## License

The website source code is available under the [MIT License](LICENSE). The résumé, personal portfolio copy, and project screenshots in `public/` are not licensed for reuse under MIT.

## Development

Use Node 24 and `npm ci`, then `npm run dev`. Pull requests and pushes to `main` run the build and agent checks in GitHub Actions. CI does not need production secrets; Cloudflare Builds handles deployment from `main`.

## Deploy

Cloudflare Workers serves the Vite build and the `/api/chat`, `/api/transcribe`, and `/api/github` routes. Pushing to `main` triggers Cloudflare Builds (`npm run build`, then `npx wrangler deploy`). Run `npm run deploy` for a manual deployment after configuring Wrangler access.

Set `OPENAI_API_KEY` and `GITHUB_TOKEN` as Worker secrets with `npx wrangler secret put <NAME>`. The OpenAI key is used by the server routes. The GitHub token is used only for public repository lookups, avoiding GitHub's low unauthenticated rate limit. Use a classic GitHub token with no scopes so both personal and organization public repositories are accessible without granting repository permissions.

Text chat uses `gpt-6-luna` with portfolio lookups and page actions. The mic button records a short message, uses `gpt-transcribe` through the Worker, and places the transcript in the chat box for review before sending. WebMCP registers the browser tools for external agents. GitHub lookups cover public, non-fork, non-archived repositories in `RealSid08` and `OpenRenderKit` only. The agent can list repos, browse directories, read text files (up to 20,000 characters), list or inspect issues, and list or inspect pull requests and their first changed files. Results include fetch times and source links. All GitHub tools are read-only.

Beyond those two accounts, the agent can find and link things it does not already hold. `searchGitHub` finds Sidhaarth's public pull requests and issues on any repository (search qualifiers in the query are stripped, so scope stays fixed to `author:RealSid08 is:public`) and searches code inside `RealSid08` and `OpenRenderKit`. GitHub's code search API requires authentication, so code search reports itself unavailable when `GITHUB_TOKEN` is not set. OpenAI's provider-executed `web_search` tool covers the wider web; the prompt tells the agent to link only URLs a search returned.

Chat replies stream through the AI SDK's `smoothStream`. The client renders Markdown with `react-markdown` and `remark-gfm`. Links follow T3 Code's chat: `#project-foodly` style references outline the card on hover and scroll to it on click, GitHub, LinkedIn, mail and PDF links get their own marks, and other sites get a favicon. Beneath the prose the assistant can stream read-only cards through `@json-render/core` and `@json-render/react` (work card, metrics, compare table, timeline, repository list, page button, and the evidence board); the catalog and its short prompt live in `lib/portfolioUiCatalog.ts`, and the cards wire themselves to the page.

The prompt bar sits centred at the bottom in three states (closed, compact, open). It collapses when you scroll, closes with Esc or the close button, and shows a slow moving glow while idle. Typing `/` opens a keyboard-first command menu (arrows, Tab, Enter, Esc) for going to a section, `/filter convex`, `/tour`, `/theme`, `/reset`, and canned questions; `services/agent/commands.ts` defines them on top of the same tool registry the assistant and WebMCP use, so every page change shows up in the action toast with Undo and Reset.
