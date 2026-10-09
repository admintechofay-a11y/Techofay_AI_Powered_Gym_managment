import fs from 'node:fs';
import path from 'node:path';

const FORBIDDEN_PATTERNS = [
  /\blorem\s+ipsum\b/i,
  /\bTODO\b/,
  /\bFIXME\b/,
  /\bcoming\s+soon\b/i,
  /\bexample\.com\b/i,
  /\btest@test\b/i,
];

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  '.turbo',
  'coverage',
  '.husky',
]);

const IGNORED_FILES = new Set([
  'check-placeholders.ts',
  'CLAUDE.md',
  'SOW_extracted.txt',
  'DATABASE.md',
  'LAUNCH_AUDIT.md',
  'PROGRESS.md',
  'IMAGE_CREDITS.md',
]);

let violations = 0;

function scanDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile()) {
      if (IGNORED_FILES.has(entry.name)) continue;
      // only check source and markdown files
      const ext = path.extname(entry.name).toLowerCase();
      if (!['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.html', '.css'].includes(ext)) {
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const pattern of FORBIDDEN_PATTERNS) {
          if (pattern.test(line)) {
            console.error(
              `[PLACEHOLDER VIOLATION] ${fullPath}:${index + 1} matches forbidden pattern ${pattern}`,
            );
            console.error(`  Line: ${line.trim()}`);
            violations++;
          }
        }
      });
    }
  }
}

console.log('Running placeholder and filler text audit...');
scanDir(process.cwd());

if (violations > 0) {
  console.error(`\nFound ${violations} placeholder violations! Clean them up.`);
  process.exit(1);
} else {
  console.log('All source code passed placeholder checks cleanly.');
  process.exit(0);
}
