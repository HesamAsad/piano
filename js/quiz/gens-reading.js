/* Question generators — pitch reading, intervals on the staff, key signatures, symbols, sight-reading. */
(function (MC) {
  'use strict';
  const G = MC.gens;
  const H = MC.genHelpers;
  const T = MC.theory;
  const A = MC.audio;
  const { h } = MC.util;

  const POOLS = {
    treble: ['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'],
    trebleLedger: ['C4', 'D4', 'G5', 'A5'],
    bass: ['G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3'],
    bassLedger: ['E2', 'F2', 'B3', 'C4'],
  };
  const LANDMARKS = {
    treble: [{ id: 'C4', label: 'Middle C', where: 'one ledger line below the staff' }, { id: 'G4', label: 'Treble G', where: 'line 2 — where the treble clef curls' }, { id: 'C5', label: 'Treble (high) C', where: 'space 3' }, { id: 'F5', label: 'Top-line F', where: 'line 5' }],
    bass: [{ id: 'G2', label: 'Bottom-line G', where: 'line 1' }, { id: 'C3', label: 'Bass (low) C', where: 'space 2' }, { id: 'F3', label: 'Bass F', where: 'line 4 — between the bass clef dots' }, { id: 'C4', label: 'Middle C', where: 'one ledger line above the staff' }],
  };
  H.nearestLandmark = (n, clef, only) => {
    const d = T.diatonic(n);
    let best = null;
    LANDMARKS[clef].filter((l) => !only || only.includes(l.id)).forEach((l) => {
      const dd = T.diatonic(l.id) - d;
      if (!best || Math.abs(dd) < Math.abs(best.dd)) best = Object.assign({ dd }, l);
    });
    return best;
  };
  H.walk = (fromId, toN) => {
    const a = T.diatonic(fromId), b = T.diatonic(toN);
    const step = b > a ? 1 : -1;
    const out = [];
    for (let d = a; step > 0 ? d <= b : d >= b; d += step) out.push(T.LETTERS[T.mod(d, 7)]);
    return out;
  };
  H.readExplain = (n, clef) => {
    const lm = H.nearestLandmark(n, clef);
    const pos = T.staffPos(n, clef);
    if (!lm) return '';
    if (lm.dd === 0) return `This is a landmark: <strong>${lm.label}</strong> (${lm.where}).`;
    const path = H.walk(lm.id, n);
    const steps = path.length - 1;
    return `It sits on ${T.posDesc(pos)}. Nearest landmark: <strong>${lm.label}</strong> (${lm.where}). Count ${steps} step${steps > 1 ? 's' : ''} ${lm.dd > 0 ? 'down' : 'up'}: ${path.join(' → ')}.`;
  };
  function pickNote(p) {
    let clef = p.clef || 'treble';
    let pool = p.pool;
    if (clef === 'grand') {
      clef = T.pick(['treble', 'bass']);
      pool = pool || POOLS[clef].concat(p.ledger ? POOLS[clef + 'Ledger'] : []);
      if (p.pool) pool = p.pool.filter((id) => (clef === 'treble' ? T.midi(id) >= 60 : T.midi(id) <= 60));
    }
    pool = pool || POOLS[clef].concat(p.ledger ? POOLS[clef + 'Ledger'] : []);
    return { clef, id: T.pick(pool), grand: p.clef === 'grand' };
  }

  G.lineOrSpace = (p) => {
    const pos = H.rnd(0, 8);
    const isLine = pos % 2 === 0;
    const numbered = p.numbered && Math.random() < 0.6;
    const num = isLine ? pos / 2 + 1 : (pos + 1) / 2;
    const clef = p.clef || null;
    return {
      skill: 'reading', item: 'ls:' + (isLine ? 'line' : 'space'), sig: 'ls' + pos + numbered,
      prompt: numbered ? `This note is on a ${isLine ? 'line' : 'space'}. <strong>Which ${isLine ? 'line' : 'space'}</strong>, counting from the bottom?` : 'Is this note on a <strong>line</strong> or in a <strong>space</strong>?',
      hint: 'A line note has the line running through its middle. A space note sits between two lines, touching both.',
      render(ui) {
        const n = T.fromPos(pos, clef || 'treble');
        ui.staff({ clef: clef || 'treble', notes: [T.id(n)] }, { clef: !!clef });
        const opts = numbered
          ? (isLine ? [1, 2, 3, 4, 5] : [1, 2, 3, 4]).map((k) => ({ label: `${isLine ? 'Line' : 'Space'} ${k}`, value: k }))
          : [{ label: 'On a line', value: 'line' }, { label: 'In a space', value: 'space' }];
        ui.choices(opts, (v) => {
          const ok = numbered ? v === num : v === (isLine ? 'line' : 'space');
          ui.submit({ correct: ok, answer: numbered ? num : isLine ? 'line' : 'space', msg: `It is on <strong>${T.posDesc(pos)}</strong>. Lines and spaces are counted from the <strong>bottom</strong> up: 5 lines, 4 spaces.` });
        });
      },
    };
  };

  G.stepSkip = (p) => {
    const d = T.pick(p.moves || [-2, -1, 0, 1, 2, 1, -1, 2, -2]);
    const a = H.rnd(1, 7);
    const b = Math.max(-1, Math.min(9, a + d));
    const dd = b - a;
    const kind = dd === 0 ? 'repeat' : Math.abs(dd) === 1 ? (dd > 0 ? 'step-up' : 'step-down') : Math.abs(dd) === 2 ? (dd > 0 ? 'skip-up' : 'skip-down') : 'leap';
    const clef = p.clef || 'treble';
    const withClef = !!p.clef;
    const opts = [['step-up', 'Step up'], ['step-down', 'Step down'], ['skip-up', 'Skip up'], ['skip-down', 'Skip down'], ['repeat', 'Repeat (same)']].map(([value, label]) => ({ value, label }));
    const words = { 'step-up': 'a step up', 'step-down': 'a step down', 'skip-up': 'a skip up', 'skip-down': 'a skip down', repeat: 'a repeat — the same note' };
    return {
      skill: 'reading', item: 'ss:' + kind, sig: 'ss' + a + b,
      prompt: 'From the first note to the second: step, skip or repeat?',
      hint: 'Step = to the very next line or space (line→space or space→line). Skip = jump over one (line→line or space→space).',
      render(ui) {
        const n1 = T.fromPos(a, clef), n2 = T.fromPos(b, clef);
        const st = ui.staff({ clef, notes: [T.id(n1), T.id(n2)] }, { clef: withClef, onNoteClick: (ev) => { A.ensure(); A.play(ev.notes[0].midi, 0.6); } });
        ui.listen(() => H.playSeq([n1.midi, n2.midi], 0.7, 0.6), 'Hear the two notes');
        ui.choices(opts, (v) => ui.submit({
          correct: v === kind, answer: kind,
          msg: `It is <strong>${words[kind]}</strong>: from ${T.posDesc(a)} to ${T.posDesc(b)}. ${Math.abs(dd) === 1 ? 'Line to space (or space to line) = the next letter.' : Math.abs(dd) === 2 ? 'Line to line (or space to space) = skip one letter.' : ''}`,
        }));
        void st;
      },
    };
  };

  G.readNote = (p) => {
    const { clef, id, grand } = pickNote(p);
    const n = T.parse(id);
    const pos = T.staffPos(n, clef);
    const other = clef === 'treble' ? 'bass' : 'treble';
    return {
      skill: 'reading', item: `read:${clef}:${id}`, sig: clef + id,
      reviewParams: { clef: p.clef || clef, pool: [id], ledger: p.ledger },
      prompt: `What is the letter name of this ${clef} clef note?`,
      hint: () => { const lm = H.nearestLandmark(n, clef); return lm.dd === 0 ? `It is a landmark note: ${lm.label} (${lm.where}).` : `Start from <strong>${lm.label}</strong> (${lm.where}) and count ${Math.abs(lm.dd)} step${Math.abs(lm.dd) > 1 ? 's' : ''} ${lm.dd > 0 ? 'down' : 'up'}.`; },
      render(ui) {
        const spec = grand ? { clef: 'grand', notes: [{ n: id, staff: clef === 'treble' ? 0 : 1 }] } : { clef, notes: [id] };
        ui.staff(spec, { onNoteClick: () => { A.ensure(); A.play(n.midi, 0.8); } });
        ui.choices(H.letters(), (v) => {
          const ok = v === n.letter;
          let msg = H.readExplain(n, clef);
          if (!ok) {
            const alt = T.fromPos(pos, other).letter;
            const li = T.LETTERS.indexOf(n.letter), vi = T.LETTERS.indexOf(v);
            if (v === alt) msg = `It looks like you read it as if it were in <strong>${other} clef</strong>. In ${clef} clef this position is <strong>${n.letter}</strong>. ` + msg;
            else if (T.mod(li - vi, 7) === 1 || T.mod(vi - li, 7) === 1) msg = `You were one step away — check whether the note is on a line or in a space. ` + msg;
          } else msg = `Yes, ${T.name(n)}. ` + msg;
          ui.submit({
            correct: ok, answer: n.letter, msg,
            reveal: () => H.revealKeys(ui, [[n.midi, 'ok', T.name(n)]], Math.min(48, n.midi - 7), Math.max(72, n.midi + 7)),
            after: () => H.revealKeys(ui, [[n.midi, 'ok', T.name(n)]], Math.min(48, n.midi - 7), Math.max(72, n.midi + 7)),
          });
        });
      },
    };
  };

  G.playStaffNote = (p) => {
    const { clef, id, grand } = pickNote(p);
    const n = T.parse(id);
    const from = clef === 'treble' ? 55 : 36, to = clef === 'treble' ? 84 : 64;
    return {
      skill: 'reading', item: `play:${clef}:${id}`, sig: 'p' + clef + id,
      reviewParams: { clef: p.clef || clef, pool: [id], ledger: p.ledger },
      prompt: `Play this note on the keyboard — in the <strong>right octave</strong>.`,
      sub: clef === 'treble' ? 'Treble clef notes on the staff are at or above middle C.' : 'Bass clef notes on the staff are below middle C.',
      hint: () => `${H.readExplain(n, clef)} Middle C is the dotted key.`,
      render(ui) {
        const spec = grand ? { clef: 'grand', notes: [{ n: id, staff: clef === 'treble' ? 0 : 1 }] } : { clef, notes: [id] };
        ui.staff(spec);
        const kb = ui.keyboard({ from: grand ? 43 : from, to: grand ? 79 : to, labels: p.labels || 'c' });
        H.keyAnswer(ui, (x) => {
          const reveal = () => kb.setMark(n.midi, 'ok', T.name(n));
          if (x === n.midi) return { correct: true, msg: `Yes — ${T.name(n)}. ${H.readExplain(n, clef)}`, after: reveal };
          if (T.mod(x - n.midi, 12) === 0) return { correct: false, title: 'Right letter, wrong octave', msg: `You played ${T.keyName(x)}; this note is ${T.name(n)}, ${H.describeVsMiddleC(n)}. The staff shows exactly how high it is.`, reveal };
          return { correct: false, msg: `You played ${T.keyName(x)}. This note is <strong>${T.name(n)}</strong>. ${H.readExplain(n, clef)}`, reveal };
        });
      },
    };
  };

  G.keyToStaff = (p) => {
    const { clef, id } = pickNote(Object.assign({}, p, { clef: p.clef === 'grand' ? T.pick(['treble', 'bass']) : p.clef || 'treble' }));
    const n = T.parse(id);
    const pos = T.staffPos(n, clef);
    return {
      skill: 'reading', item: `k2s:${clef}:${id}`, sig: 'k' + clef + id,
      reviewParams: { clef, pool: [id], ledger: p.ledger },
      prompt: `Where does the marked key go on the <strong>${clef}</strong> staff? Click its line or space.`,
      sub: 'Hover (or use the arrow keys) to preview, then click to place the note.',
      hint: () => { const lm = H.nearestLandmark(n, clef); return `The key is ${T.name(n, false)} (${H.describeVsMiddleC(n)}). Start from ${lm.label} (${lm.where}).`; },
      render(ui) {
        const kb = ui.keyboard({ from: clef === 'treble' ? 57 : 38, to: clef === 'treble' ? 84 : 64, labels: 'c', interactive: true, ownsInput: false });
        kb.setMark(n.midi, 'target', '?');
        const host = ui.box('stage');
        const pk = MC.Staff.picker(host, {
          clef, minPos: -3, maxPos: 11, width: 18, spPx: 13,
          onPick: (pp, picked) => {
            pk.lock(true);
            const ok = pp === pos;
            pk.show(pp, ok ? 'ok' : 'bad', T.name(picked, false) + (ok ? ' ✓' : ''));
            if (!ok) pk.addMark(pos, 'ok', T.name(n, false) + ' ✓');
            ui.submit({ correct: ok, msg: ok ? `Yes — ${T.name(n)} goes on ${T.posDesc(pos)}.` : `You placed ${T.name(picked)} on ${T.posDesc(pp)}. The key is <strong>${T.name(n)}</strong>, which goes on ${T.posDesc(pos)}. ${H.readExplain(n, clef)}` });
          },
        });
        void kb;
      },
    };
  };

  G.playAccidental = (p) => {
    const pool = p.pool || ['F#4', 'C#4', 'G#4', 'Bb4', 'Eb4', 'Ab4', 'D#4', 'F#5', 'Bb3', 'C#5', 'Eb5'];
    const id = T.pick(pool);
    const n = T.parse(id);
    const clef = n.midi >= 60 ? 'treble' : 'bass';
    const sign = n.acc > 0 ? 'sharp' : 'flat';
    return {
      skill: 'reading', item: 'readacc:' + id, sig: id,
      prompt: 'Play this note. Look carefully at the sign in front of it.',
      hint: `♯ (sharp) = one half step higher — the key just to the right. ♭ (flat) = one half step lower — the key just to the left.`,
      render(ui) {
        ui.staff({ clef, notes: [id], forceAcc: true });
        const kb = ui.keyboard({ from: clef === 'treble' ? 55 : 43, to: clef === 'treble' ? 81 : 64, labels: 'c' });
        H.keyAnswer(ui, (x) => {
          const reveal = () => { kb.setMark(n.midi, 'ok', T.name(n, false)); kb.setMark(n.midi - n.acc, 'hint', n.letter); };
          if (x === n.midi) return { correct: true, msg: `Yes — ${T.name(n)}: the ${sign} makes ${n.letter} one half step ${n.acc > 0 ? 'higher' : 'lower'}.`, after: reveal };
          if (x === n.midi - n.acc) return { correct: false, msg: `That is plain ${n.letter}. The ${sign} sign means play the key one half step ${n.acc > 0 ? 'to the right' : 'to the left'}.`, reveal };
          if (x === n.midi - 2 * n.acc) return { correct: false, msg: `Other direction! A ${sign} goes ${n.acc > 0 ? 'up (right)' : 'down (left)'}.`, reveal };
          return { correct: false, msg: `You played ${T.keyName(x)}. First find ${n.letter}${n.octave} (${H.describeVsMiddleC(T.note(n.letter, 0, n.octave))}), then move one key ${n.acc > 0 ? 'right' : 'left'}.`, reveal };
        });
      },
    };
  };

  G.barlineRule = (p) => {
    const variant = T.pick(['same', 'next']);
    const letter = T.pick(['F', 'C', 'G']);
    const up = T.parse(letter + '#4'), nat = T.parse(letter + '4');
    const other = T.stepFrom(nat, 1);
    const ans = variant === 'same' ? 'sharp' : 'natural';
    return {
      skill: 'reading', item: 'barline', sig: variant + letter,
      prompt: `Which key do you play for the <span style="color:var(--accent)">blue</span> note?`,
      hint: 'An accidental (♯ ♭ ♮) keeps working for the same note until the next barline.',
      render(ui) {
        const m1 = [{ n: T.id(up), dur: 'q' }, { n: T.id(other), dur: 'q' }, { n: T.id(up), dur: 'q', cls: variant === 'same' ? 'mk-target' : '' }, { n: T.id(other), dur: 'q' }];
        const m2 = [{ n: T.id(nat), dur: 'q', cls: variant === 'next' ? 'mk-target' : '' }, { n: T.id(other), dur: 'q' }, { n: T.id(nat), dur: 'h' }];
        const score = MC.Staff.fromNotes({ clef: 'treble', measures: [m1, m2], time: [4, 4] });
        ui.score(score, { timeSig: true, barlines: true, finalBar: true });
        ui.choices([{ label: `${letter} (white key)`, value: 'natural' }, { label: `${letter}♯ (black key)`, value: 'sharp' }], (v) => ui.submit({
          correct: v === ans, answer: ans,
          msg: variant === 'same'
            ? `${letter}♯. The sharp at the start of the measure still applies to later ${letter}s <strong>in the same measure</strong>, even without a new sign.`
            : `Plain ${letter}. The <strong>barline</strong> cancels the sharp — a new measure starts fresh.`,
        }), { big: true });
      },
    };
  };

  G.intervalName = (p) => {
    const nums = p.nums || [2, 3, 4, 5, 8];
    const n = T.pick(nums);
    const lowPool = H.whites(62, 84 - (n === 8 ? 12 : n + 1)).filter((m) => T.stepFrom(T.fromMidi(m), n - 1).midi <= 84);
    const a = T.fromMidi(T.pick(lowPool));
    const b = T.stepFrom(a, n - 1);
    const form = p.form || T.pick(['melodic', 'harmonic']);
    const path = H.walk(T.id(a), b);
    const bothLines = T.staffPos(a, 'treble') % 2 === T.staffPos(b, 'treble') % 2;
    return {
      skill: 'reading', item: 'int:' + n, sig: T.id(a) + n + form,
      prompt: 'What is the interval (distance) between these two notes?',
      hint: 'Count the letter names from the lower note to the higher note — <strong>count both notes</strong>. C to E: C(1) D(2) E(3) = a 3rd.',
      render(ui) {
        const spec = form === 'harmonic' ? { clef: 'treble', notes: [{ chord: [T.id(a), T.id(b)] }] } : { clef: 'treble', notes: [T.id(a), T.id(b)] };
        ui.staff(spec, { onNoteClick: () => { A.ensure(); H.playSeq(form === 'harmonic' ? [[a.midi, b.midi]] : [a.midi, b.midi], 0.6, 0.6); } });
        ui.listen(() => H.playSeq(form === 'harmonic' ? [[a.midi, b.midi]] : [a.midi, b.midi], 0.7, 0.8), 'Hear it');
        ui.choices(nums.concat(nums.includes(6) ? [] : []).map((k) => ({ label: T.INTERVAL_WORD[k], value: k })), (v) => {
          let msg = `${path.join(' ')} → ${path.length} letters = a <strong>${T.INTERVAL_WORD[n]}</strong>. `;
          if (v === n - 1) msg = 'You counted the gaps instead of the notes — count the starting note as 1. ' + msg;
          if (n % 2 === 1) msg += `Odd intervals look the same: ${bothLines && T.isLine(T.staffPos(a, 'treble')) ? 'line to line' : 'space to space'}.`;
          else if (n !== 8) msg += 'Even intervals (2nd, 4th) go from a line to a space or a space to a line.';
          ui.submit({ correct: v === n, answer: n, msg });
        });
      },
    };
  };

  G.intervalPlay = (p) => {
    const nums = p.nums || [2, 3, 4, 5];
    const n = T.pick(nums);
    const a = T.fromMidi(T.pick(H.whites(60, 72)));
    const b = T.stepFrom(a, n - 1);
    return {
      skill: 'keyboard', item: 'intplay:' + n, sig: T.id(a) + n,
      prompt: `Play a <strong>${T.INTERVAL_WORD[n]}</strong> above the marked ${a.letter}.`,
      sub: 'Use white keys only. Count the marked key as 1.',
      hint: `Count white keys: ${a.letter} is 1, then keep counting up to ${n}.`,
      render(ui) {
        const kb = ui.keyboard({ from: 55, to: 84, labels: p.labels || 'none' });
        kb.setMark(a.midi, 'target', '1');
        H.keyAnswer(ui, (x) => {
          const path = H.walk(T.id(a), b);
          const reveal = () => path.forEach((l, i) => kb.setMark(T.stepFrom(a, i).midi, i === path.length - 1 ? 'ok' : 'hint', String(i + 1)));
          if (x === b.midi) return { correct: true, msg: `Yes: ${path.join(' ')} — ${n} letters.`, after: reveal };
          if (!T.isBlack(x) && x > a.midi) {
            const got = T.intervalNumber(a, T.fromMidi(x));
            return { correct: false, msg: `That is a ${T.INTERVAL_WORD[got] || got + 'th'}. ${got === n + 1 ? 'You counted one too many — the starting key counts as 1.' : got === n - 1 ? 'One short — remember to count the starting key as 1.' : ''} A ${T.INTERVAL_WORD[n]} above ${a.letter} is ${b.letter}.`, reveal };
          }
          return { correct: false, msg: `Go up (to the right) on white keys. A ${T.INTERVAL_WORD[n]} above ${a.letter} is ${b.letter}: ${path.join(' ')}.`, reveal };
        }, (x) => x !== a.midi);
      },
    };
  };

  G.chordNumeral = (p) => {
    const pool = MC.study.chords.filter((c) => ['I', 'IV', 'V', 'vi'].includes(c.numeral));
    const chord = pool.find((c) => c.numeral === p.numeral) || T.pick(pool);
    return {
      skill: 'chords', item: 'numeral:C:' + chord.numeral, sig: chord.numeral,
      reviewParams: { numeral: chord.numeral },
      prompt: `In <strong>C major</strong>, which chord is <strong>${chord.numeral}</strong>?`,
      hint: 'Count the root along C D E F G A B: I is C, IV is F, V is G and vi is Am. Uppercase means major; lowercase means minor.',
      render(ui) {
        ui.choices(pool.map((c) => ({ label: c.name, value: c.numeral })), (v) => ui.submit({
          correct: v === chord.numeral, answer: chord.numeral,
          msg: `${chord.numeral} is <strong>${chord.name}</strong> in C major: ${chord.notes.map((n) => T.name(T.parse(n), false)).join('–')}. Its root is scale degree ${MC.study.chords.indexOf(chord) + 1}; the chord is ${chord.quality}.`,
        }));
      },
    };
  };

  G.keySig = (p) => {
    const keys = p.keys || ['C', 'G', 'F'];
    const key = T.pick(keys);
    const clef = p.clef || T.pick(['treble', 'bass']);
    const label = { C: 'C major — no sharps or flats', G: 'G major — one sharp (F♯)', F: 'F major — one flat (B♭)', D: 'D major — two sharps (F♯, C♯)' };
    return {
      skill: 'chords', item: 'keysig:' + key, sig: key + clef,
      prompt: 'Which key does this key signature show?',
      hint: 'Look right after the clef. One sharp (on the F line) = G major. One flat (on the B line) = F major. Nothing there = C major.',
      render(ui) {
        ui.staff({ clef, key, notes: [{ n: clef === 'treble' ? 'B4' : 'D3', hidden: true }] });
        ui.choices(keys.map((k) => ({ label: label[k], value: k })), (v) => ui.submit({
          correct: v === key, answer: key,
          msg: key === 'C' ? 'No sharps or flats after the clef means C major.' : key === 'G' ? 'One sharp, on the F line or space: every F is played as F♯. That is G major.' : key === 'F' ? 'One flat, on the B line: every B is played as B♭. That is F major.' : 'Two sharps: F♯ and C♯ — D major.',
        }));
      },
    };
  };

  G.keySigEffect = (p) => {
    const key = p.key || T.pick(['G', 'F']);
    const pool = key === 'G' ? ['F4', 'F5', 'F4', 'G4', 'B4', 'E5', 'D5'] : ['B4', 'B4', 'B3', 'A4', 'C5', 'F4', 'E4'];
    const id = T.pick(pool);
    const plain = T.parse(id);
    const n = T.note(plain.letter, T.keyAcc(key, plain.letter), plain.octave);
    const clef = n.midi >= 60 ? 'treble' : 'bass';
    const affected = n.acc !== 0;
    return {
      skill: 'chords', item: `kse:${key}:${affected ? 'on' : 'off'}`, sig: key + id,
      prompt: 'Play this note. Check the key signature first!',
      hint: key === 'G' ? 'The sharp on the F line means: every F is F♯ — in every octave.' : 'The flat on the B line means: every B is B♭ — in every octave.',
      render(ui) {
        ui.staff({ clef, key, notes: [T.id(n)] });
        const kb = ui.keyboard({ from: clef === 'treble' ? 55 : 43, to: clef === 'treble' ? 84 : 64, labels: 'c' });
        H.keyAnswer(ui, (x) => {
          const reveal = () => kb.setMark(n.midi, 'ok', T.name(n, false));
          if (x === n.midi) return { correct: true, msg: affected ? `Yes — ${T.name(n)}, because of the key signature.` : `Yes — ${T.name(n)}. The key signature only changes ${key === 'G' ? 'F' : 'B'}s, so this note stays natural.`, after: reveal };
          if (affected && x === plain.midi) return { correct: false, msg: `That is plain ${plain.letter}. The key signature says every ${plain.letter} is ${T.name(n, false)} in ${T.KEYS[key].name}.`, reveal };
          if (!affected && Math.abs(x - n.midi) === 1) return { correct: false, msg: `This note is not affected by the key signature — only ${key === 'G' ? 'F' : 'B'}s change. Play plain ${n.letter}.`, reveal };
          return { correct: false, msg: `You played ${T.keyName(x)}. This note is ${T.name(n)}. ${H.readExplain(plain, clef)}`, reveal };
        });
      },
    };
  };

  const SYMBOLS = {
    p: { voice: 'C5q@p D5q E5q F5q', meaning: 'Play softly (piano)' },
    mp: { voice: 'C5q@mp D5q E5q F5q', meaning: 'Moderately soft (mezzo piano)' },
    mf: { voice: 'C5q@mf D5q E5q F5q', meaning: 'Moderately loud (mezzo forte)' },
    f: { voice: 'C5q@f D5q E5q F5q', meaning: 'Play loudly (forte)' },
    cresc: { voice: '< C5q D5q E5q F5q !', meaning: 'Gradually get louder (crescendo)' },
    dim: { voice: '> F5q E5q D5q C5q !', meaning: 'Gradually get softer (diminuendo)' },
    stacc: { voice: 'C5q* D5q* E5q* F5q*', meaning: 'Short and detached (staccato)' },
    slur: { voice: '(C5q D5q E5q F5q)', meaning: 'Smooth and connected (legato)' },
    tie: { voice: 'E5h~ E5h', meaning: 'One sound held for both notes (tie)' },
    repeat: { voice: '|: C5q D5q E5h :|', meaning: 'Go back and play it again (repeat)' },
  };
  G.symbolMeaning = (p) => {
    const ids = p.symbols || Object.keys(SYMBOLS);
    const id = T.pick(ids);
    const others = T.shuffle(Object.keys(SYMBOLS).filter((k) => k !== id));
    const preferred = others.filter((k) => ids.includes(k)).concat(others.filter((k) => !ids.includes(k)));
    const opts = T.shuffle([id, ...preferred.slice(0, 3)]);
    return {
      skill: 'reading', item: 'sym:' + id, sig: id,
      prompt: 'What does the marking in this music ask you to do?',
      hint: 'Letters below the staff are about loudness; dots and curves are about how notes connect.',
      render(ui) {
        const sc = T.buildScore({ key: 'C', time: [4, 4], staves: [{ clef: 'treble', voice: SYMBOLS[id].voice }] });
        ui.score(sc, { spPx: 12 });
        ui.listen(() => { const tl = T.timeline(sc); const tr = new A.Transport({ bpm: 90, events: tl.items.map((it) => ({ t: it.t, d: it.d, midis: it.midis, vel: it.vel, stacc: it.stacc })), end: tl.total }); tr.play(); ui.scope.add(() => tr.stop(true)); }, 'Hear it');
        ui.choices(opts.map((k) => ({ label: SYMBOLS[k].meaning, value: k })), (v) => ui.submit({ correct: v === id, answer: id, msg: `This marking means: <strong>${SYMBOLS[id].meaning}</strong>.` }));
      },
    };
  };

  G.dynamicsOrder = (p) => {
    const pool = p.pool || ['p', 'mp', 'mf', 'f'];
    const [a, b] = T.shuffle(pool).slice(0, 2);
    const louder = T.DYN_ORDER.indexOf(a) > T.DYN_ORDER.indexOf(b) ? a : b;
    const glyph = (d) => d.split('').map((c) => ({ p: '\uE520', m: '\uE521', f: '\uE522' }[c])).join('');
    return {
      skill: 'reading', item: 'dyn:order', sig: a + b,
      prompt: 'Which marking asks for the <strong>louder</strong> sound?',
      hint: '<em>p</em> = soft, <em>f</em> = loud. <em>m</em> (mezzo) means “moderately” — it moves the marking toward the middle.',
      render(ui) {
        ui.choices([a, b].map((d) => ({ value: d, el: h('span.dyn-choice', null, h('span.dyn-glyph', null, glyph(d)), h('span.small.muted', null, ' ' + d)), aria: d })), (v) => ui.submit({
          correct: v === louder, answer: louder,
          msg: `From soft to loud: ${T.DYN_ORDER.map((d) => `<strong>${d}</strong>`).join(' · ')}. ${louder} is louder.`,
        }), { big: true });
      },
    };
  };

  G.tieOrSlur = (p) => {
    const kind = T.pick(['tie', 'slur']);
    const pitch = T.pick(['E4', 'G4', 'C5', 'A4']);
    const other = T.id(T.stepFrom(pitch, T.pick([1, -1, 2])));
    return {
      skill: 'reading', item: 'tieslur', sig: kind + pitch,
      prompt: 'Is this curved line a <strong>tie</strong> or a <strong>slur</strong>?',
      hint: 'Look at the two notes the curve connects. Same line or space? Or different?',
      render(ui) {
        const voice = kind === 'tie' ? `${pitch}h~ ${pitch}h` : `(${pitch}h ${other}h)`;
        const sc = T.buildScore({ key: 'C', time: [4, 4], staves: [{ clef: 'treble', voice }] });
        ui.score(sc, { spPx: 12 });
        ui.choices([{ label: 'Tie', value: 'tie' }, { label: 'Slur', value: 'slur' }], (v) => ui.submit({
          correct: v === kind, answer: kind,
          msg: kind === 'tie' ? 'A <strong>tie</strong>: it joins two notes of the <em>same pitch</em>. Play once and hold for both values added together.' : 'A <strong>slur</strong>: it joins <em>different</em> notes. Play them smoothly connected (legato).',
        }), { big: true });
      },
    };
  };

  G.sightRead = (p) => {
    const position = p.position || T.pick(['C4', 'C4', 'G4']);
    const key = p.key || (position[0] === 'G' ? 'G' : position[0] === 'F' ? 'F' : 'C');
    const hand = p.hand || (T.parse(position).midi < 60 ? 'lh' : 'rh');
    const beats = p.beats || T.pick([4, 4, 3]);
    const measures = p.measures || 4;
    const voice = T.randomMelody({ position, key, measures, beats, eighths: !!p.eighths, hand });
    const clef = hand === 'lh' ? 'bass' : 'treble';
    const piece = { id: 'sight', key, time: [beats, 4], tempo: 70, staves: [{ clef, hand, voice }] };
    return {
      skill: 'reading', item: 'sight:' + position, sig: voice,
      prompt: 'Sight-reading: play this short melody you have never seen before.',
      sub: `Before you play: key ${T.KEYS[key].name}, ${beats}/4 time, ${hand === 'rh' ? 'right' : 'left'} hand in ${T.name(T.parse(position), false)} position. Find the first note, then read by steps and skips. No timing pressure.`,
      hint: `Put your ${hand === 'rh' ? 'thumb' : 'little finger'} on ${T.name(T.parse(position))}. The finger numbers above the notes show which finger to use.`,
      render(ui) {
        const sc = T.buildScore(piece);
        const st = ui.score(sc, { showFingers: ui.attempt > 0 || p.fingers !== false, showCounts: false });
        const on = T.onsets(T.timeline(sc));
        const midis = on.map((o) => o.midis[0]);
        const lo = Math.floor((Math.min(...midis) - 3) / 12) * 12;
        const kb = ui.keyboard({ from: lo, to: Math.max(lo + 24, Math.max(...midis) + 3), labels: 'c' });
        const firstWrong = new Set();
        H.seqInput(ui, kb, midis, {
          onWrong: (i, got) => { firstWrong.add(i); st.mark(on[i].items[0].ref, 'bad', ''); },
          done: () => {
            const right = midis.length - firstWrong.size;
            const pct = right / midis.length;
            on.forEach((o, i) => { if (!firstWrong.has(i)) st.mark(o.items[0].ref, 'ok', '✓'); });
            ui.submit({ correct: pct >= 0.8, title: pct >= 0.8 ? 'Sight-read successfully' : 'Finished — keep practising', msg: `${right} of ${midis.length} notes right on the first try (${MC.util.pct(pct)}). ${pct >= 0.8 ? '' : 'Tip: before playing, say the note names or the pattern (step up, skip down…) out loud.'}` });
          },
        });
      },
    };
  };
})(window.MC = window.MC || {});
