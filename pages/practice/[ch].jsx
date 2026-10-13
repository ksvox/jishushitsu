import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BackIcon } from '../../components/Icons';
import { Hanamaru, Batsu, TimerRing } from '../../components/Marks';
import { QuestionView, explain, promptText, ExplainVisual } from '../../components/Questions';
import { Rich } from '../../lib/rich';
import { genInterval, genKeyToSig, genSigToKey, genParallel, genScale, genMinorForm, shuffle } from '../../lib/theory';

const TEST_COUNT = 10;
const GOAL = 20;

const CH = {
  1: {
    badge: '第一章',
    name: '度数',
    tabs: [
      { id: 1, label: 'Lv1 #♭なし' },
      { id: 2, label: 'Lv2 #♭1つ' },
      { id: 3, label: 'Lv3 重増・重減' },
    ],
    gen: (tab) => genInterval(tab),
    testPlan: () => shuffle([1, 1, 1, 2, 2, 2, 2, 3, 3, 3]),
  },
  2: {
    badge: '第二章',
    name: '調号',
    tabs: [
      { id: 'scale', label: 'スケール作り' },
      { id: 'keyToSig', label: 'キー→調号' },
      { id: 'sigToKey', label: '調号→キー' },
      { id: 'parallel', label: '平行調' },
      { id: 'minorForm', label: 'マイナー3種' },
    ],
    gen: (tab) =>
      tab === 'scale'
        ? genScale()
        : tab === 'keyToSig'
          ? genKeyToSig()
          : tab === 'sigToKey'
            ? genSigToKey()
            : tab === 'minorForm'
              ? genMinorForm()
              : genParallel(),
    // 最後の3問は「ハーモニック/メロディックにする」問題
    testPlan: () => [
      ...shuffle(['keyToSig', 'keyToSig', 'keyToSig', 'sigToKey', 'sigToKey', 'parallel', 'parallel']),
      'minorForm', 'minorForm', 'minorForm',
    ],
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
  const steps = explain(q);
  return (
    <>
      <div className="steps-head">解き方</div>
      <div className="steps">
        {steps.map((s, i) => (
          <div className="step" key={i}>
            <span className="step-num">{i + 1}</span>
            <span><Rich text={s} /></span>
          </div>
        ))}
      </div>
      <ExplainVisual q={q} />
    </>
  );
}

export default function Practice() {
  const router = useRouter();
  const ch = Number(router.query.ch) === 2 ? 2 : 1;
  const isTest = router.query.mode === 'test';
  const conf = CH[ch];

  const [tab, setTab] = useState(conf.tabs[0].id);
  const [q, setQ] = useState(null);
  const [qid, setQid] = useState(0);
  const [phase, setPhase] = useState('ask'); // ask | done | finished
  const [result, setResult] = useState(null);
  const [hint, setHint] = useState(false);
  const [count, setCount] = useState(0);
  const [okCount, setOkCount] = useState(0);
  const [startAt, setStartAt] = useState(0);
  const [now, setNow] = useState(0);
  // テスト用
  const [plan, setPlan] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [testStart, setTestStart] = useState(0);
  const [testEnd, setTestEnd] = useState(0);

  const newQuestion = useCallback(
    (forTab) => {
      setQ(conf.gen(forTab));
      setQid((x) => x + 1);
      setPhase('ask');
      setResult(null);
      setHint(false);
      const t = Date.now();
      setStartAt(t);
      setNow(t);
      if (typeof window !== 'undefined') window.scrollTo(0, 0);
    },
    [conf]
  );

  const startTest = useCallback(() => {
    const p = conf.testPlan();
    setPlan(p);
    setAnswers([]);
    const t = Date.now();
    setTestStart(t);
    setTestEnd(0);
    newQuestion(p[0]);
  }, [conf, newQuestion]);

  // 最初の問題(乱数はブラウザ側でだけ作る)
  useEffect(() => {
    if (!router.isReady) return;
    const first = CH[ch].tabs[0].id;
    setTab(first);
    setCount(0);
    setOkCount(0);
    if (isTest) startTest();
    else newQuestion(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, ch, isTest]);

  // タイマー
  useEffect(() => {
    if (phase !== 'ask') return undefined;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [phase]);

  const elapsed = (now - startAt) / 1000;

  const onSubmit = ({ ok, your, correct }) => {
    const sec = (Date.now() - startAt) / 1000;
    if (isTest) {
      const next = [...answers, { prompt: promptText(q), your, correct, ok, sec }];
      setAnswers(next);
      if (next.length >= TEST_COUNT) {
        setTestEnd(Date.now());
        setPhase('finished');
        if (typeof window !== 'undefined') window.scrollTo(0, 0);
      } else {
        newQuestion(plan[next.length]);
      }
      return;
    }
    setResult({ ok, your, correct, sec });
    setPhase('done');
    setCount((c) => c + 1);
    if (ok) setOkCount((c) => c + 1);
  };

  const changeTab = (id) => {
    setTab(id);
    newQuestion(id);
  };

  /* ===== ヘッダー ===== */
  const header = (
    <header className="board bhead">
      <div className="wood-top" />
      <div className="bhead-row">
        <Link href="/" className="back" aria-label="トップへ戻る">
          <BackIcon />
        </Link>
        <div className="bhead-titles">
          <div className="bhead-sub">
            {conf.badge} {conf.name} ・ {isTest ? '実力テスト' : '練習'}
          </div>
          <div className="bhead-title">
            {isTest ? (
              phase === 'finished' ? '結果' : <>第{answers.length + 1}問 <small>/ {TEST_COUNT}問</small></>
            ) : (
              <>第{count + (phase === 'ask' ? 1 : 0)}問 <small>正解 {okCount}</small></>
            )}
          </div>
        </div>
        {isTest
          ? phase !== 'finished' && <div className="elapsed" aria-label="経過時間">{fmtClock((now - testStart) / 1000)}</div>
          : phase === 'ask' && <TimerRing seconds={GOAL - elapsed} total={GOAL} />}
      </div>
      {!isTest && (
        <div className="tabs" role="tablist">
          {conf.tabs.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? 'sel' : ''}`} onClick={() => changeTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );

  /* ===== テスト結果 ===== */
  if (isTest && phase === 'finished') {
    const score = answers.filter((a) => a.ok).length;
    const total = (testEnd - testStart) / 1000;
    const avg = total / TEST_COUNT;
    const wrong = answers.map((a, i) => ({ ...a, no: i + 1 })).filter((a) => !a.ok);
    const reached = score >= 8 && avg <= GOAL; // 8問以上正解 かつ 平均20秒以内
    return (
      <div className="app">
        {header}
        <main className="paper q-area">
          <div className="result-top">
            <div>
              <div style={{ fontSize: 14, color: '#55625A', fontWeight: 700 }}>点数</div>
              <div className="score">
                {score}
                <small> / {TEST_COUNT}</small>
              </div>
            </div>
            <div className={`stamp ${reached ? '' : 'yet'}`}>
              <small>8問以上・平均20秒</small>
              <b>{reached ? '達成' : 'もう少し'}</b>
            </div>
          </div>
          <div className="stats">
            <div className="stat">
              <small>かかったタイム</small>
              <div>{fmtTime(total)}</div>
            </div>
            <div className="stat">
              <small>1問あたり</small>
              <div style={{ color: reached ? '#C8381F' : undefined }}>{avg.toFixed(1)}秒</div>
            </div>
          </div>
          <div className="steps-head">間違えた問題</div>
          {wrong.length === 0 ? (
            <p style={{ margin: 0, fontWeight: 700 }}>全問正解!</p>
          ) : (
            wrong.map((a) => (
              <div className="wrong" key={a.no}>
                <div className="wrong-q">
                  <small>第{a.no}問</small>
                  {a.prompt}
                </div>
                <div className="wrong-a">
                  あなた:<s>{a.your}</s> → 正解:<b>{a.correct}</b>
                </div>
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
                  <span className="verdict-ans" style={{ fontSize: result.correct.length > 10 ? 20 : 32 }}>{result.correct}</span>
                  <span className="verdict-meta">
                    {!result.ok && <>あなた:{result.your} ・ </>}
                    {Math.round(result.sec)}秒
                  </span>
                </div>
              </div>
            )}

            <QuestionView key={qid} q={q} locked={phase !== 'ask'} onSubmit={onSubmit} />

            {!isTest && phase === 'ask' && (
              <button className="hint-link" onClick={() => setHint(!hint)}>
                {hint ? '解き方を閉じる' : '例題として解き方を見る'}
              </button>
            )}
            {!isTest && (hint || phase === 'done') && <Steps q={q} />}

            {!isTest && phase === 'done' && (
              <div className="actions-row" style={{ paddingTop: 6, paddingBottom: 10 }}>
                <Link href={`/learn/${ch}`} className="btn btn-line">覚え方</Link>
                <button className="btn btn-ink" onClick={() => newQuestion(tab)}>次の問題</button>
              </div>
            )}
          </>
        )}
      </main>
      <footer className="footer">© ボーカル道場K's VOX</footer>
    </div>
  );
}
