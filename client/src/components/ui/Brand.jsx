// PlanCrest mark + the contour-line backdrop used on brand surfaces.

export function Logo({ size = 28, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} role="img" aria-label="PlanCrest">
      <rect width="48" height="48" rx="12" fill="#2563eb" />
      <path d="M23 35 32 19l9 16z" fill="#9db9f5" stroke="#9db9f5" strokeWidth="3" strokeLinejoin="round" />
      <path d="M8 35 19 14l11 21z" fill="#fff" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
      <path d="M9 40.5h30" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ size = 26, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Logo size={size} />
      <span>PlanCrest</span>
    </span>
  );
}

// Topographic lines. Deterministic (no randomness) so renders are stable.
export function Contours({ className = "br-contours", lines = 38, opacity = 1 }) {
  const paths = Array.from({ length: lines }, (_, i) => {
    const x = -80 + i * 34;
    const bend = Math.sin(i / 3.2) * 80;
    return `M${x} -30 C ${x + 150 + bend} 80, ${x - 90 - bend} 200, ${x + 70} 340 S ${x + 190 + bend} 440, ${x + 50} 560`;
  });
  return (
    <svg className={className} viewBox="0 0 1100 460" preserveAspectRatio="none" aria-hidden="true" style={{ opacity }}>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#fff" strokeOpacity={0.05 + (i % 6) * 0.012} strokeWidth="1" />
      ))}
    </svg>
  );
}
