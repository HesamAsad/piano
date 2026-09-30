/* Automated content & theory checks: node tools/check.js
   - staff positions, landmarks, key signatures, scales, triads, intervals
   - every piece: bar totals, measure counts across staves, ties, finger numbers 1–5, range
   - course: every lesson step references an existing widget / generator / piece
   - generators: create many questions per generator (no DOM) to catch crashes in setup code */
const fs = require('fs');
const path = require('path');
global.window = global;
const root = path.join(__dirname, '..');
const load = (f) => { eval(fs.readFileSync(path.join(root, f), 'utf8')); }; // eslint-disable-line no-eval
load('js/core/theory.js');
load('js/content/pieces.js');
const T = MC.theory;
let fails = 0, passes = 0;
const ok = (cond, msg) => { if (cond) passes++; else { fails++; console.log('FAIL', msg); } };

// ---- theory
ok(T.staffPos('E4', 'treble') === 0 && T.staffPos('F5', 'treble') === 8, 'treble lines E4..F5');
ok(T.staffPos('G2', 'bass') === 0 && T.staffPos('A3', 'bass') === 8, 'bass lines G2..A3');
ok(T.staffPos('C4', 'treble') === -2 && T.staffPos('C4', 'bass') === 10, 'middle C ledger positions');
ok(T.staffPos('G4', 'treble') === 2 && T.staffPos('F3', 'bass') === 6, 'G line / F line');
ok(T.staffPos('C5', 'treble') === 5 && T.staffPos('C3', 'bass') === 3, 'high C space 3 / low C space 2');
ok(T.midi('C4') === 60 && T.midi('A4') === 69 && T.midi('B#3') === 60 && T.midi('Cb4') === 59, 'midi numbers');
ok(T.majorScale('G4').map(T.id).join() === 'G4,A4,B4,C5,D5,E5,F#5,G5', 'G major scale');
ok(T.majorScale('F4').map(T.id).join() === 'F4,G4,A4,Bb4,C5,D5,E5,F5', 'F major scale');
ok(T.majorScale('D4').map(T.id).join() === 'D4,E4,F#4,G4,A4,B4,C#5,D5', 'D major scale');
ok(T.triad('A3', 'minor').map(T.id).join() === 'A3,C4,E4', 'A minor triad');
ok(T.triad('D4', 'major').map(T.id).join() === 'D4,F#4,A4', 'D major triad');
ok(T.intervalNumber('C4', 'G4') === 5 && T.intervalNumber('E4', 'E5') === 8, 'interval numbers');
ok(T.intervalQuality('C4', 'E4') === 'major' && T.intervalQuality('A4', 'C5') === 'minor' && T.intervalQuality('C4', 'G4') === 'perfect', 'interval qualities');
['treble', 'bass'].forEach((c) => T.SIG_POS.sharp[c].forEach((p, i) => ok(T.fromPos(p, c).letter === 'FCGDAEB'[i], `sharp ${i} position in ${c}`)));
['treble', 'bass'].forEach((c) => T.SIG_POS.flat[c].forEach((p, i) => ok(T.fromPos(p, c).letter === 'BEADGCF'[i], `flat ${i} position in ${c}`)));
ok(T.identifyTriad([60, 64, 67]).quality === 'major' && T.identifyTriad([57, 60, 64]).quality === 'minor', 'identify triads');
for (let i = 0; i < 200; i++) {
  const beats = T.pick([3, 4]);
  const v = T.randomMelody({ position: T.pick(['C4', 'G4', 'C3']), key: 'C', beats, measures: 4, eighths: Math.random() < 0.5 });
  const r = T.parseVoice(v, beats);
  if (r.errors.length) { ok(false, 'random melody: ' + r.errors.join(';') + ' :: ' + v); break; }
}
passes++;

