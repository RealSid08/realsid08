import { GoogleGenAI } from '@google/genai';

// --- Interfaces (inlined to avoid module resolution issues) ---
interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string[];
  tech: string[];
}

interface ProjectItem {
  id: string;
  title: string;
  description: string;
  link?: string;
  githubUrl?: string;
  tech: string[];
  type: 'live-demo' | 'visualization' | 'standard';
}

// --- Data (inlined from constants.ts) ---
const EXPERIENCES: ExperienceItem[] = [
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

const PROJECTS: ProjectItem[] = [
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
- Bachelor of Engineering (Software - Honours), Swinburne University of Technology, Hawthorn.
`;

const SYSTEM_INSTRUCTION_CHAT = `You are a sophisticated, minimalist AI assistant for Sidhaarth Krishnan's portfolio.
Your persona is professional, concise, and focused on engineering excellence.

[KNOWLEDGE BASE]
${generatePortfolioContext()}

[STYLE GUIDELINES]
- Use Markdown for formatting (bold key terms, use lists).
- Keep answers structurally organized.
- Do not use excessive emojis; keep it sleek and monochrome.
- Prioritize technical depth over generic praise.
`;

// --- Handler ---

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history } = req.body;
    
    // Use VITE_API_KEY if available (local) or GEMINI_API_KEY (server env)
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Filter out system messages or invalid roles if necessary
    // Gemini roles are 'user' and 'model'
    // The SDK expects Content objects for history
    const chatHistory = history
      .filter((msg: any) => (msg.role === 'user' || msg.role === 'model') && msg.text && msg.text.trim() !== '')
      .map((msg: any) => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

    // Use GenerateContent with system instructions and history manually constructed as contents
    // This avoids the chat.create state management issues with the new SDK
    
    const contents = [
        ...chatHistory,
        { role: 'user', parts: [{ text: message }] }
    ];

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        config: {
            systemInstruction: {
                role: 'system',
                parts: [{ text: SYSTEM_INSTRUCTION_CHAT }]
            }
        },
        contents: contents
    });

    const responseText = result.text;

    return res.status(200).json({ text: responseText });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error', details: error.toString() });
  }
}
