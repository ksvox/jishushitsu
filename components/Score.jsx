// 進行記号つきの譜面(音符なし)。小節をタップできる
function Bar({ b, prev, next, isLast, onTap, flash, chalk }) {
  const endingStart = b.ending && (!prev || prev.ending !== b.ending);
  const endingEnd = b.ending && (!next || next.ending !== b.ending);
  const Tag = onTap ? 'button' : 'div';
  return (
    <Tag className={`sbar ${flash ? 'flash' : ''} ${chalk ? 'chalk' : ''}`} onClick={onTap} aria-label={`${b.label}の小節`}>
      <div className="sb-top">
        {b.ending && (
          <span className={`sb-ending ${endingStart ? 'start' : ''} ${endingEnd && b.ending === 1 ? 'end' : ''}`}>
            {endingStart ? `${b.ending}.` : ''}
          </span>
        )}
        {b.segno && <span className="sb-sign">𝄋</span>}
        {b.coda && <span className="sb-sign">𝄌</span>}
        {b.toCoda && <span className="sb-right">to Coda <span className="sb-glyph">𝄌</span></span>}
        {b.fine && <span className="sb-right">Fine</span>}
      </div>
      <div className="sb-staff">
        <span className={`sb-line-l ${b.startRepeat ? 'repeat' : ''}`}>{b.startRepeat && <i className="rdots" />}</span>
        <span className="sb-label">{b.label}</span>
        <span className={`sb-line-r ${b.endRepeat ? 'repeat' : isLast ? 'final' : ''}`}>{b.endRepeat && <i className="rdots" />}</span>
      </div>
      <div className="sb-bottom">{b.ds || b.dc || ''}</div>
    </Tag>
  );
}

export default function Score({ bars, onTap, flashIndex = -1, chalk = false, perRow = 4 }) {
  const rows = [];
  for (let i = 0; i < bars.length; i += perRow) rows.push(i);
  return (
    <div className={`road ${chalk ? 'chalk' : ''}`}>
      {rows.map((r) => (
        <div className="road-row" key={r} style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }}>
          {bars.slice(r, r + perRow).map((b, k) => {
            const i = r + k;
            return (
              <Bar
                key={i}
                b={b}
                prev={bars[i - 1]}
                next={bars[i + 1]}
                isLast={i === bars.length - 1}
                onTap={onTap ? () => onTap(i) : undefined}
                flash={flashIndex === i}
                chalk={chalk}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
