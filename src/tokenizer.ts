export const TOKENIZER_PROFILE = 'nonformal-heuristic-v1' as const;

const AFFIX_REGEX = /^(ber|me|di|ke|ter|pe|se|ku|mu)|(kan|an|i|nya|lah|kah)$/i;
const PUNCT_REGEX = /[^\w\s]/g;

export function countTokens(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  const words = text.trim().split(/\s+/);
  let total = 0;
  for (const raw of words) {
    const clean = raw.replace(PUNCT_REGEX, '');
    if (!clean) continue;
    if (clean.includes('_')) {
      const parts = clean.split('_').filter(Boolean);
      total += Math.max(1, parts.length) * 2;
    } else {
      const camelParts = clean.split(/(?<=[a-z0-9])(?=[A-Z])/).filter(Boolean);
      if (camelParts.length > 1) {
        total += camelParts.length * 2;
      } else if (AFFIX_REGEX.test(clean) && clean.length > 3) {
        total += 1.5;
      } else {
        total += 1;
      }
    }
  }
  const punctCount = (text.match(PUNCT_REGEX) ?? []).length;
  total += punctCount * 0.25;
  return Math.ceil(total);
}
