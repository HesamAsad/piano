/* Rhythm tools: beat/rhythm timeline diagram, metronome widget, tap capture and forgiving
   timing assessment with latency compensation. */
(function (MC) {
  'use strict';
  const { h, s: S } = MC.util;
  const A = MC.audio;
  const T = MC.theory;

  /* Beginner-friendly tolerances (ms): "on time" and "close". */
  const TOL = { relaxed: 200, beginner: 150, standard: 100 };
  MC.timing = {
    tolerance() { return TOL[MC.store.setting('tolerance')] || TOL.beginner; },
    /* Seconds to subtract from a tap to line it up with the sound the user heard. */
    latency() {
      const cal = MC.store.setting('latencyMs');
      if (cal != null) return cal / 1000;
      return A.isRunning() ? A.outputLatency() : 0;
    },
    /* expected: beats; taps: beats (already latency-corrected). Returns per-onset results. */
    evaluate(expected, taps, bpm, opts) {
      const tol = (opts && opts.tolMs) || MC.timing.tolerance();
      const msPerBeat = 60000 / bpm;
      const iois = expected.slice(1).map((t, i) => t - expected[i]).filter((x) => x > 0);
      const minIoi = iois.length ? Math.min(...iois) : 1;
      const win = Math.max(0.25, Math.min(0.5, minIoi * 0.5));
      const used = new Set();
      const res = expected.map((t) => {
        let best = -1, bd = Infinity;
        taps.forEach((tp, i) => {
          if (used.has(i)) return;
          const d = Math.abs(tp - t);
          if (d <= win && d < bd) { bd = d; best = i; }
        });
        if (best < 0) return { t, status: 'missed' };
        used.add(best);
        const deltaMs = (taps[best] - t) * msPerBeat;
        const a = Math.abs(deltaMs);
        const status = a <= tol ? 'ok' : a <= tol * 1.8 ? 'close' : 'off';
        return { t, tap: taps[best], deltaMs, status };
      });
      const extras = taps.filter((_, i) => !used.has(i));
      const onTime = res.filter((r) => r.status === 'ok').length;
      const close = res.filter((r) => r.status === 'close').length;
      return { results: res, extras, onTime, close, total: expected.length, tol };
    },
    describe(ev) {
      const lines = [];
      const early = ev.results.filter((r) => r.deltaMs != null && r.status !== 'ok' && r.deltaMs < 0).length;
      const late = ev.results.filter((r) => r.deltaMs != null && r.status !== 'ok' && r.deltaMs > 0).length;
      const missed = ev.results.filter((r) => r.status === 'missed').length;
      lines.push(`${ev.onTime} of ${ev.total} on time (within ±${ev.tol} ms)${ev.close ? `, ${ev.close} close` : ''}.`);
      if (early) lines.push(`${early} early — you tapped before the sound was due.`);
      if (late) lines.push(`${late} late — you tapped after it was due.`);
      if (missed) lines.push(`${missed} missed — no tap near that moment.`);
      if (ev.extras.length) lines.push(`${ev.extras.length} extra tap${ev.extras.length > 1 ? 's' : ''} where no sound was written.`);
      const signed = ev.results.filter((r) => r.deltaMs != null).map((r) => r.deltaMs);
      if (signed.length >= 3) {
        const avg = signed.reduce((a, b) => a + b, 0) / signed.length;
        if (Math.abs(avg) > ev.tol * 0.6) lines.push(avg > 0 ? `On average you were ${Math.round(avg)} ms behind. If that feels wrong, try the latency calibration in Settings (Bluetooth headphones add delay).` : `On average you were ${Math.round(-avg)} ms ahead — try waiting for each click.`);
      }
      return lines;
    },
  };

  /* ---------- Timeline ----------
     opts: { beats, beatsPerBar, blocks:[{t,d,rest,label,lh}], counts:'beats'|'and'|false } */
  MC.Timeline = function (opts) {
    const o = Object.assign({ beats: 4, beatsPerBar: 4, blocks: [], counts: 'beats', unit: 64, showBoxes: true, tapLane: false, height: null }, opts);
    const wrap = h('div.timeline');
    let svg, playhead, blockEls = [], beatEls = [], tapG, countEls = [];
    const W = o.beats * o.unit + 20;
    const x = (b) => 10 + b * o.unit;
    function build() {
      MC.util.clear(wrap);
      const H = o.tapLane ? 118 : 96;
      svg = S('svg', { class: 'tl-svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': describe() });
      beatEls = []; countEls = []; blockEls = [];
      for (let b = 0; b < o.beats; b++) {
        const strong = b % o.beatsPerBar === 0;
        if (o.showBoxes) {
          const r = S('rect', { x: x(b) + 2, y: 22, width: o.unit - 4, height: 22, rx: 3, class: 'tl-beat' + (strong ? ' strong' : '') });
          svg.appendChild(r);
          beatEls.push(r);
        }
        if (o.counts) {
          const c = S('text', { x: x(b) + o.unit / 2, y: 15, 'text-anchor': 'middle', class: 'tl-count' + (strong ? '' : '') }, String((b % o.beatsPerBar) + 1));
          svg.appendChild(c);
          countEls.push(c);
          if (o.counts === 'and') svg.appendChild(S('text', { x: x(b) + o.unit, y: 15, 'text-anchor': 'middle', class: 'tl-count weak' }, b < o.beats - 1 || true ? '&' : ''));
        }
        if (b > 0 && b % o.beatsPerBar === 0) svg.appendChild(S('line', { x1: x(b), x2: x(b), y1: 18, y2: 92, stroke: '#8a8f97', 'stroke-width': 2 }));
      }
      o.blocks.forEach((bl, i) => {
        const r = S('rect', { x: x(bl.t) + 2, y: 52, width: Math.max(6, bl.d * o.unit - 4), height: 22, rx: 4, class: 'tl-block' + (bl.rest ? ' rest' : '') + (bl.lh ? ' lh' : '') });
        svg.appendChild(r);
        const lbl = bl.label != null ? bl.label : bl.rest ? 'rest' : '';
        const tx = S('text', { x: x(bl.t) + 8, y: 88, class: 'tl-label' + (bl.rest ? ' rest' : '') }, lbl);
        svg.appendChild(tx);
        blockEls.push({ r, tx });
      });
      tapG = S('g');
      svg.appendChild(tapG);
      playhead = S('line', { x1: x(0), x2: x(0), y1: 18, y2: o.tapLane ? 114 : 92, class: 'tl-playhead', style: 'display:none' });
      svg.appendChild(playhead);
      wrap.appendChild(svg);
    }
    function describe() {
      const parts = o.blocks.map((b) => (b.rest ? `rest ${b.d} beat${b.d === 1 ? '' : 's'}` : `sound ${b.d} beat${b.d === 1 ? '' : 's'}`));
      return `Beat timeline: ${o.beats} beats. ${parts.join(', ')}`;
    }
    build();
    return {
      el: wrap,
      setBlocks(blocks, beats) { o.blocks = blocks; if (beats) o.beats = beats; build(); },
      setPlayhead(b) {
        if (b == null || b < 0 || b > o.beats) { playhead.style.display = 'none'; return; }
        playhead.style.display = '';
        playhead.setAttribute('x1', x(b));
        playhead.setAttribute('x2', x(b));
        const bi = Math.floor(b);
        beatEls.forEach((r, i) => r.classList.toggle('on', i === bi));
        blockEls.forEach(({ r, tx }, i) => {
          const bl = o.blocks[i];
          const on = !bl.rest && b >= bl.t && b < bl.t + bl.d;
          r.classList.toggle('on', on);
          tx.classList.toggle('on', on);
        });
      },
      addTap(b, cls, label) {
        const cx = x(b);
        tapG.appendChild(S('circle', { cx, cy: 100, r: 5, class: 'tl-tap ' + (cls || '') }));
        if (label) tapG.appendChild(S('text', { x: cx, y: 114, 'text-anchor': 'middle', class: 'tl-tap-label tl-tap ' + (cls || '') }, label));
      },
      clearTaps() { MC.util.clear(tapG); },
      setTapLane(on) { o.tapLane = on; build(); },
    };
  };
  /* Convert a list of durations (beats) into timeline blocks. */
  MC.Timeline.blocksFrom = (durs, rests) => {
    let t = 0;
    return durs.map((d, i) => {
      const b = { t, d, rest: rests && rests[i], label: (rests && rests[i] ? 'rest ' : '') + (d === 0.5 ? '½' : d) + (d === 1 ? ' beat' : d === 0.5 ? '' : ' beats') };
      t += d;
      return b;
    });
  };

  /* ---------- Metronome widget ---------- */
  MC.Metronome = function (opts) {
    const o = Object.assign({ bpm: 72, beatsPerBar: 4, min: 40, max: 160, subdivide: false, showGrouping: true, compact: false, onBeat: null }, opts);
    const wrap = h('div.metro');
    const dots = h('div.beat-dots', { 'aria-hidden': 'true' });
    const bpmOut = h('div.bpm-big', null, String(o.bpm));
    const status = h('div.small.muted', { 'aria-live': 'polite' });
    let tr = null;
    const renderDots = () => {
      MC.util.clear(dots);
      for (let i = 0; i < o.beatsPerBar; i++) dots.appendChild(h('div.beat-dot' + (i === 0 ? '.strong' : ''), null, String(i + 1)));
    };
    renderDots();
    const startBtn = MC.util.btn('▶ Start', () => (tr && tr.playing ? stop() : start()), 'btn-primary');
    const slider = MC.util.slider('Tempo', o.min, o.max, 1, o.bpm, (v) => { o.bpm = v; bpmOut.textContent = v; if (tr) tr.setBpm(v); }, (v) => v + ' BPM');
    const group = MC.util.segmented([{ label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 }], o.beatsPerBar, (v) => { o.beatsPerBar = v; renderDots(); if (tr && tr.playing) { stop(); start(); } }, 'Beats in each group');
    const sub = h('label.check', null, h('input', { type: 'checkbox', checked: o.subdivide || null, onchange: (e) => { o.subdivide = e.target.checked; if (tr && tr.playing) { stop(); start(); } } }), 'Click the "&" between beats');
    function start() {
      A.ensure();
      tr = new A.Transport({ bpm: o.bpm, beatsPerBar: o.beatsPerBar, metronome: true, subdivide: o.subdivide, end: 1e9,
        onTick: (b) => {
          const i = T.mod(Math.floor(b + 1e-6), o.beatsPerBar);
          [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i && b - Math.floor(b) < 0.35));
          if (o.onBeat) o.onBeat(b);
        } });
      tr.play(0);
      startBtn.textContent = '■ Stop';
      status.textContent = A.canHear() ? '' : 'Sound is off — watch the circles light up instead, or turn sound on at the top of the page.';
    }
    function stop() {
      if (tr) tr.stop();
      tr = null;
      [...dots.children].forEach((d) => d.classList.remove('on'));
      startBtn.textContent = '▶ Start';
    }
    wrap.append(
      h('div.row', null, bpmOut, h('div.small.muted', null, 'beats per minute (BPM)'), h('div.spacer'), startBtn),
      dots,
      h('div.toolbar', null, slider, o.showGrouping ? h('span.small.muted', null, 'Group:') : null, o.showGrouping ? group : null),
      o.compact ? null : sub,
      status,
    );
    MC.util.onCleanup(stop);
    return { el: wrap, start, stop, get bpm() { return o.bpm; }, set(bpm) { o.bpm = bpm; slider.set(bpm); bpmOut.textContent = bpm; if (tr) tr.setBpm(bpm); } };
  };

  /* ---------- Tap task: count-in, capture taps, evaluate against expected onsets ----------
     opts: { onsets:[beats], length (beats), bpm, beatsPerBar, demoEvents, metronome, muteClicksAfter, onDone(result) } */
  MC.TapTask = function (opts) {
    const o = Object.assign({ bpm: 70, beatsPerBar: 4, metronome: true, countIn: null, label: 'Tap here (or press Space)', timeline: null, midi: 60 }, opts);
    const countIn = o.countIn != null ? o.countIn : o.beatsPerBar;
    const wrap = h('div.stack');
    const pad = h('button.tap-pad', { type: 'button', disabled: true, 'aria-label': 'Tap pad: tap in rhythm. You can also press Space.' }, 'Press “Start”, listen to the count-in, then tap');
    const info = h('div.caption', { 'aria-live': 'polite' });
    const startBtn = MC.util.btn('▶ Start', () => run(), 'btn-primary');
    wrap.append(h('div.row', null, startBtn, h('span.small.muted', null, `${countIn}-beat count-in at ${o.bpm} BPM`)), pad, info);
    let tr = null;
    let taps = [];
    let unTap = null;
    let running = false;
    let lat = 0;
    const tl = o.timeline;
    function toBeat(perfMs) {
      if (!tr) return null;
      const t = tr.silent ? perfMs / 1000 : A.perfToCtx(perfMs);
      return tr.anchor.beat + ((t - lat - tr.anchor.time) * tr.o.bpm) / 60;
    }
    function onTap(perfMs) {
      if (!running) return;
      pad.classList.add('hit');
      setTimeout(() => pad.classList.remove('hit'), 90);
      const b = toBeat(perfMs);
      if (b == null || b < -0.6) return;
      taps.push(b);
      if (tl) tl.addTap(b, '', '');
    }
    pad.addEventListener('pointerdown', (e) => { e.preventDefault(); onTap(performance.now()); });
    function run() {
      if (running) return;
      A.ensure();
      taps = [];
      if (tl) tl.clearTaps();
      lat = MC.timing.latency();
      running = true;
      pad.disabled = false;
      pad.textContent = o.label;
      startBtn.disabled = true;
      info.textContent = 'Count-in…';
      const events = (o.demoEvents || []).slice();
      unTap = MC.input.onTap((e) => onTap(e.time));
      tr = new A.Transport({
        bpm: o.bpm, beatsPerBar: o.beatsPerBar, metronome: o.metronome, countIn, events, end: o.length, tail: 0.9, muteClicksAfter: o.muteClicksAfter,
        onTick: (b) => {
          if (tl) tl.setPlayhead(b >= 0 ? b : null);
          if (b < 0) info.textContent = `Count-in: ${Math.floor(b + countIn) + 1}`;
          else if (info.textContent.startsWith('Count')) info.textContent = 'Now tap!';
        },
        onEnd: finish,
      });
      tr.play();
      pad.focus();
    }
    function finish() {
      running = false;
      if (unTap) unTap();
      unTap = null;
      pad.disabled = true;
      pad.textContent = 'Done — see the result below';
      startBtn.disabled = false;
      startBtn.textContent = '↻ Try again';
      if (tl) tl.setPlayhead(null);
      const ev = MC.timing.evaluate(o.onsets, taps.filter((b) => b <= o.length + 0.5), o.bpm);
      if (tl) {
        tl.clearTaps();
        ev.results.forEach((r) => { if (r.tap != null) tl.addTap(r.tap, r.status === 'ok' ? 'ok' : r.status === 'close' ? 'close' : 'off', r.status === 'ok' ? '✓' : (r.deltaMs < 0 ? 'early' : 'late')); });
        ev.extras.forEach((b) => tl.addTap(b, 'off', 'extra'));
      }
      info.innerHTML = '';
      MC.timing.describe(ev).forEach((l) => info.appendChild(h('div', null, l)));
      if (o.onDone) o.onDone(ev);
    }
    const api = { el: wrap, run, stop() { if (tr) tr.stop(); running = false; if (unTap) unTap(); } };
    MC.util.onCleanup(api.stop);
    return api;
  };

  /* Latency calibration: tap along with 8 clicks; median offset becomes the correction. */
  MC.calibrateLatency = function (onDone) {
    const body = h('div.stack');
    const pad = h('button.tap-pad', { type: 'button' }, 'Tap here (or press Space) on every click');
    const info = h('div.caption', { 'aria-live': 'polite' }, 'You will hear 4 count-in clicks, then 8 more. Tap exactly with the 8 clicks.');
    body.append(info, pad);
    let taps = [];
    let tr = null;
    const onTap = (perf) => { if (tr && tr.playing) { pad.classList.add('hit'); setTimeout(() => pad.classList.remove('hit'), 80); taps.push(A.perfToCtx(perf)); } };
    pad.addEventListener('pointerdown', (e) => { e.preventDefault(); onTap(performance.now()); });
    const un = MC.input.onTap((e) => onTap(e.time));
    const startCal = () => {
      A.ensure();
      if (!A.isRunning()) { info.textContent = 'Turn on sound first — calibration needs to hear the clicks.'; return false; }
      taps = [];
      tr = new A.Transport({ bpm: 90, beatsPerBar: 4, metronome: true, countIn: 4, events: [], end: 8, tail: 0.6, onEnd: () => {
        const clickTimes = [];
        for (let b = 0; b < 8; b++) clickTimes.push(tr.beatToTime(b));
        const offs = [];
        taps.forEach((t) => {
          let best = null;
          clickTimes.forEach((c) => { if (best == null || Math.abs(t - c) < Math.abs(best)) best = t - c; });
          if (best != null && Math.abs(best) < 0.33) offs.push(best);
        });
        if (offs.length < 5) { info.textContent = `Only ${offs.length} taps matched clicks. Try again and tap on every click.`; return; }
        offs.sort((a, b) => a - b);
        const med = offs[Math.floor(offs.length / 2)];
        const ms = Math.round(med * 1000);
        MC.store.setSetting('latencyMs', Math.max(-50, Math.min(400, ms)));
        info.textContent = `Measured offset: ${ms} ms. Rhythm checks will now subtract this. You can close this window.`;
        if (onDone) onDone(ms);
      } });
      tr.play();
      pad.focus();
      return false;
    };
    MC.util.modal('Calibrate timing', body, [
      { label: 'Start calibration', cls: 'btn-primary', onClick: startCal },
      { label: 'Use browser estimate', onClick: () => { MC.store.setSetting('latencyMs', null); MC.util.toast('Using the browser’s own latency estimate.'); } },
      { label: 'Close', onClick: () => { if (tr) tr.stop(); un(); } },
    ]);
  };
})(window.MC = window.MC || {});
