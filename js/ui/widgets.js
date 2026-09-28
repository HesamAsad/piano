/* Lesson widgets: interactive demonstrations and explorers used by the course content. */
(function (MC) {
  'use strict';
  const { h, s: S } = MC.util;
  const T = MC.theory;
  const A = MC.audio;
  const I = MC.input;
  const W = (MC.widgets = {});
  const toMidis = (x) => [].concat(x).map((v) => (typeof v === 'number' ? v : T.midi(v)));
  const btn = MC.util.btn;

  /* ---------- Pitch graph (for "see the shape of the sound") ---------- */
  function pitchGraph(midis) {
    const w = 320, hh = 90;
    const lo = Math.min(...midis) - 2, hi = Math.max(...midis) + 2;
    const x = (i) => 20 + (i * (w - 40)) / Math.max(1, midis.length - 1);
    const y = (m) => hh - 12 - ((m - lo) / Math.max(1, hi - lo)) * (hh - 24);
    const svg = S('svg', { class: 'pitch-graph', viewBox: `0 0 ${w} ${hh}`, role: 'img', 'aria-label': 'Pitch shape: higher dots are higher sounds' });
    svg.appendChild(S('text', { x: 2, y: 12, class: 'pg-axis' }, 'high'));
    svg.appendChild(S('text', { x: 2, y: hh - 2, class: 'pg-axis' }, 'low'));
    svg.appendChild(S('polyline', { points: midis.map((m, i) => `${x(i)},${y(m)}`).join(' '), class: 'pg-line' }));
    const dots = midis.map((m, i) => { const c = S('circle', { cx: x(i), cy: y(m), r: 5, class: 'pg-dot', opacity: 0.35 }); svg.appendChild(c); return c; });
    return { el: svg, set(i) { dots.forEach((d, k) => { d.setAttribute('opacity', k === i ? 1 : k < i ? 0.6 : 0.35); d.setAttribute('r', k === i ? 8 : 5); }); } };
  }

  /* ---------- Demo: watch & listen to a short sequence with captions ---------- */
  W.demo = function (o) {
    o = Object.assign({ bpm: 76, labels: 'c', staff: null, graph: false, speed: 100, autoLabel: false }, o);
    const steps = o.steps.map((s) => Object.assign({ d: 1 }, s, { midis: s.m != null ? toMidis(s.m) : [] }));
    const all = steps.flatMap((s) => s.midis);
    const from = o.from || Math.floor((Math.min(...all) - 4) / 12) * 12;
    const to = o.to || Math.max(from + 24, Math.max(...all) + 4);
    const wrap = h('div.widget');
    const cap = h('div.readout', { 'aria-live': 'polite', html: o.intro || 'Press “Play demonstration”. Watch the keys light up as you listen.' });
    const stHost = o.staff ? h('div.stage.stage-tight.staff-wrap') : null;
    const graph = o.graph ? pitchGraph(steps.filter((s) => s.midis.length).map((s) => s.midis[0])) : null;
    const kb = MC.Keyboard({ from, to, labels: o.labels, showOct: true });
    let staffApi = null, refs = [];
    if (o.staff) {
      const noteSteps = steps.filter((s) => s.midis.length);
      const spec = { clef: o.staff, notes: noteSteps.map((s) => (s.midis.length > 1 ? { chord: (s.ids || s.midis.map((m) => T.id(T.fromMidi(m)))), dur: 'w' } : { n: s.ids ? s.ids[0] : T.id(T.fromMidi(s.midis[0])) })), names: o.names };
      requestAnimationFrame(() => {
        staffApi = MC.Staff.notes(stHost, spec, { spPx: 10, onNoteClick: (ev) => { A.ensure(); ev.notes.forEach((n) => { A.play(n.midi, 0.7); kb.flash(n.midi, 'target', 700, T.name(n, false)); }); } });
        refs = [];
        staffApi.order.forEach((r) => { const i = staffApi.evInfo.get(r); if (i && !i.ev.hidden && i.ev._heads) refs.push(r); });
      });
    }
    let tr = null;
    const playBtn = btn('▶ Play demonstration', () => toggle(), 'btn-primary');
    const speed = MC.util.slider('Speed', 50, 150, 10, o.speed, (v) => { o.speed = v; if (tr) tr.setBpm(o.bpm * v / 100); }, (v) => v + '%');
    function toggle() {
      if (tr && tr.playing) { tr.pause(); playBtn.textContent = '▶ Resume'; return; }
      if (tr && tr.pos > 0 && tr.pos < tr.end) { tr.play(); playBtn.textContent = '❚❚ Pause'; return; }
      let t = 0;
      const events = steps.map((s, i) => { const e = { t, d: s.d, midis: s.midis, vel: s.vel || 0.68, stacc: s.stacc, i }; t += s.d + (s.gap || 0); return e; });
      const active = [];
      let noteIdx = -1;
      tr = new A.Transport({
        bpm: o.bpm * o.speed / 100, events, end: t,
        onEvent: (e) => {
          const s = steps[e.i];
          if (s.cap) cap.innerHTML = s.cap;
          else if (o.autoLabel && s.midis.length) cap.innerHTML = `<strong>${s.midis.map((m) => T.keyName(m)).join(' + ')}</strong>`;
          s.midis.forEach((m, k) => kb.setMark(m, s.mark || 'play', s.tags ? s.tags[k] : s.tag || ''));
          active.push(e);
          if (s.midis.length) { noteIdx++; if (graph) graph.set(noteIdx); if (staffApi && refs[noteIdx]) staffApi.setCurrent(refs[noteIdx]); }
        },
        onTick: (b) => { for (let i = active.length - 1; i >= 0; i--) { const e = active[i]; if (b >= e.t + e.d - 0.03) { const s = steps[e.i]; if (!s.keep) s.midis.forEach((m) => kb.unmark(m, s.mark || 'play')); active.splice(i, 1); } } },
        onEnd: () => { playBtn.textContent = '↻ Replay'; if (staffApi) staffApi.setCurrent([]); if (o.endCap) cap.innerHTML = o.endCap; if (!o.keepMarks) kb.clearMarks(); },
      });
      kb.clearMarks();
      tr.play(0);
      playBtn.textContent = '❚❚ Pause';
      if (!A.canHear()) cap.innerHTML = (steps[0].cap || '') + ' <span class="muted small">(Sound is off — follow the lights. Turn sound on at the top to hear it.)</span>';
    }
    const stop = () => { if (tr) tr.stop(true); kb.clearMarks(); playBtn.textContent = '▶ Play demonstration'; };
    wrap.append(h('div.demo-controls', null, playBtn, btn('■ Stop', stop), speed), cap, stHost, graph && graph.el, kb.el);
    MC.util.onCleanup(stop);
    return wrap;
  };

  /* ---------- Keyboard explorer with live readout ---------- */
  W.keyboardExplore = function (o) {
    o = Object.assign({ from: 48, to: 72, labels: 'c', mode: 'compare', clef: null, labelToggle: true, groups: false, readout: null }, o);
    const wrap = h('div.widget');
    const out = h('div.readout.readout-big', { 'aria-live': 'polite', html: o.readout || 'Play any key.' });
    const stHost = o.clef ? h('div.stage.stage-tight.staff-wrap') : null;
    let last = null;
    const kb = MC.Keyboard({ from: o.from, to: o.to, labels: o.labels, groups: o.groups, showOct: true, onNote: (ev) => { if (ev.type === 'on') react(ev.midi); } });
    function showStaff(midis) {
      if (!stHost) return;
      const notes = midis.map((m) => T.fromMidi(m, o.prefer));
      const clef = o.clef === 'auto' ? (midis[0] >= 60 ? 'treble' : 'bass') : o.clef;
      MC.Staff.notes(stHost, { clef, notes: notes.length > 1 && o.mode === 'interval' ? notes.map((n) => T.id(n)) : notes.map((n) => T.id(n)), names: true, forceAcc: true }, { spPx: 11 });
    }
    function react(m) {
      kb.clearMarks();
      const nm = T.keyName(m);
      const lt = T.isBlack(m) ? null : T.letterOf(m);
      switch (o.mode) {
        case 'compare': {
          if (last == null) out.innerHTML = `A sound. Now play another key — further <strong>left</strong> or <strong>right</strong>.`;
          else if (m === last) out.innerHTML = 'The <strong>same</strong> key — the same pitch.';
          else out.innerHTML = m > last ? `<strong>Higher</strong> ↗ — you moved ${m - last} key${m - last > 1 ? 's' : ''} to the right.` : `<strong>Lower</strong> ↘ — you moved ${last - m} key${last - m > 1 ? 's' : ''} to the left.`;
          break;
        }
        case 'name': {
          if (lt) out.innerHTML = `<strong>${lt}</strong> — ${MC.genHelpers.WHERE[lt]}.`;
          else out.innerHTML = `A black key: <strong>${T.keyName(m, false).replace('/', ' or ')}</strong>. (Black-key names come in Module 8.)`;
          kb.setMark(m, 'target', lt || '');
          break;
        }
        case 'group': {
          if (!T.isBlack(m)) { out.innerHTML = 'That is a white key. Try a <strong>black</strong> key — which group is it in?'; break; }
          const g = MC.genHelpers.group(m);
          MC.genHelpers.blacks(o.from, o.to).filter((k) => MC.genHelpers.group(k) === g).forEach((k) => kb.setMark(k, g === 2 ? 'grp2' : 'grp3', String(g)));
          out.innerHTML = `This black key is in a group of <strong>${g === 2 ? 'two' : 'three'}</strong>. All the groups of ${g === 2 ? 'two' : 'three'} are marked — the pattern repeats.`;
          break;
        }
        case 'octave': {
          const same = MC.genHelpers.range(o.from, o.to).filter((k) => T.mod(k - m, 12) === 0);
          same.forEach((k) => kb.setMark(k, k === m ? 'target' : 'hint', T.keyName(k).split('/')[0]));
          out.innerHTML = `<strong>${T.keyName(m)}</strong>${m === 60 ? ' — middle C' : ''}. The other ${lt || 'matching'} keys are marked: each is one <strong>octave</strong> (12 keys) apart and sounds like the “same note”, higher or lower.`;
          if (o.playOctaves) { A.ensure(); same.forEach((k, i) => A.play(k, 0.5, 0.55, A.now() + 0.4 + i * 0.35)); }
          break;
        }
        case 'staff': {
          const n = T.fromMidi(m, o.prefer);
          const clef = o.clef === 'auto' || o.clef === 'grand' ? (m >= 60 ? 'treble' : 'bass') : o.clef;
          const pos = T.staffPos(n, clef);
          out.innerHTML = `<strong>${T.keyName(m)}</strong> — in ${clef} clef: ${T.posDesc(pos)}.`;
          if (stHost) MC.Staff.notes(stHost, { clef: o.clef === 'grand' ? 'grand' : clef, notes: [T.id(n)], names: true, forceAcc: true }, { spPx: 11 });
          kb.setMark(m, 'target', '');
          break;
        }
        case 'distance': {
          if (last == null || last === m) { out.innerHTML = `<strong>${nm}</strong>. Now play a second key to measure the distance.`; kb.setMark(m, 'a', '1'); break; }
          const d = Math.abs(m - last);
          kb.setMark(last, 'a', '1');
          kb.setMark(m, 'b', '2');
          const lo = Math.min(m, last);
          for (let k = lo + 1; k < lo + d; k++) kb.setMark(k, 'hint', '');
          out.innerHTML = `${T.keyName(last, false)} → ${T.keyName(m, false)}: <strong>${d} half step${d > 1 ? 's' : ''}</strong>${d === 1 ? ' (a half step)' : d === 2 ? ' (a whole step)' : ''}.`;
          break;
        }
        case 'interval': {
          if (last == null || last === m || T.isBlack(m) || T.isBlack(last)) { out.innerHTML = `<strong>${nm}</strong>. Play a second <em>white</em> key to name the interval.`; kb.setMark(m, 'a', '1'); if (!T.isBlack(m)) showStaff([m]); break; }
          const a = T.fromMidi(Math.min(last, m)), b = T.fromMidi(Math.max(last, m));
          const n = T.intervalNumber(a, b);
          const path = MC.genHelpers.walk(T.id(a), b);
          kb.setMark(last, 'a', '1');
          kb.setMark(m, 'b', '2');
          out.innerHTML = n <= 8 ? `${path.join(' ')} = <strong>${n} letters → a ${T.INTERVAL_WORD[n]}</strong>` : `${n} letters apart (bigger than an octave).`;
          showStaff([last, m]);
          break;
        }
        default: out.textContent = nm;
      }
      last = m;
    }
    const tools = h('div.toolbar');
    if (o.labelToggle) tools.append(h('span.small.muted', null, 'Labels:'), MC.util.segmented([{ value: 'none', label: 'None' }, { value: 'c', label: 'C only' }, { value: 'white', label: 'Letters' }, { value: 'all', label: 'All' }], o.labels, (v) => kb.setLabels(v), 'Key labels'));
    if (o.groupToggle) tools.append(h('label.check', null, h('input', { type: 'checkbox', onchange: (e) => kb.setGroups(e.target.checked) }), 'Mark black-key groups'));
    wrap.append(tools, out, stHost, kb.el);
    return wrap;
  };

  /* ---------- Sound shapes (pitch / loudness / length) ---------- */
  W.soundShapes = function (sounds) {
    const w = 360, hh = 120;
    const svg = S('svg', { class: 'pitch-graph', viewBox: `0 0 ${w} ${hh}`, role: 'img', 'aria-label': 'Sound shapes: height is pitch, thickness is loudness, length is duration', style: 'height:120px' });
    const ms = sounds.map((s) => s.m);
    const lo = Math.min(...ms) - 4, hi = Math.max(...ms) + 4;
    svg.appendChild(S('line', { x1: 175, x2: 175, y1: 6, y2: hh - 6, class: 'pg-grid' }));
    sounds.forEach((s, i) => {
      const x0 = 20 + i * 180;
      const y = hh - 18 - ((s.m - lo) / (hi - lo)) * (hh - 36);
      const len = 30 + s.d * 60;
      const th = 4 + s.v * 18;
      svg.appendChild(S('rect', { x: x0, y: y - th / 2, width: len, height: th, rx: th / 2, fill: i ? 'var(--lh)' : 'var(--accent)' }));
      svg.appendChild(S('text', { x: x0, y: 14, class: 'pg-axis' }, i ? 'Sound 2' : 'Sound 1'));
    });
    return svg;
  };
  W.soundQualities = function () {
    const wrap = h('div.widget');
    const st = { m: 60, v: 0.6, d: 0.8 };
    const shapeHost = h('div.stage');
    const redraw = () => { MC.util.clear(shapeHost); shapeHost.appendChild(W.soundShapes([st])); };
    const kb = MC.Keyboard({ from: 48, to: 76, labels: 'c', onNote: (ev) => { if (ev.type === 'on') { st.m = ev.midi; redraw(); } } });
    const vol = MC.util.slider('Loudness (how hard you press)', 10, 100, 5, 60, (v) => { st.v = v / 100; A.setVelocity(st.v); redraw(); }, (v) => (v < 35 ? 'soft' : v < 70 ? 'medium' : 'loud'));
    const len = MC.util.segmented([{ value: 0.25, label: 'Short' }, { value: 0.8, label: 'Medium' }, { value: 2.2, label: 'Long' }], st.d, (v) => { st.d = v; redraw(); }, 'Length');
    const play = btn('▶ Play this sound', () => { A.ensure(); A.play(st.m, st.d, st.v); kb.flash(st.m, 'play', st.d * 1000); }, 'btn-primary');
    redraw();
    wrap.append(
      h('p.small.muted', null, 'Choose a key (pitch), a loudness and a length, then play. The shape shows all three: height = pitch, thickness = loudness, length = duration.'),
      h('div.toolbar', null, vol), h('div.toolbar', null, h('span.small.muted', null, 'Length:'), len, play), shapeHost, kb.el,
      h('p.small.muted', null, 'Your own playing: the on-screen and computer keys can’t sense force, so the loudness slider sets how hard each press sounds. Hold a key down for a longer sound; let go to stop it.'));
    MC.util.onCleanup(() => A.setVelocity(0.7));
    return wrap;
  };

  /* ---------- Hands & positions ---------- */
  /* Hand positions: where each hand's five fingers rest. pos = the lowest key of the five. */
  const POSITIONS = {
    rhC: { label: 'Right hand · C', short: 'RH C', hands: [{ hand: 'rh', pos: 'C4' }], range: [53, 76], desc: 'Right thumb (1) on <strong>middle C</strong>; fingers 2–5 rest on D, E, F and G.' },
    lhC: { label: 'Left hand · C', short: 'LH C', hands: [{ hand: 'lh', pos: 'C3' }], range: [41, 64], desc: 'Left little finger (5) on the <strong>C below middle C</strong>; the thumb (1) rests on G, pointing toward middle C.' },
    bothC: { label: 'Both hands · C', short: 'Both C', hands: [{ hand: 'lh', pos: 'C3' }, { hand: 'rh', pos: 'C4' }], range: [48, 67], desc: 'Hands one octave apart: left hand on C3–G3, right hand on C4–G4. The thumbs face each other.' },
    midC: { label: 'Middle C position', short: 'Middle C', hands: [{ hand: 'lh', pos: 'F3' }, { hand: 'rh', pos: 'C4' }], range: [50, 69], desc: 'Both thumbs share <strong>middle C</strong>. Left hand: F G A B C (fingers 5 → 1). Right hand: C D E F G (fingers 1 → 5).' },
    rhG: { label: 'Right hand · G', short: 'RH G', hands: [{ hand: 'rh', pos: 'G4' }], range: [60, 81], desc: 'Right thumb (1) on the <strong>G above middle C</strong>; fingers rest on G A B C D.' },
    lhG: { label: 'Left hand · G', short: 'LH G', hands: [{ hand: 'lh', pos: 'G2' }], range: [36, 57], desc: 'Left little finger (5) on <strong>G2</strong>, the second G below middle C; fingers rest on G A B C D, thumb on D3.' },
  };
  W.POSITIONS = POSITIONS;
  const fingerMap = (hand, pos, key) => { const m = {}; [1, 2, 3, 4, 5].forEach((f) => { m[f] = MC.genHelpers.positionNote(hand, pos, f, key).midi; }); return m; };
  const handWord = (hand) => (hand === 'rh' ? 'Right' : 'Left');

  W.handExplore = function () {
    const wrap = h('div.widget');
    const out = h('div.readout', { 'aria-live': 'polite' }, 'Click any finger on the diagram — or play a key under the hands.');
    const kb = MC.Keyboard({ from: 45, to: 69, labels: 'white', ownsInput: true, minKeyPx: 26, onNote: (ev) => { if (ev.type === 'on') fromKey(ev.midi); } });
    const maps = { lh: fingerMap('lh', 'C3'), rh: fingerMap('rh', 'C4') };
    kb.setHands([{ hand: 'lh', fingers: maps.lh }, { hand: 'rh', fingers: maps.rh }]);
    let timer = null;
    const show = (hand, f, sound) => {
      rh.set(hand === 'rh' ? f : null); lh.set(hand === 'lh' ? f : null);
      const m = maps[hand][f];
      kb.clearMarks();
      kb.setMark(m, hand === 'rh' ? 'target' : 'lh', '');
      kb.pressFinger(null); kb.pressFinger(m, true);
      clearTimeout(timer);
      timer = setTimeout(() => kb.pressFinger(m, false), 650);
      if (sound) { A.ensure(); A.play(m, 0.6); }
      out.innerHTML = `<strong>${handWord(hand)} hand, finger ${f}</strong> (${MC.Hand.FNAME[f]}). In C position it plays <strong>${T.keyName(m, false)}</strong>${m === 60 ? ' — middle C' : ''}.`;
    };
    const fromKey = (m) => {
      const hit = ['lh', 'rh'].map((hd) => [hd, Object.keys(maps[hd]).find((f) => maps[hd][f] === m)]).find(([, f]) => f);
      if (hit) show(hit[0], +hit[1], false);
      else out.innerHTML = `${T.keyName(m, false)} — no finger rests on this key in C position. Try a key under the hands.`;
    };
    const lh = MC.Hand('lh', { onFinger: (f) => show('lh', f, true) });
    const rh = MC.Hand('rh', { onFinger: (f) => show('rh', f, true) });
    wrap.append(h('div.hands', null, lh.el, rh.el), out, kb.el, h('p.small.muted', null, 'Try it away from the screen too: rest your hands on a table and tap “1 2 3 4 5” with each hand, then “5 4 3 2 1”.'));
    MC.util.onCleanup(() => clearTimeout(timer));
    return wrap;
  };

  /* Hands on the keyboard in one or more positions, with patterns to watch and a "try it" readout. */
  W.handPosition = function (o) {
    o = Object.assign({ positions: ['rhC', 'lhC', 'bothC', 'midC', 'rhG', 'lhG'], start: null, patterns: true }, o);
    const wrap = h('div.widget.hand-position');
    let cur = o.start || o.positions[0];
    let maps = [];
    const kb = MC.Keyboard({ from: 36, to: 84, labels: 'white', minKeyPx: 26, onNote: (ev) => { if (ev.type === 'on') fromKey(ev.midi); } });
    const out = h('div.readout', { 'aria-live': 'polite' });
    const legend = h('div.finger-map');
    const pats = h('div.toolbar');
    let tr = null;
    const stop = () => { if (tr) tr.stop(true); tr = null; kb.pressFinger(null); kb.clearMarks('play'); };
    const describe = () => POSITIONS[cur].desc;
    const apply = () => {
      stop();
      const P = POSITIONS[cur];
      maps = P.hands.map((x) => ({ hand: x.hand, fingers: fingerMap(x.hand, x.pos, x.key) }));
      kb.setRange(P.range[0], P.range[1]);
      kb.clearMarks();
      maps.forEach((mp) => Object.values(mp.fingers).forEach((m) => kb.setMark(m, mp.hand === 'lh' ? 'lh' : 'rh', '')));
      kb.setHands(maps);
      out.innerHTML = describe();
      MC.util.clear(legend);
      maps.forEach((mp) => legend.appendChild(h('div.fm-row.' + mp.hand, null, h('span.fm-hand', null, handWord(mp.hand) + ' hand'),
        ...(mp.hand === 'lh' ? [5, 4, 3, 2, 1] : [1, 2, 3, 4, 5]).map((f) => h('span.fm-cell', null, h('span.fm-f', null, String(f)), h('span.fm-n', null, T.keyName(mp.fingers[f], false)))))));
      renderPatterns();
    };
    const play = (seq, label) => {
      stop();
      A.ensure();
      const evs = seq.map((st, i) => ({ t: i, d: 1, midis: st, i }));
      let prev = [];
      tr = new A.Transport({ bpm: 92, events: evs, end: evs.length, onEvent: (e) => {
        prev.forEach((m) => kb.pressFinger(m, false));
        kb.clearMarks('play');
        e.midis.forEach((m) => { kb.setMark(m, 'play', ''); kb.pressFinger(m, true); });
        prev = e.midis;
        out.innerHTML = `${label}: ${e.midis.map((m) => { const who = maps.map((mp) => { const f = Object.keys(mp.fingers).find((k) => mp.fingers[k] === m); return f ? `${handWord(mp.hand)[0]}H <strong>${f}</strong>` : null; }).filter(Boolean).join(' / '); return `${who} → ${T.keyName(m, false)}`; }).join(' + ')}`;
      }, onEnd: () => { stop(); out.innerHTML = describe(); } });
      tr.play(0);
    };
    const seqFor = (mp, fs) => fs.map((f) => [mp.fingers[f]]);
    function renderPatterns() {
      MC.util.clear(pats);
      if (!o.patterns) return;
      pats.append(h('span.small.muted', null, 'Watch:'));
      maps.forEach((mp) => {
        const up = mp.hand === 'rh' ? [1, 2, 3, 4, 5, 4, 3, 2, 1] : [5, 4, 3, 2, 1, 2, 3, 4, 5];
        pats.append(btn(`${handWord(mp.hand)}: ${up.slice(0, 5).join(' ')}…`, () => play(seqFor(mp, up), `${handWord(mp.hand)} hand`), 'btn-small'));
      });
      if (maps.length === 2) {
        const lhm = maps.find((x) => x.hand === 'lh'), rhm = maps.find((x) => x.hand === 'rh');
        if (cur === 'midC') pats.append(btn('Across both hands: F → G', () => play([5, 4, 3, 2, 1].map((f) => [lhm.fingers[f]]).concat([2, 3, 4, 5].map((f) => [rhm.fingers[f]])), 'Hand to hand'), 'btn-small'));
        else pats.append(btn('Together, mirror: 1 2 3 4 5', () => play([1, 2, 3, 4, 5, 4, 3, 2, 1].map((f) => [lhm.fingers[f], rhm.fingers[f]]), 'Both hands'), 'btn-small'));
      }
      pats.append(btn('■ Stop', stop, 'btn-small btn-quiet'));
    }
    const fromKey = (m) => {
      if (tr && tr.playing) return;
      const who = maps.map((mp) => { const f = Object.keys(mp.fingers).find((k) => mp.fingers[k] === m); return f ? `${handWord(mp.hand).toLowerCase()} hand finger <strong>${f}</strong> (${MC.Hand.FNAME[f]})` : null; }).filter(Boolean);
      out.innerHTML = who.length ? `<strong>${T.keyName(m, false)}</strong>${m === 60 ? ' (middle C)' : ''} — played by the ${who.join(' or the ')}.` : `<strong>${T.keyName(m, false)}</strong> is outside this position. To reach it, the hand would have to move — that is called a <em>shift</em>.`;
    };
    const tabs = o.positions.length > 1 ? MC.util.segmented(o.positions.map((k) => ({ value: k, label: POSITIONS[k].label })), cur, (v) => { cur = v; apply(); }, 'Hand position') : null;
    wrap.append(tabs, out, kb.el, legend, pats);
    MC.util.onCleanup(stop);
    requestAnimationFrame(apply);
    return wrap;
  };

  W.positionExplore = function (o) {
    o = Object.assign({ positions: [{ hand: 'rh', pos: 'C4', label: 'Right hand — C position' }, { hand: 'lh', pos: 'C3', label: 'Left hand — C position' }] }, o);
    const wrap = h('div.widget');
    let cur = o.positions[0];
    const kb = MC.Keyboard({ from: 41, to: 76, labels: 'white', minKeyPx: 26 });
    const out = h('div.readout', { 'aria-live': 'polite' });
    const apply = () => {
      const notes = [1, 2, 3, 4, 5].map((f) => MC.genHelpers.positionNote(cur.hand, cur.pos, f, cur.key));
      const map = {};
      notes.forEach((n, i) => { map[i + 1] = n.midi; });
      kb.clearMarks();
      notes.forEach((n) => kb.setMark(n.midi, cur.hand === 'lh' ? 'lh' : 'rh', ''));
      kb.setHands([{ hand: cur.hand, fingers: map }]);
      out.innerHTML = `${cur.label}: ${notes.map((n, i) => `<strong>${i + 1}</strong>=${T.name(n, false)}`).join(' · ')}. One finger per key.`;
      return notes;
    };
    let notes = [];
    const seg = MC.util.segmented(o.positions.map((p, i) => ({ value: i, label: p.label })), 0, (v) => { cur = o.positions[v]; notes = apply(); }, 'Position');
    let tr = null;
    const play = (fingers) => {
      if (tr) tr.stop(true);
      const evs = fingers.map((f, i) => ({ t: i, d: 1, midis: [notes[f - 1].midi], f }));
      tr = new A.Transport({ bpm: 88, events: evs, end: evs.length, onEvent: (e) => { kb.clearMarks('play'); kb.pressFinger(null); kb.setMark(e.midis[0], 'play', ''); kb.pressFinger(e.midis[0], true); out.innerHTML = `Finger <strong>${e.f}</strong> → ${T.name(notes[e.f - 1])}`; }, onEnd: () => { kb.clearMarks('play'); kb.pressFinger(null); apply(); } });
      A.ensure(); tr.play(0);
    };
    wrap.append(seg,
      h('div.toolbar', null, h('span.small.muted', null, 'Watch a pattern:'), btn('1 2 3 4 5', () => play([1, 2, 3, 4, 5])), btn('5 4 3 2 1', () => play([5, 4, 3, 2, 1])), btn('1 3 5 3 1', () => play([1, 3, 5, 3, 1])), btn('1 2 1 3 1 4 1 5', () => play([1, 2, 1, 3, 1, 4, 1, 5]))),
      out, kb.el);
    requestAnimationFrame(() => { notes = apply(); });
    MC.util.onCleanup(() => tr && tr.stop(true));
    return wrap;
  };
  W.posture = function () {
    const items = [
      ['Sit on the front half of the bench or chair, centred in front of middle C.', 'Being centred lets both hands reach equally.'],
      ['Feet flat on the floor; back tall but not stiff; shoulders loose.', 'Tension in the shoulders travels down to your fingers.'],
      ['Elbows about level with the keys; forearms roughly parallel to the floor.', 'If your wrists have to bend up or down, adjust the seat height.'],
      ['Hands gently rounded — as if resting on a small ball or holding an egg.', 'Curved fingers let each fingertip meet the key.'],
      ['Play on the pads of the fingertips; thumb plays on its side.', 'Flat fingers are weaker and less controlled.'],
      ['Wrist level with the back of the hand, loose, not collapsed.', 'Let the wrist be a flexible bridge, not a hinge you lock.'],
      ['Breathe. Stop and shake out your hands if anything feels tight.', 'Pain is a signal to stop, rest, and check your position.'],
    ];
    const wrap = h('div.widget');
    wrap.appendChild(h('p.small.muted', null, 'A checklist for a real piano, keyboard, or even a table. This app cannot see your posture — only you (or a teacher) can check it.'));
    const list = h('div.posture');
    items.forEach(([t, why], i) => list.appendChild(h('label', null, h('input', { type: 'checkbox', 'aria-describedby': 'pw' + i }), h('span', null, h('strong', null, t), h('br'), h('span.small.muted', { id: 'pw' + i }, why)))));
    wrap.appendChild(list);
    return wrap;
  };

  /* ---------- Metronome ---------- */
  W.metronome = (o) => MC.Metronome(o || {}).el;

  /* ---------- Rhythm builder: build a measure from blocks or notes, then hear it ---------- */
  W.rhythmBuilder = function (o) {
    o = Object.assign({ beats: 4, notation: false, values: [1, 2, 4, -1], bpm: 76 }, o);
    const wrap = h('div.widget');
    let pat = o.start ? o.start.slice() : [];
    const total = () => pat.reduce((a, x) => a + Math.abs(x), 0);
    const tlHost = h('div');
    const stHost = h('div.stage.stage-tight.staff-wrap');
    const info = h('div.caption', { 'aria-live': 'polite' });
    let tl = null;
    let tr = null;
    const label = (x) => ({ 4: 'Whole (4)', 2: 'Half (2)', 1: 'Quarter (1)', 0.5: '½ + ½ (eighths)', 3: 'Dotted half (3)', '-1': 'Quarter rest (1)', '-2': 'Half rest (2)' }[x]);
    const render = () => {
      MC.util.clear(tlHost);
      const len = Math.max(o.beats, Math.ceil(total() / o.beats) * o.beats);
      tl = MC.Timeline({ beats: len, beatsPerBar: o.beats, blocks: MC.genHelpers.patternBlocks(pat), counts: pat.includes(0.5) ? 'and' : 'beats' });
      tlHost.appendChild(tl.el);
      if (o.notation) {
        const full = Math.abs(total() - o.beats) < 1e-6;
        if (pat.length) MC.Staff.render(stHost, MC.genHelpers.patternScore(pat, o.beats, true), { showCounts: true, spPx: 11, finalBar: full });
        else stHost.innerHTML = '<p class="small muted">Add notes to see them written here.</p>';
      }
      const t = total();
      info.innerHTML = t === o.beats ? `<strong>Complete:</strong> exactly ${o.beats} beats. Press Play to hear it with the count.` : t < o.beats ? `${t} of ${o.beats} beats so far — ${o.beats - t} to go.` : `Too many: ${t} beats in a ${o.beats}-beat measure.`;
    };
    const add = (x) => {
      const d = Math.abs(x === 0.5 ? 1 : x);
      if (total() + d > o.beats + 1e-6) { info.innerHTML = `That would make ${total() + d} beats — more than ${o.beats}. Remove something or choose a shorter value.`; return; }
      if (x === 0.5) pat.push(0.5, 0.5); else pat.push(x);
      render();
    };
    const play = () => {
      if (tr) tr.stop(true);
      A.ensure();
      let t = 0;
      const events = [];
      pat.forEach((x) => { if (x > 0) events.push({ t, d: x, midis: [72], vel: 0.7 }); t += Math.abs(x); });
      tr = new A.Transport({ bpm: o.bpm, events, beatsPerBar: o.beats, metronome: true, countIn: o.beats, end: Math.max(t, o.beats), onTick: (b) => tl.setPlayhead(b >= 0 ? b : null), onEnd: () => tl.setPlayhead(null) });
      tr.play();
    };
    const tools = h('div.toolbar', null, ...o.values.map((x) => btn('+ ' + label(x), () => add(x), 'btn-small')));
    wrap.append(h('p.small.muted', null, `Fill a ${o.beats}-beat measure. Each block starts a sound (or a silence, for rests); its length shows how many beats it lasts.`), tools,
      h('div.toolbar', null, btn('▶ Play with count-in', play, 'btn-primary'), btn('Undo', () => { pat.pop(); if (pat[pat.length - 1] === 0.5 && pat.filter((x) => x === 0.5).length % 2) pat.pop(); render(); }), btn('Clear', () => { pat = []; render(); })),
      tlHost, o.notation ? stHost : null, info);
    MC.util.onCleanup(() => tr && tr.stop(true));
    requestAnimationFrame(render);
    return wrap;
  };

  /* ---------- Staff explorer: click lines/spaces or keys; staff, keyboard and sound stay in sync ---------- */
  W.staffExplore = function (o) {
    o = Object.assign({ clef: 'treble', names: true, landmarks: false, from: null, to: null }, o);
    const wrap = h('div.widget');
    const out = h('div.readout', { 'aria-live': 'polite' }, o.clef ? 'Click a line or space on the staff — or play a key.' : 'Click a line or a space on the staff.');
    const clefs = o.clef === 'grand' ? ['treble', 'bass'] : [o.clef || 'treble'];
    const pickers = {};
    const row = h('div.row', { style: { alignItems: 'flex-start' } });
    const from = o.from || (o.clef === 'bass' ? 36 : o.clef === 'grand' ? 43 : 57);
    const to = o.to || (o.clef === 'bass' ? 64 : o.clef === 'grand' ? 81 : 84);
    const kb = MC.Keyboard({ from, to, labels: o.keyLabels || 'c', onNote: (ev) => { if (ev.type === 'on') fromKey(ev.midi); } });
    const describe = (n, clef, pos) => {
      if (!o.clef) return `${pos % 2 === 0 ? 'A line' : 'A space'}: <strong>${T.posDesc(pos)}</strong>${pos >= 0 && pos <= 8 ? '' : ' (outside the five lines — needs a ledger line)'}. Without a clef, we can’t name it yet — but higher on the staff always means higher in pitch.`;
      const lm = MC.genHelpers.nearestLandmark(n, clef);
      return `<strong>${T.name(n)}</strong> — ${clef} clef, ${T.posDesc(pos)}. ${lm && lm.dd !== 0 ? `(${Math.abs(lm.dd)} step${Math.abs(lm.dd) > 1 ? 's' : ''} ${lm.dd > 0 ? 'below' : 'above'} ${lm.label})` : lm ? `(landmark: ${lm.label})` : ''}`;
    };
    const fromStaff = (clef, pos) => {
      const n = T.fromPos(pos, o.clef ? clef : 'treble');
      Object.entries(pickers).forEach(([c, p]) => { p.clear(); if (c === clef) p.show(pos, 'target', o.clef && o.names ? T.name(n, false) : ''); });
      A.ensure(); A.play(n.midi, 0.8);
      kb.clearMarks();
      if (o.clef) kb.setMark(n.midi, 'target', T.name(n, false));
      out.innerHTML = describe(n, clef, pos);
      if (o.clef === 'grand' && n.midi === 60) out.innerHTML += ' Middle C can be written in <em>either</em> staff — it is the same key.';
    };
    const fromKey = (m) => {
      if (!o.clef) return;
      const n = T.fromMidi(m);
      let clef = clefs.length > 1 ? (m >= 60 ? 'treble' : 'bass') : clefs[0];
      const pos = T.staffPos(n, clef);
      kb.clearMarks();
      kb.setMark(m, 'target', T.name(n, false));
      Object.values(pickers).forEach((p) => p.clear());
      if (pos < -4 || pos > 12) { out.innerHTML = `${T.keyName(m)} is too far from this staff to show comfortably.`; return; }
      if (T.isBlack(m)) {
        pickers[clef].show(pos, 'target', T.name(n, false));
        out.innerHTML = `<strong>${T.keyName(m)}</strong>: a black key, written with a sharp or flat sign (Module 8). Shown here at the ${n.letter} position.`;
        return;
      }
      pickers[clef].show(pos, 'target', o.names ? T.name(n, false) : '');
      if (clefs.length > 1 && m === 60) { pickers.bass.show(T.staffPos(n, 'bass'), 'target', 'C'); }
      out.innerHTML = describe(n, clef, pos);
    };
    clefs.forEach((c) => {
      const host = h('div.stage');
      pickers[c] = MC.Staff.picker(host, { clef: c, minPos: -3, maxPos: 11, width: 15, spPx: 12, onPick: (pos) => fromStaff(c, pos) });
      if (!o.clef) { const cl = pickers[c].svg.querySelector('.clef'); if (cl) cl.remove(); }
      if (o.landmarks) {
        (c === 'treble' ? ['C4', 'G4', 'C5'] : ['C3', 'F3', 'C4']).forEach((id) => pickers[c].addMark(T.staffPos(id, c), 'landmark', ({ C3: 'Low C', F3: 'Bass F', C4: 'Middle C', G4: 'Treble G', C5: 'High C' })[id]));
      }
      row.appendChild(host);
    });
    wrap.append(out, row, o.clef ? kb.el : null);
    if (!o.clef) kb.destroy();
    return wrap;
  };

  /* ---------- Landmarks on the grand staff ---------- */
  W.landmarks = function () {
    const wrap = h('div.widget');
    const out = h('div.readout', { 'aria-live': 'polite' }, 'Click a landmark note to hear it and see its key.');
    const stHost = h('div.stage.staff-wrap');
    const kb = MC.Keyboard({ from: 43, to: 79, labels: 'c' });
    const lms = [{ n: 'C3', staff: 1 }, { n: 'F3', staff: 1 }, { n: 'C4', staff: 1 }, { n: 'C4', staff: 0 }, { n: 'G4', staff: 0 }, { n: 'C5', staff: 0 }];
    requestAnimationFrame(() => {
      MC.Staff.notes(stHost, { clef: 'grand', notes: lms, names: true, spacing: 6 }, { spPx: 10.5, onNoteClick: (ev) => {
        const n = ev.notes[0];
        const lm = T.LANDMARKS.find((l) => l.id === T.id(n));
        A.ensure(); A.play(n.midi, 0.9);
        kb.clearMarks(); kb.setMark(n.midi, 'target', lm ? lm.label : T.name(n));
        out.innerHTML = lm ? `<strong>${lm.label} (${T.name(n)})</strong>: ${lm.where}.` : T.name(n);
      } });
    });
    wrap.append(out, stHost, kb.el);
    return wrap;
  };

  /* ---------- Note values ---------- */
  W.noteValues = function (o) {
    o = Object.assign({ values: ['w', 'h', 'q', 'e'], dotted: false }, o);
    const wrap = h('div.widget');
    const V = { w: [4, 'Whole note', 'hollow oval, no stem'], h: [2, 'Half note', 'hollow oval with a stem'], q: [1, 'Quarter note', 'filled oval with a stem'], e: [0.5, 'Eighth note', 'filled oval, stem and a flag (or a beam joining two)'], 'h.': [3, 'Dotted half note', 'half note plus a dot: 2 + 1'] };
    const R = { w: 'whole rest — hangs below line 4', h: 'half rest — sits on line 3', q: 'quarter rest', e: 'eighth rest' };
    let cur = o.values[0];
    const stHost = h('div.stage.stage-tight');
    const tlHost = h('div');
    const out = h('div.readout', { 'aria-live': 'polite' });
    let tr = null, tl = null;
    const render = () => {
      const [beats, name, look] = V[cur];
      const dots = cur.includes('.') ? 1 : 0;
      const k = cur.replace('.', '');
      MC.Staff.notes(stHost, { clef: 'treble', notes: [{ n: 'B4', dur: k, dots }, ...(R[k] && !dots ? [{ n: 'r', rest: true, dur: k }] : [])], spacing: 7 }, { spPx: 13 });
      MC.util.clear(tlHost);
      const count = Math.max(4, beats);
      tl = MC.Timeline({ beats: count, beatsPerBar: 4, blocks: [{ t: 0, d: beats, label: name }], counts: beats === 0.5 ? 'and' : 'beats' });
      tlHost.appendChild(tl.el);
      out.innerHTML = `<strong>${name}</strong> = ${beats === 0.5 ? '½ beat' : beats + ' beat' + (beats > 1 ? 's' : '')} (in 4/4). Looks like: ${look}.${R[k] && !dots ? ` Next to it: the matching <strong>${R[k]}</strong>, which is silent for the same length.` : ''}`;
    };
    const play = () => {
      if (tr) tr.stop(true);
      A.ensure();
      const beats = V[cur][0];
      tr = new A.Transport({ bpm: 72, events: [{ t: 0, d: beats, midis: [71], vel: 0.7 }], metronome: true, countIn: 4, beatsPerBar: 4, end: Math.max(4, beats), onTick: (b) => tl && tl.setPlayhead(b >= 0 ? b : null), onEnd: () => tl && tl.setPlayhead(null) });
      tr.play();
    };
    const vals = o.values.concat(o.dotted ? ['h.'] : []);
    wrap.append(MC.util.segmented(vals.map((v) => ({ value: v, label: V[v][1] })), cur, (v) => { cur = v; render(); }, 'Note value'),
      h('div.toolbar', null, btn('▶ Hear it against the beat', play, 'btn-primary'), h('span.small.muted', null, 'Four clicks to count in, then the note, with clicks continuing.')),
      stHost, tlHost, out);
    MC.util.onCleanup(() => tr && tr.stop(true));
    requestAnimationFrame(render);
    return wrap;
  };

  /* ---------- Time signatures: same notes grouped in 4 vs 3 ---------- */
  W.timeSignatures = function () {
    const wrap = h('div.widget');
    const pieces = {
      4: { key: 'C', time: [4, 4], tempo: 84, staves: [{ clef: 'treble', voice: 'C4q D4q E4q F4q | G4h E4h | F4q E4q D4q E4q | C4w' }] },
      3: { key: 'C', time: [3, 4], tempo: 96, staves: [{ clef: 'treble', voice: 'C4q E4q G4q | G4h E4q | F4q D4q B3q | C4h.' }] },
    };
    let cur = 4;
    const host = h('div');
    const render = () => {
      MC.util.clear(host);
      host.appendChild(h('p.small', { html: cur === 4 ? '<strong>4/4</strong>: top number 4 = four beats in every measure; bottom number 4 = a quarter note gets one beat. Feel: <strong>STRONG</strong> weak medium weak.' : '<strong>3/4</strong>: three beats per measure, quarter note = one beat. Feel: <strong>STRONG</strong> weak weak — the feel of a waltz. The dotted half note fills a whole 3/4 measure.' }));
      const pl = MC.PiecePlayer(Object.assign({ id: 'ts' + cur, title: cur === 4 ? 'In 4/4' : 'In 3/4' }, pieces[cur]), { modes: ['watch'], mode: 'watch', names: true, showInfo: false });
      host.appendChild(pl.el);
      host.appendChild(h('p.small.muted', null, 'Tip: turn on the metronome in the player — the first click of every measure is higher.'));
    };
    wrap.append(MC.util.segmented([{ value: 4, label: '4/4 time' }, { value: 3, label: '3/4 time' }], cur, (v) => { cur = v; render(); }, 'Time signature'), host);
    render();
    return wrap;
  };

  /* ---------- Piece player ---------- */
  W.piece = function (o) {
    const piece = MC.pieces[o.id];
    if (!piece) return h('p', null, 'Missing piece: ' + o.id);
    return MC.PiecePlayer(piece, o).el;
  };
  W.pieceChooser = function (o) {
    const wrap = h('div.widget');
    const ids = o.ids;
    const host = h('div');
    let cur = ids[0];
    const render = () => { MC.util.clear(host); host.appendChild(MC.PiecePlayer(MC.pieces[cur], Object.assign({}, o.player || {})).el); };
    wrap.append(MC.util.segmented(ids.map((id) => ({ value: id, label: MC.pieces[id].short || MC.pieces[id].title })), cur, (v) => { cur = v; render(); }, 'Choose a piece'), host);
    render();
    return wrap;
  };

  /* ---------- Accidentals ---------- */
  W.accidentals = function () {
    const wrap = h('div.widget');
    const st = { letter: 'F', acc: 1 };
    const stHost = h('div.stage.stage-tight.staff-wrap');
    const out = h('div.readout', { 'aria-live': 'polite' });
    const kb = MC.Keyboard({ from: 55, to: 79, labels: 'white', onNote: (ev) => { if (ev.type === 'on' && T.isBlack(ev.midi)) { const s = T.fromMidi(ev.midi, 'sharp'); st.letter = s.letter; st.acc = 1; update(false); } else if (ev.type === 'on') { st.letter = T.letterOf(ev.midi); st.acc = 0; update(false); } } });
    const update = (sound) => {
      const n = T.note(st.letter, st.acc, 4);
      MC.Staff.notes(stHost, { clef: 'treble', notes: [T.id(n)], names: true, forceAcc: st.acc !== 0 }, { spPx: 13 });
      kb.clearMarks();
      kb.setMark(n.midi, 'target', T.name(n, false));
      if (st.acc === 0 && !['E', 'B'].includes(st.letter)) kb.setMark(n.midi + 1, 'hint', '♯');
      if (st.acc === 0 && !['C', 'F'].includes(st.letter)) kb.setMark(n.midi - 1, 'hint', '♭');
      if (sound) { A.ensure(); A.play(n.midi, 0.8); }
      const other = T.isBlack(n.midi) ? T.fromMidi(n.midi, st.acc > 0 ? 'flat' : 'sharp') : null;
      const special = !T.isBlack(n.midi) && st.acc !== 0 ? ` Note: ${T.name(n, false)} lands on a <em>white</em> key — the same key as ${T.name(T.fromMidi(n.midi), false)}.` : '';
      out.innerHTML = st.acc === 0 ? `<strong>${st.letter}</strong> (natural): the plain white key. ♮ cancels an earlier sharp or flat.` : `<strong>${T.name(n, false)}</strong>: ${st.letter} moved one half step ${st.acc > 0 ? 'up (right)' : 'down (left)'}.${other ? ` The same key is also called <strong>${T.name(other, false)}</strong> — an <em>enharmonic</em> name.` : ''}${special}`;
    };
    const letters = MC.util.segmented('CDEFGAB'.split('').map((l) => ({ value: l, label: l })), st.letter, (v) => { st.letter = v; update(true); }, 'Letter');
    const accs = MC.util.segmented([{ value: -1, label: '♭ flat' }, { value: 0, label: '♮ natural' }, { value: 1, label: '♯ sharp' }], st.acc, (v) => { st.acc = v; update(true); }, 'Accidental');
    wrap.append(h('div.toolbar', null, letters), h('div.toolbar', null, accs), stHost, out, kb.el);
    requestAnimationFrame(() => update(false));
    return wrap;
  };

  /* ---------- Scale builder ---------- */
  W.scaleBuilder = function (o) {
    o = Object.assign({ tonics: ['C4', 'G4', 'F4'] }, o);
    const wrap = h('div.widget');
    let tonic = o.tonics[0];
    const stHost = h('div.stage.stage-tight.staff-wrap');
    const out = h('div.readout', { 'aria-live': 'polite' });
    const kb = MC.Keyboard({ from: 53, to: 84, labels: 'white' });
    let tr = null;
    const steps = ['W', 'W', 'H', 'W', 'W', 'W', 'H'];
    const render = () => {
      const sc = T.majorScale(tonic);
      kb.clearMarks();
      sc.forEach((n, i) => kb.setMark(n.midi, i === 0 || i === 7 ? 'target' : 'hint', String(i + 1)));
      const withSig = sigToggle.querySelector('input').checked;
      const key = { C4: 'C', G4: 'G', F4: 'F', D4: 'D' }[tonic];
      MC.Staff.notes(stHost, { clef: 'treble', key: withSig ? key : 'C', notes: sc.map((n) => ({ n: T.id(n), dur: 'q' })), names: true }, { spPx: 11 });
      out.innerHTML = `${sc.map((n, i) => `${T.name(n, false)}${i < 7 ? ` <span class="muted small">${steps[i]}</span>` : ''}`).join(' ')}<br><span class="small">${key === 'C' ? 'No black keys needed.' : key === 'G' ? 'The pattern needs <strong>F♯</strong> (a half step below G) at step 7.' : key === 'F' ? 'The pattern needs <strong>B♭</strong> (a half step above A) at step 4.' : 'Two sharps: F♯ and C♯.'} ${withSig && key !== 'C' ? 'With the key signature, the ♯/♭ is written once at the start instead of on every note.' : ''}</span>`;
      return sc;
    };
    const play = () => {
      if (tr) tr.stop(true);
      const sc = T.majorScale(tonic);
      const seq = sc.concat(sc.slice(0, 7).reverse());
      tr = new A.Transport({ bpm: 120, events: seq.map((n, i) => ({ t: i, d: 1, midis: [n.midi], i })), end: seq.length, onEvent: (e) => { kb.clearMarks('play'); kb.setMark(e.midis[0], 'play', ''); }, onEnd: () => kb.clearMarks('play') });
      A.ensure(); tr.play(0);
    };
    const sigToggle = h('label.check', null, h('input', { type: 'checkbox', onchange: () => render() }), 'Use a key signature');
    wrap.append(h('div.toolbar', null, MC.util.segmented(o.tonics.map((t) => ({ value: t, label: T.KEYS[{ C4: 'C', G4: 'G', F4: 'F', D4: 'D' }[t]].name })), tonic, (v) => { tonic = v; render(); }, 'Scale'), btn('▶ Play up and down', play, 'btn-primary'), sigToggle), out, stHost, kb.el);
    MC.util.onCleanup(() => tr && tr.stop(true));
    requestAnimationFrame(render);
    return wrap;
  };

  /* ---------- Chord builder ---------- */
  W.chordBuilder = function (o) {
    o = Object.assign({ roots: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'] }, o);
    const wrap = h('div.widget');
    const st = { root: o.roots[0], q: 'major' };
    const stHost = h('div.stage.stage-tight.staff-wrap');
    const out = h('div.readout', { 'aria-live': 'polite' });
    const kb = MC.Keyboard({ from: 55, to: 84, labels: 'white' });
    const render = (sound) => {
      const ns = T.triad(st.root, st.q);
      kb.clearMarks();
      ns.forEach((n, i) => kb.setMark(n.midi, 'target', ['root', '3rd', '5th'][i]));
      for (let m = ns[0].midi + 1; m < ns[1].midi; m++) kb.setMark(m, 'hint', '');
      MC.Staff.notes(stHost, { clef: 'treble', notes: [{ chord: ns.map((n) => T.id(n)) }, ...ns.map((n) => ({ n: T.id(n), dur: 'q' }))], names: true, forceAcc: true }, { spPx: 11 });
      const a = ns[1].midi - ns[0].midi, b = ns[2].midi - ns[1].midi;
      out.innerHTML = `<strong>${T.chordLongName(st.root, st.q)}</strong> = ${ns.map((n) => T.name(n, false)).join(' – ')}. Root → 3rd: <strong>${a}</strong> half steps; 3rd → 5th: <strong>${b}</strong>. ${st.q === 'major' ? 'Major = 4 + 3.' : 'Minor = 3 + 4 — only the middle note moved down a half step.'}`;
      if (sound) { A.ensure(); const t0 = A.now() + 0.05; ns.forEach((n) => A.play(n.midi, 1.1, 0.6, t0)); ns.forEach((n, i) => A.play(n.midi, 0.45, 0.6, t0 + 1.3 + i * 0.4)); }
    };
    wrap.append(
      h('div.toolbar', null, h('span.small.muted', null, 'Root:'), MC.util.segmented(o.roots.map((r) => ({ value: r, label: T.name(T.parse(r), false) })), st.root, (v) => { st.root = v; render(true); }, 'Root note')),
      h('div.toolbar', null, MC.util.segmented([{ value: 'major', label: 'Major' }, { value: 'minor', label: 'Minor' }], st.q, (v) => { st.q = v; render(true); }, 'Quality'), btn('▶ Play: together, then one by one', () => render(true), 'btn-primary')),
      out, stHost, kb.el);
    requestAnimationFrame(() => render(false));
    return wrap;
  };

  /* ---------- Expression: same phrase with different dynamics & articulation ---------- */
  W.expression = function () {
    const wrap = h('div.widget');
    const st = { dyn: 'mf', art: 'legato', hair: 'none' };
    const host = h('div');
    const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'F4', 'E4', 'D4'];
    const render = () => {
      let toks = notes.map((n) => n + 'q' + (st.art === 'staccato' ? '*' : ''));
      toks[0] += '@' + st.dyn;
      if (st.art === 'legato') { toks[0] = '(' + toks[0]; toks[3] += ')'; toks[4] = '(' + toks[4]; toks[7] += ')'; }
      let voice = toks.slice(0, 4).join(' ') + ' | ' + toks.slice(4).join(' ');
      if (st.hair !== 'none') voice = (st.hair === 'cresc' ? '< ' : '> ') + voice + ' !';
      MC.util.clear(host);
      host.appendChild(MC.PiecePlayer({ id: 'expr', title: 'Expression study', key: 'C', time: [4, 4], tempo: 88, staves: [{ clef: 'treble', voice }] }, { modes: ['watch'], mode: 'watch', names: false, showInfo: false }).el);
    };
    wrap.append(
      h('div.toolbar', null, h('span.small.muted', null, 'Dynamic:'), MC.util.segmented(['p', 'mp', 'mf', 'f'].map((d) => ({ value: d, label: d })), st.dyn, (v) => { st.dyn = v; render(); }, 'Dynamic')),
      h('div.toolbar', null, h('span.small.muted', null, 'Change:'), MC.util.segmented([{ value: 'none', label: 'Steady' }, { value: 'cresc', label: 'Crescendo' }, { value: 'dim', label: 'Diminuendo' }], st.hair, (v) => { st.hair = v; render(); }, 'Hairpin')),
      h('div.toolbar', null, h('span.small.muted', null, 'Touch:'), MC.util.segmented([{ value: 'legato', label: 'Legato (slurs)' }, { value: 'staccato', label: 'Staccato (dots)' }], st.art, (v) => { st.art = v; render(); }, 'Articulation')),
      h('p.small.muted', null, 'Change a setting, look at how the notation changes, then press Play and listen for the difference.'),
      host);
    render();
    return wrap;
  };

  /* ---------- Ties vs slurs, and repeats ---------- */
  W.tieSlur = function () {
    const wrap = h('div.widget');
    const make = (voice, title, note) => {
      const box = h('div.stage');
      box.appendChild(h('h4', null, title));
      box.appendChild(h('p.small.muted', null, note));
      box.appendChild(MC.PiecePlayer({ id: 'ts-' + title, title, key: 'C', time: [4, 4], tempo: 80, staves: [{ clef: 'treble', voice }] }, { modes: ['watch'], mode: 'watch', names: true, showInfo: false }).el);
      return box;
    };
    wrap.append(
      make('C5q D5q E5h~ | E5h D5h', 'Tie', 'Same pitch (E and E): play the E once and hold it for 2 + 2 = 4 beats.'),
      make('(C5q D5q E5h | F5q E5q D5h)', 'Slur', 'Different pitches: play smoothly, connecting each note to the next (legato). Every note is played.'));
    return wrap;
  };
  W.repeats = function () {
    const piece = { id: 'rep', title: 'Repeat demo', key: 'C', time: [4, 4], tempo: 96, staves: [{ clef: 'treble', voice: '|: C4q E4q G4h | F4q D4q B3h :| C4q E4q D4q B3q | C4w' }] };
    const wrap = h('div.widget');
    const order = T.measureOrder(T.buildScore(piece)).map((i) => i + 1);
    wrap.append(h('p.small', { html: `Play order with the repeat: <strong>${order.join(' → ')}</strong>. Press Play and watch the highlight jump back.` }), MC.PiecePlayer(piece, { modes: ['watch'], mode: 'watch', names: true, showInfo: false }).el);
    return wrap;
  };

  /* ---------- Practice plan builder (next steps) ---------- */
  W.planBuilder = function () {
    const wrap = h('div.widget');
    const saved = MC.store.setting('plan') || { days: 5, minutes: 15, piano: 'none' };
    const out = h('div.stage');
    const render = () => {
      const m = saved.minutes;
      const blocks = m <= 10
        ? [['2 min', 'Warm-up: five-finger patterns, each hand (slowly, relaxed)'], ['3 min', 'Review queue in this app (or flashcards)'], [`${m - 5} min`, 'One piece: a short section, hands separately, then together']]
        : [['3 min', 'Warm-up: five-finger patterns and one scale (C, G or F), each hand'], ['4 min', 'Review queue: note reading and rhythm'], [`${Math.round((m - 7) * 0.6)} min`, 'Piece work: 2–4 measures at a slow tempo, hands separately → together'], [`${Math.max(2, Math.round((m - 7) * 0.4))} min`, 'Something new: sight-read one short melody, or explore a chord pattern']];
      MC.util.clear(out);
      out.append(h('h4', null, `Your plan: ${saved.days} days a week, about ${m} minutes`),
        h('ol', null, blocks.map(([t, d]) => h('li', null, h('strong', null, t + ' — '), d))),
        h('p.small', null, 'Weekly rhythm: learn a new lesson on 2–3 of those days; on the others, review and polish. Rest days are part of the plan, not a failure.'),
        saved.piano === 'none' ? h('p.small', null, 'No instrument yet? Keep using the on-screen keyboard, and tap finger patterns on a table. When you are ready, a keyboard with 61–88 full-size, touch-sensitive (ideally weighted) keys and a sustain pedal is a good first instrument.') : saved.piano === 'keyboard' ? h('p.small', null, 'With a digital keyboard: connect it by USB and use “Connect MIDI keyboard” in Settings so this app can check your real playing (Chrome/Edge).') : h('p.small', null, 'With an acoustic piano: practise each lesson’s “On a real piano” steps, then log it as self-reported practice.'));
    };
    const save = () => { MC.store.setSetting('plan', saved); render(); };
    wrap.append(
      h('div.toolbar', null, h('span.small.muted', null, 'Days per week:'), MC.util.segmented([3, 4, 5, 6].map((d) => ({ value: d, label: String(d) })), saved.days, (v) => { saved.days = v; save(); }, 'Days per week')),
      h('div.toolbar', null, h('span.small.muted', null, 'Minutes per day:'), MC.util.segmented([10, 15, 20, 30].map((d) => ({ value: d, label: String(d) })), saved.minutes, (v) => { saved.minutes = v; save(); }, 'Minutes per day')),
      h('div.toolbar', null, h('span.small.muted', null, 'Instrument:'), MC.util.segmented([{ value: 'none', label: 'None yet' }, { value: 'keyboard', label: 'Digital keyboard' }, { value: 'piano', label: 'Acoustic piano' }], saved.piano, (v) => { saved.piano = v; save(); }, 'Instrument')),
      out);
    render();
    return wrap;
  };

  /* ---------- Sound check / first sound (Lesson 1) ---------- */
  W.firstSound = function () {
    const wrap = h('div.widget');
    const card = h('div.enable-card');
    const renderCard = () => {
      MC.util.clear(card);
      const s = A.status();
      card.classList.toggle('ok', s === 'on');
      if (s === 'on') card.append(h('div.bpm-big', { 'aria-hidden': 'true', style: { fontSize: '1.6rem' } }, '♪'), h('p', null, h('strong', null, 'Sound is on. '), 'Now press any key below — with the mouse, your finger, or your computer keyboard (the letters shown on the keys).'));
      else if (s === 'unsupported') card.append(h('p', null, 'This browser cannot make sound with the Web Audio API. You can still follow every lesson visually.'));
      else card.append(btn('Enable sound', () => A.enable().then(() => { A.setMuted(false); renderCard(); A.play(60, 0.8, 0.7); }), 'btn-primary btn-big'), h('p', null, 'Browsers only allow sound after you click. ', h('span.muted.small', null, 'The sound is a recorded grand piano, stored with the app — no internet needed.')));
    };
    renderCard();
    const un = A.on(renderCard);
    MC.util.onCleanup(un);
    wrap.append(card, W.keyboardExplore({ from: 36, to: 84, labels: 'none', mode: 'compare', labelToggle: false, readout: 'Play one key on the <strong>left</strong> side, then one on the <strong>right</strong>. What do you notice?' }));
    return wrap;
  };

  /* A freshly generated melody in a five-finger position, with watch / guided modes. */
  W.randomPiece = function (o) {
    o = Object.assign({ position: 'C4', key: 'C', hand: null }, o);
    const wrap = h('div.widget');
    const host = h('div');
    const make = () => {
      const hand = o.hand || (T.parse(o.position).midi < 60 ? 'lh' : 'rh');
      const beats = T.pick([4, 4, 3]);
      const voice = T.randomMelody({ position: o.position, key: o.key, measures: 4, beats, hand });
      const piece = { id: 'sight-' + o.position, title: 'New melody', key: o.key, time: [beats, 4], tempo: 72, staves: [{ clef: hand === 'lh' ? 'bass' : 'treble', hand, voice }] };
      MC.util.clear(host);
      host.appendChild(MC.PiecePlayer(piece, { modes: ['watch', 'guided', 'independent'], mode: 'guided', names: false, showInfo: false }).el);
    };
    wrap.append(h('div.toolbar', null, btn('↻ New melody', make, 'btn-primary'), h('span.small.muted', null, `${o.hand === 'lh' ? 'Left' : 'Right'} hand, ${T.name(T.parse(o.position), false)} position, ${T.KEYS[o.key].name}`)), host);
    make();
    return wrap;
  };

  /* Keyboard pattern map: highlights groups, repeating 12-key pattern */
  W.patternMap = function () {
    const wrap = h('div.widget');
    const kb = MC.Keyboard({ from: 36, to: 83, labels: 'none', groups: false });
    const out = h('div.readout', { 'aria-live': 'polite' }, 'Use the buttons to reveal the pattern.');
    const mark2 = () => { kb.clearMarks(); MC.genHelpers.blacks(36, 83).filter((k) => MC.genHelpers.group(k) === 2).forEach((k) => kb.setMark(k, 'grp2', '2')); out.innerHTML = 'Groups of <strong>two</strong> black keys.'; };
    const mark3 = () => { kb.clearMarks(); MC.genHelpers.blacks(36, 83).filter((k) => MC.genHelpers.group(k) === 3).forEach((k) => kb.setMark(k, 'grp3', '3')); out.innerHTML = 'Groups of <strong>three</strong> black keys.'; };
    const oct = () => {
      kb.clearMarks();
      [48, 60].forEach((base, bi) => MC.genHelpers.range(base, base + 11).forEach((k) => kb.setMark(k, bi ? 'hint' : 'dim', '')));
      out.innerHTML = 'One full pattern = <strong>12 keys</strong>: 7 white + 5 black (a group of 2 and a group of 3). Then it repeats, higher and higher.';
      A.ensure();
      const t0 = A.now() + 0.05;
      MC.genHelpers.range(48, 59).forEach((k, i) => A.play(k, 0.25, 0.5, t0 + i * 0.16));
      MC.genHelpers.range(60, 71).forEach((k, i) => A.play(k, 0.25, 0.5, t0 + 2.3 + i * 0.16));
    };
    wrap.append(h('div.toolbar', null, btn('Show groups of 2', mark2), btn('Show groups of 3', mark3), btn('Show one full pattern', oct, 'btn-primary'), btn('Clear', () => { kb.clearMarks(); out.textContent = 'Cleared.'; })), out, kb.el);
    return wrap;
  };
})(window.MC = window.MC || {});
