import { useState } from 'react';
import Keyboard from './Keyboard';
import Staff from './Staff';
import { PlayIcon } from './Icons';
import { playInterval, playSequence } from '../lib/sound';
import {
  C_MAJOR_INTERVALS, MAJORS, en, jp, majorScale, scaleRootPitch, scalePitches, sigText, minorName, majorName,
  minorScale, pitch, MINOR_TYPES,
} from '../lib/theory';

const C_LABELS = { 60: 'ド', 62: 'レ', 64: 'ミ', 65: 'ファ', 67: 'ソ', 69: 'ラ', 71: 'シ', 72: 'ド' };
const C_SCALE = [60, 62, 64, 65, 67, 69, 71, 72];

function Play({ onClick, children = '音で確かめる' }) {
  return (
    <button className="play-btn" onClick={onClick}>
      <PlayIcon /> {children}
    </button>
  );
}

/* ===== 第一章 度数 ===== */

function HalfSteps() {
  return (
    <>
      <p>白鍵だけで <span className="em">ド(C)〜ド(C)</span> を見てみよう。</p>
      <div className="center">
        <Keyboard chalk lit={[64, 65, 71, 72]} labels={C_LABELS} marks={['全', '全', '半', '全', '全', '全', '半']} />
        <Play onClick={() => playSequence(C_SCALE)} />
      </div>
      <p>
        間に黒鍵がないのは
        <br />
        <span className="em-r" style={{ fontSize: 24 }}>「ミとファ」「シとド」</span>だけ。
      </p>
      <p>ここが<span className="em-r">半音</span>。あとは全部<span className="em">全音</span>!</p>
    </>
  );
}

