import type {
  CultureEntry,
  CultureFile,
  InstallManifest,
  Manifest,
  MemeEntry,
  MemeFile,
  Persona,
  PersonaLexicon,
  Profile,
  RegisterFile,
  ReviewState,
} from './types.ts';

export type SchemaName =
  | 'profile'
  | 'persona'
  | 'culture'
  | 'memes'
  | 'registers'
  | 'lexicon'
  | 'manifest'
  | 'install'
  | 'config';

export class ValidationError extends Error {
  readonly issues: string[];
  readonly source: string;

  constructor(arg1: string | string[], arg2?: string | string[]) {
    let source = 'inline';
    let issues: string[] = [];
    if (typeof arg1 === 'string' && Array.isArray(arg2)) {
      source = arg1;
      issues = arg2;
    } else if (Array.isArray(arg1)) {
      issues = arg1;
      source = typeof arg2 === 'string' ? arg2 : 'inline';
    } else if (typeof arg1 === 'string') {
      source = arg1;
      issues = [arg1];
    }
    super(`Validation failed for ${source}:\n${issues.join('\n')}`);
    this.name = 'ValidationError';
    this.source = source;
    this.issues = issues;
  }
}

export { ValidationError as SchemaValidationError };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isReviewState(value: unknown): value is ReviewState {
  return value === 'pending' || value === 'approved' || value === 'rejected';
}

function validateProfile(data: unknown, issues: string[]): data is Profile {
  if (!isObject(data)) {
    issues.push('root must be an object');
    return false;
  }
  if (data.schema !== 'nonformal.profile/v1') {
    issues.push(`schema must be nonformal.profile/v1, got ${String(data.schema)}`);
  }
  if (!isString(data.id) || !data.id) issues.push('id must be a non-empty string');
  if (!isString(data.persona) || !data.persona) issues.push('persona must be a non-empty string');
  if (!isString(data.locale) || !data.locale) issues.push('locale must be a non-empty string');
  if (data.intensity !== 'low' && data.intensity !== 'medium' && data.intensity !== 'high') {
    issues.push('intensity must be low, medium, or high');
  }
  if (!isString(data.core) || !data.core) issues.push('core must be a non-empty string');
  if (!isString(data.budget_profile) || !data.budget_profile) {
    issues.push('budget_profile must be a non-empty string');
  }
  if (!Array.isArray(data.adapters) || !data.adapters.every(isString)) {
    issues.push('adapters must be an array of strings');
  }
  if (!isObject(data.budgets)) {
    issues.push('budgets must be an object');
  } else {
    if (!isNumber(data.budgets.always_on_tokens))
      issues.push('budgets.always_on_tokens must be a number');
    if (!isNumber(data.budgets.skill_metadata_tokens)) {
      issues.push('budgets.skill_metadata_tokens must be a number');
    }
    if (!isNumber(data.budgets.skill_body_tokens))
      issues.push('budgets.skill_body_tokens must be a number');
    if (!isNumber(data.budgets.reference_tokens_max)) {
      issues.push('budgets.reference_tokens_max must be a number');
    }
  }
  return issues.length === 0;
}

function validatePersona(data: unknown, issues: string[]): data is Persona {
  if (!isObject(data)) {
    issues.push('root must be an object');
    return false;
  }
  if (data.schema !== 'nonformal.persona/v1') {
    issues.push(`schema must be nonformal.persona/v1, got ${String(data.schema)}`);
  }
  if (!isString(data.id) || !data.id) issues.push('id must be a non-empty string');
  if (!isString(data.version) || !data.version) issues.push('version must be a non-empty string');
  if (!isString(data.display_name) || !data.display_name)
    issues.push('display_name must be a non-empty string');
  if (!isString(data.locale) || !data.locale) issues.push('locale must be a non-empty string');
  if (data.intensity !== 'low' && data.intensity !== 'medium' && data.intensity !== 'high') {
    issues.push('intensity must be low, medium, or high');
  }
  if (!isString(data.register) || !data.register)
    issues.push('register must be a non-empty string');
  if (!isString(data.voice) || !data.voice) issues.push('voice must be a non-empty string');
  if (!isString(data.card) || !data.card) issues.push('card must be a non-empty string');
  if (!isString(data.lexicon) || !data.lexicon) issues.push('lexicon must be a non-empty string');
  if (!Array.isArray(data.culture_refs) || !data.culture_refs.every(isString)) {
    issues.push('culture_refs must be an array of strings');
  }
  if (!isObject(data.budgets)) {
    issues.push('budgets must be an object');
  } else {
    if (!isNumber(data.budgets.always_on_tokens))
      issues.push('budgets.always_on_tokens must be a number');
    if (!isNumber(data.budgets.skill_body_tokens))
      issues.push('budgets.skill_body_tokens must be a number');
  }
  if (!isString(data.safety_profile) || !data.safety_profile) {
    issues.push('safety_profile must be a non-empty string');
  }
  if (!isObject(data.reviews)) {
    issues.push('reviews must be an object');
  } else {
    if (!isReviewState(data.reviews.linguistic))
      issues.push('reviews.linguistic must be a valid review state');
    if (!isReviewState(data.reviews.cultural))
      issues.push('reviews.cultural must be a valid review state');
    if (!isReviewState(data.reviews.safety))
      issues.push('reviews.safety must be a valid review state');
    if (data.reviews.reviewed_at !== null && !isString(data.reviews.reviewed_at)) {
      issues.push('reviews.reviewed_at must be a string or null');
    }
  }
  if (!isString(data.expires) || !data.expires) issues.push('expires must be a non-empty string');
  return issues.length === 0;
}

