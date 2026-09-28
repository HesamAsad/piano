/* Audio: recorded piano samples (Salamander Grand Piano V3, bundled locally) with a small
   synthesized piano-like voice as fallback, metronome clicks, and a lookahead transport.
   No network requests: samples load from audio/piano/*.mp3, or from an embedded copy when
   the page is opened from disk (file://), where browsers block fetch(). */
(function (MC) {
  'use strict';
  const A = (MC.audio = {});
  const T = MC.theory;
  let ctx = null;
  let input = null; // voices connect here
  let clickBus = null;
  let volumeNode = null;
  let noiseBuf = null;
  let wet = null;
  const waves = {};
  /* Sample set: one recording every 3 semitones from C2 to C7; other notes are pitch-shifted. */
  const SAMPLE_IDS = ['C2', 'Ds2', 'Fs2', 'A2', 'C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4', 'A4', 'C5', 'Ds5', 'Fs5', 'A5', 'C6', 'Ds6', 'Fs6', 'A6', 'C7'];
  const samples = new Map(); // midi -> { buf, offset }
  let sampleState = 'none'; // none | loading | ready | failed
  const voices = new Map(); // id -> voice
  let nextId = 1;
  const listeners = new Set();
  const MAX_VOICES = 40;
  const state = { volume: 0.8, muted: false, clickVolume: 0.7, velocity: 0.7 };

  A.supported = !!(window.AudioContext || window.webkitAudioContext);
  A.on = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  const emit = () => listeners.forEach((fn) => { try { fn(A.status()); } catch (e) { /* ignore */ } });

  A.status = () => {
    if (!A.supported) return 'unsupported';
    if (!ctx) return 'off';
    if (ctx.state !== 'running') return 'blocked';
    if (state.muted) return 'muted';
    return 'on';
  };
  A.isRunning = () => !!ctx && ctx.state === 'running';
  A.canHear = () => A.isRunning() && !state.muted && state.volume > 0.01;
  A.getState = () => Object.assign({}, state);

  function buildGraph() {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    comp.attack.value = 0.004;
    comp.release.value = 0.25;
    volumeNode = ctx.createGain();
    volumeNode.gain.value = state.muted ? 0 : state.volume;
    input = ctx.createGain();
    input.gain.value = 0.9;
    // synthetic room reverb
    const conv = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 1.6);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / ctx.sampleRate;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2) * Math.exp(-t * 2.2);
      }
    }
    conv.buffer = ir;
    wet = ctx.createGain();
    wet.gain.value = 0.16;
    input.connect(comp);
    input.connect(conv);
    conv.connect(wet);
    wet.connect(comp);
    comp.connect(volumeNode);
    volumeNode.connect(ctx.destination);
    clickBus = ctx.createGain();
    clickBus.gain.value = state.clickVolume;
    clickBus.connect(volumeNode);
    // shared noise buffer for hammer transients
    noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    // partial spectra for three registers (amplitudes of harmonics 1..n)
    const spectra = {
      low: [0.55, 1, 0.75, 0.55, 0.42, 0.3, 0.22, 0.16, 0.12, 0.09, 0.07, 0.05, 0.04, 0.03],
      mid: [1, 0.62, 0.38, 0.24, 0.17, 0.11, 0.08, 0.05, 0.035, 0.025, 0.018],
      high: [1, 0.3, 0.12, 0.05, 0.02],
    };
    for (const k of Object.keys(spectra)) {
      const amps = spectra[k];
      const real = new Float32Array(amps.length + 1);
      const imag = new Float32Array(amps.length + 1);
      amps.forEach((a, i) => { imag[i + 1] = a; });
      waves[k] = ctx.createPeriodicWave(real, imag);
    }
  }

  /* Must be called from a user gesture (click/tap/keydown). Resolves true when running. */
  A.enable = function () {
    if (!A.supported) return Promise.resolve(false);
    try {
      if (!ctx) {
        const C = window.AudioContext || window.webkitAudioContext;
        ctx = new C({ latencyHint: 'interactive' });
        buildGraph();
        ctx.onstatechange = emit;
        loadSamples();
      }
      const p = ctx.state === 'running' ? Promise.resolve() : ctx.resume();
      return Promise.resolve(p).then(() => { emit(); return ctx.state === 'running'; }).catch(() => { emit(); return false; });
    } catch (e) {
      emit();
      return Promise.resolve(false);
    }
  };
  /* Called on any user gesture that wants sound; creates/resumes silently. */
  A.ensure = function () {
    if (!A.supported) return;
    if (!ctx || ctx.state !== 'running') A.enable();
  };

  A.setVolume = (v) => {
    state.volume = Math.max(0, Math.min(1, v));
    if (volumeNode && !state.muted) volumeNode.gain.setTargetAtTime(state.volume, ctx.currentTime, 0.02);
    emit();
  };
  A.setMuted = (m) => {
    state.muted = !!m;
    if (volumeNode) volumeNode.gain.setTargetAtTime(state.muted ? 0 : state.volume, ctx.currentTime, 0.02);
    emit();
  };
  A.setClickVolume = (v) => { state.clickVolume = v; if (clickBus) clickBus.gain.value = v; };
  A.setVelocity = (v) => { state.velocity = Math.max(0.1, Math.min(1, v)); };
  A.getVelocity = () => state.velocity;

  A.now = () => (ctx && ctx.state === 'running' ? ctx.currentTime : performance.now() / 1000);
  /* Convert a performance.now() timestamp (ms) to AudioContext time (s). */
  A.perfToCtx = (perfMs) => {
    if (!ctx || ctx.state !== 'running') return perfMs / 1000;
    if (ctx.getOutputTimestamp) {
      const ts = ctx.getOutputTimestamp();
      if (ts && ts.performanceTime) return ts.contextTime + (perfMs - ts.performanceTime) / 1000;
    }
    return ctx.currentTime + (perfMs - performance.now()) / 1000;
  };
  /* Seconds between scheduling a sound and it reaching the speakers (browser estimate). */
  A.outputLatency = () => (ctx ? (ctx.outputLatency || 0) + (ctx.baseLatency || 0) : 0);

  function waveFor(midi) { return midi < 48 ? waves.low : midi < 76 ? waves.mid : waves.high; }

  /* ---------- Sample loading ---------- */
  const idMidi = (id) => T.midi(id.replace('s', '#'));
  function decode(arrayBuf) {
    return new Promise((res, rej) => {
      try {
        const p = ctx.decodeAudioData(arrayBuf, res, rej);
        if (p && p.then) p.then(res, rej);
      } catch (e) { rej(e); }
    });
  }
  function leadingSilence(buf) {
    // MP3 encoders add a few ms of padding; skip it so notes start exactly on time.
    const d = buf.getChannelData(0);
    const lim = Math.min(d.length, Math.floor(buf.sampleRate * 0.15));
    for (let i = 0; i < lim; i++) if (Math.abs(d[i]) > 0.003) return Math.max(0, i / buf.sampleRate - 0.002);
    return 0;
  }
  function b64ToBuf(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out.buffer;
  }
  function embedded() {
    if (window.MC_PIANO_SAMPLES) return Promise.resolve(window.MC_PIANO_SAMPLES);
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = (window.MC_BASE || '') + 'js/audio/piano-samples.js';
      s.onload = () => (window.MC_PIANO_SAMPLES ? res(window.MC_PIANO_SAMPLES) : rej(new Error('empty')));
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function loadSamples() {
    if (sampleState !== 'none' || !ctx) return;
    sampleState = 'loading';
    emit();
    const store = (id, buf) => samples.set(idMidi(id), { buf, offset: leadingSilence(buf) });
    const viaFetch = () => {
      if (!/^https?:$/.test(location.protocol) || !window.fetch) return Promise.reject(new Error('no fetch'));
      return Promise.all(SAMPLE_IDS.map((id) => fetch(`${window.MC_BASE || ''}audio/piano/${id}.mp3`).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(decode).then((b) => store(id, b))));
    };
    const viaEmbedded = () => embedded().then((map) => Promise.all(SAMPLE_IDS.map((id) => decode(b64ToBuf(map[id])).then((b) => store(id, b)))));
    viaFetch().catch(() => { samples.clear(); return viaEmbedded(); })
      .then(() => { sampleState = 'ready'; if (wet) wet.gain.value = 0.07; emit(); })
      .catch(() => { samples.clear(); sampleState = 'failed'; emit(); });
  }
  /* 'samples' once the recordings are decoded, 'loading' meanwhile, otherwise 'synth'. */
  A.source = () => (sampleState === 'ready' ? 'samples' : sampleState === 'loading' ? 'loading' : 'synth');

  function nearestSample(midi) {
    let best = null;
    for (const m of samples.keys()) if (best == null || Math.abs(m - midi) < Math.abs(best - midi)) best = m;
    return best;
  }
  function sampleVoice(midi, v, t) {
    const sm = nearestSample(midi);
    const { buf, offset } = samples.get(sm);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = Math.pow(2, (midi - sm) / 12);
    // One recorded velocity layer: shape loudness with gain, and brightness with a gentle filter.
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 900 + 17000 * v * v;
    filt.Q.value = 0.3;
    const env = ctx.createGain();
    env.gain.value = 0.95 * Math.pow(v, 1.3);
    const rel = ctx.createGain();
    rel.gain.value = 1;
    src.connect(filt);
    filt.connect(env);
    env.connect(rel);
    rel.connect(input);
    src.start(t, offset);
    const id = nextId++;
    src.onended = () => { voices.delete(id); try { rel.disconnect(); } catch (e) { /* ignore */ } };
    return { id, midi, start: t, rel, oscs: [src], dead: false };
  }

  function killVoice(v, when, tc) {
    if (v.dead) return;
    v.dead = true;
    const t = Math.max(when, ctx.currentTime);
    try {
      v.rel.gain.cancelScheduledValues(t);
      v.rel.gain.setTargetAtTime(0, t, tc);
      const stopAt = t + tc * 8 + 0.05;
      v.oscs.forEach((o) => o.stop(stopAt));
    } catch (e) { /* already stopped */ }
    voices.delete(v.id);
  }

  /* Start a note. Returns a voice id for noteOff. */
  A.noteOn = function (midi, vel, when) {
    if (!ctx || ctx.state !== 'running') return 0;
    const t = Math.max(when || 0, ctx.currentTime);
    const v = Math.max(0.08, Math.min(1, vel == null ? state.velocity : vel));
    // re-strike: quickly damp an earlier voice of the same key
    for (const old of voices.values()) {
      if (old.midi === midi && old.start <= t + 0.001) killVoice(old, t, 0.012);
    }
    if (voices.size >= MAX_VOICES) {
      const oldest = voices.values().next().value;
      if (oldest) killVoice(oldest, t, 0.01);
    }
    if (sampleState === 'ready' && samples.size) {
      const sv = sampleVoice(midi, v, t);
      voices.set(sv.id, sv);
      return sv.id;
    }
    return synthVoice(midi, v, t);
  };

  /* Fallback voice: additive partials + filtered hammer noise (used until samples load, or if they fail). */
  function synthVoice(midi, v, t) {
    const f = T.freq(midi);
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const w = waveFor(midi);
    o1.setPeriodicWave(w);
    o2.setPeriodicWave(w);
    o1.frequency.value = f;
    o2.frequency.value = f;
    o1.detune.value = -1.4;
    o2.detune.value = 1.6;
    const mix2 = ctx.createGain();
    mix2.gain.value = 0.55;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.Q.value = 0.4;
    const env = ctx.createGain();
    const rel = ctx.createGain();
    rel.gain.value = 1;
    o1.connect(filt);
    o2.connect(mix2);
    mix2.connect(filt);
    filt.connect(env);
    env.connect(rel);
    rel.connect(input);
    const regionGain = midi < 45 ? 1.2 : midi > 84 ? 0.7 : midi > 76 ? 0.85 : 1;
    const peak = 0.2 * Math.pow(v, 1.35) * regionGain;
    const decay = Math.max(0.5, Math.min(5.5, 3.2 * Math.pow(2, -(midi - 60) / 18)));
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peak, t + 0.004);
    env.gain.setTargetAtTime(peak * 0.42, t + 0.006, 0.09 + 0.1 * (1 - v));
    env.gain.setTargetAtTime(0.00001, t + 0.35, decay);
    const bright = Math.min(15000, f * (2.5 + 9 * v) + 500);
    filt.frequency.setValueAtTime(bright, t);
    filt.frequency.setTargetAtTime(Math.min(9000, f * 2 + 350), t + 0.01, 0.35 + 0.5 * v);
    // hammer / key noise
    const nz = ctx.createBufferSource();
    nz.buffer = noiseBuf;
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = Math.min(7000, f * 3 + 900);
    nf.Q.value = 0.9;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, t);
    ng.gain.linearRampToValueAtTime(0.045 * v * regionGain, t + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    nz.connect(nf);
    nf.connect(ng);
    ng.connect(rel);
    const id = nextId++;
    const voice = { id, midi, start: t, rel, oscs: [o1, o2], dead: false };
    const maxEnd = t + decay * 6 + 0.5;
    o1.start(t); o2.start(t); nz.start(t);
    nz.stop(t + 0.07);
    o1.stop(maxEnd); o2.stop(maxEnd);
    o1.onended = () => {
      voices.delete(id);
      try { rel.disconnect(); } catch (e) { /* ignore */ }
    };
    voices.set(id, voice);
    return id;
  }

  /* Release (damper). */
  A.noteOff = function (id, when) {
    if (!ctx || !id) return;
    const v = voices.get(id);
    if (v) killVoice(v, when || ctx.currentTime, 0.075);
  };
  A.play = function (midi, durSec, vel, when) {
    const id = A.noteOn(midi, vel, when);
    if (id) A.noteOff(id, Math.max(when || 0, ctx.currentTime) + Math.max(0.05, durSec));
    return id;
  };
  A.playChord = function (midis, durSec, vel, when, spread) {
    return midis.map((m, i) => A.play(m, durSec, vel, (when || A.now()) + (spread || 0) * i));
  };
  A.stopAll = function () {
    if (!ctx) return;
    for (const v of Array.from(voices.values())) killVoice(v, ctx.currentTime, 0.03);
  };

  /* Metronome click. accent: 2 = downbeat, 1 = beat, 0 = subdivision. */
  A.click = function (when, accent) {
    if (!ctx || ctx.state !== 'running') return;
    const t = Math.max(when || 0, ctx.currentTime);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = accent === 2 ? 1760 : accent === 1 ? 1180 : 900;
    const peak = accent === 2 ? 0.5 : accent === 1 ? 0.32 : 0.14;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g);
    g.connect(clickBus);
    o.start(t);
    o.stop(t + 0.06);
  };
  /* A soft percussive "clap" used for rhythm-only playback. */
  A.tap = function (when, vel) {
    if (!ctx || ctx.state !== 'running') return;
    const t = Math.max(when || 0, ctx.currentTime);
    const nz = ctx.createBufferSource();
    nz.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1500;
    f.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.7 * (vel || 0.8), t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    nz.connect(f); f.connect(g); g.connect(clickBus);
    nz.start(t); nz.stop(t + 0.08);
  };

  /* ---------- Transport: lookahead scheduler with visual callbacks ----------
     events: [{ t (beats), d (beats), midis [], vel, stacc, rhythmOnly, data }]
     Uses audio time when sound is running; otherwise a silent performance clock so visuals still work. */
  class Transport {
    constructor(opts) {
      this.o = Object.assign({ bpm: 80, events: [], beatsPerBar: 4, metronome: false, countIn: 0, subdivide: false, clickOnly: false, loop: false, end: null }, opts);
      this.events = this.o.events.slice().sort((a, b) => a.t - b.t);
      this.end = this.o.end != null ? this.o.end : this.events.reduce((m, e) => Math.max(m, e.t + e.d), 0);
      this.playing = false;
      this.pos = -this.o.countIn; // current beat
      this.timer = null;
      this.raf = null;
      this.voiceIds = [];
      A.lastTransport = this; // lets automated tests align simulated playing with the beat
    }
    get bpm() { return this.o.bpm; }
    setBpm(b) {
      if (this.playing) { const cur = this.beatNow(); this.anchor = { time: this.clock(), beat: cur }; }
      this.o.bpm = b;
      if (this.playing) this._resetSchedule(this.beatNow());
    }
    clock() { return this.silent ? performance.now() / 1000 : ctx.currentTime; }
    beatNow() { return this.anchor.beat + ((this.clock() - this.anchor.time) * this.o.bpm) / 60; }
    beatToTime(b) { return this.anchor.time + ((b - this.anchor.beat) * 60) / this.o.bpm; }
    _resetSchedule(fromBeat) {
      this.nextIdx = this.events.findIndex((e) => e.t >= fromBeat - 1e-6);
      if (this.nextIdx < 0) this.nextIdx = this.events.length;
      this.visIdx = this.nextIdx;
      this.nextClick = Math.ceil(fromBeat * (this.o.subdivide ? 2 : 1) - 1e-6) / (this.o.subdivide ? 2 : 1);
    }
    play(fromBeat) {
      if (this.playing) return;
      this.silent = !A.isRunning();
      const start = fromBeat != null ? fromBeat : this.pos;
      this.anchor = { time: this.clock() + 0.08, beat: start };
      this._resetSchedule(start);
      this.playing = true;
      const tick = () => this._schedule();
      tick();
      this.timer = setInterval(tick, 25);
      const frame = () => {
        if (!this.playing) return;
        this._visual();
        this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
      if (this.o.onState) this.o.onState('playing');
    }
    _schedule() {
      const horizon = this.clock() + 0.15;
      const vel = this.o.velocityScale || 1;
      if (!this.silent) {
        while (this.nextIdx < this.events.length) {
          const e = this.events[this.nextIdx];
          const t = this.beatToTime(e.t);
          if (t > horizon) break;
          if (!e.silent) {
            const durSec = ((e.stacc ? Math.min(e.d, 0.5) * 0.5 : e.d * 0.94) * 60) / this.o.bpm;
            if (e.rhythmOnly) A.tap(t, e.vel);
            else (e.midis || []).forEach((m, i) => this.voiceIds.push(A.play(m, durSec, (e.vel || 0.65) * vel, t + (e.spread || 0) * i)));
          }
          this.nextIdx++;
        }
        if (this.voiceIds.length > 200) this.voiceIds.splice(0, 100);
      }
      const step = this.o.subdivide ? 0.5 : 1;
      const clickEnd = this.end - 1e-6;
      while (true) {
        const b = this.nextClick;
        const t = this.beatToTime(b);
        if (t > horizon) break;
        const inCountIn = b < 0;
        if ((this.o.metronome || inCountIn) && (b < clickEnd || inCountIn) && !this.silent) {
          const bar = this.o.beatsPerBar;
          const isBeat = Math.abs(b - Math.round(b)) < 1e-6;
          const accent = !isBeat ? 0 : T.mod(Math.round(b), bar) === 0 ? 2 : 1;
          if (!(this.o.muteClicksAfter != null && b >= this.o.muteClicksAfter && !inCountIn)) A.click(t, accent);
        }
        this.nextClick = b + step;
      }
    }
    _visual() {
      const b = this.beatNow();
      this.pos = b;
      while (this.visIdx < this.events.length && this.events[this.visIdx].t <= b + 1e-6) {
        if (this.o.onEvent) this.o.onEvent(this.events[this.visIdx], this.visIdx);
        this.visIdx++;
      }
      if (this.o.onTick) this.o.onTick(b);
      if (b >= this.end + (this.o.tail != null ? this.o.tail : 0.25)) {
        if (this.o.loop) { this.stop(true); this.play(-this.o.countIn); return; }
        this.stop();
        if (this.o.onEnd) this.o.onEnd();
      }
    }
    pause() {
      if (!this.playing) return;
      this.pos = this.beatNow();
      this._halt();
      if (this.o.onState) this.o.onState('paused');
    }
    stop(silentReset) {
      this._halt();
      this.pos = -this.o.countIn;
      if (!silentReset && this.o.onState) this.o.onState('stopped');
    }
    _halt() {
      this.playing = false;
      clearInterval(this.timer);
      cancelAnimationFrame(this.raf);
      this.voiceIds.forEach((id) => A.noteOff(id));
      this.voiceIds = [];
    }
  }
  A.Transport = Transport;

  window.addEventListener('pagehide', () => A.stopAll());
})(window.MC = window.MC || {});
