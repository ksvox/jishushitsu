import { step } from '../lib/theory';

// 調号の位置(音名 0=ド〜6=シ ごとの五線上の段)
const SHARP_AT = { 3: 38, 0: 35, 4: 39, 1: 36, 5: 33, 2: 37, 6: 34 };
const FLAT_AT = { 6: 34, 2: 37, 5: 33, 1: 36, 4: 32, 0: 35, 3: 31 };
const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6];
const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3];
const y = (s) => 92 - (s - 30) * 7;
const MARK_GLYPH = { '': '', '#': '♯', b: '♭', n: '♮' };
const glyph = (a) => (a === 2 ? '𝄪' : a === 1 ? '♯' : a === -1 ? '♭' : a === -2 ? '𝄫' : '');

// ト音記号の五線譜(自作SVG)。chalk=true で黒板のチョーク風
export default function Staff({ notes = [], keySig = null, chalk = false, width = 340, cursor = false, label = '五線譜', stack = false }) {
  const ink = chalk ? '#F4F1E6' : '#23382B';
  const W = width;
  const sigType = keySig ? keySig.t : '';
  const sigLetters = keySig ? keySig.letters || (sigType === '#' ? SHARP_ORDER : FLAT_ORDER).slice(0, keySig.c) : [];
  const sigCount = sigLetters.length;
  const sigEnd = 74 + sigCount * 15;
  const x0 = sigCount || cursor ? sigEnd + 14 : 92;
  const n = stack ? 1 : notes.length || 1;
  const spacing = Math.min(90, (W - 14 - x0) / n);
  // 和音(縦に積む)の時:隣り合う音は符頭を右にずらし、臨時記号は左に段違いで並べる
  const shift = [];
  const accX = [];
  if (stack) {
    const order = notes.map((nt, i) => ({ s: step(nt), i })).sort((a, b) => a.s - b.s);
    let prevS = null;
    let prevShift = false;
    let k = 0;
    order.forEach(({ s, i }) => {
      const sh = prevS !== null && s - prevS === 1 && !prevShift;
      shift[i] = sh ? 17 : 0;
      prevS = s;
      prevShift = sh;
    });
    [...order].reverse().forEach(({ i }) => {
      if (notes[i].a !== 0 || (notes[i].mark !== undefined && notes[i].mark !== '')) {
        accX[i] = -27 - (k % 2) * 14;
        k++;
      }
    });
  }
  const lineYs = [30, 32, 34, 36, 38].map(y);

  return (
    <svg className="staff" role="img" aria-label={label} viewBox={`0 0 ${W} 132`} width="100%" style={{ maxWidth: W }}>
      <g stroke={ink} strokeWidth={chalk ? 1.6 : 1.3} strokeLinecap="round" opacity={chalk ? 0.92 : 1}>
        {lineYs.map((ly) => (
          <line key={ly} x1="6" y1={ly} x2={W - 6} y2={ly} />
        ))}
      </g>
      <text x="8" y="101" fontFamily="'Noto Music', serif" fontSize="72" fill={ink}>𝄞</text>

      {sigLetters.map((l, i) => {
        const s = sigType === '#' ? SHARP_AT[l] : FLAT_AT[l];
        return (
          <text key={i} x={74 + i * 15} y={y(s) + (sigType === '#' ? 8 : 5)} fontFamily="'Noto Music', serif" fontSize="26" fill={(keySig.colors && keySig.colors[i]) || ink}>
            {sigType === '#' ? '♯' : '♭'}
          </text>
        );
      })}
      {cursor && (
        <rect x={sigEnd - 2} y="22" width="18" height="84" rx="4" fill="none" stroke={chalk ? '#F3D77A' : '#C8381F'} strokeWidth="1.8" strokeDasharray="5 4" />
      )}

      {notes.map((nt, i) => {
        const s = step(nt);
        const nx = x0 + spacing * ((stack ? 0 : i) + 0.5) + (shift[i] || 0);
        const ny = y(s);
        const col = nt.color || ink;
        const ledgers = [];
        for (let ls = 28; ls >= s; ls -= 2) ledgers.push(ls);
        for (let ls = 40; ls <= s; ls += 2) ledgers.push(ls);
        return (
          <g key={i}>
            {ledgers.map((ls) => (
              <line key={ls} x1={nx - 15} y1={y(ls)} x2={nx + 15} y2={y(ls)} stroke={ink} strokeWidth="1.5" />
            ))}
            {(() => {
              // mark が指定されていれば、書かれた臨時記号('#','b','n','')をそのまま表示
              const g = nt.mark !== undefined ? MARK_GLYPH[nt.mark] : glyph(nt.a);
              if (!g) return null;
              const dy = g === '♭' || g === '𝄫' || g === '𝄪' ? 5 : g === '♮' ? 7 : 8;
              return (
                <text x={nx - (shift[i] || 0) + (accX[i] ?? -27)} y={ny + dy} fontFamily="'Noto Music', serif" fontSize="25" fill={nt.markColor || col}>
                  {g}
                </text>
              );
            })()}
            <ellipse cx={nx} cy={ny} rx="9" ry="6.3" fill="none" stroke={col} strokeWidth="2.6" transform={`rotate(-22 ${nx} ${ny})`} />
          </g>
        );
      })}
    </svg>
  );
}
