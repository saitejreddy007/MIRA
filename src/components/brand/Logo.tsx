import * as React from 'react';
import { cn } from '@/lib/utils';
import { WhiteMirrorMark } from './WhiteMirrorMark';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<LogoSize, { mark: number; text: string; sub: string; gap: string }> = {
  xs: { mark: 22, text: 'text-sm', sub: 'text-[9px]', gap: 'gap-2' },
  sm: { mark: 28, text: 'text-sm', sub: 'text-[10px]', gap: 'gap-2' },
  md: { mark: 36, text: 'text-base', sub: 'text-[10px]', gap: 'gap-2.5' },
  lg: { mark: 48, text: 'text-xl', sub: 'text-[11px]', gap: 'gap-3' },
  xl: { mark: 64, text: 'text-2xl', sub: 'text-xs', gap: 'gap-3.5' },
};

interface LogoProps {
  className?: string;
  size?: LogoSize | number;
  withWordmark?: boolean;
  /** Show 'A WhiteMirror product' attribution below the wordmark */
  attribution?: boolean;
  /** Use the WhiteMirror mark instead of the MIRA 'M' letter */
  showBrand?: boolean;
  /** Override the product wordmark text. Defaults to 'MIRA'. */
  productName?: string;
  /** Override the tagline below the product name. */
  tagline?: string;
  tone?: 'auto' | 'light' | 'dark';
}

export function Logo({
  className,
  size = 'md',
  withWordmark = false,
  attribution = false,
  showBrand = false,
  productName = 'MIRA',
  tagline = 'AI Representative',
  tone = 'auto',
}: LogoProps) {
  const config = typeof size === 'number'
    ? { mark: size, text: 'text-base', sub: 'text-[10px]', gap: 'gap-2.5' }
    : sizeMap[size];

  const toneClass =
    tone === 'light'
      ? 'text-white'
      : tone === 'dark'
      ? 'text-foreground'
      : 'text-foreground';

  return (
    <div className={cn('inline-flex items-center', config.gap, toneClass, className)}>
      {showBrand ? (
        <WhiteMirrorMark size={config.mark} className="text-foreground" />
      ) : (
        <div
          className="relative shrink-0 flex items-center justify-center squircle bg-foreground text-background font-bold tracking-tighter"
          style={{ width: config.mark, height: config.mark, fontSize: config.mark * 0.45 }}
          aria-label={productName}
        >
          {productName.charAt(0)}
        </div>
      )}
      {withWordmark && (
        <div className="leading-none">
          <p className={cn('font-display font-bold tracking-tight', config.text)}>
            {productName}
          </p>
          <p className={cn('uppercase tracking-widest text-muted-foreground font-medium mt-0.5', config.sub)}>
            {tagline}
          </p>
          {attribution && (
            <p className={cn('text-muted-foreground/70 font-normal normal-case tracking-normal mt-1', config.sub)}>
              A WhiteMirror product
            </p>
          )}
        </div>
      )}
    </div>
  );
}
