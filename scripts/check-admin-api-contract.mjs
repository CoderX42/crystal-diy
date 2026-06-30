#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const adminApiPath = join(repoRoot, 'apps/admin/apps/web-ele/src/api/crystal/index.ts');
const controllerPaths = [
  'apps/backend/src/modules/catalog/catalog.controller.ts',
  'apps/backend/src/modules/themes/themes.controller.ts',
  'apps/backend/src/modules/designs/designs.controller.ts',
  'apps/backend/src/modules/carts/carts.controller.ts',
  'apps/backend/src/modules/orders/orders.controller.ts',
  'apps/backend/src/modules/payments/payments.controller.ts',
  'apps/backend/src/modules/after-sales/after-sales.controller.ts',
  'apps/backend/src/modules/reviews/reviews.controller.ts',
  'apps/backend/src/modules/bracelets/bracelets.controller.ts',
  'apps/backend/src/modules/thought-cards/thought-cards.controller.ts',
  'apps/backend/src/modules/content/content.controller.ts',
  'apps/backend/src/modules/users/users.controller.ts',
  'apps/backend/src/modules/admin-users/admin-users.controller.ts',
  'apps/backend/src/modules/rbac/rbac.controller.ts',
  'apps/backend/src/modules/dashboard/dashboard.controller.ts',
  'apps/backend/src/modules/file/file.controller.ts',
  'apps/backend/src/modules/audit/audit.controller.ts',
];

const adminApiSource = readFileSync(adminApiPath, 'utf8');
const frontendPaths = new Set([...adminApiSource.matchAll(/['`]((?:\/admin\/)[^'`?]*)['`]/g)].map((match) => normalizePath(match[1])));
const backendRoutes = new Set();

for (const relativePath of controllerPaths) {
  const source = readFileSync(join(repoRoot, relativePath), 'utf8');
  collectRoutes(source, relativePath).forEach((route) => backendRoutes.add(route));
}

const intentionallyUnhandled = new Set([
  '/admin/auth/login',
  '/admin/auth/me',
]);

const missingBackend = [...frontendPaths].filter((path) => !routeExists(path, backendRoutes));
const missingFrontend = [...backendRoutes]
  .filter((path) => path.startsWith('/admin/'))
  .filter((path) => !intentionallyUnhandled.has(path))
  .filter((path) => !frontendCovers(path, frontendPaths));

if (missingBackend.length || missingFrontend.length) {
  console.error('Admin API contract check failed');
  if (missingBackend.length) console.error(`Frontend paths missing backend routes:\n${missingBackend.map((path) => `  - ${path}`).join('\n')}`);
  if (missingFrontend.length) console.error(`Backend admin routes missing frontend API wrappers:\n${missingFrontend.map((path) => `  - ${path}`).join('\n')}`);
  process.exit(1);
}

console.log(`Admin API contract passed: ${frontendPaths.size} frontend paths, ${backendRoutes.size} backend routes`);

function collectRoutes(source, relativePath) {
  const routes = [];
  const classBlocks = source.split(/(?=@ApiTags|@Controller)/g);
  for (const block of classBlocks) {
    if (!block.includes('@Controller')) continue;
    const controllerPrefix = getControllerPrefix(block);
    const methodRegex = /@(Get|Post|Patch|Delete|Put)\(([^)]*)\)[\s\S]*?\n\s*(?:async\s+)?[A-Za-z0-9_]+\s*\(/g;
    let match;
    while ((match = methodRegex.exec(block))) {
      const methodPath = parseDecoratorPath(match[2]);
      const route = normalizePath(`/${controllerPrefix}/${methodPath}`);
      routes.push(route);
    }
  }
  if (!routes.length) {
    console.warn(`No routes collected from ${relative(repoRoot, join(repoRoot, relativePath))}`);
  }
  return routes;
}

function getControllerPrefix(block) {
  const match = block.match(/@Controller\(([^)]*)\)/);
  if (!match) return '';
  return parseDecoratorPath(match[1]);
}

function parseDecoratorPath(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const stringMatch = trimmed.match(/^['`]([^'`]*)['`]$/);
  return stringMatch ? stringMatch[1] : '';
}

function normalizePath(path) {
  return path
    .replace(/\$\{[^}]+}/g, ':param')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '')
    .replace(/\/:(\w+)/g, '/:param') || '/';
}

function routeExists(frontendPath, routes) {
  return [...routes].some((route) => pathsCompatible(frontendPath, route));
}

function frontendCovers(route, frontendPathSet) {
  return [...frontendPathSet].some((frontendPath) => pathsCompatible(frontendPath, route));
}

function pathsCompatible(left, right) {
  const leftParts = normalizePath(left).split('/').filter(Boolean);
  const rightParts = normalizePath(right).split('/').filter(Boolean);
  if (leftParts.length !== rightParts.length) return false;
  return leftParts.every((part, index) => part === rightParts[index] || part === ':param' || rightParts[index] === ':param');
}
