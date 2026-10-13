// 音楽自習室 理論エンジン(AIなし・すべてルールで計算)
// 音の表し方: { l: 0〜6 (ド〜シ), a: 変化記号 (-2〜2), o: オクターブ (4 = 中央ドのオクターブ) }

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const SOLFA = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ'];
export const NAT = [0, 2, 4, 5, 7, 9, 11];

export const accText = (a) => (a === 2 ? '𝄪' : a === 1 ? '#' : a === -1 ? '♭' : a === -2 ? '𝄫' : '');
export const pitch = (n) => 12 * (n.o + 1) + NAT[n.l] + n.a;
export const step = (n) => n.l + 7 * n.o;
export const jp = (n) => SOLFA[n.l] + accText(n.a);
export const en = (n) => LETTERS[n.l] + accText(n.a);
export const full = (n) => `${jp(n)}(${en(n)})`;
export const fromStep = (s, a = 0) => ({ l: ((s % 7) + 7) % 7, o: Math.floor(s / 7), a });

const rnd = (n) => Math.floor(Math.random() * n);
export const pick = (arr) => arr[rnd(arr.length)];
export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ============ 第1章 度数 ============ */

const PERFECT = [1, 4, 5, 8];
const BASE = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 8: 12 };
// 「最初に覚えた条件」= ドから数えた時に含む半音の数
const COND = { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1, 6: 1, 7: 1, 8: 2 };
const LAD_P = ['重減', '減', '完全', '増', '重増']; // 真ん中 = 完全
const LAD_M = ['重減', '減', '短', '長', '増', '重増']; // 真ん中 = 長
export const QUALITIES = ['重減', '減', '短', '完全', '長', '増', '重増'];

export const C_MAJOR_INTERVALS = [
  { to: 'ド', name: '完全1度', cond: '同じ音', semis: 0 },
  { to: 'レ', name: '長2度', cond: '半音なし', semis: 2 },
  { to: 'ミ', name: '長3度', cond: '半音なし', semis: 4 },
  { to: 'ファ', name: '完全4度', cond: '半音1つ', semis: 5 },
  { to: 'ソ', name: '完全5度', cond: '半音1つ', semis: 7 },
  { to: 'ラ', name: '長6度', cond: '半音1つ', semis: 9 },
  { to: 'シ', name: '長7度', cond: '半音1つ', semis: 11 },
  { to: 'ド', name: '完全8度', cond: '半音2つ', semis: 12 },
];

function shiftQ(perf, q, by) {
  const lad = perf ? LAD_P : LAD_M;
  return lad[lad.indexOf(q) + by];
}

export function intervalOf(n1, n2) {
  const num = step(n2) - step(n1) + 1;
  if (num < 1 || num > 8) return null;
  const semis = pitch(n2) - pitch(n1);
  const perf = PERFECT.includes(num);
  const d = semis - BASE[num];
  const lad = perf ? LAD_P : LAD_M;
  const q = lad[(perf ? 2 : 3) + d];
  if (!q) return null;
  return { num, q, perf, semis, label: `${q}${num}度` };
}

