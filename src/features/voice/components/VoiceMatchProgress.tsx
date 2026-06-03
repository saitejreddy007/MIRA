'use client';

interface VoiceMatchProgressProps {
  current: number;
  total: number;
  isComplete: boolean;
}

export function VoiceMatchProgress({
  current,
  total,
  isComplete,
}: VoiceMatchProgressProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-colors duration-500 ease-spring ${
            i < current
              ? 'bg-primary'
              : i === current && !isComplete
                ? 'bg-primary/40'
                : 'bg-border'
          }`}
        />
      ))}
    </div>
  );
}
