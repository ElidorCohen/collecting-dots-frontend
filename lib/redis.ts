import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set');
    }

    redisClient = new Redis({
      url,
      token,
    });
  }

  return redisClient;
}

export const SETTINGS_KEYS = {
  DEMO_SUBMISSION_ENABLED: 'settings:demo_submission_enabled',
} as const;

export async function getDemoSubmissionEnabled(): Promise<boolean> {
  const enabled = await getRedisClient().get<boolean | null>(SETTINGS_KEYS.DEMO_SUBMISSION_ENABLED);

  if (typeof enabled === 'boolean') {
    return enabled;
  }

  return true;
}