// ---- pieces
Object.values(MC.pieces).forEach((p) => {
  const sc = T.buildScore(p);
  ok(sc.errors.length === 0, `${p.id}: ${sc.errors.join('; ')}`);
  sc.staves.forEach((st) => st.measures.forEach((m) => m.events.forEach((e) => {
    (e.fingers || []).forEach((f) => ok(f >= 1 && f <= 5, `${p.id} finger ${f}`));
    if (e.fingers) ok(e.fingers.length === e.notes.length, `${p.id}: finger count matches notes`);
    e.notes.forEach((n) => {
      const clef = m.clef || st.clef;
      const pos = T.staffPos(n, clef);
      if (p.extendedRange) ok(n.midi >= 21 && n.midi <= 108, `${p.id}: ${T.id(n)} within piano range`);
      else {
        ok(pos >= -5 && pos <= 13, `${p.id}: ${T.id(n)} is within reach of the ${clef} staff`);
        if (clef === 'treble') ok(n.midi >= 55, `${p.id}: ${T.id(n)} sensible for treble`);
        if (clef === 'bass') ok(n.midi <= 64, `${p.id}: ${T.id(n)} sensible for bass`);
      }
    });
  })));
  const tl = T.timeline(sc);
  ok(tl.items.length > 0 && tl.total === T.measureOrder(sc).length * sc.bpm, `${p.id}: timeline length`);
  // key signature: notes in G must use F#, in F must use Bb
  if (p.key !== 'C' && !p.chromatic) sc.staves.forEach((st) => st.measures.forEach((m) => m.events.forEach((e) => e.notes.forEach((n) => {
    const want = T.keyAcc(p.key, n.letter);
    ok(n.acc === want, `${p.id}: ${T.id(n)} should follow key signature ${p.key}`);
  }))));
});

// ---- score excerpt, tuplets, tempo changes, and starting inside a tie
const night = T.buildScore(MC.pieces['the-night-king']);
const nt = T.timeline(night);
const near = (a, b) => Math.abs(a - b) < 1e-8;
ok(night.count === 58 && nt.total === 232, 'Night King: exactly the 58 supplied measures');
ok(night.staves[1].measures[11].clef === 'treble' && night.staves[1].measures[12].clef === 'bass', 'left-hand clef changes at measure 13');
const notesAt = (staff, measure, event = 0) => night.staves[staff].measures[measure - 1].events[event].notes.map(T.id).join();
ok(notesAt(0, 5) === 'E5,A5,E6' && notesAt(0, 12) === 'B4,E5', 'opening chords retain original voicing');
ok(notesAt(1, 12) === 'E4,G#4' && notesAt(1, 43) === 'G#1,G#2' && notesAt(1, 45) === 'F#1,F#2', 'chromatic bass pitches and octaves');
ok(notesAt(0, 52, 3) === 'B3' && notesAt(0, 57, 2) === 'A4', 'triplet phrase endings and final pickup');
ok(nt.items.filter((it) => it.spread).length === 4, 'four rolled opening chords');
ok(night.staves[0].measures.flatMap((m) => m.tuplets).length === 8, 'eight quarter-note triplet groups');
const triplet = night.staves[0].measures[41];
ok(triplet.events.map((e) => e.base).join() === 'q,q,q,h' && near(triplet.events[2].start, 4 / 3) && near(triplet.events[3].start, 2), 'triplets occupy two beats followed by a half note');
ok(T.parseVoice('C4qt D4qt E4q C4h', 4).errors.length > 0, 'reject incomplete triplet groups');
const clock = T.tempoClock(60, nt.tempoMap);
ok(near(clock.seconds(48), 48) && near(clock.between(48, 52), 240 / 115), 'written tempo changes from 60 to 115 at measure 13');
[-4, 0, 47.5, 48, 49, 164 + 2 / 3, 232].forEach((b) => ok(near(clock.beat(clock.seconds(b)), b), `tempo clock round trip at beat ${b}`));
ok(near(T.tempoClock(30, nt.tempoMap).seconds(232), clock.seconds(232) * 2), 'half speed scales both written tempos');
ok(near(clock.between(47, 49), 1 + 60 / 115), 'duration spanning a tempo boundary');
const later = T.sliceTimeline(nt, 160, 232);
ok(near(T.tempoClock(60, later.tempoMap).bpmAt(-4), 115), 'later section count-in uses active tempo');
const held = T.sliceTimeline(nt, 112, 116); // measure 29 begins on tied octave notes
const heldRH = held.items.find((it) => it.hand === 'rh');
ok(!heldRH.tiedFrom && heldRH.midis.join() === '71,83' && heldRH.d === 4, 'range beginning on a tie sounds the held notes');
ok(T.sliceTimeline(nt, 108, 112).items.every((it) => it.t + it.d <= 4), 'ties stop at selected range end');

