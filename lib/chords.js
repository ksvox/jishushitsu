// 中級編:コードの仕組み(AIなし・すべてルールで計算)
import {
  NAT, SOLFA, LETTERS, accText, jp, en, pick, shuffle, intervalOf, MAJORS, relMinor, majorScale, minorScale,
} from './theory';

const norm = (x) => {
  let r = ((x % 12) + 12) % 12;
  if (r > 6) r -= 12;
  return r;
};

// コードの種類: 記号・名前・半音・度数(何番目の音名か)
export const TYPES = {
  '': { name: 'メジャー', semis: [0, 4, 7], steps: [0, 2, 4] },
  m: { name: 'マイナー', semis: [0, 3, 7], steps: [0, 2, 4] },
  'm(♭5)': { name: 'ディミニッシュ', semis: [0, 3, 6], steps: [0, 2, 4] },
  aug: { name: 'オーグメント', semis: [0, 4, 8], steps: [0, 2, 4] },
  M7: { name: 'メジャーセブンス', semis: [0, 4, 7, 11], steps: [0, 2, 4, 6] },
  7: { name: 'セブンス', semis: [0, 4, 7, 10], steps: [0, 2, 4, 6] },
  m7: { name: 'マイナーセブンス', semis: [0, 3, 7, 10], steps: [0, 2, 4, 6] },
  'm7(♭5)': { name: 'マイナーセブンス・フラットファイブ', semis: [0, 3, 6, 10], steps: [0, 2, 4, 6] },
  dim7: { name: 'ディミニッシュセブンス', semis: [0, 3, 6, 9], steps: [0, 2, 4, 6] },
  sus4: { name: 'サスフォー', semis: [0, 5, 7], steps: [0, 3, 4] },
  6: { name: 'シックス', semis: [0, 4, 7, 9], steps: [0, 2, 4, 5] },
  add9: { name: 'アドナインス', semis: [0, 4, 7, 14], steps: [0, 2, 4, 8] },
};
export const TRIADS = ['', 'm', 'm(♭5)', 'aug'];
export const SEVENTHS = ['M7', '7', 'm7', 'm7(♭5)'];
export const ALL_TYPES = ['', 'm', 'm(♭5)', 'aug', 'sus4', 'M7', '7', 'm7', 'm7(♭5)', 'dim7', '6', 'add9'];

// ルートに使う音(ダブルシャープ等が出にくい表記)
export const ROOTS = [
  { l: 0, a: 0 }, { l: 0, a: 1 }, { l: 1, a: -1 }, { l: 1, a: 0 }, { l: 2, a: -1 }, { l: 2, a: 0 }, { l: 3, a: 0 },
  { l: 3, a: 1 }, { l: 4, a: -1 }, { l: 4, a: 0 }, { l: 5, a: -1 }, { l: 5, a: 0 }, { l: 6, a: -1 }, { l: 6, a: 0 },
];

export const chordName = (root, type) => `${en(root)}${type}`;
export const pc = (n) => (((NAT[n.l] + n.a) % 12) + 12) % 12;

// コードの構成音(五線用にオクターブ付き)
export function chordTones(root, type, octave = 4) {
  const s0 = root.l + 7 * octave;
  const t = TYPES[type];
  return t.steps.map((st, i) => {
    const s = s0 + st;
    const l = ((s % 7) + 7) % 7;
    return { l, o: Math.floor(s / 7), a: norm(NAT[root.l] + root.a + t.semis[i] - NAT[l]) };
  });
}
const simple = (tones) => tones.every((n) => Math.abs(n.a) <= 1);
export const tonesText = (tones) => tones.map(jp).join('・');

// 五線で見やすい高さ(ルートがド4〜ソ4あたり)
const octFor = (root) => (root.l <= 4 ? 4 : 3);

/* ===== 解き方 ===== */
const IV_NAME = (n1, n2) => intervalOf(n1, n2)?.label || '';

