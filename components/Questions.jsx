import { useState } from 'react';
import Staff from './Staff';
import Keyboard from './Keyboard';
import { PlayIcon } from './Icons';
import { playInterval, playSequence } from '../lib/sound';
import {
  QUALITIES, SOLFA, LETTERS, pitch, jp, full, majorName, minorName, sigLetters, sigText, majorScale,
  scaleRootPitch, scalePitches, explainInterval, explainKeyToSig, explainSigToKey, explainParallel, explainScale,
  en, MINOR_TYPES, minorScale, minorFormAnswer, minorFormCorrectText, explainMinorForm, markText,
} from '../lib/theory';

const symOf = (t) => (t === '#' ? '#' : '♭');

/* ===== 問題ごとの「問題文」「正解」「解き方」 ===== */
export function promptText(q) {
  if (q.kind === 'interval') return `${full(q.n1)} → ${full(q.n2)}`;
  if (q.kind === 'keyToSig') return `${q.minor ? minorName(q.k) : majorName(q.k)}の調号`;
  if (q.kind === 'sigToKey') return `調号「${sigText(q.k)}」のキー`;
  if (q.kind === 'parallel') return `${q.prompt}の平行調`;
  if (q.kind === 'minorForm') return `${en(minorFormAnswer(q).root)}${MINOR_TYPES[q.type].name}`;
  return `${majorName(q.k)}のスケール`;
}

export function explain(q) {
  if (q.kind === 'interval') return explainInterval(q.n1, q.n2);
  if (q.kind === 'keyToSig') return explainKeyToSig(q.k, q.minor);
  if (q.kind === 'sigToKey') return explainSigToKey(q.k);
  if (q.kind === 'parallel') return explainParallel(q.k, q.fromMinor);
  if (q.kind === 'minorForm') return explainMinorForm(q);
  return explainScale(q.k);
}

// 解き方の下に添える図
export function ExplainVisual({ q }) {
  if (q.kind === 'minorForm') {
    const { root, up } = minorFormAnswer(q);
    const ups = up.map(pitch);
    const downs = q.type === 'melodic' ? minorScale(root, 'natural').map(pitch).reverse() : [];
    const rp = ups[0];
    const start = rp - (((rp % 12) + 12) % 12);
    const labels = {};
    up.forEach((n, i) => { labels[ups[i]] = jp(n); });
    return (
      <div className="sheet">
        <Keyboard start={start} octaves={2} extraC={false} lit={ups} labels={labels} height={120} />
        <button className="play-btn" onClick={() => playSequence(q.type === 'melodic' ? [...ups, ...downs.slice(1)] : ups)}>
          <PlayIcon /> 正解のスケールを聴く{q.type === 'melodic' ? '(上行→下行)' : ''}
        </button>
      </div>
    );
  }
  if (q.kind === 'scale' || q.kind === 'keyToSig' || q.kind === 'sigToKey' || q.kind === 'parallel') {
    const k = q.k;
    const sc = majorScale(k);
    const rp = scaleRootPitch(k);
    const start = rp - (((rp % 12) + 12) % 12);
    const pitches = scalePitches(k);
    const labels = {};
    pitches.forEach((p, i) => { labels[p] = jp(sc[i]); });
    return (
      <div className="sheet">
        {q.kind === 'keyToSig' && <Staff keySig={{ t: k.t, c: k.c }} label={`正解の調号 ${sigText(k)}`} />}
        <Keyboard start={start} octaves={2} extraC={false} lit={pitches} labels={labels} height={120} />
        <button className="play-btn" onClick={() => playSequence(pitches)}>
          <PlayIcon /> {majorName(k)}を聴く
        </button>
      </div>
    );
  }
  return null;
}

function SubmitBar({ disabled, onClick, your }) {
  return (
    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6 }}>
      {your !== undefined && (
        <div className="your">
          あなたの答え:<b>{your}</b>
        </div>
      )}
      <button className="btn btn-red" disabled={disabled} onClick={onClick}>
        採点する
      </button>
    </div>
  );
}

