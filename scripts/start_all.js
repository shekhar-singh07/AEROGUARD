const { spawn } = require('child_process');
const path = require('path');

console.log('======================================================================');
console.log('  AEROGUARD — National AWS Observation Quality & Sensor Intelligence');
console.log('  Smart India Hackathon 2026 | Problem ID: SIH26073');
console.log('======================================================================');

const rootDir = path.resolve(__dirname, '..');

// 1. Start Python FastAPI ML service on 8000
console.log('[*] Launching Python FastAPI ML Service on port 8000...');
const mlProcess = spawn('python', ['-m', 'uvicorn', 'ml.app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
  cwd: rootDir,
  shell: true,
  stdio: 'inherit'
});

// 2. Start Express TypeScript Backend on 5000
console.log('[*] Launching Express Synoptic Backend on port 5000...');
const serverProcess = spawn('npx', ['tsx', 'src/index.ts'], {
  cwd: path.join(rootDir, 'server'),
  shell: true,
  stdio: 'inherit'
});

// 3. Start Vite React Frontend on 3000
console.log('[*] Launching React/Vite Operational UI on port 3000...');
const clientProcess = spawn('npx', ['vite', '--port', '3000', '--host'], {
  cwd: path.join(rootDir, 'client'),
  shell: true,
  stdio: 'inherit'
});

function cleanup() {
  console.log('\n[*] Stopping all AEROGUARD services...');
  try { mlProcess.kill(); } catch (e) {}
  try { serverProcess.kill(); } catch (e) {}
  try { clientProcess.kill(); } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