// ---- Interstellar: sixteenths and a held melody above repeated chord tones
const interstellar = T.buildScore(MC.pieces.interstellar);
const itl = T.timeline(interstellar);
ok(interstellar.count === 51 && itl.total === 153 && interstellar.time.join('/') === '3/4', 'Interstellar: 51 complete measures in 3/4');
ok(near(T.tempoClock(90, itl.tempoMap).seconds(itl.total), 102), 'Interstellar: 102 seconds at the written 90 BPM');
const sixteenths = interstellar.staves[0].measures[37].events;
ok(sixteenths.length === 12 && sixteenths.every((e, i) => e.base === 's' && e.dur === 0.25 && e.start === i / 4), 'finale has twelve evenly spaced sixteenths per bar');
const bassChange = interstellar.staves[1].measures[38].events;
ok(bassChange[1].kind === 'rest' && bassChange[1].base === 's' && bassChange[2].start === 2.25 && bassChange[2].dur === 0.75, 'sixteenth rest before dotted-eighth bass pickup');
const heldE = itl.items.filter((it) => it.staff === 0 && it.mi >= 34 && it.mi <= 36);
ok(heldE.length === 8 && heldE[0].midis.join() === '64,76' && heldE.slice(1).every((it) => it.midis.join() === '64'), 'upper E attacks once while lower E attacks eight times');
ok(heldE[0].noteDurations[76] === 8 && heldE.every((it) => it.noteDurations[64] === 1), 'upper E sustains eight beats; each lower E lasts one beat');
const midPhrase = T.sliceTimeline(itl, 105, 108).items.find((it) => it.staff === 0);
ok(midPhrase.midis.join() === '64,76' && midPhrase.noteDurations[64] === 1 && midPhrase.noteDurations[76] === 3, 'range starting inside partial tie resumes and clips each pitch independently');
const ending = itl.items.find((it) => it.staff === 0 && it.mi === 48 && it.ei === 6);
ok(ending.midis.join() === '76,88' && ending.d === 7.5, 'ending E octaves sustain through the final two bars');
const invalidPartialTie = T.buildScore({ time: [3, 4], staves: [{ clef: 'treble', voice: '[E4,E5]q~[G5] [E4,E5]h' }] });
ok(invalidPartialTie.errors.some((e) => e.includes('tie without')), 'reject a partial tie to a pitch absent from the chord');
ok(T.parseVoice('C4s D4s E4s F4s G4h', 3).errors.length === 0 && T.parseVoice('rs C4e. D4h', 3).errors.length === 0, 'sixteenth notes and rests fill a 3/4 bar correctly');

