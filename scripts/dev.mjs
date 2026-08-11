/* global fetch, process, setTimeout */

import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const frontendArgs = ['run', 'dev:frontend'];
if (process.argv.length > 2) frontendArgs.push('--', ...process.argv.slice(2));

async function serviceIsAlreadyRunning() {
  try {
    const response = await fetch('http://127.0.0.1:8787/health');
    return response.ok;
  } catch {
    return false;
  }
}

const spawnOptions = { stdio: 'inherit', shell: process.platform === 'win32' };
const children = [spawn(npmCommand, frontendArgs, spawnOptions)];
if (!(await serviceIsAlreadyRunning())) {
  children.push(spawn(npmCommand, ['run', 'dev:service'], spawnOptions));
}

let stopping = false;

function stopAll(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(exitCode), 250);
}

for (const child of children) {
  child.on('exit', (code) => {
    if (!stopping && code !== 0) stopAll(code ?? 1);
  });
}

process.on('SIGINT', () => stopAll());
process.on('SIGTERM', () => stopAll());
