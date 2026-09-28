/* Music theory core: pitch spelling, staff positions, intervals, scales, chords,
   rhythm/notation parsing and playback timelines. Pure functions, no DOM. */
(function (MC) {
  'use strict';
  const T = (MC.theory = {});
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const mod = (a, n) => ((a % n) + n) % n;
  T.LETTERS = LETTERS;
  T.mod = mod;

  function note(letter, acc, octave) {
    const n = { letter, acc: acc || 0, octave };
    n.midi = 12 * (octave + 1) + LETTER_PC[letter] + n.acc;
    return n;
  }
  T.note = note;

  T.parse = function (s) {
    if (s && typeof s === 'object') return s;
    const m = /^([A-G])(bb|#|b|n|x)?(-?\d)$/.exec(String(s).trim());
    if (!m) throw new Error('Bad note: ' + s);
    const acc = { '#': 1, b: -1, n: 0, x: 2, bb: -2 }[m[2]] || 0;
    const n = note(m[1], acc, +m[3]);
    if (m[2] === 'n') n.forceNatural = true;
    return n;
  };
  T.midi = (s) => T.parse(s).midi;

  const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  T.fromMidi = function (midi, prefer) {
    const pc = mod(midi, 12);
    const oct = Math.floor(midi / 12) - 1;
    const nm = (prefer === 'flat' ? FLAT_NAMES : SHARP_NAMES)[pc];
    return note(nm[0], nm.length > 1 ? (nm[1] === '#' ? 1 : -1) : 0, oct);
  };

  const ACC_TXT = { '-2': '𝄫', '-1': '♭', 0: '', 1: '♯', 2: '𝄪' };
  const ACC_ASCII = { '-2': 'bb', '-1': 'b', 0: '', 1: '#', 2: 'x' };
  T.accText = (a) => ACC_TXT[a];
  T.name = (n, withOct) => {
    n = T.parse(n);
    return n.letter + ACC_TXT[n.acc] + (withOct === false ? '' : n.octave);
  };
  T.id = (n) => {
    n = T.parse(n);
    return n.letter + ACC_ASCII[n.acc] + n.octave;
  };
  T.isBlack = (midi) => [1, 3, 6, 8, 10].includes(mod(midi, 12));
  T.freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
  /* Friendly name for a key: white keys by letter; black keys with both spellings. */
  T.keyName = (midi, withOct) => {
    const o = withOct === false ? '' : Math.floor(midi / 12) - 1;
    if (!T.isBlack(midi)) return T.fromMidi(midi).letter + o;
    const s = T.fromMidi(midi, 'sharp');
    const f = T.fromMidi(midi, 'flat');
    return `${s.letter}♯${o}/${f.letter}♭${o}`;
  };
  T.letterOf = (midi) => T.fromMidi(midi).letter;

  /* ---------- Staff positions ---------- */
  T.diatonic = (n) => {
    n = T.parse(n);
    return n.octave * 7 + LETTERS.indexOf(n.letter);
  };
  /* Diatonic number of the bottom staff line: treble = E4, bass = G2. */
  T.CLEF_BOTTOM = { treble: 30, bass: 18 };
  /* pos 0 = bottom line, 1 = first space, 2 = second line … 8 = top line. */
  T.staffPos = (n, clef) => T.diatonic(n) - T.CLEF_BOTTOM[clef];
  T.fromPos = (pos, clef, acc) => {
    const d = pos + T.CLEF_BOTTOM[clef];
    return note(LETTERS[mod(d, 7)], acc || 0, Math.floor(d / 7));
  };
  T.posDesc = (pos) => {
    if (pos >= 0 && pos <= 8) return pos % 2 === 0 ? `line ${pos / 2 + 1}` : `space ${(pos + 1) / 2}`;
    if (pos < 0) {
      const ledgers = Math.floor(-pos / 2);
      if (pos === -1) return 'the space just below the staff';
      return pos % 2 === 0
        ? `${ledgers} ledger line${ledgers > 1 ? 's' : ''} below the staff`
        : `below ${ledgers} ledger line${ledgers > 1 ? 's' : ''} under the staff`;
    }
    const ledgers = Math.floor((pos - 8) / 2);
    if (pos === 9) return 'the space just above the staff';
    return pos % 2 === 0
      ? `${ledgers} ledger line${ledgers > 1 ? 's' : ''} above the staff`
      : `above ${ledgers} ledger line${ledgers > 1 ? 's' : ''} over the staff`;
  };
  T.isLine = (pos) => mod(pos, 2) === 0;

  T.LANDMARKS = [
    { id: 'C3', label: 'Low C', clef: 'bass', where: 'second space of the bass staff' },
    { id: 'F3', label: 'Bass F', clef: 'bass', where: 'fourth line of the bass staff — between the two dots of the bass clef' },
    { id: 'C4', label: 'Middle C', clef: 'both', where: 'one ledger line below the treble staff, or one above the bass staff' },
    { id: 'G4', label: 'Treble G', clef: 'treble', where: 'second line of the treble staff — the line the treble clef curls around' },
    { id: 'C5', label: 'High C', clef: 'treble', where: 'third space of the treble staff' },
  ];

  /* ---------- Keys, intervals, scales, chords ---------- */
  T.KEYS = {
    C: { acc: {}, sig: [], type: 'none', name: 'C major' },
    G: { acc: { F: 1 }, sig: ['F'], type: 'sharp', name: 'G major' },
    D: { acc: { F: 1, C: 1 }, sig: ['F', 'C'], type: 'sharp', name: 'D major' },
    F: { acc: { B: -1 }, sig: ['B'], type: 'flat', name: 'F major' },
    Bb: { acc: { B: -1, E: -1 }, sig: ['B', 'E'], type: 'flat', name: 'B♭ major' },
  };
  T.SIG_POS = {
    sharp: { treble: [8, 5, 9, 6, 3, 7, 4], bass: [6, 3, 7, 4, 1, 5, 2] },
    flat: { treble: [4, 7, 3, 6, 2, 5, 1], bass: [2, 5, 1, 4, 0, 3, -1] },
  };
  T.keyAcc = (key, letter) => (T.KEYS[key || 'C'].acc[letter] || 0);
  T.stepFrom = (n, steps, key) => {
    n = T.parse(n);
    const d = T.diatonic(n) + steps;
    const letter = LETTERS[mod(d, 7)];
    return note(letter, T.keyAcc(key, letter), Math.floor(d / 7));
  };

  T.INTERVAL_WORD = { 1: 'unison', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th', 8: 'octave' };
  T.INTERVAL_LONG = { 1: 'unison (same note)', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'octave' };
  T.intervalNumber = (a, b) => Math.abs(T.diatonic(b) - T.diatonic(a)) + 1;
  T.semis = (a, b) => Math.abs(T.parse(b).midi - T.parse(a).midi);
  const QUAL = {
    1: { 0: 'perfect' },
    2: { 1: 'minor', 2: 'major' },
    3: { 3: 'minor', 4: 'major' },
    4: { 5: 'perfect', 6: 'augmented' },
    5: { 6: 'diminished', 7: 'perfect' },
    6: { 8: 'minor', 9: 'major' },
    7: { 10: 'minor', 11: 'major' },
    8: { 12: 'perfect' },
  };
  T.intervalQuality = (a, b) => {
    const num = T.intervalNumber(a, b);
    return (QUAL[num] && QUAL[num][T.semis(a, b)]) || '';
  };

  T.MAJOR = [2, 2, 1, 2, 2, 2, 1];
  T.majorScale = (tonic) => {
    tonic = T.parse(tonic);
    const out = [tonic];
    let midi = tonic.midi;
    let d = T.diatonic(tonic);
    for (const s of T.MAJOR) {
      midi += s;
      d += 1;
      const letter = LETTERS[mod(d, 7)];
      const oct = Math.floor(d / 7);
      out.push(note(letter, midi - note(letter, 0, oct).midi, oct));
    }
    return out;
  };

  T.CHORD_SEMIS = { major: [4, 7], minor: [3, 7] };
  T.triad = (root, quality) => {
    root = T.parse(root);
    const semis = T.CHORD_SEMIS[quality || 'major'];
    const out = [root];
    [2, 4].forEach((dd, i) => {
      const d = T.diatonic(root) + dd;
      const letter = LETTERS[mod(d, 7)];
      const oct = Math.floor(d / 7);
      out.push(note(letter, root.midi + semis[i] - note(letter, 0, oct).midi, oct));
    });
    return out;
  };
  T.chordName = (root, quality) => {
    root = T.parse(root);
    return root.letter + ACC_TXT[root.acc] + (quality === 'minor' ? 'm' : '');
  };
  T.chordLongName = (root, quality) => {
    root = T.parse(root);
    return `${root.letter}${ACC_TXT[root.acc]} ${quality === 'minor' ? 'minor' : 'major'}`;
  };
  /* Identify a triad from a set of midi numbers (any octave, any order). */
  T.identifyTriad = (midis) => {
    const pcs = [...new Set(midis.map((m) => mod(m, 12)))];
    if (pcs.length !== 3) return null;
    for (const r of pcs) {
      const rel = pcs.map((p) => mod(p - r, 12)).sort((a, b) => a - b);
      if (rel[1] === 4 && rel[2] === 7) return { rootPc: r, quality: 'major' };
      if (rel[1] === 3 && rel[2] === 7) return { rootPc: r, quality: 'minor' };
    }
    return null;
  };

  /* ---------- Rhythm ---------- */
  T.DUR = { w: 4, h: 2, q: 1, e: 0.5 };
  T.DUR_NAME = { w: 'whole note', h: 'half note', q: 'quarter note', e: 'eighth note' };
  T.REST_NAME = { w: 'whole rest', h: 'half rest', q: 'quarter rest', e: 'eighth rest' };
  T.beatsPerMeasure = (time) => (time[0] * 4) / time[1];
  T.VELOCITY = { pp: 0.3, p: 0.42, mp: 0.55, mf: 0.67, f: 0.82, ff: 0.95 };
  T.DYN_ORDER = ['pp', 'p', 'mp', 'mf', 'f', 'ff'];
  T.DYN_WORD = { pp: 'pianissimo — very soft', p: 'piano — soft', mp: 'mezzo piano — moderately soft', mf: 'mezzo forte — moderately loud', f: 'forte — loud', ff: 'fortissimo — very loud' };

  const TOKEN = /^(\()?(\[[^\]]+\]|r|[A-G](?:bb|#|b|n|x)?-?\d)(w|h|q|e|m)(\.)?(~)?(\*)?(?:\/([0-9,]+))?(?:@(pp|p|mp|mf|f|ff))?(\))?$/;

  /* Parse one staff's voice string.
     Tokens: C4q  D4h.  rq  rm (whole-bar rest)  [C3,E3,G3]w  E4q/3 (finger)  E4q* (staccato)
     E4q~ (tie to next)  (E4q … G4q) (slur)  E4q@mf (dynamic)  < > (hairpin start) ! (hairpin end)
     |  |:  :|  (barlines and repeats) */
  T.parseVoice = function (str, bpm) {
    const errors = [];
    const measures = [];
    let cur = { events: [], startRepeat: false, endRepeat: false };
    let pendingHairpin = null;
    let lastEvent = null;
    const close = () => {
      if (cur.events.length) measures.push(cur);
      cur = { events: [], startRepeat: false, endRepeat: false };
    };
    for (const tok of str.trim().split(/\s+/)) {
      if (!tok) continue;
      if (tok === '|') { close(); continue; }
      if (tok === '|:') { if (cur.events.length) close(); cur.startRepeat = true; continue; }
      if (tok === ':|') { cur.endRepeat = true; close(); continue; }
      if (tok === '<' || tok === '>') { pendingHairpin = tok === '<' ? 'cresc' : 'dim'; continue; }
      if (tok === '!') { if (lastEvent) lastEvent.hairpinEnd = true; continue; }
      const m = TOKEN.exec(tok);
      if (!m) { errors.push('Unreadable token: ' + tok); continue; }
      const [, slurStart, body, base, dot, tie, stacc, fingers, dyn, slurEnd] = m;
      const ev = { kind: 'note', notes: [], base: base === 'm' ? 'w' : base, dots: dot ? 1 : 0 };
      if (base === 'm') { ev.measureRest = true; ev.dur = bpm; }
      else ev.dur = T.DUR[base] * (dot ? 1.5 : 1);
      if (body === 'r') { ev.kind = 'rest'; if (base === 'w' && !dot && bpm !== 4) errors.push('Use rm for a whole-bar rest outside 4/4'); }
      else if (body[0] === '[') {
        ev.kind = 'chord';
        ev.notes = body.slice(1, -1).split(',').map((s) => T.parse(s));
        ev.notes.sort((a, b) => T.diatonic(a) - T.diatonic(b));
      } else ev.notes = [T.parse(body)];
      if (ev.kind === 'chord' && ev.notes.length === 1) ev.kind = 'note';
      if (tie) ev.tie = true;
      if (stacc) ev.stacc = true;
      if (fingers) ev.fingers = fingers.split(',').map(Number);
      if (dyn) ev.dyn = dyn;
      if (slurStart) ev.slurStart = true;
      if (slurEnd) ev.slurEnd = true;
      if (pendingHairpin && ev.kind !== 'rest') { ev.hairpinStart = pendingHairpin; pendingHairpin = null; }
      cur.events.push(ev);
      lastEvent = ev;
    }
    close();
    measures.forEach((ms, i) => {
      let t = 0;
      ms.events.forEach((ev) => { ev.start = t; t += ev.dur; });
      ms.total = t;
      if (ms.events.length === 1 && ms.events[0].kind === 'rest') { ms.events[0].measureRest = true; ms.events[0].base = 'w'; ms.events[0].dots = 0; }
      if (Math.abs(t - bpm) > 1e-6) errors.push(`Measure ${i + 1} has ${t} beats, expected ${bpm}`);
    });
    return { measures, errors };
  };

  /* Build a score from a piece definition. */
  T.buildScore = function (piece) {
    const time = piece.time || [4, 4];
    const bpm = T.beatsPerMeasure(time);
    const errors = [];
    const staves = piece.staves.map((s, si) => {
      const r = T.parseVoice(s.voice, bpm);
      r.errors.forEach((e) => errors.push(`Staff ${si + 1}: ${e}`));
      return { clef: s.clef, hand: s.hand || (s.clef === 'bass' ? 'lh' : 'rh'), measures: r.measures };
    });
    const count = Math.max(...staves.map((s) => s.measures.length));
    staves.forEach((s, si) => {
      if (s.measures.length !== count) errors.push(`Staff ${si + 1} has ${s.measures.length} measures, expected ${count}`);
      // copy repeat marks across staves from staff 0
      s.measures.forEach((m, mi) => {
        const ref = staves[0].measures[mi];
        if (ref) { m.startRepeat = ref.startRepeat; m.endRepeat = ref.endRepeat; }
      });
      // tie validation
      const flat = [];
      s.measures.forEach((m) => m.events.forEach((e) => flat.push(e)));
      flat.forEach((e, i) => {
        if (!e.tie) return;
        const nx = flat[i + 1];
        if (!nx || nx.kind === 'rest' || nx.notes.map((n) => n.midi).join() !== e.notes.map((n) => n.midi).join()) {
          errors.push(`Staff ${si + 1}: tie without a matching next note`);
        } else nx.tiedFrom = true;
      });
    });
    return { key: piece.key || 'C', time, bpm, staves, count, errors, tempo: piece.tempo || 80 };
  };

  /* Measure order after expanding simple repeats. */
  T.measureOrder = function (score) {
    const ms = score.staves[0].measures;
    const order = [];
    let start = 0;
    let i = 0;
    const done = new Set();
    let guard = 0;
    while (i < ms.length && guard++ < 500) {
      if (ms[i].startRepeat) start = i;
      order.push(i);
      if (ms[i].endRepeat && !done.has(i)) { done.add(i); i = start; continue; }
      i++;
    }
    return order;
  };

  /* Flatten a score to a playback timeline. Each item: onset t (beats), d, midis, per-staff refs. */
  T.timeline = function (score, opts) {
    opts = opts || {};
    const hands = opts.hands || null; // e.g. ['rh'] or ['lh'] or null for all
    const order = opts.noRepeats ? score.staves[0].measures.map((_, i) => i) : T.measureOrder(score);
    const items = [];
    score.staves.forEach((st, si) => {
      const active = !hands || hands.includes(st.hand);
      // dynamics state per staff over the linear (unexpanded) score
      let vel = T.VELOCITY.mf;
      const velAt = new Map();
      let hp = null;
      const flat = [];
      st.measures.forEach((m, mi) => m.events.forEach((e, ei) => flat.push({ e, mi, ei })));
      flat.forEach((f, idx) => {
        if (f.e.dyn) vel = T.VELOCITY[f.e.dyn];
        if (f.e.hairpinStart) {
          let endIdx = idx;
          for (let j = idx; j < flat.length; j++) { if (flat[j].e.hairpinEnd) { endIdx = j; break; } }
          const next = flat.slice(endIdx + 1).find((x) => x.e.dyn);
          const target = next ? T.VELOCITY[next.e.dyn] : Math.max(0.25, Math.min(0.95, vel + (f.e.hairpinStart === 'cresc' ? 0.22 : -0.22)));
          hp = { from: vel, to: target, start: idx, end: endIdx };
        }
        let v = vel;
        if (hp && idx >= hp.start && idx <= hp.end) {
          const k = hp.end === hp.start ? 1 : (idx - hp.start) / (hp.end - hp.start);
          v = hp.from + (hp.to - hp.from) * k;
          if (idx === hp.end) { vel = hp.to; hp = null; }
        }
        velAt.set(f.e, v);
      });
      let offset = 0;
      order.forEach((mi, pass) => {
        const m = st.measures[mi];
        if (!m) return;
        m.events.forEach((e, ei) => {
          if (e.kind !== 'rest' && active) {
            // sounding duration: extend through ties
            let d = e.dur;
            if (e.tie) {
              let k = ei, mm = mi, cur = e;
              while (cur && cur.tie) {
                let nx = st.measures[mm].events[k + 1];
                if (!nx) { mm = mm + 1; k = -1; nx = st.measures[mm] && st.measures[mm].events[0]; }
                if (!nx) break;
                d += nx.dur; k += 1; cur = nx;
              }
            }
            items.push({
              t: offset + e.start,
              d,
              midis: e.tiedFrom ? [] : e.notes.map((n) => n.midi),
              tiedFrom: !!e.tiedFrom,
              stacc: !!e.stacc,
              vel: velAt.get(e) || T.VELOCITY.mf,
              staff: si,
              hand: st.hand,
              mi,
              ei,
              pass,
              ref: `${si}:${mi}:${ei}`,
              fingers: e.fingers || null,
              notes: e.notes,
            });
          }
        });
        offset += score.bpm;
      });
    });
    items.sort((a, b) => a.t - b.t || a.staff - b.staff);
    const total = order.length * score.bpm;
    return { items, total, order };
  };

  /* Group timeline items into onsets (same time) that require key presses. */
  T.onsets = function (timeline) {
    const out = [];
    for (const it of timeline.items) {
      if (it.tiedFrom || !it.midis.length) continue;
      const last = out[out.length - 1];
      if (last && Math.abs(last.t - it.t) < 1e-6) { last.items.push(it); last.midis.push(...it.midis); }
      else out.push({ t: it.t, items: [it], midis: [...it.midis] });
    }
    return out;
  };

  /* Beat-count label for an onset within a measure (quarter-beat units). */
  T.countLabel = (start) => {
    const whole = Math.floor(start + 1e-6);
    const frac = start - whole;
    if (frac < 1e-6) return String(whole + 1);
    if (Math.abs(frac - 0.5) < 1e-6) return '&';
    return '';
  };

  /* ---------- Random helpers ---------- */
  T.rand = (n) => Math.floor(Math.random() * n);
  T.pick = (arr) => arr[T.rand(arr.length)];
  T.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = T.rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  T.pickDifferent = (arr, avoid) => {
    const opts = arr.filter((x) => x !== avoid);
    return T.pick(opts.length ? opts : arr);
  };

  /* Rhythm patterns for one measure (quarter-beat units). */
  T.RHYTHMS = {
    4: {
      easy: [[1, 1, 1, 1], [1, 1, 2], [2, 1, 1], [2, 2], [1, 2, 1], [4]],
      eighths: [[0.5, 0.5, 1, 1, 1], [1, 0.5, 0.5, 1, 1], [1, 1, 0.5, 0.5, 1], [1, 1, 1, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5, 2], [2, 0.5, 0.5, 1]],
      end: [[4], [2, 2], [1, 1, 2]],
    },
    3: {
      easy: [[1, 1, 1], [2, 1], [1, 2], [3]],
      eighths: [[0.5, 0.5, 1, 1], [1, 0.5, 0.5, 1], [1, 1, 0.5, 0.5]],
      end: [[3], [1, 2]],
    },
  };
  const DUR_TOKEN = { 4: 'w', 3: 'h.', 2: 'h', 1: 'q', 0.5: 'e' };
  T.durToken = (d) => DUR_TOKEN[d];

  /* Generate a short, singable five-finger melody.
     position: lowest note of the five-finger position, e.g. 'C4', 'G4', 'C3'. */
  T.randomMelody = function (o) {
    const opts = Object.assign({ position: 'C4', key: 'C', measures: 4, beats: 4, eighths: false, hand: 'rh', leaps: true }, o || {});
    const root = T.parse(opts.position);
    const deg = (k) => T.stepFrom(root, k, opts.key);
    const R = T.RHYTHMS[opts.beats];
    const pool = opts.eighths ? R.easy.concat(R.eighths) : R.easy.filter((r) => r.length > 1 || opts.beats === 3);
    let d = T.pick([0, 2, 4, 0, 2]);
    const tokens = [];
    const tonicIsRoot = opts.tonicDegree === undefined ? 0 : opts.tonicDegree;
    for (let mi = 0; mi < opts.measures; mi++) {
      const last = mi === opts.measures - 1;
      const rh = last ? T.pick(R.end) : T.pick(pool);
      rh.forEach((dur, i) => {
        const isFinal = last && i === rh.length - 1;
        if (tokens.length) {
          if (isFinal) d = tonicIsRoot;
          else {
            const moves = opts.leaps ? [-1, 1, -1, 1, 2, -2, 0] : [-1, 1, -1, 1, 0];
            let nd;
            let guard = 0;
            do { nd = d + T.pick(moves); } while ((nd < 0 || nd > 4) && guard++ < 20);
            d = Math.max(0, Math.min(4, nd));
            if (last && i === rh.length - 2 && Math.abs(d - tonicIsRoot) > 2) d = tonicIsRoot + 1;
          }
        }
        const n = deg(d);
        const finger = opts.hand === 'lh' ? 5 - d : d + 1;
        tokens.push(`${T.id(n)}${DUR_TOKEN[dur]}/${finger}`);
      });
      if (!last) tokens.push('|');
    }
    return tokens.join(' ');
  };
})(window.MC = window.MC || {});
