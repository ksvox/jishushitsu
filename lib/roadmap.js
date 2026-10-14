// 第三章 進行記号:譜面の自動生成と、正しく進む順番の計算
// 小節: { label, startRepeat, endRepeat, ending(1|2), segno, toCoda, coda, fine, dc, ds }

const LETTERS = 'ABCDEFGHIJKLMNOP'.split('');
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1)); // a〜b
const chance = (p) => Math.random() < p;

export const ROAD_LEVELS = {
  beginner: { label: '初級', bars: 4, info: '4小節 ・ リピート記号' },
  intermediate: { label: '中級', bars: 8, info: '8小節 ・ リピート記号と1カッコ・2カッコ' },
  advanced: { label: '上級', bars: 16, info: '16小節 ・ D.S.・D.C.・Coda・Fine' },
};

const blank = (n) => Array.from({ length: n }, (_, i) => ({ label: LETTERS[i] }));

// リピート(+カッコ)を置く。from〜to の範囲に収める。置けたら true
function placeRepeat(bars, from, to, { endings = false, omitStart = false } = {}) {
  const space = to - from + 1;
  if (endings && space >= 4) {
    const e1 = space >= 6 && chance(0.4) ? 2 : 1;
    const e2 = 1;
    const body = rnd(1, Math.min(3, space - e1 - e2));
    const s = rnd(from, to - (body + e1 + e2) + 1);
    if (!(omitStart && s === 0)) bars[s].startRepeat = true;
    for (let k = 0; k < e1; k++) bars[s + body + k].ending = 1;
    bars[s + body + e1 - 1].endRepeat = true;
    for (let k = 0; k < e2; k++) bars[s + body + e1 + k].ending = 2;
    return true;
  }
  if (space < 2) return false;
  const len = rnd(2, Math.min(4, space));
  const s = rnd(from, to - len + 1);
  if (!(omitStart && s === 0)) bars[s].startRepeat = true;
  bars[s + len - 1].endRepeat = true;
  return true;
}

export function makeScore(level) {
  if (level === 'beginner') {
    const bars = blank(4);
    placeRepeat(bars, 0, 3, { omitStart: chance(0.3) });
    return bars;
  }
  if (level === 'intermediate') {
    const bars = blank(8);
    const first = rnd(0, 2);
    placeRepeat(bars, first, 7, { endings: true, omitStart: chance(0.25) });
    // 残りの場所に、もう1つリピートを置くこともある
    const used = bars.map((b) => !!(b.startRepeat || b.endRepeat || b.ending));
    const lastUsed = used.lastIndexOf(true);
    if (lastUsed <= 4 && chance(0.5)) placeRepeat(bars, lastUsed + 1, 7);
    return bars;
  }
  // 上級:4つの型からランダム
  const bars = blank(16);
  const type = pickType();
  if (type === 'dsCoda') {
    const a = rnd(2, 4);
    const codaLen = rnd(2, 4);
    const codaStart = 16 - codaLen;
    const d = codaStart - 1;
    const t = rnd(a + 2, d - 2);
    bars[a].segno = true;
    bars[t].toCoda = true;
    bars[d].ds = 'D.S. al Coda';
    bars[codaStart].coda = true;
    innerRepeat(bars, a, t - 1);
    if (chance(0.4)) placeRepeat(bars, 0, a - 1, { omitStart: chance(0.5) });
  } else if (type === 'dsFine') {
    const a = rnd(2, 4);
    const f = rnd(a + 3, 11);
    bars[a].segno = true;
    bars[f].fine = true;
    bars[15].ds = 'D.S. al Fine';
    innerRepeat(bars, a, f - 1);
    if (chance(0.4)) placeRepeat(bars, 0, a - 1, { omitStart: chance(0.5) });
  } else if (type === 'dcFine') {
    const f = rnd(4, 10);
    bars[f].fine = true;
    bars[15].dc = 'D.C. al Fine';
    innerRepeat(bars, 0, f - 1, true);
  } else {
    const codaLen = rnd(2, 4);
    const codaStart = 16 - codaLen;
    const d = codaStart - 1;
    const t = rnd(4, d - 3);
    bars[t].toCoda = true;
    bars[d].dc = 'D.C. al Coda';
    bars[codaStart].coda = true;
    innerRepeat(bars, 0, t - 1, true);
  }
  return bars;
}

function pickType() {
  const r = Math.random();
  return r < 0.35 ? 'dsCoda' : r < 0.6 ? 'dsFine' : r < 0.8 ? 'dcFine' : 'dcCoda';
}

// 戻った後に通る場所にリピートを置き、「戻った後は繰り返さない」を練習させる
function innerRepeat(bars, from, to, must = false) {
  if (to - from < 1) return;
  if (!must && !chance(0.7)) return;
  placeRepeat(bars, from, to, { endings: to - from >= 3 && chance(0.5), omitStart: from === 0 && chance(0.3) });
}

// 正しく進む順番
export function solveOrder(bars) {
  const order = [];
  const done = new Set();
  let i = 0;
  let pass = 1;
  let jumped = false;
  let guard = 0;
  while (i < bars.length && guard++ < 200) {
    const b = bars[i];
    // 2回目(または戻った後)は1カッコを飛ばして2カッコへ
    if (b.ending === 1 && (pass === 2 || jumped)) {
      let k = i;
      while (k < bars.length && bars[k].ending !== 2) k++;
      i = k;
      continue;
    }
    order.push(b.label);
    if (b.ending === 2 && !(bars[i + 1] && bars[i + 1].ending === 2)) pass = 1;
    if (jumped && b.fine) break;
    if (jumped && b.toCoda) {
      i = bars.findIndex((x) => x.coda);
      continue;
    }
    if (b.endRepeat && !jumped && !done.has(i)) {
      done.add(i);
      pass = 2;
      let s = i;
      while (s > 0 && !bars[s].startRepeat) s--;
      i = s;
      continue;
    }
    if ((b.dc || b.ds) && !jumped) {
      jumped = true;
      pass = 1;
      i = b.dc ? 0 : bars.findIndex((x) => x.segno);
      continue;
    }
    i++;
  }
  return order;
}

// 1つ目のずれた場所(なければ -1)
export function firstMismatch(your, correct) {
  const n = Math.max(your.length, correct.length);
  for (let k = 0; k < n; k++) if (your[k] !== correct[k]) return k;
  return -1;
}

// 覚えるページの例(固定)
export const EXAMPLES = {
  repeat: [{ label: 'A', startRepeat: true }, { label: 'B', endRepeat: true }, { label: 'C' }, { label: 'D' }],
  repeatNoStart: [{ label: 'A' }, { label: 'B', endRepeat: true }, { label: 'C' }, { label: 'D' }],
  endings: [{ label: 'A', startRepeat: true }, { label: 'B' }, { label: 'C', ending: 1, endRepeat: true }, { label: 'D', ending: 2 }],
  dcFine: [{ label: 'A' }, { label: 'B', fine: true }, { label: 'C' }, { label: 'D', dc: 'D.C. al Fine' }],
  dsCoda: [{ label: 'A' }, { label: 'B', segno: true }, { label: 'C', toCoda: true }, { label: 'D', ds: 'D.S. al Coda' }, { label: 'E', coda: true }, { label: 'F' }],
  noRepeatAfter: [
    { label: 'A', startRepeat: true }, { label: 'B', ending: 1, endRepeat: true }, { label: 'C', ending: 2, fine: true }, { label: 'D', dc: 'D.C. al Fine' },
  ],
};