// ---- Begonvil: separate vocal part, chromatic spelling, pedal, and directed rolls.
const begonvil = T.buildScore(MC.pieces.begonvil);
const btl = T.timeline(begonvil);
const bp = T.timeline(begonvil, { hands: ['rh', 'lh'], noRepeats: true });
const bv = T.timeline(begonvil, { hands: ['vocal'], noRepeats: true });
ok(begonvil.count === 46 && btl.total === 368 && near(T.tempoClock(90).seconds(btl.total), 736 / 3), 'Begonvil: 46 written bars, then one D.C. return, in 4/4 at 90 BPM');
ok(btl.order.length === 92 && btl.order.slice(0, 46).every((mi, i) => mi === i) && btl.order.slice(46).every((mi, i) => mi === i), 'D.C. visits every measure twice and terminates');
ok(bp.total === 184 && bv.total === 184, 'selected sections can play without the D.C. return');
ok(begonvil.staves.map((s) => s.group).join() === 'vocal,piano,piano', 'vocal staff is separate from the piano grand staff');
ok(T.KEYS['G#m'].sig.join() === 'F,C,G,D,A' && T.keyAcc('G#m', 'B') === 0, 'G-sharp minor has five sharps in the correct order');
ok(bp.items.every((it) => ['rh', 'lh'].includes(it.hand)) && bv.items.every((it) => it.hand === 'vocal') && 2 * (bp.items.length + bv.items.length) === btl.items.length, 'piano practice excludes the optional vocal melody');
ok(near(bv.items[0].t, 39.25) && bv.items[0].notes.map(T.id).join() === 'B4', 'vocal enters on the late pickup in bar 10');
const bNotes = (si, mi, ei = 0) => begonvil.staves[si].measures[mi - 1].events[ei].notes.map(T.id).join();
ok(bNotes(1, 1, 1) === 'B4,G#5' && bNotes(2, 1) === 'G#2', 'Begonvil opens with the supplied right-hand sixth and low G-sharp');
ok(bNotes(1, 7, 4) === 'A#4,Fx5' && bNotes(2, 7, 4) === 'Fx4', 'double-sharp leading tone keeps the F spelling in both hands');
ok(bNotes(1, 12, 2) === 'G3,B3,C#4,E4' && bNotes(1, 17, 2) === 'A#3,D4,F#4,A#4', 'written natural signs change the accompaniment harmony');
ok(bNotes(0, 26, 2) === 'B#4' && T.midi('B#4') === T.midi('C5'), 'vocal B-sharp sounds C without losing its spelling');
ok(bNotes(1, 33, 1) === 'D4,F#4,A#4' && bNotes(1, 37) === 'A#3,C#4,D#4,G4', 'third-page natural signs retain their original chord tones');
ok(bNotes(1, 46) === 'D#5,E5,G#5,B5' && bNotes(1, 46, 1) === 'C#5,D#5,G5,A#5' && bNotes(1, 46, 2) === 'G#4,B4,D#5,G#5', 'all twelve written chord tones in the final piano bar');
ok(bNotes(2, 46, 2) === 'G#1,G#2' && bNotes(0, 45, 4) === 'Fx4', 'low final bass octave and the vocal double sharp');
ok(begonvil.staves[1].measures[40].events[4].dur === 1, 'bar 41 holds the piano sixth for a quarter, while the vocal continues in eighths');
// Count every printed notehead (including tied continuations) from all three source pages.
const referenceNoteheads = [
  [0,0,0,0,0,0,0,0,0,2,6,3,6,3,4,5,5,1,7,4,6,3,7,9,5,5,8,8,6,3,7,1,7,1,7,6,6,3,7,1,7,1,7,6,6,3],
  [14,2,14,4,14,12,12,4,12,12,12,14,12,12,12,12,14,14,3,11,3,5,4,4,9,8,5,8,8,0,3,4,6,3,2,4,4,11,14,2,12,4,14,12,12,12],
  [8,6,8,6,8,8,8,5,2,2,2,2,2,2,2,2,3,2,1,7,6,4,4,4,4,4,6,6,2,8,3,6,8,6,8,8,8,6,8,6,8,6,8,8,8,6],
];
begonvil.staves.forEach((st, si) => st.measures.forEach((m, mi) => ok(m.events.reduce((n, e) => n + e.notes.length, 0) === referenceNoteheads[si][mi], `Begonvil staff ${si + 1}, bar ${mi + 1}: all printed noteheads included`)));
const brokenOpening = bp.items.find((it) => it.hand === 'lh');
ok(brokenOpening.noteDurations[44] === 0.5 && brokenOpening.soundDurations[44] === 4, 'pedal sustains the bass while the key lasts only its written eighth');
ok(bv.items.every((it) => it.midis.every((m) => it.noteDurations[m] === it.soundDurations[m])), 'pedal does not affect the vocal melody');
const tiedBass = bp.items.find((it) => it.hand === 'lh' && it.mi === 1 && it.ei === 3);
ok(tiedBass.noteDurations[T.midi('G#3')] === 2.5, 'bass pitch ties into a later two-note chord');
const pedalAcrossTie = bp.items.find((it) => it.hand === 'lh' && it.mi === 7 && it.ei === 4);
ok(pedalAcrossTie.noteDurations[44] === 1.5 && pedalAcrossTie.soundDurations[44] === 4.5, 'pedal renewed under a held key sustains through the following bar');
const partialRoll = bp.items.find((it) => it.hand === 'rh' && it.mi === 17 && it.ei === 3);
ok(partialRoll.midis.join() === String(T.midi('E5')) && partialRoll.tiedMidis.length === 3, 'three rolled chord tones hold while the top voice changes');
ok(bp.items.filter((it) => it.spread).length === 6 && bp.items.filter((it) => it.rollDown).length === 4, 'six rolled chords, four directed downward');
const croppedPedal = T.sliceTimeline(bp, 4, 8);
ok(croppedPedal.items.every((it) => Object.values(it.soundDurations).every((d) => it.t + d <= 4)), 'pedal and ties stop at the end of the selected practice range');
const unison = T.buildScore({ staves: [{ clef: 'treble', hand: 'rh', voice: 'C4w' }, { clef: 'bass', hand: 'lh', voice: 'C4w' }] });
ok(T.onsets(T.timeline(unison))[0].midis.join() === '60', 'a shared pitch across staves needs just one key press');

