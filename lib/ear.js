// 耳コピ用の短い曲を自動で作る
// ・コード進行はポップスの定番パターンから選ぶ
// ・メロディーは「問い(2小節)→答え(2小節)」。答えは問いのリズムと形を、コードに合わせて移してくり返す
import { pick, MAJORS, relMinor } from './theory';
import { diatonic, keyLabel, pc, TYPES } from './chords';

export const LEVELS = {
  beginner: { label: '初級', bars: 4, tempo: 80, info: '4小節 ・ メジャーキーのⅠ・Ⅳ・Ⅴ', types: ['', 'm'] },
  intermediate: { label: '中級', bars: 8, tempo: 88, info: '8小節 ・ 定番のコード進行(メジャー/マイナー)', types: ['', 'm', 'm(♭5)'] },
  advanced: { label: '上級', bars: 16, tempo: 92, info: '16小節 ・ Verse/Pre-Chorus/Chorus ・ セブンスあり', types: ['', 'm', 'm(♭5)', 'M7', '7', 'm7', 'm7(♭5)'] },
};

// 耳コピで使うキー(調号3つまで)
const EAR_KEYS = MAJORS.filter((k) => k.c <= 3);

// 定番のコード進行(数字は 0=Ⅰ … 6=Ⅶ)
const P = (name, degs) => ({ name, degs });
const PROGS = {
  beginner: [
    P('スリーコード', [0, 3, 4, 0]),
    P('スリーコード', [0, 4, 3, 0]),
    P('スリーコード', [0, 3, 0, 4]),
    P('スリーコード', [0, 0, 3, 4]),
    P('スリーコード', [3, 4, 0, 0]),
  ],
  major: [
    P('王道進行', [3, 4, 2, 5]),
    P('Ⅰ→Ⅴ→Ⅵm→Ⅳ の定番進行', [0, 4, 5, 3]),
    P('50年代進行(Ⅰ→Ⅵm→Ⅳ→Ⅴ)', [0, 5, 3, 4]),
    P('小室進行', [5, 3, 4, 0]),
    P('スリーコード', [0, 3, 4, 0]),
  ],
  majorEnd: [
    P('ツーファイブワン', [1, 4, 0, 0]),
    P('小室進行', [5, 3, 4, 0]),
    P('Ⅳ→Ⅴ→Ⅰ(終止形)', [3, 4, 0, 0]),
    P('スリーコード', [0, 3, 4, 0]),
  ],
  majorPre: [
    P('上昇進行(Ⅱm→Ⅲm→Ⅳ→Ⅴ)', [1, 2, 3, 4]),
    P('王道進行', [3, 4, 2, 5]),
    P('Ⅳ→Ⅴ のくり返し', [3, 4, 3, 4]),
  ],
  minor: [
    P('エオリアン進行(Ⅰm→♭Ⅵ→♭Ⅶ→Ⅰm)', [0, 5, 6, 0]),
    P('Ⅰm→Ⅳm→♭Ⅶ→♭Ⅲ', [0, 3, 6, 2]),
    P('Ⅰm→♭Ⅶ→♭Ⅵ→♭Ⅶ', [0, 6, 5, 6]),
    P('Ⅰm→Ⅳm→Ⅴm→Ⅰm', [0, 3, 4, 0]),
  ],
  minorEnd: [
    P('♭Ⅵ→♭Ⅶ→Ⅰm', [5, 6, 0, 0]),
    P('Ⅰm→Ⅳm→Ⅴm→Ⅰm', [0, 3, 4, 0]),
    P('エオリアン進行(Ⅰm→♭Ⅵ→♭Ⅶ→Ⅰm)', [0, 5, 6, 0]),
  ],
  minorPre: [
    P('Ⅳm→♭Ⅶ→♭Ⅲ→♭Ⅵ', [3, 6, 2, 5]),
    P('♭Ⅵ→♭Ⅶ のくり返し', [5, 6, 5, 6]),
  ],
};
const CANON = P('カノン進行', [0, 4, 5, 2, 3, 0, 3, 4]);

