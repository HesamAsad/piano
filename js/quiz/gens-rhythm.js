/* Question generators — pulse, counting, note values, measures, tapping rhythms, tempo & grouping. */
(function (MC) {
  'use strict';
  const G = MC.gens;
  const H = MC.genHelpers;
  const T = MC.theory;
  const A = MC.audio;
  const { h } = MC.util;

  const PATTERNS = {
    4: {
      long: [[1, 1, 2], [2, 1, 1], [2, 2], [1, 1, 1, 1], [4], [1, 2, 1], [2, 1, 1]],
      rests: [[1, -1, 1, 1], [1, 1, -2], [-1, 1, 1, 1], [2, -1, 1], [1, -1, 2]],
      eighths: [[0.5, 0.5, 1, 1, 1], [1, 0.5, 0.5, 1, 1], [1, 1, 0.5, 0.5, 1], [0.5, 0.5, 0.5, 0.5, 2], [1, 1, 1, 0.5, 0.5], [2, 0.5, 0.5, 1]],
    },
    3: {
      long: [[1, 1, 1], [2, 1], [1, 2], [3]],
      rests: [[1, -1, 1], [-1, 1, 1], [2, -1]],
      eighths: [[0.5, 0.5, 1, 1], [1, 0.5, 0.5, 1], [1, 1, 0.5, 0.5]],
    },
  };
  H.PATTERNS = PATTERNS;
  /* A pattern item: positive = sound for d beats, negative = rest. */
  H.patternToSpec = (pat, pitch) => pat.map((x) => {
    const d = Math.abs(x);
    const dur = d === 3 ? 'h' : T.durToken(d);
    return { n: x < 0 ? 'r' : pitch || 'B4', rest: x < 0, dur: dur.replace('.', ''), dots: d === 3 ? 1 : 0 };
  });
  H.patternOnsets = (pat) => {
    let t = 0;
    const on = [];
    pat.forEach((x) => { if (x > 0) on.push(t); t += Math.abs(x); });
    return on;
  };
  H.patternBlocks = (pat) => {
    let t = 0;
    return pat.map((x) => {
      const d = Math.abs(x);
      const b = { t, d, rest: x < 0, label: (x < 0 ? 'rest ' : '') + (d === 0.5 ? '½' : d) };
      t += d;
      return b;
    });
  };
  H.pickPattern = (beats, level, measures) => {
    const P = PATTERNS[beats];
    const pool = level === 'eighths' ? P.long.concat(P.eighths, P.eighths) : level === 'rests' ? P.long.concat(P.rests) : level === 'mixed' ? P.long.concat(P.rests, P.eighths) : P.long;
    const out = [];
    for (let i = 0; i < (measures || 1); i++) out.push(...T.pick(pool));
    return out;
  };
  H.patternScore = (pat, beats, withTime) => {
    const measures = [];
    let cur = [], t = 0;
    pat.forEach((x) => { cur.push(x); t += Math.abs(x); if (Math.abs(t - beats) < 1e-6) { measures.push(cur); cur = []; t = 0; } });
    if (cur.length) measures.push(cur);
    return MC.Staff.fromNotes({ clef: 'treble', time: withTime === false ? null : [beats, 4], measures: measures.map((m) => H.patternToSpec(m)) });
  };
  H.playPattern = (pat, bpm, countIn, beatsPerBar) => {
    let t = 0;
    const events = [];
    pat.forEach((x) => { if (x > 0) events.push({ t, d: x, rhythmOnly: true, vel: 0.9 }); t += Math.abs(x); });
    const tr = new A.Transport({ bpm, events, countIn: countIn || 0, beatsPerBar: beatsPerBar || 4, metronome: false, end: t });
    A.ensure();
    tr.play();
    return tr;
  };

  G.tapAlong = (p) => {
    const bpm = p.bpm || T.pick([66, 72, 80]);
    const beats = p.beats || 8;
    const fade = !!p.fade;
    return {
      skill: 'rhythm', item: 'pulse' + (fade ? ':inner' : ''), sig: 'pulse' + bpm + Math.random(),
      prompt: fade ? `Tap along with the beat — the clicks will <strong>stop halfway</strong>. Keep tapping steadily as if they were still there.` : 'Tap along with the steady beat.',
      sub: `${beats} beats at ${bpm} BPM, after a 4-beat count-in. Tap the pad, press Space, or tap any key.`,
      hint: 'Do not rush. Listen for each click and tap exactly with it — you can nod your head or count “1, 2, 3, 4” to help.',
      render(ui) {
        const tl = MC.Timeline({ beats, beatsPerBar: 4, blocks: H.range(0, beats - 1).map((b) => ({ t: b, d: 1, label: fade && b >= beats / 2 ? '(silent)' : '' })), tapLane: true });
        ui.area.appendChild(tl.el);
        const unIn = ui.onInput((ev) => { if (ev.type === 'on') MC.input.tap(ev.time, 'piano'); });
        const task = MC.TapTask({ bpm, onsets: H.range(0, beats - 1), length: beats, timeline: tl, muteClicksAfter: fade ? beats / 2 : null, onDone: (ev) => {
          const score = (ev.onTime + ev.close * 0.5) / ev.total;
          ui.submit({ correct: score >= 0.75 && ev.extras.length <= 1, title: score >= 0.75 ? 'Steady!' : 'Not steady yet', msg: MC.timing.describe(ev).join(' ') + (A.canHear() ? '' : ' (Sound was off: the moving line showed the beat instead of clicks.)') });
        } });
        ui.area.appendChild(task.el);
        void unIn;
      },
    };
  };

  G.whichBeat = (p) => {
    const beats = p.beats || T.pick([4, 3]);
    const strong = Math.random() < 0.3;
    const b = strong ? 0 : H.rnd(0, beats - 1);
    return {
      skill: 'rhythm', item: 'count:' + beats, sig: beats + ':' + b + strong,
      prompt: strong ? `In groups of ${beats}, which count is the <strong>strongest</strong> beat?` : `We count in groups of ${beats}. Which count is highlighted?`,
      hint: `Counting restarts at 1 in every group: ${H.range(1, beats).join(' ')} | ${H.range(1, beats).join(' ')} …`,
      render(ui) {
        const tl = MC.Timeline({ beats: beats * 2, beatsPerBar: beats, counts: strong ? 'beats' : false });
        ui.area.appendChild(tl.el);
        const shown = strong ? null : b + (Math.random() < 0.5 ? beats : 0);
        if (shown != null) tl.setPlayhead(shown + 0.5);
        ui.choices(H.range(1, beats).map((k) => ({ label: String(k), value: k - 1 })), (v) => ui.submit({
          correct: v === b, answer: b,
          msg: strong ? 'Beat <strong>1</strong> — the first beat of each group — is the strongest. Musicians call it the downbeat.' : `That box is count <strong>${b + 1}</strong>. Counting starts again at 1 after every ${beats} beats.`,
        }), { big: false });
      },
    };
  };

  G.tapRhythm = (p) => {
    const beats = p.beats || 4;
    const level = p.level || 'long';
    const measures = p.measures || 1;
    const pat = p.pattern || H.pickPattern(beats, level, measures);
    const bpm = p.bpm || (level === 'eighths' ? 66 : 72);
    const display = p.display || 'blocks';
    const len = pat.reduce((a, x) => a + Math.abs(x), 0);
    const onsets = H.patternOnsets(pat);
    return {
      skill: 'rhythm', item: 'tap:' + pat.join(','), sig: pat.join(','), reviewParams: Object.assign({}, p, { pattern: pat }),
      prompt: display === 'blocks' ? 'Tap this rhythm. Each block starts a sound; its length shows how long it lasts.' : 'Tap this rhythm from the notation.',
      sub: `${bpm} BPM, ${beats} beats per measure, with a one-measure count-in. Tap where each note <strong>starts</strong>; rests are silent.`,
      hint: 'Count out loud (“1, 2, 3, 4” — and “&” between beats for half-beat notes). Tap on the counts where a sound starts. Press “Hear it first” to listen.',
      render(ui) {
        if (display === 'notation') {
          const sc = H.patternScore(pat, beats, true);
          ui.score(sc, { showCounts: ui.mode !== 'check' || ui.attempt > 0, spPx: 11 });
        }
        const tl = MC.Timeline({ beats: len, beatsPerBar: beats, blocks: display === 'blocks' ? H.patternBlocks(pat) : [], counts: level === 'eighths' ? 'and' : 'beats', tapLane: true, showBoxes: true });
        ui.area.appendChild(tl.el);
        if (ui.mode !== 'check' || ui.attempt > 0) {
          let demo = null;
          ui.tool(MC.util.btn('▶ Hear it first', () => { if (demo) demo.stop(true); demo = H.playPattern(pat, bpm, beats, beats); ui.scope.add(() => demo && demo.stop(true)); }));
        }
        ui.onInput((ev) => { if (ev.type === 'on') MC.input.tap(ev.time, 'piano'); });
        const task = MC.TapTask({ bpm, beatsPerBar: beats, onsets, length: len, timeline: tl, onDone: (ev) => {
          const score = (ev.onTime + ev.close * 0.5) / ev.total;
          ui.submit({ correct: score >= 0.75 && ev.extras.length <= 1 && ev.results.every((r) => r.status !== 'missed'), title: score >= 0.75 ? 'Rhythm matched' : 'Not quite in rhythm', msg: MC.timing.describe(ev).join(' ') });
        } });
        ui.area.appendChild(task.el);
      },
    };
  };

  const VALUES = [
    { k: 'w', beats: 4, label: 'whole note' }, { k: 'h', beats: 2, label: 'half note' }, { k: 'q', beats: 1, label: 'quarter note' },
    { k: 'e', beats: 0.5, label: 'eighth note' }, { k: 'h.', beats: 3, label: 'dotted half note' },
    { k: 'rw', beats: 4, label: 'whole rest', rest: true }, { k: 'rh', beats: 2, label: 'half rest', rest: true }, { k: 'rq', beats: 1, label: 'quarter rest', rest: true },
  ];
  const valueSpec = (v, pitch) => ({ n: v.rest ? 'r' : pitch || 'B4', rest: !!v.rest, dur: v.k.replace('r', '').replace('.', ''), dots: v.k.includes('.') ? 1 : 0 });
  const beatWord = (b) => (b === 0.5 ? '½ beat' : `${b} beat${b === 1 ? '' : 's'}`);
  const mini = (specs, opts) => {
    const d = h('div');
    MC.Staff.notes(d, Object.assign({ clef: 'treble', notes: specs, spacing: 4 }, opts || {}), { clef: false, spPx: 7, minAbove: 1.2, minBelow: 1.2 });
    return d;
  };
  G.noteValue = (p) => {
    const pool = VALUES.filter((v) => (p.values || ['w', 'h', 'q', 'e', 'h.', 'rw', 'rh', 'rq']).includes(v.k));
    const v = T.pick(pool);
    return {
      skill: 'rhythm', item: 'value:' + v.k, sig: v.k,
      prompt: `How many beats does this ${v.rest ? 'rest' : 'note'} last (in 4/4 time, where a quarter note = 1 beat)?`,
      hint: 'Hollow with no stem = 4. Hollow with a stem = 2. Filled with a stem = 1. A flag halves it. A dot adds half again.',
      render(ui) {
        ui.staff({ clef: 'treble', notes: [valueSpec(v)] }, { spPx: 14 });
        ui.choices([0.5, 1, 2, 3, 4].map((b) => ({ label: beatWord(b), value: b })), (x) => ui.submit({ correct: x === v.beats, answer: v.beats, msg: `This is a <strong>${v.label}</strong>: ${beatWord(v.beats)}.${v.rest ? ' A rest is a measured silence — you count it just like a note.' : ''}${v.k === 'h.' ? ' The dot adds half the note’s value: 2 + 1 = 3.' : ''}` }));
      },
    };
  };
  G.valueMatch = (p) => {
    const target = T.pick(p.targets || [1, 2, 4, 3]);
    const pool = VALUES.filter((v) => (p.rests ? true : !v.rest));
    const correct = T.pick(pool.filter((v) => v.beats === target));
    const wrong = T.shuffle(pool.filter((v) => v.beats !== target)).slice(0, 3);
    const opts = T.shuffle([correct, ...wrong]);
    return {
      skill: 'rhythm', item: 'match:' + target, sig: target + correct.k,
      prompt: `Which one lasts <strong>${beatWord(target)}</strong>?`,
      hint: 'Whole = 4, half = 2, quarter = 1, eighth = ½, dotted half = 3.',
      render(ui) {
        ui.choices(opts.map((v) => ({ value: v.k, el: mini([valueSpec(v)]), aria: v.label })), (k) => {
          const got = VALUES.find((v) => v.k === k);
          ui.submit({ correct: k === correct.k, answer: correct.k, msg: k === correct.k ? `Yes — a ${correct.label} lasts ${beatWord(target)}.` : `That was a ${got.label} (${beatWord(got.beats)}). The ${correct.label} lasts ${beatWord(target)}.` });
        });
      },
    };
  };
  G.countMeasure = (p) => {
    const beats = T.pick(p.beats || [3, 4]);
    const pat = H.pickPattern(beats, p.level || 'long', 1);
    return {
      skill: 'rhythm', item: 'measure:' + beats, sig: pat.join(','),
      prompt: 'Add up the note values. How many beats are in this measure?',
      hint: 'Whole = 4, dotted half = 3, half = 2, quarter = 1, eighth = ½. Add them one by one.',
      render(ui) {
        ui.score(H.patternScore(pat, beats, false), { timeSig: false, barlines: true, spPx: 12 });
        ui.choices([2, 3, 4].map((b) => ({ label: `${b} beats`, value: b })), (v) => ui.submit({
          correct: v === beats, answer: beats,
          msg: `${pat.map((x) => (Math.abs(x) === 0.5 ? '½' : Math.abs(x))).join(' + ')} = <strong>${beats}</strong>. So this measure would fit a <strong>${beats}/4</strong> time signature.`,
        }), { big: true });
      },
    };
  };
  G.measureComplete = (p) => {
    const beats = T.pick(p.beats || [4, 3]);
    const allowEighth = !!p.eighths;
    const missing = T.pick(beats === 4 ? [1, 2, 2, 3] : [1, 2]);
    const cands = [
      { k: 'q', d: 1, spec: [{ n: 'B4', dur: 'q' }], label: 'quarter note' },
      { k: 'h', d: 2, spec: [{ n: 'B4', dur: 'h' }], label: 'half note' },
      { k: 'h.', d: 3, spec: [{ n: 'B4', dur: 'h', dots: 1 }], label: 'dotted half note' },
      { k: 'w', d: 4, spec: [{ n: 'B4', dur: 'w' }], label: 'whole note' },
      { k: 'rq', d: 1, spec: [{ n: 'r', rest: true, dur: 'q' }], label: 'quarter rest' },
      { k: 'rh', d: 2, spec: [{ n: 'r', rest: true, dur: 'h' }], label: 'half rest' },
    ].concat(allowEighth ? [{ k: 'ee', d: 1, spec: [{ n: 'B4', dur: 'e' }, { n: 'B4', dur: 'e' }], label: 'two eighth notes' }, { k: 'e', d: 0.5, spec: [{ n: 'B4', dur: 'e' }], label: 'one eighth note' }] : []);
    const good = T.pick(cands.filter((c) => c.d === missing));
    const bad = T.shuffle(cands.filter((c) => c.d !== missing)).slice(0, 3);
    const opts = T.shuffle([good, ...bad]);
    // prefix that sums to beats - missing
    const need = beats - missing;
    const pre = [];
    let left = need;
    while (left > 0) { const d = T.pick([1, 2, 1].filter((x) => x <= left)); pre.push(d); left -= d; }
    return {
      skill: 'rhythm', item: 'complete:' + missing, sig: pre.join(',') + good.k,
      prompt: `This ${beats}/4 measure is missing something at the end. Which choice fills it <strong>exactly</strong>?`,
      sub: `A ${beats}/4 measure holds exactly ${beats} beats.`,
      hint: `Add up what is already there (${pre.join(' + ')} = ${need}). How many beats are left?`,
      render(ui) {
        const specs = H.patternToSpec(pre).concat([{ n: 'B4', dur: missing === 3 ? 'h' : T.durToken(missing), dots: missing === 3 ? 1 : 0, hidden: true }]);
        ui.score(MC.Staff.fromNotes({ clef: 'treble', time: [beats, 4], measures: [specs] }), { spPx: 12, showCounts: ui.mode !== 'check' });
        ui.choices(opts.map((c) => ({ value: c.k, el: mini(c.spec), aria: c.label })), (k) => {
          const c = cands.find((x) => x.k === k);
          const total = need + c.d;
          ui.submit({ correct: k === good.k, answer: good.k, msg: k === good.k ? `Yes: ${need} + ${c.d} = ${beats} beats.` : `A ${c.label} lasts ${beatWord(c.d)}, which makes <strong>${total}</strong> beats — ${total > beats ? 'too many' : 'not enough'}. The measure needs ${beatWord(missing)} more: for example, a ${good.label}.` });
        });
      },
    };
  };
  G.tieBeats = (p) => {
    const v = T.pick([
      { voice: 'C5h~ C5q rq', beats: 3 }, { voice: 'C5q~ C5q rh', beats: 2 }, { voice: 'rh C5h~ | C5h rh', beats: 4 },
      { voice: 'C5q rq C5q~ C5q', beats: 2 }, { voice: 'rq C5q C5h~ | C5q rq rh', beats: 3 },
    ]);
    return {
      skill: 'rhythm', item: 'tie', sig: v.voice,
      prompt: 'How many beats does the <strong>tied</strong> sound last in total?',
      hint: 'A tie joins two notes of the same pitch into one sound. Add their values together.',
      render(ui) {
        const sc = T.buildScore({ key: 'C', time: [4, 4], staves: [{ clef: 'treble', voice: v.voice }] });
        ui.score(sc, { showCounts: true, spPx: 12 });
        ui.choices([2, 3, 4, 5].map((b) => ({ label: `${b} beats`, value: b })), (x) => ui.submit({ correct: x === v.beats, answer: v.beats, msg: `The tie joins the notes: you play once and hold for <strong>${v.beats} beats</strong>. You do not play the second note again.` }));
      },
    };
  };
  G.repeatOrder = (p) => {
    const variant = T.pick(['12-3', 'all2', '1-23']);
    const cfg = {
      '12-3': { voice: '|: C5q D5q E5h | F5q E5q D5h :| C5w', total: 5, order: '1 2 1 2 3' },
      all2: { voice: '|: E5q D5q C5h | D5q E5q C5h :|', total: 4, order: '1 2 1 2' },
      '1-23': { voice: 'G4q A4q B4h |: C5q B4q A4h | G4w :|', total: 5, order: '1 2 3 2 3' },
    }[variant];
    return {
      skill: 'reading', item: 'repeat', sig: variant,
      prompt: 'Following the repeat signs, how many measures do you play in total?',
      hint: 'At the end-repeat sign (dots before a thick line), go back to the start-repeat sign — or to the very beginning if there is none — and play that part once more.',
      render(ui) {
        const sc = T.buildScore({ key: 'C', time: [4, 4], staves: [{ clef: 'treble', voice: cfg.voice }] });
        ui.score(sc, { measureNumbersAll: true, spPx: 11 });
        ui.choices([3, 4, 5, 6].map((b) => ({ label: String(b), value: b })), (x) => ui.submit({ correct: x === cfg.total, answer: cfg.total, msg: `Order of measures: <strong>${cfg.order}</strong> — ${cfg.total} in total.` }), { big: true });
      },
    };
  };

  G.tempoCompare = (p) => {
    const slow = T.pick([56, 60, 66]);
    const fast = slow + T.pick([34, 44, 54]);
    const first = Math.random() < 0.5 ? 'fast' : 'slow';
    const bpms = first === 'fast' ? [fast, slow] : [slow, fast];
    const tune = [60, 62, 64, 65, 67, 67];
    const ans = first === 'fast' ? 'first' : 'second';
    return {
      skill: 'listening', item: 'tempo', sig: bpms.join('-'), listen: true,
      prompt: 'You will hear the same tune twice. Which time was it <strong>faster</strong>?',
      hint: 'Tap your foot along with each version. Which one made your foot move more quickly?',
      render(ui) {
        ui.listen(() => {
          A.ensure();
          let t0 = A.now() + 0.1;
          bpms.forEach((b) => { const s = 60 / b; tune.forEach((m, i) => A.play(m, s * 0.9, 0.7, t0 + i * s)); t0 += tune.length * s + 1.0; });
        });
        ui.choices([{ label: 'The first time', value: 'first' }, { label: 'The second time', value: 'second' }], (v) => ui.submit({ correct: v === ans, answer: ans, msg: `The ${ans} version was faster: ${fast} beats per minute (BPM), versus ${slow} BPM. Tempo means the speed of the beat — the notes stayed the same.` }), { big: true });
      },
      visual(ui) {
        ui.setPrompt('Two beat lights are blinking. Which one shows the <strong>faster</strong> tempo?');
        const row = ui.box('row');
        const mk = (b, label) => {
          const d = h('div.beat-dot', null, label);
          row.appendChild(h('div.stack', { style: { textAlign: 'center' } }, d, h('div.small.muted', null, 'Light ' + label)));
          const iv = setInterval(() => { d.classList.add('on'); setTimeout(() => d.classList.remove('on'), 120); }, 60000 / b);
          ui.scope.add(() => clearInterval(iv));
        };
        mk(bpms[0], '1');
        mk(bpms[1], '2');
        ui.choices([{ label: 'Light 1', value: 'first' }, { label: 'Light 2', value: 'second' }], (v) => ui.submit({ correct: v === ans, answer: ans, msg: `Light ${ans === 'first' ? 1 : 2} blinked ${fast} times per minute; the other ${slow}.` }), { big: true });
      },
    };
  };

  G.hearGrouping = (p) => {
    const n = T.pick([3, 4]);
    const bpm = 108;
    return {
      skill: 'listening', item: 'grouping:' + n, sig: 'g' + n + Math.random(),
      prompt: 'Listen to the clicks. The <strong>strong</strong> (higher) click starts each group. Are the beats in groups of 3 or 4?',
      hint: 'Count “1” on every strong click, then keep counting until the next strong click.',
      render(ui) {
        ui.listen(() => { A.ensure(); const t0 = A.now() + 0.1; for (let i = 0; i < n * 4; i++) A.click(t0 + (i * 60) / bpm, i % n === 0 ? 2 : 1); });
        ui.choices([{ label: 'Groups of 3', value: 3 }, { label: 'Groups of 4', value: 4 }], (v) => ui.submit({ correct: v === n, answer: n, msg: `Groups of <strong>${n}</strong>: strong-${n === 3 ? 'weak-weak' : 'weak-weak-weak'}. ${n === 3 ? 'That is the feel of 3/4 time (like a waltz).' : 'That is the feel of 4/4 time — the most common in music.'}` }), { big: true });
      },
      visual(ui) {
        ui.setPrompt('Watch the lights. A <strong>big</strong> flash starts each group. Groups of 3 or 4?');
        const d = h('div.beat-dot', { style: { width: '60px', height: '60px' } });
        ui.box('row').appendChild(d);
        let i = 0;
        const iv = setInterval(() => { const strong = i % n === 0; d.classList.toggle('strong', strong); d.textContent = ''; d.style.transform = strong ? 'scale(1.25)' : 'scale(0.8)'; d.classList.add('on'); setTimeout(() => d.classList.remove('on'), 150); i++; }, 60000 / 90);
        ui.scope.add(() => clearInterval(iv));
        ui.choices([{ label: 'Groups of 3', value: 3 }, { label: 'Groups of 4', value: 4 }], (v) => ui.submit({ correct: v === n, answer: n, msg: `Groups of ${n}.` }), { big: true });
      },
    };
  };

  G.rhythmListen = (p) => {
    const beats = 4;
    const level = p.level || 'long';
    const target = H.pickPattern(beats, level, 1);
    const others = [];
    let guard = 0;
    while (others.length < 2 && guard++ < 40) {
      const c = H.pickPattern(beats, level, 1);
      if (c.join() !== target.join() && !others.some((o) => o.join() === c.join())) others.push(c);
    }
    const opts = T.shuffle([target, ...others]);
    const key = target.join(',');
    const bpm = 80;
    return {
      skill: 'rhythm', item: 'rhythmlisten:' + level, sig: key, listen: true,
      prompt: 'Listen (after 4 clicks). Which rhythm did you hear?',
      hint: 'Count 1 2 3 4 along with the clicks, then notice on which counts the claps start.',
      render(ui) {
        let tr = null;
        ui.listen(() => { if (tr) tr.stop(true); tr = H.playPattern(target, bpm, 4, 4); ui.scope.add(() => tr && tr.stop(true)); });
        ui.choices(opts.map((pt) => ({ value: pt.join(','), el: (() => { const d = h('div'); MC.Staff.render(d, H.patternScore(pt, beats, true), { spPx: 7, minAbove: 1, minBelow: 1 }); return d; })(), aria: pt.join(' ') })), (v) => ui.submit({ correct: v === key, answer: key, msg: `The rhythm was: ${target.map((x) => (x < 0 ? `rest (${Math.abs(x)})` : x === 0.5 ? '½' : x)).join(' – ')} beats.` }));
      },
      visual(ui) {
        ui.setPrompt('These counts light up where each sound starts. Which rhythm matches?');
        const on = H.patternOnsets(target);
        const strip = h('div.row');
        const labels = level === 'eighths' ? ['1', '&', '2', '&', '3', '&', '4', '&'] : ['1', '2', '3', '4'];
        const step = level === 'eighths' ? 0.5 : 1;
        labels.forEach((l, i) => strip.appendChild(h('span.seq-item' + (on.some((t) => Math.abs(t - i * step) < 1e-6) ? '.ok' : '.todo'), null, l)));
        ui.area.appendChild(strip);
        ui.choices(opts.map((pt) => ({ value: pt.join(','), el: (() => { const d = h('div'); MC.Staff.render(d, H.patternScore(pt, beats, true), { spPx: 7, minAbove: 1, minBelow: 1 }); return d; })() })), (v) => ui.submit({ correct: v === key, answer: key, msg: 'Compare where each note starts with the lit counts.' }));
      },
    };
  };
})(window.MC = window.MC || {});
