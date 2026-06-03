import type {
  VoiceAnswers,
  ProcessedAnswers,
  ProcessedAnswer,
  SentimentTag,
  LengthCategory,
} from '../types';

const FILLER_WORDS = new Set([
  'um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally',
  'honestly', 'sort of', 'kind of', 'i mean', 'you see', 'well',
]);

const POSITIVE_WORDS = new Set([
  'love', 'great', 'appreciate', 'glad', 'happy', 'wonderful', 'fantastic',
  'excellent', 'amazing', 'thankful', 'grateful', 'pleased', 'enjoy',
  'blessed', 'awesome', 'perfect', 'best',
]);

const NEGATIVE_WORDS = new Set([
  'hate', 'terrible', 'awful', 'horrible', 'annoying', 'frustrating',
  'disappointed', 'angry', 'never', 'worst', 'bad', 'dread',
]);

export function stripFillerPhrases(text: string): string {
  let cleaned = text.toLowerCase().trim();
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  }
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  if (cleaned.length === 0) return text;
  if (cleaned.length < text.length * 0.4) return text;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function segmentSentences(text: string): string[] {
  if (!text.trim()) return [];
  const sentences = text
    .replace(/([.!?;])\s*/g, '$1\n')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return sentences.length > 0 ? sentences : [text.trim()];
}

export function extractKeyPhrases(text: string): string[] {
  if (!text.trim()) return [];
  const sentences = segmentSentences(text);
  const phrases: string[] = [];
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).map((w) => w.replace(/[^a-zA-Z0-9'-]/g, '')).filter(Boolean);
    if (words.length >= 3) {
      const mid = Math.floor(words.length / 2);
      const phrase = words.slice(Math.max(0, mid - 1), mid + 2).join(' ');
      phrases.push(phrase);
    }
    if (words.length >= 2) {
      phrases.push(words.slice(0, 2).join(' '));
      phrases.push(words.slice(-2).join(' '));
    }
  }
  return [...new Set(phrases)].slice(0, 10);
}

export function tagSingleSentence(sentence: string): SentimentTag {
  const lower = sentence.toLowerCase();
  const words = lower
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z]/g, ''));
  let posCount = 0;
  let negCount = 0;
  for (const word of words) {
    if (POSITIVE_WORDS.has(word)) posCount++;
    if (NEGATIVE_WORDS.has(word)) negCount++;
  }
  if (posCount > negCount && posCount >= 1) return 'positive';
  if (negCount > posCount && negCount >= 1) return 'negative';
  return 'neutral';
}

export function tagSentiment(text: string): SentimentTag {
  if (!text.trim()) return 'neutral';
  const sentences = segmentSentences(text);
  if (sentences.length === 0) return 'neutral';
  const tags = sentences.map(tagSingleSentence);
  const posCount = tags.filter((t) => t === 'positive').length;
  const negCount = tags.filter((t) => t === 'negative').length;
  if (posCount > negCount && posCount >= Math.ceil(sentences.length * 0.4)) return 'positive';
  if (negCount > posCount && negCount >= Math.ceil(sentences.length * 0.4)) return 'negative';
  return 'neutral';
}

export function normalizeLength(text: string): LengthCategory {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 15) return 'short';
  if (wordCount < 50) return 'medium';
  return 'long';
}

export function preprocessAnswers(answers: VoiceAnswers): ProcessedAnswers {
  const keys = Object.keys(answers) as (keyof VoiceAnswers)[];
  const processed: Record<string, ProcessedAnswer> = {};
  for (const key of keys) {
    const raw = answers[key] || '';
    const cleaned = stripFillerPhrases(raw);
    const sentences = segmentSentences(cleaned);
    processed[key] = {
      raw,
      sentences,
      sentence_sentiments: sentences.map(tagSingleSentence),
      key_phrases: extractKeyPhrases(cleaned),
      overall_sentiment: tagSentiment(cleaned),
      length_category: normalizeLength(cleaned),
    };
  }
  return processed as unknown as ProcessedAnswers;
}
