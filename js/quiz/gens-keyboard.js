/* Question generators — shared helpers + keyboard, finger and distance skills. */
(function (MC) {
  'use strict';
  const G = (MC.gens = MC.gens || {});
  const T = MC.theory;
  const A = MC.audio;
  const { h } = MC.util;

  const H = (MC.genHelpers = {});
  H.rnd = (a, b) => a + T.rand(b - a + 1);
  H.range = (a, b) => { const r = []; for (let m = a; m <= b; m++) r.push(m); return r; };
  H.whites = (a, b) => H.range(a, b).filter((m) => !T.isBlack(m));
  H.blacks = (a, b) => H.range(a, b).filter((m) => T.isBlack(m));
  H.L = (m) => T.fromMidi(m).letter;
  H.WHERE = {
    C: 'just to the <strong>left</strong> of a group of <strong>two</strong> black keys',
    D: 'in the <strong>middle</strong> of the two black keys',
    E: 'just to the <strong>right</strong> of a group of <strong>two</strong> black keys',
    F: 'just to the <strong>left</strong> of a group of <strong>three</strong> black keys',
    G: 'between the <strong>first and second</strong> of the three black keys',
    A: 'between the <strong>second and third</strong> of the three black keys',
    B: 'just to the <strong>right</strong> of a group of <strong>three</strong> black keys',
  };
  H.group = (m) => ([1, 3].includes(T.mod(m, 12)) ? 2 : 3);
  H.playSeq = (items, gap, dur, vel) => {
    A.ensure();
    const t0 = A.now() + 0.08;
    items.forEach((m, i) => [].concat(m).forEach((x) => A.play(x, dur || 0.6, vel, t0 + i * (gap || 0.7))));
    return t0;
  };
  H.keyAnswer = (ui, check, filter) => {
    const un = ui.onInput((ev) => {
      if (ev.type !== 'on') return;
      if (filter && !filter(ev.midi)) return;
      un();
      ui.submit(check(ev.midi));
    });
    return un;
  };
  H.letters = (first) => {
    const all = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    return all.map((l) => ({ label: l, value: l }));
  };
  H.octName = (id) => (id === 'C4' ? 'middle C' : id);
  H.describeVsMiddleC = (n) => {
    n = T.parse(n);
    const id = T.id(n);
    if (id === 'C4') return 'the C in the middle of the piano';
    if (id === 'C5') return 'the C one octave above middle C';
    if (id === 'C3') return 'the C one octave below middle C';
    if (n.octave === 4) return `the ${n.letter} just above middle C`;
    if (n.octave === 3) return `the ${n.letter} just below middle C`;
    return n.octave > 4 ? `the ${n.letter} in the octave above that` : `a low ${n.letter}`;
  };
  /* Sequence input with progress display. */
  H.seqInput = function (ui, kb, expected, o) {
    o = o || {};
    const disp = h('div.seq-display', { 'aria-live': 'polite' });
    (o.host || ui.area).insertBefore(disp, kb.el);
    let i = 0, errors = 0;
    const wrongs = [];
    const render = () => {
      MC.util.clear(disp);
      expected.forEach((m, k) => {
        if (k && o.stepLabels && o.stepLabels[k - 1]) disp.appendChild(h('span.seq-item.step', null, o.stepLabels[k - 1]));
        const lbl = k < i ? T.keyName(m, false).split('/')[o.flat ? 1 : 0].replace(/\d/g, '') : o.showTodo ? o.showTodo(k) : '?';
        disp.appendChild(h('span.seq-item' + (k < i ? '.ok' : '.todo'), null, k < i ? (o.names ? o.names[k] : lbl) : lbl));
      });
    };
    render();
    const guide = () => { if (o.guide) { kb.clearMarks('target'); if (expected[i] != null) kb.setMark(expected[i], 'target', o.tags ? o.tags[i] : ''); } };
    guide();
    const un = ui.onInput((ev) => {
      if (ev.type !== 'on') return;
      const want = expected[i];
      if (ev.midi === want) {
        kb.flash(want, 'ok', 300);
        i++;
        render();
        if (i >= expected.length) { un(); kb.clearMarks('target'); o.done(errors, wrongs); } else guide();
      } else {
        errors++;
        wrongs.push({ i, got: ev.midi, want });
        kb.flash(ev.midi, 'bad', 650, '✗');
        if (o.onWrong) o.onWrong(i, ev.midi, want);
      }
    });
    return { reset() { i = 0; errors = 0; render(); guide(); } };
  };
  /* Small non-interactive keyboard used to reveal an answer. */
  H.revealKeys = (ui, marks, from, to) => {
    const kb = ui.keyboard({ from: from || 48, to: to || 72, compact: true, ownsInput: false, interactive: false, labels: 'c', showMapLegend: false });
    marks.forEach(([m, cls, tag]) => kb.setMark(m, cls, tag));
    return kb;
  };

  /* ---------- Module 1: sound & keyboard ---------- */
  G.pitchCompare = (p) => {
    const lo = p.from || 48, hi = p.to || 84;
    const minGap = p.minGap || 5, maxGap = p.maxGap || 19;
    const a = H.rnd(lo, hi);
    let gap = H.rnd(minGap, maxGap) * (Math.random() < 0.5 ? -1 : 1);
    if (a + gap < lo || a + gap > hi) gap = -gap;
    const b = Math.max(lo - 12, Math.min(hi + 12, a + gap));
    const higher = b > a ? 'second' : 'first';
    const bucket = Math.abs(gap) >= 12 ? 'big' : Math.abs(gap) >= 5 ? 'medium' : 'small';
    const reveal = (ui) => () => H.revealKeys(ui, [[a, 'a', '1'], [b, 'b', '2']], Math.min(a, b) - 5, Math.max(a, b) + 5);
    const msg = `The <strong>${higher}</strong> sound was higher. Its key is ${Math.abs(gap)} keys further to the <strong>right</strong> — on a piano, right means higher.`;
    return {
      skill: 'listening', item: 'pitchCompare:' + bucket, sig: `${a}-${b}`, listen: true,
      prompt: 'Listen to two sounds. Which one is <strong>higher</strong>?',
      hint: 'Hum along with each sound. A higher sound feels “up” in your voice — like a bird compared with a big drum.',
      render(ui) {
        ui.listen(() => H.playSeq([a, b], 0.85, 0.7));
        ui.choices([{ label: 'The first sound', value: 'first' }, { label: 'The second sound', value: 'second' }], (v) => ui.submit({ correct: v === higher, answer: higher, msg, reveal: reveal(ui), after: reveal(ui) }), { big: true });
      },
      visual(ui) {
        ui.setPrompt('Which marked key sounds <strong>higher</strong>: key 1 or key 2?', 'Visual version: use the keyboard layout instead of listening.');
        const kb = ui.keyboard({ from: lo, to: hi, labels: 'none', interactive: false, ownsInput: false, showMapLegend: false });
        kb.setMark(a, 'a', '1');
        kb.setMark(b, 'b', '2');
        ui.choices([{ label: 'Key 1', value: 'first' }, { label: 'Key 2', value: 'second' }], (v) => ui.submit({ correct: v === higher, answer: higher, msg: `Key ${higher === 'first' ? 1 : 2} is further right, so it is higher.` }), { big: true });
      },
    };
  };

  G.keyHigherLower = (p) => {
    const from = p.from || 48, to = p.to || 72;
    const dir = p.dir || T.pick(['higher', 'lower']);
    const m = T.pick(H.whites(from + 5, to - 5));
    const side = dir === 'higher' ? 'right' : 'left';
    return {
      skill: 'keyboard', item: 'dir:' + dir, sig: dir + m,
      prompt: `Play any key that sounds <strong>${dir}</strong> than the marked key.`,
      hint: `${dir === 'higher' ? 'Higher' : 'Lower'} sounds are to the <strong>${side}</strong>.`,
      render(ui) {
        const kb = ui.keyboard({ from, to, labels: 'none' });
        kb.setMark(m, 'target', 'here');
        H.keyAnswer(ui, (x) => {
          if (x === m) return { correct: false, msg: `That is the marked key itself — the same pitch. Move to the ${side}.` };
          const ok = dir === 'higher' ? x > m : x < m;
          const actual = x > m ? 'right' : 'left';
          return {
            correct: ok,
            msg: ok ? `Yes — that key is ${Math.abs(x - m)} key${Math.abs(x - m) > 1 ? 's' : ''} to the ${actual}, so it sounds ${dir}.` : `That key is to the <strong>${actual}</strong>, so it sounds ${x > m ? 'higher' : 'lower'}. For ${dir}, move ${side}.`,
            reveal: () => { H.range(dir === 'higher' ? m + 1 : from, dir === 'higher' ? to : m - 1).forEach((k) => kb.setMark(k, 'hint')); },
          };
        });
      },
    };
  };

  G.qualityCompare = (p) => {
    const kinds = p.kinds || ['higher', 'lower', 'louder', 'softer', 'longer', 'shorter'];
    const kind = T.pick(kinds);
    const m = H.rnd(57, 67);
    const a = { m, v: 0.62, d: 0.8 };
    const b = Object.assign({}, a);
    if (kind === 'higher') b.m = m + H.rnd(5, 9);
    if (kind === 'lower') b.m = m - H.rnd(5, 9);
    if (kind === 'louder') { a.v = 0.25; b.v = 1; }
    if (kind === 'softer') { a.v = 1; b.v = 0.25; }
    if (kind === 'longer') { a.d = 0.28; b.d = 1.9; }
    if (kind === 'shorter') { a.d = 1.9; b.d = 0.28; }
    const expl = {
      higher: 'The second sound was <strong>higher</strong> — a different key further right.',
      lower: 'The second sound was <strong>lower</strong> — a different key further left.',
      louder: 'The second sound was <strong>louder</strong> — the same key, pressed more strongly. It is not higher, just stronger.',
      softer: 'The second sound was <strong>softer</strong> — the same key, pressed more gently. Soft is not the same as low.',
      longer: 'The second sound was <strong>longer</strong> — the same key, held down for more time.',
      shorter: 'The second sound was <strong>shorter</strong> — the same key, let go quickly.',
    }[kind];
    const opts = [['higher', 'Higher'], ['lower', 'Lower'], ['louder', 'Louder'], ['softer', 'Softer'], ['longer', 'Longer'], ['shorter', 'Shorter']].filter(([k]) => kinds.includes(k) || ['higher', 'louder', 'longer', 'lower', 'softer', 'shorter'].includes(k)).map(([value, label]) => ({ value, label }));
    const shape = (host) => host.appendChild(MC.widgets.soundShapes([a, b]));
    return {
      skill: 'listening', item: 'quality:' + kind, sig: kind + m, listen: true,
      prompt: 'Listen to two sounds. What changed in the <strong>second</strong> sound?',
      hint: 'Ask yourself three questions: Did it move up or down? Did it get stronger or gentler? Did it last longer or shorter?',
      render(ui) {
        ui.listen(() => { A.ensure(); const t0 = A.now() + 0.08; A.play(a.m, a.d, a.v, t0); A.play(b.m, b.d, b.v, t0 + 2.1); });
        ui.choices(opts, (v) => ui.submit({ correct: v === kind, answer: kind, msg: expl, reveal: () => shape(ui.box()), after: () => shape(ui.box()) }));
      },
      visual(ui) {
        ui.setPrompt('These “sound shapes” show two sounds. What changed in the <strong>second</strong> one?', 'Height = how high; thickness = how loud; length = how long.');
        shape(ui.box());
        ui.choices(opts, (v) => ui.submit({ correct: v === kind, answer: kind, msg: expl }));
      },
    };
  };

  G.blackGroup = (p) => {
    const g = p.group || T.pick([2, 3]);
    const from = p.from || 48, to = p.to || 83;
    return {
      skill: 'keyboard', item: 'group:' + g, sig: 'g' + g + Math.random(),
      prompt: `Press any black key that belongs to a group of <strong>${g === 2 ? 'two' : 'three'}</strong> black keys.`,
      hint: 'Black keys come in a repeating pattern: a pair (2), then a trio (3), then a pair again…',
      render(ui) {
        const kb = ui.keyboard({ from, to, labels: 'none' });
        H.keyAnswer(ui, (x) => {
          const reveal = () => H.blacks(from, to).filter((k) => H.group(k) === g).forEach((k) => kb.setMark(k, 'ok', String(g)));
          if (!T.isBlack(x)) return { correct: false, msg: 'That is a white key. Look at the <strong>black</strong> keys and how they are grouped.', reveal };
          const got = H.group(x);
          return { correct: got === g, msg: got === g ? `Yes — that black key is part of a group of ${g === 2 ? 'two' : 'three'}.` : `That black key is in a group of <strong>${got === 2 ? 'two' : 'three'}</strong>. Count the black keys that sit together with no gap.`, reveal, after: reveal };
        });
      },
    };
  };

  G.samePlace = (p) => {
    const from = p.from || 48, to = p.to || 83;
    const dir = p.dir || T.pick(['up', 'down']);
    const m = dir === 'up' ? H.rnd(from, to - 12) : H.rnd(from + 12, to);
    const ans = m + (dir === 'up' ? 12 : -12);
    return {
      skill: 'keyboard', item: 'samePlace:' + dir, sig: 'sp' + m,
      prompt: `Find the key in the <strong>same place</strong> in the pattern, one pattern ${dir === 'up' ? '<strong>higher</strong> (to the right)' : '<strong>lower</strong> (to the left)'}.`,
      sub: 'Look at where the marked key sits next to its group of black keys, then find the matching spot in the next group.',
      hint: 'The pattern repeats every 12 keys (7 white + 5 black). Find the next group of the same size and the same position within it.',
      render(ui) {
        const kb = ui.keyboard({ from, to, labels: 'none' });
        kb.setMark(m, 'target', 'this');
        H.keyAnswer(ui, (x) => ({
          correct: x === ans,
          msg: x === ans ? 'Exactly. That key has the same shape of neighbours — and it sounds like the same note, only higher or lower.' : T.mod(x - m, 12) === 0 ? 'That is the same place in the pattern, but not the <em>next</em> pattern — it is too far.' : `Not the same spot. The matching key is ${dir === 'up' ? 'right' : 'left'} by exactly 12 keys.`,
          reveal: () => kb.setMark(ans, 'ok', '✓'),
        }), (x) => x !== m);
      },
    };
  };

  /* ---------- Module 2: finding notes ---------- */
  G.findLetter = (p) => {
    const letters = p.letters || ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const Lt = T.pick(letters);
    const from = p.from || 48, to = p.to || 76;
    return {
      skill: 'keyboard', item: 'find:' + Lt, sig: 'f' + Lt,
      prompt: `Play any <strong>${Lt}</strong>.`,
      sub: 'Any octave is fine — there are several on the keyboard.',
      hint: (ui) => { ui.kb && ui.kb.setGroups(true); return `${Lt} is ${H.WHERE[Lt]}.`; },
      render(ui) {
        const kb = ui.keyboard({ from, to, labels: p.labels || 'none' });
        ui.kb = kb;
        H.keyAnswer(ui, (x) => {
          const reveal = () => H.whites(from, to).filter((k) => H.L(k) === Lt).forEach((k) => kb.setMark(k, 'ok', Lt));
          if (T.isBlack(x)) return { correct: false, msg: `That is a black key. ${Lt} is a <strong>white</strong> key ${H.WHERE[Lt]}.`, reveal };
          const got = H.L(x);
          if (got === Lt) return { correct: true, msg: `Yes — that is ${Lt}, ${H.WHERE[Lt]}.`, after: reveal };
          return { correct: false, msg: `That was <strong>${got}</strong>, which is ${H.WHERE[got]}. ${Lt} is ${H.WHERE[Lt]}.`, reveal };
        });
      },
    };
  };

  G.nameKey = (p) => {
    const letters = p.letters || ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const from = p.from || 48, to = p.to || 76;
    const m = T.pick(H.whites(from + 1, to - 1).filter((k) => letters.includes(H.L(k))));
    const Lt = H.L(m);
    return {
      skill: 'keyboard', item: 'name:' + Lt, sig: 'n' + m,
      prompt: 'What is the letter name of the marked key?',
      hint: 'Find the nearest group of black keys. Is it a group of two or three? Where is the marked key next to it?',
      render(ui) {
        const kb = ui.keyboard({ from, to, labels: 'none', interactive: false });
        kb.setMark(m, 'target', '?');
        ui.choices(H.letters(), (v) => ui.submit({
          correct: v === Lt, answer: Lt,
          msg: v === Lt ? `Right — ${Lt} is ${H.WHERE[Lt]}.` : `This key is <strong>${Lt}</strong>: it is ${H.WHERE[Lt]}. (${v} is ${H.WHERE[v]}.)`,
          reveal: () => kb.setMark(m, 'ok', Lt), after: () => kb.setMark(m, 'ok', Lt),
        }));
      },
    };
  };

  G.alphabetStep = (p) => {
    const ALPHA = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const dir = p.dir || T.pick(['up', 'down']);
    const steps = p.steps || T.pick([1, 1, 2]);
    const s = p.start || T.pick(dir === 'up' ? ['E', 'F', 'G', 'G', 'B', 'C'] : ['A', 'A', 'B', 'C', 'D']);
    const i = ALPHA.indexOf(s);
    const ans = ALPHA[T.mod(i + (dir === 'up' ? steps : -steps), 7)];
    const words = steps === 1 ? 'one white key' : 'two white keys';
    return {
      skill: 'keyboard', item: 'alpha:' + dir, sig: s + dir + steps,
      prompt: `Which letter is ${words} ${dir === 'up' ? '<strong>above</strong> (to the right of)' : '<strong>below</strong> (to the left of)'} ${s}?`,
      hint: 'The musical alphabet is only A B C D E F G, then it starts again at A.',
      render(ui) {
        ui.choices(H.letters(), (v) => ui.submit({
          correct: v === ans, answer: ans,
          msg: `${dir === 'up' ? 'Going up' : 'Going down'} from ${s}: ${dir === 'up' ? ALPHA.concat(ALPHA).slice(i, i + steps + 1).join(' → ') : ALPHA.concat(ALPHA).slice(i + 7 - steps, i + 8).reverse().join(' → ')}. ${(s === 'G' && dir === 'up') || (s === 'A' && dir === 'down') ? 'After G the alphabet wraps back to A.' : ''}`,
        }));
      },
    };
  };

  G.findSpecific = (p) => {
    const targets = p.targets || ['C4', 'C5', 'C3', 'D4', 'E4', 'G4', 'A3', 'F3', 'G3', 'B3'];
    const id = T.pick(targets);
    const t = T.midi(id);
    const from = p.from || 48, to = p.to || 84;
    const Lt = id[0];
    return {
      skill: 'keyboard', item: 'findOct:' + id, sig: id,
      prompt: id === 'C4' ? 'Play <strong>middle C</strong>.' : `Play <strong>${id}</strong>.`,
      sub: id === 'C4' ? 'Middle C is the C nearest the middle of the keyboard (marked with a small dot here).' : `${id} is ${H.describeVsMiddleC(id)}.`,
      hint: `First find middle C (the dotted key). ${Lt} is ${H.WHERE[Lt]}. Octave numbers change at every C.`,
      render(ui) {
        const kb = ui.keyboard({ from, to, labels: p.labels || 'c', showOct: true });
        H.keyAnswer(ui, (x) => {
          const reveal = () => kb.setMark(t, 'ok', id);
          if (x === t) return { correct: true, msg: `Yes — that is ${H.octName(id)}.`, after: reveal };
          if (!T.isBlack(x) && H.L(x) === Lt) {
            const oct = Math.abs(x - t) / 12;
            return { correct: false, title: 'Right letter, wrong octave', msg: `You played ${T.id(T.fromMidi(x))}. ${H.octName(id)} is ${oct} octave${oct > 1 ? 's' : ''} ${x > t ? 'lower (to the left)' : 'higher (to the right)'}.`, reveal };
          }
          return { correct: false, msg: `You played ${T.keyName(x)}. ${Lt} is ${H.WHERE[Lt]}; the one you need is ${H.describeVsMiddleC(id)}.`, reveal };
        });
      },
    };
  };

  G.octaveJump = (p) => {
    const from = p.from || 48, to = p.to || 84;
    const dir = p.dir || T.pick(['up', 'down']);
    const m = T.pick(H.whites(dir === 'up' ? from : from + 12, dir === 'up' ? to - 12 : to));
    const ans = m + (dir === 'up' ? 12 : -12);
    const Lt = H.L(m);
    return {
      skill: 'keyboard', item: 'octave:' + dir, sig: 'o' + m,
      prompt: `Play the note one <strong>octave ${dir === 'up' ? 'higher' : 'lower'}</strong> than the marked key.`,
      hint: `The marked key is ${Lt}. An octave ${dir === 'up' ? 'up' : 'down'} is the next ${Lt} to the ${dir === 'up' ? 'right' : 'left'} — 8 white keys counting both ends.`,
      render(ui) {
        const kb = ui.keyboard({ from, to, labels: p.labels || 'none' });
        kb.setMark(m, 'target', Lt);
        H.keyAnswer(ui, (x) => {
          const reveal = () => kb.setMark(ans, 'ok', Lt);
          if (x === ans) return { correct: true, msg: `Yes: ${T.id(T.fromMidi(m))} → ${T.id(T.fromMidi(ans))}. Same letter, 12 keys apart, and it sounds like the same note ${dir === 'up' ? 'higher' : 'lower'}.`, after: reveal };
          if (!T.isBlack(x) && H.L(x) === Lt) return { correct: false, msg: `Right letter, but that is ${Math.abs(x - m) / 12} octaves away. An octave is the <em>next</em> ${Lt}.`, reveal };
          return { correct: false, msg: `That was ${T.keyName(x, false)}. Count letters from ${Lt}: ${Lt} is 1, and the 8th white key is ${Lt} again.`, reveal };
        }, (x) => x !== m);
      },
    };
  };

  /* ---------- Module 3: fingers & positions ---------- */
  G.fingerQuiz = (p) => {
    const hand = p.hand || T.pick(['rh', 'lh']);
    const f = H.rnd(1, 5);
    const variant = p.variant || T.pick(['click', 'name']);
    const hn = hand === 'rh' ? 'right' : 'left';
    return {
      skill: 'keyboard', item: `finger:${hand}:${f}`, sig: hand + f + variant,
      prompt: variant === 'click' ? `Click finger <strong>${f}</strong> on your <strong>${hn}</strong> hand.` : `Which finger number is highlighted on the ${hn} hand?`,
      hint: 'In both hands, the thumbs are 1 and the little fingers are 5. Count from the thumb.',
      render(ui) {
        const wrap = ui.box('hands');
        if (variant === 'click') {
          const hd = MC.Hand(hand, { numbers: ui.attempt > 0 || p.numbers, onFinger: (g) => {
            hd.set(g, g === f ? 'ok' : 'bad');
            if (g !== f) hd.add(f, 'ok');
            ui.submit({ correct: g === f, msg: g === f ? `Yes — finger ${f}${f === 1 ? ' is the thumb' : f === 5 ? ' is the little finger' : ''}.` : `You clicked finger ${g}. Finger ${f} is ${f - g > 0 ? f - g : g - f} finger${Math.abs(f - g) > 1 ? 's' : ''} ${(hand === 'rh') === (f > g) ? 'to the right' : 'to the left'} of it. Remember: count from the thumb (1).`, reveal: () => hd.numbers(true), after: () => hd.numbers(true) });
          } });
          wrap.appendChild(hd.el);
        } else {
          const hd = MC.Hand(hand, { numbers: false });
          hd.set(f, 'on');
          wrap.appendChild(hd.el);
          ui.choices([1, 2, 3, 4, 5].map((n) => ({ label: String(n), value: n })), (v) => ui.submit({ correct: v === f, answer: f, msg: v === f ? 'Correct.' : `That finger is <strong>${f}</strong>. Start at the thumb (1) and count toward the little finger (5).`, reveal: () => hd.numbers(true), after: () => hd.numbers(true) }));
        }
      },
    };
  };

  /* finger → note in a five-finger position */
  H.positionNote = (hand, position, finger, key) => {
    const root = T.parse(position);
    const deg = hand === 'lh' ? 5 - finger : finger - 1;
    return T.stepFrom(root, deg, key || 'C');
  };
  G.playPattern = (p) => {
    const hand = p.hand || 'rh';
    const position = p.position || (hand === 'rh' ? 'C4' : 'C3');
    const key = p.key || 'C';
    const pats = p.patterns || [[1, 2, 3], [3, 2, 1], [1, 3, 5], [5, 4, 3], [1, 2, 3, 4, 5], [5, 4, 3, 2, 1], [1, 2, 1, 3], [2, 3, 4, 3], [5, 3, 1]];
    const pat = T.pick(pats);
    const notes = pat.map((f) => H.positionNote(hand, position, f, key));
    const midis = notes.map((n) => n.midi);
    const posNotes = [1, 2, 3, 4, 5].map((f) => H.positionNote(hand, position, f, key));
    const hints = p.hints || 'full';
    const hn = hand === 'rh' ? 'Right' : 'Left';
    const posName = T.name(T.parse(position), false);
    return {
      skill: 'keyboard', item: 'pattern:' + hand, sig: hand + pat.join(''),
      prompt: `${hn} hand, ${posName} position: play fingers <strong>${pat.join(' – ')}</strong>.`,
      sub: hand === 'rh' ? `${posName} position: right thumb (1) on ${T.name(posNotes[0])}, little finger (5) on ${T.name(posNotes[4])}.` : `${posName} position: left little finger (5) on ${T.name(posNotes[4])}, thumb (1) on ${T.name(posNotes[0])}.`,
      hint: 'Each finger has its own key — one finger per key, next to each other.',
      render(ui) {
        const lo = Math.min(...posNotes.map((n) => n.midi)) - 5, hi = Math.max(...posNotes.map((n) => n.midi)) + 5;
        const kb = ui.keyboard({ from: Math.floor(lo / 12) * 12, to: Math.max(hi, Math.floor(lo / 12) * 12 + 19), labels: hints === 'none' ? 'c' : 'white', hand });
        const map = {};
        if (hints === 'thumb') map[posNotes[0].midi] = 1;
        kb.setFingers(map, hand);
        if (hints === 'full') kb.setHands([{ hand, fingers: Object.fromEntries(posNotes.map((n, i) => [i + 1, n.midi])) }]);
        H.seqInput(ui, kb, midis, {
          names: pat.map(String),
          onWrong: (i, got, want) => {
            ui.area.querySelector('.seq-display').title = '';
            MC.util.toast(`Finger ${pat[i]} plays ${T.name(T.fromMidi(want), false)} — you pressed ${T.keyName(got, false)}.`, 'bad');
          },
          done: (errors, wrongs) => ui.submit({
            correct: errors === 0,
            msg: errors === 0 ? `Clean: ${notes.map((n) => T.name(n, false)).join(' – ')}.` : `You got there with ${errors} wrong key${errors > 1 ? 's' : ''}. In this position: ${posNotes.map((n, i) => `${i + 1}=${T.name(n, false)}`).join(', ')}. First slip: finger ${pat[wrongs[0].i]} should play ${T.name(T.fromMidi(wrongs[0].want), false)}.`,
            reveal: () => kb.setFingers(Object.fromEntries(posNotes.map((n, i) => [n.midi, i + 1])), hand),
          }),
        });
      },
    };
  };

  /* Which finger plays this key in a given hand position? (hands drawn on the keys, numbers hidden) */
  G.positionFinger = (p) => {
    const [hand, position] = T.pick(p.positions || [['rh', 'C4'], ['lh', 'C3'], ['rh', 'G4'], ['lh', 'G2']]);
    const f = H.rnd(1, 5);
    const posNotes = [1, 2, 3, 4, 5].map((ff) => H.positionNote(hand, position, ff));
    const n = posNotes[f - 1];
    const fingers = Object.fromEntries(posNotes.map((x, i) => [i + 1, x.midi]));
    const posName = T.name(T.parse(position), false);
    const hn = hand === 'rh' ? 'Right' : 'Left';
    return {
      skill: 'keyboard', item: `posfinger:${hand}:${posName}`, sig: hand + position + f,
      prompt: `${hn} hand in <strong>${posName} position</strong>: which finger plays the marked key, <strong>${T.name(n, false)}</strong>?`,
      sub: hand === 'rh' ? `Right thumb (1) rests on ${T.name(posNotes[0])}.` : `Left little finger (5) rests on ${T.name(posNotes[4])}.`,
      hint: hand === 'rh' ? 'Right hand: the thumb (1) is on the lowest key of the five. Count up to the right: 1 2 3 4 5.' : 'Left hand: the little finger (5) is on the lowest key. Count to the right toward the thumb: 5 4 3 2 1.',
      render(ui) {
        const lo = posNotes[0].midi < posNotes[4].midi ? posNotes[0].midi : posNotes[4].midi;
        const from = lo - 5, to = lo + 12;
        const kb = ui.keyboard({ from, to, labels: 'white', interactive: false, ownsInput: false, minKeyPx: 26 });
        kb.setMark(n.midi, 'target', '?');
        if (p.showHand !== false) kb.setHands([{ hand, fingers, numbers: false }]);
        const reveal = () => { kb.setHands([{ hand, fingers, numbers: true }]); kb.pressFinger(n.midi, true); };
        ui.choices([1, 2, 3, 4, 5].map((x) => ({ label: String(x), value: x })), (v) => ui.submit({
          correct: v === f, answer: f,
          msg: v === f ? `Yes — ${hn.toLowerCase()} hand finger ${f} (${MC.Hand.FNAME[f]}) plays ${T.name(n, false)} in ${posName} position.` : `It is finger <strong>${f}</strong> (${MC.Hand.FNAME[f]}). In ${posName} position the ${hn.toLowerCase()} hand plays ${posNotes.map((x, i) => `${i + 1}=${T.name(x, false)}`).join(', ')}.`,
          reveal, after: reveal,
        }));
      },
    };
  };

  /* ---------- Module 8: distances ---------- */
  G.halfWhole = (p) => {
    const from = p.from || 55, to = p.to || 79;
    const special = Math.random() < 0.4;
    let a, b;
    if (special) { a = T.pick(H.whites(from, to - 2).filter((m) => ['E', 'B'].includes(H.L(m)))); b = a + 1; }
    else { a = H.rnd(from, to - 3); b = a + T.pick([1, 2]); }
    if (Math.random() < 0.5) [a, b] = [b, a];
    const d = Math.abs(b - a);
    const ans = d === 1 ? 'half' : 'whole';
    const lower = Math.min(a, b), upper = Math.max(a, b);
    return {
      skill: 'keyboard', item: 'hw:' + (special ? 'EF-BC' : ans), sig: `${a}-${b}`,
      prompt: 'Is the distance from key 1 to key 2 a <strong>half step</strong> or a <strong>whole step</strong>?',
      hint: 'Count every key — black and white — moving from key 1 to key 2. One move = half step. Two moves = whole step.',
      render(ui) {
        const kb = ui.keyboard({ from, to, labels: 'white', interactive: false, ownsInput: false });
        kb.setMark(a, 'a', '1');
        kb.setMark(b, 'b', '2');
        ui.choices([{ label: 'Half step', value: 'half' }, { label: 'Whole step', value: 'whole' }], (v) => ui.submit({
          correct: v === ans, answer: ans,
          msg: d === 1
            ? `Half step: key 2 is the very next key. ${!T.isBlack(lower) && !T.isBlack(upper) ? `${H.L(lower)} and ${H.L(upper)} have <strong>no black key between them</strong>, so these two white keys are only a half step apart.` : ''}`
            : `Whole step: there is one key in between (${T.keyName(lower + 1, false)}), so it takes two half steps.`,
          reveal: () => { if (d === 2) kb.setMark(lower + 1, 'hint', '½'); },
        }), { big: true });
      },
    };
  };

  G.playHalfWhole = (p) => {
    const type = p.type || T.pick(['half', 'whole']);
    const dir = p.dir || T.pick(['above', 'above', 'below']);
    const from = p.from || 55, to = p.to || 79;
    const a = T.pick(H.whites(from + 3, to - 3));
    const ans = a + (dir === 'above' ? 1 : -1) * (type === 'half' ? 1 : 2);
    return {
      skill: 'keyboard', item: 'phw:' + type, sig: type + dir + a,
      prompt: `Play a <strong>${type} step ${dir}</strong> ${H.L(a)}.`,
      sub: `Start from the marked ${H.L(a)}.`,
      hint: `${type === 'half' ? 'A half step is the very next key' : 'A whole step skips exactly one key'} — black or white — to the ${dir === 'above' ? 'right' : 'left'}.`,
      render(ui) {
        const kb = ui.keyboard({ from, to, labels: 'white' });
        kb.setMark(a, 'target', H.L(a));
        H.keyAnswer(ui, (x) => {
          const d = x - a;
          const reveal = () => { kb.setMark(ans, 'ok', T.keyName(ans, false).split('/')[dir === 'above' ? 0 : 1] || T.keyName(ans, false)); if (type === 'whole') kb.setMark((a + ans) / 2, 'hint', '½'); };
          if (x === ans) return { correct: true, msg: `Yes: ${T.keyName(a, false)} → ${T.keyName(ans, false)} is a ${type} step.`, after: reveal };
          const got = Math.abs(d) === 1 ? 'a half step' : Math.abs(d) === 2 ? 'a whole step' : `${Math.abs(d)} half steps`;
          return { correct: false, msg: `That key is ${got} ${d > 0 ? 'above' : 'below'} ${H.L(a)}. ${type === 'half' ? 'Go to the very next key' : 'Skip one key and land on the next'}${['E', 'B'].includes(H.L(a)) && dir === 'above' ? ` — careful: ${H.L(a)} has no black key to its right` : ''}${['C', 'F'].includes(H.L(a)) && dir === 'below' ? ` — careful: ${H.L(a)} has no black key to its left` : ''}.`, reveal };
        }, (x) => x !== a);
      },
    };
  };

  G.accidentalName = (p) => {
    const pcs = [1, 3, 6, 8, 10];
    const pc = T.pick(pcs);
    const m = 60 + pc;
    const pair = (q) => `${T.fromMidi(60 + q, 'sharp').letter}♯ / ${T.fromMidi(60 + q, 'flat').letter}♭`;
    const opts = T.shuffle([pc, ...T.shuffle(pcs.filter((x) => x !== pc)).slice(0, 3)]).map((q) => ({ label: pair(q), value: q }));
    return {
      skill: 'keyboard', item: 'accname:' + pc, sig: 'an' + pc,
      prompt: 'This black key has two names. Which pair is correct?',
      hint: 'Sharp (♯) = the key just to the right of a white key. Flat (♭) = the key just to the left of a white key.',
      render(ui) {
        const kb = ui.keyboard({ from: 55, to: 76, labels: 'white', interactive: false, ownsInput: false });
        kb.setMark(m, 'target', '?');
        ui.choices(opts, (v) => ui.submit({
          correct: v === pc, answer: pc,
          msg: `This key is just right of ${T.fromMidi(m - 1).letter}, so it is <strong>${T.fromMidi(m, 'sharp').letter}♯</strong>; it is also just left of ${T.fromMidi(m + 1).letter}, so it is <strong>${T.fromMidi(m, 'flat').letter}♭</strong>. Two names, one key — these are called enharmonic names.`,
          reveal: () => kb.setMark(m, 'ok', pair(pc).replace(' / ', '\n')),
        }));
      },
    };
  };

  G.enharmonic = (p) => {
    const pc = T.pick([1, 3, 6, 8, 10]);
    const useFlat = Math.random() < 0.5;
    const given = T.fromMidi(60 + pc, useFlat ? 'flat' : 'sharp');
    const ans = T.fromMidi(60 + pc, useFlat ? 'sharp' : 'flat');
    const nm = (n) => T.name(n, false);
    const distract = [T.note(given.letter, 0, 4), T.note(ans.letter, useFlat ? 0 : 0, 4), T.fromMidi(60 + T.mod(pc + 2, 12), useFlat ? 'sharp' : 'flat')].map(nm);
    const options = T.shuffle([...new Set([nm(ans), ...distract])]).slice(0, 4);
    if (!options.includes(nm(ans))) options[0] = nm(ans);
    return {
      skill: 'keyboard', item: 'enh', sig: 'e' + pc + useFlat,
      prompt: `Which name belongs to the <strong>same key</strong> as ${nm(given)}?`,
      hint: `Find ${nm(given)} on the keyboard first: ${useFlat ? 'flat = one key to the left of' : 'sharp = one key to the right of'} ${given.letter}.`,
      render(ui) {
        ui.choices(options.map((o) => ({ label: o, value: o })), (v) => ui.submit({
          correct: v === nm(ans), answer: nm(ans),
          msg: `${nm(given)} and ${nm(ans)} are the same black key: ${useFlat ? `just left of ${given.letter}, and just right of ${ans.letter}` : `just right of ${given.letter}, and just left of ${ans.letter}`}.`,
          reveal: () => H.revealKeys(ui, [[60 + pc, 'ok', `${nm(given)}\n${nm(ans)}`]], 55, 76),
          after: () => H.revealKeys(ui, [[60 + pc, 'ok', `${nm(given)}\n${nm(ans)}`]], 55, 76),
        }));
      },
    };
  };
})(window.MC = window.MC || {});
