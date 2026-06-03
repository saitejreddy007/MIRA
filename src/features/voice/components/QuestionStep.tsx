'use client';

import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionStepProps {
  question: string;
  description: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'textarea' | 'select';
  options?: { label: string; value: string }[];
  optional?: boolean;
  onNext: () => void;
  onBack?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function QuestionStep({
  question,
  description,
  placeholder,
  value,
  onChange,
  type = 'text',
  options,
  optional,
  onNext,
  onBack,
  isFirst,
  isLast,
}: QuestionStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-xl font-semibold tracking-tight text-foreground leading-snug">
          {question}
        </h3>
        {(description || optional) && (
          <p className="text-sm text-muted-foreground mt-1.5">
            {description}
            {description && optional && <span className="text-muted-foreground/70 ml-1">· Optional</span>}
            {!description && optional && 'Optional'}
          </p>
        )}
      </div>

      <div>
        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="input min-h-[120px] resize-none"
          />
        ) : type === 'select' && options ? (
          <div className="space-y-2">
            {options.map((opt) => {
              const selected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange(opt.value)}
                  className={cn(
                    'group relative w-full text-left rounded-xl border px-4 py-3.5 text-sm transition-all duration-500 ease-spring',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
                    selected
                      ? 'border-primary/50 bg-primary/8 text-foreground font-semibold shadow-[0_0_0_4px_rgba(34,197,94,0.08)]'
                      : 'border-border/60 bg-white/40 dark:bg-white/5 text-foreground/80 hover:border-border hover:bg-white/70 dark:hover:bg-white/10 hover:-translate-y-px'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ease-spring',
                        selected
                          ? 'bg-primary border-primary text-white'
                          : 'border-border group-hover:border-muted-foreground/40'
                      )}
                    >
                      {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span>{opt.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="input"
          />
        )}
      </div>

      <div className="flex gap-2 pt-2">
        {!isFirst && (
          <button
            type="button"
            onClick={onBack}
            className="btn-ghost px-4 h-11"
            aria-label="Previous question"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={!optional && !value.trim()}
          className="btn-primary flex-1 h-11 group"
        >
          {isLast ? 'Finish & analyze' : 'Continue'}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
