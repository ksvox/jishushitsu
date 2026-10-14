import { useState } from 'react';
import Staff from './Staff';
import { PlayIcon } from './Icons';
import { SOLFA, LETTERS, pitch, jp, accText } from '../lib/theory';
import {
  TYPES, TRIADS, SEVENTHS, chordName, tonesText, sameSpelling, explainChord, explainDiatonic, keyLabel, formulaText,
  degreeName,
} from '../lib/chords';
import { getCtx, piano, loadPiano } from '../lib/sound';

const typeLabel = (t) => (t === '' ? 'なし' : t);

async function playChord(tones) {
  const ms = tones.map(pitch);
  await loadPiano(ms);
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + 0.05;
  ms.forEach((m, i) => piano(c, m, t + i * 0.35, 0.6));
  ms.forEach((m) => piano(c, m, t + ms.length * 0.35 + 0.15, 1.6));
}

/* ===== 共通:答えの組み立て ===== */
export function RootPicker({ value, onChange, locked }) {
  return (
    <>
      <div className="pick-label">ルート</div>
      <div className="grid7">
        {SOLFA.map((s, l) => (
          <button key={l} className={`opt ${value.l === l ? 'sel' : ''}`} disabled={locked} onClick={() => onChange({ ...value, l })} style={{ minHeight: 50, fontSize: s.length > 1 ? 13 : 15 }}>
            {LETTERS[l]}
            <small>{s}</small>
          </button>
        ))}
      </div>
      <div className="seg seg3">
        {[[0, 'なし'], [1, '#'], [-1, '♭']].map(([a, lab]) => (
          <button key={a} className={value.a === a ? 'sel' : ''} disabled={locked} onClick={() => onChange({ ...value, a })}>{lab}</button>
        ))}
      </div>
    </>
  );
}

export function TypePicker({ value, onChange, types, locked, label = '種類' }) {
  return (
    <>
      <div className="pick-label">{label}</div>
      <div className="type-grid">
        {types.map((t) => (
          <button key={t} className={`opt ${value === t ? 'sel' : ''}`} disabled={locked} onClick={() => onChange(t)}>
            {typeLabel(t)}
            <small>{TYPES[t].name}</small>
          </button>
        ))}
      </div>
    </>
  );
}

export function NameBuilder({ value, onChange, types, locked }) {
  return (
    <>
      <RootPicker value={value} onChange={onChange} locked={locked} />
      <TypePicker value={value.type} onChange={(type) => onChange({ ...value, type })} types={types} locked={locked} />
    </>
  );
}
export const builtName = (v) => (v.l === undefined || v.type === undefined ? '?' : `${LETTERS[v.l]}${accText(v.a || 0)}${v.type}`);

function Submit({ disabled, onClick, your }) {
  return (
    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6 }}>
      {your !== undefined && (
        <div className="your">
          あなたの答え:<b>{your}</b>
        </div>
      )}
      <button className="btn btn-red" disabled={disabled} onClick={onClick}>採点する</button>
    </div>
  );
}

/* ===== コードの問題(STEP1・STEP4) ===== */
export function ChordQ({ q, locked, onSubmit, types }) {
  const [typ, setTyp] = useState(null);
  const [accs, setAccs] = useState(q.tones.map(() => 0));
  const [name, setName] = useState({ a: 0 });
  const [slots, setSlots] = useState([]);
  const [acc, setAcc] = useState(0);
  const cname = chordName(q.root, q.type);
  const staff = (notes) => (
    <div className="sheet">
      <Staff stack notes={notes} width={300} label="和音" />
      <button className="play-btn" onClick={() => playChord(notes)}>
        <PlayIcon /> 音を聴く
      </button>
    </div>
  );

  if (q.form === 'identify') {
    return (
      <>
        <h2 className="q-title">このトライアドの種類は?</h2>
        {staff(q.tones)}
        <div className="grid2">
          {TRIADS.map((t) => (
            <button key={t} className={`opt wide ${typ === t ? 'sel' : ''}`} disabled={locked} onClick={() => setTyp(t)}>
              {TYPES[t].name}
            </button>
          ))}
        </div>
        {!locked && (
          <Submit disabled={typ === null} onClick={() => onSubmit({ ok: typ === q.type, your: TYPES[typ].name, correct: `${TYPES[q.type].name}(${cname})` })} />
        )}
      </>
    );
  }

  if (q.form === 'build') {
    const notes = q.tones.map((n, i) => ({ ...n, a: accs[i] }));
    const cycle = (i) => setAccs(accs.map((a, j) => (j === i ? (a === 0 ? 1 : a === 1 ? -1 : 0) : a)));
    return (
      <>
        <p className="q-sub">#・♭を付けて完成させよう</p>
        <h2 className="q-title">
          {cname}({TYPES[q.type].name})の構成音を書き入れよう
        </h2>
        {staff(notes)}
        <div className="pick-label">音をタップすると #→♭→なし と変わります</div>
        <div className="grid4">
          {notes.map((n, i) => (
            <button key={i} className={`opt ${n.a ? 'sel' : ''}`} disabled={locked} onClick={() => cycle(i)} style={{ minHeight: 50 }}>
              {jp(n)}
            </button>
          ))}
        </div>
        {!locked && (
          <Submit
            your={tonesText(notes)}
            disabled={false}
            onClick={() => onSubmit({ ok: q.tones.every((n, i) => n.a === accs[i]), your: tonesText(notes), correct: tonesText(q.tones) })}
          />
        )}
      </>
    );
  }

  if (q.form === 'tones') {
    const need = q.tones.length;
    const add = (l) => {
      if (slots.length >= need || slots.some((s) => s.l === l)) return;
      setSlots([...slots, { l, a: acc }]);
      setAcc(0);
    };
    const your = slots.map((s) => SOLFA[s.l] + accText(s.a)).join('・') || '―';
    const ok = slots.length === need && q.tones.every((t) => slots.some((s) => sameSpelling(s, t)));
    return (
      <>
        <p className="q-sub">#・♭を選んでから音をタップ</p>
        <h2 className="q-title">{cname} の構成音は?</h2>
        <div className="sheet">
          <div className="written" style={{ fontSize: 18, minHeight: 34 }}>
            {slots.length ? slots.map((s, i) => <b key={i}>{SOLFA[s.l] + accText(s.a)}</b>) : <span>({need}つの音を選ぼう)</span>}
          </div>
        </div>
        <div className="seg seg3">
          {[[0, 'なし'], [1, '#'], [-1, '♭']].map(([a, lab]) => (
            <button key={a} className={acc === a ? 'sel' : ''} disabled={locked} onClick={() => setAcc(a)}>{lab}</button>
          ))}
        </div>
        <div className="grid7">
          {SOLFA.map((s, l) => (
            <button key={l} className="opt" disabled={locked} onClick={() => add(l)} style={{ minHeight: 50, fontSize: s.length > 1 ? 13 : 15 }}>
              {s}
              <small>{LETTERS[l]}</small>
            </button>
          ))}
        </div>
        {!locked && (
          <>
            <button className="btn btn-line" onClick={() => setSlots(slots.slice(0, -1))} disabled={!slots.length}>1つ消す</button>
            <Submit your={your} disabled={slots.length !== need} onClick={() => onSubmit({ ok, your, correct: tonesText(q.tones) })} />
          </>
        )}
      </>
    );
  }

  // name:五線を見てコードネーム
  return (
    <>
      <h2 className="q-title">このコードのコードネームは?</h2>
      {staff(q.tones)}
      <NameBuilder value={name} onChange={setName} types={types} locked={locked} />
      {!locked && (
        <Submit
          your={builtName(name)}
          disabled={name.l === undefined || name.type === undefined}
          onClick={() => onSubmit({ ok: name.l === q.root.l && name.a === q.root.a && name.type === q.type, your: builtName(name), correct: cname })}
        />
      )}
    </>
  );
}

