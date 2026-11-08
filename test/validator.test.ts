import test from 'node:test';
import assert from 'node:assert/strict';
import { validate, ValidationError } from '../src/validator.ts';

const validProfile = {
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
};

const validPersona = {
  schema: 'nonformal.persona/v1',
  id: 'rusuh',
  version: '0.1.0',
  display_name: 'RUSUH',
  locale: 'id',
  intensity: 'high',
  register: 'informal-id',
  voice: 'voice.md',
  card: 'card.md',
  lexicon: 'lexicon.yaml',
  culture_refs: ['id/genz-lexicon.yaml'],
  budgets: { always_on_tokens: 400, skill_body_tokens: 1500 },
  safety_profile: 'id-default',
  reviews: {
    linguistic: 'approved',
    cultural: 'approved',
    safety: 'approved',
    reviewed_at: '2026-11-08',
  },
  expires: '2027-05-01',
};

const validCulture = {
  schema: 'nonformal.culture.lexicon/v1',
  locale: 'id',
  version: '2026.11',
  reviewed_by: 'approved',
  next_review: '2027-02-01',
  entries: [
    {
      id: 'id-gabut',
      term: 'gabut',
      gloss: 'idle',
      register: 'informal',
      regions: ['national'],
      decay_class: 'kbbi-colloquial',
      offensiveness: 'none',
      contexts: ['casual_work'],
      avoid_when: ['incident'],
      max_per_response: 1,
      expires: '2027-11-01',
      confidence: 'high',
      sources: [{ url: 'https://kbbi.kemendikdasmen.go.id/entri/gabut', note: 'KBBI' }],
    },
  ],
};

const validMemes = {
  schema: 'nonformal.culture.memes/v1',
  version: '2026.11',
  reviewed_by: 'approved',
  next_review: '2027-02-01',
  entries: [
    {
      id: 'meme-1',
      pattern: 'test pattern',
      context: ['casual'],
      avoid_when: ['serious'],
      expires: '2027-11-01',
      note: 'test note',
    },
  ],
};

const validRegisters = {
  schema: 'nonformal.culture.registers/v1',
  locale: 'jv',
  version: '2026.11',
  reviewed_by: 'approved',
  next_review: '2027-02-01',
};

const validLexicon = {
  schema: 'nonformal.lexicon/v1',
  persona: 'rusuh',
  version: '0.1.0',
  entries: [{ culture_ref: 'id-gabut', usage: 'idle state', max_per_response: 1 }],
};

const validManifest = {
  schema: 'nonformal.manifest/v1',
  generated_by: 'nonformal@1.0.0',
  profile: 'rusuh-id',
  persona: 'rusuh',
  adapter: 'antigravity',
  generated_at: '2026-11-08T00:00:00.000Z',
  content_hash: 'abcdef',
  tokenizer: 'nonformal-heuristic-v1',
  release: true,
  files: [{ path: 'AGENTS.md', sha256: '123', tokens: 100 }],
  budgets: {
    always_on: { target: 400, hardCap: 600, tokens: 300, status: 'ok' },
    skill_metadata: { target: 90, hardCap: 120, tokens: 50, status: 'ok' },
    skill_body: { target: 1500, hardCap: 2000, tokens: 1200, status: 'ok' },
    references: { target: 4000, hardCap: 5000, tokens: 3000, status: 'ok' },
  },
  warnings: [],
};

const validInstall = {
  schema: 'nonformal.install/v1',
  generated_by: 'nonformal@1.0.0',
  profile: 'rusuh-id',
  persona: 'rusuh',
  adapter: 'antigravity',
  installed_at: '2026-11-08T00:00:00.000Z',
  files: [{ path: 'test.md', sha256: 'abc', tokens: 50 }],
  block: { path: 'AGENTS.md', sha256: 'def' },
  created_claude_md: false,
};

test('accepts valid profile and rejects invalid schema or missing field', () => {
  assert.doesNotThrow(() => validate('profile', validProfile));
  assert.throws(() => validate('profile', { ...validProfile, schema: 'invalid' }), ValidationError);
  assert.throws(() => validate('profile', { ...validProfile, id: '' }), ValidationError);
  assert.throws(
    () => validate('profile', { ...validProfile, persona: undefined }),
    ValidationError,
  );
});

test('accepts valid persona and rejects invalid review status', () => {
  assert.doesNotThrow(() => validate('persona', validPersona));
  assert.throws(
    () =>
      validate('persona', {
        ...validPersona,
        reviews: { ...validPersona.reviews, safety: 'unknown' },
      }),
    ValidationError,
  );
  assert.throws(() => validate('persona', { ...validPersona, id: undefined }), ValidationError);
});

test('accepts valid culture and rejects empty sources or invalid fields', () => {
  assert.doesNotThrow(() => validate('culture', validCulture));
  const badCulture = {
    ...validCulture,
    entries: [{ ...validCulture.entries[0], sources: [] }],
  };
  assert.throws(() => validate('culture', badCulture), ValidationError);
});

test('accepts valid memes and registers', () => {
  assert.doesNotThrow(() => validate('memes', validMemes));
  assert.throws(() => validate('memes', { ...validMemes, schema: 'bad' }), ValidationError);
  assert.doesNotThrow(() => validate('registers', validRegisters));
  assert.throws(() => validate('registers', { ...validRegisters, locale: '' }), ValidationError);
});

test('accepts valid lexicon, manifest, install', () => {
  assert.doesNotThrow(() => validate('lexicon', validLexicon));
  assert.throws(
    () => validate('lexicon', { ...validLexicon, entries: 'not-array' }),
    ValidationError,
  );
  assert.doesNotThrow(() => validate('manifest', validManifest));
  assert.throws(() => validate('manifest', { ...validManifest, schema: 'bad' }), ValidationError);
  assert.doesNotThrow(() => validate('install', validInstall));
  assert.throws(() => validate('install', { ...validInstall, block: undefined }), ValidationError);
});
