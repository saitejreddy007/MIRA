'use client';

import type { CalibrationRoundData } from '../types';

interface CalibrationRoundProps {
  round: CalibrationRoundData;
  roundIndex: number;
  selected: 'A' | 'B' | null;
  onSelect: (roundIndex: number, choice: 'A' | 'B') => void;
}

export function CalibrationRound({
  round,
  roundIndex,
  selected,
  onSelect,
}: CalibrationRoundProps) {
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
            {roundIndex + 1}
          </span>
          <div>
            <p className="text-sm font-medium text-foreground capitalize">
              Calibrating {round.dimension.replace('_', ' ')}
            </p>
            <p className="text-xs text-muted-foreground">{round.context}</p>
          </div>
        </div>
        {selected && (
          <span className="text-xs font-medium text-primary">
            Picked {selected}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MessageOption
          label="A"
          message={round.message_a}
          dimension={round.dimension}
          direction="lower"
          isSelected={selected === 'A'}
          onSelect={() => onSelect(roundIndex, 'A')}
        />
        <MessageOption
          label="B"
          message={round.message_b}
          dimension={round.dimension}
          direction="higher"
          isSelected={selected === 'B'}
          onSelect={() => onSelect(roundIndex, 'B')}
        />
      </div>
    </div>
  );
}

function MessageOption({
  label,
  message,
  dimension,
  direction,
  isSelected,
  onSelect,
}: {
  label: string;
  message: string;
  dimension: string;
  direction: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-lg border-2 p-4 transition-colors duration-500 ease-spring ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-background hover:border-muted-foreground'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
            isSelected
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          Option {label}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase">
          {dimension} {direction === 'higher' ? '+' : '-'}
        </span>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{message}</p>
    </button>
  );
}
