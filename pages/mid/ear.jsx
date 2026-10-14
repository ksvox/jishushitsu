import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BackIcon, PlayIcon } from '../../components/Icons';
import { NameBuilder, builtName } from '../../components/MidQuestions';
import Staff from '../../components/Staff';
import { LEVELS, makeSong, sameChord } from '../../lib/ear';
import { playSong } from '../../lib/band';
import { PASS_RATE, markEarned } from '../../lib/certificate';

const LEVEL_IDS = ['beginner', 'intermediate', 'advanced'];

export default function Ear() {
  const router = useRouter();
  const [level, setLevel] = useState('beginner');
  const [song, setSong] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [sel, setSel] = useState(0);
  const [checked, setChecked] = useState(false);
  const [playing, setPlaying] = useState(null); // 'all' | 'bar' | セクション名
  const [pos, setPos] = useState(-1);
  const [mix, setMix] = useState({ melody: true, bass: true, chords: true, drums: true });
  const ctrl = useRef(null);

  const stop = useCallback(() => {
    if (ctrl.current) ctrl.current.stop();
    ctrl.current = null;
    setPlaying(null);
    setPos(-1);
  }, []);

  const newSong = useCallback(
    (lv) => {
      stop();
      const s = makeSong(lv);
      setSong(s);
      setAnswers(Array.from({ length: s.bars }, () => ({ a: 0 })));
      setSel(0);
      setChecked(false);
      if (typeof window !== 'undefined') window.scrollTo(0, 0);
    },
    [stop]
  );

  useEffect(() => {
    if (!router.isReady) return;
    const lv = LEVEL_IDS.includes(router.query.level) ? router.query.level : 'beginner';
    setLevel(lv);
    newSong(lv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  useEffect(() => () => stop(), [stop]);

  const play = async (kind, from, to, loop) => {
    if (playing === kind) {
      stop();
      return;
    }
    stop();
    setPlaying(kind);
    ctrl.current = await playSong(song, {
      from,
      to,
      loop,
      mix,
      countIn: !loop,
      onTick: (b) => setPos(b),
      onEnd: () => {
        ctrl.current = null;
        setPlaying(null);
      },
    });
  };

  if (!song) return <div className="app board" style={{ minHeight: '100dvh' }} />;

  const conf = LEVELS[level];
  const score = answers.filter((a, i) => sameChord(a, song.chords[i])).length;
  const setAns = (v) => setAnswers(answers.map((a, i) => (i === sel ? v : a)));
  const filled = answers.every((a) => a.l !== undefined && a.type !== undefined);

  return (
    <div className="app">
      <header className="board bhead">
        <div className="wood-top" />
        <div className="bhead-row">
          <Link href="/" className="back" aria-label="トップへ戻る">
            <BackIcon />
          </Link>
          <div className="bhead-titles">
            <div className="bhead-sub">上級編 耳コピ</div>
            <div className="bhead-title">コードを聞き取ろう</div>
          </div>
        </div>
        <div className="tabs" role="tablist">
          {LEVEL_IDS.map((id) => (
            <button key={id} role="tab" aria-selected={level === id} className={`tab ${level === id ? 'sel' : ''}`} onClick={() => { setLevel(id); newSong(id); }}>
              {LEVELS[id].label}
            </button>
          ))}
        </div>
      </header>

      <main className="paper q-area">
        <div className="ear-info">
          <div>
            <div className="pick-label">キー</div>
            <div className="ear-key">{song.keyName}</div>
          </div>
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <Staff keySig={{ t: song.key.t, c: song.key.c }} width={200} label={`${song.keyName}の調号`} />
          </div>
        </div>
        <p className="q-sub" style={{ margin: 0 }}>{conf.info}</p>

        <div className="ear-controls">
          <button className={`btn ${playing === 'all' ? 'btn-red' : 'btn-ink'}`} onClick={() => play('all', 0, song.bars - 1, false)}>
            {playing === 'all' ? '■ 止める' : <><PlayIcon /> 全体を再生</>}
          </button>
          <button className={`btn ${playing === 'bar' ? 'btn-red' : 'btn-line'}`} onClick={() => play('bar', sel, sel, true)}>
            {playing === 'bar' ? '■ 止める' : `${sel + 1}小節目をリピート`}
          </button>
        </div>
        {song.sections.some((s) => s.name) && (
          <div className="ear-sections">
            {song.sections.map((s) => (
              <button key={s.name} className={`opt ${playing === s.name ? 'sel' : ''}`} onClick={() => play(s.name, s.from, s.to, true)}>
                {playing === s.name ? '■ ' : '↻ '}
                {s.name}
              </button>
            ))}
          </div>
        )}
        <div className="pick-label">聴く楽器(タップでON/OFF)</div>
        <div className="mixer">
          {[['melody', 'メロディー'], ['bass', 'ベース'], ['chords', 'コード'], ['drums', 'ドラム']].map(([k, lab]) => (
            <button
              key={k}
              className={`opt ${mix[k] ? 'sel' : ''}`}
              aria-pressed={mix[k]}
              onClick={() => { stop(); setMix({ ...mix, [k]: !mix[k] }); }}
            >
              {lab}
            </button>
          ))}
        </div>
        <p className="q-sub" style={{ margin: 0, fontWeight: 500 }}>
          ①メロディーを鍵盤で弾いてキーを確かめる → ②ベースとメロディーでコードの当たりをつける → ③コード進行のパターンを読み解く
        </p>

        {song.sections.map((s) => (
          <div key={s.from}>
            {s.name && <div className="pick-label" style={{ marginBottom: 4 }}>{s.name}</div>}
            <div className="bars">
              {song.chords.slice(s.from, s.to + 1).map((c) => {
                const i = c.bar;
                const a = answers[i];
                const ok = checked && sameChord(a, c);
                return (
                  <button
                    key={i}
                    className={`bar ${sel === i ? 'sel' : ''} ${pos === i ? 'now' : ''} ${checked ? (ok ? 'ok' : 'ng') : ''}`}
                    onClick={() => setSel(i)}
                  >
                    <span className="bar-no">{i + 1}</span>
                    <span className="bar-ans">{builtName(a) === '?' ? '' : builtName(a)}</span>
                    {checked && (
                      <span className="bar-correct">
                        {ok ? '○' : c.name}
                        <small>{c.degree}</small>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {checked ? (
          <>
            <div className="advice good">
              {song.bars}小節中 {score}小節 正解!
            </div>
            {level === 'advanced' && score >= Math.ceil(song.bars * PASS_RATE) && (
              <div className="cert-unlock">
                <div className="cert-unlock-title">🏅 隠しページが開きました!</div>
                <p>上級で8割以上正解したあなたに、K's VOX公認「楽典マスター」の認定証を贈ります。</p>
                <Link href="/certificate" className="btn btn-red" onClick={markEarned}>認定証を受け取る</Link>
              </div>
            )}
            <div className="steps">
              {song.sections.map((s) => (
                <div className="step" key={s.from}>
                  <span><strong className="em">{s.name || 'コード進行'}</strong>({s.from + 1}〜{s.to + 1}小節):{s.prog}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="pick-label" style={{ marginTop: 4 }}>{sel + 1}小節目のコード</div>
            <NameBuilder value={answers[sel]} onChange={setAns} types={conf.types} locked={false} />
            <div className="grid2">
              <button className="btn btn-line" disabled={sel === 0} onClick={() => setSel(sel - 1)}>← 前の小節</button>
              <button className="btn btn-line" disabled={sel === song.bars - 1} onClick={() => setSel(sel + 1)}>次の小節 →</button>
            </div>
            <button className="btn btn-red" disabled={!filled} onClick={() => {
                stop();
                setChecked(true);
                const ok = answers.filter((a, i) => sameChord(a, song.chords[i])).length;
                if (level === 'advanced' && ok >= Math.ceil(song.bars * PASS_RATE)) markEarned();
              }}>
              答え合わせ
            </button>
            {!filled && <p className="q-sub" style={{ margin: 0, textAlign: 'center' }}>全部の小節にコードを入れると答え合わせできます</p>}
          </>
        )}

        <div className="next-actions">
          <button className="btn btn-ink" onClick={() => newSong(level)}>
            別のコードを聞き取る(同じレベル)
          </button>
          {checked && LEVEL_IDS.indexOf(level) < LEVEL_IDS.length - 1 && (
            <button
              className="btn btn-line"
              onClick={() => {
                const nx = LEVEL_IDS[LEVEL_IDS.indexOf(level) + 1];
                setLevel(nx);
                newSong(nx);
              }}
            >
              次のレベルに挑戦:{LEVELS[LEVEL_IDS[LEVEL_IDS.indexOf(level) + 1]].label}
            </button>
          )}
        </div>
      </main>
      <footer className="footer">© ボーカル道場K's VOX</footer>
    </div>
  );
}
