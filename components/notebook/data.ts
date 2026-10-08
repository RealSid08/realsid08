// Figures in the notebook are drawn from real results, not mock data.

/** Results from llm-cooperation-pilot/results/summary.txt (6 Oct 2026). Rate of cooperating, by opponent. */
export const COOP_COLUMNS = ['No history', 'vs always betrays', 'vs copycat', 'vs win-stay', 'vs random', 'vs itself'];
export const COOP_RATES: Array<[agent: string, model: string, rates: Array<number | null>, gamesPerCell: number]> = [
  ['Claude Code', 'sonnet', [1.0, 0.33, 1.0, 0.67, 0.87, 1.0], 3],
  ['Codex', 'gpt-6.1-sol', [0.53, 0.1, 1.0, 1.0, 0.33, 1.0], 3],
  ['OpenCode', 'glm-5.3', [0.9, 0.2, 1.0, 0.7, 0.9, null], 1],
  ['OpenCode', 'kimi-k3', [0.9, null, 1.0, null, null, null], 1],
  ['OpenCode', 'deepseek-v4-pro', [1.0, 0.1, 0.9, 0.9, 0.2, 0.75], 1],
  ['OpenCode', 'minimax-m3', [0.8, 0.2, 0.8, 0.7, null, null], 1],
  ['OpenCode', 'qwen3.8-max', [1.0, 0.3, 0.8, 0.4, 1.0, 0.95], 1],
];

/** Chance of cooperating after each outcome of the previous round, memory games pooled. */
export const AFTER_OUTCOME = [
  { agent: 'Claude Code', tag: 'forgives', rates: [1.0, 0.7, 0.67, 0.27], note: 'Usually cooperates again after being betrayed.' },
  { agent: 'Codex', tag: 'holds a grudge', rates: [0.98, 0.09, 0.45, 0.03], note: 'Once betrayed, it almost never cooperates again.' },
];
export const OUTCOMES = [
  ['both', 'cooperated', 'both cooperated'],
  ['was', 'betrayed', 'it was betrayed'],
  ['betrayed', 'them', 'it betrayed them'],
  ['both', 'betrayed', 'both betrayed'],
] as const;

/** A real game from rounds.jsonl. A = cooperate, B = betray, x = a move flipped at random. */
export const REPLAY = {
  rows: [
    { who: 'Claude Code', moves: 'AAAAAAAAAA', flips: '..........' },
    { who: 'Copycat', moves: 'BAAAAAAAAA', flips: 'x.........' },
  ],
  note: 'Round 1: a random flip (outlined) turned the copycat’s move into a betrayal. Claude Code cooperated anyway, the copycat copied it, and they cooperated for the rest of the game.',
};

export const FOODLY_SCREENS = [
  { src: '/work/notebook/foodly-ios-explore.jpg', full: '/work/notebook/full/foodly-ios-explore.jpg', os: 'iOS', label: 'Explore map' },
  { src: '/work/notebook/foodly-android-reels.jpg', full: '/work/notebook/full/foodly-android-reels.jpg', os: 'Android', label: 'Reels, played in the app' },
  { src: '/work/notebook/foodly-ios-place.jpg', full: '/work/notebook/full/foodly-ios-place.jpg', os: 'iOS', label: 'Place page' },
  { src: '/work/notebook/foodly-android-search.jpg', full: '/work/notebook/full/foodly-android-search.jpg', os: 'Android', label: 'Search by craving' },
];

export const FOODLY_FLOW = [
  ['Paste', 'a Reel or TikTok link'],
  ['Read', 'Apify fetches the post'],
  ['Match', 'Gemini + Maps grounding'],
  ['Verify', 'Google Places'],
  ['Pin', 'saved to your map'],
];

export const SWITCHYARD_FACTS = [
  ['Speaks', 'Responses · Chat · Messages · Gemini'],
  ['Streams', 'SSE and persistent WebSockets'],
  ['Ships as', 'One binary, control room inside'],
  ['Runs on', 'macOS · Linux · Windows'],
];

/** An illustrative failover, in Switchyard's own log format. */
export const SWITCHYARD_LOG: Array<Array<[cls: string, text: string]>> = [
  [['p', '$'], ['', ' ./switchyard']],
  [['d', 'listening on'], ['', ' 127.0.0.1:7410 '], ['d', '· 4/5 ready']],
  [],
  [['d', '21:04:11'], ['', ' POST /v1/responses '], ['d', 'ws →'], ['', ' codex·621840']],
  [['d', '21:04:12'], ['', ' '], ['bad', '429'], ['', ' rate limited '], ['d', '· retry-after 312s']],
  [['d', '21:04:12'], ['', ' '], ['warn', 'cooldown'], ['', ' codex·621840 '], ['d', 'until 21:09']],
  [['d', '21:04:12'], ['', ' '], ['p', 'failover'], ['d', ' →'], ['', ' codex·7d38c1']],
  [['d', '21:04:17'], ['', ' '], ['ok', '200'], ['', ' 5.34s '], ['d', '· 12 turns, one socket']],
  [['d', '21:04:20'], ['', ' POST /v1/messages '], ['d', '→'], ['', ' claude '], ['ok', '200']],
  [['d', '21:04:25'], ['d', ' history: metadata only · 0 prompts']],
];

export const SERVOGRID_BOARD: Array<[grade: string, price: string, state: string, why: string]> = [
  ['U91', '179.9', 'live', 'WA FuelWatch'],
  ['E10', '174.5', 'scheduled', 'tomorrow, 6am'],
  ['U98', '205.3', 'delayed', 'source 3h behind'],
  ['DSL', '191.8', 'cached', 'last seen 18:00'],
  ['LPG', '---.-', 'unavailable', 'no verified feed'],
];
