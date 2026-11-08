import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, doctor, install, uninstall, update, MANIFEST_PATH } from '../src/engine.ts';

const root = process.cwd();

test('build creates valid manifest and measured artifacts', () => {
  const result = build({
    root,
    profileId: 'rusuh-id',
    adapterId: 'antigravity',
    write: false,
  });

  assert.equal(result.manifest.schema, 'nonformal.manifest/v1');
  assert.equal(result.manifest.profile, 'rusuh-id');
  assert.equal(result.manifest.adapter, 'antigravity');
  assert.ok(result.artifacts.length > 0);
});

test('engine full roundtrip: install -> doctor -> update -> uninstall', () => {
  const target = mkdtempSync(join(tmpdir(), 'nonformal-engine-test-'));
  try {
    const installResult = install({
      sourceRoot: root,
      targetRoot: target,
      profileId: 'rusuh-id',
      adapterId: 'antigravity',
    });

    assert.equal(installResult.manifest.schema, 'nonformal.install/v1');
    assert.equal(installResult.manifest.profile, 'rusuh-id');
    assert.equal(installResult.manifest.adapter, 'antigravity');

    const agentsMdPath = join(target, 'AGENTS.md');
    assert.ok(existsSync(agentsMdPath));
    const agentsMd = readFileSync(agentsMdPath, 'utf8');
    assert.match(agentsMd, /<!-- nonformal:begin profile=rusuh-id/);
    assert.match(agentsMd, /<!-- nonformal:end -->/);

    const voiceRulePath = join(target, '.agents/rules/nonformal-rusuh-voice.md');
    assert.ok(existsSync(voiceRulePath));

    const manifestPath = join(target, MANIFEST_PATH);
    assert.ok(existsSync(manifestPath));

    const docReport = doctor({ targetRoot: target });
    assert.equal(docReport.ok, true);
    assert.deepEqual(docReport.errors, []);

    const updateResult = update({
      sourceRoot: root,
      targetRoot: target,
    });
    assert.equal(updateResult.manifest.profile, 'rusuh-id');

    const uninstallManifest = uninstall({ targetRoot: target });
    assert.equal(uninstallManifest.profile, 'rusuh-id');

    assert.equal(existsSync(manifestPath), false);
    assert.equal(existsSync(voiceRulePath), false);
    assert.equal(existsSync(agentsMdPath), false);
    assert.equal(existsSync(join(target, '.agents')), false);
    assert.equal(existsSync(join(target, '.nonformal')), false);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});
