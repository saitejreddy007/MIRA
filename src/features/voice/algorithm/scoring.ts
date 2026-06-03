import type {
  VoiceAnswers,
  ProcessedAnswers,
  DimensionScores,
  CognitivePattern,
  VocabularyFingerprint,
  RhythmPattern,
  AIDimensionAnalysis,
  DimensionResults,
  MCQScoringMap,
} from '../types';

// Legacy MCQ scoring map removed. Deterministic scores are now derived from heuristics on open-ended text.

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function analyzeOpenEndedHeuristics(answers: VoiceAnswers): DimensionScores {
  let warmth = 50;
  let formality = 50;
  let directness = 50;
  let tension = 50;

  const relationship = (answers.client_relationship || '').toLowerCase();
  if (/friend|close|warm|personal|love/i.test(relationship)) { warmth += 10; formality -= 10; }
  if (/professional|strict|formal|corporate/i.test(relationship)) { warmth -= 10; formality += 15; }

  const style = (answers.natural_style || '').toLowerCase();
  if (/short|direct|quick|brief/i.test(style)) { directness += 15; formality -= 5; }
  if (/detail|explain|context/i.test(style)) { directness -= 15; formality += 10; }

  const late = (answers.late_payment_approach || '').toLowerCase();
  if (/firm|strict|immediate|demand/i.test(late)) { tension += 20; directness += 15; }
  if (/gentle|soft|casual|reminder/i.test(late)) { tension -= 15; warmth += 5; }

  return { warmth, formality, directness, tension_tolerance: tension };
}

export function analyzeSampleWarmth(sample: string): number {
  const lower = sample.toLowerCase();
  let warmthScore = 50;
  const hasPersonalGreeting = /^(hey|hi|hello|dear)\s+\w+/i.test(sample.trim());
  if (hasPersonalGreeting) warmthScore += 10;
  if (/hope|appreciate|glad|love|happy|thank|grateful|please/i.test(lower)) warmthScore += 10;
  const personalPronouns = (lower.match(/\b(you|your|we|our|i)\b/g) || []).length;
  if (personalPronouns >= 3) warmthScore += 5;
  const wordCount = sample.split(/\s+/).filter(Boolean).length;
  if (wordCount < 30) warmthScore += 5;
  if (/regards|sincerely|formal|pursuant/i.test(lower)) warmthScore -= 10;
  if (/please find|attached|herewith|per our|kindly/i.test(lower)) warmthScore -= 10;
  if (sample.includes('.')) warmthScore -= 5;
  return clamp(warmthScore);
}

export function calculateDeterministicScores(
  answers: VoiceAnswers,
  processed: ProcessedAnswers
): DimensionScores {
  const heuristics = analyzeOpenEndedHeuristics(answers);

  const hasSample = answers.sample_message.trim().length > 0;
  const hardNoGos = (answers.hard_no_gos || '').toLowerCase();
  const mentionsAvoidAggression =
    hardNoGos.includes('aggress') ||
    hardNoGos.includes('pushy') ||
    hardNoGos.includes('rude') ||
    hardNoGos.includes('mean') ||
    hardNoGos.includes('forceful');

  const q1Length = processed.business_description?.length_category || 'medium';
  const experienceBonus = q1Length === 'long' ? 5 : q1Length === 'medium' ? 2 : 0;

  let warmth = clamp(heuristics.warmth);
  let formality = clamp(heuristics.formality);
  let directness = clamp(heuristics.directness);
  let tension = clamp(heuristics.tension_tolerance + experienceBonus);

  if (hasSample) {
    const sampleWarmth = analyzeSampleWarmth(answers.sample_message);
    warmth = clamp(Math.round(warmth * 0.4 + sampleWarmth * 0.6));
  }

  if (mentionsAvoidAggression) {
    tension = clamp(tension - 15);
    warmth = clamp(warmth + 5);
  }

  const sampleWords = answers.sample_message.split(/\s+/).filter(Boolean).length;
  if (sampleWords > 0 && sampleWords < 20) {
    directness = clamp(directness + 5);
  }

  return { warmth, formality, directness, tension_tolerance: tension };
}

