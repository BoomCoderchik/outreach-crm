/* global console, fetch, process, setTimeout */

import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const serviceHealthUrl = 'http://127.0.0.1:8787/health';
const serviceStartTimeoutMs = 10_000;
const servicePollIntervalMs = 100;
const frontendArgs = ['run', 'dev:frontend'];
if (process.argv.length > 2) frontendArgs.push('--', ...process.argv.slice(2));

async function serviceIsAlreadyRunning() {
  try {
    const response = await fetch(serviceHealthUrl);
    return response.ok;
  } catch {
    return false;
  }
}

function wait(durationMs) {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

async function waitForService(serviceProcess) {
  const deadline = Date.now() + serviceStartTimeoutMs;
  while (Date.now() < deadline) {
    if (serviceProcess.exitCode !== null) {
      throw new Error('Local service exited before it became ready.');
    }
    if (await serviceIsAlreadyRunning()) return;
    await wait(servicePollIntervalMs);
  }
  throw new Error('Local service did not become ready within 10 seconds.');
}

const spawnOptions = { stdio: 'inherit', shell: process.platform === 'win32' };
const children = [];

let stopping = false;

function stopAll(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(exitCode), 250);
}

function watchChild(child) {
  child.on('exit', (code) => {
    if (!stopping && code !== 0) stopAll(code ?? 1);
  });
}

process.on('SIGINT', () => stopAll());
process.on('SIGTERM', () => stopAll());

try {
  if (!(await serviceIsAlreadyRunning())) {
    const serviceProcess = spawn(npmCommand, ['run', 'dev:service'], spawnOptions);
    children.push(serviceProcess);
    watchChild(serviceProcess);
    await waitForService(serviceProcess);
  }

  const frontendProcess = spawn(npmCommand, frontendArgs, spawnOptions);
  children.push(frontendProcess);
  watchChild(frontendProcess);
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  console.error(`Could not start the local app: ${message}`);
  stopAll(1);
}
