import type { VoiceConstitution, ComplianceResult } from '../types';

const MAX_REGENERATION_ATTEMPTS = 3;

export function checkConstitutionCompliance(
  message: string,
  constitution: VoiceConstitution
): ComplianceResult {
  const violations: string[] = [];
  const lowerMessage = message.toLowerCase();

  for (const word of constitution.vocabulary.forbidden_words) {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
    if (regex.test(message)) {
      violations.push(`Contains forbidden word: "${word}"`);
    }
  }

  for (const phrase of constitution.vocabulary.forbidden_phrases) {
    if (message.toLowerCase().includes(phrase.toLowerCase())) {
      violations.push(`Contains forbidden phrase: "${phrase}"`);
    }
  }

  // We no longer strictly enforce literal greeting and signoff words.
  // The generation prompt uses them as style signals (e.g. "casual" vs "formal")
  // and encourages natural variation to avoid sounding robotic.

  const sentences = message.split(/[.!?;]+/).filter((s) => s.trim().length > 0);
  if (sentences.length > 0) {
    const avgLength =
      sentences.reduce((sum, s) => sum + s.split(/\s+/).filter(Boolean).length, 0) /
      sentences.length;
    const rhythmAvg = constitution.rhythm.avg_sentence_length;
    if (Math.abs(avgLength - rhythmAvg) > rhythmAvg * 0.75) {
      violations.push(
        `Average sentence length (${Math.round(avgLength)}) deviates significantly from baseline (${rhythmAvg})`
      );
    }
  }

  if (!constitution.surface_rules.emoji_allowed) {
    const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{1FB00}-\u{1FBFF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}\u{1F3FB}-\u{1F3FF}]/u;
    if (emojiRegex.test(message)) {
      violations.push('Emojis are not allowed by constitution');
    }
  }

  const ctaStyle = constitution.structural_rules.cta_style;
  const ctaPhrases = [
    'please pay', 'make payment', 'send payment', 'remit payment',
    'let me know', 'get back to me', 'reach out', 'give me a call',
    'contact me', 'transfer', 'deposit', 'pay by', 'due date',
  ];
  let ctaCount = 0;
  for (const cta of ctaPhrases) {
    if (lowerMessage.includes(cta)) ctaCount++;
  }
  if (ctaStyle === 'single_soft' || ctaStyle === 'single_firm') {
    if (ctaCount > 1) {
      violations.push(`CTA style is "${ctaStyle}" but message has ${ctaCount} CTAs`);
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

export async function complianceCheckWithRetry(
  message: string,
  constitution: VoiceConstitution,
  regenerateFn?: (currentMessage: string, violations: string[]) => Promise<string>,
  maxAttempts: number = MAX_REGENERATION_ATTEMPTS
): Promise<ComplianceResult & { regenerated: boolean; attempts: number; final_message: string }> {
  let currentMessage = message;
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    const result = checkConstitutionCompliance(currentMessage, constitution);

    if (result.passed) {
      return { ...result, regenerated: attempts > 1, attempts, final_message: currentMessage };
    }

    if (regenerateFn && attempts < maxAttempts) {
      const newMessage = await regenerateFn(currentMessage, result.violations);
      if (newMessage && newMessage.trim().length > 0) {
        currentMessage = newMessage;
      } else {
        return { ...result, regenerated: attempts > 1, attempts, final_message: currentMessage };
      }
    } else {
      return { ...result, regenerated: attempts > 1, attempts, final_message: currentMessage };
    }
  }

  const finalResult = checkConstitutionCompliance(currentMessage, constitution);
  return { ...finalResult, regenerated: attempts > 0, attempts, final_message: currentMessage };
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
