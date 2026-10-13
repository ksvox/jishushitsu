const WHITE = [0, 2, 4, 5, 7, 9, 11];
const BLACK = [
  { semi: 1, after: 0 },
  { semi: 3, after: 1 },
  { semi: 6, after: 3 },
  { semi: 8, after: 4 },
  { semi: 10, after: 5 },
];

// 鍵盤。start は C の音番号(60 = 中央のド)。lit に入っている音が光る
export default function Keyboard({ start = 60, octaves = 1, extraC = true, lit = [], labels = {}, chalk = false, height = 150, marks = null }) {
  const whites = [];
  for (let o = 0; o < octaves; o++) WHITE.forEach((s) => whites.push(start + 12 * o + s));
  if (extraC) whites.push(start + 12 * octaves);
  const blacks = [];
  for (let o = 0; o < octaves; o++) BLACK.forEach((b) => blacks.push({ midi: start + 12 * o + b.semi, after: o * 7 + b.after }));
  const wPct = 100 / whites.length;
  const litSet = new Set(lit);

  return (
    <div className="kb-wrap">
      {marks && (
        <div className="kb-marks">
          {marks.map((m, i) => (
            <span key={i} className={`kb-mark ${m === '半' ? 'half' : ''} ${chalk ? 'chalk' : ''}`} style={{ left: `${wPct * (i + 1)}%` }}>
              {m}
            </span>
          ))}
        </div>
      )}
      <div className={`kb ${chalk ? 'on-board' : ''}`} style={{ height }} role="img" aria-label="鍵盤">
        {whites.map((m, i) => (
          <div key={m} className={`kb-white ${litSet.has(m) ? 'lit' : ''}`} style={{ left: `${wPct * i}%`, width: `${wPct}%` }}>
            {labels[m] && <span className="kb-label">{labels[m]}</span>}
          </div>
        ))}
        {blacks.map((b) => (
          <div
            key={b.midi}
            className={`kb-black ${litSet.has(b.midi) ? 'lit' : ''}`}
            style={{ left: `${wPct * (b.after + 1) - wPct * 0.31}%`, width: `${wPct * 0.62}%` }}
          >
            {labels[b.midi] && <span className="kb-label-b">{labels[b.midi]}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
