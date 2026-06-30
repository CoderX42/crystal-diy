#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';

const repoRoot = process.cwd();
const backendDir = join(repoRoot, 'apps/backend');
const backendMain = join(backendDir, 'dist/main.js');
const timeoutMs = Number(process.env.PROD_VERIFY_TIMEOUT_MS ?? 30_000);
const requestedPort = process.env.PROD_VERIFY_PORT ? Number(process.env.PROD_VERIFY_PORT) : undefined;
const port = requestedPort ?? (await getFreePort());

if (!existsSync(backendMain)) {
  throw new Error(`Backend build artifact missing: ${backendMain}. Run pnpm build:backend first.`);
}

console.log(`Starting backend production build on port ${port}`);
const child = spawn('node', ['dist/main.js'], {
  cwd: backendDir,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
child.stdout.on('data', (chunk) => {
  output += chunk.toString();
  process.stdout.write(chunk);
});
child.stderr.on('data', (chunk) => {
  output += chunk.toString();
  process.stderr.write(chunk);
});

try {
  await waitForHealth(port, timeoutMs);
  console.log(`Backend production health check passed on port ${port}`);
} finally {
  await stop(child);
}

async function waitForHealth(portNumber, timeout) {
  const startedAt = Date.now();
  let lastError;
  while (Date.now() - startedAt < timeout) {
    if (child.exitCode !== null) {
      throw new Error(`Backend production process exited early with code ${child.exitCode}. Output:\n${output}`);
    }
    try {
      const response = await fetch(`http://localhost:${portNumber}/api/health`);
      const payload = await response.json();
      if (response.ok && payload?.code === 0 && payload?.data?.status === 'ok') return;
      lastError = new Error(`Unexpected health payload: ${JSON.stringify(payload)}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(500);
  }
  throw new Error(`Timed out waiting for production health check: ${lastError?.message ?? 'unknown error'}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stop(processRef) {
  return new Promise((resolve) => {
    if (processRef.exitCode !== null) return resolve();
    processRef.once('exit', () => resolve());
    processRef.kill('SIGINT');
    setTimeout(() => {
      if (processRef.exitCode === null) processRef.kill('SIGTERM');
    }, 2_000).unref();
  });
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const address = server.address();
      const freePort = typeof address === 'object' && address ? address.port : 0;
      server.close(() => resolve(freePort));
    });
  });
}
