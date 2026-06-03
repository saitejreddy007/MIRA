'use client';

import { useState } from 'react';
import { Check, X, ArrowLeft, Sparkles, BarChart3 } from 'lucide-react';
import type { CalibrationReview } from '../actions/get-calibration-review';

const dimensionLabels: Record<string, string> = {
  warmth: 'Warmth',
  directness: 'Directness',
  opening_style: 'Opening style',
  paragraph_length: 'Paragraph length',
  tension_tolerance: 'Tension tolerance',
};

export function CalibrationReviewClient({ review }: { review: CalibrationReview }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (review.rounds.length === 0) {
    return (
      <div className="card text-center py-12">
        <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground mb-1">No A/B rounds yet</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Complete the voice calibration to see the A/B comparisons MIRA used to tune your voice.
        </p>
        <a href="/settings/voice" className="text-sm text-primary hover:underline">
          Go to voice setup →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <a
          href="/settings/voice"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to voice settings
        </a>
        <h1 className="text-2xl font-semibold text-foreground">Calibration rounds</h1>
        <p className="text-sm text-muted-foreground mt-1">
          See the A/B message pairs MIRA generated to learn your voice. Your selections shaped the constitution.
        </p>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Selection summary</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <SummaryStat label="A selected" value={review.stats.a_selected} accent="purple" />
          <SummaryStat label="B selected" value={review.stats.b_selected} accent="blue" />
          <SummaryStat label="Not answered" value={review.stats.not_selected} accent="gray" />
        </div>
        {!review.stats.all_answered && (
          <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2 mt-4">
            Some rounds were not answered. MIRA used the most common choice as a fallback for those.
          </p>
        )}
      </div>

      <div className="space-y-3">
        {review.rounds.map((round) => {
          const isExpanded = expanded === round.round;
          return (
            <div key={round.round} className="card !p-0 overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : round.round)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-background/30 transition-colors duration-500 ease-spring"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{round.round}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {dimensionLabels[round.dimension] || round.dimension}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{round.context}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {round.selected ? (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      round.selected === 'A' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      <Check className="w-3 h-3" />
                      Picked {round.selected}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500">
                      <X className="w-3 h-3" />
                      Skipped
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">{isExpanded ? '−' : '+'}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border bg-background/30 p-5 grid md:grid-cols-2 gap-4">
                  <MessagePane label="A" body={round.message_a} selected={round.selected === 'A'} accent="purple" />
                  <MessagePane label="B" body={round.message_b} selected={round.selected === 'B'} accent="blue" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: number; accent: 'purple' | 'blue' | 'gray' }) {
  const color = accent === 'purple' ? 'text-purple-700' : accent === 'blue' ? 'text-blue-700' : 'text-gray-600';
  const bg = accent === 'purple' ? 'bg-purple-50' : accent === 'blue' ? 'bg-blue-50' : 'bg-gray-50';
  return (
    <div className={`rounded-lg ${bg} px-4 py-3`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function MessagePane({ label, body, selected, accent }: {
  label: string;
  body: string;
  selected: boolean;
  accent: 'purple' | 'blue';
}) {
  const ring = selected
    ? accent === 'purple' ? 'ring-2 ring-purple-300' : 'ring-2 ring-blue-300'
    : 'ring-1 ring-border';
  const tagBg = accent === 'purple' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';

  return (
    <div className={`bg-white rounded-lg p-4 ${ring}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${tagBg}`}>Option {label}</span>
        {selected && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
            <Check className="w-3 h-3" />
            Your choice
          </span>
        )}
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{body}</p>
    </div>
  );
}
