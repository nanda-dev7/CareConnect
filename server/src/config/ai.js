import { ENV } from './env.js';

export const AI_CONFIG = {
  provider: ENV.AI_PROVIDER || 'groq',
  apiKey: ENV.AI_API_KEY,
  model: ENV.AI_MODEL || 'openai/gpt-oss-20b',
  timeoutMs: 15000,
  maxRetries: 2
};
