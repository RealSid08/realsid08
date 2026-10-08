import type { EducationInfo, ExperienceItem, ProfileInfo, ProjectItem, SkillCluster } from './types.js';

export const PROFILE: ProfileInfo = {
  givenName: 'SIDHAARTH',
  familyName: 'KRISHNAN',
  title: 'Software Engineer',
  tagline:
    'Software engineer in Melbourne. When I run into a real-world problem, or a company brings me one, I build the software that solves it.',
  location: 'Melbourne, VIC',
  availability: 'Available for full-time graduate employment from December 2026',
  manifesto:
    'He owns the whole job: understanding the problem, designing the system and shipping something people rely on. He uses coding agents heavily to move faster and holds their work to the same standard as his own: tested, run for real and read line by line before it ships.',
  phone: '+61 475 508 390',
  email: 'krishnansidhaarth@gmail.com',
  linkedin: 'https://www.linkedin.com/in/sidhaarth-krishnan',
  github: 'https://github.com/RealSid08',
  website: 'https://realsid08.me',
  resumeUrl: '/Sidhaarth_Krishnan_Resume.pdf',
};

export const EDUCATION: EducationInfo = {
  school: 'Swinburne University of Technology',
  campus: 'Hawthorn, VIC',
  degree: 'Bachelor of Engineering (Honours), majoring in Software',
  graduating: 'Dec 2026',
  distinctions: [
    { unit: 'Concurrent Programming', mark: 98 },
    { unit: 'Data Structures and Patterns', mark: 86 },
    { unit: 'Intro to AI', mark: 83 },
    { unit: 'AI Engineering', mark: 82 },
  ],
};

export const SKILLS: SkillCluster[] = [
  {
    id: 'languages',
    label: 'Languages',
    items: ['TypeScript', 'JavaScript', 'Python', 'Swift', 'SQL', 'C++'],
  },
  {
    id: 'frontend',
    label: 'Web & Mobile',
    items: ['React', 'TanStack Start', 'Next.js', 'React Native / Expo', 'SwiftUI', 'MapKit'],
  },
  {
    id: 'backend',
    label: 'Backend & Data',
    items: ['Convex', 'Node.js', 'PostgreSQL', 'Supabase', 'SQLite'],
  },
  {
    id: 'agentic',
    label: 'AI & Coding Agents',
    items: [
      'Gemini and OpenAI APIs',
      'Tool calling',
      'RAG',
      'Embeddings and vector search',
      'MCP',
      'Codex',
      'Claude Code',
      'Cursor',
      'OpenCode',
      'T3 Code',
    ],
    emphasis: true,
  },
  {
    id: 'cloud',
    label: 'Cloud',
    items: ['AWS (EC2, RDS, S3, ALB)', 'Cloudflare (Pages, Workers)', 'OpenTofu', 'Docker'],
  },
  {
    id: 'testing',
    label: 'Testing & CI',
    items: ['Playwright and Maestro (E2E)', 'Vitest', 'XCTest', 'GitHub Actions'],
  },
];