// 先生の5ステップに沿った解き方(**で囲んだ所は強調)
export function explainInterval(n1, n2) {
  const iv = intervalOf(n1, n2);
  const { num, perf } = iv;
  const s1 = step(n1);
  const s2 = step(n2);
  const names = [];
  for (let s = s1; s <= s2; s++) names.push(SOLFA[((s % 7) + 7) % 7]);
  const baseQ = perf ? '完全' : '長';
  const baseName = `${baseQ}${num}度`;
  const steps = [];

  steps.push(
    num === 1
      ? `同じ音(${SOLFA[n1.l]})→ **1度**`
      : `${SOLFA[n1.l]}から数えて「${names.join('・')}」→ **${num}度**`
  );
  steps.push(`${num}度は最初に**「${baseName}」**と覚えた`);
  const cond = num === 1 ? '同じ音' : COND[num] === 0 ? '半音を含まない' : COND[num] === 1 ? '半音を1つ含む' : '半音を2つ含む';
  steps.push(
    num === 1
      ? `完全1度は「ド→ド」。条件は**同じ音**`
      : `${baseName}は「ド→${SOLFA[(num - 1) % 7]}」で覚えた。条件は**${cond}**`
  );

  let count = 0;
  const pairs = [];
  for (let s = s1; s < s2; s++) {
    const l = ((s % 7) + 7) % 7;
    if (l === 2) { count++; pairs.push('ミとファ'); }
    if (l === 6) { count++; pairs.push('シとド'); }
  }
  const c0 = COND[num];
  const q0 = shiftQ(perf, baseQ, c0 - count);
  const hasAcc = n1.a !== 0 || n2.a !== 0;
  const natPair = `「${SOLFA[n1.l]}→${SOLFA[n2.l]}」`;
  let t4 = hasAcc ? `#(♭)を外すと${natPair}。` : `${natPair}は#・♭なし。`;
  if (num === 1) t4 += `同じ音なので → **完全1度**`;
  else if (count === c0)
    t4 += count === 0
      ? `半音を含まない → 条件と同じ → **${q0}${num}度**`
      : `${pairs.join('、')}の半音を${count}つ含む → 条件と同じ → **${q0}${num}度**`;
  else if (count > c0)
    t4 += `**${pairs.join('、')}の半音**を含む(条件より${count - c0}つ多い)→ 狭い → **${q0}${num}度**`;
  else
    t4 += count === 0
      ? `半音を含まない(条件より${c0 - count}つ少ない)→ 広い → **${q0}${num}度**`
      : `半音は${count}つだけ(条件より${c0 - count}つ少ない)→ 広い → **${q0}${num}度**`;
  steps.push(t4);

  let q = q0;
  const accs = [];
  if (n1.a) accs.push({ who: '下', a: n1.a });
  if (n2.a) accs.push({ who: '上', a: n2.a });
  if (!accs.length) {
    steps.push(`#・♭がないので、そのまま → **${q}${num}度**`);
  } else {
    const parts = accs.map(({ who, a }) => {
      const wider = (who === '上') === (a > 0);
      const by = (wider ? 1 : -1) * Math.abs(a);
      const prev = q;
      q = shiftQ(perf, q, by);
      return `${who}の音に${accText(a)}で${wider ? '広がった' : '狭くなった'} → ${prev}${num}度が${wider ? '広がって' : '狭くなって'} **${q}${num}度**`;
    });
    steps.push(parts.join('。さらに'));
  }
  return steps;
}

// レベル別に2音を自動生成
export function genInterval(level) {
  for (let t = 0; t < 1000; t++) {
    const s1 = 28 + rnd(7); // ド4〜シ4
    const num = 2 + rnd(7); // 2〜8度
    const s2 = s1 + num - 1;
    const n1 = fromStep(s1);
    const n2 = fromStep(s2);
    if (level === 2) {
      const a = pick([1, -1]);
      if (rnd(2)) n2.a = a; else n1.a = a;
    }
    if (level === 3) {
      n1.a = pick([1, -1, 0]);
      n2.a = pick([1, -1]);
    }
    const iv = intervalOf(n1, n2);
    if (!iv || iv.semis <= 0) continue;
    if (level === 3 && Math.random() < 0.45 && !['重増', '重減', '増', '減'].includes(iv.q)) continue;
    return { kind: 'interval', n1, n2, iv };
  }
  return null;
}

/* ============ 第2章 調号 ============ */

export const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6]; // ファドソレラミシ
export const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3]; // シミラレソドファ

