/* Input hub: routes note input from the on-screen keyboard, the computer keyboard and MIDI
   devices to subscribers, and plays the sound. Also exposes a "tap" channel for rhythm tasks. */
(function (MC) {
  'use strict';
  const I = (MC.input = {});
  const A = MC.audio;
  const subs = new Set();
  const tapSubs = new Set();
  const held = new Map(); // midi -> { voice, sources:Set }
  I.held = held;
  I.silent = false; // when true, input does not produce sound (e.g. listening tests)

  /* Computer keyboard layout (like most music software): one and a half octaves. */
  const WHITE = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"];
  const WHITE_OFF = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17];
  const BLACK = { w: 1, e: 3, t: 6, y: 8, u: 10, o: 13, p: 15 };
  const MAP = {};
  WHITE.forEach((k, i) => { MAP[k] = WHITE_OFF[i]; });
  Object.assign(MAP, BLACK);
  I.KEYMAP = MAP;
  let base = 60; // C4
  I.base = () => base;
  const baseSubs = new Set();
  I.onBase = (fn) => { baseSubs.add(fn); return () => baseSubs.delete(fn); };
  I.setBase = (m) => { base = Math.max(24, Math.min(96, m)); baseSubs.forEach((fn) => fn(base)); };
  I.keyFor = (midi) => {
    const off = midi - base;
    for (const [k, v] of Object.entries(MAP)) if (v === off) return k;
    return null;
  };

  I.subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
  I.onTap = (fn) => { tapSubs.add(fn); return () => tapSubs.delete(fn); };
  I.tap = (perfMs, source) => tapSubs.forEach((fn) => fn({ time: perfMs || performance.now(), source }));
  I.hasTapListeners = () => tapSubs.size > 0;

  I.noteOn = function (midi, source, vel) {
    A.ensure();
    const perf = performance.now();
    let h = held.get(midi);
    if (h && h.sources.has(source)) return;
    if (!h) { h = { voice: 0, sources: new Set() }; held.set(midi, h); }
    h.sources.add(source);
    if (!I.silent) { if (h.voice) A.noteOff(h.voice); h.voice = A.noteOn(midi, vel); }
    subs.forEach((fn) => fn({ type: 'on', midi, source, time: perf, vel }));
  };
  I.noteOff = function (midi, source) {
    const h = held.get(midi);
    if (!h || !h.sources.has(source)) return;
    h.sources.delete(source);
    if (h.sources.size) return;
    if (h.voice) A.noteOff(h.voice);
    held.delete(midi);
    subs.forEach((fn) => fn({ type: 'off', midi, source, time: performance.now() }));
  };
  I.releaseAll = function () {
    for (const [midi, h] of Array.from(held.entries())) {
      if (h.voice) A.noteOff(h.voice);
      held.delete(midi);
      subs.forEach((fn) => fn({ type: 'off', midi, source: 'all', time: performance.now() }));
    }
  };

  const isTyping = (e) => {
    const t = e.target;
    if (!t || !t.tagName) return false;
    const tag = t.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable;
  };
  const down = new Map(); // computer key -> midi
  I.keysEnabled = true;
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e)) return;
    if (document.querySelector('.modal-wrap')) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    // Space / Enter act as the rhythm tap when a tap task is listening.
    if ((k === ' ' || k === 'Enter') && I.hasTapListeners() && !(e.target && e.target.closest && e.target.closest('button:not(.tap-pad), a, summary'))) {
      e.preventDefault();
      if (!e.repeat) I.tap(performance.now(), 'key');
      return;
    }
    if (!I.keysEnabled) return;
    if (k === 'z' || k === 'x') {
      if (!e.repeat) { I.releaseAll(); I.setBase(base + (k === 'z' ? -12 : 12)); }
      e.preventDefault();
      return;
    }
    if (MAP[k] === undefined) return;
    e.preventDefault();
    if (e.repeat || down.has(k)) return;
    const midi = base + MAP[k];
    down.set(k, midi);
    I.noteOn(midi, 'key:' + k);
  });
  document.addEventListener('keyup', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (!down.has(k)) return;
    const midi = down.get(k);
    down.delete(k);
    I.noteOff(midi, 'key:' + k);
  });
  window.addEventListener('blur', () => { down.clear(); I.releaseAll(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { down.clear(); I.releaseAll(); A.stopAll(); } });

  /* ---------- Optional MIDI keyboard (Web MIDI; Chrome/Edge, needs permission) ---------- */
  I.midiStatus = 'none';
  I.midiSupported = !!navigator.requestMIDIAccess;
  I.connectMIDI = function () {
    if (!I.midiSupported) return Promise.resolve({ ok: false, msg: 'This browser does not support Web MIDI. Chrome or Edge on a computer usually does.' });
    return navigator.requestMIDIAccess().then((access) => {
      const attach = () => {
        let n = 0;
        access.inputs.forEach((inp) => {
          n++;
          inp.onmidimessage = (msg) => {
            const [st, d1, d2] = msg.data;
            const cmd = st & 0xf0;
            if (cmd === 0x90 && d2 > 0) I.noteOn(d1, 'midi', Math.max(0.15, d2 / 127));
            else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) I.noteOff(d1, 'midi');
          };
        });
        I.midiStatus = n ? 'connected' : 'no-devices';
        return n;
      };
      const n = attach();
      access.onstatechange = attach;
      return { ok: n > 0, msg: n ? `Connected ${n} MIDI input${n > 1 ? 's' : ''}. Key velocity controls loudness.` : 'MIDI is allowed, but no keyboard is connected. Plug one in and try again.' };
    }).catch(() => ({ ok: false, msg: 'MIDI access was blocked or is unavailable here.' }));
  };
})(window.MC = window.MC || {});
