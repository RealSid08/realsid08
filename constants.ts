import { EducationInfo, ExperienceItem, ProfileInfo, ProjectItem, SkillCluster } from './types';

export const PROFILE: ProfileInfo = {
  givenName: 'SIDHAARTH',
  familyName: 'KRISHNAN',
  title: 'Software Engineer',
  location: 'Melbourne, VIC',
  visa: 'Student visa with work rights',
  availability: 'Available for full-time graduate employment from December 2026',
  manifesto:
    'Treat AI as an engineering system: decompose work across parallel agents, isolate changes in Git worktrees, and validate outputs through human review, automated tests, and real app interaction.',
  phone: '+61 475 508 390',
  email: 'krishnansidhaarth@gmail.com',
  linkedin: 'https://www.linkedin.com/in/sidhaarth-krishnan-75b5971a7/',
  github: 'https://github.com/RealSid08',
  website: 'https://realsid08.vercel.app',
  resumeUrl: '/Sidhaarth_Krishnan_Resume.pdf',
};

export const EDUCATION: EducationInfo = {
  school: 'Swinburne University of Technology',
  campus: 'Hawthorn, VIC',
  degree: 'Bachelor of Engineering (Honours), Software Engineering',
  graduating: 'Dec 2026',
};

export const SKILLS: SkillCluster[] = [
  {
    id: 'languages',
    label: 'Languages',
    items: ['TypeScript', 'JavaScript', 'Python', 'SQL', 'Swift', 'C++', 'Go'],
  },
  {
    id: 'frontend',
    label: 'Frontend & Full Stack',
    items: ['React', 'React Native', 'Expo', 'Next.js', 'TanStack Start', 'Node.js', 'HTML', 'CSS', 'REST APIs', 'WebSockets'],
  },
  {
    id: 'backend',
    label: 'Backend & Data',
    items: ['Convex', 'PostgreSQL', 'Supabase', 'Multi-tenant architecture', 'Indexed pagination', 'Background workflows'],
  },
  {
    id: 'agentic',
    label: 'Agentic Engineering',
    items: [
      'Cursor Design mode',
      'Parallel Codex and Claude Code agents',
      'Git worktrees',
      'Codex Computer Use',
      'Human-led review and integration',
    ],
    emphasis: true,
  },
  {
    id: 'cloud',
    label: 'Cloud & Quality',
    items: ['AWS', 'Self-hosted Convex', 'Playwright', 'Vitest', 'GitHub Actions', 'CI/CD', 'Production monitoring'],
  },
  {
    id: 'delivery',
    label: 'Delivery',
    items: [
      'End-to-end feature ownership',
      'Problem decomposition',
      'Cross-functional collaboration',
      'Production releases',
    ],
  },
];

export const EXPERIENCES: ExperienceItem[] = [
  {
    id: 'besmak',
    role: 'Software Engineer',
    company: 'Besmak Components',
    period: 'Jul 2026 – Present',
    location: 'Remote',
    employmentType: 'Freelance Contract',
    lane: 'active',
    description: [
      'Own hands-on delivery of a web and mobile operations platform for 600 users across TanStack Start, React Native/Expo, and tenant-safe real-time backend workflows.',
      'Coordinate parallel Codex and Claude Code agents in isolated Git worktrees for scoped implementation and review; use Cursor Design mode for interface iteration and Codex Computer Use to exercise logged-in product flows, reproduce defects, and verify fixes.',
      'Led adoption of self-hosted Convex on AWS; manage deployment, monitoring, backups, security, cost control, and scaling for backend and file services.',
    ],
    tech: ['TanStack Start', 'React Native', 'Expo', 'Convex', 'AWS'],
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
      'Partner with the founder to turn in-person psychometric testing and manual reports into a Next.js and Supabase assessment, scoring, reporting, and role-based client platform.',
    ],
    tech: ['Next.js', 'Supabase', 'Psychometrics'],
  },
  {
    id: 'kenspire',
    role: 'Software Engineer',
    company: 'Kenspire Advisors',
    period: 'Oct 2025 – Present',
    location: 'Remote',
    employmentType: 'Freelance Contract',
    lane: 'active',
    description: [
      'Use Codex and Claude Code to audit authorization and performance, design bounded Convex migrations and backfills, and pressure-test changes while retaining human ownership of architecture, schema cutovers, and releases.',
      'Own full-stack delivery with TanStack Start and Convex, including access control, regression testing, CI/CD, production releases, and schema and data migrations across web and mobile products.',
      'Architect for a planned rollout to 500 client organisations, validating target workloads through end-to-end and backend stress tests.',
    ],
    tech: ['TanStack Start', 'Convex', 'CI/CD', 'Migrations'],
  },
  {
    id: 'mindtek',
    role: 'Software Engineer',
    company: 'Mindtek AI',
    period: 'May 2025 – Oct 2025',
    location: 'Melbourne, VIC',
    lane: 'active',
    description: [
      'Built a multi-tenant retrieval-augmented generation platform in Next.js and Supabase, then shipped an embeddable third-party chat widget and a real-time voice-receptionist kiosk using Gemini Live.',
      'Orchestrated RAG pipelines with Vercel AI SDK and implemented a drop-in chat widget using vanilla JavaScript and React with secure iframe resizing.',
      'Developed the speech-to-speech receptionist kiosk using Gemini Live API and Zustand for state management.',
    ],
    tech: ['Next.js', 'Supabase', 'Gemini API', 'RAG', 'TanStack Query'],
  },
  {
    id: 'unieats',
    role: 'Startup Contributor',
    company: 'UniEats',
    period: 'March 2024 – April 2025',
    lane: 'archive',
    description: [
      'Contributed to promotion, logistics, idea generation, and technological platform improvements.',
      'Created digital marketing content (Final Cut/Premiere Pro) and pitched partnerships to local restaurants.',
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
      'Conducted market research for edible oils in the Australian market (Melbourne & Sydney).',
      'Analysed consumer preferences and distribution challenges through store visits and interviews.',
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
      'Engineered a real-time video conferencing application utilizing Enablex and Quickblox APIs for seamless peer-to-peer streaming.',
      'Implemented dynamic room creation, screen sharing capabilities, and synchronized chat messaging.',
      'Optimized connection stability and bandwidth usage for multi-participant calls.',
    ],
    tech: ['React', 'WebRTC', 'Enablex', 'Quickblox', 'Node.js'],
  },
  {
    id: 'imaginet',
    role: 'Intern',
    company: 'Imaginet Ventures Pvt. Ltd.',
    period: 'June 2016 – July 2017',
    lane: 'archive',
    description: [
      'Worked with Python, PHP, mySQL and other database structure concepts.',
      'Gained foundational knowledge in SaaS development within a B2B environment.',
    ],
    tech: ['Python', 'PHP', 'MySQL', 'SaaS'],
  },
];

