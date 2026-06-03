export const VALID_SEGMENTS = ['A', 'B', 'C', 'D', 'E'] as const;
export type ClientSegment = (typeof VALID_SEGMENTS)[number];

export const DEFAULT_SEGMENT: ClientSegment = 'D';

export function isValidSegment(value: unknown): value is ClientSegment {
  return typeof value === 'string' && (VALID_SEGMENTS as readonly string[]).includes(value);
}

export function normalizeSegment(value: unknown): ClientSegment {
  if (isValidSegment(value)) return value;
  return DEFAULT_SEGMENT;
}
