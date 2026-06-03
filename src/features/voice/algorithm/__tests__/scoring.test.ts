import { describe, it, expect } from 'vitest';
import * as scoringModule from '../scoring';

describe('scoring module exports', () => {
  it('exports analyzeSampleWarmth', () => {
    expect(typeof scoringModule.analyzeSampleWarmth).toBe('function');
  });
  it('exports calculateDeterministicScores', () => {
    expect(typeof scoringModule.calculateDeterministicScores).toBe('function');
  });
  it('exports mergeScores', () => {
    expect(typeof scoringModule.mergeScores).toBe('function');
  });
  it('exports classifyCognitivePattern', () => {
    expect(typeof scoringModule.classifyCognitivePattern).toBe('function');
  });
  it('exports extractVocabulary', () => {
    expect(typeof scoringModule.extractVocabulary).toBe('function');
  });
  it('exports detectRegionalMarkers', () => {
    expect(typeof scoringModule.detectRegionalMarkers).toBe('function');
  });
  it('exports extractRhythm', () => {
    expect(typeof scoringModule.extractRhythm).toBe('function');
  });
  it('exports runFullScoring', () => {
    expect(typeof scoringModule.runFullScoring).toBe('function');
  });
});

import {
  calculateDeterministicScores,
  analyzeSampleWarmth,
  mergeScores,
  classifyCognitivePattern,
  extractVocabulary,
  detectRegionalMarkers,
  extractRhythm,
  runFullScoring,
} from '../scoring';
import { preprocessAnswers } from '../preprocessor';
import type {
  VoiceAnswers,
  AIDimensionAnalysis,
  DimensionScores,
} from '../../types';

function makeAnswers(overrides: Partial<VoiceAnswers> = {}): VoiceAnswers {
  return {
    business_description: 'I run a small design agency.',
    client_relationship: 'trusted friend',
    natural_style: 'warm and conversational',
    greeting: 'Hey',
    sign_off: 'Thanks',
    late_payment_approach: 'direct but friendly',
    hard_no_gos: '',
    sample_message: '',
    use_emojis: '',
    ...overrides,
  };
}

function makeDefaultAI(): AIDimensionAnalysis {
  return {
    warmth: 50,
    formality: 50,
    directness: 50,
    tension_tolerance: 50,
    cognitive_pattern: 'context_first',
    vocabulary: {
      power_words: ['ensure', 'streamline'],
      forbidden_words: ['aggressive', 'pushy'],
      forbidden_phrases: ['per our conversation'],
      industry_terms: ['branding', 'design'],
      filler_phrases: ['basically', 'you know'],
      regional_markers: [],
      contraction_preference: true,
      sentence_starter_patterns: ['We', 'I'],
    },
    rhythm: {
      avg_sentence_length: 15,
      variance: 5,
      rhythm_type: 'mixed',
      min_sentence_length: 5,
      max_sentence_length: 25,
      short_long_ratio: 0.5,
    },
  };
}

describe('analyzeSampleWarmth', () => {
  it('returns 50 for a truly neutral message with period', () => {
    expect(analyzeSampleWarmth('Just a simple reminder about the invoice.')).toBe(50);
  });

  it('adds 10 for warmth words like appreciate', () => {
    const result = analyzeSampleWarmth('I appreciate your help');
    expect(result).toBeGreaterThanOrEqual(65);
  });

  it('adds 10 for personal greeting', () => {
    expect(analyzeSampleWarmth('Hey John thanks')).toBeGreaterThanOrEqual(60);
  });

  it('adds 5 for personal pronouns >= 3', () => {
    const text = 'You are great. We love your work. I appreciate it.';
    expect(analyzeSampleWarmth(text)).toBeGreaterThanOrEqual(55);
  });

  it('adds 5 for short message < 30 words', () => {
    expect(analyzeSampleWarmth('Hi. Thanks.')).toBeGreaterThanOrEqual(55);
  });

  it('subtracts 10 for formal language', () => {
    const result = analyzeSampleWarmth('We sincerely appreciate your prompt attention.');
    expect(result).toBeLessThanOrEqual(50);
  });

  it('subtracts 10 for bureaucratic language', () => {
    const result = analyzeSampleWarmth('Please find attached the invoice herewith.');
    expect(result).toBeLessThanOrEqual(50);
  });

  it('subtracts 5 for periods', () => {
    expect(analyzeSampleWarmth('This is a test with periods. Multiple periods.')).toBeLessThanOrEqual(50);
  });

  it('caps at 0-100 range', () => {
    expect(analyzeSampleWarmth('Hey you, we love your business!')).toBeGreaterThanOrEqual(0);
    expect(analyzeSampleWarmth('Hey you, we love your business!')).toBeLessThanOrEqual(100);
  });
});