function validateCultureEntry(
  entry: unknown,
  index: number,
  issues: string[],
): entry is CultureEntry {
  if (!isObject(entry)) {
    issues.push(`entries[${index}] must be an object`);
    return false;
  }
  if (!isString(entry.id) || !entry.id)
    issues.push(`entries[${index}].id must be a non-empty string`);
  if (!isString(entry.term) || !entry.term)
    issues.push(`entries[${index}].term must be a non-empty string`);
  if (!isString(entry.gloss) || !entry.gloss)
    issues.push(`entries[${index}].gloss must be a non-empty string`);
  if (
    entry.register !== 'informal' &&
    entry.register !== 'neutral' &&
    entry.register !== 'formal'
  ) {
    issues.push(`entries[${index}].register must be informal, neutral, or formal`);
  }
  if (!Array.isArray(entry.regions) || !entry.regions.every(isString)) {
    issues.push(`entries[${index}].regions must be an array of strings`);
  }
  const validDecay = [
    'global-meme',
    'local-slang',
    'kbbi-colloquial',
    'aging-ironic',
    'dated',
    'banned',
  ];
  if (!isString(entry.decay_class) || !validDecay.includes(entry.decay_class)) {
    issues.push(`entries[${index}].decay_class is invalid`);
  }
  const validOffensive = ['none', 'low', 'medium', 'high', 'banned'];
  if (!isString(entry.offensiveness) || !validOffensive.includes(entry.offensiveness)) {
    issues.push(`entries[${index}].offensiveness is invalid`);
  }
  if (!Array.isArray(entry.contexts) || !entry.contexts.every(isString)) {
    issues.push(`entries[${index}].contexts must be an array of strings`);
  }
  if (!Array.isArray(entry.avoid_when) || !entry.avoid_when.every(isString)) {
    issues.push(`entries[${index}].avoid_when must be an array of strings`);
  }
  if (!isNumber(entry.max_per_response)) {
    issues.push(`entries[${index}].max_per_response must be a number`);
  }
  if (!isString(entry.expires) || !entry.expires) {
    issues.push(`entries[${index}].expires must be a non-empty string`);
  }
  const validConfidence = ['low', 'medium', 'high'];
  if (!isString(entry.confidence) || !validConfidence.includes(entry.confidence)) {
    issues.push(`entries[${index}].confidence is invalid`);
  }
  if (!Array.isArray(entry.sources) || entry.sources.length === 0) {
    issues.push(`entries[${index}].sources must be a non-empty array`);
  } else {
    for (let i = 0; i < entry.sources.length; i++) {
      const src = entry.sources[i];
      if (!isObject(src) || !isString(src.url) || !isString(src.note)) {
        issues.push(`entries[${index}].sources[${i}] must have url and note`);
      }
    }
  }
  return true;
}

function validateCulture(data: unknown, issues: string[]): data is CultureFile {
  if (!isObject(data)) {
    issues.push('root must be an object');
    return false;
  }
  if (data.schema !== 'nonformal.culture.lexicon/v1') {
    issues.push(`schema must be nonformal.culture.lexicon/v1, got ${String(data.schema)}`);
  }
  if (!isString(data.locale) || !data.locale) issues.push('locale must be a non-empty string');
  if (!isString(data.version) || !data.version) issues.push('version must be a non-empty string');
  if (!isString(data.reviewed_by) || !data.reviewed_by)
    issues.push('reviewed_by must be a non-empty string');
  if (!isString(data.next_review) || !data.next_review)
    issues.push('next_review must be a non-empty string');
  if (!Array.isArray(data.entries)) {
    issues.push('entries must be an array');
  } else {
    data.entries.forEach((entry, i) => validateCultureEntry(entry, i, issues));
  }
  return issues.length === 0;
}