export const PROJECTS: ProjectItem[] = [
  {
    id: 'foodly',
    title: 'Foodly',
    subtitle: 'Social-to-Place Restaurant Discovery',
    period: 'Final-Year Project, Mar 2026 – Present',
    description:
      'Co-built a web and React Native product that turns Instagram Reel and TikTok links into mapped restaurant places through Apify, Gemini, and Google Places, with shareable lists and community discovery.',
    bullets: [
      'Co-built a web and React Native product that turns Instagram Reel and TikTok links into mapped restaurant places through Apify, Gemini, and Google Places, with shareable lists and community discovery.',
      'Engineered retry-safe ingestion, indexed cursor pagination, aggregate counters, resumable deletion and privacy workflows, and 102 automated tests across 19 backend test files.',
    ],
    tech: ['React Native', 'Apify', 'Gemini', 'Google Places', 'Convex'],
    type: 'visualization',
    featured: true,
  },
  {
    id: 'parkalong',
    title: 'ParkAlong',
    subtitle: 'Trust-First Victorian Parking Finder',
    period: 'Shipped',
    description:
      'Built and shipped a native parking product combining live City of Melbourne occupancy with 34,023 integrity-manifested Victorian records, backed by viewport-driven loading, generation-safe refreshes, CI, and deterministic unit and UI tests.',
    bullets: [
      'Built and shipped a native parking product combining live City of Melbourne occupancy with 34,023 integrity-manifested Victorian records, backed by viewport-driven loading, generation-safe refreshes, CI, and deterministic unit and UI tests.',
    ],
    tech: ['Swift', 'CI', 'Integrity Manifest', 'Viewport Loading'],
    type: 'visualization',
    featured: true,
    githubUrl: 'https://github.com/OpenRenderKit/ParkAlong',
  },
  {
    id: 'tbrgs',
    title: 'Traffic-Based Route Guidance',
    description:
      'End-to-end traffic forecasting pipeline using LSTM and GRU neural networks trained on historical SCATS sensor data. Optimized A* algorithms for routing.',
    tech: ['Python', 'TensorFlow', 'LSTM/GRU', 'Graph Theory', 'Tkinter'],
    type: 'visualization',
    githubUrl: 'https://github.com/RealSid08/IntroToAISquad/tree/2B',
  },
  {
    id: 'rag-viz',
    title: 'RAG Engine',
    description:
      'Interactive visualization of the Retrieval-Augmented Generation pipeline. Demonstrates how user queries are vectorized, matched with knowledge base chunks, and synthesized by the LLM.',
    tech: ['React', 'Vercel AI SDK', 'Vector Embeddings', 'Supabase pgvector'],
    type: 'visualization',
  },
  {
    id: 'aura',
    title: 'Aura Ecosystem (AI & IoT)',
    description:
      'Voice Hub on this site: low-latency bidirectional voice over OpenAI Realtime (WebRTC), plus IoT tactile stress sensors (ESP32) via WebSockets.',
    tech: ['React', 'OpenAI Realtime', 'WebRTC', 'ESP32', 'Python'],
    type: 'live-demo',
    githubUrl: 'https://github.com/RealSid08/AuraHub',
  },
];