export function mergeScores(
  deterministic: DimensionScores,
  ai: AIDimensionAnalysis,
  hasSample: boolean
): DimensionScores {
  // Since we rely on open-ended text, the AI's semantic extraction is much more accurate 
  // than our regex heuristics. We favor the AI heavily (80%), keeping 20% deterministic 
  // just to ground the extremes.
  const aiWeight = 0.8;
  const detWeight = 0.2;
  
  return {
    warmth: clamp(Math.round(deterministic.warmth * detWeight + ai.warmth * aiWeight)),
    formality: clamp(Math.round(deterministic.formality * detWeight + ai.formality * aiWeight)),
    directness: clamp(Math.round(deterministic.directness * detWeight + ai.directness * aiWeight)),
    tension_tolerance: clamp(
      Math.round(
        deterministic.tension_tolerance * detWeight +
        ai.tension_tolerance * aiWeight
      )
    ),
  };
}

export function classifyCognitivePattern(scores: DimensionScores): CognitivePattern {
  const { warmth, formality, directness, tension_tolerance } = scores;

  const empathy =
    warmth * 0.5 +
    (100 - directness) * 0.3 +
    (100 - tension_tolerance) * 0.2;

  const context =
    (100 - directness) * 0.5 +
    formality * 0.3 +
    (directness > 50 ? 0 : 20) * 0.2;

  const authority =
    formality * 0.4 +
    directness * 0.4 +
    tension_tolerance * 0.2;

  const collaborative =
    warmth * 0.3 +
    (Math.abs(directness - 50) < 20 ? 50 : 0) * 0.4 +
    (100 - formality) * 0.3;

  const patterns: [number, CognitivePattern][] = [
    [empathy, 'empathy_first'],
    [context, 'context_first'],
    [authority, 'authority_first'],
    [collaborative, 'collaborative_first'],
  ];

  patterns.sort((a, b) => b[0] - a[0]);
  return patterns[0][1];
}

export function extractVocabulary(
  answers: VoiceAnswers,
  ai: AIDimensionAnalysis,
  processed: ProcessedAnswers
): VocabularyFingerprint {
  const vocab: VocabularyFingerprint = {
    power_words: [...ai.vocabulary.power_words],
    forbidden_words: [...ai.vocabulary.forbidden_words],
    forbidden_phrases: [...ai.vocabulary.forbidden_phrases],
    industry_terms: [...ai.vocabulary.industry_terms],
    filler_phrases: [...ai.vocabulary.filler_phrases],
    regional_markers: detectRegionalMarkers(
      [answers.business_description, answers.sample_message].join(' ')
    ),
    contraction_preference: ai.vocabulary.contraction_preference,
    sentence_starter_patterns: [...ai.vocabulary.sentence_starter_patterns],
  };

  const noGos = answers.hard_no_gos.toLowerCase();
  const customForbidden: string[] = [];
  if (noGos.includes('per our conversation')) customForbidden.push('per our conversation');
  if (noGos.includes('kindly')) customForbidden.push('kindly');
  if (noGos.includes('please find')) customForbidden.push('please find');
  if (noGos.includes('attached herewith')) customForbidden.push('attached herewith');
  if (noGos.includes('this is to')) customForbidden.push('this is to');

  for (const word of customForbidden) {
    if (!vocab.forbidden_words.includes(word)) {
      vocab.forbidden_words.push(word);
    }
  }

  return vocab;
}

export function detectRegionalMarkers(text: string): string[] {
  if (!text.trim()) return [];
  const markers: string[] = [];
  const lower = text.toLowerCase();
  if (/\brevert\s+back\b/.test(lower)) markers.push('indian_english:revert_back');
  if (/\bdo\s+the\s+needful\b/.test(lower)) markers.push('indian_english:do_the_needful');
  if (/\bprepone\b/.test(lower)) markers.push('indian_english:prepone');
  if (/\bitself\b/.test(lower) && /the\s+\w+\s+itself/.test(lower)) markers.push('indian_english:itself_emphasis');
  if (/\bonly\b/.test(lower) && /that\s+only|this\s+only/.test(lower)) markers.push('indian_english:only_emphasis');
  if (/\bpassed\s+out\b/.test(lower)) markers.push('indian_english:passed_out');
  return markers;
}

