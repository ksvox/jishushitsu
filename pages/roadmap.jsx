import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BackIcon } from '../components/Icons';
import { Hanamaru, Batsu } from '../components/Marks';
import Score from '../components/Score';
import { ROAD_LEVELS, makeScore, solveOrder, firstMismatch } from '../lib/roadmap';

const IDS = ['beginner', 'intermediate', 'advanced'];

function Seq({ list, mark, cls }) {
  if (!list.length) return <span style={{ color: '#55625A' }}>―</span>;
  return (
    <>
      {list.map((x, k) => (
        <span key={k}>
          {k > 0 && '-'}
          <span className={k === mark ? cls : ''}>{x}</span>
        </span>
      ))}
    </>
  );
}

export default function Roadmap() {
  const router = useRouter();
  const [level, setLevel] = useState('beginner');
  const [bars, setBars] = useState(null);
  const [taps, setTaps] = useState([]);
  const [result, setResult] = useState(null);
  const [flash, setFlash] = useState(-1);
  const [count, setCount] = useState(0);
  const [okCount, setOkCount] = useState(0);
  const timer = useRef(null);

  const fresh = useCallback((lv) => {
    setBars(makeScore(lv));
    setTaps([]);
    setResult(null);
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const lv = IDS.includes(router.query.level) ? router.query.level : 'beginner';
    setLevel(lv);
    fresh(lv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const tap = (i) => {
    if (result) return;
    setTaps((t) => (t.length >= 60 ? t : [...t, bars[i].label]));
    setFlash(i);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlash(-1), 250);
  };

  const check = () => {
    const correct = solveOrder(bars);
    const k = firstMismatch(taps, correct);
    setResult({ ok: k === -1, correct, k });
    setCount((c) => c + 1);
    if (k === -1) setOkCount((c) => c + 1);
  };

  const conf = ROAD_LEVELS[level];

  return (
    <div className="app">
      <header className="board bhead">
        <div className="wood-top" />
        <div className="bhead-row">
          <Link href="/" className="back" aria-label="トップへ戻る">
            <BackIcon />
          </Link>
          <div className="bhead-titles">
            <div className="bhead-sub">第三章 進行記号 ・ 練習</div>
            <div className="bhead-title">
              進む順にタップ <small>正解 {okCount} / {count}</small>
            </div>
          </div>
        </div>
        <div className="tabs" role="tablist">
          {IDS.map((id) => (
            <button key={id} role="tab" aria-selected={level === id} className={`tab ${level === id ? 'sel' : ''}`} onClick={() => { setLevel(id); fresh(id); }}>
              {ROAD_LEVELS[id].label}
            </button>
          ))}
        </div>
      </header>

      <main className="paper q-area">
        <p className="q-sub" style={{ margin: 0 }}>{conf.info}</p>
        <h2 className="q-title">この譜面を、進む順番どおりにタップしよう</h2>
        {bars && (
          <div className="sheet" style={{ padding: '8px 8px 4px' }}>
            <Score bars={bars} onTap={result ? undefined : tap} flashIndex={flash} />
          </div>
        )}

        <div className="pick-label">あなたの答え</div>
        <div className="sheet" style={{ alignItems: 'flex-start', padding: '10px 12px' }}>
          <div className="order">
            <Seq list={taps} mark={result && !result.ok ? result.k : -1} cls="bad" />
          </div>
        </div>

        {result ? (
          <>
            <div className="verdict" aria-live="polite">
              {result.ok ? <Hanamaru /> : <Batsu />}
              <div className="verdict-text">
                <span className={result.ok ? 'verdict-ok' : 'verdict-ng'}>{result.ok ? '正解!' : '残念!'}</span>
                {!result.ok && (
                  <span style={{ fontSize: 15, fontWeight: 700 }}>
                    {result.k + 1}番目がちがいます(正しくは「{result.correct[result.k] ?? 'ここで終わり'}」)
                  </span>
                )}
              </div>
            </div>
            {!result.ok && (
              <>
                <div className="pick-label">正解</div>
                <div className="sheet" style={{ alignItems: 'flex-start', padding: '10px 12px' }}>
                  <div className="order">
                    <Seq list={result.correct} mark={result.k} cls="good" />
                  </div>
                </div>
              </>
            )}
            <div className="next-actions">
              <button className="btn btn-ink" onClick={() => fresh(level)}>同じレベルの練習を続ける</button>
              {IDS.indexOf(level) < IDS.length - 1 ? (
                <button
                  className="btn btn-line"
                  onClick={() => {
                    const nx = IDS[IDS.indexOf(level) + 1];
                    setLevel(nx);
                    fresh(nx);
                  }}
                >
                  次のレベルの練習へ:{ROAD_LEVELS[IDS[IDS.indexOf(level) + 1]].label}
                </button>
              ) : (
                <Link href="/" className="btn btn-line">トップへ戻る</Link>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="grid2">
              <button className="btn btn-line" disabled={!taps.length} onClick={() => setTaps(taps.slice(0, -1))}>1つ消す</button>
              <button className="btn btn-line" disabled={!taps.length} onClick={() => setTaps([])}>最初から</button>
            </div>
            <button className="btn btn-red" disabled={!taps.length} onClick={check}>回答</button>
            <Link href="/learn/3" className="hint-link" style={{ textAlign: 'center' }}>覚え方を見る</Link>
          </>
        )}
      </main>
      <footer className="footer">© ボーカル道場K's VOX</footer>
    </div>
  );
}