describe('calculateDeterministicScores', () => {
  it('computes scores from MCQ answers', () => {
    const answers = makeAnswers();
    const processed = preprocessAnswers(answers);
    const result = calculateDeterministicScores(answers, processed);
    expect(result.warmth).toBeGreaterThanOrEqual(0);
    expect(result.warmth).toBeLessThanOrEqual(100);
    expect(result.formality).toBeGreaterThanOrEqual(0);
    expect(result.formality).toBeLessThanOrEqual(100);
    expect(result.directness).toBeGreaterThanOrEqual(0);
    expect(result.directness).toBeLessThanOrEqual(100);
    expect(result.tension_tolerance).toBeGreaterThanOrEqual(0);
    expect(result.tension_tolerance).toBeLessThanOrEqual(100);
  });

  it('blends sample warmth at 40/60 when sample exists', () => {
    const answers = makeAnswers({
      sample_message: 'Hey John, hope you are doing well. Just a friendly reminder about invoice.',
    });
    const processed = preprocessAnswers(answers);
    const result = calculateDeterministicScores(answers, processed);
    expect(result.warmth).toBeGreaterThanOrEqual(0);
  });

  it('reduces tension and increases warmth when avoiding aggression', () => {
    const noAggro = makeAnswers({ hard_no_gos: 'No aggressive or pushy language' });
    const aggro = makeAnswers({ hard_no_gos: 'Be firm' });
    const procNoAggro = preprocessAnswers(noAggro);
    const procAggro = preprocessAnswers(aggro);
    const resNoAggro = calculateDeterministicScores(noAggro, procNoAggro);
    const resAggro = calculateDeterministicScores(aggro, procAggro);
    expect(resNoAggro.tension_tolerance).toBeLessThanOrEqual(resAggro.tension_tolerance);
    expect(resNoAggro.warmth).toBeGreaterThanOrEqual(resAggro.warmth);
  });

  it('adds directness for short sample messages (< 20 words)', () => {
    const short = makeAnswers({ sample_message: 'Please pay the invoice.' });
    const long = makeAnswers({ sample_message: Array(30).fill('word').join(' ') });
    const procShort = preprocessAnswers(short);
    const procLong = preprocessAnswers(long);
    const resShort = calculateDeterministicScores(short, procShort);
    const resLong = calculateDeterministicScores(long, procLong);
    expect(resShort.directness).toBeGreaterThanOrEqual(resLong.directness);
  });

  it('adds tension bonus for long business descriptions', () => {
    const longDesc = makeAnswers({ business_description: Array(60).fill('word').join(' ') });
    const shortDesc = makeAnswers({ business_description: 'Small agency.' });
    const procLong = preprocessAnswers(longDesc);
    const procShort = preprocessAnswers(shortDesc);
    const resLong = calculateDeterministicScores(longDesc, procLong);
    const resShort = calculateDeterministicScores(shortDesc, procShort);
    expect(resLong.tension_tolerance).toBeGreaterThanOrEqual(resShort.tension_tolerance);
  });

  it('handles firm late payment approach', () => {
    const answers = makeAnswers({ late_payment_approach: 'firm' });
    const processed = preprocessAnswers(answers);
    const result = calculateDeterministicScores(answers, processed);
    expect(result.directness).toBeGreaterThanOrEqual(50);
    expect(result.tension_tolerance).toBeGreaterThanOrEqual(50);
  });
});