export function explainChord(root, type) {
  const tones = chordTones(root, type, octFor(root));
  const r = tones[0];
  const steps = [];
  steps.push(`ルートは**${jp(root)}**。構成音は **${tonesText(tones)}**`);
  const parts = tones.slice(1).map((n) => `${jp(n)}は${IV_NAME(r, n)}`);
  steps.push(`ルートから: ${parts.join('、')}`);
  const rule = {
    '': '長3度+完全5度 → **メジャー**',
    m: '短3度+完全5度 → **マイナー**',
    'm(♭5)': '短3度+減5度 → **ディミニッシュ(m(♭5))**',
    aug: '長3度+増5度 → **オーグメント(aug)**',
    M7: 'メジャー+長7度 → **M7**',
    7: 'メジャー+短7度 → **7**',
    m7: 'マイナー+短7度 → **m7**',
    'm7(♭5)': 'ディミニッシュ+短7度 → **m7(♭5)**',
    dim7: 'ディミニッシュ+減7度 → **dim7**',
    sus4: '3度の代わりに完全4度 → **sus4**',
    6: 'メジャー+長6度 → **6**',
    add9: 'メジャー+長9度(2度の1オクターブ上) → **add9**',
  }[type];
  steps.push(rule);
  steps.push(`コードネームは **${chordName(root, type)}**`);
  return steps;
}

/* ===== STEP1・STEP4:コードの問題 ===== */
function randomChord(types) {
  for (let i = 0; i < 200; i++) {
    const root = pick(ROOTS);
    const type = pick(types);
    const tones = chordTones(root, type, octFor(root));
    if (simple(tones)) return { root, type, tones };
  }
  return null;
}

// form: identify(五線→種類) / build(書き入れ) / tones(コード名→構成音) / name(五線→コードネーム)
export function genChordQ(types, form) {
  const c = randomChord(types);
  return { kind: 'chord', form, ...c };
}

/* ===== STEP2・STEP3:ダイアトニック ===== */
const NUM = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'];
const FORMULA = {
  major3: ['', 'm', 'm', '', '', 'm', 'm(♭5)'],
  minor3: ['m', 'm(♭5)', '', 'm', 'm', '', ''],
  major7: ['M7', 'm7', 'm7', 'M7', '7', 'm7', 'm7(♭5)'],
  minor7: ['m7', 'm7(♭5)', 'M7', 'm7', 'm7', 'M7', '7'],
};
const FLAT_DEG = [false, false, true, false, false, true, true]; // マイナーの♭Ⅲ・♭Ⅵ・♭Ⅶ

export const degreeName = (i, minor, type) => `${minor && FLAT_DEG[i] ? '♭' : ''}${NUM[i]}${type}`;
export const formulaText = (minor, seventh) =>
  FORMULA[`${minor ? 'minor' : 'major'}${seventh ? 7 : 3}`].map((t, i) => degreeName(i, minor, t)).join(' ');

export function diatonic(key, minor, seventh) {
  const root = minor ? relMinor(key) : key;
  const sc = minor ? minorScale(root, 'natural') : majorScale(key);
  const f = FORMULA[`${minor ? 'minor' : 'major'}${seventh ? 7 : 3}`];
  return f.map((type, i) => ({ i, type, root: { l: sc[i].l, a: sc[i].a }, name: chordName(sc[i], type), degree: degreeName(i, minor, type) }));
}
export const keyLabel = (key, minor) => (minor ? `${en(relMinor(key))}マイナー` : `${en(key)}メジャー`);

// ダブルシャープ・ダブルフラットが出ないキーだけ使う
const KEY_OK = (key, minor) => {
  const root = minor ? relMinor(key) : key;
  const sc = minor ? minorScale(root, 'natural') : majorScale(key);
  return sc.every((n) => Math.abs(n.a) <= 1);
};

export function genDiatonicQ(minor, seventh, form) {
  let key;
  do key = pick(MAJORS); while (!KEY_OK(key, minor));
  const list = diatonic(key, minor, seventh);
  const target = pick(list);
  return { kind: 'diatonic', form, key, minor, seventh, target, list };
}

export function explainDiatonic(q) {
  const { key, minor, seventh, target, list } = q;
  const steps = [];
  steps.push(`${minor ? 'マイナー' : 'メジャー'}の公式: **${formulaText(minor, seventh)}**`);
  if (minor) steps.push('(忘れたら、メジャーの公式の6番目から並べればOK)');
  const scale = list.map((c) => jp(c.root)).join(' ');
  steps.push(`${keyLabel(key, minor)}のスケール: ${scale}`);
  steps.push(`${target.i + 1}番目は公式 **${target.degree}**、ルートは **${jp(target.root)}** → **${target.name}**`);
  return steps;
}

/* ===== 構成音の書き方(書き入れ・構成音の問題の採点用) ===== */
export const sameSpelling = (a, b) => a.l === b.l && a.a === b.a;
export const toneLabel = (n) => SOLFA[n.l] + accText(n.a);
export const letterLabel = (l) => `${SOLFA[l]}(${LETTERS[l]})`;
export { shuffle };
