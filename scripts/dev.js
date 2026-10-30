#!/usr/bin/env node
/**
 * PQC HealthSecure - Dual Service Dev Orchestrator
 * Automatically ensures FastAPI is running on port 8001 and launches Vite frontend on 5173.
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const venvPython = path.join(rootDir, 'backend', 'venv', 'Scripts', 'python.exe');
const fallbackPython = path.join(rootDir, 'venv', 'Scripts', 'python.exe');
const pythonExe = fs.existsSync(venvPython) ? venvPython : (fs.existsSync(fallbackPython) ? fallbackPython : 'python');

function checkBackendOnline() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:8001/api/health', (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 429);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1200, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log('================================================================');
  console.log(' PQC HealthSecure - Launching Services');
  console.log('================================================================');

  const isOnline = await checkBackendOnline();
  let backendProcess = null;

  if (isOnline) {
    console.log('[+] FastAPI backend is already running on http://127.0.0.1:8001');
  } else {
    console.log('[*] Starting FastAPI backend on http://127.0.0.1:8001...');
    backendProcess = spawn(pythonExe, ['main.py'], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true
    });

    backendProcess.on('error', (err) => {
      console.error('[-] Failed to start FastAPI backend:', err.message);
    });
  }

  console.log('[*] Starting React + Vite frontend on http://localhost:5173...');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const frontendProcess = spawn(npmCmd, ['--prefix', 'frontend', 'run', 'dev'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
  });

  frontendProcess.on('error', (err) => {
    console.error('[-] Failed to start frontend dev server:', err.message);
  });

  const cleanup = () => {
    if (backendProcess) {
      try {
        backendProcess.kill();
      } catch (e) {
        // ignore
      }
    }
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main();
