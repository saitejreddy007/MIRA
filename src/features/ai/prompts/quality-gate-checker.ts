import type { VoiceConstitution } from '@/features/voice/types';

export const QUALITY_GATE_SYSTEM = `You are MIRA's compliance checker. Check if a generated message violates any Voice Constitution rules.

Return ONLY valid JSON with:
- passed: boolean (true if message is compliant)
- violations: string[] (list of specific violations, empty if passed)

Check these rules in order:
1. Forbidden words — scan message for any words in constitution.vocabulary.forbidden_words
2. Forbidden phrases — scan for any phrases in constitution.vocabulary.forbidden_phrases
3. Greeting — first word must match constitution.surface_rules.greeting pattern
4. Signoff — last line must match constitution.surface_rules.signoff pattern
5. Emoji — if emoji_allowed is false, check no emojis present
6. CTA count — if cta_style is single_soft or single_firm, ensure only one CTA
7. Sentence rhythm — average sentence length should not deviate more than 75% from baseline
8. Tone alignment — overall tone should match cognitive_pattern

Flag specific violations with exact details. If passed is true, violations must be empty array.`;

export function buildQualityGatePrompt(
  message: string,
  constitution: VoiceConstitution
): string {
  return `Voice Constitution:
${JSON.stringify(constitution, null, 2)}

Message to check:
"${message}"

Check all rules and return { passed: boolean, violations: string[] }.`;
}
