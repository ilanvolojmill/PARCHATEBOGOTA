interface VerifiedBadgeProps {
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function VerifiedBadge({ size = "sm", showLabel = false }: VerifiedBadgeProps) {
  return (
    <span
      className={`verified-badge verified-badge-${size}`}
      title="Selfie confirmada — no es KYC gubernamental"
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path
          d="M8 12.5l2.5 2.5L16 9"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showLabel && <span>Selfie OK</span>}
    </span>
  );
}
