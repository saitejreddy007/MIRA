export function AuroraBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute -top-32 -left-24 h-[480px] w-[480px] rounded-full opacity-40 blur-3xl animate-aurora-drift"
        style={{
          background:
            'radial-gradient(closest-side, hsl(271 91% 65% / 0.45), transparent 70%)',
        }}
      />
      <div
        className="absolute top-1/3 -right-24 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl animate-aurora-drift-slow"
        style={{
          background:
            'radial-gradient(closest-side, hsl(189 94% 53% / 0.40), transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl animate-aurora-drift"
        style={{
          background:
            'radial-gradient(closest-side, hsl(213 94% 68% / 0.35), transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-24 right-1/4 h-[380px] w-[380px] rounded-full opacity-30 blur-3xl animate-aurora-drift-slow"
        style={{
          background:
            'radial-gradient(closest-side, hsl(322 81% 70% / 0.30), transparent 70%)',
        }}
      />
    </div>
  );
}
