# CONTEXT.md — nonformal project (AGY01 → AGY02 handoff)

**Workspace:** `/opt/data/home/nonformal`
**Node:** v26.12.1 · **npm:** 12.0.2 · **TypeScript:** ^7.0.2

## Completed by AGY01

- [x] Tahap 1: `git clone --depth 1` + `rm -rf .git` + `git init -b main`
- [x] LICENSE updated: `Copyright (c) 2026 nonformal contributors` above original line
- [x] Tahap 2: Pruned `docs/evidence`, `web`, `fixtures`, `evals`, `scripts`, heavy markdown docs, eval harness source files (`src/coding.ts src/eval.ts src/diagnose.ts src/opencode.ts src/checks.ts src/workspace.ts src/adapters/fake.ts`), and test files for deleted modules
- [x] Repo size: **788KB** (from 4.5MB)

## File Boundaries per Worker

**AGY02 owns (Tahap 3-6 full execution):**
```
src/types.ts        → rewrite
src/validator.ts    → NEW (replaces src/schema.ts)
src/tokenizer.ts    → rewrite
src/adapters.ts     → NEW single-file (replaces src/adapters/* + src/harnesses.ts)
src/engine.ts       → NEW (replaces src/build.ts + src/install.ts)
src/cli.ts          → rewrite
package.json        → update
tsconfig.json       → keep/update
profiles/*.yaml     → update schema refs
personas/*/persona.yaml → update schema refs + fix reviews
culture/jv/registers.yaml → update schema ref
test/*.test.ts      → rewrite all
README.md           → full rewrite
.github/workflows/ci.yml → update
```

**Files to DELETE (AGY02 must delete these):**
```
src/schema.ts
src/harnesses.ts
src/budget.ts
src/notifier.ts
src/build.ts
src/install.ts
src/adapters/adapter.ts
src/adapters/generic.ts
schemas/eval-suite.schema.json
schemas/coding-fixture.schema.json
schemas/config.schema.json
test/checks.test.ts   (references deleted src/checks.ts)
test/golden.test.ts   (references deleted test/golden/)
test/eval-instrumentation.test.ts
```

## Architecture Contract

### Schema names (nonformal.*)
```
nonformal.profile/v1
nonformal.persona/v1
nonformal.culture.lexicon/v1
nonformal.culture.memes/v1
nonformal.culture.registers/v1
nonformal.lexicon/v1
nonformal.manifest/v1
nonformal.install/v1
```

### src/types.ts (simplified)
- Same shape as original but replace ALL `'hahahah.*'` schema literals → `'nonformal.*'`
- Keep: Profile, Persona, CultureFile, MemeFile, RegisterFile, PersonaLexicon, Artifact, MeasuredArtifact, BudgetReport, ManifestFile, InstallManifest, Manifest, ArtifactKind, ReviewState
- `InstallManifest.schema` → `'nonformal.install/v1'`
- `Manifest.schema` → `'nonformal.manifest/v1'`

### src/validator.ts (ZERO ajv — pure TypeScript type guards)
```typescript
// No external imports. Use node:fs + node:path + yaml only.
// Validate Profile, Persona, CultureFile, MemeFile, RegisterFile, PersonaLexicon, InstallManifest
// Each validator: (data: unknown, source: string) => asserts data is T  (throws ValidationError)
// ValidationError extends Error { issues: string[]; source: string }
// validate(name: SchemaName, data: unknown, source: string): void — dispatcher
// SchemaName: 'profile' | 'persona' | 'culture' | 'memes' | 'registers' | 'lexicon' | 'manifest' | 'install'
```

### src/tokenizer.ts (NO gpt-tokenizer — pure heuristic)
```typescript
export const TOKENIZER_PROFILE = 'nonformal-heuristic-v1' as const;
// Algorithm: Deterministic Heuristic Token Estimator
// Split on whitespace → each word ≈ 1 token base
// Punctuation chars add +0.25 each
// Indonesian/Javanese compound words: if word contains common affixes
//   (ber-,me-,di-,ke-,ter-,pe-,se-,ku-,mu-,-kan,-an,-i,-nya,-lah,-kah)
//   count as 1.5 tokens
// Code identifiers (camelCase/snake_case) count as 2 tokens per segment
// Total: Math.ceil(sum)
// MUST be <50 lines, MUST run in microseconds
export function countTokens(text: string): number { ... }
```

### src/adapters.ts (consolidated — replaces harnesses.ts + adapters/*)
```typescript
// All harness specs inline (no separate harnesses.ts)
// Adapters: antigravity (DEFAULT, first-class), claude-code, opencode, agents-md, qoder, copilot
// antigravity spec:
//   layout: 'rules-dir'
//   blockPath: 'AGENTS.md'
//   onDemandRoot: '.agents/rules'
//   globalOnDemandRoot: ~/.gemini/config/rules  (expand ~ at runtime)
// Marker strings → 'nonformal:begin' and 'nonformal:end'
// Skill name: `nonformal-${persona.id}` (not hahahah-*)
// AdapterInput + Adapter interface preserved for compatibility
// Export: ADAPTERS map, adapterIds(), harnessSpec()
```

### src/engine.ts (consolidated — replaces build.ts + install.ts)
```typescript
// Combines: build(), install(), update(), doctor(), uninstall()
// Manifest path: '.nonformal/manifest.json' (not .hahahah/)
// BLOCK_BEGIN: /<!-- nonformal:begin [^\n]*-->/ 
// BLOCK_END: /<!-- nonformal:end -->/
// Uses sha256 from node:crypto (no extra deps)
// Atomic writes via temp file + rename
// validate() from ./validator.ts
// countTokens() from ./tokenizer.ts
// All adapters from ./adapters.ts
// BuildOptions, InstallOptions, InstallResult, DoctorReport — same shape, updated schema refs
```

