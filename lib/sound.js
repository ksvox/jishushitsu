// ピアノの音(public/piano/ の録音)を鳴らす。読み込めない時だけ簡易音で代用
const LOW = 55;
const HIGH = 88;
let ctx = null;
const buffers = {};
const loading = {};

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function sampleFor(midi) {
  return Math.min(HIGH, Math.max(LOW, midi));
}

function load(c, n) {
  if (buffers[n]) return Promise.resolve(buffers[n]);
  if (!loading[n]) {
    loading[n] = fetch(`/piano/${n}.mp3`)
      .then((r) => r.arrayBuffer())
      .then((ab) => new Promise((res, rej) => c.decodeAudioData(ab, res, rej)))
      .then((buf) => {
        buffers[n] = buf;
        return buf;
      })
      .catch(() => null);
  }
  return loading[n];
}

function synth(c, midi, start, dur) {
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(0.25, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  g.connect(c.destination);
  const o = c.createOscillator();
  o.type = 'triangle';
  o.frequency.value = freq;
  o.connect(g);
  o.start(start);
  o.stop(start + dur + 0.05);
}

function piano(c, midi, start, dur) {
  const n = sampleFor(midi);
  const buf = buffers[n];
  if (!buf) {
    synth(c, midi, start, dur);
    return;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  if (n !== midi) src.playbackRate.value = Math.pow(2, (midi - n) / 12);
  const g = c.createGain();
  g.gain.setValueAtTime(0.9, start);
  g.gain.setValueAtTime(0.9, start + Math.max(0.05, dur - 0.25));
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur + 0.2);
  src.connect(g);
  g.connect(c.destination);
  src.start(start);
  src.stop(start + dur + 0.3);
}

// events: [{ midi, at(秒), dur(秒) }]
async function play(events) {
  const c = getCtx();
  if (!c) return;
  const need = [...new Set(events.map((e) => sampleFor(e.midi)))];
  await Promise.all(need.map((n) => load(c, n)));
  const t = c.currentTime + 0.06;
  events.forEach((e) => piano(c, e.midi, t + e.at, e.dur));
}

// 2音を「順番に → 同時に」鳴らす
export function playInterval(p1, p2) {
  return play([
    { midi: p1, at: 0, dur: 0.85 },
    { midi: p2, at: 0.75, dur: 0.85 },
    { midi: p1, at: 1.6, dur: 1.5 },
    { midi: p2, at: 1.6, dur: 1.5 },
  ]);
}

// 音を順番に鳴らす(スケールなど)
export function playSequence(pitches, gap = 0.4) {
  return play(pitches.map((m, i) => ({ midi: m, at: i * gap, dur: i === pitches.length - 1 ? 1.4 : gap + 0.15 })));
}