describe('mergeScores', () => {
  it('blends deterministic and AI 50/50 with sample', () => {
    const det: DimensionScores = { warmth: 40, formality: 40, directness: 40, tension_tolerance: 40 };
    const ai: AIDimensionAnalysis = { ...makeDefaultAI(), warmth: 60, formality: 60, directness: 60, tension_tolerance: 60 };
    const result = mergeScores(det, ai, true);
    expect(result.warmth).toBe(50);
    expect(result.formality).toBe(50);
    expect(result.directness).toBe(50);
    expect(result.tension_tolerance).toBe(50);
  });

  it('blends deterministic and AI 60/40 without sample', () => {
    const det: DimensionScores = { warmth: 40, formality: 40, directness: 40, tension_tolerance: 40 };
    const ai: AIDimensionAnalysis = { ...makeDefaultAI(), warmth: 60, formality: 60, directness: 60, tension_tolerance: 60 };
    const result = mergeScores(det, ai, false);
    expect(result.warmth).toBe(48);
    expect(result.formality).toBe(48);
    expect(result.directness).toBe(48);
    expect(result.tension_tolerance).toBe(48);
  });

  it('clamps values at 0-100', () => {
    const det: DimensionScores = { warmth: 200, formality: -50, directness: 150, tension_tolerance: -100 };
    const ai: AIDimensionAnalysis = { ...makeDefaultAI() };
    const result = mergeScores(det, ai, true);
    expect(result.warmth).toBeLessThanOrEqual(100);
    expect(result.formality).toBeGreaterThanOrEqual(0);
    expect(result.directness).toBeLessThanOrEqual(100);
    expect(result.tension_tolerance).toBeGreaterThanOrEqual(0);
  });
});

describe('classifyCognitivePattern', () => {
  it('returns empathy_first for high warmth, low directness', () => {
    const result = classifyCognitivePattern({ warmth: 90, formality: 30, directness: 20, tension_tolerance: 20 });
    expect(result).toBe('empathy_first');
  });

  it('returns authority_first for high formality, high directness', () => {
    const result = classifyCognitivePattern({ warmth: 20, formality: 90, directness: 90, tension_tolerance: 90 });
    expect(result).toBe('authority_first');
  });

  it('returns collaborative_first for balanced moderate directness and warmth', () => {
    const result = classifyCognitivePattern({ warmth: 70, formality: 30, directness: 55, tension_tolerance: 50 });
    expect(result).toBe('collaborative_first');
  });

  it('returns context_first for low directness and high formality', () => {
    const result = classifyCognitivePattern({ warmth: 20, formality: 90, directness: 20, tension_tolerance: 50 });
    expect(result).toBe('context_first');
  });

  it('handles tied scores', () => {
    const result = classifyCognitivePattern({ warmth: 50, formality: 50, directness: 50, tension_tolerance: 50 });
    const patterns = ['empathy_first', 'context_first', 'authority_first', 'collaborative_first'];
    expect(patterns).toContain(result);
  });
});

describe('detectRegionalMarkers', () => {
  it('detects revert back', () => {
    expect(detectRegionalMarkers('please revert back')).toContain('indian_english:revert_back');
  });

  it('detects do the needful', () => {
    expect(detectRegionalMarkers('please do the needful')).toContain('indian_english:do_the_needful');
  });

  it('detects prepone', () => {
    expect(detectRegionalMarkers('please prepone the meeting')).toContain('indian_english:prepone');
  });

  it('detects itself emphasis', () => {
    expect(detectRegionalMarkers('the thing itself')).toContain('indian_english:itself_emphasis');
  });

  it('detects only emphasis', () => {
    expect(detectRegionalMarkers('that only')).toContain('indian_english:only_emphasis');
  });

  it('detects passed out', () => {
    expect(detectRegionalMarkers('he passed out')).toContain('indian_english:passed_out');
  });

  it('returns empty array when no markers found', () => {
    expect(detectRegionalMarkers('Thank you for your help.')).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(detectRegionalMarkers('')).toEqual([]);
  });
});

describe('extractVocabulary', () => {
  it('merges AI vocabulary with no-go forbidden phrases', () => {
    const answers = makeAnswers({ hard_no_gos: 'Do not use kindly or please find' });
    const ai = makeDefaultAI();
    const processed = preprocessAnswers(answers);
    const result = extractVocabulary(answers, ai, processed);
    expect(result.forbidden_words).toContain('kindly');
    expect(result.forbidden_words).toContain('aggressive');
  });

  it('includes regional markers', () => {
    const answers = makeAnswers({ business_description: 'please do the needful' });
    const ai = makeDefaultAI();
    const processed = preprocessAnswers(answers);
    const result = extractVocabulary(answers, ai, processed);
    expect(result.regional_markers).toContain('indian_english:do_the_needful');
  });

  it('copies AI power words', () => {
    const answers = makeAnswers();
    const ai = makeDefaultAI();
    const processed = preprocessAnswers(answers);
    const result = extractVocabulary(answers, ai, processed);
    expect(result.power_words).toContain('ensure');
    expect(result.power_words).toContain('streamline');
  });
});