export const EXPERIENCES: ExperienceItem[] = [
  {
    id: 'kenspire',
    role: 'Software Engineer',
    company: 'Kenspire Advisors',
    period: 'Apr 2026 – Present',
    location: 'Remote',
    employmentType: 'Contract',
    lane: 'active',
    description: [
      'Own the architecture and delivery of a multi-tenant platform that turns clients’ goals and operating procedures into scheduled work, ahead of a planned rollout to 500 organisations.',
      'Built the web (TanStack Start) and mobile (Expo) apps on a Convex backend: maker, checker and reviewer approvals, recurring schedules, timesheets, goal tracking, analytics, passkey sign-in and iOS Live Activities.',
      'Built an agent harness that lets Gemini edit procedure drafts through tool calls, with Google Search grounding.',
      'Replaced 62 aggregates behind 118 of 167 GB of billed I/O with exact counters, which showed zero drift in production. Separately cut daily scheduling reads from 57.8 to 36.3 MB per run, a 37% reduction.',
    ],
    tech: ['TanStack Start', 'Expo', 'Convex', 'Gemini API'],
  },
  {
    id: 'besmak',
    role: 'Software Engineer',
    company: 'Besmak Components',
    period: 'Jul 2026 – Present',
    location: 'Remote',
    employmentType: 'Contract',
    lane: 'active',
    description: [
      'Lead development of a web and mobile task platform being rolled out to about 600 staff across departments, with end-to-end tests for both apps.',
      'Built recurring tasks with subtasks as a resumable background workflow: checkpoints, duplicate-safe retries and daylight-saving-correct dates, tested at 600 subtasks and 600 users within Convex transaction limits.',
      'Provisioned and maintain the AWS backend with OpenTofu: Convex on EC2 with Multi-AZ PostgreSQL, encrypted S3, TLS and backups. Tested a 40-second database failover.',
    ],
    tech: ['TanStack Start', 'React Native', 'Expo', 'Convex', 'AWS', 'OpenTofu'],
  },
  {
    id: 'complete-leader',
    role: 'Software Engineer',
    company: 'Complete Leader',
    period: 'Dec 2025 – Present',
    location: 'Melbourne, VIC',
    employmentType: 'Casual',
    lane: 'active',
    description: [
      'Built the psychometric assessment platform in Next.js and Supabase, replacing paper questionnaires and hand-written reports with online assessments, scoring and streamed AI-generated reports.',
      'Built the staff dashboard for inviting clients, reviewing results and exporting assessment data.',
    ],
    tech: ['Next.js', 'Supabase', 'AI reports', 'Psychometrics'],
  },
  {
    id: 'mindtek',
    role: 'Software Engineer',
    company: 'Mindtek AI',
    period: 'May 2025 – Oct 2025',
    location: 'Melbourne, VIC',
    lane: 'active',
    description: [
      'Built a multi-tenant Next.js and Supabase platform where businesses create OpenAI and Gemini chatbots grounded in their own documents, embed them on their websites and review conversations, leads and analytics.',
      'Built a voice agent on the Gemini Live API that answers spoken enquiries and takes booking requests through tool calls, recovering from model and tool failures.',
    ],
    tech: ['Next.js', 'Supabase', 'OpenAI', 'Gemini Live', 'RAG'],
  },
  {
    id: 'unieats',
    role: 'Startup Contributor',
    company: 'UniEats',
    period: 'Mar 2024 – Apr 2025',
    lane: 'archive',
    description: [
      'Contributed to promotion, logistics, product ideas and platform improvements at an early-stage startup.',
      'Made marketing videos in Final Cut and Premiere Pro and pitched partnerships to local restaurants.',
    ],
    tech: ['Marketing', 'Video Editing', 'Operations', 'Logistics'],
  },
  {
    id: 'idhayam',
    role: 'Market Researcher',
    company: 'Idhayam',
    period: 'Oct 2024 – Dec 2024',
    lane: 'archive',
    description: [
      'Researched the Australian edible-oil market across Melbourne and Sydney.',
      'Studied consumer preferences and distribution challenges through store visits and interviews.',
    ],
    tech: ['Data Analysis', 'Market Research', 'Strategy'],
  },
  {
    id: 'hida',
    role: 'Founder',
    company: 'HiDa',
    period: 'Aug 2020 – May 2021',
    lane: 'archive',
    description: [
      'Built a real-time video conferencing app on the Enablex and Quickblox APIs, with peer-to-peer streaming, dynamic room creation, screen sharing and synchronised chat.',
      'Tuned connection stability and bandwidth use for multi-participant calls.',
    ],
    tech: ['React', 'WebRTC', 'Enablex', 'Quickblox', 'Node.js'],
  },
  {
    id: 'imaginet',
    role: 'Intern',
    company: 'Imaginet Ventures Pvt. Ltd.',
    period: 'Jun 2016 – Jul 2017',
    lane: 'archive',
    description: [
      'Worked with Python, PHP and MySQL, and learned database design.',
      'Picked up the basics of SaaS development in a B2B setting.',
    ],
    tech: ['Python', 'PHP', 'MySQL', 'SaaS'],
  },
];

