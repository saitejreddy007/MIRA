import type { VoiceAnswers, ProcessedAnswers } from '@/features/voice/types';

export const DIMENSION_EXTRACTOR_SYSTEM = `You are MIRA's voice analysis engine. Extract communication style dimensions from a business owner's open-ended answers.

Return ONLY valid JSON. No explanation. No preamble. No markdown.

Extract these dimensions and return scores 0-100:
- warmth: How much personal warmth vs professional distance (0=purely transactional, 100=highly personal)
- formality: How formal vs casual (0=completely casual, 100=strictly formal)
- directness: How direct vs context-building (0=very indirect, 100=extremely direct)
- tension_tolerance: How comfortable with direct money confrontation (0=extremely uncomfortable, 100=very comfortable)

Also extract:
- cognitive_pattern: one of "empathy_first", "context_first", "authority_first", "collaborative_first"
- vocabulary: { power_words, forbidden_words, forbidden_phrases, industry_terms, filler_phrases, regional_markers, contraction_preference (boolean), sentence_starter_patterns }
- rhythm: { avg_sentence_length (number), variance (number), rhythm_type ("staccato"|"flowing"|"mixed"), min_sentence_length, max_sentence_length, short_long_ratio }

IMPORTANT: All answers are open-ended descriptions, not MCQ selections. Read the full meaning and intent behind each answer — do not extract literal words as rules. For example, if someone says their greeting is "Hi or Hey depending on how well I know them", that signals casual warmth, not a literal instruction to always start with "Hi".`;

export function buildDimensionExtractorPrompt(
  answers: VoiceAnswers,
  processed: ProcessedAnswers
): string {
  return `Analyze this business owner's communication style from their open-ended answers and extract voice dimensions.

Q1 - How they describe their business: "${answers.business_description}"
Q2 - How they see their client relationship: "${answers.client_relationship}"
Q3 - How they naturally write: "${answers.natural_style}"
Q4 - Their preferred greeting style: "${answers.greeting}"
Q5 - Their preferred sign-off style: "${answers.sign_off}"
Q6 - How they approach late payments: "${answers.late_payment_approach}"
Q7 - What they want to avoid: "${answers.hard_no_gos}"
Q8 - A real message they've sent: "${answers.sample_message}"
Q9 - Do they use emojis: "${answers.use_emojis}"

Key phrases extracted from their answers: ${JSON.stringify(getAllKeyPhrases(processed))}

Return complete dimension extraction JSON.`;
}

function getAllKeyPhrases(processed: ProcessedAnswers): string[] {
  const all: string[] = [];
  for (const val of Object.values(processed)) {
    all.push(...val.key_phrases);
  }
  return [...new Set(all)];
}
