import type { Artifact, Persona, Profile } from './types.ts';

export type HarnessLayout = 'skill-tree' | 'rules-dir' | 'fold';
export type HarnessScope = 'workspace' | 'global';

export interface HarnessSpec {
  id: string;
  layout: HarnessLayout;
  blockPath: string;
  onDemandRoot: string | null;
  globalOnDemandRoot: string | null;
  alwaysOnTarget: number | null;
  alwaysOnHardCap: number | null;
}

export interface AdapterInput {
  profile: Profile;
  persona: Persona;
  core: string;
  card: string;
  voice: string;
  lexiconMarkdown: string;
  coreRefs: Array<{ path: string; content: string }>;
  cultureRefs: Array<{ path: string; content: string }>;
}

export interface Adapter {
  readonly id: string;
  render(input: AdapterInput): Artifact[];
}

export const HARNESS_SPECS: HarnessSpec[] = [
  {
    id: 'antigravity',
    layout: 'rules-dir',
    blockPath: 'AGENTS.md',
    onDemandRoot: '.agents/rules',
    globalOnDemandRoot: '~/.gemini/config/rules',
    alwaysOnTarget: null,
    alwaysOnHardCap: null,
  },
  {
    id: 'claude-code',
    layout: 'skill-tree',
    blockPath: 'CLAUDE.md',
    onDemandRoot: '.claude/skills',
    globalOnDemandRoot: null,
    alwaysOnTarget: null,
    alwaysOnHardCap: null,
  },
  {
    id: 'opencode',
    layout: 'skill-tree',
    blockPath: 'AGENTS.md',
    onDemandRoot: '.claude/skills',
    globalOnDemandRoot: null,
    alwaysOnTarget: null,
    alwaysOnHardCap: null,
  },
  {
    id: 'agents-md',
    layout: 'rules-dir',
    blockPath: 'AGENTS.md',
    onDemandRoot: '.cursor/rules',
    globalOnDemandRoot: null,
    alwaysOnTarget: null,
    alwaysOnHardCap: null,
  },
  {
    id: 'qoder',
    layout: 'fold',
    blockPath: 'AGENTS.md',
    onDemandRoot: null,
    globalOnDemandRoot: null,
    alwaysOnTarget: null,
    alwaysOnHardCap: null,
  },
  {
    id: 'copilot',
    layout: 'fold',
    blockPath: '.github/copilot-instructions.md',
    onDemandRoot: null,
    globalOnDemandRoot: null,
    alwaysOnTarget: 2650,
    alwaysOnHardCap: 3000,
  },
];

export function harnessSpec(id: string): HarnessSpec | undefined {
  return HARNESS_SPECS.find((spec) => spec.id === id);
}

function marker(input: AdapterInput): string {
  return `<!-- nonformal:begin profile=${input.profile.id} version=${input.persona.version} -->`;
}

function block(parts: string[]): string {
  return `${parts.join('\n')}\n`;
}

function alwaysOnBlock(input: AdapterInput, extra: string[] = []): string {
  return block([
    marker(input),
    input.core.trim(),
    '',
    input.card.trim(),
    ...extra,
    '<!-- nonformal:end -->',
  ]);
}

export class GenericAdapter implements Adapter {
  readonly id: string;
  readonly scope: HarnessScope;
  private readonly spec: HarnessSpec;

  constructor(spec: HarnessSpec, scope: HarnessScope = 'workspace') {
    this.spec = spec;
    this.id = spec.id;
    this.scope = scope;
  }