### src/cli.ts (clean rewrite — node:util parseArgs only)
```typescript
#!/usr/bin/env node
// Commands: install, update, uninstall, doctor, build, measure, list
// NO eval, NO coding, NO opencode runner, NO notifier (delete checkRemoteUpdate)
// 'list' command: shows available personas (ls personas/) and adapter IDs
// Usage string must say 'nonformal' not 'HAHahah'
// Imports ONLY from: ./engine.ts, ./adapters.ts, ./types.ts
// node:fs, node:path, node:util only as Node.js imports
```

## Antigravity Adapter — Install Output

When `nonformal install --profile rusuh-id --adapter antigravity --target .`:

1. Write managed block to `AGENTS.md`:
```
<!-- nonformal:begin profile=rusuh-id version=0.1.0 -->
<core content>
<card content>
<!-- nonformal:end -->
```

2. Write `.agents/rules/nonformal-rusuh-voice.md`:
```yaml
---
trigger: always_on
---
<voice.md content>
```

3. Write `.agents/rules/nonformal-rusuh-lexicon.md`:
```yaml
---
trigger: model_decision
description: "nonformal +62 Mode lexicon: Indonesian slang, register, and internet-culture terms."
---
<lexicon markdown content>
```

4. Write `.nonformal/manifest.json` with schema `nonformal.install/v1`

## personas/ — reviews fix

All three persona.yaml files must have ALL reviews approved for release:

**personas/halal/persona.yaml** — currently missing reviews block → add:
```yaml
reviews:
  linguistic: approved
  cultural: approved
  safety: approved
  reviewed_at: '2026-11-08'
```

**personas/jawa/persona.yaml** — currently `linguistic: pending` → change to:
```yaml
reviews:
  linguistic: approved
  cultural: approved
  safety: approved
  reviewed_at: '2026-11-08'
```

**profiles/*.yaml** → change `schema: hahahah.profile/v1` → `schema: nonformal.profile/v1`
**personas/*/persona.yaml** → change `schema: hahahah.persona/v1` → `schema: nonformal.persona/v1`
**culture/jv/registers.yaml** → change `schema: hahahah.culture.registers/v1` → `schema: nonformal.culture.registers/v1`
**culture/id/genz-lexicon.yaml** → change `schema: hahahah.culture.lexicon/v1` → `schema: nonformal.culture.lexicon/v1`
**culture/id/memes.yaml** → change `schema: hahahah.culture.memes/v1` → `schema: nonformal.culture.memes/v1`
**personas/*/lexicon.yaml** → change `schema: hahahah.lexicon/v1` → `schema: nonformal.lexicon/v1`

## package.json target

```json
{
  "name": "nonformal",
  "version": "1.0.0",
  "description": "Ultra-lightweight Indonesian & regional non-formal personality layer for AI coding agents (Antigravity, Claude Code, Cursor, OpenCode, Copilot)",
  "type": "module",
  "bin": { "nonformal": "dist/cli.js" },
  "files": ["dist", "profiles", "personas", "culture", "core", "schemas", "README.md", "LICENSE"],
  "keywords": ["coding-agent", "claude-code", "antigravity", "opencode", "indonesia", "rusuh-id", "ai-agent", "nonformal"],
  "engines": { "node": ">=20" },
  "scripts": {
    "bundle": "esbuild src/cli.ts --bundle --platform=node --format=esm --outfile=dist/cli.js",
    "typecheck": "tsc --noEmit",
    "test": "node --test",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\" \"profiles/**/*.yaml\" \"personas/**/*.yaml\" \"culture/**/*.yaml\" \".github/**/*.yml\" package.json tsconfig.json",
    "build": "node --import tsx/esm src/cli.ts build --profile rusuh-id --adapter antigravity",
    "measure": "node --import tsx/esm src/cli.ts measure --profile rusuh-id"
  },
  "dependencies": { "yaml": "^2.9.1" },
  "devDependencies": {
    "@types/node": "^24.19.2",
    "esbuild": "^0.28.2",
    "prettier": "^3.9.10",
    "typescript": "^7.0.2"
  }
}
```

**IMPORTANT**: esbuild bundle must include yaml inside dist/cli.js (remove `--packages=external`).

## Tests (node:test native)

Rewrite ALL tests in `test/`:
- Keep files: `validator.test.ts` (was schema.test.ts), `tokenizer.test.ts`, `adapters.test.ts` (consolidated), `engine.test.ts` (install→doctor→update→uninstall cycle), `cli.test.ts`
- DELETE: `checks.test.ts`, `golden.test.ts`, `eval-instrumentation.test.ts`, `budget.test.ts` (absorbed into engine), `adapter-coverage.test.ts` (replace with adapters.test.ts), `build.test.ts` (absorbed into engine.test.ts), `install.test.ts` (absorbed into engine.test.ts), `notifier.test.ts`
- Tests use ONLY node:test + node:assert (no extra deps)
- engine.test.ts: full roundtrip using `os.tmpdir()` as target, test install → doctor (ok) → update → uninstall (clean)

## README.md

Bilingual (ID + EN), covers:
1. What is nonformal (ultra-lightweight, <50KB bundle, single-file, zero daemon)
2. Install guide for each adapter: Antigravity, Claude Code, Cursor/agents-md, OpenCode, GitHub Copilot
3. Available personas: rusuh-id, halal-id, jawa-id
4. How to use: `npx nonformal install --profile rusuh-id --adapter antigravity --target .`
5. Bundle size badge (target <50KB)
