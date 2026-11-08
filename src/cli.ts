#!/usr/bin/env node
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { adapterIds, type HarnessScope } from './adapters.ts';
import { build, BuildError, doctor, install, InstallError, uninstall, update } from './engine.ts';

function findPackageRoot(): string {
  let current = dirname(fileURLToPath(import.meta.url));
  while (current !== dirname(current)) {
    if (existsSync(join(current, 'package.json')) && existsSync(join(current, 'profiles'))) {
      return current;
    }
    current = dirname(current);
  }
  return process.cwd();
}

function formatReport(result: ReturnType<typeof build>): string {
  const lines = [
    `profile: ${result.manifest.profile}`,
    `persona: ${result.manifest.persona}`,
    `adapter: ${result.manifest.adapter}`,
    `tokenizer: ${result.manifest.tokenizer}`,
    `content_hash: ${result.manifest.content_hash}`,
  ];
  for (const [name, report] of Object.entries(result.manifest.budgets)) {
    lines.push(
      `${name}: ${report.tokens}/${report.target} (${report.status}; hard cap ${report.hardCap})`,
    );
  }
  if (result.warnings.length > 0) {
    lines.push('warnings:');
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`);
    }
  }
  return lines.join('\n');
}

function printUsage(): void {
  const text = `nonformal — ultra-lightweight Indonesian personality layer for AI coding agents

Usage:
  nonformal install [--profile <id>] [--adapter <id>] [--target <dir>] [--scope workspace|global] [--force] [--dry-run]
  nonformal update [--target <dir>] [--force] [--dry-run]
  nonformal uninstall [--target <dir>] [--force] [--dry-run]
  nonformal doctor [--target <dir>]
  nonformal build [--profile <id>] [--adapter <id>] [--out <dir>] [--release]
  nonformal measure [--profile <id>] [--adapter <id>]
  nonformal list

Adapters: ${adapterIds().join(' | ')}
`;
  console.log(text.trimEnd());
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  const command = args[0];
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printUsage();
    return;
  }

  const packageRoot = findPackageRoot();

  if (command === 'list') {
    const personasDir = join(packageRoot, 'personas');
    const personas = existsSync(personasDir) ? readdirSync(personasDir) : [];
    console.log('Available Personas:');
    for (const p of personas) {
      console.log(`  - ${p}`);
    }
    console.log('\nAvailable Adapters:');
    for (const a of adapterIds()) {
      console.log(`  - ${a}${a === 'antigravity' ? ' (default)' : ''}`);
    }
    return;
  }

  const options = {
    profile: { type: 'string' as const, default: 'rusuh-id' },
    adapter: { type: 'string' as const },
    target: { type: 'string' as const, default: '.' },
    out: { type: 'string' as const },
    scope: { type: 'string' as const, default: 'workspace' },
    force: { type: 'boolean' as const, default: false },
    'dry-run': { type: 'boolean' as const, default: false },
    release: { type: 'boolean' as const, default: false },
  };

  const parsed = parseArgs({
    args: args.slice(1),
    options,
    allowPositionals: true,
  });

  const adapter = parsed.values.adapter ?? (command === 'install' ? 'antigravity' : 'antigravity');
  const scope = (parsed.values.scope ?? 'workspace') as HarnessScope;

  if (command === 'build' || command === 'measure') {
    const result = build({
      root: packageRoot,
      profileId: parsed.values.profile ?? 'rusuh-id',
      adapterId: adapter,
      outDir: parsed.values.out,
      release: parsed.values.release,
      write: command === 'build',
      scope,
    });
    console.log(formatReport(result));
    if (command === 'build') {
      console.log(`out: ${result.outDir}`);
    }
    return;
  }

  if (command === 'install') {
    const result = install({
      sourceRoot: packageRoot,
      targetRoot: parsed.values.target ?? '.',
      profileId: parsed.values.profile ?? 'rusuh-id',
      adapterId: adapter,
      scope,
      dryRun: parsed.values['dry-run'],
      force: parsed.values.force,
    });
    console.log(
      `${result.dryRun ? 'Dry run: would install' : 'Installed'} ${result.manifest.profile} into ${result.targetRoot} (${scope} scope)`,
    );
    console.log(
      `files: ${result.manifest.files.length} managed file(s) + ${result.manifest.block.path} block`,
    );
    for (const warning of result.warnings) {
      console.warn(`warning: ${warning}`);
    }
    return;
  }

  if (command === 'update') {
    const result = update({
      sourceRoot: packageRoot,
      targetRoot: parsed.values.target ?? '.',
      dryRun: parsed.values['dry-run'],
      force: parsed.values.force,
    });
    console.log(`Updated ${result.manifest.profile} in ${result.targetRoot}`);
    return;
  }

  if (command === 'uninstall') {
    const result = uninstall({
      targetRoot: parsed.values.target ?? '.',
      dryRun: parsed.values['dry-run'],
      force: parsed.values.force,
    });
    console.log(`Uninstalled ${result.profile} from ${parsed.values.target ?? '.'}`);
    return;
  }

  if (command === 'doctor') {
    const report = doctor({ targetRoot: parsed.values.target ?? '.' });
    if (report.ok) {
      console.log('nonformal doctor: all clean');
      return;
    }
    console.error('Doctor report errors:');
    for (const err of report.errors) {
      console.error(`- ${err}`);
    }
    for (const w of report.warnings) {
      console.warn(`- ${w}`);
    }
    process.exit(1);
  }

  printUsage();
}

function isMainEntry(): boolean {
  const invoked = process.argv[1];
  if (!invoked) return false;
  return fileURLToPath(import.meta.url) === resolve(invoked);
}

if (isMainEntry()) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
