export interface VoiceAnswers {
  business_description: string;
  client_relationship: string;
  natural_style: string;
  greeting: string;
  sign_off: string;
  late_payment_approach: string;
  hard_no_gos: string;
  sample_message: string;
  use_emojis: string;
}

export interface DimensionScores {
  warmth: number;
  formality: number;
  directness: number;
  tension_tolerance: number;
}

export type CognitivePattern =
  | 'empathy_first'
  | 'context_first'
  | 'authority_first'
  | 'collaborative_first';

export interface VocabularyFingerprint {
  power_words: string[];
  forbidden_words: string[];
  forbidden_phrases: string[];
  industry_terms: string[];
  filler_phrases: string[];
  regional_markers: string[];
  contraction_preference: boolean;
  sentence_starter_patterns: string[];
}

export interface RhythmPattern {
  avg_sentence_length: number;
  variance: number;
  rhythm_type: 'staccato' | 'flowing' | 'mixed';
  min_sentence_length: number;
  max_sentence_length: number;
  short_long_ratio: number;
}

export interface SurfaceRules {
  greeting: 'Hey' | 'Hi' | 'Hello' | 'Dear';
  signoff: 'Thanks' | 'Regards' | 'Cheers' | 'Name';
  emoji_allowed: boolean;
  contraction_preference: boolean;
  punctuation_style: 'minimal' | 'standard' | 'heavy';
}

export interface StructuralRules {
  opening_pattern: 'warmth_first' | 'context_first' | 'ask_first';
  reasoning_style: 'show' | 'state';
  bad_news_delivery: 'soften' | 'direct';
  cta_style: 'single_soft' | 'single_firm' | 'multiple';
  paragraph_length: 'short' | 'medium' | 'long';
}

export interface TensionRules {
  day1_approach: 'casual' | 'friendly' | 'context' | 'firm';
  escalation_speed: 'slow' | 'medium' | 'fast';
  consequence_mention: 'never' | 'late' | 'always';
  max_pressure_level: number;
}

export interface VoiceConstitution {
  version: string;
  created_at: string;
  business_identity: {
    industry: string;
    client_type: string;
    culture: string;
    business_age: string;
  };
  voice_dimensions: DimensionScores & {
    cognitive_pattern: CognitivePattern;
  };
  surface_rules: SurfaceRules;
  vocabulary: VocabularyFingerprint;
  structural_rules: StructuralRules;
  rhythm: RhythmPattern;
  tension_rules: TensionRules;
}

export interface CalibrationRoundData {
  round: number;
  dimension: string;
  calibration_type: 'numeric' | 'categorical';
  context: string;
  message_a: string;
  message_b: string;
  selected?: 'A' | 'B';
}

export interface ConfidenceResult {
  score: number;
  flag: string;
  suggestion: string;
}

export interface ComplianceResult {
  passed: boolean;
  violations: string[];
  regenerated?: boolean;
}

export interface AIDimensionAnalysis {
  warmth: number;
  formality: number;
  directness: number;
  tension_tolerance: number;
  cognitive_pattern: CognitivePattern;
  vocabulary: VocabularyFingerprint;
  rhythm: RhythmPattern;
}

export interface DimensionResults {
  final: DimensionScores & { cognitive_pattern: CognitivePattern };
  ai_analysis: AIDimensionAnalysis;
  deterministic: DimensionScores;
}

export type SentimentTag = 'positive' | 'negative' | 'neutral';
export type LengthCategory = 'short' | 'medium' | 'long';

export interface ProcessedAnswer {
  raw: string;
  sentences: string[];
  sentence_sentiments: SentimentTag[];
  key_phrases: string[];
  overall_sentiment: SentimentTag;
  length_category: LengthCategory;
}

export interface ProcessedAnswers {
  business_description: ProcessedAnswer;
  client_relationship: ProcessedAnswer;
  natural_style: ProcessedAnswer;
  greeting: ProcessedAnswer;
  sign_off: ProcessedAnswer;
  late_payment_approach: ProcessedAnswer;
  hard_no_gos: ProcessedAnswer;
  sample_message: ProcessedAnswer;
  use_emojis: ProcessedAnswer;
}

export type OnboardingStep = 'intro' | 'questions' | 'voice-match' | 'review';

export interface MCQScoringMap {
  warmth_adjust: number;
  formality_adjust: number;
  directness_adjust: number;
  tension_adjust: number;
}
