import test from 'node:test';
import assert from 'node:assert/strict';
import { countTokens, TOKENIZER_PROFILE } from '../src/tokenizer.ts';

test('tokenizer profile is nonformal-heuristic-v1', () => {
  assert.equal(TOKENIZER_PROFILE, 'nonformal-heuristic-v1');
});

test('countTokens returns 0 for empty or whitespace-only strings', () => {
  assert.equal(countTokens(''), 0);
  assert.equal(countTokens('   '), 0);
  assert.equal(countTokens('\n\t'), 0);
});

test('countTokens estimates basic Indonesian and Javanese words', () => {
  const basic = countTokens('aku kamu dia');
  assert.equal(basic, 3);

  const affixes = countTokens('mengembangkan pembelajaran');
  assert.ok(affixes >= 3);
});

test('countTokens handles punctuation increments', () => {
  const withoutPunct = countTokens('halo dunia');
  const withPunct = countTokens('halo, dunia! apa kabar?');
  assert.ok(withPunct > withoutPunct);
});

test('countTokens segments camelCase and snake_case code identifiers', () => {
  const camel = countTokens('parseUserResponse');
  assert.equal(camel, 6);

  const snake = countTokens('get_current_active_user');
  assert.equal(snake, 8);
});
