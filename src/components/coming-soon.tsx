import { Sparkles, Calendar } from 'lucide-react';

type Props = {
  title: string;
  description: string;
  phase?: number;
};

export function ComingSoon({ title, description, phase = 2 }: Props) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full text-center animate-fade-up">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-card border border-border mb-5">
          <Sparkles className="h-6 w-6 text-muted-foreground" strokeWidth={2} />
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          Planned for Phase {phase}
        </div>
      </div>
    </div>
  );
}
