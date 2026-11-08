import test from 'node:test';
import assert from 'node:assert/strict';
import { ADAPTERS, adapterIds, harnessSpec, type AdapterInput } from '../src/adapters.ts';

const mockInput: AdapterInput = {
  profile: {
    schema: 'nonformal.profile/v1',
    id: 'rusuh-id',
    persona: 'rusuh',
    locale: 'id',
    intensity: 'high',
    core: '>=0.1.0 <0.2.0',
    budget_profile: 'default-id',
    adapters: ['antigravity', 'claude-code'],
    budgets: {
      always_on_tokens: 400,
      skill_metadata_tokens: 90,
      skill_body_tokens: 1500,
      reference_tokens_max: 4000,
    },
  },
  persona: {
    schema: 'nonformal.persona/v1',
    id: 'rusuh',
    version: '0.1.0',
    display_name: '+62 Mode',
    locale: 'id',
    intensity: 'high',
    register: 'informal-id',
    voice: '# Voice instructions\nAdaptive dynamics.',
    card: 'Persona card summary.',
    lexicon: 'lexicon.yaml',
    culture_refs: [],
    budgets: { always_on_tokens: 400, skill_body_tokens: 1500 },
    safety_profile: 'id-default',
    reviews: {
      linguistic: 'approved',
      cultural: 'approved',
      safety: 'approved',
      reviewed_at: '2026-11-08',
    },
    expires: '2027-05-01',
  },
  core: 'Core always on rules.',
  card: 'Card summary content.',
  voice: 'Voice detailed rules.',
  lexiconMarkdown: '# Lexicon markdown',
  coreRefs: [{ path: '10-safety.md', content: 'Safety policy.' }],
  cultureRefs: [{ path: 'id/humor.md', content: 'Humor boundaries.' }],
};

test('all required adapter IDs are registered', () => {
  const ids = adapterIds();
  assert.ok(ids.includes('antigravity'));
  assert.ok(ids.includes('claude-code'));
  assert.ok(ids.includes('opencode'));
  assert.ok(ids.includes('agents-md'));
  assert.ok(ids.includes('qoder'));
  assert.ok(ids.includes('copilot'));
  assert.ok(ids.includes('fake'));
});

test('antigravity harness spec and rules-dir rendering', () => {
  const spec = harnessSpec('antigravity');
  assert.ok(spec);
  assert.equal(spec.layout, 'rules-dir');
  assert.equal(spec.blockPath, 'AGENTS.md');
  assert.equal(spec.onDemandRoot, '.agents/rules');

  const adapter = ADAPTERS['antigravity']!();
  const artifacts = adapter.render(mockInput);

  const block = artifacts.find((a) => a.path === 'AGENTS.md');
  assert.ok(block);
  assert.match(block.content, /<!-- nonformal:begin profile=rusuh-id version=0.1.0 -->/);
  assert.match(block.content, /<!-- nonformal:end -->/);

  const voice = artifacts.find((a) => a.path === '.agents/rules/nonformal-rusuh-voice.md');
  assert.ok(voice);
  assert.match(voice.content, /^---\ntrigger: always_on\n---\n/);

  const lexicon = artifacts.find((a) => a.path === '.agents/rules/nonformal-rusuh-lexicon.md');
  assert.ok(lexicon);
  assert.match(lexicon.content, /trigger: model_decision/);

  const coreRef = artifacts.find(
    (a) => a.path === '.agents/rules/nonformal-rusuh-core-10-safety.md',
  );
  assert.ok(coreRef);
  assert.match(coreRef.content, /trigger: model_decision/);

  assert.equal(
    artifacts.some((a) => a.path.includes('skills')),
    false,
  );
});

test('claude-code renders skill-tree layout', () => {
  const adapter = ADAPTERS['claude-code']!();
  const artifacts = adapter.render(mockInput);

  const block = artifacts.find((a) => a.path === 'CLAUDE.md');
  assert.ok(block);
  assert.match(block.content, /<!-- nonformal:begin profile=rusuh-id/);

  const skill = artifacts.find((a) => a.path === '.claude/skills/nonformal-rusuh/SKILL.md');
  assert.ok(skill);
  assert.match(skill.content, /name: nonformal-rusuh/);
});

test('copilot renders folded inline layout', () => {
  const adapter = ADAPTERS['copilot']!();
  const artifacts = adapter.render(mockInput);
  assert.equal(artifacts.length, 1);
  assert.equal(artifacts[0]!.path, '.github/copilot-instructions.md');
  assert.match(artifacts[0]!.content, /folded: this target has no on-demand layer/);
});
