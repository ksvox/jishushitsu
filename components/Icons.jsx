export function BackIcon({ color = '#F4F1E6' }) {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14,4 7,11 14,18" />
    </svg>
  );
}
export function PlayIcon({ color = 'currentColor' }) {
  return (
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill={color}>
      <polygon points="3,2 14,8 3,14" />
    </svg>
  );
}
export function ClockIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="#C8381F" strokeWidth="2">
      <circle cx="14" cy="15" r="10" />
      <line x1="14" y1="15" x2="14" y2="9" />
      <line x1="11" y1="3" x2="17" y2="3" />
    </svg>
  );
}