function plan(level, minor) {
  const M = minor ? 'minor' : 'major';
  if (level === 'beginner') {
    const p = pick(PROGS.beginner);
    return { phrases: [p], sections: [{ name: '', from: 0, to: 3, prog: p.name }] };
  }
  if (level === 'intermediate') {
    if (!minor && Math.random() < 0.3) {
      return { phrases: [{ name: CANON.name, degs: CANON.degs.slice(0, 4) }, { name: CANON.name, degs: CANON.degs.slice(4) }], sections: [{ name: '', from: 0, to: 7, prog: CANON.name }], canon: true };
    }
    const a = pick(PROGS[M]);
    const b = pick(PROGS[`${M}End`]);
    return { phrases: [a, b], sections: [{ name: '', from: 0, to: 7, prog: a.name === b.name ? a.name : `${a.name} → ${b.name}` }] };
  }
  const v = pick(PROGS[M]);
  const pre = pick(PROGS[`${M}Pre`]);
  const c1 = pick(PROGS[M]);
  const c2 = pick(PROGS[`${M}End`]);
  return {
    phrases: [v, pre, c1, c2],
    sections: [
      { name: 'Verse', from: 0, to: 3, prog: v.name },
      { name: 'Pre-Chorus', from: 4, to: 7, prog: pre.name },
      { name: 'Chorus', from: 8, to: 15, prog: c1.name === c2.name ? c1.name : `${c1.name} → ${c2.name}` },
    ],
  };
}

// 上級のセブンス:よく使う形だけ(Ⅴ7・Ⅱm7・ⅣM7・ⅠM7 など)
function useSeventh(level, minor, d) {
  if (level !== 'advanced') return false;
  const likely = minor ? [3, 6, 1, 5] : [4, 1, 3, 5, 0];
  return likely.includes(d) && Math.random() < 0.6;
}

const MAJ = [0, 2, 4, 5, 7, 9, 11];
const MIN = [0, 2, 3, 5, 7, 8, 10];

const RHY_A = {
  calm: [[0, 1, 2, 3], [0, 1, 1.5, 2], [0, 0.5, 1, 2, 3], [0, 1.5, 2, 3]],
  busy: [[0, 0.5, 1, 1.5, 2, 3], [0, 0.5, 1, 2, 2.5, 3], [0, 1, 1.5, 2, 2.5]],
};
const RHY_END = [[0, 1, 2], [0, 0.5, 1, 2], [0, 2]]; // 最後の音が長い

