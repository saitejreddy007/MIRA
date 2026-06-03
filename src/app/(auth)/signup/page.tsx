'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { IconTile } from '@/components/shared/IconTile';
import { cn } from '@/lib/utils';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <Card className="p-6 sm:p-8 text-center">
        <div className="flex justify-center">
          <IconTile icon={CheckCircle2} size="xl" tone="success" />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight mt-5">Check your inbox</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          We sent a confirmation link to <strong className="text-foreground font-semibold">{email}</strong>.
          Click it to activate your account.
        </p>
        <Link href="/login" className="btn-primary w-full mt-6 h-11 justify-center">
          Back to sign in
        </Link>
      </Card>
    );
  }

  const passwordStrength =
    password.length === 0 ? 0 :
    password.length < 6 ? 1 :
    password.length < 10 ? 2 : 3;

  const strengthColors = ['bg-border', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500'];
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Get MIRA recovering revenue in under 2 minutes.
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="label">Full name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
            <input
              id="fullName"
              type="text"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input pl-10"
              autoComplete="name"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">Work email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-10"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10 pr-10"
              autoComplete="new-password"
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center squircle-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors duration-500 ease-spring cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 squircle-full transition-colors duration-500 ease-spring',
                      i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-border'
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {strengthLabels[passwordStrength]}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="squircle-sm bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-fade-in"
          >
            <span className="inline-block h-1.5 w-1.5 squircle-full bg-rose-500 mt-1.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full h-11 text-sm group"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors duration-500 ease-spring">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
