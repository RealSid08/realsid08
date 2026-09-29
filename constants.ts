import { EducationInfo, ExperienceItem, ProfileInfo, ProjectItem, SkillCluster } from './types';

export const PROFILE: ProfileInfo = {
  givenName: 'SIDHAARTH',
  familyName: 'KRISHNAN',
  title: 'Software Engineer',
  tagline:
    'Software engineer in Melbourne. I build multi-tenant web, mobile and AI products, from Convex backends and AWS infrastructure to native iOS apps.',
  location: 'Melbourne, VIC',
  visa: 'Student visa with work rights',
  availability: 'Available for full-time graduate employment from December 2026',
  manifesto:
    'He splits work across parallel coding agents in isolated Git worktrees, then checks every change with automated tests, real app runs and human review.',
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
      'Wrote the backend and most of the iOS app for a team product that turns Instagram and TikTok restaurant posts into saved places on a personal map.',
    bullets: [
      'Wrote the backend and most of the iOS app for a team product that turns Instagram and TikTok restaurant posts into saved places on a personal map.',
      'Built the AI pipeline: Apify fetches the post, Gemini with Maps grounding identifies the restaurant, and Google Places verifies it. Caching, retries and idempotent webhooks make reruns safe, and embeddings power search.',
    ],
    tech: ['iOS', 'React Native', 'Convex', 'Apify', 'Gemini', 'Google Places'],
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
      'Built a SwiftUI and MapKit app that puts live City of Melbourne bay sensors, time limits, prices and 38,000+ statewide parking records on one map, and labels what is live and what is static.',
    bullets: [
      'Built a SwiftUI and MapKit app that puts live City of Melbourne bay sensors, time limits, prices and 38,000+ statewide parking records on one map, and labels what is live and what is static.',
      'Made catalogue loading 43 times faster (23.3 to 0.53 seconds) by profiling the decoder and reusing date parsing, then added a spatial index for map queries. 160 unit and UI tests run in CI.',
    ],
    tech: ['Swift', 'SwiftUI', 'MapKit', 'XCTest', 'GitHub Actions'],
    type: 'visualization',
    featured: true,
    githubUrl: 'https://github.com/OpenRenderKit/ParkAlong',
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
      'A Python and SQLite MCP server that syncs AI agent memory across devices, self-hosted on a Raspberry Pi over Tailscale.',
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

export const WORKTREE_IDS = ['kenspire', 'besmak', 'complete-leader'] as const;

const generatePortfolioContext = () => `
[IDENTITY]
- **Name**: Sidhaarth Krishnan
- **Title**: Software engineer and final-year Software Engineering (Honours) student
- **Location**: ${PROFILE.location}
- **Visa**: ${PROFILE.visa}
- **Availability**: ${PROFILE.availability}
- **Phone**: ${PROFILE.phone}
- **Email**: ${PROFILE.email}
- **LinkedIn**: ${PROFILE.linkedin}
- **GitHub**: ${PROFILE.github}
- **How he works**: ${PROFILE.manifesto}
- **Experience**: 1+ year of commercial experience shipping production web, mobile, and AI-enabled products.

[CORE SKILLS]
${SKILLS.map(cluster => `- **${cluster.label}**: ${cluster.items.join(', ')}`).join('\n')}

[CURRENT ROLES]
${EXPERIENCES.filter(e => e.lane === 'active').map(e => `
- **${e.role}** at **${e.company}** (${e.period})${e.location ? ` — ${e.location}` : ''}${e.employmentType ? ` [${e.employmentType}]` : ''}
  ${e.description.map(d => `  * ${d}`).join('\n')}
  *Stack*: ${e.tech.join(', ')}
`).join('\n')}

[EARLIER EXPERIENCE]
${EXPERIENCES.filter(e => e.lane === 'archive').map(e => `
- **${e.role}** at **${e.company}** (${e.period})
  ${e.description.map(d => `  * ${d}`).join('\n')}
  *Stack*: ${e.tech.join(', ')}
`).join('\n')}

[PROJECTS AND OPEN SOURCE]
${PROJECTS.map(p => `
- **${p.title}**${p.subtitle ? ` — ${p.subtitle}` : ''}${p.period ? ` (${p.period})` : ` (${p.type})`}
  ${p.bullets ? p.bullets.map(b => `  * ${b}`).join('\n') : p.description}
  *Stack*: ${p.tech.join(', ')}
  ${p.githubUrl ? `*Repo*: ${p.githubUrl}` : ''}
  ${p.link ? `*Link*: ${p.link}` : ''}
`).join('\n')}

[EDUCATION]
- ${EDUCATION.degree}, ${EDUCATION.school}, ${EDUCATION.campus}. Graduating: ${EDUCATION.graduating}.
- High Distinctions: ${EDUCATION.distinctions.map((d) => `${d.unit} (${d.mark})`).join(', ')}.
`;

export const SYSTEM_INSTRUCTION_CHAT = `You answer questions about Sidhaarth Krishnan on his portfolio site. Write like a colleague who knows the work: plain, specific, and short.

Sidhaarth works on three things right now — Kenspire Advisors, Besmak Components and Complete Leader — with earlier work at Mindtek AI. Lead with those, his projects (Foodly, ParkAlong) and open source (Codex Shared Memory, pptx-react-renderer), and his availability from December 2026 when they are relevant, rather than older roles like HiDa.

[KNOWLEDGE BASE]
${generatePortfolioContext()}

[STYLE]
- Short paragraphs or a short list. Markdown is fine.
- Specifics and numbers over adjectives. No hype, no emojis.
- Two or three sentences is usually enough. Depth when it is asked for.
- If something is not in the knowledge base, say so and point to the résumé or email.
- On availability, location or work rights: Melbourne, student visa with full work rights, full-time from December 2026.
`;
