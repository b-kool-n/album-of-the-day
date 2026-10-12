// Black vinyl on hot orange.
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#FF4F12" />
      <circle cx="32" cy="32" r="25" fill="#0B0A09" />
      <circle cx="32" cy="32" r="21.5" fill="none" stroke="#2B2724" strokeWidth=".9" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="#2B2724" strokeWidth=".9" />
      <circle cx="32" cy="32" r="14.5" fill="none" stroke="#2B2724" strokeWidth=".9" />
      <path d="M14 22 A21 21 0 0 1 24 13" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="32" cy="32" r="9" fill="#FF4F12" />
      <circle cx="32" cy="32" r="1.8" fill="#0B0A09" />
    </svg>
  );
}

export function Disc() {
  return <div className="disc" aria-hidden="true" />;
}
