import type { VoiceConstitution } from '@/features/voice/types';

export const FOLLOW_UP_SYSTEM = `You are MIRA, ghostwriting an invoice follow-up message on behalf of a business owner.

Your job is to write ONE message that sounds EXACTLY like the owner wrote it themselves — their natural voice, their habits, their rhythm. It must NOT feel like a template was filled in.

Rules:
- Return ONLY valid JSON: { "message_text": "...", "max_pressure_level": <integer 1-5> }
- No explanations, no preamble, no markdown
- The message must feel human-written, personal, and specific — not formulaic
- Don't start every message with the same greeting word — vary naturally like a real person would
- Don't mention the business name or client name robotically in every message
- Don't reference business context (industry, services) unless it's genuinely relevant to the payment
- Each message in the sequence must feel like a natural escalation — not a copy of the previous with different pressure
- max_pressure_level is how firm THIS message is on a 1-5 scale`;

function describeWarmthFormality(warmth: number, formality: number): string {
  if (warmth > 70 && formality < 40) return 'warm and casual — like texting a friend you do business with';
  if (warmth > 70 && formality >= 40) return 'warm but professional — friendly yet business-appropriate';
  if (warmth < 40 && formality > 60) return 'formal and professional — business-first, minimal personal warmth';
  if (warmth < 40 && formality < 40) return 'low-key and brief — gets to the point, no small talk';
  return 'balanced — professional but approachable';
}

function describeGreetingStyle(surfaceGreeting: string, warmth: number): string {
  const casual = warmth > 60;
  switch (surfaceGreeting) {
    case 'Hey': return `very casual opener (Hey/Hey [name]) — ${casual ? 'use freely' : 'use occasionally'}`;
    case 'Hi': return `casual-friendly opener (Hi/Hi [name]) — feels approachable`;
    case 'Hello': return `slightly formal opener (Hello/Hello [name]) — polite but not stiff`;
    case 'Dear': return `formal opener (Dear [name]) — professional distance`;
    default: return 'natural opener appropriate to the relationship';
  }
}

function describeRhythm(rhythmType: string, avgLen: number): string {
  if (rhythmType === 'staccato') return `short punchy sentences (avg ${Math.round(avgLen)} words) — direct and to the point`;
  if (rhythmType === 'flowing') return `longer connected sentences (avg ${Math.round(avgLen)} words) — explains and contextualises`;
  return `mixed rhythm (avg ${Math.round(avgLen)} words) — varies naturally between short and longer sentences`;
}

export function buildFollowUpPrompt(params: {
  constitution: Record<string, unknown>;
  position: number;
  clientName: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  dueDate: string;
  daysOverdue: number;
  previousMessages: string[];
  ragExamples?: string[];
  businessName: string;
}): string {
  const { constitution, position, clientName, invoiceNumber, amount, currency, dueDate, daysOverdue, previousMessages, ragExamples, businessName } = params;

  const c = constitution as unknown as VoiceConstitution;
  const positionLabels = ['Pre-due reminder', 'First follow-up', 'Second follow-up', 'Third follow-up'];

  const warmth = c.voice_dimensions?.warmth ?? 50;
  const formality = c.voice_dimensions?.formality ?? 50;
  const directness = c.voice_dimensions?.directness ?? 50;
  const greetingStyle = describeGreetingStyle(c.surface_rules?.greeting ?? 'Hi', warmth);
  const emojisAllowed = c.surface_rules?.emoji_allowed ?? false;
  const rhythmDesc = describeRhythm(c.rhythm?.rhythm_type ?? 'mixed', c.rhythm?.avg_sentence_length ?? 15);
  const usesContractions = c.vocabulary?.contraction_preference ?? true;
  const forbiddenWords = (c.vocabulary?.forbidden_words ?? []).join(', ');
  const forbiddenPhrases = (c.vocabulary?.forbidden_phrases ?? []).join(', ');
  const maxPressure = c.tension_rules?.max_pressure_level ?? 3;
  const escalationSpeed = c.tension_rules?.escalation_speed ?? 'medium';
  const consequenceMention = c.tension_rules?.consequence_mention ?? 'late';
  const cognitivePattern = c.voice_dimensions?.cognitive_pattern ?? 'collaborative_first';

  const styleGuide = `
OWNER'S VOICE STYLE (use as flexible guidance — not a rigid script):
- Overall tone: ${describeWarmthFormality(warmth, formality)}
- Greeting style: ${greetingStyle}
- Writing rhythm: ${rhythmDesc}
- Directness level: ${directness}/100 — ${directness > 70 ? 'gets straight to the point, no padding' : directness < 40 ? 'builds context before the ask' : 'balanced — context then ask'}
- Contractions: ${usesContractions ? "use contractions naturally (I'm, it's, you've)" : 'avoid contractions — more formal phrasing'}
- Emojis: ${emojisAllowed ? 'You MAY use 1-2 simple emojis if it fits the tone naturally, but do not overuse them.' : 'ABSOLUTELY NO EMOJIS allowed under any circumstances.'}
- Message structure: ${cognitivePattern === 'empathy_first' ? 'acknowledge first, then business' : cognitivePattern === 'authority_first' ? 'state the facts, then ask' : cognitivePattern === 'context_first' ? 'give context before the ask' : 'collaborative — include the client, not just inform them'}
- Escalation style: ${escalationSpeed} escalation speed
- Consequences: mention ${consequenceMention === 'never' ? 'never' : consequenceMention === 'late' ? 'only in late messages (position 2+)' : 'when appropriate'}
- Maximum pressure for this account: ${maxPressure}/5${forbiddenWords ? `\n- NEVER use these words: ${forbiddenWords}` : ''}${forbiddenPhrases ? `\n- NEVER use these phrases: ${forbiddenPhrases}` : ''}`;

  const fewShotSection = ragExamples && ragExamples.length > 0
    ? `\n\n=== EXAMPLES FROM THE OWNER'S VOICE VAULT (CRITICAL) ===
The owner previously wrote the following messages in similar situations. You MUST study these examples and deeply mimic their exact vocabulary, sentence length, paragraph spacing, and punctuation quirks. Sound exactly like these examples:
${ragExamples.map((ex, i) => `Example ${i + 1}:\n"""\n${ex}\n"""`).join('\n\n')}
======================================================`
    : '';

  return `Write a ${positionLabels[position] || 'follow-up'} invoice message as if you ARE the business owner writing it yourself.

INVOICE DETAILS:
- Client: ${clientName}
- Invoice: ${invoiceNumber}
- Amount: ${currency} ${amount}
- Due: ${dueDate}
- Status: ${daysOverdue > 0 ? `${daysOverdue} days overdue` : 'Not yet due'}
${styleGuide}${fewShotSection}
${previousMessages.length > 0
  ? `\nPREVIOUS MESSAGES SENT (do NOT repeat content, phrases, or openings from these):\n${previousMessages.map((m, i) => `[${i + 1}] ${m}`).join('\n')}`
  : '\nThis is the first message about this invoice.'}

Write the message now. It must sound like a real person wrote it — not a bot following a template. Do not start with the same word as any previous message.

Return ONLY: { "message_text": "the full message", "max_pressure_level": <1-5> }`;
}