describe('extractRhythm', () => {
  it('calculates from sample when available', () => {
    const answers = makeAnswers({ sample_message: 'Short. Punchy. Direct.' });
    const ai = makeDefaultAI();
    const scores: DimensionScores = { warmth: 50, formality: 50, directness: 50, tension_tolerance: 50 };
    const result = extractRhythm(answers, ai, scores);
    expect(result.rhythm_type).toBe('staccato');
  });

  it('derives staccato from high directness scores when no sample', () => {
    const answers = makeAnswers();
    const ai = makeDefaultAI();
    const scores: DimensionScores = { warmth: 50, formality: 50, directness: 80, tension_tolerance: 50 };
    const result = extractRhythm(answers, ai, scores);
    expect(result.rhythm_type).toBe('staccato');
    expect(result.avg_sentence_length).toBeLessThanOrEqual(12);
  });

  it('derives flowing from low directness scores when no sample', () => {
    const answers = makeAnswers();
    const ai = makeDefaultAI();
    const scores: DimensionScores = { warmth: 50, formality: 50, directness: 30, tension_tolerance: 50 };
    const result = extractRhythm(answers, ai, scores);
    expect(result.rhythm_type).toBe('flowing');
    expect(result.avg_sentence_length).toBeGreaterThanOrEqual(15);
  });

  it('derives mixed from mid directness scores when no sample', () => {
    const answers = makeAnswers();
    const ai = makeDefaultAI();
    const scores: DimensionScores = { warmth: 50, formality: 50, directness: 50, tension_tolerance: 50 };
    const result = extractRhythm(answers, ai, scores);
    expect(result.rhythm_type).toBe('mixed');
  });
});

describe('runFullScoring', () => {
  it('produces final, ai_analysis, and deterministic fields', () => {
    const answers = makeAnswers();
    const processed = preprocessAnswers(answers);
    const ai = makeDefaultAI();
    const result = runFullScoring(answers, processed, ai);
    expect(result).toHaveProperty('final');
    expect(result).toHaveProperty('ai_analysis');
    expect(result).toHaveProperty('deterministic');
    expect(result.final).toHaveProperty('cognitive_pattern');
  });

  it('all scores within 0-100', () => {
    const answers = makeAnswers({ sample_message: 'Hey, just a quick reminder about the invoice. Thanks!' });
    const processed = preprocessAnswers(answers);
    const ai = makeDefaultAI();
    const result = runFullScoring(answers, processed, ai);
    const dims: (keyof DimensionScores)[] = ['warmth', 'formality', 'directness', 'tension_tolerance'];
    for (const d of dims) {
      expect(result.final[d]).toBeGreaterThanOrEqual(0);
      expect(result.final[d]).toBeLessThanOrEqual(100);
      expect(result.deterministic[d]).toBeGreaterThanOrEqual(0);
      expect(result.deterministic[d]).toBeLessThanOrEqual(100);
    }
  });

  it('merges vocabulary into ai_analysis', () => {
    const answers = makeAnswers();
    const processed = preprocessAnswers(answers);
    const ai = makeDefaultAI();
    const result = runFullScoring(answers, processed, ai);
    expect(result.ai_analysis.vocabulary.power_words).toContain('ensure');
    expect(result.ai_analysis.vocabulary.regional_markers).toEqual([]);
  });

  it('merges rhythm into ai_analysis', () => {
    const answers = makeAnswers();
    const processed = preprocessAnswers(answers);
    const ai = makeDefaultAI();
    const result = runFullScoring(answers, processed, ai);
    expect(result.ai_analysis.rhythm).toHaveProperty('avg_sentence_length');
    expect(result.ai_analysis.rhythm).toHaveProperty('rhythm_type');
  });

  it('handles empty sample gracefully', () => {
    const answers = makeAnswers({ sample_message: '' });
    const processed = preprocessAnswers(answers);
    const ai = makeDefaultAI();
    const result = runFullScoring(answers, processed, ai);
    expect(result.final.warmth).toBeGreaterThanOrEqual(0);
  });
});
