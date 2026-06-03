import { describe, it, expect } from 'vitest';
import { checkConstitutionCompliance, complianceCheckWithRetry } from '../quality-gate';
import type { VoiceConstitution } from '../../types';

const LONG = 'just a quick reminder about invoice 123. please pay at your earliest convenience';

function makeConstitution(overrides: Partial<VoiceConstitution> = {}): VoiceConstitution {
  return {
    version: '1.0',
    created_at: '2025-01-01',
    business_identity: { industry: 'design', client_type: 'small_business', culture: 'casual', business_age: '5_years' },
    voice_dimensions: { warmth: 65, formality: 35, directness: 55, tension_tolerance: 45, cognitive_pattern: 'empathy_first' },
    surface_rules: { greeting: 'Hey', signoff: 'Thanks', emoji_allowed: false, contraction_preference: true, punctuation_style: 'minimal' },
    vocabulary: {
      power_words: ['ensure', 'streamline'],
      forbidden_words: ['aggressive', 'pushy', 'threatening'],
      forbidden_phrases: ['per our conversation', 'as per'],
      industry_terms: ['design', 'branding'],
      filler_phrases: ['basically', 'you know'],
      regional_markers: [],
      contraction_preference: true,
      sentence_starter_patterns: ['We', 'I'],
    },
    structural_rules: { opening_pattern: 'warmth_first', reasoning_style: 'show', bad_news_delivery: 'soften', cta_style: 'single_soft', paragraph_length: 'medium' },
    rhythm: { avg_sentence_length: 15, variance: 8, rhythm_type: 'flowing' as const, min_sentence_length: 8, max_sentence_length: 30, short_long_ratio: 0.4 },
    tension_rules: { day1_approach: 'friendly', escalation_speed: 'slow', consequence_mention: 'late', max_pressure_level: 3 },
    ...overrides,
  };
}

function clean(v: string) { return v.toLowerCase(); }

describe('checkConstitutionCompliance', () => {
  it('passes a clean message with matching rhythm', () => {
    const msg = `Hey John, ${LONG}. Thanks!`;
    const result = checkConstitutionCompliance(msg, makeConstitution());
    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('detects forbidden words', () => {
    const msg = `This is an aggressive reminder. ${LONG}`;
    const result = checkConstitutionCompliance(msg, makeConstitution());
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => clean(v).includes('aggressive'))).toBe(true);
  });

  it('detects forbidden phrases', () => {
    const msg = `As per our conversation, please pay the invoice. thanks!`;
    const result = checkConstitutionCompliance(msg, makeConstitution());
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => clean(v).includes('as per'))).toBe(true);
  });

  it('detects greeting mismatch', () => {
    const con = makeConstitution({ surface_rules: { ...makeConstitution().surface_rules, greeting: 'Hello' } });
    const msg = `Hey John, ${LONG}. Thanks!`;
    const result = checkConstitutionCompliance(msg, con);
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => clean(v).includes('greeting'))).toBe(true);
  });

  it('allows correct greeting', () => {
    const msg = `Hey John, ${LONG}. Thanks!`;
    const result = checkConstitutionCompliance(msg, makeConstitution());
    expect(result.passed).toBe(true);
  });

  it('detects signoff mismatch', () => {
    const con = makeConstitution({ surface_rules: { ...makeConstitution().surface_rules, signoff: 'Regards' } });
    const msg = `Hey John, ${LONG}.\nThanks!`;
    const result = checkConstitutionCompliance(msg, con);
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => clean(v).includes('signoff'))).toBe(true);
  });

  it('handles signoff as just a name (not in known signoff list)', () => {
    const con = makeConstitution({ surface_rules: { ...makeConstitution().surface_rules, signoff: 'Name' as any } });
    const msg = `Hey John, ${LONG}.\nSaiteja`;
    const result = checkConstitutionCompliance(msg, con);
    expect(result.violations.some((v) => clean(v).includes('signoff'))).toBe(false);
  });

  it('detects emoji when not allowed', () => {
    const msg = `Hey John, ${LONG}. Thanks! \u{1F60A}`;
    const result = checkConstitutionCompliance(msg, makeConstitution());
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => clean(v).includes('emoji'))).toBe(true);
  });

  it('allows emoji when allowed', () => {
    const con = makeConstitution({ surface_rules: { ...makeConstitution().surface_rules, emoji_allowed: true } });
    const msg = `Hey John, ${LONG}. Thanks!`;
    const result = checkConstitutionCompliance(msg, con);
    expect(result.passed).toBe(true);
  });

  it('detects CTA count violation for single_soft style', () => {
    const msg = `Hey John, please pay at your earliest convenience. Let me know if you have questions. Reach out to me anytime. Thanks!`;
    const result = checkConstitutionCompliance(msg, makeConstitution());
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => clean(v).includes('cta'))).toBe(true);
  });

  it('allows multiple CTAs for multiple style', () => {
    const con = makeConstitution({ structural_rules: { ...makeConstitution().structural_rules, cta_style: 'multiple' } });
    const msg = `Hey John, please pay. Let me know if you have questions.`;
    const result = checkConstitutionCompliance(msg, con);
    expect(result.passed).toBe(true);
  });

  it('detects sentence rhythm deviation', () => {
    const msg = 'Hi.'; // 1 word vs baseline 15 → strong deviation
    const result = checkConstitutionCompliance(msg, makeConstitution());
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => clean(v).includes('sentence length'))).toBe(true);
  });

  it('handles empty message', () => {
    const result = checkConstitutionCompliance('', makeConstitution());
    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('handles message starting with lowercase greeting', () => {
    const con = makeConstitution({ surface_rules: { ...makeConstitution().surface_rules, greeting: 'Hi' } });
    const msg = `hi John, ${LONG}. Thanks!`;
    const result = checkConstitutionCompliance(msg, con);
    expect(result.passed).toBe(true);
  });

  it('flags new greetings: howdy / good morning', () => {
    const con = makeConstitution({ surface_rules: { ...makeConstitution().surface_rules, greeting: 'Hey' } });
    const msg1 = `Howdy, John. ${LONG}. Thanks!`;
    const r1 = checkConstitutionCompliance(msg1, con);
    expect(r1.passed).toBe(false);
    expect(r1.violations.some((v) => clean(v).includes('greeting'))).toBe(true);

    const msg2 = `Good morning John, ${LONG}. Thanks!`;
    const r2 = checkConstitutionCompliance(msg2, con);
    expect(r2.passed).toBe(false);
    expect(r2.violations.some((v) => clean(v).includes('greeting'))).toBe(true);
  });

  it('allows greeting followed by punctuation (Hi.)', () => {
    const con = makeConstitution({ surface_rules: { ...makeConstitution().surface_rules, greeting: 'Hi' } });
    const msg = `Hi. ${LONG}. Thanks!`;
    const result = checkConstitutionCompliance(msg, con);
    expect(result.passed).toBe(true);
  });
});

