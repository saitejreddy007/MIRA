import { describe, it, expect } from 'vitest';
import {
  stripFillerPhrases,
  segmentSentences,
  extractKeyPhrases,
  tagSingleSentence,
  tagSentiment,
  normalizeLength,
  preprocessAnswers,
} from '../preprocessor';
import type { VoiceAnswers } from '../../types';

describe('stripFillerPhrases', () => {
  it('removes filler words while keeping meaningful content and commas', () => {
    expect(stripFillerPhrases('basically we need to pay the invoice today')).toBe('We need to pay the invoice today');
  });

  it('preserves non-filler content', () => {
    expect(stripFillerPhrases('Hello world')).toBe('Hello world');
  });

  it('returns original when text is empty', () => {
    expect(stripFillerPhrases('')).toBe('');
  });

  it('returns original when fillers exceed 60% of content', () => {
    expect(stripFillerPhrases('um uh like well you know')).toBe('um uh like well you know');
  });

  it('re-capitalizes first letter', () => {
    expect(stripFillerPhrases('like hello there')).toBe('Hello there');
  });
});

describe('segmentSentences', () => {
  it('splits on period', () => {
    expect(segmentSentences('Hello. World.')).toEqual(['Hello.', 'World.']);
  });

  it('splits on exclamation and question', () => {
    expect(segmentSentences('Hi! What? Fine.')).toEqual(['Hi!', 'What?', 'Fine.']);
  });

  it('splits on semicolon', () => {
    expect(segmentSentences('First; second; third.')).toEqual(['First;', 'second;', 'third.']);
  });

  it('returns empty array for empty string', () => {
    expect(segmentSentences('')).toEqual([]);
  });

  it('handles text with no punctuation', () => {
    expect(segmentSentences('hello world')).toEqual(['hello world']);
  });

  it('handles whitespace padding', () => {
    expect(segmentSentences('  Hello.  World.  ')).toEqual(['Hello.', 'World.']);
  });
});

describe('extractKeyPhrases', () => {
  it('extracts middle, first, and last phrases (punctuation stripped)', () => {
    const result = extractKeyPhrases('The quick brown fox jumps over the lazy dog.');
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result).toContain('fox jumps over');
    expect(result).toContain('The quick');
    expect(result).toContain('lazy dog');
  });

  it('returns empty array for empty string', () => {
    expect(extractKeyPhrases('')).toEqual([]);
  });

  it('handles single word', () => {
    expect(extractKeyPhrases('hello')).toEqual([]);
  });

  it('does not exceed 10 unique phrases', () => {
    const text = 'A B C. D E F. G H I. J K L. M N O. P Q R. S T U. V W X.';
    const result = extractKeyPhrases(text);
    expect(result.length).toBeLessThanOrEqual(10);
    expect(new Set(result).size).toBe(result.length);
  });
});

describe('tagSingleSentence', () => {
  it('tags positive sentence', () => {
    expect(tagSingleSentence('I love this great product')).toBe('positive');
  });

  it('tags negative sentence', () => {
    expect(tagSingleSentence('This is terrible and awful')).toBe('negative');
  });

  it('tags neutral sentence', () => {
    expect(tagSingleSentence('The meeting is at 3pm')).toBe('neutral');
  });

  it('handles punctuation in positive words', () => {
    expect(tagSingleSentence('I love this. It is great.')).toBe('positive');
  });

  it('handles punctuation in negative words', () => {
    expect(tagSingleSentence('This is terrible. I hate it.')).toBe('negative');
  });

  it('tags positive when positive words outnumber negative', () => {
    expect(tagSingleSentence('Great love but terrible')).toBe('positive');
  });

  it('tags negative when negative words outnumber positive', () => {
    expect(tagSingleSentence('Terrible awful but great')).toBe('negative');
  });

  it('handles empty sentence', () => {
    expect(tagSingleSentence('')).toBe('neutral');
  });
});