export const MAJORS = [
  { l: 0, a: 0, t: '', c: 0 },
  { l: 4, a: 0, t: '#', c: 1 },
  { l: 1, a: 0, t: '#', c: 2 },
  { l: 5, a: 0, t: '#', c: 3 },
  { l: 2, a: 0, t: '#', c: 4 },
  { l: 6, a: 0, t: '#', c: 5 },
  { l: 3, a: 1, t: '#', c: 6 },
  { l: 0, a: 1, t: '#', c: 7 },
  { l: 3, a: 0, t: 'b', c: 1 },
  { l: 6, a: -1, t: 'b', c: 2 },
  { l: 2, a: -1, t: 'b', c: 3 },
  { l: 5, a: -1, t: 'b', c: 4 },
  { l: 1, a: -1, t: 'b', c: 5 },
  { l: 4, a: -1, t: 'b', c: 6 },
  { l: 0, a: -1, t: 'b', c: 7 },
];

const norm = (x) => {
  let r = ((x % 12) + 12) % 12;
  if (r > 6) r -= 12;
  return r;
};

export function relMinor(k) {
  const rl = (k.l + 5) % 7;
  return { l: rl, a: norm(NAT[k.l] + k.a - 3 - NAT[rl]) };
}
export const majorName = (k) => `${en(k)}メジャー`;
export const minorName = (k) => `${en(relMinor(k))}マイナー`;
export const sigLetters = (k) => (k.t === '#' ? SHARP_ORDER : FLAT_ORDER).slice(0, k.c);
export const sigText = (k) =>
  k.c === 0 ? 'なし' : sigLetters(k).map((l) => SOLFA[l] + (k.t === '#' ? '#' : '♭')).join('・');

// メジャースケールの綴り(ルートから8音)
const MAJ_STEPS = [0, 2, 4, 5, 7, 9, 11, 12];
export function majorScale(root, startStep = null) {
  const s0 = startStep ?? root.l + 28;
  return MAJ_STEPS.map((semi, i) => {
    const s = s0 + i;
    const l = ((s % 7) + 7) % 7;
    return { l, o: Math.floor(s / 7), a: norm(NAT[root.l] + root.a + semi - NAT[l]) };
  });
}
export const scaleRootPitch = (root) => pitch({ l: root.l, a: root.a, o: 4 });
export const scalePitches = (root) => MAJ_STEPS.map((s) => scaleRootPitch(root) + s);

function leadingTone(root) {
  const l = (root.l + 6) % 7;
  return { l, a: norm(NAT[root.l] + root.a - 1 - NAT[l]) };
}

function sigNote(k) {
  return k.t === '#' ? '#' : '♭';
}

function eSharpNote(n) {
  if (n.a === 1 && n.l === 2) return '(ミ#は、鍵盤ではファの位置の白鍵です)';
  if (n.a === 1 && n.l === 6) return '(シ#は、鍵盤ではドの位置の白鍵です)';
  return '';
}

// キー → 調号 の解き方
export function explainKeyToSig(k, minor) {
  const steps = [];
  if (minor) steps.push(`**${minorName(k)}**の平行調は、短3度上の**${majorName(k)}**。調号はそれと同じ`);
  if (k.c === 0) {
    steps.push(`Cメジャー・Aマイナーは白鍵だけ → **調号なし**`);
    return steps;
  }
  if (k.t === 'b') {
    if (k.l === 3 && k.a === 0) {
      steps.push(`Fは**♭系(♭1つ)**と暗記`);
      steps.push(`→ **シ♭**`);
      return steps;
    }
    steps.push(`${en(k)}は♭が付くキー → **♭系**`);
    steps.push(`♭系は「その音の次まで」。♭の順番 シ・ミ・ラ・レ・ソ・ド・ファ の「${SOLFA[k.l]}」の次まで → **${sigText(k)}**`);
    return steps;
  }
  const lt = leadingTone(k);
  steps.push(`${en(k)}は「Fと♭の付くキー」ではない → **#系**(${jp(k)}から弾くと黒鍵が出てくる)`);
  steps.push(`#系は「その音の半音下まで」。${jp(k)}の半音下は**${jp(lt)}**${eSharpNote(lt)}`);
  steps.push(`#の順番 ファ・ド・ソ・レ・ラ・ミ・シ の「${SOLFA[lt.l]}」まで → **${sigText(k)}**`);
  return steps;
}

