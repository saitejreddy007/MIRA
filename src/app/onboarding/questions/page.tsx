'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { QuestionStep } from '@/features/voice/components/QuestionStep';
import { submitVoiceAnswers } from '@/features/voice/actions/submit-answers';
import { getCalibrationRounds } from '@/features/voice/actions/submit-voice-match';
import type { VoiceAnswers } from '@/features/voice/types';
import { ChevronLeft } from 'lucide-react';

const TOTAL_QUESTIONS = 9;

const questions: {
  key: keyof VoiceAnswers;
  question: string;
  description: string;
  placeholder: string;
  type: 'text' | 'textarea';
}[] = [
  {
    key: 'business_description',
    question: 'How would you describe your business?',
    description: 'Describe what you do, who your target clients are, and the industry you operate in. This helps MIRA understand the context of your invoices.',
    placeholder: 'E.g., We are a boutique design agency specializing in brand identity and websites for tech startups and small businesses...',
    type: 'textarea',
  },
  {
    key: 'client_relationship',
    question: 'How would you describe your relationship with clients?',
    description: 'Describe how you interact with your clients. Are you informal and friendly, or highly structured and professional?',
    placeholder: 'E.g., We maintain a close, friendly relationship with our clients and treat them as partners, keeping communications relaxed and personal...',
    type: 'textarea',
  },
  {
    key: 'natural_style',
    question: 'Describe your natural writing style when communicating with clients.',
    description: 'Explain how you naturally write your emails (e.g., short and punchy, detailed and thorough, chatty, or highly formal).',
    placeholder: 'E.g., I write short, direct emails that get straight to the point without too much fluff. I prefer to keep it clear and action-oriented...',
    type: 'textarea',
  },
  {
    key: 'greeting',
    question: 'How do you typically greet your clients in emails?',
    description: 'Provide your preferred opening salutation.',
    placeholder: 'E.g., Hey [Name], Hi [Name], Dear [Name]...',
    type: 'text',
  },
  {
    key: 'sign_off',
    question: 'How do you typically sign off your emails?',
    description: 'Provide your preferred closing salutation.',
    placeholder: 'E.g., Thanks, Warm regards, Cheers, Best...',
    type: 'text',
  },
  {
    key: 'late_payment_approach',
    question: 'How do you handle late payments? What is your typical approach?',
    description: 'Explain how you approach unpaid invoices. Are you gentle and understanding, or direct and firm?',
    placeholder: 'E.g., I prefer starting with a gentle reminder assuming they forgot, but increasing firmness if they ignore me for weeks...',
    type: 'textarea',
  },
  {
    key: 'hard_no_gos',
    question: 'Are there any phrases, words, or approaches you want MIRA to absolutely avoid?',
    description: 'These will be hard-coded as forbidden. Enter phrases or words separated by commas.',
    placeholder: 'E.g., kindly, per our conversation, pay immediately, pay now, warning...',
    type: 'textarea',
  },
  {
    key: 'sample_message',
    question: 'Paste a sample of a real follow-up email you have sent.',
    description: 'MIRA analyzes your sample email to match your sentence length, rhythm, and natural warmth.',
    placeholder: 'E.g., Hi Sarah, hope you are having a great week. Just wanted to check in on invoice #102. Let me know if you need anything from our end...',
    type: 'textarea',
  },
  {
    key: 'use_emojis',
    question: 'Do you use emojis in your client communications?',
    description: 'Explain if you use emojis, what kind of emojis, or if you strictly avoid them.',
    placeholder: 'E.g., Yes, I use simple emojis like 👍 or 😊 occasionally to keep things friendly. / No, never.',
    type: 'textarea',
  },
];

export default function OnboardingQuestionsPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<VoiceAnswers>({
    business_description: '',
    client_relationship: '',
    natural_style: '',
    greeting: '',
    sign_off: '',
    late_payment_approach: '',
    hard_no_gos: '',
    sample_message: '',
    use_emojis: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers],
  );

  const currentQ = questions[step];
  const isLast = step === TOTAL_QUESTIONS - 1;

  const handleChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.key]: value }));
  };

  const handleNext = () => {
    if (step < TOTAL_QUESTIONS - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitVoiceAnswers(answers);
      if (result?.error) {
        setError(result.error);
        return;
      }
      
      router.push('/onboarding/integrations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-xl w-full">
        <div className="mb-6 animate-fade-up">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
              Step 2 of 5
            </p>
            <p className="text-xs text-muted-foreground">
              {answeredCount} of {TOTAL_QUESTIONS} answered
            </p>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${(answeredCount / TOTAL_QUESTIONS) * 100}%` }}
            />
          </div>
        </div>

        <Card className="p-6 sm:p-8 animate-fade-up stagger-1">
          <p className="text-xs font-medium text-muted-foreground tracking-wider uppercase mb-1">
            Question {step + 1} of {TOTAL_QUESTIONS}
          </p>
          <QuestionStep
            question={currentQ.question}
            description={currentQ.description}
            placeholder={currentQ.placeholder}
            value={answers[currentQ.key]}
            onChange={handleChange}
            type={currentQ.type}
            onNext={isLast ? handleFinish : handleNext}
            onBack={step > 0 ? handleBack : undefined}
            isFirst={step === 0}
            isLast={isLast}
            isSubmitting={isSubmitting}
          />
        </Card>

        {error && (
          <p className="text-xs text-destructive mt-3 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