// The real audio scheduler uses the same clock for notes, clicks and input scoring.
window.addEventListener = () => {};
load('js/core/audio.js');
const transport = new MC.audio.Transport({ bpm: 60, tempoMap: nt.tempoMap, events: [
  { t: 47, d: 2, midis: [69] },
  { t: 48, d: 2 / 3, midis: [57, 60, 64], spread: 0.055 },
] });
transport.anchor = { time: 100, beat: 0 };
ok(near(transport.beatToTime(52), 148 + 240 / 115), 'transport schedules using the written tempo');
ok(near(transport.timeToBeat(148 + 240 / 115), 52), 'input timestamp converts back to the correct beat');
const scheduled = [];
const play = MC.audio.play;
MC.audio.play = (...args) => { scheduled.push(args); return 0; };
transport.silent = false;
transport.clock = () => 150;
transport._resetSchedule(47);
transport._schedule();
MC.audio.play = play;
ok(scheduled.length === 4 && near(scheduled[0][1], (1 + 60 / 115) * 0.94), 'sounding note duration spans a tempo boundary');
ok(near(scheduled[1][1], (2 / 3) * 60 / 115 * 0.94) && near(scheduled[2][3] - scheduled[1][3], 0.055), 'scheduler preserves triplet length and arpeggio spread');
const position = transport.beatNow();
transport.playing = true;
transport.setBpm(30);
ok(near(transport.beatNow(), position), 'changing playback speed preserves the current beat');
const steady = new MC.audio.Transport({ bpm: 80 });
steady.anchor = { time: 100, beat: -4 };
ok(near(steady.beatToTime(0), 103) && near(steady.timeToBeat(106), 4), 'existing constant-tempo playback and count-in are unchanged');
const sustainedChord = new MC.audio.Transport({ bpm: 90, events: [{ t: 0, d: 8, midis: [64, 76], durations: [1, 8] }] });
sustainedChord.anchor = { time: 0, beat: 0 };
sustainedChord.silent = false;
sustainedChord.clock = () => 0;
const chordCalls = [];
MC.audio.play = (...args) => { chordCalls.push(args); return 0; };
sustainedChord._resetSchedule(0); sustainedChord._schedule(); MC.audio.play = play;
ok(chordCalls.length === 2 && near(chordCalls[0][1], 60 / 90 * 0.94) && near(chordCalls[1][1], 8 * 60 / 90 * 0.94), 'audio releases the lower E while sustaining the upper E');
const downward = new MC.audio.Transport({ bpm: 90, events: [{ t: 0, d: 1, midis: [60, 64, 67], spread: 0.055, rollDown: true }] });
downward.anchor = { time: 0, beat: 0 }; downward.silent = false; downward.clock = () => 0;
const rollCalls = [];
MC.audio.play = (...args) => { rollCalls.push(args); return 0; };
downward._resetSchedule(0); downward._schedule(); MC.audio.play = play;
ok(rollCalls.length === 3 && near(rollCalls[0][3], 0.11) && near(rollCalls[1][3], 0.055) && near(rollCalls[2][3], 0), 'downward arpeggio plays the highest chord tone first');
const pedaledRoll = new MC.audio.Transport({ bpm: 90, events: [{ t: 0, d: 1, midis: [60, 64, 67], durations: [4, 4, 4], spread: 0.055, rollDown: true, pedaled: true }] });
pedaledRoll.anchor = { time: 0, beat: 0 }; pedaledRoll.silent = false; pedaledRoll.clock = () => 0;
const pedalCalls = [];
MC.audio.play = (...args) => { pedalCalls.push(args); return 0; };
pedaledRoll._resetSchedule(0); pedaledRoll._schedule(); MC.audio.play = play;
ok(pedalCalls.length === 3 && pedalCalls.every((call) => near(call[1] + call[3], 4 * 60 / 90)), 'all rolled chord tones release together at the pedal barline');