/* ===== 第一章:度数 ===== */
export function IntervalQ({ q, locked, onSubmit }) {
  const [qual, setQual] = useState(null);
  const [num, setNum] = useState(null);
  const your = `${qual ?? '?'}${num ?? '?'}度`;
  return (
    <>
      <h2 className="q-title">この2音の度数は?</h2>
      <div className="sheet">
        <Staff notes={[q.n1, q.n2]} label={`${full(q.n1)}と${full(q.n2)}`} />
        <button className="play-btn" onClick={() => playInterval(pitch(q.n1), pitch(q.n2))}>
          <PlayIcon /> 音を聴く
        </button>
      </div>
      <div className="pick-label">種類</div>
      <div className="grid7">
        {QUALITIES.map((x) => (
          <button key={x} className={`opt ${qual === x ? 'sel' : ''}`} disabled={locked} onClick={() => setQual(x)} style={{ fontSize: x.length > 1 ? 13 : 15 }}>
            {x}
          </button>
        ))}
      </div>
      <div className="pick-label">何度?</div>
      <div className="grid8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((x) => (
          <button key={x} className={`opt ${num === x ? 'sel' : ''}`} disabled={locked} onClick={() => setNum(x)} style={{ fontSize: 17 }}>
            {x}
          </button>
        ))}
      </div>
      {!locked && (
        <SubmitBar
          your={your}
          disabled={!qual || !num}
          onClick={() => onSubmit({ ok: your === q.iv.label, your, correct: q.iv.label })}
        />
      )}
    </>
  );
}

/* ===== 調号の書き入れ(共通) ===== */
function SigInput({ kind, setKind, seq, setSeq, none, setNone, locked }) {
  const tapNote = (l) => {
    if (locked) return;
    setNone(false);
    if (seq.includes(l) || seq.length >= 7) return;
    setSeq([...seq, l]);
  };
  const changeKind = (t) => {
    if (locked || t === kind) return;
    setKind(t);
    setSeq([]);
  };
  return (
    <>
      <div className="seg">
        <button className={kind === '#' ? 'sel' : ''} onClick={() => changeKind('#')} disabled={locked}>♯ シャープ</button>
        <button className={kind === 'b' ? 'sel' : ''} onClick={() => changeKind('b')} disabled={locked}>♭ フラット</button>
      </div>
      <div className="pick-label">音をタップして調号を書き入れる</div>
      <div className="grid7">
        {SOLFA.map((s, l) => (
          <button key={l} className="opt" disabled={locked} onClick={() => tapNote(l)} style={{ minHeight: 54, fontSize: s.length > 1 ? 13 : 15 }}>
            {s}
            <small>{LETTERS[l]}</small>
          </button>
        ))}
      </div>
      {!locked && (
        <div className="grid2">
          <button className="btn btn-line" onClick={() => setSeq(seq.slice(0, -1))} disabled={!seq.length}>1つ消す</button>
          <button className={`btn ${none ? 'btn-ink' : 'btn-line'}`} onClick={() => { setNone(!none); setSeq([]); }}>調号なし</button>
        </div>
      )}
    </>
  );
}

const sigYourText = (kind, seq, none) =>
  none ? 'なし' : seq.length ? seq.map((l) => SOLFA[l] + symOf(kind)).join('・') : '(まだ書いていません)';

const sigIsRight = (k, kind, seq, none) =>
  k.c === 0 ? none : !none && kind === k.t && seq.length === k.c && seq.every((l, i) => l === sigLetters(k)[i]);

/* ===== 第二章:キー → 調号(順番どおりに書き入れる) ===== */
export function KeyToSigQ({ q, locked, onSubmit }) {
  const [kind, setKind] = useState('#');
  const [seq, setSeq] = useState([]);
  const [none, setNone] = useState(false);
  const name = q.minor ? minorName(q.k) : majorName(q.k);
  const yourText = sigYourText(kind, seq, none);

  return (
    <>
      <p className="q-sub">調号を順番どおりに書き入れよう</p>
      <h2 className="q-title">{name} の調号は?</h2>
      <div className="sheet">
        <Staff keySig={{ t: kind, letters: none ? [] : seq }} cursor={!locked && !none} label={`書いた調号 ${yourText}`} />
        <div className="written">
          書いた順:
          {none ? <b>調号なし</b> : seq.length ? seq.map((l, i) => <b key={i}>{SOLFA[l] + symOf(kind)}</b>) : <span>―</span>}
        </div>
      </div>
      <SigInput kind={kind} setKind={setKind} seq={seq} setSeq={setSeq} none={none} setNone={setNone} locked={locked} />
      {!locked && (
        <SubmitBar
          disabled={!none && !seq.length}
          onClick={() => onSubmit({ ok: sigIsRight(q.k, kind, seq, none), your: yourText, correct: sigText(q.k) })}
        />
      )}
    </>
  );
}

