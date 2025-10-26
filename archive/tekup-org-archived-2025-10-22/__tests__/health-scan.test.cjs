const { spawn } = require('node:child_process');
const { writeFileSync, mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

function runScan(args = [], { expectCode = 0 } = {}) {
  return new Promise((resolve, reject) => {
    const ps = spawn(process.execPath, ['scripts/health-scan.mjs', ...args], { cwd: process.cwd() });
    let out = '';
    let err = '';
    ps.stdout.on('data', d => (out += d.toString()));
    ps.stderr.on('data', d => (err += d.toString()));
    ps.on('close', code => {
      try {
        if (code !== expectCode) {
          return reject(new Error(`Unexpected exit code ${code}\nSTDOUT:${out}\nSTDERR:${err}`));
        }
        resolve({ code, out, err });
      } catch (e) {
        reject(e);
      }
    });
  });
}

describe('health-scan script', () => {
  jest.setTimeout(20000);

  test('basic JSON output works', async () => {
    const { out } = await runScan(['--json', '--timeout', '800']);
    const json = JSON.parse(out);
    expect(json).toHaveProperty('services');
    expect(Array.isArray(json.services)).toBe(true);
    expect(json).toHaveProperty('healthy');
  });

  test('strict mode returns exit code 2 when failing service provided', async () => {
    // Use an unreachable localhost port to force failure quickly (timeout kept low)
    await expect(
      runScan(['--json', '--url', 'http://localhost:65500/health', '--timeout', '300', '--strict'], { expectCode: 2 })
    ).resolves.toBeTruthy();
  });

  test('tcp-only mode skips http services and counts skipped', async () => {
    // Create temporary registry with one tcp service pointing to unlikely open port
    const dir = mkdtempSync(join(tmpdir(), 'health-scan-test-'));
    const registryPath = join(dir, 'registry.yaml');
    writeFileSync(
      registryPath,
      `services:\n  testdb:\n    protocol: tcp\n    environments:\n      development: 65432\n`
    );
    const { out } = await runScan(['--json', '--tcp-only', '--registry', registryPath, '--timeout', '300']);
    try {
      const json = JSON.parse(out);
      expect(json.tcpOnly).toBe(true);
      // Only the tcp service should be attempted (not skipped)
      expect(json.services.some(s => s.service === 'testdb')).toBe(true);
      expect(json.services.filter(s => s.skipped).length).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
