// 赤ペンの花丸・間違いの印・タイマー
export function Hanamaru({ color = '#C8381F', size = 90 }) {
  return (
    <svg role="img" aria-label="正解" width={size} height={size} viewBox="0 0 96 96" className="hanamaru">
      <g fill="none" stroke={color} strokeLinecap="round">
        <path d="M48 10 C72 10 88 26 86 50 C84 74 64 88 44 86 C22 84 8 66 10 44 C12 24 30 12 52 14" strokeWidth="5" />
        <path d="M48 26 C62 26 72 36 70 50 C68 64 56 70 46 69 C34 68 26 58 28 46 C30 36 40 30 50 31" strokeWidth="4.5" />
        <path d="M48 40 C55 40 58 46 56 51 C54 56 47 58 43 54 C39 50 41 43 48 43" strokeWidth="4" />
      </g>
    </svg>
  );
}

export function Batsu({ color = '#23382B', size = 72 }) {
  return (
    <svg role="img" aria-label="不正解" width={size} height={size} viewBox="0 0 80 80">
      <g stroke={color} strokeWidth="6" strokeLinecap="round">
        <line x1="18" y1="18" x2="62" y2="62" />
        <line x1="62" y1="18" x2="18" y2="62" />
      </g>
    </svg>
  );
}

export function TimerRing({ seconds, total = 20 }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const left = Math.max(0, seconds);
  const ratio = Math.min(1, left / total);
  return (
    <div className="timer" aria-label={`残り${Math.ceil(left)}秒`}>
      <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(244,241,230,0.2)" strokeWidth="4" />
        <circle cx="26" cy="26" r={r} fill="none" stroke="#F59A8B" strokeWidth="4" strokeDasharray={`${circ * ratio} ${circ}`} strokeLinecap="round" transform="rotate(-90 26 26)" />
      </svg>
      <span className={left <= 0 ? 'over' : ''}>{Math.ceil(left)}</span>
    </div>
  );
}
