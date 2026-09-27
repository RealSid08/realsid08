import { runTool, TOOLS } from './registry';

export const realtimeToolDefinitions = TOOLS.map(({ name, description, inputSchema }) => ({
  type: 'function' as const,
  name,
  description,
  parameters: inputSchema,
}));

export type RealtimeFunctionCall = {
  type: 'function_call';
  name: string;
  call_id: string;
  arguments: string;
};

export const isRealtimeFunctionCall = (item: unknown): item is RealtimeFunctionCall => {
  if (!item || typeof item !== 'object') return false;
  const call = item as Partial<RealtimeFunctionCall>;
  return call.type === 'function_call' && typeof call.name === 'string' &&
    typeof call.call_id === 'string' && typeof call.arguments === 'string';
};

export async function executeRealtimeFunctionCall(
  call: RealtimeFunctionCall,
): Promise<{ type: 'conversation.item.create'; item: { type: 'function_call_output'; call_id: string; output: string } }> {
  let result: unknown;
  try {
    const parsed: unknown = JSON.parse(call.arguments);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Tool arguments must be an object');
    }
    result = await runTool(call.name, parsed as Record<string, unknown>);
  } catch (error) {
    result = { ok: false, error: error instanceof Error ? error.message : 'Invalid tool arguments' };
  }
  return {
    type: 'conversation.item.create',
    item: { type: 'function_call_output', call_id: call.call_id, output: JSON.stringify(result) },
  };
}