/* ===== ダイアトニック(STEP2・STEP3) ===== */
export function DiatonicQ({ q, locked, onSubmit }) {
  const [typ, setTyp] = useState(null);
  const [name, setName] = useState({ a: 0 });
  const [num, setNum] = useState(null);
  const types = q.seventh ? SEVENTHS : TRIADS.filter((t) => t !== 'aug');
  const t = q.target;
  const kname = keyLabel(q.key, q.minor);

  if (q.form === 'forward') {
    const your = `${typ === null ? '?' : degreeName(t.i, q.minor, typ)} → ${builtName(name)}`;
    return (
      <>
        <h2 className="q-title">
          {kname}の<span className="em">{t.i + 1}番目</span>のダイアトニックコードは?
        </h2>
        <p className="q-sub" style={{ margin: 0 }}>① 公式 → ② コードネームの順に答えよう</p>
        <TypePicker label={`① 公式(${t.i + 1}番目の種類)`} value={typ} onChange={setTyp} types={types} locked={locked} />
        <div className="pick-label" style={{ marginTop: 6 }}>② コードネーム</div>
        <NameBuilder value={name} onChange={setName} types={types} locked={locked} />
        {!locked && (
          <Submit
            your={your}
            disabled={typ === null || name.l === undefined || name.type === undefined}
            onClick={() =>
              onSubmit({
                ok: typ === t.type && name.l === t.root.l && name.a === t.root.a && name.type === t.type,
                your,
                correct: `${t.degree} → ${t.name}`,
              })
            }
          />
        )}
      </>
    );
  }

  return (
    <>
      <h2 className="q-title">
        {kname}で <span className="em">{t.name}</span> は何番目?
      </h2>
      <div className="grid7">
        {q.list.map((c) => (
          <button key={c.i} className={`opt ${num === c.i ? 'sel' : ''}`} disabled={locked} onClick={() => setNum(c.i)} style={{ fontSize: 15 }}>
            {degreeName(c.i, q.minor, '')}
          </button>
        ))}
      </div>
      {!locked && (
        <Submit
          your={num === null ? '?' : q.list[num].degree}
          disabled={num === null}
          onClick={() => onSubmit({ ok: num === t.i, your: q.list[num].degree, correct: t.degree })}
        />
      )}
    </>
  );
}

/* ===== 解き方・ヒント・問題文 ===== */
export function midExplain(q) {
  return q.kind === 'diatonic' ? explainDiatonic(q) : explainChord(q.root, q.type);
}
export function midHint(q) {
  if (q.kind === 'diatonic')
    return `${q.minor ? 'マイナー' : 'メジャー'}の公式: ${formulaText(q.minor, q.seventh)}${q.minor ? '(メジャーの6番目から)' : ''}`;
  return 'ルートから、3度・5度(・7度)が何度か、度数で見てみよう';
}
export function midPrompt(q) {
  if (q.kind === 'diatonic')
    return q.form === 'forward' ? `${keyLabel(q.key, q.minor)}の${q.target.i + 1}番目` : `${keyLabel(q.key, q.minor)}で${q.target.name}`;
  const n = chordName(q.root, q.type);
  return { identify: `${n}の種類`, build: `${n}の書き入れ`, tones: `${n}の構成音`, name: `五線の${tonesText(q.tones)}` }[q.form];
}
