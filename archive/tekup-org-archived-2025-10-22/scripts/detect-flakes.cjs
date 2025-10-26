#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const repeatsArgIndex = args.findIndex(a => a === '--repeats');
const repeats = repeatsArgIndex >= 0 ? parseInt(args[repeatsArgIndex + 1], 10) : 5;

const resultsDir = path.resolve(process.cwd(), 'reports', 'flakes');
fs.mkdirSync(resultsDir, { recursive: true });

const unstable = new Map(); // testPath#title -> { passes, fails }

for (let i = 1; i <= repeats; i++) {
  const seed = `${Date.now()}_${i}`;
  const outFile = path.join(resultsDir, `jest-run-${i}.json`);
  const cmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const res = spawnSync(cmd, ['exec', 'jest', '--json', `--outputFile=${outFile}`], {
    stdio: 'inherit',
    env: { ...process.env, JEST_SEED: seed }
  });
  if (res.status !== 0) {
    // Continue to collect; failures are acceptable for flake detection
  }
  const run = JSON.parse(fs.readFileSync(outFile, 'utf-8'));
  for (const t of run.testResults || []) {
    for (const a of t.assertionResults || []) {
      const key = `${t.name}#${a.fullName}`;
      const entry = unstable.get(key) || { passes: 0, fails: 0 };
      if (a.status === 'passed') entry.passes++;
      else if (a.status === 'failed') entry.fails++;
      unstable.set(key, entry);
    }
  }
}

const flakes = [];
unstable.forEach((v, k) => {
  if (v.passes > 0 && v.fails > 0) flakes.push({ test: k, ...v });
});

const report = { repeats, flakes, total: unstable.size, timestamp: new Date().toISOString() };
const out = path.join(resultsDir, 'flake-report.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`Flake detection report written to ${out}`);
if (flakes.length > 0 && process.env.CI) {
  console.error(`Detected ${flakes.length} flaky tests`);
  process.exit(1);
}