// 調号 → キー の解き方
export function explainSigToKey(k) {
  const steps = [];
  if (k.c === 0) {
    steps.push(`調号なし → **Cメジャー**`);
    steps.push(`平行調は短3度下 → **Aマイナー**`);
    return steps;
  }
  if (k.t === '#') {
    const last = { l: SHARP_ORDER[k.c - 1], a: 1 };
    steps.push(`#系は「最後の#の半音上」が主音。最後の#は**${jp(last)}**${eSharpNote(last)}`);
    steps.push(`その半音上の**${jp(k)}**が主音 → **${majorName(k)}**`);
  } else if (k.c === 1) {
    steps.push(`♭1つは**Fメジャー**と暗記`);
  } else {
    const prev = { l: FLAT_ORDER[k.c - 2], a: -1 };
    steps.push(`♭系は「一つ手前の♭」が主音。一つ手前の♭は**${jp(prev)}**`);
    steps.push(`→ **${majorName(k)}**`);
  }
  steps.push(`平行調は短3度下 → **${minorName(k)}**`);
  return steps;
}

// 平行調の解き方
export function explainParallel(k, fromMinor) {
  if (fromMinor) {
    const m = relMinor(k);
    return [
      `マイナーの平行調は**短3度上**のメジャー`,
      `${jp(m)}から短3度上は**${jp(k)}** → **${majorName(k)}**`,
    ];
  }
  const m = relMinor(k);
  return [
    `メジャーの平行調は**短3度下**のマイナー`,
    `${jp(k)}から短3度下は**${jp(m)}** → **${minorName(k)}**`,
  ];
}

// スケール作りの解き方
export function explainScale(k) {
  const sc = majorScale(k);
  const pat = ['全', '全', '半', '全', '全', '全', '半'];
  const line = sc.map((n, i) => (i === 0 ? jp(n) : `(${pat[i - 1]})${jp(n)}`)).join(' ');
  const blacks = sc.slice(0, 7).filter((n) => n.a !== 0);
  const steps = [`${jp(k)}から「全全半全全全半」で: ${line}`];
  if (!blacks.length) steps.push(`#・♭は付かない → **調号なし**`);
  else
    steps.push(
      `#・♭が付いたのは**${blacks.map(jp).join('・')}** → **${k.t === '#' ? '#系' : '♭系'}**、調号は**${sigText(k)}**`
    );
  steps.push(`平行調は短3度下 → **${minorName(k)}**`);
  return steps;
}

/* ===== 第2章の問題を自動生成 ===== */

export function genKeyToSig() {
  const k = pick(MAJORS);
  const minor = Math.random() < 0.4;
  return { kind: 'keyToSig', k, minor };
}

function distractKeys(k, n) {
  return shuffle(MAJORS.filter((x) => !(x.l === k.l && x.a === k.a))).slice(0, n);
}

export function genSigToKey() {
  const k = pick(MAJORS);
  const label = (x) => `${majorName(x)} / ${minorName(x)}`;
  const options = shuffle([k, ...distractKeys(k, 3)]).map((x) => ({ label: label(x), ok: x === k }));
  return { kind: 'sigToKey', k, options, answer: label(k) };
}

export function genParallel() {
  const k = pick(MAJORS);
  const fromMinor = Math.random() < 0.5;
  const label = (x) => (fromMinor ? majorName(x) : minorName(x));
  const options = shuffle([k, ...distractKeys(k, 3)]).map((x) => ({ label: label(x), ok: x === k }));
  const prompt = fromMinor ? minorName(k) : majorName(k);
  return { kind: 'parallel', k, fromMinor, options, prompt, answer: label(k) };
}

export function genScale() {
  const k = pick(MAJORS.filter((x) => x.c > 0));
  return { kind: 'scale', k };
}

