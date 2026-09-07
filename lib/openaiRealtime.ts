export const REALTIME_MODEL = 'gpt-realtime-2.1-mini';

type ClientSecretPayload = {
  value?: unknown;
  client_secret?: {
    value?: unknown;
  };
};

export function readClientSecretValue(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const body = payload as ClientSecretPayload;
  if (typeof body.value === 'string' && body.value.length > 0) {
    return body.value;
  }

  if (typeof body.client_secret?.value === 'string' && body.client_secret.value.length > 0) {
    return body.client_secret.value;
  }

  return null;
}

export async function createRealtimeClientSecret(apiKey: string, instructions: string): Promise<string> {
  const openaiResponse = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      expires_after: {
        anchor: 'created_at',
        seconds: 600,
      },
      session: {
        type: 'realtime',
        model: REALTIME_MODEL,
        instructions,
        audio: {
          input: {
            turn_detection: {
              type: 'server_vad',
              create_response: true,
              interrupt_response: true,
            },
          },
          output: {
            voice: 'marin',
          },
        },
      },
    }),
  });

  if (!openaiResponse.ok) {
    const details = await openaiResponse.text();
    console.error('Realtime client secret error:', openaiResponse.status, details.slice(0, 500));
    throw new Error('Voice session unavailable');
  }

  const payload: unknown = await openaiResponse.json();
  const value = readClientSecretValue(payload);
  if (!value) {
    console.error('Realtime client secret missing value');
    throw new Error('Voice session unavailable');
  }

  return value;
}
