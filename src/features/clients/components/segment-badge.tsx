const colors: Record<string, string> = {
  A: 'bg-purple-50 text-purple-700',
  B: 'bg-blue-50 text-blue-700',
  C: 'bg-yellow-50 text-yellow-700',
  D: 'bg-gray-50 text-gray-600',
  E: 'bg-red-50 text-red-700',
};

const labels: Record<string, string> = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
};

export function SegmentBadge({ segment }: { segment: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${colors[segment] || colors.D}`}>
      {labels[segment] || 'D'}
    </span>
  );
}
