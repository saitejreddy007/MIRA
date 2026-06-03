import { describe, it, expect } from 'vitest';
import { calculateConfidence } from '../confidence';
import type { VoiceAnswers, CalibrationRoundData } from '../../types';

function makeAnswers(overrides: Partial<VoiceAnswers> = {}): VoiceAnswers {
  return {
    business_description: 'I run a small design agency helping startups with branding.',
    client_relationship: 'trusted friend',
    natural_style: 'warm and conversational',
    greeting: 'Hey',
    sign_off: 'Thanks',
    late_payment_approach: 'direct but friendly',
    hard_no_gos: 'No aggressive language or threatening tone.',
    sample_message: '',
    use_emojis: '',
    ...overrides,
  };
}

function makeRounds(selected: number = 5): CalibrationRoundData[] {
  return Array.from({ length: 5 }, (_, i) => ({
    round: i + 1,
    dimension: ['warmth', 'directness', 'opening_style', 'paragraph_length', 'tension_tolerance'][i],
    calibration_type: (i < 2 ? 'numeric' : 'categorical') as 'numeric' | 'categorical',
    context: 'Test context',
    message_a: 'Message A content here.',
    message_b: 'Message B content here.',
    selected: i < selected ? ('A' as const) : undefined,
  }));
}

describe('calculateConfidence', () => {
  it('returns low confidence (< 40) with minimal input', () => {
    const answers = makeAnswers({
      business_description: 'Agency.',
      hard_no_gos: 'No.',
    });
    const result = calculateConfidence(answers, []);
    expect(result.score).toBeLessThan(40);
    expect(result.flag).toContain('more calibration');
  });

  it('adds 40 for sample message', () => {
    const base = makeAnswers({
      business_description: 'Agency.',
      hard_no_gos: 'No.',
      natural_style: '',
    });
    const withSample = { ...base, sample_message: 'Hey John, friendly reminder.' };
    const without = calculateConfidence(base, []);
    const result = calculateConfidence(withSample, []);
    expect(result.score).toBe(without.score + 40);
  });

  it('adds 20 for depth > 50 avg words', () => {
    const answers = makeAnswers({
      business_description: Array(80).fill('word').join(' '),
      hard_no_gos: Array(30).fill('word').join(' '),
    });
    const result = calculateConfidence(answers, []);
    expect(result.score).toBeGreaterThanOrEqual(20);
  });

  it('adds 10 for depth > 20 avg words', () => {
    const answers = makeAnswers({
      business_description: Array(30).fill('word').join(' '),
      hard_no_gos: Array(15).fill('word').join(' '),
    });
    const result = calculateConfidence(answers, []);
    expect(result.score).toBeGreaterThanOrEqual(10);
  });

  it('adds calibration round bonus (4 per round, max 20)', () => {
    const answers = makeAnswers({
      business_description: '',
      hard_no_gos: '',
    });
    const result = calculateConfidence(answers, makeRounds(5));
    expect(result.score).toBe(20);
  });

  it('caps total score at 100 with consistent answers and full modifiers', () => {
    const answers = makeAnswers({
      sample_message: 'Hi. Pay.',
      business_description: 'I love my clients ' + Array(100).fill('word').join(' '),
      hard_no_gos: 'Never be rude or pushy.',
      client_relationship: 'trusted friend',
      natural_style: 'short and direct',
      late_payment_approach: 'casual',
    });
    const result = calculateConfidence(answers, makeRounds(5));
    expect(result.score).toBe(100);
  });

  it('returns moderate flag for score 40-70', () => {
    const answers = makeAnswers({
      sample_message: 'Hey, reminder. Thanks.',
      business_description: 'Agency.',
      hard_no_gos: 'No.',
    });
    const result = calculateConfidence(answers, makeRounds(2));
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThanOrEqual(70);
    expect(result.flag).toContain('Moderate');
  });

  it('returns high flag for score >= 80', () => {
    const answers = makeAnswers({
      sample_message: 'Hey John, just a friendly reminder about the invoice. Thanks for your business!',
      business_description: Array(100).fill('word').join(' '),
      hard_no_gos: Array(50).fill('word').join(' '),
    });
    const result = calculateConfidence(answers, makeRounds(5));
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.flag).toContain('High confidence');
  });

  it('includes suggestion text', () => {
    const answers = makeAnswers();
    const result = calculateConfidence(answers, []);
    expect(result.suggestion).toBeTruthy();
  });
});
