import type { UIMessage } from 'ai';
import { toolByName } from './registry';

export type PendingIntent = { id: string; name: string; args: Record<string, unknown> };

/**
 * Pulls the page actions the assistant asked for out of a message list.
 * Tool calls that have not finished, are not page tools, or were already run
 * are ignored, so a re-render or a restored thread never replays an action.
 */
export const pageIntentsFromMessages = (
  messages: UIMessage[],
  alreadyRun: ReadonlySet<string>,
): PendingIntent[] => {
  const intents: PendingIntent[] = [];

  messages.forEach((message) => {
    (message.parts ?? []).forEach((part, index) => {
      const type = (part as { type?: string }).type ?? '';
      if (!type.startsWith('tool-')) return;
      const state = (part as { state?: string }).state;
      if (state !== 'output-available') return;

      const name = type.replace(/^tool-/, '');
      if (!toolByName(name) || toolByName(name)?.kind !== 'act') return;

      const id = `${message.id}:${index}`;
      if (alreadyRun.has(id)) return;

      const input = (part as { input?: unknown }).input;
      intents.push({ id, name, args: (input && typeof input === 'object' ? input : {}) as Record<string, unknown> });
    });
  });

  return intents;
};