export function makeSong(level) {
  const conf = LEVELS[level];
  const minor = level === 'beginner' ? false : Math.random() < 0.35;
  const key = pick(EAR_KEYS);
  const tri = diatonic(key, minor, false);
  const sev = diatonic(key, minor, true);
  const pl = plan(level, minor);
  const degs = pl.phrases.flatMap((p) => p.degs);
  const chords = degs.map((d, bar) => ({ ...(useSeventh(level, minor, d) ? sev[d] : tri[d]), bar }));

  const tonicPc = pc(minor ? relMinor(key) : key);
  const scale = (minor ? MIN : MAJ).map((s) => (tonicPc + s) % 12);
  const pool = [];
  for (let m = 60; m <= 86; m++) if (scale.includes(m % 12)) pool.push(m);
  const tonePcs = (c) => TYPES[c.type].semis.slice(0, 3).map((s) => (pc(c.root) + s) % 12);
  const isTone = (idx, c) => tonePcs(c).includes(pool[idx] % 12);
  const nearestTone = (target, c, lo, hi) => {
    let best = null;
    for (let i = lo; i <= hi; i++) if (isTone(i, c) && (best === null || Math.abs(i - target) < Math.abs(best - target))) best = i;
    return best ?? target;
  };
  const nearestTonic = (target, lo, hi) => {
    let best = target;
    let bd = 99;
    for (let i = lo; i <= hi; i++) if (pool[i] % 12 === tonicPc && Math.abs(i - target) < bd) { best = i; bd = Math.abs(i - target); }
    return best;
  };
  const sectionOf = (bar) => {
    const s = pl.sections.find((x) => bar >= x.from && bar <= x.to);
    return s ? s.name : '';
  };

  const melody = [];
  const total = chords.length;
  let motif = null; // { r1, r2, steps1, steps2 }

  for (let ph = 0; ph < total / 4; ph++) {
    const b0 = ph * 4;
    const sec = sectionOf(b0);
    const chorus = sec === 'Chorus';
    // 音域:Chorusは高め
    const lo = pool.findIndex((m) => m >= (chorus ? 67 : 62));
    const hiM = chorus ? 84 : 79;
    let hi = pool.length - 1;
    while (pool[hi] > hiM) hi--;
    const center = Math.round((lo + hi) / 2);

    // 新しいモチーフを作るのは最初とChorusの頭(それ以外は前のモチーフを使い回す)
    const fresh = !motif || (chorus && b0 === pl.sections.find((s) => s.name === 'Chorus').from);
    if (fresh) {
      const r1 = pick(RHY_A[chorus ? 'busy' : 'calm']);
      const r2 = pick(RHY_END);
      const contour = (n) => Array.from({ length: n }, (_, i) => (i === 0 ? 0 : pick([-1, 1, 1, -1, 2, -2, 1, -1])));
      motif = { r1, r2, c1: contour(r1.length), c2: contour(r2.length) };
    }

    const writeBar = (bar, rhythm, contour, startIdx, ending) => {
      const c = chords[bar];
      let idx = startIdx;
      const out = [];
      rhythm.forEach((beat, j) => {
        if (j > 0) idx += contour[j];
        idx = Math.max(lo, Math.min(hi, idx));
        const strong = beat === 0 || beat === 2;
        if (strong && !isTone(idx, c)) idx = nearestTone(idx, c, lo, hi);
        out.push(idx);
      });
      if (ending === 'tonic') out[out.length - 1] = nearestTonic(out[out.length - 1], lo, hi);
      else if (ending === 'tone') out[out.length - 1] = nearestTone(out[out.length - 1], chords[bar], lo, hi);
      rhythm.forEach((beat, j) => {
        const next = rhythm[j + 1] ?? 4;
        melody.push({ bar, beat, len: next - beat, midi: pool[out[j]] });
      });
      return out;
    };

    // 問い(1・2小節目)
    const s1 = nearestTone(center + (chorus ? 1 : 0), chords[b0], lo, hi);
    const q1 = writeBar(b0, motif.r1, motif.c1, s1, null);
    const q2 = writeBar(b0 + 1, motif.r2, motif.c2, q1[q1.length - 1] + motif.c2[0], 'tone');
    // 答え(3・4小節目):同じリズムと形を、コードの動きに合わせて移す
    const shift = chords[b0 + 2].i - chords[b0].i;
    const sh = shift > 3 ? shift - 7 : shift < -3 ? shift + 7 : shift;
    const a1 = writeBar(b0 + 2, motif.r1, motif.c1, Math.max(lo, Math.min(hi, s1 + sh)), null);
    const endKind = chords[b0 + 3].i === 0 ? 'tonic' : 'tone';
    writeBar(b0 + 3, motif.r2, motif.c2, a1[a1.length - 1] + motif.c2[0], endKind);
    void q2;
  }

  return {
    level,
    key,
    minor,
    keyName: keyLabel(key, minor),
    tempo: conf.tempo,
    bars: total,
    chords,
    sections: pl.sections,
    sectionOf,
    melody,
  };
}

// 答え合わせ(音の高さとコードの種類が同じなら正解。異名同音も正解にする)
export function sameChord(ans, c) {
  if (!ans || ans.l === undefined || ans.type === undefined) return false;
  return pc(ans) === pc(c.root) && ans.type === c.type;
}
