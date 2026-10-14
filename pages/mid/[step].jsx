import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BackIcon } from '../../components/Icons';
import { Hanamaru, Batsu } from '../../components/Marks';
import { ChordQ, DiatonicQ, midExplain, midHint, midPrompt } from '../../components/MidQuestions';
import { Rich } from '../../lib/rich';
import { pick } from '../../lib/theory';
import { TRIADS, SEVENTHS, ALL_TYPES, genChordQ, genDiatonicQ } from '../../lib/chords';

const TEST_COUNT = 10;

// 中級編 STEP1〜4 の設定
export const STEPS = {
  1: {
    name: 'トライアド',
    tabs: [
      { id: 'identify', label: '種類を答える' },
      { id: 'build', label: '構成音を書き入れる' },
      { id: 'tones', label: 'コード名→構成音' },
    ],
    gen: (tab) => genChordQ(TRIADS, tab),
    test: () => genChordQ(TRIADS, pick(['identify', 'build', 'tones'])),
    types: TRIADS,
  },
  2: {
    name: 'ダイアトニック',
    tabs: [
      { id: 'major', label: 'メジャーキー' },
      { id: 'minor', label: 'マイナーキー' },
    ],
    gen: (tab) => genDiatonicQ(tab === 'minor', false, pick(['forward', 'reverse'])),
    test: () => genDiatonicQ(Math.random() < 0.5, false, pick(['forward', 'reverse'])),
  },
  3: {
    name: 'ダイアトニックセブンス',
    tabs: [
      { id: 'major', label: 'メジャーキー' },
      { id: 'minor', label: 'マイナーキー' },
    ],
    gen: (tab) => genDiatonicQ(tab === 'minor', true, pick(['forward', 'reverse'])),
    test: () => genDiatonicQ(Math.random() < 0.5, true, pick(['forward', 'reverse'])),
  },
  4: {
    name: 'コード',
    tabs: [
      { id: 'sus4', label: 'sus4' },
      { id: '6', label: '6' },
      { id: 'add9', label: 'add9' },
    ],
    gen: (tab) => genChordQ([tab], pick(['name', 'build'])),
    test: () => genChordQ(ALL_TYPES, 'name'),
    types: ALL_TYPES,
  },
};

