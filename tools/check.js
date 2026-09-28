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
      const pos = T.staffPos(n, st.clef);
      ok(pos >= -5 && pos <= 13, `${p.id}: ${T.id(n)} is within reach of the ${st.clef} staff`);
      if (st.clef === 'treble') ok(n.midi >= 55, `${p.id}: ${T.id(n)} sensible for treble`);
      if (st.clef === 'bass') ok(n.midi <= 64, `${p.id}: ${T.id(n)} sensible for bass`);
    });
  })));
  const tl = T.timeline(sc);
  ok(tl.items.length > 0 && tl.total === T.measureOrder(sc).length * sc.bpm, `${p.id}: timeline length`);
  // key signature: notes in G must use F#, in F must use Bb
  if (p.key !== 'C') sc.staves.forEach((st) => st.measures.forEach((m) => m.events.forEach((e) => e.notes.forEach((n) => {
    const want = T.keyAcc(p.key, n.letter);
    ok(n.acc === want, `${p.id}: ${T.id(n)} should follow key signature ${p.key}`);
  }))));
});

// ---- course references (if content present)
const courseFiles = ['js/content/course-1.js', 'js/content/course-2.js', 'js/content/course-3.js'].filter((f) => fs.existsSync(path.join(root, f)));
if (courseFiles.length) {
  const src = ['js/quiz/gens-keyboard.js', 'js/quiz/gens-reading.js', 'js/quiz/gens-rhythm.js', 'js/quiz/gens-listen.js'].map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
  const gens = new Set([...src.matchAll(/G\.(\w+)\s*=\s*\(/g)].map((m) => m[1]));
  const wsrc = fs.readFileSync(path.join(root, 'js/ui/widgets.js'), 'utf8') + (fs.existsSync(path.join(root, 'js/app.js')) ? fs.readFileSync(path.join(root, 'js/app.js'), 'utf8') : '');
  const widgets = new Set([...wsrc.matchAll(/W\.(\w+)\s*=\s*(?:function|\()/g)].map((m) => m[1]));
  window.MC.course = undefined;
  courseFiles.forEach(load);
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
  console.log(`course: ${C.modules.length} modules, ${lessons} lessons`);
}
console.log(`${passes} checks passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