function CIntervals() {
  return (
    <>
      <p>ドから白鍵を数えた度数を覚えよう。タップすると音が鳴ります。</p>
      <table className="ctable">
        <tbody>
          {C_MAJOR_INTERVALS.map((r, i) => (
            <tr key={i} className={r.name.startsWith('完全') ? 'perfect' : ''}>
              <td>
                <button onClick={() => playInterval(60, 60 + r.semis)}>ド→{r.to}</button>
              </td>
              <td>{r.name}</td>
              <td>{r.cond}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <span className="em">1・4・5・8は完全</span>、それ以外は<span className="em">長</span>。だから簡単!
      </p>
      <p style={{ fontSize: 16, color: '#C9D6CC' }}>右の「半音なし・半音1つ」が、最初に覚えた条件です。</p>
    </>
  );
}

function Inversion() {
  const ex = [
    { a: 'ド→ソ', aq: '完全5度', b: 'ソ→ド', bq: '完全4度', p: [60, 67, 67, 72] },
    { a: 'ド→ミ', aq: '長3度', b: 'ミ→ド', bq: '短6度', p: [60, 64, 64, 72] },
    { a: 'ミ→ソ', aq: '短3度', b: 'ソ→ミ', bq: '長6度', p: [64, 67, 67, 76] },
  ];
  return (
    <>
      <p>2つの音を<span className="em">入れ替える</span>と…</p>
      {ex.map((e, i) => (
        <div className="swap" key={i}>
          <div>
            {e.a} <span className="em">{e.aq}</span> ⇄ {e.b} <span className="em-r">{e.bq}</span>
          </div>
          <div>
            <button className="play-btn" onClick={() => { playInterval(e.p[0], e.p[1]); setTimeout(() => playInterval(e.p[2], e.p[3]), 3200); }}>
              <PlayIcon /> 聴きくらべ
            </button>
          </div>
        </div>
      ))}
      <p>
        <span className="em">完全度数は入れ替えても完全</span>。
        <br />
        長度数は<span className="em-r">短</span>に、短度数は<span className="em-r">長</span>になる。
      </p>
    </>
  );
}

function Ladder({ items, base }) {
  return (
    <div className="ladder">
      {items.map((q, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {i > 0 && <span className="arr">{i <= items.indexOf(base) ? '←' : '→'}</span>}
          <span className={q === base ? 'base' : ''}>{q}</span>
        </span>
      ))}
    </div>
  );
}


/* 広くなる・狭くなる の図解(赤=広くなる、青=狭くなる) */
const RED = '#F59A8B';
const BLUE = '#8EC9F2';
const NODES = {
  長: { x: 140, y: 80, rx: 22, ry: 22 },
  短: { x: 240, y: 80, rx: 22, ry: 22 },
  増: { x: 80, y: 162, rx: 22, ry: 22 },
  減: { x: 300, y: 162, rx: 22, ry: 22 },
  完全: { x: 190, y: 244, rx: 42, ry: 22 },
  重増: { x: 22, y: 162, rx: 12, ry: 28 },
  重減: { x: 358, y: 162, rx: 12, ry: 28 },
};
// [広い方, 狭い方]
const LINKS = [['重増', '増'], ['増', '長'], ['長', '短'], ['短', '減'], ['減', '重減'], ['増', '完全'], ['完全', '減']];

function edgeDist(n, ux, uy) {
  return 1 / Math.sqrt((ux / n.rx) ** 2 + (uy / n.ry) ** 2);
}

function Arrow({ from, to, off, color }) {
  const a = NODES[from];
  const b = NODES[to];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy * off;
  const ny = ux * off;
  const s = edgeDist(a, ux, uy) + 4;
  const e = edgeDist(b, ux, uy) + 4;
  const x1 = a.x + ux * s + nx;
  const y1 = a.y + uy * s + ny;
  const x2 = b.x - ux * e + nx;
  const y2 = b.y - uy * e + ny;
  const h = 9;
  const head = `${x2},${y2} ${x2 - ux * h - uy * h * 0.55},${y2 - uy * h + ux * h * 0.55} ${x2 - ux * h + uy * h * 0.55},${y2 - uy * h - ux * h * 0.55}`;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - ux * 4} y2={y2 - uy * 4} stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <polygon points={head} fill={color} />
    </g>
  );
}

function QualityMap() {
  const big = { fontFamily: "'Klee One', sans-serif", fontWeight: 600, fill: '#F4F1E6', textAnchor: 'middle', dominantBaseline: 'central' };
  return (
    <svg viewBox="0 0 380 304" width="100%" style={{ maxWidth: 380 }} role="img" aria-label="度数が広くなる・狭くなる関係の図">
      <rect x="95" y="6" width="190" height="30" rx="6" fill="none" stroke="rgba(244,241,230,0.7)" strokeWidth="1.5" />
      <text x="190" y="21" {...big} fontSize="16" fontWeight="400">2度・3度・6度・7度</text>
      <rect x="95" y="270" width="190" height="30" rx="6" fill="none" stroke="rgba(244,241,230,0.7)" strokeWidth="1.5" />
      <text x="190" y="285" {...big} fontSize="16" fontWeight="400">1度・4度・5度・8度</text>

      {LINKS.map(([wide, narrow]) => (
        <g key={wide + narrow}>
          <Arrow from={wide} to={narrow} off={5} color={BLUE} />
          <Arrow from={narrow} to={wide} off={5} color={RED} />
        </g>
      ))}

      <text x="140" y="80" {...big} fontSize="42">長</text>
      <text x="240" y="80" {...big} fontSize="42">短</text>
      <text x="80" y="162" {...big} fontSize="42">増</text>
      <text x="300" y="162" {...big} fontSize="42">減</text>
      <text x="190" y="244" {...big} fontSize="42">完全</text>
      <text x="22" y="148" {...big} fontSize="22">重</text>
      <text x="22" y="176" {...big} fontSize="22">増</text>
      <text x="358" y="148" {...big} fontSize="22">重</text>
      <text x="358" y="176" {...big} fontSize="22">減</text>

      <ellipse cx="190" cy="162" rx="72" ry="30" fill="none" stroke="rgba(244,241,230,0.45)" strokeWidth="1.5" strokeDasharray="4 4" />
      <line x1="158" y1="151" x2="134" y2="151" stroke={RED} strokeWidth="3" strokeLinecap="round" />
      <polygon points="128,151 136,146 136,156" fill={RED} />
      <text x="146" y="171" {...big} fontSize="13" fill={RED}>広くなる</text>
      <line x1="222" y1="151" x2="246" y2="151" stroke={BLUE} strokeWidth="3" strokeLinecap="round" />
      <polygon points="252,151 244,146 244,156" fill={BLUE} />
      <text x="234" y="171" {...big} fontSize="13" fill={BLUE}>狭くなる</text>
    </svg>
  );
}

function WidenNarrow() {
  return (
    <>
      <div className="ladder-cap"><span>← 狭くなる</span><span>広くなる →</span></div>
      <p style={{ fontSize: 16 }}>長度数</p>
      <Ladder items={['重減', '減', '短', '長', '増', '重増']} base="長" />
      <p style={{ fontSize: 16 }}>完全度数</p>
      <Ladder items={['重減', '減', '完全', '増', '重増']} base="完全" />
      <p>
        <span className="em">長度数</span>は広くなると増、狭くなると短。
        <br />
        <span className="em">短度数</span>は広くなると長、狭くなると減。
        <br />
        <span className="em">完全度数</span>は広くなると増、狭くなると減。
      </p>
      <p style={{ fontSize: 16, color: '#C9D6CC' }}>増はさらに広くなると重増、減はさらに狭くなると重減。</p>
      <div className="center" style={{ marginTop: 6 }}>
        <QualityMap />
      </div>
    </>
  );
}

function FiveSteps() {
  const steps = [
    'ルートから数えて何度か?',
    'その度数は、最初に何度数で覚えた?',
    '最初に覚えたその度数の条件は?(半音なし/半音1つ)',
    '#(♭)を外した2音は、条件と同じか違うか?',
    '最後に#や♭で広がったか、狭くなったか?',
  ];
  return (
    <>
      <p>どんな2音も、この順番で考えれば答えが出る。</p>
      <div className="center">
        <Staff chalk notes={[{ l: 2, a: 0, o: 4 }, { l: 4, a: 1, o: 4 }]} label="ミとソ#" />
        <Play onClick={() => playInterval(64, 68)}>例:ミ→ソ#</Play>
      </div>
      <ol style={{ margin: 0, paddingLeft: '1.4em', fontSize: 17 }}>
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      <p>
        ミ→ソは<span className="em-r">ミファの半音</span>を含むので短3度。上の音に#で広がって
        <span className="em">長3度</span>!
      </p>
      <p>
        <span className="em">#(♭)を外して考えれば</span>、どんな度数も答えられる。あとは数をこなすだけ!
      </p>
    </>
  );
}

/* ===== 第二章 調号 ===== */

function MajorScale() {
  return (
    <>
      <p style={{ fontSize: 30, fontWeight: 600, letterSpacing: '0.1em', textAlign: 'center' }}>
        全 全 <span className="em-r">半</span> 全 全 全 <span className="em-r">半</span>
      </p>
      <div className="center">
        <Keyboard chalk labels={C_LABELS} marks={['全', '全', '半', '全', '全', '全', '半']} />
        <Play onClick={() => playSequence(C_SCALE)} />
      </div>
      <p>このCから始まる白鍵だけのスケールを<span className="em">メジャースケール</span>という。</p>
      <p style={{ fontSize: 16, color: '#C9D6CC' }}>忘れても「ミとファ」「シとド」が半音。鍵盤を思い出せばOK。</p>
    </>
  );
}

function MinorParallel() {
  const lit = [69, 71, 72, 74, 76, 77, 79, 81];
  const labels = { 69: 'ラ', 71: 'シ', 72: 'ド', 74: 'レ', 76: 'ミ', 77: 'ファ', 79: 'ソ', 81: 'ラ' };
  return (
    <>
      <p>同じ白鍵を<span className="em">ラ(A)</span>から並べると…</p>
      <p style={{ fontSize: 26, fontWeight: 600, letterSpacing: '0.08em', textAlign: 'center' }}>
        全 <span className="em-r">半</span> 全 全 <span className="em-r">半</span> 全 全
      </p>
      <div className="center">
        <Keyboard chalk start={60} octaves={2} extraC={false} lit={lit} labels={labels} height={130} />
        <Play onClick={() => playSequence(lit)} />
      </div>
      <p>これが<span className="em">ナチュラルマイナースケール</span>。</p>
      <p>
        Cメジャーの<span className="em-r">短3度下</span>(A)からがマイナー。これを<span className="em">平行調</span>という。
      </p>
      <p>CメジャーとAマイナーは白鍵だけ → <span className="em">調号なし</span>!</p>
    </>
  );
}


const A_MINOR = { l: 5, a: 0 };
const MINOR_TEXT = {
  natural: (
    <>
      <p>平行調で見た、白鍵だけのマイナー。</p>
      <p>
        でも最後(7音目→8音目)が<span className="em-r">全音</span>で終わるので、おさまりが悪い。
      </p>
    </>
  ),
  harmonic: (
    <>
      <p>
        <span className="em">7音目を半音上げる</span>(導音を強める)→ ソが<span className="em-r">ソ#</span>に。
      </p>
      <p>最後が半音で終わり、ぐっとおさまる。調号はそのまま、<span className="em">臨時記号</span>で上げる。</p>
      <p style={{ fontSize: 16, color: '#C9D6CC' }}>ただし6音目→7音目(ファ→ソ#)が増2度になり、少し歌いにくい。</p>
    </>
  ),
  melodic: (
    <>
      <p>
        さらに<span className="em">6音目も半音上げる</span> → ファ#・ソ#。増2度がなくなり、よりメロディアスに。
      </p>
      <p>
        <span className="em">5音目から上はメジャースケールと同じ並び</span>。
      </p>
      <p>
        <span className="em-r">下行はナチュラルマイナーに戻る</span>(上がりと下がりでスケールが違う)。
      </p>
    </>
  ),
};

function MinorTypes() {
  const [type, setType] = useState('natural');
  const up = minorScale(A_MINOR, type);
  const ups = up.map(pitch);
  const nat = minorScale(A_MINOR, 'natural');
  const downs = nat.map(pitch).reverse();
  const labels = {};
  up.forEach((n, i) => { labels[ups[i]] = jp(n); });
  const melodic = type === 'melodic';
  return (
    <>
      <p>マイナースケールは3種類。Aマイナーで比べてみよう。</p>
      <div className="root-pick" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {['natural', 'harmonic', 'melodic'].map((t) => (
          <button key={t} className={type === t ? 'sel' : ''} onClick={() => setType(t)} style={{ fontSize: 13 }}>
            {MINOR_TYPES[t].name.replace('マイナー', '')}
          </button>
        ))}
      </div>
      <div className="center">
        {melodic && <div style={{ alignSelf: 'flex-start', fontSize: 15, color: '#C9D6CC' }}>上行</div>}
        <Staff chalk notes={up} width={360} label={`${MINOR_TYPES[type].name}の上行`} />
        {melodic && (
          <>
            <div style={{ alignSelf: 'flex-start', fontSize: 15, color: '#C9D6CC' }}>下行</div>
            <Staff chalk notes={nat.slice().reverse()} width={360} label="メロディックマイナーの下行" />
          </>
        )}
        <Keyboard chalk start={60} octaves={2} extraC={false} lit={ups} labels={labels} height={120} />
        <Play onClick={() => playSequence(melodic ? [...ups, ...downs.slice(1)] : ups)}>
          {melodic ? '上行→下行を聴く' : '聴いてみる'}
        </Play>
      </div>
      {MINOR_TEXT[type]}
    </>
  );
}

const ROOT_KEYS = [
  MAJORS[0], MAJORS[1], MAJORS[2], MAJORS[3], MAJORS[4],
  MAJORS[5], MAJORS[6], MAJORS[7], MAJORS[8], MAJORS[9],
  MAJORS[10], MAJORS[11], MAJORS[12], MAJORS[13], MAJORS[14],
];

function ScaleExplorer() {
  const [k, setK] = useState(MAJORS[1]);
  const sc = majorScale(k);
  const rp = scaleRootPitch(k);
  const start = rp - (((rp % 12) + 12) % 12);
  const pitches = scalePitches(k);
  const labels = {};
  pitches.forEach((p, i) => { labels[p] = jp(sc[i]); });
  const marked = sc.slice(0, 7).filter((n) => n.a !== 0);
  return (
    <>
      <p>ルートを選んで「全全半全全全半」で弾いてみよう。</p>
      <div className="root-pick">
        {ROOT_KEYS.map((x) => (
          <button key={en(x)} className={x === k ? 'sel' : ''} onClick={() => setK(x)}>
            {en(x)}
          </button>
        ))}
      </div>
      <div className="center">
        <Keyboard chalk start={start} octaves={2} extraC={false} lit={pitches} labels={labels} height={130} />
        <Play onClick={() => playSequence(pitches)}>{majorName(k)}を聴く</Play>
      </div>
      <p>
        {marked.length ? (
          <>
            #・♭が付いたのは <span className="em-r">{marked.map(jp).join('・')}</span> → <span className="em">{k.t === '#' ? '#系' : '♭系'}</span>
          </>
        ) : (
          <>黒鍵なし → <span className="em">調号なし</span></>
        )}
      </p>
      <p>
        調号:<span className="em">{sigText(k)}</span>
        <br />
        平行調:<span className="em">{minorName(k)}</span>(短3度下)
      </p>
    </>
  );
}

function SigOrder() {
  return (
    <>
      <p>調号が付く順番は決まっている!</p>
      <div className="order-row"><span className="em">#</span>:ファ・ド・ソ・レ・ラ・ミ・シ</div>
      <div className="center"><Staff chalk keySig={{ t: '#', c: 7 }} width={320} label="#7つの調号" /></div>
      <div className="order-row"><span className="em">♭</span>:シ・ミ・ラ・レ・ソ・ド・ファ</div>
      <div className="center"><Staff chalk keySig={{ t: 'b', c: 7 }} width={320} label="♭7つの調号" /></div>
      <p>
        ♭は#の<span className="em-r">逆の順番</span>。
        <br />
        最初のファさえ覚えれば、あとは<span className="em">完全5度上</span>へ。♭はシから<span className="em">完全5度下</span>へ。
      </p>
    </>
  );
}

function Chain({ items }) {
  return (
    <div className="chain">
      {items.map((x, i) => (
        <span key={i}>
          {i > 0 && <span className="arr">→</span>}
          {x[0]}<small>({x[1]})</small>
        </span>
      ))}
    </div>
  );
}

function SigCount() {
  return (
    <>
      <p>調号の数でキーが決まる。</p>
      <div className="swap">
        <div><span className="em">#系</span>(完全5度上へ)</div>
        <Chain items={[['C', 0], ['G', 1], ['D', 2], ['A', 3], ['E', 4], ['B', 5], ['F#', 6], ['C#', 7]]} />
      </div>
      <div className="swap">
        <div><span className="em">♭系</span>(完全5度下へ)</div>
        <Chain items={[['C', 0], ['F', 1], ['B♭', 2], ['E♭', 3], ['A♭', 4], ['D♭', 5], ['G♭', 6], ['C♭', 7]]} />
      </div>
      <p>暗記がおすすめ。でも「完全5度ずつ進む」と分かっていれば、自分で導ける。</p>
      <p><span className="em-r">マイナーキー</span>は、平行調のメジャーを考えればOK!</p>
    </>
  );
}

const Y = '#F3D77A';
const R = '#F59A8B';
const cap = { fontSize: 16, color: '#C9D6CC' };

function HowToRead() {
  return (
    <>
      <div className="swap">
        <div className="em">譜面の調号 → キー</div>
        <div><span className="em-r">#系</span>:最後の#の<span className="em">半音上</span>が主音</div>
        <Staff chalk width={320} keySig={{ t: '#', c: 4, colors: [null, null, null, R] }} notes={[{ l: 2, a: 0, o: 4, color: Y }]} label="#4つの調号と主音ミ" />
        <div style={cap}>例:ファ・ド・ソ・<span className="em-r">レ#</span> → 半音上の<span className="em">ミ</span> → Eメジャー</div>
        <div style={{ marginTop: 8 }}><span className="em-r">♭系</span>:<span className="em">一つ手前の♭</span>が主音</div>
        <Staff chalk width={320} keySig={{ t: 'b', c: 4, colors: [null, null, R, null] }} notes={[{ l: 5, a: 0, o: 4, color: Y }]} label="♭4つの調号と主音ラ♭" />
        <div style={cap}>例:シ・ミ・<span className="em-r">ラ♭</span>・レ → 一つ手前の<span className="em">ラ♭</span> → A♭メジャー(♭1つはFと暗記)</div>
      </div>
      <div className="swap">
        <div className="em">キー → 調号</div>
        <div>まず#系か♭系か? ルートから弾いて黒鍵を見る。<span className="em">Fと♭の付くキーは♭系</span>と暗記。</div>
        <div style={{ marginTop: 8 }}><span className="em-r">#系</span>:その音の<span className="em">半音下まで</span></div>
        <Staff chalk width={320} keySig={{ t: '#', c: 3, colors: [null, null, R] }} notes={[{ l: 5, a: 0, o: 4, color: Y }]} label="Key of Aの調号" />
        <div style={cap}>例:Key of <span className="em">A</span> → 半音下は<span className="em-r">ソ#</span> → ファ・ド・ソに#</div>
        <div style={{ marginTop: 8 }}><span className="em-r">♭系</span>:その音の<span className="em">次まで</span></div>
        <Staff chalk width={320} keySig={{ t: 'b', c: 5, colors: [null, null, null, Y, R] }} notes={[{ l: 1, a: 0, o: 4, color: Y }]} label="Key of D♭の調号" />
        <div style={cap}>例:Key of <span className="em">D♭</span> → <span className="em">レ</span>の次の<span className="em-r">ソ</span>まで → シ・ミ・ラ・レ・ソに♭</div>
      </div>
      <p style={{ fontSize: 15, color: '#C9D6CC' }}>
        黄色=主音、赤=目印の#・♭。A♭やD♭のように主音に♭が付くキーでも、調号があるので音符には♭を書きません。
      </p>
    </>
  );
}

export const LEARN = {
  1: {
    name: '度数',
    badge: '第一章',
    pages: [
      { title: '① 半音はどこ?', tag: '理解', Body: HalfSteps },
      { title: '② Cメジャー上の度数', tag: '暗記', Body: CIntervals },
      { title: '③ 完全度数って何?', tag: '理解', Body: Inversion },
      { title: '④ 広くなる・狭くなる', tag: '暗記', Body: WidenNarrow },
      { title: '⑤ 解き方の5ステップ', tag: '理解', Body: FiveSteps },
    ],
  },
  2: {
    name: '調号',
    badge: '第二章',
    pages: [
      { title: '① メジャースケール', tag: '暗記', Body: MajorScale },
      { title: '② マイナーと平行調', tag: '理解', Body: MinorParallel },
      { title: '③ マイナースケール3種', tag: '理解', Body: MinorTypes },
      { title: '④ いろんな音から作ってみよう', tag: '練習', Body: ScaleExplorer },
      { title: '⑤ 調号が付く順番', tag: '暗記', Body: SigOrder },
      { title: '⑥ 調号の数とキー', tag: '理解', Body: SigCount },
      { title: '⑦ 見分け方', tag: '暗記', Body: HowToRead },
    ],
  },
};
