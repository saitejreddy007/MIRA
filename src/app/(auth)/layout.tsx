import { Logo } from '@/components/brand/Logo';
import { Toaster } from '@/components/ui/toast';
import { WhiteMirrorAttribution } from '@/components/brand/WhiteMirrorAttribution';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 sm:mb-8 animate-fade-up">
          <Logo size={48} withWordmark />
          <p className="mt-3 text-sm text-muted-foreground text-center max-w-xs">
            The AI that follows up on overdue invoices in your voice
          </p>
        </div>
        <div className="animate-fade-up stagger-1">{children}</div>

        <p className="text-center text-[11px] text-muted-foreground mt-6 sm:mt-8 animate-fade-up stagger-2">
          By continuing, you agree to MIRA&apos;s{' '}
          <a href="#" className="underline hover:text-foreground">Terms</a> and{' '}
          <a href="#" className="underline hover:text-foreground">Privacy</a>.
        </p>

        <div className="mt-5 sm:mt-6 flex justify-center animate-fade-up stagger-3">
          <WhiteMirrorAttribution />
        </div>
      </div>
      <Toaster />
    </div>
  );
}
