/* Piece player: Watch & listen · Play with guidance (waits for you) · Try independently
   (untimed = notes only; timed = notes + rhythm). Keeps staff, keyboard and sound in sync. */
(function (MC) {
  'use strict';
  const { h } = MC.util;
  const T = MC.theory;
  const A = MC.audio;
  const I = MC.input;

  MC.PiecePlayer = function (piece, opts) {
    const o = Object.assign({ mode: 'watch', modes: ['watch', 'guided', 'independent'], names: null, hands: null, onResult: null, showInfo: true, timed: false, speed: null, keyHints: true, lockMode: false, handsOnKeys: null }, opts);
    const score = T.buildScore(piece);
    const handsAvail = [...new Set(score.staves.map((s) => s.hand))];
    const twoHands = handsAvail.length > 1;
    const st = {
      mode: o.mode,
      hands: o.hands || (twoHands ? 'both' : handsAvail[0]),
      names: o.names != null ? o.names : o.mode !== 'independent' && !piece.extendedRange,
      keyHints: o.keyHints,
      speed: o.speed || (o.mode === 'watch' ? 100 : 75),
      metronome: false,
      countIn: true,
      timed: o.timed,
      other: twoHands,
      from: 0,
      to: score.count - 1,
      cursor: true,
      showHands: o.handsOnKeys != null ? o.handsOnKeys : o.mode !== 'independent',
    };
    const root = h('div.player');
    const staffHost = h('div.staff-wrap');
    if (score.count > 16) {
      staffHost.classList.add('score-viewport');
      staffHost.setAttribute('tabindex', '0');
      staffHost.setAttribute('role', 'region');
      staffHost.setAttribute('aria-label', 'Scrollable music score');
    }
    const status = h('div.player-status', { 'aria-live': 'polite' });
    const results = h('div');
    const kbHost = h('div');
    const optsRow = h('div.toolbar');
    const bar = h('div.player-bar');
    let staff = null;
    let kb = null;
    let tr = null;
    let unsub = null;
    let session = null;

    // keyboard range from the notes
    const allMidis = [];
    score.staves.forEach((s) => s.measures.forEach((m) => m.events.forEach((e) => e.notes.forEach((n) => allMidis.push(n.midi)))));
    let lo = Math.min(...allMidis) - 2, hi = Math.max(...allMidis) + 2;
    lo = Math.floor(lo / 12) * 12; // down to a C
    hi = Math.max(hi, lo + 23);
    if (T.mod(hi, 12) !== 0 && T.mod(hi, 12) !== 4) hi = Math.ceil(hi / 12) * 12;

    const activeHands = () => (st.hands === 'both' ? handsAvail : [st.hands]);

    /* ---------- Hands on the keys, following the written fingering ----------
       Each fingered note fixes where that finger rests; the other fingers take the neighbouring
       keys (one per finger, in the piece's key). A fingering that does not fit the current
       position means the hand has moved to a new one. */
    function handMap(hand, known) {
      const dir = hand === 'lh' ? -1 : 1;
      const pts = known.map((x) => ({ f: x.f, d: T.diatonic(x.note), note: x.note })).sort((a, b) => a.f - b.f);
      const ref = pts[0];
      const ds = {};
      const map = {};
      for (let f = 1; f <= 5; f++) {
        const exact = pts.find((p) => p.f === f);
        if (exact) { ds[f] = exact.d; map[f] = exact.note.midi; continue; }
        const below = pts.filter((p) => p.f < f).pop(), above = pts.find((p) => p.f > f);
        let d = below && above ? Math.round(below.d + ((above.d - below.d) * (f - below.f)) / (above.f - below.f)) : below ? below.d + dir * (f - below.f) : above.d - dir * (above.f - f);
        if (ds[f - 1] != null && d === ds[f - 1]) d += dir;
        ds[f] = d;
        map[f] = T.stepFrom(ref.note, d - ref.d, piece.key || 'C').midi;
      }
      return map;
    }
    const fingerPlan = new Map(); // note ref → { hand, map: {finger: midi} }
    (function planHands() {
      const cur = {};
      T.timeline(score, { hands: handsAvail }).items.forEach((it) => {
        if (it.tiedFrom || !it.midis.length) return;
        const known = (it.fingers || []).map((f, k) => ({ f, note: it.notes[k] })).filter((x) => x.f && x.note);
        const map = cur[it.hand];
        if (known.length && !(map && known.every((x) => map[x.f] === x.note.midi))) cur[it.hand] = handMap(it.hand, known);
        if (cur[it.hand] && !fingerPlan.has(it.ref)) fingerPlan.set(it.ref, { hand: it.hand, map: cur[it.hand] });
      });
    })();
    let handMaps = {};
    let handsKey = null;
    function showHands() {
      if (!kb) return;
      const list = st.showHands ? activeHands().filter((hd) => handMaps[hd]).map((hd) => ({ hand: hd, fingers: handMaps[hd] })) : [];
      const key = JSON.stringify(list);
      if (key === handsKey) return;
      handsKey = key;
      kb.setHands(list);
    }
    /* Move the hands to where the notes of these timeline items are played. Returns [{hand, midi}]. */
    function handsFor(items) {
      const out = [];
      items.forEach((it) => {
        const p = fingerPlan.get(it.ref);
        if (!p) return;
        handMaps[p.hand] = p.map;
        it.midis.forEach((m) => { if (Object.values(p.map).includes(m)) out.push({ hand: p.hand, midi: m }); });
      });
      showHands();
      return out;
    }
    function resetHands() {
      handMaps = {};
      timeline().items.forEach((it) => { const p = fingerPlan.get(it.ref); if (p && !handMaps[p.hand]) handMaps[p.hand] = p.map; });
      handsKey = null;
      showHands();
    }
    const range = () => (st.from === 0 && st.to === score.count - 1 ? null : [st.from, st.to]);
    const bpm = () => Math.round(score.tempo * st.speed / 100);
    const tempoLabel = (speed = st.speed) => [score.tempo, ...(score.tempoChanges || []).map((c) => c.bpm)].map((b) => Math.round(b * speed / 100)).join(' → ') + ' BPM';
    function timeline(hands) {
      const r = range();
      const tl = T.timeline(score, { hands: hands || activeHands(), noRepeats: !!r });
      if (!r) return tl;
      const off = r[0] * score.bpm;
      return T.sliceTimeline(tl, off, (r[1] + 1) * score.bpm);
    }

    function renderStaff() {
      const act = activeHands();
      staff = MC.Staff.render(staffHost, score, {
        showNames: st.names ? (ev, si) => (act.includes(score.staves[si].hand) ? ev.notes.slice().reverse().map((n) => T.name(n, false)).join('\n') : '') : false,
        showFingers: true,
        showCounts: !!o.counts,
        handLabels: twoHands,
        autoScroll: true,
        measureNumbersAll: score.count > 16,
        showTempo: score.count > 16 || !!score.tempoChanges.length,
        onNoteClick: (ev) => {
          A.ensure();
          const midis = ev.notes.map((n) => n.midi);
          midis.forEach((m) => A.play(m, 0.7));
          if (kb) { midis.forEach((m) => kb.flash(m, 'target', 700, T.name(T.fromMidi(m), false))); }
          status.textContent = `That note is ${ev.notes.map((n) => T.name(n)).join(' + ')}.`;
        },
      });
      staff.evInfo.forEach((info) => { if (!act.includes(score.staves[info.si].hand)) info.g.classList.add('inactive'); });
    }
    function renderKeyboard() {
      if (kb) kb.destroy();
      kb = MC.Keyboard({ from: lo, to: hi, labels: st.names ? 'white' : 'c', showOct: true, minKeyPx: 26 });
      MC.util.clear(kbHost);
      kbHost.appendChild(kb.el);
      resetHands();
    }

    function renderOptions() {
      MC.util.clear(optsRow);
      if (!o.lockMode && o.modes.length > 1) {
        optsRow.appendChild(MC.util.segmented(o.modes.map((m) => ({ value: m, label: { watch: 'Watch & listen', guided: 'Play with guidance', independent: 'Try independently' }[m] })), st.mode, (v) => { st.mode = v; if (v === 'independent') { st.names = false; st.showHands = false; } else st.showHands = o.handsOnKeys !== false; if (v === 'guided' && o.names !== false) st.names = true; stopAll(); renderAll(); }, 'Practice mode'));
      }
      if (twoHands) {
        optsRow.appendChild(MC.util.segmented([{ value: 'rh', label: 'Right hand' }, { value: 'lh', label: 'Left hand' }, { value: 'both', label: 'Both' }], st.hands, (v) => { st.hands = v; stopAll(); renderAll(); }, 'Which hands'));
      }
      optsRow.appendChild(h('label.check', null, h('input', { type: 'checkbox', checked: st.names || null, onchange: (e) => { st.names = e.target.checked; stopAll(); renderAll(); } }), 'Note names'));
      if (fingerPlan.size) optsRow.appendChild(h('label.check', null, h('input', { type: 'checkbox', checked: st.showHands || null, onchange: (e) => { st.showHands = e.target.checked; handsKey = null; showHands(); if (session) showTarget(); } }), 'Hands on the keys'));
      if (st.mode === 'guided') optsRow.appendChild(h('label.check', null, h('input', { type: 'checkbox', checked: st.keyHints || null, onchange: (e) => { st.keyHints = e.target.checked; if (session) showTarget(); } }), 'Light up the next key'));
      if (st.mode === 'independent') {
        optsRow.appendChild(MC.util.segmented([{ value: false, label: 'Notes only (untimed)' }, { value: true, label: 'Notes + rhythm (with the beat)' }], st.timed, (v) => { st.timed = v; stopAll(); renderAll(); }, 'Timing'));
      }
      if (st.mode === 'watch' || (st.mode === 'independent' && st.timed)) {
        optsRow.appendChild(MC.util.slider('Speed', 40, 120, 5, st.speed, (v) => { st.speed = v; if (tr) tr.setBpm(bpm()); }, (v) => `${v}% (${tempoLabel(v)})`));
        optsRow.appendChild(h('label.check', null, h('input', { type: 'checkbox', checked: st.metronome || null, onchange: (e) => { st.metronome = e.target.checked; } }), 'Metronome'));
      }
      if (twoHands && st.hands !== 'both' && st.mode !== 'watch') optsRow.appendChild(h('label.check', null, h('input', { type: 'checkbox', checked: st.other || null, onchange: (e) => { st.other = e.target.checked; } }), 'Hear the other hand'));
      if (score.count > 2) {
        if (piece.sections) {
          const sections = [{ label: piece.excerpt ? 'Full excerpt' : 'Full piece', from: 1, to: score.count }, ...piece.sections];
          const selected = sections.findIndex((s) => s.from === st.from + 1 && s.to === st.to + 1);
          const select = h('select', { 'aria-label': 'Practice section', onchange: (e) => {
            const s = sections[+e.target.value];
            if (!s) return;
            st.from = s.from - 1; st.to = s.to - 1; stopAll(); renderAll();
            staff.setCurrent([`0:${st.from}:0`], false);
            const first = staff.evInfo.get(`0:${st.from}:0`);
            if (first) staffHost.scrollTop = first.g.getBoundingClientRect().top - staffHost.getBoundingClientRect().top + staffHost.scrollTop - 70;
          } }, sections.map((s, i) => h('option', { value: i, selected: i === selected || null }, `${s.label} (${s.from}–${s.to})`)));
          if (selected < 0) select.prepend(h('option', { value: -1, selected: true }, 'Custom measures'));
          optsRow.appendChild(h('label.small.row', null, 'Section', select));
        }
        const mk = (val, on) => h('select', { 'aria-label': on, onchange: (e) => { const v = +e.target.value; if (on === 'From measure') st.from = Math.min(v, st.to); else st.to = Math.max(v, st.from); stopAll(); renderAll(); } },
          Array.from({ length: score.count }, (_, i) => h('option', { value: i, selected: i === val || null }, String(i + 1))));
        optsRow.appendChild(h('span.small.muted.row', null, 'Measures', mk(st.from, 'From measure'), '–', mk(st.to, 'To measure')));
      }
    }

    function renderBar() {
      MC.util.clear(bar);
      if (st.mode === 'watch') {
        bar.append(MC.util.btn(tr && tr.playing ? '❚❚ Pause' : '▶ Play', togglePlay, 'btn-primary'), MC.util.btn('↺ Restart', () => { stopAll(); togglePlay(); }), MC.util.btn('■ Stop', () => { stopAll(); status.textContent = ''; }));
      } else if (st.mode === 'guided') {
        bar.append(MC.util.btn('↺ Start again', startGuided), MC.util.btn('▶ Hear it first', () => { stopAll(); playPreview(); }));
      } else if (st.timed) {
        bar.append(MC.util.btn('▶ Start (count-in)', startTimed, 'btn-primary'), MC.util.btn('■ Stop', () => { stopAll(); status.textContent = 'Stopped.'; }));
      } else {
        bar.append(MC.util.btn('↺ Start again', startUntimed), MC.util.btn('Where am I?', () => { if (session && session.onsets[session.idx]) { staff.setCurrent(session.onsets[session.idx].items.map((i) => i.ref)); setTimeout(() => { if (session && !st.cursor) staff.setCurrent([]); }, 1500); } }));
      }
      const legend = h('div.legend', null,
        h('span', null, h('span.sw', { style: { background: 'var(--accent)' } }), 'next / now'),
        h('span', null, h('span.sw', { style: { background: 'var(--ok)' } }), '✓ correct'),
        h('span', null, h('span.sw', { style: { background: 'var(--bad)' } }), '✗ wrong key'),
        st.timed && st.mode === 'independent' ? h('span', null, h('span.sw', { style: { background: '#9a6700' } }), 'early / late') : null);
      bar.append(h('div.spacer'), legend);
    }

    function renderAll() {
      renderOptions();
      renderStaff();
      renderKeyboard();
      renderBar();
      results.innerHTML = '';
      if (st.mode === 'guided') startGuided();
      else if (st.mode === 'independent' && !st.timed) startUntimed();
      else if (st.mode === 'independent') status.textContent = 'Press Start. You will hear a one-measure count-in, then play along with the beat. The app checks notes and timing separately.';
      else status.textContent = 'Press Play to watch and listen. Click any note on the staff to hear it and see its key.';
    }

    /* ---------- Watch ---------- */
    let lit = [];
    function clearLit() { lit.forEach((m) => kb && kb.unmark(m, 'play')); lit = []; if (kb) kb.pressFinger(null); }
    function playPreview() {
      const tl = timeline(handsAvail);
      startTransport(tl, { sound: true, highlight: true, speed: st.speed });
    }
    function togglePlay() {
      if (tr && tr.playing) { tr.pause(); renderBar(); status.textContent = 'Paused.'; return; }
      if (tr && tr.pos > 0) { tr.play(); renderBar(); return; }
      startTransport(timeline(), { sound: true, highlight: true });
      renderBar();
    }
    function startTransport(tl, cfg) {
      if (tr) tr.stop(true);
      A.ensure();
      const active = [];
      const events = tl.items.map((it) => ({ t: it.t, d: it.d, midis: it.midis, durations: it.midis.map((m) => it.noteDurations?.[m] ?? it.d), vel: it.vel, stacc: it.stacc, spread: it.spread, data: it, silent: cfg.silentHands ? cfg.silentHands.includes(it.hand) : !cfg.sound }));
      tr = new A.Transport({
        bpm: bpm(), tempoMap: tl.tempoMap, events, beatsPerBar: score.time[0], metronome: st.metronome || !!cfg.metronome, countIn: cfg.countIn || 0, end: tl.total,
        onEvent: (e) => {
          if (!cfg.highlight) return;
          active.push(e);
          e.litMidis = new Set(e.midis);
          const refs = active.filter((x) => x.t === e.t).map((x) => x.data.ref);
          if (st.cursor !== false) staff.setCurrent(refs);
          if (cfg.keyMarks !== false) {
            handsFor([e.data]);
            e.data.midis.forEach((m) => { kb.setMark(m, 'play', e.data.fingers ? String(e.data.fingers[e.data.midis.indexOf(m)] || '') : ''); kb.pressFinger(m, true); lit.push(m); });
          }
        },
        onTick: (b) => {
          if (cfg.onTick) cfg.onTick(b);
          else if (cfg.sound && A.canHear()) status.textContent = `Playing at ${Math.round(tr.tempo.bpmAt(b))} BPM.`;
          for (let i = active.length - 1; i >= 0; i--) {
            const e = active[i];
            e.midis.forEach((m, k) => {
              if (e.litMidis.has(m) && b >= e.t + e.durations[k] - 0.02) {
                e.litMidis.delete(m);
                if (kb && !active.some((x) => x !== e && x.litMidis.has(m))) { kb.unmark(m, 'play'); kb.pressFinger(m, false); }
              }
            });
            if (b >= e.t + e.d - 0.02) active.splice(i, 1);
          }
        },
        onEnd: () => { clearLit(); if (cfg.highlight) staff.setCurrent([]); renderBar(); if (cfg.onEnd) cfg.onEnd(); else status.textContent = 'Finished. Press Play to hear it again, or try another mode.'; },
        onState: (s) => { if (s !== 'playing') clearLit(); },
      });
      tr.play();
      if (!A.canHear() && cfg.sound) status.textContent = 'Sound is off, so this is a silent demonstration: follow the highlighted notes and keys. Turn sound on at the top of the page to hear it.';
      else if (cfg.sound) status.textContent = `Playing at ${Math.round(tr.tempo.bpmAt(0))} BPM.`;
    }

    /* ---------- Guided & untimed independent ---------- */
    function startGuided() { startStepMode(true); }
    function startUntimed() { startStepMode(false); }
    function startStepMode(guided) {
      stopAll();
      staff.clearMarks();
      const tl = timeline();
      const onsets = T.onsets(tl);
      const other = st.other && st.hands !== 'both' ? T.onsets(timeline(handsAvail.filter((x) => x !== st.hands))) : [];
      session = { guided, onsets, idx: 0, pressed: new Set(), firstTry: 0, errors: 0, errOnset: false, other, tempo: T.tempoClock(bpm(), tl.tempoMap) };
      showTarget();
      status.textContent = guided
        ? 'Play the highlighted note. The music waits for you — take your time.'
        : 'Play the notes in order without hints. Correct notes turn green; wrong keys are marked and you can try again.';
      unsub = I.subscribe(onInput);
    }
    function showTarget() {
      const s = session;
      kb.clearMarks('target');
      const on = s.onsets[s.idx];
      if (!on) { kb.hintFinger([]); return; }
      const next = handsFor(on.items);
      kb.hintFinger(s.guided ? next : []);
      if (s.guided) staff.setCurrent(on.items.map((i) => i.ref));
      else staff.setCurrent([]);
      if (s.guided && st.keyHints) {
        on.items.forEach((it) => it.midis.forEach((m, k) => kb.setMark(m, 'target', it.fingers && it.fingers[k] ? String(it.fingers[k]) : T.name(T.fromMidi(m, it.notes[k] && it.notes[k].acc < 0 ? 'flat' : 'sharp'), false))));
      } else if (s.guided) {
        // no key hint: still make sure the right part of the keyboard is visible
        kb.show(on.midis[0]);
      }
    }
    function onInput(ev) {
      const s = session;
      if (!s || ev.type !== 'on') return;
      const on = s.onsets[s.idx];
      if (!on) return;
      if (on.midis.includes(ev.midi)) {
        s.pressed.add(ev.midi);
        kb.flash(ev.midi, 'ok', 350);
        const done = on.midis.every((m) => s.pressed.has(m) || I.held.has(m));
        if (done) {
          const refs = on.items.map((i) => i.ref);
          refs.forEach((r) => staff.mark(r, s.errOnset ? 'bad' : 'ok', s.guided ? '' : s.errOnset ? '✗' : '✓'));
          if (!s.errOnset) s.firstTry++;
          // hear the other hand at this moment
          const nextT = s.onsets[s.idx + 1] ? s.onsets[s.idx + 1].t : Infinity;
          s.other.filter((x) => x.t >= on.t - 1e-6 && x.t < nextT - 1e-6).forEach((x) => {
            const delay = s.tempo.between(on.t, x.t);
            x.items.forEach((it) => it.midis.forEach((m, i) => A.play(m, s.tempo.between(x.t, x.t + (it.noteDurations?.[m] ?? it.d)) * 0.9, it.vel, A.now() + delay + (it.spread || 0) * i)));
          });
          s.idx++;
          s.pressed = new Set();
          s.errOnset = false;
          if (s.idx >= s.onsets.length) finishStep();
          else showTarget();
        }
      } else {
        s.errors++;
        s.errOnset = true;
        kb.flash(ev.midi, 'bad', 700, '✗');
        const want = on.midis.map((m) => T.keyName(m)).join(' + ');
        const got = T.keyName(ev.midi);
        const diff = on.midis[0] - ev.midi;
        const dir = diff > 0 ? 'higher (to the right)' : 'lower (to the left)';
        let msg = `You played ${got}. `;
        if (s.guided) msg += `The next note is ${want} — ${Math.abs(diff)} key${Math.abs(diff) === 1 ? '' : 's'} ${dir}.`;
        else if (T.mod(diff, 12) === 0) msg += 'Right letter, wrong octave — look at how high or low the note sits on the staff.';
        else msg += `Not quite. Look at the next note again and count from a note you know. It is ${dir}.`;
        if (!s.guided && s.errors >= 3 && s.errOnset) msg += ' (Stuck? Use “Where am I?” or switch to “Play with guidance”.)';
        status.textContent = msg;
      }
    }
    function finishStep() {
      const s = session;
      const total = s.onsets.length;
      const pct = total ? s.firstTry / total : 0;
      staff.setCurrent([]);
      kb.clearMarks();
      kb.hintFinger([]);
      if (unsub) { unsub(); unsub = null; }
      const mode = s.guided ? 'guided' : 'independent';
      MC.store.recordPiece(piece.id, mode, { pitch: pct });
      status.textContent = s.guided ? 'You reached the end. Well played.' : 'Finished.';
      showResults([
        { t: 'Notes right first time', v: `${s.firstTry} / ${total}`, sub: MC.util.pct(pct) },
        { t: 'Wrong keys along the way', v: String(s.errors), sub: s.errors ? 'Each one was corrected before moving on.' : 'None — clean run.' },
      ], s.guided
        ? 'Next: try the same music with “Light up the next key” turned off, then in “Try independently”.'
        : pct >= 0.8 ? 'Strong result. Try “Notes + rhythm” to add steady timing.' : 'Try again slowly, or go back to guided mode for the tricky spots (you can choose the measures).');
      session = null;
      if (o.onResult) o.onResult({ mode, pitch: pct, timed: false, total });
    }

    /* ---------- Timed independent ---------- */
    function startTimed() {
      stopAll();
      staff.clearMarks();
      A.ensure();
      const tl = timeline();
      const onsets = T.onsets(tl);
      const notes = [];
      const lat = MC.timing.latency();
      const otherTl = st.other && st.hands !== 'both' ? timeline(handsAvail.filter((x) => x !== st.hands)) : null;
      const playTl = otherTl ? { ...tl, items: tl.items.concat(otherTl.items) } : tl;
      unsub = I.subscribe((ev) => {
        if (ev.type !== 'on' || !tr) return;
        const t = tr.silent ? ev.time / 1000 : A.perfToCtx(ev.time);
        const b = tr.timeToBeat(t - lat);
        if (b > -0.5) notes.push({ b, midi: ev.midi, used: false });
      });
      session = { timed: true };
      status.textContent = 'Count-in… then play along.';
      startTransport(playTl, {
        sound: !!otherTl, silentHands: activeHands(), highlight: st.cursor, keyMarks: false, countIn: score.bpm, metronome: true,
        onTick: (b) => { if (b < 0) status.textContent = `Count-in: ${Math.floor(b + score.bpm) + 1}`; else if (status.textContent.startsWith('Count')) status.textContent = 'Play!'; },
        onEnd: () => evaluateTimed(onsets, notes),
      });
      // metronome on during play only if chosen; count-in always clicks
      if (tr) tr.o.metronome = st.metronome;
      renderBar();
    }
    function evaluateTimed(onsets, notes) {
      if (unsub) { unsub(); unsub = null; }
      session = null;
      const tol = MC.timing.tolerance();
      let pitchOk = 0, onTime = 0;
      const lines = [];
      onsets.forEach((on, i) => {
        const prev = onsets[i - 1], next = onsets[i + 1];
        const gap = Math.min(prev ? on.t - prev.t : 1, next ? next.t - on.t : 1);
        const win = Math.max(0.25, Math.min(0.5, gap * 0.5));
        const cands = notes.filter((n) => !n.used && Math.abs(n.b - on.t) <= win);
        const found = [];
        on.midis.forEach((m) => {
          const c = cands.filter((n) => n.midi === m && !n.used).sort((a, b) => Math.abs(a.b - on.t) - Math.abs(b.b - on.t))[0];
          if (c) { c.used = true; found.push(c); }
        });
        const refs = on.items.map((it) => it.ref);
        if (found.length === on.midis.length) {
          pitchOk++;
          const d = tr.secondsBetween(on.t, found.reduce((a, n) => a + n.b, 0) / found.length) * 1000;
          if (Math.abs(d) <= tol) { onTime++; refs.forEach((r) => staff.mark(r, 'ok', '✓')); }
          else refs.forEach((r) => staff.mark(r, d < 0 ? 'early' : 'late', d < 0 ? 'early' : 'late'));
        } else {
          const wrong = cands.filter((n) => !n.used).sort((a, b) => Math.abs(a.b - on.t) - Math.abs(b.b - on.t))[0];
          if (wrong) {
            wrong.used = true;
            const d = tr.secondsBetween(on.t, wrong.b) * 1000;
            if (Math.abs(d) <= tol) onTime++;
            refs.forEach((r) => staff.mark(r, 'bad', T.name(T.fromMidi(wrong.midi), false) + '?'));
            if (lines.length < 3) lines.push(`Measure ${on.items[0].mi + 1}: you played ${T.keyName(wrong.midi)} instead of ${on.midis.map((m) => T.keyName(m)).join(' + ')}.`);
          } else refs.forEach((r) => staff.mark(r, 'missed', '–'));
        }
      });
      const total = onsets.length;
      const extras = notes.filter((n) => !n.used && n.b >= 0).length;
      const pitch = total ? pitchOk / total : 0;
      const rhythm = total ? onTime / total : 0;
      MC.store.recordPiece(piece.id, 'independent', { pitch, rhythm });
      status.textContent = 'Finished. Green = right note on time; amber = right note, early or late; red = wrong key; grey dash = missed.';
      showResults([
        { t: 'Pitch accuracy', v: `${pitchOk} / ${total}`, sub: `${MC.util.pct(pitch)} right keys` },
        { t: 'Rhythm accuracy', v: `${onTime} / ${total}`, sub: `${MC.util.pct(rhythm)} within ±${tol} ms` },
        { t: 'Extra notes', v: String(extras), sub: extras ? 'Keys pressed where no note was written' : 'None' },
      ], (lines.join(' ') + ' ' + (rhythm < 0.7 ? 'For steadier timing, lower the speed and count aloud.' : pitch < 0.8 ? 'Practise the red spots in guided mode, then come back.' : 'Well done — try a little faster next time.')).trim());
      renderBar();
      if (o.onResult) o.onResult({ mode: 'independent', pitch, rhythm, timed: true, total });
    }

    function showResults(cards, note) {
      results.innerHTML = '';
      results.append(h('div.results', null, cards.map((c) => h('div.result-card', null, h('div.small.muted', null, c.t), h('div.big', null, c.v), h('div.small', null, c.sub)))));
      if (note) results.append(h('p.small', { style: { marginTop: '8px' } }, note));
    }
    function stopAll() {
      if (tr) { tr.stop(true); tr = null; }
      clearLit();
      if (unsub) { unsub(); unsub = null; }
      session = null;
      if (staff) staff.setCurrent([]);
      if (kb) { kb.clearMarks(); kb.hintFinger([]); }
    }

    if (o.showInfo) {
      const meta = [piece.composer, piece.arranger ? `arr. ${piece.arranger}` : null, piece.keyLabel || (piece.key ? T.KEYS[piece.key].name : null), `${score.time[0]}/${score.time[1]} time`, tempoLabel(100)].filter(Boolean).join(' · ');
      root.append(h('div', null, h('h3', { style: { margin: 0 } }, piece.title), h('div.small.muted', null, meta), piece.note ? h('p.small', { style: { margin: '6px 0 0' } }, piece.note) : null));
    }
    if (score.errors.length) root.append(h('div.banner', null, 'Notation error: ' + score.errors.join('; ')));
    root.append(optsRow, h('div.stage.stage-tight', null, staffHost), bar, status, kbHost, results);
    MC.util.onCleanup(stopAll);
    // Render once attached (so widths are known)
    requestAnimationFrame(() => renderAll());
    return { el: root, stop: stopAll, setMode(m) { st.mode = m; stopAll(); renderAll(); } };
  };
})(window.MC = window.MC || {});
