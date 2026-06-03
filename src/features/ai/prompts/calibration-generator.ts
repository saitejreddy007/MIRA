import type { DimensionScores, VoiceAnswers } from '@/features/voice/types';

export const CALIBRATION_GENERATOR_SYSTEM = `You are MIRA's message calibration engine. Generate two invoice follow-up messages from the same voice profile but differing on exactly one aspect.

Return ONLY valid JSON with keys "message_a" and "message_b". No explanation. No preamble. No markdown.

Each message must be 2-4 sentences. Both messages must:
- Use the specified greeting and signoff
- Be about the same invoice follow-up scenario
- Differ ONLY on the specified dimension or style

For NUMERIC dimensions (warmth, formality, directness, tension_tolerance):
  Message A should be the dimension at the lower value.
  Message B should be the dimension at the higher value.

For CATEGORICAL dimensions (opening_style, paragraph_length):
  Follow the specific instructions for Message A vs Message B.`;

export function buildCalibrationGeneratorPrompt(
  dimension: string,
  calibrationType: 'numeric' | 'categorical',
  scores: DimensionScores,
  context: string,
  answers: VoiceAnswers
): string {
  const greetingMap: Record<string, string> = {
    hey: 'Hey [Name]',
    hi: 'Hi [Name]',
    hello: 'Hello [Name]',
    dear: 'Dear [Name]',
  };
  const signoffMap: Record<string, string> = {
    thanks: 'Thanks / Thank you',
    regards: 'Regards / Warm regards',
    cheers: 'Cheers',
    'just my name': '[Just your name]',
  };
  const greeting = greetingMap[answers.greeting] || 'Hi [Name]';
  const signoff = signoffMap[answers.sign_off] || 'Thanks';

  let instruction = '';

  if (calibrationType === 'numeric') {
    const dimensionKey = dimension as keyof DimensionScores;
    const base = scores[dimensionKey];
    const aValue = Math.max(0, base - 15);
    const bValue = Math.min(100, base + 15);

    instruction = `Dimension to vary: ${dimension}
Message A ${dimension}: ${aValue}
Message B ${dimension}: ${bValue}

Generate Message A (${dimension}=${aValue}) and Message B (${dimension}=${bValue}) for an invoice follow-up email. Each 2-4 sentences.`;
  } else if (dimension === 'opening_style') {
    instruction = `Dimension to vary: Opening style
Message A: Uses a warmth-first opening — acknowledge the person warmly before mentioning payment.
Message B: Uses a context-first opening — set the scene or background before mentioning payment.

Generate Message A (warmth-first opening) and Message B (context-first opening) for an invoice follow-up email. Each 2-4 sentences.`;
  } else if (dimension === 'paragraph_length') {
    instruction = `Dimension to vary: Paragraph length / sentence rhythm
Message A: Uses short, punchy sentences (under 12 words each).
Message B: Uses medium-length, flowing sentences (12-20 words each).

Generate Message A (short sentences) and Message B (medium flowing sentences) for an invoice follow-up email. Each 2-4 sentences.`;
  }

  return `Voice Constitution baseline scores:
- warmth: ${scores.warmth}
- formality: ${scores.formality}
- directness: ${scores.directness}
- tension_tolerance: ${scores.tension_tolerance}

Surface rules: Use greeting "${greeting}" and signoff "${signoff}"

${instruction}

Scenario context: ${context}

Return: { "message_a": "...", "message_b": "..." }`;
}