export const PROJECTS: ProjectItem[] = [
  {
    id: 'foodly',
    title: 'Foodly',
    subtitle: 'Social-to-Place Restaurant Discovery',
    period: 'Final-Year Honours Project, Mar 2026 – Present',
    description:
      'Wrote the backend and rebuilt the iOS and Android app for a team product that turns Instagram and TikTok restaurant posts into saved places on a personal map.',
    bullets: [
      'Wrote the backend and rebuilt the iOS and Android app for a team product that turns Instagram and TikTok restaurant posts into saved places on a personal map.',
      'Redesigned the React Native app around a map-first Explore tab with photo pins, a reel feed that plays Instagram and TikTok videos in the app, and photo-led place and collection pages. Cut the uncached map query from about 9 seconds to 1.1 by keeping per-place totals in one row.',
      'Built the AI pipeline: Apify fetches the post, Gemini with Maps grounding identifies the restaurant, and Google Places verifies it. Caching, retries and idempotent webhooks make reruns safe, and embeddings power search.',
    ],
    tech: ['iOS', 'Android', 'React Native', 'Convex', 'Apify', 'Gemini', 'Google Places'],
    type: 'visualization',
    featured: true,
    link: 'https://foodly-app-mauve.vercel.app',
  },
  {
    id: 'parkalong',
    title: 'ParkAlong',
    subtitle: 'Native iOS Parking Finder',
    period: 'Aug 2026 – Present',
    description:
      'A SwiftUI and MapKit app that answers is there parking, how long can I stay and what will it cost, on one map for Victoria.',
    bullets: [
      'Finding parking in Melbourne means checking a council sensor map, the street sign, a payment app and car park websites. ParkAlong answers the three questions in one map: is there parking, how long can I stay, and what will it cost.',
      'Combines live City of Melbourne bay sensors with 38,610 public parking records across Victoria. Choosing a stay length filters to spots that allow it. It never invents a price, and forecasts appear only when they pass held-out accuracy gates.',
      'Made the first statewide catalogue load 43 times faster (23.3 to 0.53 seconds): the decoder was building new date formatters for every record. Then added a spatial index for map queries. 230+ Swift unit and UI tests and 72 data-pipeline tests run in CI.',
    ],
    tech: ['Swift', 'SwiftUI', 'MapKit', 'XCTest', 'GitHub Actions'],
    type: 'visualization',
    featured: true,
    githubUrl: 'https://github.com/OpenRenderKit/ParkAlong',
  },
  {
    id: 'switchyard',
    title: 'Switchyard',
    subtitle: 'Open-source Rust gateway for coding agents',
    period: '2026',
    description:
      'A local gateway that puts every coding agent and provider account behind one endpoint, with failover on rate limits and a control room for usage.',
    bullets: [
      'Developers who use Codex, Claude Code and OpenCode also juggle their accounts: each tool is wired to one provider, a rate limit ends the session, and nothing shows usage across all of them.',
      'Switchyard runs on your own machine. Every client points at one endpoint; it speaks each provider’s native API (OpenAI Responses and Chat Completions, Anthropic Messages, Gemini), keeps Responses WebSockets open, and moves the next request to another account when one hits its limit, following Retry-After.',
      'Ships as one Rust binary with the control room embedded, for macOS, Linux and Windows. Loopback by default, hashed client keys, metadata-only history: prompts are never stored.',
      'Started from a public request by a T3 Code developer for this in Rust, with a real UI and WebSockets.',
    ],
    tech: ['Rust', 'TypeScript', 'SSE', 'WebSockets', 'SQLite'],
    type: 'open-source',
    githubUrl: 'https://github.com/RealSid08/switchyard',
  },
  {
    id: 'servogrid',
    title: 'ServoGrid',
    subtitle: 'Native iOS fuel prices you can trust',
    period: '2026',
    description:
      'A map-first iPhone app for Australian fuel prices where every price shows how fresh and how trustworthy it is.',
    bullets: [
      'Fuel apps show every price as if it were current, even when it is hours old or from a feed that stopped updating.',
      'Every price carries its status: live, scheduled, delayed, cached or unavailable. Freshness comes from the provider’s own timestamps, so a recent network check cannot make an old price look new, and thin evidence says “insufficient data” instead of inventing a trend.',
      'Live WA FuelWatch data including tomorrow’s prices; NSW and Tasmania adapters ready for credentials stored in Keychain; states without reusable data are shown as unavailable and never scraped. No account, analytics or server.',
      '34 automated tests (27 unit, 7 UI journeys) and a run on a physical iPhone 17 Pro.',
    ],
    tech: ['Swift', 'SwiftUI', 'MapKit', 'Keychain', 'VoiceOver', 'XCTest'],
    type: 'open-source',
    githubUrl: 'https://github.com/RealSid08/ServoGrid',
  },
  {
    id: 'llm-cooperation',
    title: 'Do coding agents cooperate?',
    subtitle: 'Research pilot on agents in the prisoner’s dilemma',
    period: 'Oct 2026',
    description:
      'A pilot study of how Claude Code, Codex and OpenCode agents play the noisy repeated prisoner’s dilemma.',
    bullets: [
      'Each round two players cooperate or betray. Agents played ten-round games against scripted opponents (always betrays, a copycat, win-stay, random) and themselves, with 5% of moves flipped at random. Every move is a fresh, stateless harness call with tools and instruction files disabled.',
      'Both Claude Code and Codex cooperate fully with anyone who cooperates back. They split after a betrayal: Claude Code cooperates again 70% of the time, Codex 9% (it plays like a grudge-holder).',
      'Forgiving has a cost: against a random player Claude Code averaged 2.03 points a round, Codex 2.33.',
      'A pilot: 3 games per cell for Claude Code and Codex; five OpenCode models have partial data after the subscription hit its usage limit.',
    ],
    tech: ['Python', 'uv', 'pytest', 'Claude Code', 'Codex', 'OpenCode'],
    type: 'open-source',
    githubUrl: 'https://github.com/RealSid08/llm-cooperation-pilot',
  },
  {
    id: 't3-wall',
    title: 't3-wall',
    subtitle: 'Ambient dashboard',
    description: 'A read-only portrait kiosk for T3 Code showing running agents, subscription limits and usage across machines.',
    tech: ['TypeScript', 'Go', 'T3 Code'],
    type: 'open-source',
    githubUrl: 'https://github.com/RealSid08/t3-wall',
  },
  {
    id: 'hs-heist',
    title: 'HS: Heist',
    subtitle: 'WebMCP game',
    description: 'A first-person heist game where a WebMCP agent plays your partner through ten tools and remembers its failures.',
    tech: ['WebMCP', 'TypeScript'],
    type: 'open-source',
    githubUrl: 'https://github.com/RealSid08/openai-webmcp-challenge',
  },
  {
    id: 'cursor-subagents',
    title: 'Cursor Subagents',
    subtitle: 'Codex plugin',
    description: 'One skill that lets Codex hand a bounded task to Cursor CLI, then review and verify the diff.',
    tech: ['Python', 'Codex', 'Cursor CLI', 'Agent skills'],
    type: 'open-source',
    githubUrl: 'https://github.com/RealSid08/cursor-subagents',
  },
  {
    id: 'tbrgs',
    title: 'Traffic-Based Route Guidance',
    description:
      'A traffic forecasting pipeline: LSTM and GRU models trained on historical SCATS sensor data, feeding an optimised A* route search.',
    tech: ['Python', 'TensorFlow', 'LSTM/GRU', 'Graph Theory', 'Tkinter'],
    type: 'visualization',
    githubUrl: 'https://github.com/RealSid08/IntroToAISquad/tree/2B',
  },
  {
    id: 'rag-viz',
    title: 'RAG Engine',
    description:
      'An interactive walkthrough of retrieval-augmented generation: a question is embedded, matched against knowledge-base chunks, and answered by an LLM using what was retrieved.',
    tech: ['React', 'Vercel AI SDK', 'Vector Embeddings', 'Supabase pgvector'],
    type: 'visualization',
  },
  {
    id: 'aura',
    title: 'Aura Ecosystem (AI & IoT)',
    description:
      'A voice and IoT project pairing OpenAI Realtime over WebRTC with ESP32 tactile stress sensors and WebSockets.',
    tech: ['React', 'OpenAI Realtime', 'WebRTC', 'ESP32', 'Python'],
    type: 'live-demo',
    githubUrl: 'https://github.com/RealSid08/AuraHub',
  },
  {
    id: 'codex-shared-memory',
    title: 'Codex Shared Memory',
    subtitle: 'MCP memory server',
    description:
      'A self-hosted Python and SQLite MCP server that shares AI agent memory snapshots across machines over SSH, with an offline cache.',
    tech: ['Python', 'SQLite', 'MCP', 'Tailscale', 'Raspberry Pi'],
    type: 'open-source',
    githubUrl: 'https://github.com/RealSid08/codex-shared-memory',
  },
  {
    id: 'pptx-react-renderer',
    title: 'pptx-react-renderer',
    subtitle: 'npm package',
    description:
      'An npm package that renders PowerPoint files as HTML, with pixel-diff regression tests.',
    tech: ['npm', 'React', 'PPTX', 'Pixel-diff tests'],
    type: 'open-source',
    githubUrl: 'https://github.com/OpenRenderKit/pptx-react-renderer',
    link: 'https://www.npmjs.com/package/pptx-react-renderer',
  },
];