function validateMemeEntry(entry: unknown, index: number, issues: string[]): entry is MemeEntry {
  if (!isObject(entry)) {
    issues.push(`entries[${index}] must be an object`);
    return false;
  }
  if (!isString(entry.id) || !entry.id)
    issues.push(`entries[${index}].id must be a non-empty string`);
  if (!isString(entry.pattern) || !entry.pattern) {
    issues.push(`entries[${index}].pattern must be a non-empty string`);
  }
  if (!Array.isArray(entry.context) || !entry.context.every(isString)) {
    issues.push(`entries[${index}].context must be an array of strings`);
  }
  if (!Array.isArray(entry.avoid_when) || !entry.avoid_when.every(isString)) {
    issues.push(`entries[${index}].avoid_when must be an array of strings`);
  }
  if (!isString(entry.expires) || !entry.expires) {
    issues.push(`entries[${index}].expires must be a non-empty string`);
  }
  if (!isString(entry.note) || !entry.note)
    issues.push(`entries[${index}].note must be a non-empty string`);
  return true;
}

function validateMemes(data: unknown, issues: string[]): data is MemeFile {
  if (!isObject(data)) {
    issues.push('root must be an object');
    return false;
  }
  if (data.schema !== 'nonformal.culture.memes/v1') {
    issues.push(`schema must be nonformal.culture.memes/v1, got ${String(data.schema)}`);
  }
  if (!isString(data.version) || !data.version) issues.push('version must be a non-empty string');
  if (!isString(data.reviewed_by) || !data.reviewed_by)
    issues.push('reviewed_by must be a non-empty string');
  if (!isString(data.next_review) || !data.next_review)
    issues.push('next_review must be a non-empty string');
  if (!Array.isArray(data.entries)) {
    issues.push('entries must be an array');
  } else {
    data.entries.forEach((entry, i) => validateMemeEntry(entry, i, issues));
  }
  return issues.length === 0;
}

function validateRegisters(data: unknown, issues: string[]): data is RegisterFile {
  if (!isObject(data)) {
    issues.push('root must be an object');
    return false;
  }
  if (data.schema !== 'nonformal.culture.registers/v1') {
    issues.push(`schema must be nonformal.culture.registers/v1, got ${String(data.schema)}`);
  }
  if (!isString(data.locale) || !data.locale) issues.push('locale must be a non-empty string');
  if (!isString(data.version) || !data.version) issues.push('version must be a non-empty string');
  if (!isString(data.reviewed_by) || !data.reviewed_by)
    issues.push('reviewed_by must be a non-empty string');
  if (!isString(data.next_review) || !data.next_review)
    issues.push('next_review must be a non-empty string');
  return issues.length === 0;
}

function validateLexicon(data: unknown, issues: string[]): data is PersonaLexicon {
  if (!isObject(data)) {
    issues.push('root must be an object');
    return false;
  }
  if (data.schema !== 'nonformal.lexicon/v1') {
    issues.push(`schema must be nonformal.lexicon/v1, got ${String(data.schema)}`);
  }
  if (!isString(data.persona) || !data.persona) issues.push('persona must be a non-empty string');
  if (!isString(data.version) || !data.version) issues.push('version must be a non-empty string');
  if (!Array.isArray(data.entries)) {
    issues.push('entries must be an array');
  } else {
    for (let i = 0; i < data.entries.length; i++) {
      const entry = data.entries[i];
      if (!isObject(entry)) {
        issues.push(`entries[${i}] must be an object`);
        continue;
      }
      if (!isString(entry.culture_ref) || !entry.culture_ref) {
        issues.push(`entries[${i}].culture_ref must be a non-empty string`);
      }
      if (!isString(entry.usage) || !entry.usage) {
        issues.push(`entries[${i}].usage must be a non-empty string`);
      }
      if (entry.max_per_response !== undefined && !isNumber(entry.max_per_response)) {
        issues.push(`entries[${i}].max_per_response must be a number`);
      }
    }
  }
  return issues.length === 0;
}

