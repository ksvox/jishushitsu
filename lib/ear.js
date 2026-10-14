// 耳コピ用の短い曲を自動で作る(メロディー・ベース・ドラム・コード)
import { pick, MAJORS, relMinor } from './theory';
import { diatonic, keyLabel, pc, TYPES } from './chords';

export const LEVELS = {
  beginner: { label: '初級', bars: 4, tempo: 84, info: '4小節 ・ メジャーキーのⅠ・Ⅳ・Ⅴ', types: ['', 'm'] },
  intermediate: { label: '中級', bars: 8, tempo: 92, info: '8小節 ・ ダイアトニックコード(メジャー/マイナー)', types: ['', 'm', 'm(♭5)'] },
  advanced: { label: '上級', bars: 16, tempo: 96, info: '16小節 ・ Verse/Pre-Chorus/Chorus ・ セブンスあり', types: ['', 'm', 'm(♭5)', 'M7', '7', 'm7', 'm7(♭5)'] },
};

// 耳コピで使うキー(調号3つまで)
const EAR_KEYS = MAJORS.filter((k) => k.c <= 3);

// 機能ごとのコード(番号は 0=Ⅰ … 6=Ⅶ)
const FUNC = {
  major: { T: [0, 5, 2], S: [3, 1], D: [4] },
  minor: { T: [0, 2, 5], S: [3, 1], D: [4, 6] },
};

function phrase(minor, kinds) {
  const f = FUNC[minor ? 'minor' : 'major'];
  const out = [];
  kinds.forEach((k, i) => {
    let d;
    for (let t = 0; t < 20; t++) {
      d = k === 'I' ? 0 : k === 'X' ? pick([...f.T, ...f.S, ...f.D]) : pick(f[k]);
      if (i === 0 || d !== out[i - 1]) break;
    }
    out.push(d);
  });
  return out;
}

function progression(level, minor) {
  if (level === 'beginner') {
    const b2 = pick([3, 4]);
    const b3 = pick([0, 3, 4].filter((x) => x !== b2));
    const b4 = b3 === 4 ? 0 : pick([0, 4]);
    return { degs: [0, b2, b3, b4], sections: [{ name: '', from: 0, to: 3 }] };
  }
  if (level === 'intermediate') {
    const a = phrase(minor, ['I', 'X', 'S', 'D']);
    const b = phrase(minor, ['T', 'X', 'S', 'D']);
    b[3] = 0; // 最後はⅠで終わる
    if (b[2] === 0) b[2] = 3;
    return { degs: [...a, ...b], sections: [{ name: '', from: 0, to: 7 }] };
  }
  const verse = phrase(minor, ['I', 'X', 'S', 'D']);
  const pre = phrase(minor, ['S', 'T', 'S', 'D']);
  const ch1 = phrase(minor, ['S', 'D', 'T', 'X']);
  const ch2 = phrase(minor, ['S', 'D', 'S', 'D']);
  ch2[3] = 0;
  if (ch2[2] === 0) ch2[2] = 3;
  return {
    degs: [...verse, ...pre, ...ch1, ...ch2],
    sections: [
      { name: 'Verse', from: 0, to: 3 },
      { name: 'Pre-Chorus', from: 4, to: 7 },
      { name: 'Chorus', from: 8, to: 15 },
    ],
  };
}

const MAJ = [0, 2, 4, 5, 7, 9, 11];
const MIN = [0, 2, 3, 5, 7, 8, 10];

export function makeSong(level) {
  const conf = LEVELS[level];
  const minor = level === 'beginner' ? false : Math.random() < 0.4;
  const key = pick(EAR_KEYS);
  const tri = diatonic(key, minor, false);
  const sev = diatonic(key, minor, true);
  const { degs, sections } = progression(level, minor);
  const chords = degs.map((d, bar) => {
    const useSeventh = level === 'advanced' && Math.random() < 0.55;
    const c = useSeventh ? sev[d] : tri[d];
    return { ...c, bar };
  });

  // メロディー用の音(キーの音階、だいたいソ4〜ラ5)
  const tonicPc = pc(minor ? relMinor(key) : key);
  const scale = (minor ? MIN : MAJ).map((s) => (tonicPc + s) % 12);
  const pool = [];
  for (let m = 64; m <= 84; m++) if (scale.includes(m % 12)) pool.push(m);

  const sectionOf = (bar) => {
    const s = sections.find((x) => bar >= x.from && bar <= x.to);
    return s ? s.name : '';
  };
  const RHYTHMS = {
    calm: [[0, 1, 2, 3], [0, 2, 3], [0, 1.5, 2, 3], [0, 1, 2]],
    busy: [[0, 0.5, 1, 2, 3], [0, 1, 1.5, 2, 3], [0, 0.5, 1.5, 2, 2.5, 3], [0, 1, 2, 2.5, 3]],
  };

  let prev = pool[Math.floor(pool.length / 2)];
  const melody = [];
  chords.forEach((c, bar) => {
    const sec = sectionOf(bar);
    const last = bar === chords.length - 1;
    const chordPcs = TYPES[c.type].semis.slice(0, 3).map((s) => (pc(c.root) + s) % 12);
    const rhythm = last ? [0] : pick(RHYTHMS[sec === 'Chorus' ? 'busy' : 'calm']);
    const lift = sec === 'Chorus' ? 3 : sec === 'Pre-Chorus' ? 1 : 0;
    rhythm.forEach((beat, j) => {
      const next = rhythm[j + 1] ?? 4;
      const strong = beat === 0 || beat === 2;
      let cands;
      if (strong || last) {
        cands = pool.filter((m) => chordPcs.includes(m % 12));
        if (last) cands = pool.filter((m) => m % 12 === tonicPc);
      } else {
        const idx = pool.indexOf(prev);
        cands = [pool[idx - 1], pool[idx + 1], pool[idx - 2], pool[idx + 2]].filter(Boolean);
      }
      const target = prev + (lift && Math.random() < 0.5 ? lift : 0);
      cands.sort((a, b) => Math.abs(a - target) - Math.abs(b - target));
      const m = cands[Math.min(cands.length - 1, Math.random() < 0.7 ? 0 : 1)] ?? prev;
      melody.push({ bar, beat, len: last ? 4 : next - beat, midi: m });
      prev = m;
    });
  });

  return {
    level,
    key,
    minor,
    keyName: keyLabel(key, minor),
    tempo: conf.tempo,
    bars: chords.length,
    chords,
    sections,
    sectionOf,
    melody,
  };
}

// 答え合わせ(音の高さとコードの種類が同じなら正解。異名同音も正解にする)
export function sameChord(ans, c) {
  if (!ans || ans.l === undefined || ans.type === undefined) return false;
  return pc(ans) === pc(c.root) && ans.type === c.type;
}
