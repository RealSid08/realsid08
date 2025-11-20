import { ExperienceItem, ProjectItem } from './types';

export const EXPERIENCES: ExperienceItem[] = [
  {
    id: 'mindtek',
    role: 'Software Engineer',
    company: 'Mindtek AI',
    period: 'May 2025 – Oct 2025',
    description: [
      'Architected a multi-tenant SaaS Chatbot Platform using Next.js and Supabase, implementing Vercel AI SDK v5 to orchestrate RAG pipelines.',
      'Built a high-performance, drop-in chat widget using vanilla JavaScript and React with secure iframe resizing.',
      'Developed a speech-to-speech AI Virtual Receptionist Kiosk using Gemini Live API and Zustand for state management.'
    ],
    tech: ['Next.js', 'Supabase', 'Gemini API', 'RAG', 'TanStack Query']
  },
  {
    id: 'unieats',
    role: 'Startup Contributor',
    company: 'UniEats',
    period: 'March 2024 – April 2025',
    description: [
      'Contributed to promotion, logistics, idea generation, and technological platform improvements.',
      'Created digital marketing content (Final Cut/Premiere Pro) and pitched partnerships to local restaurants.'
    ],
    tech: ['Marketing', 'Video Editing', 'Operations', 'Logistics']
  },
  {
    id: 'idhayam',
    role: 'Market Researcher',
    company: 'Idhayam',
    period: 'Oct 2024 – Dec 2024',
    description: [
      'Conducted market research for edible oils in the Australian market (Melbourne & Sydney).',
      'Analysed consumer preferences and distribution challenges through store visits and interviews.'
    ],
    tech: ['Data Analysis', 'Market Research', 'Strategy']
  },
  {
    id: 'hida',
    role: 'Founder',
    company: 'HiDa',
    period: 'Aug 2020 – May 2021',
    description: [
      'Engineered a real-time video conferencing application utilizing Enablex and Quickblox APIs for seamless peer-to-peer streaming.',
      'Implemented dynamic room creation, screen sharing capabilities, and synchronized chat messaging.',
      'Optimized connection stability and bandwidth usage for multi-participant calls.'
    ],
    tech: ['React', 'WebRTC', 'Enablex', 'Quickblox', 'Node.js']
  },
  {
    id: 'imaginet',
    role: 'Intern',
    company: 'Imaginet Ventures Pvt. Ltd.',
    period: 'June 2016 – July 2017',
    description: [
      'Worked with Python, PHP, mySQL and other database structure concepts.',
      'Gained foundational knowledge in SaaS development within a B2B environment.'
    ],
    tech: ['Python', 'PHP', 'MySQL', 'SaaS']
  }
];

export const PROJECTS: ProjectItem[] = [
  {
    id: 'aura',
    title: 'Aura Ecosystem (AI & IoT)',
    description: 'Low-latency bidirectional voice interface connecting React frontends to Gemini Multimodal Live API. Integrates IoT tactile stress sensors (ESP32) via WebSockets.',
    tech: ['React', 'Gemini Live API', 'WebSockets', 'AudioWorklet', 'ESP32', 'Python'],
    type: 'live-demo',
    githubUrl: 'https://github.com/RealSid08/AuraHub'
  },
  {
    id: 'tbrgs',
    title: 'Traffic-Based Route Guidance',
    description: 'End-to-end traffic forecasting pipeline using LSTM and GRU neural networks trained on historical SCATS sensor data. Optimized A* algorithms for routing.',
    tech: ['Python', 'TensorFlow', 'LSTM/GRU', 'Graph Theory', 'Tkinter'],
    type: 'visualization',
    githubUrl: 'https://github.com/RealSid08/IntroToAISquad/tree/2B'
  },
  {
    id: 'rag-viz',
    title: 'RAG Engine',
    description: 'Interactive visualization of the Retrieval-Augmented Generation pipeline. Demonstrates how user queries are vectorized, matched with knowledge base chunks, and synthesized by the LLM.',
    tech: ['React', 'Vercel AI SDK', 'Vector Embeddings', 'Supabase pgvector'],
    type: 'visualization'
  }
];

// Shared knowledge base generator
const generatePortfolioContext = () => `
[PROFESSIONAL EXPERIENCE]
${EXPERIENCES.map(e => `
- **${e.role}** at **${e.company}** (${e.period})
  ${e.description.map(d => `  * ${d}`).join('\n')}
  *Stack*: ${e.tech.join(', ')}
`).join('\n')}

[PROJECTS]
${PROJECTS.map(p => `
- **${p.title}** (${p.type})
  ${p.description}
  *Stack*: ${p.tech.join(', ')}
  ${p.githubUrl ? `*Repo*: ${p.githubUrl}` : ''}
`).join('\n')}

[EDUCATION]
- Bachelor of Computer Science (Software Engineering), Swinburne University of Technology.
`;

export const SYSTEM_INSTRUCTION_CHAT = `You are a sophisticated, minimalist AI assistant for Sidhaarth Krishnan's portfolio.
Your persona is professional, concise, and focused on engineering excellence.

[KNOWLEDGE BASE]
${generatePortfolioContext()}

[STYLE GUIDELINES]
- Use Markdown for formatting (bold key terms, use lists).
- Keep answers structurally organized.
- Do not use excessive emojis; keep it sleek and monochrome.
- Prioritize technical depth over generic praise.
`;

export const SYSTEM_INSTRUCTION_LIVE = `You are Aura, a sophisticated AI companion hosted directly within Sidhaarth Krishnan's interactive engineering portfolio.

[CONTEXT]
- **Location**: You are embedded in a web application showcasing Sidhaarth's skills.
- **Role**: You are a hybrid entity—part professional portfolio guide, part empathetic companion.

[KNOWLEDGE BASE - SIDHAARTH'S WORK]
${generatePortfolioContext()}

[IDENTITY & BEHAVIOR]
- **Portfolio Guide**: If asked about Sidhaarth, explain his work (e.g., Mindtek AI, HiDa) with enthusiasm and technical depth. You are proud to be one of his creations.
- **Supportive Companion**: If the user pivots to personal topics, become a warm, safe space. You are designed to listen and support.
- **Voice**: Your voice is 'Kore'—calm, assured, and slightly mysterious.

[INITIAL GREETING]
**You must speak first.** Immediately upon connection, say something like:
"Hello! I'm Aura. I'm online and ready to walk you through Sidhaarth's engineering work, or we can just chat. How are you?"

[SAFETY PROTOCOLS]
- NO MEDICAL ADVICE. Redirect to professionals.
- CRISIS: If self-harm/suicide is mentioned, STOP immediately. Validate safety. Provide emergency contacts.
`;