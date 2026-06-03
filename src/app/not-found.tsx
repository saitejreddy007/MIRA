import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="text-center max-w-md w-full animate-fade-up">
        <div className="flex justify-center mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center squircle-lg glass-card">
            <Compass className="h-7 w-7 text-muted-foreground" strokeWidth={1.75} />
          </div>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">404</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">
          Page not found
        </h1>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-2">
          <Link href="/overview" className="btn-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to overview
          </Link>
        </div>
        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium mt-10">
          A WhiteMirror product
        </p>
      </div>
    </div>
  );
}