const fmtTime = (sec) => {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return m ? `${m}分${String(s % 60).padStart(2, '0')}秒` : `${s}秒`;
};
const fmtClock = (sec) => {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function Steps({ q }) {
  return (
    <div className="steps">
      {midExplain(q).map((s, i) => (
        <div className="step" key={i}>
          <span className="step-num">{i + 1}</span>
          <span><Rich text={s} /></span>
        </div>
      ))}
    </div>
  );
}

function View({ q, locked, onSubmit, conf, stepNo }) {
  if (q.kind === 'diatonic') return <DiatonicQ q={q} locked={locked} onSubmit={onSubmit} />;
  // STEP4の練習は、そのタブのコード+基本の3和音から選ぶ
  const types = stepNo === 4 && q.form === 'name' && conf.tabTypes ? conf.tabTypes : conf.types || TRIADS;
  return <ChordQ q={q} locked={locked} onSubmit={onSubmit} types={types} />;
}

export default function MidDrill() {
  const router = useRouter();
  const stepNo = [1, 2, 3, 4].includes(Number(router.query.step)) ? Number(router.query.step) : 1;
  const isTest = router.query.mode === 'test';
  const conf = STEPS[stepNo];

  const [tab, setTab] = useState(conf.tabs[0].id);
  const [q, setQ] = useState(null);
  const [qid, setQid] = useState(0);
  const [phase, setPhase] = useState('ask');
  const [result, setResult] = useState(null);
  const [hint, setHint] = useState(false);
  const [count, setCount] = useState(0);
  const [okCount, setOkCount] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [testStart, setTestStart] = useState(0);
  const [testEnd, setTestEnd] = useState(0);
  const [now, setNow] = useState(0);

  const next = useCallback(
    (forTab) => {
      setQ(isTest ? conf.test() : conf.gen(forTab));
      setQid((x) => x + 1);
      setPhase('ask');
      setResult(null);
      setHint(false);
      if (typeof window !== 'undefined') window.scrollTo(0, 0);
    },
    [conf, isTest]
  );

  const startTest = useCallback(() => {
    setAnswers([]);
    const t = Date.now();
    setTestStart(t);
    setNow(t);
    setTestEnd(0);
    next();
  }, [next]);

  useEffect(() => {
    if (!router.isReady) return;
    const first = STEPS[stepNo].tabs[0].id;
    setTab(first);
    setCount(0);
    setOkCount(0);
    if (isTest) startTest();
    else next(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, stepNo, isTest]);

  useEffect(() => {
    if (!isTest || phase !== 'ask') return undefined;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [isTest, phase]);

  const onSubmit = ({ ok, your, correct }) => {
    if (isTest) {
      const list = [...answers, { q, ok, your, correct }];
      setAnswers(list);
      if (list.length >= TEST_COUNT) {
        setTestEnd(Date.now());
        setPhase('finished');
        window.scrollTo(0, 0);
      } else next();
      return;
    }
    setResult({ ok, your, correct });
    setPhase('done');
    setCount((c) => c + 1);
    if (ok) setOkCount((c) => c + 1);
  };

  // STEP4の練習では、選んだタブのコードを答えの候補に入れる
  const viewConf = stepNo === 4 && !isTest ? { ...conf, tabTypes: ['', 'm', '7', 'sus4', '6', 'add9'] } : conf;

  const header = (
    <header className="board bhead">
      <div className="wood-top" />
      <div className="bhead-row">
        <Link href="/" className="back" aria-label="トップへ戻る">
          <BackIcon />
        </Link>
        <div className="bhead-titles">
          <div className="bhead-sub">中級編 STEP{stepNo} {conf.name} ・ {isTest ? '実力テスト' : '練習'}</div>
          <div className="bhead-title">
            {isTest ? (
              phase === 'finished' ? '結果' : <>第{answers.length + 1}問 <small>/ {TEST_COUNT}問</small></>
            ) : (
              <>第{count + (phase === 'ask' ? 1 : 0)}問 <small>正解 {okCount}</small></>
            )}
          </div>
        </div>
        {isTest && phase !== 'finished' && <div className="elapsed" aria-label="経過時間">{fmtClock((now - testStart) / 1000)}</div>}
      </div>
      {!isTest && (
        <div className="tabs" role="tablist">
          {conf.tabs.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? 'sel' : ''}`} onClick={() => { setTab(t.id); next(t.id); }}>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );

  if (isTest && phase === 'finished') {
    const score = answers.filter((a) => a.ok).length;
    const total = (testEnd - testStart) / 1000;
    const wrong = answers.map((a, i) => ({ ...a, no: i + 1 })).filter((a) => !a.ok);
    return (
      <div className="app">
        {header}
        <main className="paper q-area">
          <div>
            <div style={{ fontSize: 14, color: '#55625A', fontWeight: 700 }}>点数</div>
            <div className="score">
              {score}
              <small> / {TEST_COUNT}</small>
            </div>
          </div>
          <div className="stats">
            <div className="stat">
              <small>かかった時間</small>
              <div>{fmtTime(total)}</div>
            </div>
            <div className="stat">
              <small>1問あたり</small>
              <div>{(total / TEST_COUNT).toFixed(1)}秒</div>
            </div>
          </div>
          <div className="steps-head">間違えた問題と解き方</div>
          {wrong.length === 0 ? (
            <p style={{ margin: 0, fontWeight: 700 }}>全問正解!</p>
          ) : (
            wrong.map((a) => (
              <div className="wrong" key={a.no}>
                <div className="wrong-q">
                  <small>第{a.no}問</small>
                  {midPrompt(a.q)}
                </div>
                <div className="wrong-a">
                  あなた:<s>{a.your}</s> → 正解:<b>{a.correct}</b>
                </div>
                <Steps q={a.q} />
              </div>
            ))
          )}
          <div className="grid2" style={{ marginTop: 'auto', paddingTop: 12, paddingBottom: 10 }}>
            <Link href="/" className="btn btn-line">トップへ</Link>
            <button className="btn btn-ink" onClick={startTest}>もう一度テスト</button>
          </div>
        </main>
        <footer className="footer">© ボーカル道場K's VOX</footer>
      </div>
    );
  }

  return (
    <div className="app">
      {header}
      <main className="paper q-area">
        {!q ? (
          <p>問題を準備しています…</p>
        ) : (
          <>
            {phase === 'done' && result && (
              <div className="verdict" aria-live="polite">
                {result.ok ? <Hanamaru /> : <Batsu />}
                <div className="verdict-text">
                  <span className={result.ok ? 'verdict-ok' : 'verdict-ng'}>{result.ok ? '正解!' : '残念!正解は…'}</span>
                  <span className="verdict-ans" style={{ fontSize: result.correct.length > 10 ? 20 : 30 }}>{result.correct}</span>
                  {!result.ok && <span className="verdict-meta">あなた:{result.your}</span>}
                </div>
              </div>
            )}
            <View key={qid} q={q} locked={phase !== 'ask'} onSubmit={onSubmit} conf={viewConf} stepNo={stepNo} />
            {!isTest && phase === 'ask' && (
              <>
                <button className="hint-link" onClick={() => setHint(!hint)}>{hint ? 'ヒントを閉じる' : 'ヒントを見る'}</button>
                {hint && <div className="hint-box">{midHint(q)}</div>}
              </>
            )}
            {!isTest && phase === 'done' && (
              <>
                <div className="steps-head">解き方</div>
                <Steps q={q} />
                <button className="btn btn-ink" style={{ marginBottom: 10 }} onClick={() => next(tab)}>次の問題</button>
              </>
            )}
          </>
        )}
      </main>
      <footer className="footer">© ボーカル道場K's VOX</footer>
    </div>
  );
}
