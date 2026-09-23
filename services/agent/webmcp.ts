import { TOOLS, runTool } from './registry';
import { setExternalAgent } from './actions';

type ToolDescriptor = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args?: Record<string, unknown>) => Promise<unknown>;
};

type ModelContext = {
  registerTool: (descriptor: ToolDescriptor, options?: { signal?: AbortSignal }) => Promise<unknown>;
  getTools?: () => Promise<Array<{ name: string }>>;
};

/** External agents are rate limited so a runaway loop cannot thrash the page. */
const WINDOW_MS = 60_000;
const MAX_CALLS = 30;
const calls: number[] = [];

const rateLimited = () => {
  const now = Date.now();
  while (calls.length > 0 && now - calls[0] > WINDOW_MS) calls.shift();
  if (calls.length >= MAX_CALLS) return true;
  calls.push(now);
  return false;
};

export const modelContext = (): ModelContext | undefined =>
  (document as unknown as { modelContext?: ModelContext }).modelContext;

export type Registration = {
  registered: number;
  usedPolyfill: boolean;
  unregister: () => void;
};

/**
 * Publishes the page's tool registry to the browser so external agents can
 * operate the site. Uses the native WebMCP API when it exists and falls back
 * to the polyfill, which installs the same `document.modelContext` surface.
 */
export const registerAgentTools = async (): Promise<Registration> => {
  let usedPolyfill = false;

  if (!modelContext()?.registerTool) {
    try {
      const { initializeWebMCPPolyfill } = await import('@mcp-b/webmcp-polyfill');
      initializeWebMCPPolyfill();
      usedPolyfill = true;
    } catch {
      return { registered: 0, usedPolyfill: false, unregister: () => {} };
    }
  }

  const context = modelContext();
  if (!context?.registerTool) {
    return { registered: 0, usedPolyfill, unregister: () => {} };
  }

  const controller = new AbortController();
  let registered = 0;

  for (const tool of TOOLS) {
    try {
      await context.registerTool(
        {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          execute: async (args) => {
            if (rateLimited()) {
              return 'Too many page actions in a short window. Wait a moment and try again.';
            }
            setExternalAgent(true);
            return runTool(tool.name, (args ?? {}) as Record<string, unknown>);
          },
        },
        { signal: controller.signal },
      );
      registered += 1;
    } catch {
      // duplicate name, unsupported descriptor or a disabled permission policy
    }
  }

  return { registered, usedPolyfill, unregister: () => controller.abort() };
};
