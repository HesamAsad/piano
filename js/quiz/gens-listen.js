/* Question generators — melodic direction, interval size, articulation, scales and chords. */
(function (MC) {
  'use strict';
  const G = MC.gens;
  const H = MC.genHelpers;
  const T = MC.theory;
  const A = MC.audio;
  const { h } = MC.util;

  G.listenDirection = (p) => {
    const types = p.mixed ? ['up', 'down', 'repeat', 'up-down', 'down-up'] : ['up', 'down', 'repeat'];
    const type = T.pick(types);
    const start = T.fromMidi(T.pick(H.whites(60, 72)));
    const st = (k) => T.stepFrom(start, k);
    const seqs = {
      up: [0, 1, 2, T.pick([3, 4])], down: [0, -1, -2, T.pick([-3, -4])], repeat: [0, 0, 0, 0],
      'up-down': [0, 2, 4, 2], 'down-up': [0, -2, -4, -2],
    };
    const shift = type === 'down' || type === 'down-up' ? 4 : 0;
    const notes = seqs[type].map((k) => st(k + shift));
    const labels = { up: 'Goes up', down: 'Goes down', repeat: 'Stays the same (repeats)', 'up-down': 'Up, then down', 'down-up': 'Down, then up' };
    return {
      skill: 'listening', item: 'listendir:' + type, sig: type + T.id(start), listen: true,
      prompt: 'Listen to the short pattern. How does it move?',
      hint: 'Draw the pattern in the air with your finger as you listen: up, down, or flat?',
      render(ui) {
        ui.listen(() => H.playSeq(notes.map((n) => n.midi), 0.55, 0.5));
        ui.choices(types.map((t) => ({ label: labels[t], value: t })), (v) => ui.submit({
          correct: v === type, answer: type,
          msg: `It ${type === 'repeat' ? 'repeated the same note' : type.includes('-') ? `went ${type.replace('-', ', then ')}` : `went ${type}`}: ${notes.map((n) => T.name(n, false)).join(' → ')}.`,
          reveal: () => ui.staff({ clef: 'treble', notes: notes.map((n) => T.id(n)), names: true }),
          after: () => ui.staff({ clef: 'treble', notes: notes.map((n) => T.id(n)), names: true }),
        }));
      },
      visual(ui) {
        ui.setPrompt('Look at the notes on the staff. How does the pattern move?', 'Visual version: higher on the staff = higher in pitch.');
        ui.staff({ clef: 'treble', notes: notes.map((n) => T.id(n)) });
        ui.choices(types.map((t) => ({ label: labels[t], value: t })), (v) => ui.submit({ correct: v === type, answer: type, msg: `The notes move ${type === 'repeat' ? 'nowhere — they repeat' : type.replace('-', ', then ')}.` }));
      },
    };
  };

  G.intervalCompare = (p) => {
    const sizes = p.nums || [2, 3, 5, 8];
    let [n1, n2] = T.shuffle(sizes).slice(0, 2);
    const a1 = T.fromMidi(T.pick(H.whites(55, 64)));
    const a2 = T.fromMidi(T.pick(H.whites(55, 64)));
    const b1 = T.stepFrom(a1, n1 - 1), b2 = T.stepFrom(a2, n2 - 1);
    const ans = n1 > n2 ? 'first' : 'second';
    return {
      skill: 'listening', item: 'intcmp', sig: `${n1}-${n2}`, listen: true,
      prompt: 'You will hear two jumps (two notes each). Which jump was <strong>bigger</strong>?',
      hint: 'Sing or hum each pair. A bigger jump needs a bigger change in your voice.',
      render(ui) {
        ui.listen(() => { H.playSeq([a1.midi, b1.midi], 0.6, 0.55); setTimeout(() => H.playSeq([a2.midi, b2.midi], 0.6, 0.55), 1700); });
        ui.choices([{ label: 'The first jump', value: 'first' }, { label: 'The second jump', value: 'second' }], (v) => ui.submit({
          correct: v === ans, answer: ans,
          msg: `First: ${T.name(a1, false)}→${T.name(b1, false)} (a ${T.INTERVAL_WORD[n1]}). Second: ${T.name(a2, false)}→${T.name(b2, false)} (a ${T.INTERVAL_WORD[n2]}). The ${ans} was bigger.`,
        }), { big: true });
      },
      visual(ui) {
        ui.setPrompt('Which pair of notes is further apart: the first measure or the second?');
        ui.score(MC.Staff.fromNotes({ clef: 'treble', time: null, measures: [[T.id(a1), T.id(b1)], [T.id(a2), T.id(b2)]] }), { barlines: true, free: true, timeSig: false });
        ui.choices([{ label: 'First pair', value: 'first' }, { label: 'Second pair', value: 'second' }], (v) => ui.submit({ correct: v === ans, answer: ans, msg: `First pair: a ${T.INTERVAL_WORD[n1]}; second pair: a ${T.INTERVAL_WORD[n2]}.` }), { big: true });
      },
    };
  };

  G.chordQuality = (p) => {
    const roots = p.roots || ['C4', 'D4', 'E4', 'F4', 'G4', 'A3'];
    const root = T.pick(roots);
    const q = p.quality || T.pick(['major', 'minor']);
    const notes = T.triad(root, q);
    const midis = notes.map((n) => n.midi);
    const name = T.chordName(root, q);
    return {
      skill: 'chords', item: 'quality:' + q, sig: root + q, listen: true,
      prompt: 'Listen to the chord (played together, then one note at a time). Is it <strong>major</strong> or <strong>minor</strong>?',
      hint: 'Many listeners hear major as brighter or more settled, and minor as darker or more wistful. The real difference is the middle note: 4 half steps above the root for major, 3 for minor.',
      render(ui) {
        ui.listen(() => { A.ensure(); const t0 = A.now() + 0.08; midis.forEach((m) => A.play(m, 1.2, 0.6, t0)); midis.forEach((m, i) => A.play(m, 0.5, 0.6, t0 + 1.5 + i * 0.45)); });
        ui.choices([{ label: 'Major', value: 'major' }, { label: 'Minor', value: 'minor' }], (v) => ui.submit({
          correct: v === q, answer: q,
          msg: `It was <strong>${T.chordLongName(root, q)}</strong> (${notes.map((n) => T.name(n, false)).join(' – ')}): root to middle note = ${q === 'major' ? 4 : 3} half steps.`,
          reveal: () => H.revealKeys(ui, notes.map((n, i) => [n.midi, 'ok', T.name(n, false)]), 53, 76),
          after: () => H.revealKeys(ui, notes.map((n, i) => [n.midi, 'ok', T.name(n, false)]), 53, 76),
        }), { big: true });
      },
      visual(ui) {
        ui.setPrompt(`Count the half steps from the bottom key to the middle key. Is this chord major or minor?`, 'Major = 4 half steps, then 3. Minor = 3, then 4.');
        H.revealKeys(ui, notes.map((n) => [n.midi, 'target', T.name(n, false)]), 53, 76);
        ui.choices([{ label: 'Major', value: 'major' }, { label: 'Minor', value: 'minor' }], (v) => ui.submit({ correct: v === q, answer: q, msg: `${name}: ${T.name(notes[0], false)}→${T.name(notes[1], false)} is ${q === 'major' ? 4 : 3} half steps, so it is ${q}.` }), { big: true });
      },
    };
  };

  G.hearArticulation = (p) => {
    const kind = T.pick(['legato', 'staccato']);
    const start = T.pick([60, 62, 64]);
    const ms = [0, 2, 4, 5, 7].map((d) => start + d).slice(0, 4);
    const voice = kind === 'legato' ? `(${ms.map((m) => T.id(T.fromMidi(m)) + 'q').join(' ')})` : ms.map((m) => T.id(T.fromMidi(m)) + 'q*').join(' ');
    return {
      skill: 'listening', item: 'artic', sig: kind + start, listen: true,
      prompt: 'Listen. Are the notes played <strong>legato</strong> (smooth, connected) or <strong>staccato</strong> (short, detached)?',
      hint: 'Is there silence between the notes? Short sounds with gaps = staccato.',
      render(ui) {
        ui.listen(() => { A.ensure(); const t0 = A.now() + 0.08; ms.forEach((m, i) => A.play(m, kind === 'legato' ? 0.68 : 0.13, 0.65, t0 + i * 0.62)); });
        ui.choices([{ label: 'Legato (smooth)', value: 'legato' }, { label: 'Staccato (short)', value: 'staccato' }], (v) => ui.submit({
          correct: v === kind, answer: kind,
          msg: kind === 'legato' ? 'Legato: each note lasts until the next begins. It is written with a curved line called a slur.' : 'Staccato: each note is cut short, leaving small silences. It is written with a dot above or below each note.',
          reveal: () => ui.score(T.buildScore({ key: 'C', time: [4, 4], staves: [{ clef: 'treble', voice }] }), { spPx: 11 }),
          after: () => ui.score(T.buildScore({ key: 'C', time: [4, 4], staves: [{ clef: 'treble', voice }] }), { spPx: 11 }),
        }), { big: true });
      },
      visual(ui) {
        ui.setPrompt('Which way should these notes be played?');
        ui.score(T.buildScore({ key: 'C', time: [4, 4], staves: [{ clef: 'treble', voice }] }), { spPx: 12 });
        ui.choices([{ label: 'Legato (smooth)', value: 'legato' }, { label: 'Staccato (short)', value: 'staccato' }], (v) => ui.submit({ correct: v === kind, answer: kind, msg: kind === 'legato' ? 'The curved slur means legato.' : 'The dots mean staccato.' }), { big: true });
      },
    };
  };

  /* ---------- Scales ---------- */
  const SCALE_START = { C: 'C4', G: 'G3', F: 'F3', D: 'D4' };
  const SCALE_FINGERS = { C: [1, 2, 3, 1, 2, 3, 4, 5], G: [1, 2, 3, 1, 2, 3, 4, 5], D: [1, 2, 3, 1, 2, 3, 4, 5], F: [1, 2, 3, 4, 1, 2, 3, 4] };
  G.buildScale = (p) => {
    const key = p.key || T.pick(p.keys || ['C', 'G', 'F']);
    const tonic = p.start || (key === 'C' ? 'C4' : key === 'G' ? 'G4' : key === 'F' ? 'F4' : 'D4');
    const sc = T.majorScale(tonic);
    const midis = sc.map((n) => n.midi);
    const steps = ['W', 'W', 'H', 'W', 'W', 'W', 'H'];
    const guided = p.guide != null ? p.guide : false;
    return {
      skill: 'chords', item: 'scale:' + key, sig: 'scale' + key + guided,
      prompt: `Play the <strong>${T.KEYS[key].name}</strong> scale going up: 8 notes, from ${T.name(sc[0], false)} to ${T.name(sc[7], false)}.`,
      sub: 'Pattern: whole · whole · half · whole · whole · whole · half. (W = whole step = skip one key; H = half step = the very next key.)',
      hint: 'Only the 3rd→4th and 7th→8th steps are half steps. Every other step skips one key.' + (key === 'G' ? ' In G major that means F♯ near the top.' : key === 'F' ? ' In F major the 4th note is B♭.' : ''),
      render(ui) {
        const kb = ui.keyboard({ from: midis[0] - 5 - T.mod(midis[0] - 5, 12), to: midis[7] + 4, labels: 'white', fingers: guided ? Object.fromEntries(midis.map((m, i) => [m, SCALE_FINGERS[key][i]])) : null });
        H.seqInput(ui, kb, midis, {
          stepLabels: steps,
          guide: guided,
          flat: key === 'F',
          names: sc.map((n) => T.name(n, false)),
          onWrong: (i, got, want) => {
            const prev = midis[i - 1];
            const need = steps[i - 1];
            const gotD = prev != null ? got - prev : null;
            let m = `The next note is ${T.name(sc[i], false)}.`;
            if (prev != null) m = `From ${T.name(sc[i - 1], false)} the pattern needs a ${need === 'W' ? 'whole step (skip one key)' : 'half step (the very next key)'}; you moved ${gotD === 1 ? 'a half step' : gotD === 2 ? 'a whole step' : Math.abs(gotD) + ' half steps'}.`;
            MC.util.toast(m, 'bad');
          },
          done: (errors) => ui.submit({
            correct: errors === 0,
            msg: `${sc.map((n) => T.name(n, false)).join(' ')}. ${errors ? `(${errors} wrong key${errors > 1 ? 's' : ''} on the way.)` : ''} ${key === 'C' ? 'All white keys — C major is the only major scale like that.' : key === 'G' ? 'F♯ is needed to make the half step between the 7th and 8th notes.' : key === 'F' ? 'B♭ is needed to make the half step between the 3rd and 4th notes.' : ''} Right-hand fingering: ${SCALE_FINGERS[key].join(' ')}.`,
            reveal: () => kb.setFingers(Object.fromEntries(midis.map((m, i) => [m, SCALE_FINGERS[key][i]])), 'rh'),
          }),
        });
      },
    };
  };
  G.scaleHalfSteps = (p) => {
    const opts = [['3-4,7-8', '3–4 and 7–8'], ['2-3,6-7', '2–3 and 6–7'], ['4-5,7-8', '4–5 and 7–8'], ['1-2,5-6', '1–2 and 5–6']];
    return {
      skill: 'chords', item: 'scale:half', sig: 'sh' + Math.random(),
      prompt: 'In every major scale, where are the two <strong>half steps</strong>? (between which scale notes)',
      hint: 'Look at C major on the keyboard: where are there no black keys between neighbouring notes?',
      render(ui) {
        const kb = H.revealKeys(ui, T.majorScale('C4').map((n, i) => [n.midi, 'hint', String(i + 1)]), 60, 72);
        void kb;
        ui.choices(T.shuffle(opts).map(([value, label]) => ({ label, value })), (v) => ui.submit({ correct: v === '3-4,7-8', answer: '3-4,7-8', msg: 'Between notes <strong>3–4</strong> and <strong>7–8</strong>. In C major that is E–F and B–C — the two pairs of white keys with no black key between them.' }));
      },
    };
  };

  /* ---------- Chords ---------- */
  const CHORDS = {
    C: ['C4', 'major'], F: ['F4', 'major'], G: ['G4', 'major'], Am: ['A4', 'minor'], Dm: ['D4', 'minor'], Em: ['E4', 'minor'],
    D: ['D4', 'major'], A: ['A3', 'major'], E: ['E4', 'major'], Cm: ['C4', 'minor'], Gm: ['G4', 'minor'],
  };
  G.buildChord = (p) => {
    const list = p.chords || ['C', 'F', 'G', 'Am'];
    const name = T.pick(list);
    const [root, q] = CHORDS[name];
    const notes = T.triad(root, q);
    const pcs = notes.map((n) => T.mod(n.midi, 12)).sort((a, b) => a - b);
    const lh = p.hand === 'lh';
    const from = lh ? 43 : 55, to = lh ? 64 : 81;
    return {
      skill: 'chords', item: 'chord:' + name, sig: name,
      prompt: `Build a <strong>${T.chordLongName(root, q)}</strong> chord (${name}). Select three keys, then press “Check”.`,
      sub: 'Click keys to select or unselect them. Any octave is fine, and the notes may be in any order.',
      hint: () => `Start on ${T.name(T.parse(root), false)}, then skip a letter twice: ${notes.map((n) => T.name(n, false)).join(' – ')}. ${q === 'major' ? 'Major: 4 half steps, then 3.' : 'Minor: 3 half steps, then 4.'}`,
      render(ui) {
        const kb = ui.keyboard({ from, to, labels: p.labels || 'white' });
        const sel = new Set();
        const out = h('div.caption', { 'aria-live': 'polite' }, 'Selected: none');
        ui.area.appendChild(out);
        const upd = () => { kb.clearMarks('sel'); [...sel].forEach((m) => kb.setMark(m, 'sel', T.keyName(m, false).split('/')[q === 'minor' && name.length > 2 ? 1 : 0])); out.textContent = 'Selected: ' + ([...sel].sort((a, b) => a - b).map((m) => T.keyName(m, false)).join(', ') || 'none'); };
        ui.onInput((ev) => { if (ev.type !== 'on') return; if (sel.has(ev.midi)) sel.delete(ev.midi); else sel.add(ev.midi); upd(); });
        const row = h('div.row');
        const check = MC.util.btn('Check chord', () => {
          const got = [...sel].sort((a, b) => a - b);
          const gotPcs = [...new Set(got.map((m) => T.mod(m, 12)))].sort((a, b) => a - b);
          const ok = gotPcs.length === 3 && got.length === 3 && gotPcs.join() === pcs.join();
          A.ensure();
          got.forEach((m) => A.play(m, 1.0, 0.6));
          let msg;
          if (ok) {
            const rootPos = T.mod(got[0], 12) === T.mod(notes[0].midi, 12);
            msg = `Yes — ${notes.map((n) => T.name(n, false)).join(' – ')}. ${rootPos ? `Root position: ${T.name(notes[0], false)} at the bottom.` : `Correct notes, rearranged (an <em>inversion</em>) — still a ${name} chord.`}`;
          } else if (got.length !== 3) msg = `A triad has exactly three notes; you selected ${got.length}.`;
          else {
            const idt = T.identifyTriad(got);
            const a = got[1] - got[0], b = got[2] - got[1];
            msg = idt ? `You built ${T.chordName(T.fromMidi(60 + idt.rootPc, name.includes('b') ? 'flat' : 'sharp'), idt.quality)} (${idt.quality}). ` : `Your keys are ${a} and ${b} half steps apart. `;
            if (idt && idt.rootPc === T.mod(notes[0].midi, 12) && idt.quality !== q) msg += `Right root, wrong quality: for ${q} the middle note must be ${q === 'major' ? 4 : 3} half steps above the root.`;
            msg += ` ${name} = ${notes.map((n) => T.name(n, false)).join(' – ')}.`;
          }
          ui.submit({ correct: ok, msg, reveal: () => notes.forEach((n) => { const m = n.midi - (n.midi > to ? 12 : 0); kb.setMark(m, 'ok', T.name(n, false)); }) });
        }, 'btn-primary');
        row.append(check, MC.util.btn('Clear', () => { sel.clear(); upd(); }));
        ui.area.appendChild(row);
      },
    };
  };

  G.chordForMelody = (p) => {
    const chords = { C: ['C', 'E', 'G'], F: ['F', 'A', 'C'], G: ['G', 'B', 'D'] };
    const name = T.pick(Object.keys(chords));
    const tones = chords[name];
    const pool = { C: ['C4', 'E4', 'G4', 'C5', 'E5'], F: ['F4', 'A4', 'C5', 'F5'], G: ['G4', 'B4', 'D5', 'D4'] }[name];
    const mel = [T.pick(pool), T.pick(pool), T.pick(pool), T.pick(pool)];
    return {
      skill: 'chords', item: 'harm:' + name, sig: mel.join(),
      prompt: 'Which chord would fit best under this measure of melody?',
      sub: 'C = C E G · F = F A C · G = G B D',
      hint: 'Name each melody note, then find the chord that contains the most of them.',
      render(ui) {
        const sc = T.buildScore({ key: 'C', time: [4, 4], staves: [{ clef: 'treble', voice: mel.map((m) => m + 'q').join(' ') }] });
        ui.score(sc, { showNames: ui.mode !== 'check', spPx: 12 });
        ui.listen(() => H.playSeq(mel.map((m) => T.midi(m)), 0.5, 0.45), 'Hear the melody');
        ui.choices(['C', 'F', 'G'].map((c) => ({ label: `${c} major (${chords[c].join(' ')})`, value: c })), (v) => {
          const shared = mel.filter((m) => tones.includes(m[0])).length;
          ui.submit({ correct: v === name, answer: name, msg: `The melody uses ${[...new Set(mel.map((m) => m[0]))].join(', ')} — all notes of <strong>${name} major</strong> (${tones.join(' ')}). ${shared === 4 ? 'When the melody and chord share notes, they blend.' : ''}` });
          A.ensure();
          const t0 = A.now() + 0.1;
          T.triad(CHORDS[name][0].replace('4', '3'), 'major').forEach((n) => A.play(n.midi, 2.2, 0.45, t0));
          mel.forEach((m, i) => A.play(T.midi(m), 0.45, 0.65, t0 + i * 0.5));
        });
      },
    };
  };
})(window.MC = window.MC || {});
