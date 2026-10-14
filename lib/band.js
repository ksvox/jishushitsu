// 耳コピ用の演奏(ピアノ=録音、ベースとドラム=アプリ内で合成)
import { getCtx, piano, loadPiano } from './sound';
import { TYPES, pc } from './chords';

let noiseBuf = null;
function noise(c) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 1.5, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

function kick(c, out, t, vol = 0.9) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  o.connect(g);
  g.connect(out);
  o.start(t);
  o.stop(t + 0.32);
}

function noiseHit(c, out, t, { vol, dur, hp, bp }) {
  const s = c.createBufferSource();
  s.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = bp ? 'bandpass' : 'highpass';
  f.frequency.value = bp || hp;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f);
  f.connect(g);
  g.connect(out);
  s.start(t, Math.random() * 0.5);
  s.stop(t + dur + 0.02);
}

const snare = (c, out, t, vol = 0.5) => {
  noiseHit(c, out, t, { vol, dur: 0.18, bp: 1800 });
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.value = 190;
  g.gain.setValueAtTime(vol * 0.6, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  o.connect(g);
  g.connect(out);
  o.start(t);
  o.stop(t + 0.12);
};
const hat = (c, out, t, vol = 0.18) => noiseHit(c, out, t, { vol, dur: 0.05, hp: 7000 });
const crash = (c, out, t) => noiseHit(c, out, t, { vol: 0.22, dur: 1.4, hp: 5000 });
const stick = (c, out, t) => noiseHit(c, out, t, { vol: 0.5, dur: 0.04, bp: 3500 });

function bass(c, out, midi, t, dur, vol = 0.7) {
  const f = 440 * Math.pow(2, (midi - 69) / 12);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1400;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(vol * 0.6, t + 0.15);
  g.gain.setValueAtTime(vol * 0.6, t + Math.max(0.05, dur - 0.06));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  lp.connect(g);
  g.connect(out);
  [['sawtooth', 1], ['triangle', 1], ['sine', 0.5]].forEach(([type, mult]) => {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = f * mult;
    o.connect(lp);
    o.start(t);
    o.stop(t + dur + 0.02);
  });
}

// コードのボイシング:前のコードから近い形(転回形)でつなぐ
function voiceAll(song) {
  if (song._voicings) return song._voicings;
  let center = 62;
  song._voicings = song.chords.map((ch) => {
    const r = pc(ch.root);
    const notes = TYPES[ch.type].semis.map((s) => {
      const p = (r + s) % 12;
      let m = 48 + p;
      while (m < center - 6) m += 12;
      while (m > center + 6) m -= 12;
      while (m < 55) m += 12;
      return m;
    });
    notes.sort((a, b) => a - b);
    center = Math.round(notes.reduce((a, b) => a + b, 0) / notes.length);
    return notes;
  });
  return song._voicings;
}
export const voicing = (song, bar) => voiceAll(song)[bar];

// ベース(スマホのスピーカーでも聞こえる高さ:ミ2〜レ#3あたり)
const bassNote = (chord, plus = 0) => {
  let m = 40 + ((pc(chord.root) + plus - 4 + 24) % 12);
  return m;
};

function scheduleBar(c, out, song, bar, t, beat, opts) {
  const ch = song.chords[bar];
  const sec = song.sectionOf(bar);
  const lv = song.level;
  const isChorus = sec === 'Chorus';
  const firstOfSection = song.sections.some((s) => s.from === bar && s.name);
  const at = (b) => t + b * beat;

  // ドラム
  if (opts.drums) {
  if (isChorus && firstOfSection) crash(c, out, at(0));
  for (let b = 0; b < 4; b += lv === 'beginner' || sec === 'Verse' ? 1 : 0.5) hat(c, out, at(b), b % 1 ? 0.1 : 0.16);
  kick(c, out, at(0));
  kick(c, out, at(2));
  if (isChorus) kick(c, out, at(2.5), 0.6);
  snare(c, out, at(1), sec === 'Verse' ? 0.3 : 0.45);
  snare(c, out, at(3), sec === 'Verse' ? 0.3 : 0.45);
  }

  // ベース
  if (!opts.bass) {
    // 鳴らさない
  } else if (lv === 'beginner' || sec === 'Verse') {
    bass(c, out, bassNote(ch), at(0), beat * 1.9);
    bass(c, out, bassNote(ch), at(2), beat * 1.9);
  } else if (isChorus) {
    [0, 1, 1.5, 2, 3].forEach((b) => bass(c, out, bassNote(ch), at(b), beat * (b % 1 ? 0.45 : 0.9)));
  } else {
    [0, 1, 2, 3].forEach((b) => bass(c, out, bassNote(ch), at(b), beat * 0.9));
  }

  // コード(ピアノ)
  const v = voicing(song, bar);
  const hits = isChorus ? [0, 1.5, 2.5] : [0, 2];
  if (opts.chords) hits.forEach((b, i) => {
    const len = (hits[i + 1] ?? 4) - b;
    v.forEach((m) => piano(c, m, at(b), beat * len * 0.95, out, 0.32));
  });

  // メロディー
  if (opts.melody) {
    song.melody.filter((n) => n.bar === bar).forEach((n) => piano(c, n.midi, at(n.beat), beat * n.len * 0.95, out, 0.75));
  }
}

// 再生。戻り値の stop() で止める。onTick(小節番号) で再生位置を知らせる
export async function playSong(song, { from = 0, to = song.bars - 1, loop = false, mix = {}, countIn = true, onTick, onEnd }) {
  const opts = { melody: true, bass: true, chords: true, drums: true, ...mix };
  const c = getCtx();
  if (!c) return { stop() {} };
  const all = [...voiceAll(song).flat(), ...song.melody.map((n) => n.midi)];
  await loadPiano(all);
  const beat = 60 / song.tempo;
  const barDur = beat * 4;
  const out = c.createGain();
  out.gain.value = 0.9;
  out.connect(c.destination);
  let stopped = false;
  let timer = null;
  let raf = null;

  let start = c.currentTime + 0.12;
  if (countIn) {
    for (let i = 0; i < 4; i++) stick(c, out, start + i * beat);
    start += barDur;
  }
  let passStart = start;
  const n = to - from + 1;

  const schedulePass = (t0) => {
    for (let i = 0; i < n; i++) scheduleBar(c, out, song, from + i, t0 + i * barDur, beat, opts);
  };
  schedulePass(start);

  const tick = () => {
    if (stopped) return;
    const now = c.currentTime;
    if (now >= passStart) {
      const idx = Math.floor((now - passStart) / barDur);
      if (idx >= n) {
        if (loop) {
          passStart += n * barDur;
        } else {
          stopped = true;
          if (onTick) onTick(-1);
          if (onEnd) onEnd();
          return;
        }
      } else if (onTick) onTick(from + idx);
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  if (loop) {
    // 次の回を少し前もって予約し続ける
    let next = start + n * barDur;
    const plan = () => {
      if (stopped) return;
      if (next - c.currentTime < 1.5) {
        schedulePass(next);
        next += n * barDur;
      }
      timer = setTimeout(plan, 300);
    };
    plan();
  }

  return {
    stop() {
      stopped = true;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      out.gain.setTargetAtTime(0, c.currentTime, 0.02);
      setTimeout(() => out.disconnect(), 300);
      if (onTick) onTick(-1);
    },
  };
}