describe('tagSentiment', () => {
  it('returns positive when most sentences are positive', () => {
    const text = 'I love this. It is great. But the price is high.';
    expect(tagSentiment(text)).toBe('positive');
  });

  it('returns negative when most sentences are negative', () => {
    const text = 'This is terrible. I hate it. The quality is ok.';
    expect(tagSentiment(text)).toBe('negative');
  });

  it('returns neutral for mixed or neutral content', () => {
    expect(tagSentiment('It is fine. The color is blue. Today is Tuesday.')).toBe('neutral');
  });

  it('returns neutral for empty string', () => {
    expect(tagSentiment('')).toBe('neutral');
  });

  it('meets positive threshold of 40%', () => {
    const text = 'I love this. It is great. The price is high. The color is blue.';
    expect(tagSentiment(text)).toBe('positive');
  });

  it('returns neutral when positive count is below threshold', () => {
    const text = 'I love this. The price is high. The color is blue. It is Tuesday.';
    expect(tagSentiment(text)).toBe('neutral');
  });
});

describe('normalizeLength', () => {
  it('returns short for < 15 words', () => {
    expect(normalizeLength('hello world')).toBe('short');
  });

  it('returns medium for 15-49 words', () => {
    const text = Array(20).fill('word').join(' ');
    expect(normalizeLength(text)).toBe('medium');
  });

  it('returns long for >= 50 words', () => {
    const text = Array(50).fill('word').join(' ');
    expect(normalizeLength(text)).toBe('long');
  });

  it('handles empty string', () => {
    expect(normalizeLength('')).toBe('short');
  });

  it('boundary: exactly 15 words', () => {
    expect(normalizeLength(Array(15).fill('word').join(' '))).toBe('medium');
  });

  it('boundary: exactly 50 words', () => {
    expect(normalizeLength(Array(50).fill('word').join(' '))).toBe('long');
  });
});

describe('preprocessAnswers', () => {
  const sampleAnswers: VoiceAnswers = {
    business_description: 'I run a small design agency helping startups with branding.',
    client_relationship: 'trusted friend',
    natural_style: 'warm and conversational',
    greeting: 'Hey',
    sign_off: 'Thanks',
    late_payment_approach: 'direct but friendly',
    hard_no_gos: 'No aggressive language, no threatening',
    sample_message: '',
    use_emojis: '',
  };

  it('processes all answer fields', () => {
    const result = preprocessAnswers(sampleAnswers);
    const keys = Object.keys(result) as (keyof typeof result)[];
    for (const key of keys) {
      expect(result[key]).toHaveProperty('raw');
      expect(result[key]).toHaveProperty('sentences');
      expect(result[key]).toHaveProperty('sentence_sentiments');
      expect(result[key]).toHaveProperty('key_phrases');
      expect(result[key]).toHaveProperty('overall_sentiment');
      expect(result[key]).toHaveProperty('length_category');
    }
  });

  it('preserves raw original text', () => {
    const result = preprocessAnswers(sampleAnswers);
    expect(result.business_description.raw).toBe(sampleAnswers.business_description);
  });

  it('generates sentence-level sentiments', () => {
    const result = preprocessAnswers(sampleAnswers);
    expect(result.business_description.sentence_sentiments.length).toBe(
      result.business_description.sentences.length
    );
  });

  it('handles empty answers gracefully', () => {
    const empty: VoiceAnswers = {
      business_description: '',
      client_relationship: '',
      natural_style: '',
      greeting: '',
      sign_off: '',
      late_payment_approach: '',
      hard_no_gos: '',
      sample_message: '',
      use_emojis: '',
    };
    const result = preprocessAnswers(empty);
    expect(result.business_description.sentences).toEqual([]);
    expect(result.business_description.overall_sentiment).toBe('neutral');
    expect(result.business_description.length_category).toBe('short');
  });
});
