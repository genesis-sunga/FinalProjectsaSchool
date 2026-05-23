const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const sourceDir = path.join(rootDir, 'frontend', 'dist');
const outputDirs = [
  path.join(rootDir, 'dist'),
  path.join(rootDir, 'build'),
];

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Frontend build output was not found: ${sourceDir}`);
}

for (const outputDir of outputDirs) {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.cpSync(sourceDir, outputDir, { recursive: true });
}

console.log('Copied frontend/dist to root dist and build');