export function extractRhythm(
  answers: VoiceAnswers,
  ai: AIDimensionAnalysis,
  scores: DimensionScores
): RhythmPattern {
  const sample = answers.sample_message.trim();
  // Use sample-based calculation when we have 2+ meaningful sentences OR >= 15 words
  const sentences = sample.split(/[.!?;]+/).map((s) => s.trim()).filter((s) => s.length > 0);
  const wordCount = sample.split(/\s+/).filter(Boolean).length;
  if (sentences.length >= 2 || wordCount >= 15) {
    return calculateRhythmFromSample(sample);
  }
  return deriveRhythmFromScores(scores);
}

function calculateRhythmFromSample(text: string): RhythmPattern {
  const sentences = text
    .split(/[.!?;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (sentences.length === 0) {
    return {
      avg_sentence_length: 15,
      variance: 0,
      rhythm_type: 'flowing',
      min_sentence_length: 15,
      max_sentence_length: 15,
      short_long_ratio: 0.5,
    };
  }

  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, l) => sum + (l - avg) ** 2, 0) / lengths.length;
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  const shortCount = lengths.filter((l) => l <= 8).length;
  const longCount = lengths.filter((l) => l >= 20).length;

  let rhythm_type: 'staccato' | 'flowing' | 'mixed';
  const ratio = shortCount / Math.max(lengths.length, 1);
  if (ratio > 0.6) rhythm_type = 'staccato';
  else if (ratio < 0.3) rhythm_type = 'flowing';
  else rhythm_type = 'mixed';

  return {
    avg_sentence_length: Math.round(avg * 10) / 10,
    variance: Math.round(variance * 10) / 10,
    rhythm_type,
    min_sentence_length: min,
    max_sentence_length: max,
    short_long_ratio: Math.round((shortCount / Math.max(longCount, 1)) * 10) / 10,
  };
}

function deriveRhythmFromScores(scores: DimensionScores): RhythmPattern {
  const { directness } = scores;
  if (directness > 70) {
    return {
      avg_sentence_length: 10,
      variance: 5,
      rhythm_type: 'staccato',
      min_sentence_length: 4,
      max_sentence_length: 18,
      short_long_ratio: 3,
    };
  }
  if (directness < 40) {
    return {
      avg_sentence_length: 22,
      variance: 15,
      rhythm_type: 'flowing',
      min_sentence_length: 8,
      max_sentence_length: 40,
      short_long_ratio: 0.3,
    };
  }
  return {
    avg_sentence_length: 15,
    variance: 10,
    rhythm_type: 'mixed',
    min_sentence_length: 5,
    max_sentence_length: 30,
    short_long_ratio: 1,
  };
}

export function runFullScoring(
  answers: VoiceAnswers,
  processed: ProcessedAnswers,
  aiAnalysis: AIDimensionAnalysis
): DimensionResults {
  const deterministic = calculateDeterministicScores(answers, processed);
  const finalScores = {
    warmth: aiAnalysis.warmth,
    formality: aiAnalysis.formality,
    directness: aiAnalysis.directness,
    tension_tolerance: aiAnalysis.tension_tolerance,
  };

  const mergedVocabulary = extractVocabulary(answers, aiAnalysis, processed);
  const mergedRhythm = extractRhythm(answers, aiAnalysis, finalScores);

  return {
    final: {
      ...finalScores,
      cognitive_pattern: aiAnalysis.cognitive_pattern,
    },
    ai_analysis: {
      ...aiAnalysis,
      vocabulary: mergedVocabulary,
      rhythm: mergedRhythm,
    },
    deterministic,
  };
}
