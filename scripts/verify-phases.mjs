#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const runSmoke = process.env.RUN_SMOKE === '1' || process.env.RUN_SMOKE === 'true';
const phases = [
  { phase: 1, name: '基础设施与登录权限', evidence: ['pnpm test:backend', 'pnpm build:backend', 'pnpm typecheck:admin'] },
  { phase: 2, name: '素材 SKU 库存主题规则', evidence: ['pnpm test:backend', 'pnpm check:admin-api'] },
  { phase: 3, name: 'DIY 报价可制作购物车', evidence: ['pnpm test:backend', runSmoke ? 'pnpm smoke:api' : 'RUN_SMOKE=1 pnpm verify:phases'] },
  { phase: 4, name: '订单支付退款物流售后评价', evidence: ['pnpm test:backend', runSmoke ? 'pnpm smoke:api' : 'RUN_SMOKE=1 pnpm verify:phases'] },
  { phase: 5, name: '手串册念卡海报内容看板', evidence: ['pnpm test:backend', runSmoke ? 'pnpm smoke:api' : 'RUN_SMOKE=1 pnpm verify:phases'] },
];

const commands = [
  ['pnpm', ['test:backend']],
  ['pnpm', ['build:backend']],
  ['pnpm', ['check:admin-api']],
  ['pnpm', ['typecheck:admin']],
];

if (runSmoke) commands.push(['pnpm', ['smoke:api']]);

console.log('Phase verification plan');
for (const phase of phases) {
  console.log(`- Phase ${phase.phase} ${phase.name}: ${phase.evidence.join(' + ')}`);
}
console.log(runSmoke ? 'RUN_SMOKE enabled: real HTTP smoke will run.' : 'RUN_SMOKE disabled: skipping real HTTP smoke. Set RUN_SMOKE=1 with backend running.');

for (const [command, args] of commands) {
  await run(command, args);
}

const backendMain = join(process.cwd(), 'apps/backend/dist/main.js');
if (!existsSync(backendMain)) {
  throw new Error(`Backend build artifact missing: ${backendMain}`);
}

console.log('Phase verification passed');

function run(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n$ ${[command, ...args].join(' ')}`);
    const child = spawn(command, args, { cwd: process.cwd(), env: process.env, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) return resolve();
      reject(new Error(`${command} ${args.join(' ')} failed with ${signal ? `signal ${signal}` : `exit code ${code}`}`));
    });
  });
}
