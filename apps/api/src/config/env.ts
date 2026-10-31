import { config as loadDotEnv } from 'dotenv';
import { readFileSync } from 'node:fs';
import { z } from 'zod';

loadDotEnv();

const secretEnvironmentKeys = [
  'DATABASE_PASSWORD',
  'REDIS_PASSWORD',
  'AUTOMATION_SHARED_TOKEN',
  'OPENAI_API_KEY',
  'NOTION_API_KEY',
] as const;

const environmentInput = { ...process.env };

for (const key of secretEnvironmentKeys) {
  const filePath = process.env[`${key}_FILE`];
  if (filePath === undefined) {
    continue;
  }
  if (process.env[key] !== undefined) {
    throw new Error(`Set either ${key} or ${key}_FILE, not both.`);
  }
  environmentInput[key] = readFileSync(filePath, 'utf8').replace(/\r?\n$/, '');
}

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DATABASE_NAME: z.string().min(1),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().min(1),
  REDIS_DB: z.coerce.number().int().min(0).default(0),
  N8N_BASE_URL: z.string().url(),
  AUTOMATION_SHARED_TOKEN: z.string().min(32).optional(),
  OPENAI_API_KEY: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().min(1).optional(),
  ),
  OPENAI_MODEL: z.string().min(1).default('gpt-4o-mini'),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(90000),
  NOTION_API_KEY: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().min(1).optional(),
  ),
  NOTION_PARENT_PAGE_ID: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().uuid().optional(),
  ),
  NOTION_API_VERSION: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default('2026-03-11'),
  NOTION_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(15000),
  WHATSAPP_DRY_RUN: z.enum(['true', 'false']).default('true'),
  WHATSAPP_ALLOWED_RECIPIENT: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().optional(),
  ),
  HEALTH_CHECK_TIMEOUT_MS: z.coerce.number().int().min(250).max(10000).default(2000),
});

const parsedEnvironment = environmentSchema.safeParse(environmentInput);

if (!parsedEnvironment.success) {
  const issues = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const environment = parsedEnvironment.data;
