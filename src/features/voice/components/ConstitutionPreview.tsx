'use client';

import type { VoiceConstitution } from '../types';

interface ConstitutionPreviewProps {
  constitution: VoiceConstitution;
  onLock: () => void;
  loading: boolean;
  confidenceScore?: number;
  confidenceFlag?: string;
}

export function ConstitutionPreview({
  constitution,
  onLock,
  loading,
  confidenceScore,
  confidenceFlag,
}: ConstitutionPreviewProps) {
  const dims = constitution.voice_dimensions;

  return (
    <div className="space-y-6">
      <div className="card space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Voice Constitution
            </h2>
            <p className="text-sm text-muted-foreground">
              v{constitution.version} &middot; {constitution.business_identity.industry}
              {constitution.business_identity.culture === 'indian_english' && ' \u00b7 Indian English'}
            </p>
          </div>
          {confidenceScore !== undefined && (
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">
                {confidenceScore}%
              </span>
              <p className="text-[10px] text-muted-foreground">confidence</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ScoreBar label="Warmth" value={dims.warmth} color="green" />
          <ScoreBar label="Formality" value={dims.formality} color="green" />
          <ScoreBar label="Directness" value={dims.directness} color="green" />
          <ScoreBar label="Tension Tolerance" value={dims.tension_tolerance} color="green" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
            {dims.cognitive_pattern.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Surface Rules</h3>
            <ul className="space-y-1 text-sm text-foreground">
              <li>Greeting: <strong>{constitution.surface_rules.greeting}</strong></li>
              <li>Signoff: <strong>{constitution.surface_rules.signoff}</strong></li>
              <li>Emoji: {constitution.surface_rules.emoji_allowed ? 'Allowed' : 'Not allowed'}</li>
              <li>Contractions: {constitution.surface_rules.contraction_preference ? 'Prefer' : 'Avoid'}</li>
              <li>Punctuation: <strong>{constitution.surface_rules.punctuation_style}</strong></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Structural Rules</h3>
            <ul className="space-y-1 text-sm text-foreground">
              <li>Opening: <strong>{constitution.structural_rules.opening_pattern.replace(/_/g, ' ')}</strong></li>
              <li>CTA style: <strong>{constitution.structural_rules.cta_style.replace(/_/g, ' ')}</strong></li>
              <li>Paragraph: <strong>{constitution.structural_rules.paragraph_length}</strong></li>
              <li>Bad news: <strong>{constitution.structural_rules.bad_news_delivery}</strong></li>
            </ul>
          </div>
        </div>

        {constitution.vocabulary.forbidden_words.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Forbidden Words</h3>
            <div className="flex flex-wrap gap-1.5">
              {constitution.vocabulary.forbidden_words.map((w) => (
                <span key={w} className="px-2 py-0.5 rounded bg-red-50 text-red-600 text-xs">
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {constitution.vocabulary.power_words.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Power Words</h3>
            <div className="flex flex-wrap gap-1.5">
              {constitution.vocabulary.power_words.map((w) => (
                <span key={w} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {constitution.vocabulary.regional_markers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Regional Markers</h3>
            <div className="flex flex-wrap gap-1.5">
              {constitution.vocabulary.regional_markers.map((m) => (
                <span key={m} className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Tension Rules &mdash; Day 1: <strong>{constitution.tension_rules.day1_approach}</strong>
            &middot; Escalation: <strong>{constitution.tension_rules.escalation_speed}</strong>
            &middot; Max pressure: <strong>{constitution.tension_rules.max_pressure_level}%</strong>
          </h3>
        </div>

        {confidenceFlag && (
          <div className={`rounded-lg p-3 text-sm ${
            confidenceScore && confidenceScore >= 70
              ? 'bg-primary/10 text-primary'
              : confidenceScore && confidenceScore >= 40
                ? 'bg-amber-50 text-amber-800'
                : 'bg-red-50 text-red-700'
          }`}>
            {confidenceFlag}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onLock}
        disabled={loading}
        className="btn-primary flex items-center justify-center gap-2"
      >
        {loading ? 'Locking Constitution...' : 'Lock Constitution & Complete Onboarding'}
      </button>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold text-foreground">{value}</span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