/* ===== 第二章:マイナー3種(調号と臨時記号を書き入れる) ===== */
const NEXT_MARK = { '': '#', '#': 'n', n: 'b', b: '' };

export function MinorFormQ({ q, locked, onSubmit }) {
  const [kind, setKind] = useState('#');
  const [seq, setSeq] = useState([]);
  const [none, setNone] = useState(false);
  const [upM, setUpM] = useState(['', '', '', '', '', '', '', '']);
  const [downM, setDownM] = useState(['', '', '', '', '', '', '', '']);
  const ans = minorFormAnswer(q);
  const melodic = q.type === 'melodic';
  const upNotes = ans.up.map((n) => ({ l: n.l, o: n.o, a: 0 }));
  const downNotes = minorScale(ans.root, 'natural').reverse().map((n) => ({ l: n.l, o: n.o, a: 0 }));
  const userSig = { t: kind, letters: none ? [] : seq };

  // 書いた調号と臨時記号から、実際に鳴る音を出す
  const actual = (n, m) => {
    if (m === '#') return { ...n, a: 1 };
    if (m === 'b') return { ...n, a: -1 };
    if (m === 'n') return { ...n, a: 0 };
    const inSig = !none && seq.includes(n.l);
    return { ...n, a: inSig ? (kind === '#' ? 1 : -1) : 0 };
  };
  const cycle = (arr, set, i) => {
    if (locked) return;
    set(arr.map((m, j) => (j === i ? NEXT_MARK[m] : m)));
  };
  const list = (notes, marks) => notes.map((n, i) => (marks[i] ? SOLFA[n.l] + markText(marks[i]) : null)).filter(Boolean);
  const ups = list(upNotes, upM);
  const downs = list(downNotes, downM);
  const your = `調号:${sigYourText(kind, seq, none)} / 臨時記号:${melodic ? '上行 ' : ''}${ups.join('・') || 'なし'}${melodic ? `、下行 ${downs.join('・') || 'なし'}` : ''}`;

  const submit = () => {
    const okSig = sigIsRight(q.k, kind, seq, none);
    const okUp = ans.upMarks.every((m, i) => m === upM[i]);
    const okDown = !melodic || ans.downMarks.every((m, i) => m === downM[i]);
    onSubmit({ ok: okSig && okUp && okDown, your, correct: minorFormCorrectText(q) });
  };
  const playMine = () => {
    const u = upNotes.map((n, i) => pitch(actual(n, upM[i])));
    const d = melodic ? downNotes.map((n, i) => pitch(actual(n, downM[i]))) : [];
    playSequence(melodic ? [...u, ...d.slice(1)] : u);
  };

  return (
    <>
      <p className="q-sub">調号と臨時記号を書き入れよう</p>
      <h2 className="q-title">
        {en(ans.root)}マイナーを<br />「{MINOR_TYPES[q.type].name}」にしよう
      </h2>
      <div className="sheet">
        {melodic && <div className="pick-label" style={{ alignSelf: 'flex-start', paddingLeft: 6 }}>上行</div>}
        <Staff keySig={userSig} notes={upNotes.map((n, i) => ({ ...n, mark: upM[i] }))} width={360} label="上行のスケール" />
        {melodic && (
          <>
            <div className="pick-label" style={{ alignSelf: 'flex-start', paddingLeft: 6 }}>下行</div>
            <Staff keySig={userSig} notes={downNotes.map((n, i) => ({ ...n, mark: downM[i] }))} width={360} label="下行のスケール" />
          </>
        )}
        <button className="play-btn" onClick={playMine}>
          <PlayIcon /> 書いたスケールを聴く
        </button>
      </div>

      <div className="pick-label">① 調号</div>
      <SigInput kind={kind} setKind={setKind} seq={seq} setSeq={setSeq} none={none} setNone={setNone} locked={locked} />

      <div className="pick-label">② 臨時記号(音をタップ:# → ♮ → ♭ → なし)</div>
      {melodic && <div className="q-sub" style={{ margin: 0 }}>上行</div>}
      <div className="grid8">
        {upNotes.map((n, i) => (
          <button key={i} className={`opt ${upM[i] ? 'sel' : ''}`} disabled={locked} onClick={() => cycle(upM, setUpM, i)} style={{ minHeight: 50, fontSize: 13, padding: 0 }}>
            {SOLFA[n.l] + markText(upM[i])}
          </button>
        ))}
      </div>
      {melodic && (
        <>
          <div className="q-sub" style={{ margin: 0 }}>下行</div>
          <div className="grid8">
            {downNotes.map((n, i) => (
              <button key={i} className={`opt ${downM[i] ? 'sel' : ''}`} disabled={locked} onClick={() => cycle(downM, setDownM, i)} style={{ minHeight: 50, fontSize: 13, padding: 0 }}>
                {SOLFA[n.l] + markText(downM[i])}
              </button>
            ))}
          </div>
        </>
      )}
      {!locked && <SubmitBar disabled={!none && !seq.length} onClick={submit} />}
    </>
  );
}

/* ===== 第二章:4択(調号→キー/平行調) ===== */
export function ChoiceQ({ q, locked, onSubmit }) {
  const [sel, setSel] = useState(null);
  return (
    <>
      {q.kind === 'sigToKey' ? (
        <>
          <h2 className="q-title">この調号のキーは?</h2>
          <div className="sheet">
            <Staff keySig={{ t: q.k.t, c: q.k.c }} label={q.k.c ? '調号' : '調号なし'} />
            {q.k.c === 0 && <div className="written">(調号なし)</div>}
          </div>
          <p className="q-sub" style={{ margin: 0 }}>メジャーと平行調のマイナーの組み合わせを選ぼう</p>
        </>
      ) : (
        <h2 className="q-title" style={{ marginBottom: 6 }}>{q.prompt} の平行調は?</h2>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.options.map((o, i) => (
          <button key={i} className={`opt wide ${sel === i ? 'sel' : ''}`} disabled={locked} onClick={() => setSel(i)}>
            {o.label}
          </button>
        ))}
      </div>
      {!locked && (
        <SubmitBar
          disabled={sel === null}
          onClick={() => onSubmit({ ok: q.options[sel].ok, your: q.options[sel].label, correct: q.answer })}
        />
      )}
    </>
  );
}

/* ===== 第二章:スケール作り ===== */
export function ScaleQ({ q, locked, onSubmit }) {
  const [accs, setAccs] = useState([0, 0, 0, 0, 0, 0, 0, 0]);
  const target = majorScale(q.k);
  const notes = target.map((n, i) => ({ ...n, a: accs[i] }));
  const cycle = (i) => {
    if (locked) return;
    const next = accs[i] === 0 ? 1 : accs[i] === 1 ? -1 : 0;
    setAccs(accs.map((a, j) => (j === i ? next : a)));
  };
  const your = notes.map(jp).join(' ');
  return (
    <>
      <p className="q-sub">ルートから「全全半全全全半」</p>
      <h2 className="q-title">{majorName(q.k)}({jp(q.k)})のメジャースケールを作ろう</h2>
      <div className="sheet">
        <Staff notes={notes} width={360} label={`作ったスケール ${your}`} />
        <button className="play-btn" onClick={() => playSequence(notes.map(pitch))}>
          <PlayIcon /> 作ったスケールを聴く
        </button>
      </div>
      <div className="pick-label">音をタップすると #→♭→なし と変わります</div>
      <div className="grid8">
        {notes.map((n, i) => (
          <button key={i} className={`opt ${n.a !== 0 ? 'sel' : ''}`} disabled={locked} onClick={() => cycle(i)} style={{ minHeight: 54, fontSize: 13, padding: 0 }}>
            {jp(n)}
          </button>
        ))}
      </div>
      {!locked && (
        <SubmitBar
          disabled={false}
          onClick={() =>
            onSubmit({ ok: target.every((n, i) => n.a === accs[i]), your, correct: target.map(jp).join(' ') })
          }
        />
      )}
    </>
  );
}

export function QuestionView(props) {
  const { q } = props;
  if (q.kind === 'interval') return <IntervalQ {...props} />;
  if (q.kind === 'keyToSig') return <KeyToSigQ {...props} />;
  if (q.kind === 'scale') return <ScaleQ {...props} />;
  if (q.kind === 'minorForm') return <MinorFormQ {...props} />;
  return <ChoiceQ {...props} />;
}
