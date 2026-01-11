const { spawn } = require('child_process');

process.env.NODE_ENV = 'production';

// Use npx to run next build so it picks the local next binary
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['next', 'build'];

const child = spawn(cmd, args, { stdio: 'inherit', shell: true });

child.on('exit', (code) => process.exit(code));
child.on('error', (err) => {
  console.error('Failed to run build:', err);
  process.exit(1);
});
