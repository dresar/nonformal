import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();

test('cli list command prints available personas and adapters', () => {
  const result = spawnSync(process.execPath, ['src/cli.ts', 'list'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Available Personas:/);
  assert.match(result.stdout, /rusuh/);
  assert.match(result.stdout, /Available Adapters:/);
  assert.match(result.stdout, /antigravity \(default\)/);
});

test('cli measure command reports token budgets', () => {
  const result = spawnSync(process.execPath, ['src/cli.ts', 'measure', '--profile', 'rusuh-id'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /profile: rusuh-id/);
  assert.match(result.stdout, /always_on:/);
  assert.match(result.stdout, /tokenizer: nonformal-heuristic-v1/);
});

test('cli build command writes manifest and artifacts', () => {
  const out = mkdtempSync(join(tmpdir(), 'nonformal-cli-build-'));
  try {
    const result = spawnSync(
      process.execPath,
      ['src/cli.ts', 'build', '--profile', 'rusuh-id', '--adapter', 'fake', '--out', out],
      { cwd: root, encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.ok(existsSync(join(out, 'manifest.json')));
    assert.ok(existsSync(join(out, 'always-on.md')));
    const manifest = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8')) as {
      schema: string;
      adapter: string;
    };
    assert.equal(manifest.schema, 'nonformal.manifest/v1');
    assert.equal(manifest.adapter, 'fake');
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test('cli install, doctor, and uninstall lifecycle', () => {
  const target = mkdtempSync(join(tmpdir(), 'nonformal-cli-install-'));
  try {
    const installResult = spawnSync(
      process.execPath,
      [
        'src/cli.ts',
        'install',
        '--profile',
        'rusuh-id',
        '--adapter',
        'antigravity',
        '--target',
        target,
      ],
      { cwd: root, encoding: 'utf8' },
    );
    assert.equal(installResult.status, 0, installResult.stderr);
    assert.ok(existsSync(join(target, 'AGENTS.md')));
    assert.ok(existsSync(join(target, '.agents/rules/nonformal-rusuh-voice.md')));

    const doctorResult = spawnSync(process.execPath, ['src/cli.ts', 'doctor', '--target', target], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(doctorResult.status, 0, doctorResult.stderr);
    assert.match(doctorResult.stdout, /nonformal doctor: all clean/);

    const updateResult = spawnSync(process.execPath, ['src/cli.ts', 'update', '--target', target], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(updateResult.status, 0, updateResult.stderr);
    assert.match(updateResult.stdout, /Updated rusuh-id/);

    const uninstallResult = spawnSync(
      process.execPath,
      ['src/cli.ts', 'uninstall', '--target', target],
      { cwd: root, encoding: 'utf8' },
    );
    assert.equal(uninstallResult.status, 0, uninstallResult.stderr);
    assert.equal(existsSync(join(target, 'AGENTS.md')), false);
    assert.equal(existsSync(join(target, '.nonformal/manifest.json')), false);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});
