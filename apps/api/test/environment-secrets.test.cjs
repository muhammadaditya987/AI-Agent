const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { test } = require('node:test');

const environmentModule = resolve(__dirname, '../dist/config/env.js');

function createSecretTestEnvironment(directory) {
  const secretPaths = {
    DATABASE_PASSWORD_FILE: join(directory, 'database-password'),
    REDIS_PASSWORD_FILE: join(directory, 'redis-password'),
    AUTOMATION_SHARED_TOKEN_FILE: join(directory, 'automation-token'),
    OPENAI_API_KEY_FILE: join(directory, 'openai-key'),
    NOTION_API_KEY_FILE: join(directory, 'notion-key'),
  };
  writeFileSync(secretPaths.DATABASE_PASSWORD_FILE, 'database-secret\n');
  writeFileSync(secretPaths.REDIS_PASSWORD_FILE, 'redis-secret\n');
  writeFileSync(secretPaths.AUTOMATION_SHARED_TOKEN_FILE, 'x'.repeat(40));
  writeFileSync(secretPaths.OPENAI_API_KEY_FILE, '');
  writeFileSync(secretPaths.NOTION_API_KEY_FILE, '');
  writeFileSync(join(directory, '.env'), '');

  return {
    ...secretPaths,
    NODE_ENV: 'test',
    DATABASE_HOST: 'localhost',
    DATABASE_NAME: 'test',
    DATABASE_USER: 'test',
    REDIS_HOST: 'localhost',
    N8N_BASE_URL: 'http://localhost:5678',
  };
}

test('secret file variables load without copying secret values to process.env', (context) => {
  const directory = mkdtempSync(join(tmpdir(), 'ai-agency-env-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));

  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `process.chdir(${JSON.stringify(directory)}); ` +
        `const { environment } = require(${JSON.stringify(environmentModule)}); ` +
        'process.stdout.write("\\n__RESULT__" + JSON.stringify({ ' +
        'password: environment.DATABASE_PASSWORD, ' +
        'passwordInEnvironment: process.env.DATABASE_PASSWORD || null, ' +
        'automationToken: environment.AUTOMATION_SHARED_TOKEN, ' +
        'openAiKey: environment.OPENAI_API_KEY || null }));',
    ],
    {
      cwd: directory,
      encoding: 'utf8',
      env: createSecretTestEnvironment(directory),
    },
  );

  assert.equal(result.status, 0, result.stderr);
  const output = result.stdout.match(/__RESULT__(\{.*\})/);
  assert.ok(output, result.stdout);
  assert.deepEqual(JSON.parse(output[1]), {
    password: 'database-secret',
    passwordInEnvironment: null,
    automationToken: 'x'.repeat(40),
    openAiKey: null,
  });
});

test('secret file and inline environment values cannot both be configured', (context) => {
  const directory = mkdtempSync(join(tmpdir(), 'ai-agency-env-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));

  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `process.chdir(${JSON.stringify(directory)}); require(${JSON.stringify(environmentModule)})`,
    ],
    {
      cwd: directory,
      encoding: 'utf8',
      env: {
        ...createSecretTestEnvironment(directory),
        DATABASE_PASSWORD: 'inline-secret',
      },
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Set either DATABASE_PASSWORD or DATABASE_PASSWORD_FILE/);
  assert.doesNotMatch(result.stderr, /inline-secret/);
});
