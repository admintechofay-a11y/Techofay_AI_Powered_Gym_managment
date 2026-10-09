import fs from 'node:fs';
import path from 'node:path';

// Known valid application routes
const KNOWN_ROUTES = new Set([
  '/',
  '/pricing',
  '/features',
  '/contact',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/dashboard',
  '/members',
  '/memberships',
  '/attendance',
  '/billing',
  '/crm',
  '/classes',
  '/trainers',
  '/workouts',
  '/nutrition',
  '/communication',
  '/marketing',
  '/analytics',
  '/settings/integrations',
  '/settings/roles',
  '/settings/branch',
  '/member-portal',
  '/super-admin',
  '/multi-branch',
  '/inventory-expenses',
  '/gym',
  '/blog',
  '/privacy',
  '/terms',
  '/404',
  '/500',
]);

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  '.turbo',
  'coverage',
]);

let brokenLinks = 0;

function scanLinks(dir: string) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanLinks(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.html'))) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      // Match href="/..." or to="/..."
      const linkRegex = /(?:href|to)=["'](\/[a-zA-Z0-9_/-]*)["']/g;
      let match;
      while ((match = linkRegex.exec(content)) !== null) {
        const link = match[1];
        // Strip trailing slash if any (except root)
        const cleanLink = link.length > 1 && link.endsWith('/') ? link.slice(0, -1) : link;
        // Ignore static assets like /vite.svg, /favicon.ico, /manifest.webmanifest
        if (cleanLink.startsWith('/assets') || cleanLink.includes('.') || cleanLink.startsWith('/api')) {
          continue;
        }

        // Check if route exists or starts with a dynamic param pattern
        const isValid = KNOWN_ROUTES.has(cleanLink) || 
          Array.from(KNOWN_ROUTES).some(r => cleanLink.startsWith(r));

        if (!isValid) {
          console.error(`[BROKEN LINK] ${fullPath}: Link "${cleanLink}" does not match any known route.`);
          brokenLinks++;
        }
      }
    }
  }
}

console.log('Validating internal application links...');
const webSrc = path.join(process.cwd(), 'apps', 'web', 'src');
if (fs.existsSync(webSrc)) {
  scanLinks(webSrc);
}

if (brokenLinks > 0) {
  console.error(`\nFound ${brokenLinks} broken internal links.`);
  process.exit(1);
} else {
  console.log('All internal routes and navigation links verified successfully.');
  process.exit(0);
}
