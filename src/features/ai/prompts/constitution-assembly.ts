import type { VoiceAnswers, DimensionResults, ConfidenceResult } from '@/features/voice/types';

export const CONSTITUTION_ASSEMBLY_SYSTEM = `You are MIRA's voice constitution builder. Given extracted voice dimensions and a business owner's open-ended answers, assemble a complete Voice Constitution JSON.

Return ONLY valid JSON. No explanation. No preamble. No markdown.

The constitution must include:
1. business_identity: industry, client_type, culture, business_age (inferred from their description)
2. voice_dimensions: all scores + cognitive_pattern from the dimension results
3. surface_rules: greeting, signoff, emoji_allowed, contraction_preference, punctuation_style
4. vocabulary: power_words, forbidden_words, forbidden_phrases, industry_terms, filler_phrases, regional_markers, contraction_preference, sentence_starter_patterns
5. structural_rules: opening_pattern, reasoning_style, bad_news_delivery, cta_style, paragraph_length
6. rhythm: avg_sentence_length, variance, rhythm_type, min_sentence_length, max_sentence_length, short_long_ratio
7. tension_rules: day1_approach, escalation_speed, consequence_mention, max_pressure_level

CRITICAL RULES:
- surface_rules.greeting must be ONE of: "Hey", "Hi", "Hello", "Dear" — infer the CLOSEST match from the owner's description of how they greet people. Do NOT copy their literal words if they wrote a full sentence.
- surface_rules.signoff must be ONE of: "Thanks", "Regards", "Cheers", "Name" — infer from their sign-off description.
- surface_rules.emoji_allowed must be true ONLY if they explicitly state they use emojis, or if they naturally use emojis in their sample message.
- All fields describe STYLE TENDENCIES and DEFAULTS, not rigid scripts. The generated messages should feel natural, not templated.
- vocabulary.forbidden_words and forbidden_phrases must faithfully capture everything the owner said they want to avoid.
- Be precise — this constitution will drive autonomous invoice follow-ups.`;

export function buildConstitutionAssemblyPrompt(
  answers: VoiceAnswers,
  dimensions: DimensionResults,
  confidence: ConfidenceResult
): string {
  return `Build a complete Voice Constitution from this business owner's open-ended answers and extracted dimensions.

OWNER'S OWN WORDS:
- How they describe their business: "${answers.business_description}"
- How they see their client relationship: "${answers.client_relationship}"
- How they naturally write: "${answers.natural_style}"
- Their preferred greeting style (described in their words): "${answers.greeting}"
- Their preferred sign-off style (described in their words): "${answers.sign_off}"
- How they approach late payments: "${answers.late_payment_approach}"
- What they want to avoid in messages: "${answers.hard_no_gos}"
- A real message they wrote (most authentic sample): "${answers.sample_message}"
- Do they use emojis: "${answers.use_emojis}"

EXTRACTED DIMENSION SCORES (0-100):
- warmth: ${dimensions.final.warmth}
- formality: ${dimensions.final.formality}
- directness: ${dimensions.final.directness}
- tension_tolerance: ${dimensions.final.tension_tolerance}
- cognitive_pattern: ${dimensions.final.cognitive_pattern}

AI-analyzed vocabulary signals: ${JSON.stringify(dimensions.ai_analysis.vocabulary)}
AI-analyzed rhythm signals: ${JSON.stringify(dimensions.ai_analysis.rhythm)}

Confidence: ${confidence.score}/100 — ${confidence.flag}

Assemble the VoiceConstitution JSON. Infer style tendencies from their descriptions — do not copy their literal words into rule fields.`;
}