/* ===== マイナースケール3種 ===== */

export const MINOR_TYPES = {
  natural: { name: 'ナチュラルマイナー', semis: [0, 2, 3, 5, 7, 8, 10, 12] },
  harmonic: { name: 'ハーモニックマイナー', semis: [0, 2, 3, 5, 7, 8, 11, 12] },
  melodic: { name: 'メロディックマイナー', semis: [0, 2, 3, 5, 7, 9, 11, 12] },
};

// マイナーの主音 root から、型 type のスケール(上行8音)を綴る
export function minorScale(root, type = 'natural', octave = 4) {
  const s0 = root.l + 7 * octave;
  return MINOR_TYPES[type].semis.map((semi, i) => {
    const s = s0 + i;
    const l = ((s % 7) + 7) % 7;
    return { l, o: Math.floor(s / 7), a: norm(NAT[root.l] + root.a + semi - NAT[l]) };
  });
}

// 調号 k のもとで、その音に書く臨時記号('' / '#' / 'b' / 'n')
export function writtenMark(k, n) {
  const inSig = sigLetters(k).includes(n.l);
  const ks = inSig ? (k.t === '#' ? 1 : -1) : 0;
  if (n.a === ks) return '';
  if (n.a === 0) return 'n';
  return n.a > 0 ? '#' : 'b';
}
export const markText = (m) => (m === '#' ? '#' : m === 'b' ? '♭' : m === 'n' ? '♮' : '');

// 問題:調号と臨時記号を書き入れてハーモニック/メロディックにする
export function genMinorForm() {
  const k = pick(MAJORS.filter((x) => !(x.t === '#' && x.c >= 5)));
  const type = Math.random() < 0.5 ? 'harmonic' : 'melodic';
  return { kind: 'minorForm', k, type };
}

export function minorFormAnswer(q) {
  const root = relMinor(q.k);
  const up = minorScale(root, q.type);
  const upMarks = up.map((n) => writtenMark(q.k, n));
  let downMarks = null;
  if (q.type === 'melodic') {
    const down = minorScale(root, 'natural').slice().reverse();
    downMarks = down.map((n) => writtenMark(q.k, n));
  }
  return { root, up, upMarks, downMarks };
}

const markList = (notes, marks) =>
  notes.map((n, i) => (marks[i] ? SOLFA[n.l] + markText(marks[i]) : null)).filter(Boolean);

export function minorFormCorrectText(q) {
  const { up, upMarks, downMarks } = minorFormAnswer(q);
  const ups = markList(up, upMarks);
  let t = `調号:${sigText(q.k)} / 臨時記号:${q.type === 'melodic' ? '上行 ' : ''}${ups.join('・') || 'なし'}`;
  if (q.type === 'melodic') t += '、下行 なし';
  return t;
}

export function explainMinorForm(q) {
  const { root } = minorFormAnswer(q);
  const nat = minorScale(root, 'natural');
  const steps = [];
  steps.push(`**${en(root)}マイナー**の調号は、平行調(短3度上)の**${majorName(q.k)}**と同じ → **${sigText(q.k)}**`);
  const n7 = nat[6];
  const r7 = { ...n7, a: n7.a + 1 };
  steps.push(`ハーモニックは**7音目を半音上げる**(導音を強める)→ ${jp(n7)}を**${jp(r7)}**に。調号はそのまま、臨時記号「${markText(writtenMark(q.k, r7))}」で上げる`);
  if (q.type === 'melodic') {
    const n6 = nat[5];
    const r6 = { ...n6, a: n6.a + 1 };
    steps.push(`メロディックは**6音目も半音上げる** → ${jp(n6)}を**${jp(r6)}**に(臨時記号「${markText(writtenMark(q.k, r6))}」)。5音目から上はメジャースケールと同じ並び`);
    steps.push(`**下行はナチュラルマイナー**に戻る → 下行は**臨時記号なし**`);
  }
  return steps;
}