// ---- course references (if content present)
const courseFiles = ['js/content/course-1.js', 'js/content/course-2.js', 'js/content/course-3.js'].filter((f) => fs.existsSync(path.join(root, f)));
if (courseFiles.length) {
  const src = ['js/quiz/gens-keyboard.js', 'js/quiz/gens-reading.js', 'js/quiz/gens-rhythm.js', 'js/quiz/gens-listen.js'].map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
  const gens = new Set([...src.matchAll(/G\.(\w+)\s*=\s*\(/g)].map((m) => m[1]));
  const wsrc = fs.readFileSync(path.join(root, 'js/ui/study-guide.js'), 'utf8') + fs.readFileSync(path.join(root, 'js/ui/widgets.js'), 'utf8') + (fs.existsSync(path.join(root, 'js/app.js')) ? fs.readFileSync(path.join(root, 'js/app.js'), 'utf8') : '');
  const widgets = new Set([...wsrc.matchAll(/W\.(\w+)\s*=\s*(?:function|\()/g)].map((m) => m[1]));
  window.MC.course = undefined;
  courseFiles.forEach(load);
  load('js/content/study-guide.js');
  const C = MC.course;
  ok(C && C.modules.length === 12, 'twelve modules');
  let lessons = 0;
  C.modules.forEach((mod) => {
    ok(mod.lessons.length >= 2, `module ${mod.n} has lessons`);
    mod.lessons.forEach((l) => {
      lessons++;
      ok(l.steps.length >= 3, `${l.id} has steps`);
      ok(l.steps[0].kind === 'intro' && l.steps[l.steps.length - 1].kind === 'recap', `${l.id} starts with a goal and ends with a recap`);
      ok(!!l.goal && !!l.example, `${l.id} goal/example`);
      l.steps.forEach((s, i) => {
        if (s.w) ok(widgets.has(s.w.type), `${l.id} step ${i}: widget ${s.w.type}`);
        if (s.w && s.w.id) ok(!!MC.pieces[s.w.id], `${l.id}: piece ${s.w.id}`);
        if (s.w && s.w.ids) s.w.ids.forEach((id) => ok(!!MC.pieces[id], `${l.id}: piece ${id}`));
        if (s.quiz) s.quiz.gens.forEach((g) => ok(gens.has(g.type), `${l.id} step ${i}: generator ${g.type}`));
        if (s.kind === 'check' && s.quiz) ok((s.quiz.count || s.quiz.gens.reduce((a, g) => a + (g.n || 1), 0)) >= 5, `${l.id}: check has ≥5 questions`);
        if (s.pieceCheck) ok(!!MC.pieces[s.pieceCheck.id], `${l.id}: check piece ${s.pieceCheck.id}`);
        if (s.kind === 'recap') ok(s.recap && s.recap.length && s.clue && s.clue.limits && s.review && s.real, `${l.id}: recap complete (recap, clue + limits, review, real piano)`);
      });
    });
  });
  // Guide links must resolve, and every progression must preserve the four-beat harmony.
  const guide = MC.study;
  guide.cards.forEach((card) => {
    ok(!!C.lessons[card.lesson], `guide: ${card.title} links to a lesson`);
    ok(guide.topics.some((t) => t.id === card.topic), `guide: ${card.title} belongs to a topic`);
  });
  guide.progressions.forEach((p) => [false, true].forEach((broken) => {
    const score = T.buildScore(guide.progressionPiece(p.id, broken));
    ok(!score.errors.length && score.count === 4, `${p.id}: four valid measures, broken=${broken}`);
    ok(T.timeline(score).total === 16, `${p.id}: progression lasts sixteen beats`);
    p.degrees.forEach((degree, i) => {
      const chord = guide.chords[degree];
      const notes = score.staves[0].measures[i].events.flatMap((e) => e.notes.map(T.id));
      ok([...new Set(notes)].join() === chord.notes.join(), `${p.id} bar ${i + 1}: complete chord tones`);
      ok(score.staves[1].measures[i].events[0].notes[0].midi === T.midi(chord.root), `${p.id} bar ${i + 1}: bass root`);
    });
  }));
  console.log(`course: ${C.modules.length} modules, ${lessons} lessons; ${guide.cards.length} study tips`);
}
console.log(`${passes} checks passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