describe('checkConstitutionCompliance — Unicode 13+ emoji detection', () => {
  it('detects 1F900-1F9FF (Supplemental Symbols and Pictographs) like 🥰', () => {
    const msg = `Hey John, ${LONG}. Thanks! \u{1F970}`;
    const result = checkConstitutionCompliance(msg, makeConstitution());
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => clean(v).includes('emoji'))).toBe(true);
  });

  it('detects 1FA70-1FAFF (Symbols and Pictographs Extended-A)', () => {
    const msg = `Hey John, ${LONG}. Thanks! \u{1FA90}`;
    const result = checkConstitutionCompliance(msg, makeConstitution());
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => clean(v).includes('emoji'))).toBe(true);
  });

  it('detects 1FB00-1FBFF (Symbols for Legacy Computing)', () => {
    const msg = `Hey John, ${LONG}. Thanks! \u{1FB00}`;
    const result = checkConstitutionCompliance(msg, makeConstitution());
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => clean(v).includes('emoji'))).toBe(true);
  });

  it('detects skin tone modifiers (1F3FB-1F3FF)', () => {
    const msg = `Hey John, ${LONG}. Thanks! \u{1F3FB}`;
    const result = checkConstitutionCompliance(msg, makeConstitution());
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => clean(v).includes('emoji'))).toBe(true);
  });

  it('detects 2600-26FF (Misc symbols like ★)', () => {
    const msg = `Hey John, \u{2605} ${LONG}. Thanks!`;
    const result = checkConstitutionCompliance(msg, makeConstitution());
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => clean(v).includes('emoji'))).toBe(true);
  });

  it('still detects 1F600-1F64F (Emoticons) like 😊', () => {
    const msg = `Hey John, ${LONG}. Thanks! \u{1F60A}`;
    const result = checkConstitutionCompliance(msg, makeConstitution());
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => clean(v).includes('emoji'))).toBe(true);
  });

  it('still detects 1F680-1F6FF (Transport) like 🚀', () => {
    const msg = `Hey John, ${LONG}. Thanks! \u{1F680}`;
    const result = checkConstitutionCompliance(msg, makeConstitution());
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => clean(v).includes('emoji'))).toBe(true);
  });
});

describe('complianceCheckWithRetry', () => {
  it('passes on first attempt', async () => {
    const msg = `Hey John, ${LONG}. Thanks!`;
    const result = await complianceCheckWithRetry(msg, makeConstitution());
    expect(result.passed).toBe(true);
    expect(result.attempts).toBe(1);
    expect(result.regenerated).toBe(false);
  });

  it('retries and eventually passes with regenerateFn', async () => {
    const regenerateFn = async () => `Hey John, ${LONG}. Thanks!`;
    const result = await complianceCheckWithRetry(
      `This is aggressive. ${LONG}`,
      makeConstitution(),
      regenerateFn
    );
    expect(result.passed).toBe(true);
    expect(result.regenerated).toBe(true);
  });

  it('returns violations after exhausting retries', async () => {
    const regenerateFn = async () => `Still aggressive. ${LONG}`;
    const result = await complianceCheckWithRetry(
      `This is aggressive. ${LONG}`,
      makeConstitution(),
      regenerateFn,
      3
    );
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.attempts).toBe(3);
  });

  it('returns immediately without regenerateFn', async () => {
    const result = await complianceCheckWithRetry(
      `This is aggressive. ${LONG}`,
      makeConstitution()
    );
    expect(result.passed).toBe(false);
    expect(result.attempts).toBe(1);
    expect(result.regenerated).toBe(false);
  });

  it('respects custom maxAttempts', async () => {
    const regenerateFn = async () => `Still aggressive. ${LONG}`;
    const result = await complianceCheckWithRetry(
      `This is aggressive. ${LONG}`,
      makeConstitution(),
      regenerateFn,
      1
    );
    expect(result.attempts).toBe(1);
  });
});
