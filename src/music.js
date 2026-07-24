// Civil War string music — inspired by Ashokan Farewell / Ken Burns documentary sound

let _ctx = null;
let _master = null;
let _send = null;
let _reverb = null;
let _loopTimer = null;
let _running = false;

const BPM = 70;
const Q = 60 / BPM; // seconds per quarter note

const N = {
  // Bass register
  D3: 146.83, E3: 164.81, Fs3: 185.00, G3: 196.00, A3: 220.00, B3: 246.94,
  // Mid register
  Cs4: 277.18,
  D4: 293.66, E4: 329.63, Fs4: 369.99, G4: 392.00, A4: 440.00, B4: 493.88,
  // Upper register
  Cs5: 554.37, D5: 587.33, E5: 659.25,
  // Rest (silence)
  R: 0,
};

// Ashokan Farewell — D major, 3/4 time, ~14 bars + pickup
// Each entry: [frequency_hz, duration_in_quarter_beats]
const MELODY = [
  [N.A4, 1],                                    // pickup
  [N.D5, 1.5], [N.E5, 0.5], [N.D5, 1],        // bar 1
  [N.A4, 2],   [N.A4, 1],                       // bar 2
  [N.D5, 1],   [N.E5, 1],   [N.D5, 1],         // bar 3
  [N.B4, 2],   [N.A4, 1],                       // bar 4
  [N.G4, 1],   [N.Fs4, 1],  [N.E4, 1],         // bar 5
  [N.D4, 3],                                     // bar 6
  [N.A4, 1],   [N.A4, 1],   [N.A4, 1],         // bar 7
  [N.A4, 1.5], [N.B4, 0.5], [N.A4, 1],         // bar 8
  [N.G4, 2],   [N.Fs4, 1],                      // bar 9
  [N.E4, 3],                                     // bar 10
  [N.D5, 1.5], [N.E5, 0.5], [N.D5, 1],         // bar 11
  [N.B4, 2],   [N.A4, 1],                       // bar 12
  [N.G4, 1],   [N.A4, 1],   [N.Fs4, 1],        // bar 13
  [N.D4, 3],                                     // bar 14
  [N.R, 2],                                      // silent pause before loop
];

const TOTAL_BEATS = MELODY.reduce((s, [, b]) => s + b, 0); // 45 beats ≈ 38.6s

// Bass pizzicato root notes, one per measure (15 measures including pickup)
const BASS = [
  N.D3, N.D3, N.D3, N.G3, N.B3, N.A3, N.D3,
  N.A3, N.A3, N.G3, N.A3,
  N.D3, N.G3, N.A3, N.D3,
];

function makeReverb(ctx) {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * 2.6);
  const buf = ctx.createBuffer(2, len, sr);
  for (let c = 0; c < 2; c++) {
    const ch = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.9);
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

function bow(freq, t0, beats, vol) {
  if (!freq) return;
  const dur = beats * Q;
  const ctx = _ctx;

  // Sawtooth oscillator — rich harmonics like a bowed string
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, t0);

  // Vibrato LFO with delayed onset (real violinists delay vibrato slightly)
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 5.3;
  const lfoG = ctx.createGain();
  lfoG.gain.setValueAtTime(0, t0);
  lfoG.gain.linearRampToValueAtTime(freq * 0.011, t0 + Math.min(0.3, dur * 0.4));
  lfo.connect(lfoG);
  lfoG.connect(osc.frequency);

  // Lowpass filter — removes harsh high harmonics, adds warmth
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = 1500 + Math.random() * 900;
  filt.Q.value = 0.6;

  // Bowed envelope: gradual attack, sustain, soft release
  const att = Math.min(0.09, dur * 0.12);
  const rel = Math.min(0.14, dur * 0.2);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(vol, t0 + att);
  env.gain.setValueAtTime(vol, t0 + dur - rel);
  env.gain.linearRampToValueAtTime(0, t0 + dur);

  osc.connect(filt);
  filt.connect(env);
  env.connect(_send);
  osc.start(t0);
  lfo.start(t0);
  osc.stop(t0 + dur + 0.05);
  lfo.stop(t0 + dur + 0.05);

  // Brief high-frequency transient at bow onset (bow-on-string chiff)
  const chiff = ctx.createOscillator();
  chiff.type = 'sine';
  chiff.frequency.value = freq * 2.97;
  const chiffG = ctx.createGain();
  chiffG.gain.setValueAtTime(0.025, t0);
  chiffG.gain.exponentialRampToValueAtTime(0.001, t0 + 0.05);
  chiff.connect(chiffG);
  chiffG.connect(_send);
  chiff.start(t0);
  chiff.stop(t0 + 0.06);
}

function pluck(freq, t0) {
  if (!freq) return;
  const ctx = _ctx;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.12, t0);
  env.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
  osc.connect(env);
  env.connect(_send);
  osc.start(t0);
  osc.stop(t0 + 0.6);
}

function scheduleOnce(t0) {
  if (!_running) return;

  // Primary melody voice
  let t = t0;
  for (const [f, b] of MELODY) {
    bow(f, t, b, 0.21);
    t += b * Q;
  }

  // Second voice: ~0.5% sharp — creates the natural shimmer of two bows
  t = t0;
  for (const [f, b] of MELODY) {
    if (f) bow(f * 1.005, t, b, 0.08);
    t += b * Q;
  }

  // Bass pluck on each measure downbeat
  let bt = t0;
  for (const root of BASS) {
    pluck(root, bt);
    bt += 3 * Q;
  }

  const loopDur = TOTAL_BEATS * Q;
  _loopTimer = setTimeout(
    () => { if (_running) scheduleOnce(t0 + loopDur); },
    (loopDur - 0.5) * 1000
  );
}

export function startMusic() {
  if (_running) return;
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  _running = true;

  _reverb = makeReverb(_ctx);
  _send = _ctx.createGain();
  _send.gain.value = 1;

  const wet = _ctx.createGain();
  wet.gain.value = 0.38;

  _master = _ctx.createGain();
  _master.gain.setValueAtTime(0, _ctx.currentTime);
  _master.gain.linearRampToValueAtTime(0.5, _ctx.currentTime + 3.5);

  _send.connect(_master);        // dry path
  _send.connect(_reverb);        // reverb send
  _reverb.connect(wet);
  wet.connect(_master);          // wet path
  _master.connect(_ctx.destination);

  scheduleOnce(_ctx.currentTime + 0.3);
}

export function stopMusic() {
  if (!_running) return;
  _running = false;
  clearTimeout(_loopTimer);
  // Capture refs now so a fast restartMusic() can't clobber them before the timeout fires.
  const send = _send, reverb = _reverb, master = _master;
  _master = _send = _reverb = null;
  if (master && _ctx) {
    const t = _ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0, t + 2.5);
    setTimeout(() => {
      try { send.disconnect(); reverb.disconnect(); master.disconnect(); } catch (_) {}
    }, 3000);
  }
}