function validateManifest(data: unknown, issues: string[]): data is Manifest {
  if (!isObject(data)) {
    issues.push('root must be an object');
    return false;
  }
  if (data.schema !== 'nonformal.manifest/v1') {
    issues.push(`schema must be nonformal.manifest/v1, got ${String(data.schema)}`);
  }
  if (!isString(data.generated_by) || !data.generated_by)
    issues.push('generated_by must be a non-empty string');
  if (!isString(data.profile) || !data.profile) issues.push('profile must be a non-empty string');
  if (!isString(data.persona) || !data.persona) issues.push('persona must be a non-empty string');
  if (!isString(data.adapter) || !data.adapter) issues.push('adapter must be a non-empty string');
  if (!isString(data.generated_at) || !data.generated_at)
    issues.push('generated_at must be a non-empty string');
  if (!isString(data.content_hash) || !data.content_hash)
    issues.push('content_hash must be a non-empty string');
  if (!isString(data.tokenizer) || !data.tokenizer)
    issues.push('tokenizer must be a non-empty string');
  if (!isBoolean(data.release)) issues.push('release must be a boolean');
  if (!Array.isArray(data.files)) {
    issues.push('files must be an array');
  } else {
    for (let i = 0; i < data.files.length; i++) {
      const file = data.files[i];
      if (
        !isObject(file) ||
        !isString(file.path) ||
        !isString(file.sha256) ||
        !isNumber(file.tokens)
      ) {
        issues.push(`files[${i}] must have path, sha256, and tokens`);
      }
    }
  }
  if (!isObject(data.budgets)) {
    issues.push('budgets must be an object');
  }
  if (!Array.isArray(data.warnings) || !data.warnings.every(isString)) {
    issues.push('warnings must be an array of strings');
  }
  return issues.length === 0;
}

function validateInstall(data: unknown, issues: string[]): data is InstallManifest {
  if (!isObject(data)) {
    issues.push('root must be an object');
    return false;
  }
  if (data.schema !== 'nonformal.install/v1') {
    issues.push(`schema must be nonformal.install/v1, got ${String(data.schema)}`);
  }
  if (!isString(data.generated_by) || !data.generated_by)
    issues.push('generated_by must be a non-empty string');
  if (!isString(data.profile) || !data.profile) issues.push('profile must be a non-empty string');
  if (!isString(data.persona) || !data.persona) issues.push('persona must be a non-empty string');
  if (!isString(data.adapter) || !data.adapter) issues.push('adapter must be a non-empty string');
  if (!isString(data.installed_at) || !data.installed_at)
    issues.push('installed_at must be a non-empty string');
  if (!Array.isArray(data.files)) {
    issues.push('files must be an array');
  } else {
    for (let i = 0; i < data.files.length; i++) {
      const file = data.files[i];
      if (
        !isObject(file) ||
        !isString(file.path) ||
        !isString(file.sha256) ||
        !isNumber(file.tokens)
      ) {
        issues.push(`files[${i}] must have path, sha256, and tokens`);
      }
    }
  }
  if (!isObject(data.block) || !isString(data.block.path) || !isString(data.block.sha256)) {
    issues.push('block must have path and sha256');
  }
  if (!isBoolean(data.created_claude_md)) issues.push('created_claude_md must be a boolean');
  return issues.length === 0;
}

function validateConfig(data: unknown, issues: string[]): boolean {
  if (!isObject(data)) {
    issues.push('root must be an object');
    return false;
  }
  if (!isString(data.profile) || !data.profile) issues.push('profile must be a non-empty string');
  if (
    !Array.isArray(data.adapters) ||
    data.adapters.length === 0 ||
    !data.adapters.every(isString)
  ) {
    issues.push('adapters must be a non-empty array of strings');
  }
  return issues.length === 0;
}

export function validate(name: SchemaName, data: unknown, source = 'inline', _root?: string): void {
  const issues: string[] = [];
  switch (name) {
    case 'profile':
      validateProfile(data, issues);
      break;
    case 'persona':
      validatePersona(data, issues);
      break;
    case 'culture':
      validateCulture(data, issues);
      break;
    case 'memes':
      validateMemes(data, issues);
      break;
    case 'registers':
      validateRegisters(data, issues);
      break;
    case 'lexicon':
      validateLexicon(data, issues);
      break;
    case 'manifest':
      validateManifest(data, issues);
      break;
    case 'install':
      validateInstall(data, issues);
      break;
    case 'config':
      validateConfig(data, issues);
      break;
    default:
      issues.push(`Unknown schema name: ${String(name)}`);
  }

  if (issues.length > 0) {
    throw new ValidationError(source, issues);
  }
}