  private resolveRoot(): string {
    if (this.scope === 'global') {
      const globalRoot = this.spec.globalOnDemandRoot ?? this.spec.onDemandRoot ?? '';
      return globalRoot.replace(/^~\/\.gemini\//, '').replace(/^~\//, '');
    }
    return this.spec.onDemandRoot ?? '';
  }

  render(input: AdapterInput): Artifact[] {
    const skillName = `nonformal-${input.persona.id}`;
    const description = `nonformal ${input.persona.display_name} persona for ${input.persona.locale} coding work. Use when this voice is active; includes humor boundaries, serious-mode rules, and culture references.`;
    const root = this.resolveRoot();

    if (this.spec.layout === 'fold') {
      return [
        {
          path: this.spec.blockPath,
          content: alwaysOnBlock(input, [
            '',
            '<!-- folded: this target has no on-demand layer, so the voice ships inline -->',
            '',
            input.voice.trim(),
          ]),
          kind: 'always_on',
        },
      ];
    }

    if (this.spec.layout === 'rules-dir') {
      const rules: Artifact[] = [
        {
          path: `${root}/${skillName}-voice.md`,
          content: block(['---', 'trigger: always_on', '---', '', input.voice.trim()]),
          kind: 'skill_body',
        },
        {
          path: `${root}/${skillName}-lexicon.md`,
          content: block([
            '---',
            'trigger: model_decision',
            `description: "nonformal ${input.persona.display_name} lexicon: Indonesian slang, register, and internet-culture terms."`,
            '---',
            '',
            input.lexiconMarkdown.trim(),
          ]),
          kind: 'reference',
        },
        ...input.coreRefs.map((reference) => ({
          path: `${root}/${skillName}-core-${reference.path}`,
          content: block([
            '---',
            'trigger: model_decision',
            `description: "nonformal core policy ${reference.path}: identity, safety, decision, efficiency rules that outrank persona tone."`,
            '---',
            '',
            reference.content.trim(),
          ]),
          kind: 'reference' as const,
        })),
        ...input.cultureRefs.map((reference) => ({
          path: `${root}/${skillName}-culture-${reference.path}`,
          content: block([
            '---',
            'trigger: model_decision',
            `description: "nonformal culture reference ${reference.path}: Indonesian humor boundaries, memes, registers, religious-expression etiquette."`,
            '---',
            '',
            reference.content.trim(),
          ]),
          kind: 'reference' as const,
        })),
      ];
      return [
        {
          path: this.spec.blockPath,
          content: alwaysOnBlock(input, [
            '',
            `Voice detail, lexicon, kebijakan penuh, dan referensi budaya ada di \`${root}/\` sebagai rules; yang selalu termuat cuma voice.`,
          ]),
          kind: 'always_on',
        },
        ...rules,
      ];
    }

    const references: Artifact[] = [
      {
        path: `${root}/${skillName}/references/lexicon.md`,
        content: `${input.lexiconMarkdown.trim()}\n`,
        kind: 'reference',
      },
      ...input.coreRefs.map((reference) => ({
        path: `${root}/${skillName}/references/core/${reference.path}`,
        content: `${reference.content.trim()}\n`,
        kind: 'reference' as const,
      })),
      ...input.cultureRefs.map((reference) => ({
        path: `${root}/${skillName}/references/culture/${reference.path}`,
        content: `${reference.content.trim()}\n`,
        kind: 'reference' as const,
      })),
    ];
    return [
      { path: this.spec.blockPath, content: alwaysOnBlock(input), kind: 'always_on' },
      {
        path: `${root}/${skillName}/SKILL.md`,
        content: block([
          '---',
          `name: ${skillName}`,
          `description: ${JSON.stringify(description)}`,
          '---',
          '',
          input.voice.trim(),
          '',
          'Load `references/lexicon.md` for terms, `references/core/*.md` for the full identity, safety, decision, and efficiency policies, and `references/culture/*` for humor boundaries and regional guidance. Read a reference only when the task needs it.',
        ]),
        kind: 'skill_body',
      },
      ...references,
    ];
  }
}

export class FakeAdapter implements Adapter {
  readonly id = 'fake';
  render(input: AdapterInput): Artifact[] {
    return [
      {
        path: 'always-on.md',
        content: `<!-- nonformal:begin profile=${input.profile.id} version=${input.persona.version} -->\n${input.core.trim()}\n\n${input.card.trim()}\n<!-- nonformal:end -->\n`,
        kind: 'always_on',
      },
    ];
  }
}

export const ADAPTERS: Record<string, (scope?: HarnessScope) => Adapter> = {
  antigravity: (scope = 'workspace') => new GenericAdapter(harnessSpec('antigravity')!, scope),
  'claude-code': (scope = 'workspace') => new GenericAdapter(harnessSpec('claude-code')!, scope),
  opencode: (scope = 'workspace') => new GenericAdapter(harnessSpec('opencode')!, scope),
  'agents-md': (scope = 'workspace') => new GenericAdapter(harnessSpec('agents-md')!, scope),
  qoder: (scope = 'workspace') => new GenericAdapter(harnessSpec('qoder')!, scope),
  copilot: (scope = 'workspace') => new GenericAdapter(harnessSpec('copilot')!, scope),
  fake: () => new FakeAdapter(),
};

export function adapterIds(): string[] {
  return Object.keys(ADAPTERS);
}
