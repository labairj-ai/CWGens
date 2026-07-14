let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(type, freq, endFreq, dur, gain, startDelay = 0) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.connect(g);
  g.connect(ac.destination);
  osc.type = type;
  const t = ac.currentTime + startDelay;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur * 0.9);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.01);
}

function noise(dur, gain, startDelay = 0) {
  const ac = getCtx();
  const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  const filt = ac.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = 800;
  filt.Q.value = 0.5;
  src.connect(filt);
  filt.connect(g);
  g.connect(ac.destination);
  const t = ac.currentTime + startDelay;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.start(t);
  src.stop(t + dur + 0.01);
}

export function playMusket() {
  noise(0.12, 0.18);
  tone('square', 300, 80, 0.08, 0.06);
}

export function playCannon() {
  noise(0.4, 0.25);
  tone('sine', 80, 30, 0.5, 0.15);
  tone('sine', 40, 20, 0.6, 0.12, 0.05);
}

export function playBugle() {
  const notes = [392, 523, 659, 784];
  notes.forEach((f, i) => tone('triangle', f, f * 1.01, 0.14, 0.12, i * 0.11));
}

export function playDrum() {
  tone('sine', 120, 40, 0.12, 0.2);
  noise(0.1, 0.08, 0.01);
}

export function playRetreat() {
  const notes = [523, 440, 349, 262];
  notes.forEach((f, i) => tone('triangle', f, f * 0.99, 0.18, 0.1, i * 0.14));
}

export function playVictory() {
  const notes = [392, 523, 659, 784, 1047];
  notes.forEach((f, i) => tone('square', f, f * 1.01, 0.2, 0.1, i * 0.15));
  tone('sine', 196, 196, 0.8, 0.08, 0.1);
}

export function playDefeat() {
  const notes = [392, 349, 294, 220];
  notes.forEach((f, i) => tone('sine', f, f * 0.95, 0.4, 0.08, i * 0.35));
}

export function playNight() {
  tone('sine', 220, 180, 0.5, 0.06);
  tone('sine', 330, 280, 0.5, 0.04, 0.15);
}