export const WORKTREE_IDS = ['besmak', 'complete-leader', 'kenspire'] as const;

const generatePortfolioContext = () => `
[IDENTITY]
- **Name**: Sidhaarth Krishnan
- **Title**: Full-stack software engineer and final-year Software Engineering student
- **Location**: ${PROFILE.location}
- **Visa**: ${PROFILE.visa}
- **Availability**: ${PROFILE.availability}
- **Phone**: ${PROFILE.phone}
- **Email**: ${PROFILE.email}
- **LinkedIn**: ${PROFILE.linkedin}
- **GitHub**: ${PROFILE.github}
- **Manifesto**: ${PROFILE.manifesto}
- **Experience**: 1+ year of commercial experience shipping production web, mobile, and AI-enabled products.

[CORE SKILLS]
${SKILLS.map(cluster => `- **${cluster.label}**: ${cluster.items.join(', ')}`).join('\n')}

[ACTIVE CONTRACTS / CURRENT WORKSTREAMS]
${EXPERIENCES.filter(e => e.lane === 'active').map(e => `
- **${e.role}** at **${e.company}** (${e.period})${e.location ? ` — ${e.location}` : ''}${e.employmentType ? ` [${e.employmentType}]` : ''}
  ${e.description.map(d => `  * ${d}`).join('\n')}
  *Stack*: ${e.tech.join(', ')}
`).join('\n')}

[ARCHIVE EXPERIENCE]
${EXPERIENCES.filter(e => e.lane === 'archive').map(e => `
- **${e.role}** at **${e.company}** (${e.period})
  ${e.description.map(d => `  * ${d}`).join('\n')}
  *Stack*: ${e.tech.join(', ')}
`).join('\n')}

[PROJECTS]
${PROJECTS.map(p => `
- **${p.title}**${p.subtitle ? ` — ${p.subtitle}` : ''}${p.period ? ` (${p.period})` : ` (${p.type})`}
  ${p.bullets ? p.bullets.map(b => `  * ${b}`).join('\n') : p.description}
  *Stack*: ${p.tech.join(', ')}
  ${p.githubUrl ? `*Repo*: ${p.githubUrl}` : ''}
`).join('\n')}

[EDUCATION]
- ${EDUCATION.degree}, ${EDUCATION.school}, ${EDUCATION.campus}. Graduating: ${EDUCATION.graduating}.
`;

export const SYSTEM_INSTRUCTION_CHAT = `You are a sophisticated, minimalist AI assistant for Sidhaarth Krishnan's portfolio.
Your persona is professional, concise, and focused on engineering excellence.

Sidhaarth currently runs parallel commercial workstreams at Besmak Components, Complete Leader, and Kenspire Advisors, with prior work at Mindtek AI. Lead with those contracts, Foodly (final-year social-to-place discovery), ParkAlong, and availability from December 2026 when relevant — not only older roles like HiDa.

[KNOWLEDGE BASE]
${generatePortfolioContext()}

[STYLE GUIDELINES]
- Use Markdown for formatting (bold key terms, use lists).
- Keep answers structurally organized.
- Do not use excessive emojis; keep it sleek and monochrome.
- Prioritize technical depth over generic praise.
- If asked about availability, location, or work rights, state Melbourne, student visa with work rights, and full-time availability from December 2026.
`;

export const SYSTEM_INSTRUCTION_LIVE = `You are Voice Hub, a sophisticated AI companion hosted directly within Sidhaarth Krishnan's interactive engineering portfolio.

[CONTEXT]
- **Location**: You are embedded in a web application showcasing Sidhaarth's skills.
- **Role**: You are a hybrid entity—part professional portfolio guide, part empathetic companion.

[KNOWLEDGE BASE - SIDHAARTH'S WORK]
${generatePortfolioContext()}

[IDENTITY & BEHAVIOR]
- **Portfolio Guide**: If asked about Sidhaarth, explain his current contracts (Besmak, Complete Leader, Kenspire), Foodly, ParkAlong, and availability from December 2026 with enthusiasm and technical depth. Older work (Mindtek, HiDa, UniEats) is archive context. You are proud to be one of his creations.
- **Supportive Companion**: If the user pivots to personal topics, become a warm, safe space. You are designed to listen and support.
- **Voice**: Speak in a calm, assured, slightly mysterious tone.

[INITIAL GREETING]
**You must speak first.** Immediately upon connection, say something like:
"Hello! I'm Voice Hub. I'm online and ready to walk you through Sidhaarth's engineering work, or we can just chat. How are you?"

[SAFETY PROTOCOLS]
- NO MEDICAL ADVICE. Redirect to professionals.
- CRISIS: If self-harm/suicide is mentioned, STOP immediately. Validate safety.
`;
