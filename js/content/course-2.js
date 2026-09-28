/* Course content, modules 5–8: reading pitch, reading rhythm, first melodies, distances. */
(function (MC) {
  'use strict';

  MC.courseAdd({
    n: 5, title: 'Reading pitch', prereq: [2],
    summary: 'The staff, lines and spaces, treble and bass clefs, the grand staff, landmark notes, ledger lines, and reading by steps and skips.',
    lessons: [
      {
        id: 'm5-staff', title: 'The staff: lines, spaces, steps and skips', minutes: 12, skills: ['reading'],
        goal: 'See how five lines show high and low: higher on the staff means higher in pitch.',
        example: 'Think of floors in a building: every line and every space is a floor. Moving up one floor gives the next note up.',
        steps: [
          { kind: 'intro', body: '<p>Watch the notes climb the staff while you hear them rise. (Ignore the curly sign at the start for now — it is called a clef, and it is the next lesson.)</p>', w: { type: 'demo', staff: 'treble', labels: 'none', graph: false, bpm: 90, steps: ['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'].map((m, i) => ({ m, cap: i % 2 === 0 ? 'On a <strong>line</strong>' : 'In a <strong>space</strong>' })) } },
          { kind: 'see', body: '<p>Click any line or space. Lines and spaces are counted from the <strong>bottom</strong> up. Without a clef we cannot name the notes yet — but up is always higher.</p>', w: { type: 'staffExplore', clef: null } },
          { kind: 'explore', body: '<p>Reading music is mostly reading <em>movement</em>: does the next note step, skip, or stay the same?</p>', defs: [['Staff', 'Five lines and four spaces. Counted from the bottom.'], ['Line note', 'The line runs through the middle of the note.'], ['Space note', 'The note sits between two lines.'], ['Step', 'From a line to the next space, or a space to the next line: the next letter (C→D).'], ['Skip', 'From line to line, or space to space: skips one letter (C→E).']], w: { type: 'demo', staff: 'treble', labels: 'white', bpm: 70, steps: [{ m: 'E4', cap: 'Start: line 1' }, { m: 'F4', cap: '<strong>Step</strong> up: line → space' }, { m: 'G4', cap: '<strong>Step</strong> up: space → line' }, { m: 'B4', cap: '<strong>Skip</strong> up: line → line (jumps over A)' }, { m: 'D5', cap: '<strong>Skip</strong> up: line → line' }, { m: 'D5', cap: '<strong>Repeat</strong>: same line' }, { m: 'C5', cap: '<strong>Step</strong> down' }] } },
          { kind: 'guided', body: '<p>Lines, spaces, steps and skips.</p>', quiz: { gens: [{ type: 'lineOrSpace', params: { numbered: true }, n: 2 }, { type: 'stepSkip', n: 3 }], count: 5 } },
          { kind: 'check', body: '<p>No hints.</p>', quiz: { gens: [{ type: 'stepSkip', n: 4 }, { type: 'lineOrSpace', params: { numbered: true }, n: 2 }], count: 6 } },
          { kind: 'recap', recap: ['The <strong>staff</strong> has 5 lines and 4 spaces, counted from the bottom.', 'Higher on the staff = higher pitch.', '<strong>Step</strong> = line↔space (next letter). <strong>Skip</strong> = line→line or space→space.'], clue: { text: 'Line–space–line is a staircase (steps); line–line is taking the stairs two at a time (skips).', limits: 'Steps and skips tell you the distance, not the note name. You still need a starting point — that comes with clefs and landmarks.' }, review: 'Look at any printed music (even a hymn book): find three steps and three skips.', real: 'Play C D E (steps) then C E G (skips) on the piano and notice how skips on the staff become every-other white key.' },
        ],
      },
      {
        id: 'm5-treble', title: 'Treble clef and the G line', minutes: 14, skills: ['reading'],
        goal: 'Read notes in treble clef, starting from the landmark G.',
        example: 'The treble clef is a decorated letter G. Its curl wraps around <strong>line 2</strong> — so a note on line 2 is G (the G just above middle C).',
        steps: [
          { kind: 'intro', body: '<p>Hear G on line 2, then its neighbours by step.</p>', w: { type: 'demo', staff: 'treble', names: true, labels: 'c', bpm: 66, steps: [{ m: 'G4', cap: '<strong>G</strong>: line 2 — where the treble clef curls' }, { m: 'A4', cap: 'Step up: A (space 2)' }, { m: 'F4', cap: 'Step down from G: F (space 1)' }, { m: 'C5', cap: 'High C: space 3 — another landmark' }, { m: 'C4', cap: 'Middle C: on a short extra line below the staff' }] } },
          { kind: 'see', body: '<p>Click lines and spaces — or play keys — and watch the note, name and key stay in sync. The landmarks are marked.</p>', w: { type: 'staffExplore', clef: 'treble', landmarks: true } },
          { kind: 'explore', body: '<p>Read from landmarks: find the nearest one, then count steps. That is faster and more reliable than reciting a sentence.</p><div class="callout callout-plain"><p><strong>Memory aid (treble clef, bottom to top):</strong> lines <strong>E G B D F</strong> — “<em>Every Good Bird Does Fly</em>”; spaces <strong>F A C E</strong> — they spell “FACE”.</p><p class="small">Use it to check yourself, not to read every note. Always read bottom to top, and remember it only works for treble clef.</p></div>', defs: [['Clef', 'The sign at the start of the staff that tells you which notes the lines and spaces are.'], ['Treble clef (G clef)', 'Used for higher notes — usually the right hand. Line 2 = G above middle C.'], ['Landmarks', 'Middle C (below), Treble G (line 2), High C (space 3).']], w: { type: 'keyboardExplore', from: 57, to: 84, labels: 'c', mode: 'staff', clef: 'treble', labelToggle: true } },
          { kind: 'guided', body: '<p>Name notes and play them. The hint shows the nearest landmark.</p>', quiz: { gens: [{ type: 'readNote', params: { clef: 'treble' }, n: 3 }, { type: 'playStaffNote', params: { clef: 'treble' }, n: 2 }], count: 5 } },
          { kind: 'check', body: '<p>No hints. Octave counts when you play.</p>', quiz: { gens: [{ type: 'readNote', params: { clef: 'treble' }, n: 4 }, { type: 'playStaffNote', params: { clef: 'treble' }, n: 2 }], count: 6 } },
          { kind: 'recap', recap: ['The <strong>treble clef</strong> circles line 2: that line is <strong>G</strong> (G4).', 'Landmarks: Middle C (ledger line below), Treble G (line 2), High C (space 3).', 'Read other notes by counting steps and skips from a landmark.'], clue: { text: 'Treble lines, bottom to top: Every Good Bird Does Fly. Treble spaces, bottom to top: F-A-C-E.', limits: 'These work only in treble clef and only bottom-to-top. Reciting them for every note is slow — use them to check, and rely on landmarks for speed.' }, review: 'Name the treble landmarks aloud with your eyes closed: where is G? Where is high C?', real: 'Point to each treble line and space in any printed music and play that note, starting from G.' },
        ],
      },
      {
        id: 'm5-bass', title: 'Bass clef and the F line', minutes: 14, skills: ['reading'],
        goal: 'Read notes in bass clef, starting from the landmark F.',
        example: 'The bass clef is a decorated letter F. Its two dots sit either side of <strong>line 4</strong> — so a note on line 4 is F (the F below middle C).',
        steps: [
          { kind: 'intro', body: '<p>Hear F on line 4 and its neighbours.</p>', w: { type: 'demo', staff: 'bass', names: true, labels: 'c', bpm: 66, steps: [{ m: 'F3', cap: '<strong>F</strong>: line 4 — between the bass clef dots' }, { m: 'G3', cap: 'Step up: G (space 4)' }, { m: 'E3', cap: 'Step down from F: E (space 3)' }, { m: 'C3', cap: 'Low C: space 2 — another landmark' }, { m: 'C4', cap: 'Middle C: on a short extra line above the staff' }] } },
          { kind: 'see', body: '<p>Explore bass clef notes. Notice that the same line has a <em>different</em> name in bass clef than in treble clef.</p>', w: { type: 'staffExplore', clef: 'bass', landmarks: true } },
          { kind: 'explore', body: '<div class="callout callout-plain"><p><strong>Memory aid (bass clef, bottom to top):</strong> lines <strong>G B D F A</strong> — “<em>Good Birds Don’t Fly Away</em>”; spaces <strong>A C E G</strong> — “<em>All Cows Eat Grass</em>”.</p><p class="small">Different from treble! That is why landmarks matter: F sits between the dots, low C in space 2, middle C above.</p></div>', defs: [['Bass clef (F clef)', 'Used for lower notes — usually the left hand. Line 4 = F below middle C.'], ['Landmarks', 'Low C (space 2), Bass F (line 4), Middle C (ledger line above).']], w: { type: 'keyboardExplore', from: 36, to: 64, labels: 'c', mode: 'staff', clef: 'bass', labelToggle: true } },
          { kind: 'guided', body: '<p>Name and play bass clef notes.</p>', quiz: { gens: [{ type: 'readNote', params: { clef: 'bass' }, n: 3 }, { type: 'playStaffNote', params: { clef: 'bass' }, n: 2 }], count: 5 } },
          { kind: 'check', body: '<p>No hints.</p>', quiz: { gens: [{ type: 'readNote', params: { clef: 'bass' }, n: 4 }, { type: 'playStaffNote', params: { clef: 'bass' }, n: 2 }], count: 6 } },
          { kind: 'recap', recap: ['The <strong>bass clef</strong>’s dots surround line 4: that line is <strong>F</strong> (F3).', 'Landmarks: Low C (space 2), Bass F (line 4), Middle C (ledger line above).', 'Bass clef names are different from treble — never mix the memory aids.'], clue: { text: 'Bass lines, bottom to top: Good Birds Don’t Fly Away. Bass spaces, bottom to top: All Cows Eat Grass.', limits: 'Bass clef only, bottom to top. A common mistake is reading bass notes with the treble names — check the clef first, every time.' }, review: 'Say which note is on line 4 in bass clef — and which note is on line 4 in treble clef (D). Notice the difference.', real: 'With your left hand, play Low C, Bass F and Middle C from the staff, then step up and down from each.' },
        ],
      },
      {
        id: 'm5-grand', title: 'The grand staff, middle C and ledger lines', minutes: 15, skills: ['reading', 'keyboard'],
        goal: 'Read both staves together and use five landmark notes to find any nearby note.',
        example: 'Piano music uses two staves joined by a brace: treble on top (usually the right hand), bass below (usually the left hand). Middle C sits between them.',
        steps: [
          { kind: 'intro', body: '<p>Click each landmark to hear it and see its key. Notice middle C appears twice — once for each staff — but it is the <em>same key</em>.</p>', w: { type: 'landmarks' } },
          { kind: 'see', body: '<p>Explore the grand staff. Play keys below and above middle C and watch which staff they appear on.</p>', w: { type: 'staffExplore', clef: 'grand', landmarks: true } },
          { kind: 'explore', body: '<p>Reading by intervals: find the nearest landmark, then move by steps (next line/space) or skips (line to line). Short extra lines — <strong>ledger lines</strong> — extend the staff for notes like middle C.</p>', defs: [['Grand staff', 'Treble and bass staves joined by a brace — the standard for piano.'], ['Ledger line', 'A short line above or below the staff for notes outside the five lines.'], ['Five landmarks', 'Low C (bass space 2), Bass F (bass line 4), Middle C, Treble G (treble line 2), High C (treble space 3).'], ['Reading by intervals', 'Naming a note by its distance from one you already know.']], w: { type: 'demo', staff: 'grand', names: true, labels: 'c', bpm: 60, steps: [{ m: 'G4', cap: 'Landmark: Treble G' }, { m: 'B4', cap: 'Skip up from G → B' }, { m: 'F3', cap: 'Landmark: Bass F' }, { m: 'D3', cap: 'Skip down from F → D' }, { m: 'C4', cap: 'Middle C' }, { m: 'D4', cap: 'Step up from middle C → D' }, { m: 'B3', cap: 'Step down from middle C → B' }] } },
          { kind: 'guided', body: '<p>Mixed clefs, including ledger lines. Use landmarks.</p>', quiz: { gens: [{ type: 'readNote', params: { clef: 'grand', ledger: true }, n: 3 }, { type: 'keyToStaff', params: { clef: 'grand' }, n: 1 }, { type: 'playStaffNote', params: { clef: 'grand' }, n: 1 }], count: 5 } },
          { kind: 'check', body: '<p>Both directions: staff → key and key → staff.</p>', quiz: { gens: [{ type: 'readNote', params: { clef: 'grand', ledger: true }, n: 3 }, { type: 'keyToStaff', params: { clef: 'grand' }, n: 1 }, { type: 'playStaffNote', params: { clef: 'grand', ledger: true }, n: 2 }], count: 6 } },
          { kind: 'recap', recap: ['The <strong>grand staff</strong> = treble + bass, joined by a brace.', 'Middle C sits on a ledger line between them — one key, written in either staff.', 'Five landmarks + steps and skips let you read any nearby note.'], clue: { text: 'C–F–C–G–C: Low C, Bass F, Middle C, Treble G, High C — they sit almost symmetrically around middle C.', limits: 'Landmarks give you a starting point; the goal is to recognise common notes instantly with practice. Keep reviewing — reading speed comes from repetition, not from rules.' }, review: 'Do a short review session focused on reading (Practice → Pitch reading).', real: 'Put music with both staves on the stand. Find each landmark on the page, then on the keys, then play it.' },
        ],
      },
    ],
  });

  MC.courseAdd({
    n: 6, title: 'Reading rhythm', prereq: [4, 5],
    summary: 'Note and rest values, measures and barlines, 4/4 and 3/4 time signatures, dotted half notes, eighth notes.',
    lessons: [
      {
        id: 'm6-values', title: 'Note values and rests', minutes: 12, skills: ['rhythm'],
        goal: 'Read how long a note lasts from its shape — and read rests, which are measured silences.',
        example: 'The blocks you tapped in Module 4 become symbols: a 4-beat block is a <strong>whole note</strong>, 2 beats a <strong>half note</strong>, 1 beat a <strong>quarter note</strong>.',
        steps: [
          { kind: 'intro', body: '<p>Choose a note value, see it written, and hear it against the beat.</p>', w: { type: 'noteValues', values: ['w', 'h', 'q'] } },
          { kind: 'see', body: '<p>Now build a 4-beat measure from notes and rests. The notation updates as you add each one.</p>', w: { type: 'rhythmBuilder', beats: 4, notation: true, values: [4, 2, 1, -1, -2] } },
          { kind: 'explore', body: '<p>The shape tells the length: hollow or filled, with or without a stem, with or without a flag. Every note value has a matching rest.</p>', defs: [['Whole note', 'Hollow, no stem: 4 beats.'], ['Half note', 'Hollow with a stem: 2 beats.'], ['Quarter note', 'Filled with a stem: 1 beat.'], ['Eighth note', 'Filled, stem and flag: ½ beat.'], ['Rest', 'A symbol for silence of the same lengths: whole rest hangs below a line, half rest sits on a line.']], more: 'British names: whole = semibreve, half = minim, quarter = crotchet, eighth = quaver. Stems can point up or down — it does not change the length.', w: { type: 'noteValues', values: ['w', 'h', 'q', 'e'] } },
          { kind: 'guided', body: '<p>How long does each note or rest last?</p>', quiz: { gens: [{ type: 'noteValue', params: { values: ['w', 'h', 'q', 'rw', 'rh', 'rq'] }, n: 3 }, { type: 'valueMatch', n: 2 }], count: 5 } },
          { kind: 'check', body: '<p>Notes and rests, no hints.</p>', quiz: { gens: [{ type: 'noteValue', params: { values: ['w', 'h', 'q', 'e', 'rw', 'rh', 'rq'] }, n: 3 }, { type: 'valueMatch', params: { rests: true }, n: 3 }], count: 6 } },
          { kind: 'recap', recap: ['Whole = 4, half = 2, quarter = 1, eighth = ½ beat (when a quarter note gets the beat).', 'Rests are silences with the same values.'], clue: { text: 'Each step down the family halves the length: whole → half → quarter → eighth.', limits: 'The beat values above assume the quarter note gets one beat, as in 4/4 and 3/4 — true for nearly all beginner music, but not every time signature.' }, review: 'Clap a whole note (clap and count 4), a half (clap and count 2), and four quarters.', real: 'Play middle C as a whole, a half and a quarter note against the metronome at 72.' },
        ],
      },
      {
        id: 'm6-measures', title: 'Measures, barlines and time signatures', minutes: 14, skills: ['rhythm', 'reading'],
        goal: 'See how barlines group beats into measures and how 4/4 and 3/4 time signatures work.',
        example: 'Barlines are like the spaces between words: they group the beats so you can count “1 2 3 4 | 1 2 3 4”.',
        steps: [
          { kind: 'intro', body: '<p>The same kind of melody in 4/4 and in 3/4. Watch the counts and the barlines; turn on the metronome to hear the strong first beat of each measure.</p>', w: { type: 'timeSignatures' } },
          { kind: 'see', body: '<p>Build a 3/4 measure. A <strong>dotted half note</strong> fills the whole measure: 2 + 1 = 3 beats.</p>', w: { type: 'rhythmBuilder', beats: 3, notation: true, values: [1, 2, 3, -1] } },
          { kind: 'explore', body: '<p>The time signature is written once, at the start. Every measure must add up exactly to the top number (counting quarter-note beats).</p>', defs: [['Measure (bar)', 'One group of beats between two barlines.'], ['Barline', 'The vertical line that ends a measure. A thin + thick double line marks the end of the piece.'], ['Time signature', 'Two numbers at the start. Top: beats per measure. Bottom 4: a quarter note gets one beat.'], ['4/4', 'Four quarter-note beats per measure.'], ['3/4', 'Three quarter-note beats per measure.'], ['Dot', 'Adds half the note’s value: dotted half = 2 + 1 = 3 beats.']], w: { type: 'noteValues', values: ['h', 'q'], dotted: true } },
          { kind: 'guided', body: '<p>Count measures, complete them, and tap from notation.</p>', quiz: { gens: [{ type: 'countMeasure', n: 2 }, { type: 'measureComplete', n: 2 }, { type: 'tapRhythm', params: { display: 'notation', level: 'long' }, n: 1 }], count: 5 } },
          { kind: 'check', body: '<p>No hints; counts are hidden when completing measures.</p>', quiz: { gens: [{ type: 'measureComplete', n: 3 }, { type: 'countMeasure', n: 2 }, { type: 'tapRhythm', params: { display: 'notation', level: 'rests' }, n: 1 }], count: 6 } },
          { kind: 'recap', recap: ['<strong>Barlines</strong> divide music into <strong>measures</strong>.', 'The <strong>time signature</strong> top number = beats per measure; bottom 4 = quarter-note beat.', 'Every measure adds up exactly. A dotted half note = 3 beats.'], clue: { text: 'Top number: how many beats. Bottom number: what kind of note is one beat.', limits: 'This app uses only “4” on the bottom (quarter-note beat). Other bottom numbers exist (like 6/8) — they are optional later topics.' }, review: 'Write (or build) one 4/4 measure and one 3/4 measure, then clap them while counting.', real: 'Play the Little Waltz’s left-hand notes (one dotted half per measure) while counting 1-2-3 aloud.' },
        ],
      },
      {
        id: 'm6-eighths', title: 'Eighth notes and counting “&”', minutes: 14, skills: ['rhythm'],
        goal: 'Read and tap eighth notes, which split a beat in half.',
        example: 'Say “1 & 2 & 3 & 4 &” evenly: the numbers are the beats; each “&” is exactly halfway between.',
        steps: [
          { kind: 'intro', body: '<p>Build measures with pairs of eighth notes. Two eighths joined by a thick <strong>beam</strong> fill one beat.</p>', w: { type: 'rhythmBuilder', beats: 4, notation: true, values: [1, 0.5, 2, -1], start: [1, 0.5, 0.5, 2] } },
          { kind: 'see', body: '<p>“Hot Cross Buns” has a measure of eighth notes. Watch and listen; the counts show where the “&”s go.</p>', w: { type: 'piece', id: 'hot-cross-buns', modes: ['watch'], mode: 'watch', names: true, counts: true } },
          { kind: 'explore', body: '<p>A single eighth note has a flag; two or more in a row are usually joined by a beam. Both mean the same length.</p>', defs: [['Eighth note', '½ beat. Two eighth notes = one quarter note.'], ['Beam', 'A thick line joining eighth notes, usually one beat at a time.'], ['Counting “&”', '1 & 2 & — eighth notes fall on the numbers and on the “&”s.'], ['Eighth rest', 'A silence of ½ beat.']], w: { type: 'noteValues', values: ['q', 'e'] } },
          { kind: 'guided', body: '<p>Tap eighth-note rhythms from notation (count aloud!) and complete measures.</p>', quiz: { gens: [{ type: 'tapRhythm', params: { display: 'notation', level: 'eighths' }, n: 2 }, { type: 'measureComplete', params: { eighths: true, beats: [4] }, n: 1 }, { type: 'rhythmListen', params: { level: 'eighths' }, n: 1 }], count: 4, shuffle: false } },
          { kind: 'check', body: '<p>No hints, no “hear it first”.</p>', quiz: { gens: [{ type: 'tapRhythm', params: { display: 'notation', level: 'eighths' }, n: 2 }, { type: 'measureComplete', params: { eighths: true, beats: [4] }, n: 2 }, { type: 'rhythmListen', params: { level: 'eighths' }, n: 2 }], count: 6, shuffle: false } },
          { kind: 'recap', recap: ['An <strong>eighth note</strong> = ½ beat; two of them fill one beat.', 'Count eighths as “1 & 2 &”.', 'Beams join eighth notes; a single eighth has a flag.'], clue: { text: 'Quarter = “walk”, two eighths = “run-ning”.', limits: 'Say the words only to learn the feel. When reading real music, count “1 & 2 &” — words stop working for longer patterns.' }, review: 'Tap four rhythms from the Practice page (Rhythm) at a slow tempo.', real: 'Play the eighth-note measure of Hot Cross Buns on C and D, counting “1 & 2 & 3 & 4 &” aloud.' },
        ],
      },
    ],
  });

  MC.courseAdd({
    n: 7, title: 'First melodies', prereq: [3, 5, 6],
    summary: 'Guided playing, right hand and left hand separately, simple two-hand coordination, and gradually removing hints.',
    lessons: [
      {
        id: 'm7-right-hand', title: 'Right-hand melodies with note names', minutes: 15, skills: ['reading', 'keyboard'],
        goal: 'Play short melodies with your right hand in C position, reading from the staff.',
        example: '“Hot Cross Buns” uses only three notes — E, D and C — and moves by steps.',
        steps: [
          { kind: 'intro', body: '<p>First just watch and listen. Follow the highlighted note on the staff and the key below it.</p>', w: { type: 'piece', id: 'hot-cross-buns', modes: ['watch'], mode: 'watch' } },
          { kind: 'see', body: '<p>Now <strong>Play with guidance</strong>: the next note is highlighted and the music waits for you. Finger numbers are above the notes; note names below.</p>', w: { type: 'piece', id: 'hot-cross-buns', modes: ['watch', 'guided'], mode: 'guided' } },
          { kind: 'explore', body: '<p>Read the <em>shape</em>, not only names: “E D C” is “step down, step down”. In Mary Had a Little Lamb, find the one skip (E → G).</p><p class="small">Tip: switch off “Light up the next key” once you know where the notes are. Then turn off note names.</p>', defs: [['Melody', 'A tune: a sequence of single notes.'], ['Wait mode', 'The music waits until you play the right key — for learning notes, not timing.'], ['Independent playing', 'No hints: you read and play on your own.']], w: { type: 'piece', id: 'mary', modes: ['watch', 'guided'], mode: 'guided' } },
          { kind: 'guided', body: '<p>Play through at least one piece with guidance. Completing it marks this lesson as practised.</p>', practice: { ids: ['mary', 'hot-cross-buns', 'au-clair'], mode: 'guided' } },
          { kind: 'check', body: '<p>Play <strong>Au clair de la lune</strong> independently: no highlighted keys, no note names, no timing pressure. 80% of notes right on the first try demonstrates the skill. Afterwards, try “Notes + rhythm” for a timing score.</p>', pieceCheck: { id: 'au-clair' } },
          { kind: 'recap', recap: ['In C position the right hand reads C D E F G on the staff (middle C to G on line 2).', 'Watch → guided → independent: remove one hint at a time.', 'Read direction and distance: steps and skips.'], clue: { text: 'Look ahead, not at your hands: your fingers already know their keys in C position.', limits: 'Glancing down is fine at first. The goal is fewer glances over time — not zero from day one.' }, review: 'Play Mary Had a Little Lamb in guided mode with no key lights.', real: 'Play Hot Cross Buns and Mary on a real piano from the screen or a printout, slowly, saying the note names.' },
        ],
      },
      {
        id: 'm7-left-hand', title: 'Left hand in bass clef — fewer hints', minutes: 15, skills: ['reading', 'keyboard'],
        goal: 'Play simple melodies with the left hand in bass clef, then without note names.',
        example: 'Left-hand C position: little finger (5) on the C below middle C, thumb (1) on G.',
        steps: [
          { kind: 'intro', body: '<p>Watch and listen to “Low Bells” — a left-hand melody in bass clef.</p>', w: { type: 'piece', id: 'low-bells', modes: ['watch'], mode: 'watch' } },
          { kind: 'see', body: '<p>Left-hand finger numbers run the other way: 5 on C, 1 on G. Watch the patterns.</p>', w: { type: 'positionExplore', positions: [{ hand: 'lh', pos: 'C3', label: 'Left hand — C position' }, { hand: 'rh', pos: 'C4', label: 'Right hand — C position' }] } },
          { kind: 'explore', body: '<p>Try the familiar Hot Cross Buns with the left hand — same tune, bass clef, one octave lower.</p>', defs: [['LH C position', 'C3 (5) D3 (4) E3 (3) F3 (2) G3 (1).'], ['Bass clef reading', 'Low C is in space 2; G is on the top space (space 4).']], w: { type: 'piece', id: 'hot-cross-buns-lh', modes: ['watch', 'guided'], mode: 'guided' } },
          { kind: 'guided', body: '<p>Guided practice — try with note names <em>off</em>.</p>', practice: { ids: ['low-bells', 'hot-cross-buns-lh'], mode: 'guided', names: false } },
          { kind: 'check', body: '<p>Play <strong>Bass Walk</strong> independently, without names or hints.</p>', pieceCheck: { id: 'bass-walk' } },
          { kind: 'recap', recap: ['Left-hand C position: 5 on C3 … 1 on G3.', 'Bass clef landmarks (Low C, Bass F) help you find your place.', 'Removing hints one by one builds real reading.'], clue: { text: 'The left thumb always points toward middle C.', limits: 'True for the first positions. Later the left hand moves around the keyboard — then read from landmarks.' }, review: 'Play Low Bells without note names.', real: 'Play Low Bells and Bass Walk with the left hand on a real piano. Keep the right hand relaxed in your lap.' },
        ],
      },
      {
        id: 'm7-two-hands', title: 'Two hands: taking turns, then together', minutes: 15, skills: ['reading', 'keyboard'],
        goal: 'Coordinate both hands — first taking turns, then with the left hand holding notes under the melody.',
        example: 'In “Echo Hands” the right hand plays a phrase and the left hand answers, one octave lower.',
        steps: [
          { kind: 'intro', body: '<p>Watch the grand staff: right hand on top, left hand below. Here they take turns.</p>', w: { type: 'piece', id: 'echo-hands', modes: ['watch'], mode: 'watch' } },
          { kind: 'see', body: '<p>Now both hands at the same time. Notes lined up vertically are played <strong>together</strong>.</p>', w: { type: 'piece', id: 'ode-with-bass', modes: ['watch'], mode: 'watch' } },
          { kind: 'explore', body: '<p>The professional way: practise each hand alone first. Choose “Right hand” and tick “Hear the other hand” — the app plays the left hand for you. Then swap.</p><p class="small">Two-hand tip: the computer keyboard only covers 1½ octaves, so use mouse/touch for one hand, or connect a MIDI keyboard (Settings).</p>', defs: [['Hands together', 'Both hands playing in the same passage.'], ['Vertical alignment', 'Notes above each other on the grand staff sound at the same time.']], w: { type: 'piece', id: 'ode-with-bass', modes: ['guided', 'watch'], mode: 'guided', hands: 'rh' } },
          { kind: 'guided', body: '<p>Guided practice with both hands (or one hand plus the other played for you).</p>', practice: { ids: ['echo-hands', 'ode-with-bass'], mode: 'guided' } },
          { kind: 'check', body: '<p>Play <strong>Au clair de la lune with bass notes</strong>, both hands, independently. Take your time — untimed.</p>', pieceCheck: { id: 'au-clair-bass' } },
          { kind: 'recap', recap: ['Grand staff: top = right hand, bottom = left hand.', 'Vertically aligned notes are played together.', 'Always practise hands separately first; then combine slowly.'], clue: { text: 'Separate, then together — slowly.', limits: 'Speed comes last. If hands-together falls apart, it is not a failure: go back to one hand for a minute.' }, review: 'Play Echo Hands once a day this week.', real: 'Play Ode to Joy with the left-hand notes. Start with the left hand alone, then the right, then together at half speed.' },
        ],
      },
    ],
  });

  MC.courseAdd({
    n: 8, title: 'Distances between notes', prereq: [5],
    summary: 'Half steps and whole steps, sharps, flats and naturals, enharmonic names, and simple intervals.',
    lessons: [
      {
        id: 'm8-half-whole', title: 'Half steps and whole steps', minutes: 12, skills: ['keyboard'],
        goal: 'Measure the smallest distances on the piano: half steps and whole steps.',
        example: 'From any key to the very next key — black or white — is a <strong>half step</strong>. Two half steps make a <strong>whole step</strong>.',
        steps: [
          { kind: 'intro', body: '<p>Watch three distances: C to C♯ (next key), E to F (next key — no black key between!), C to D (skipping one key).</p>', w: { type: 'demo', labels: 'white', bpm: 60, keepMarks: false, steps: [{ m: ['C4', 'C#4'], tags: ['C', 'C♯'], cap: 'C → C♯: the very next key = <strong>half step</strong>' }, { m: ['E4', 'F4'], tags: ['E', 'F'], cap: 'E → F: also next-door keys = <strong>half step</strong>' }, { m: ['C4', 'D4'], tags: ['C', 'D'], cap: 'C → D: one key in between = <strong>whole step</strong>' }, { m: ['B4', 'C5'], tags: ['B', 'C'], cap: 'B → C: <strong>half step</strong> (no black key between)' }] } },
          { kind: 'see', body: '<p>Press two keys, one after the other. The app counts the half steps between them.</p>', w: { type: 'keyboardExplore', from: 55, to: 79, labels: 'white', mode: 'distance', labelToggle: false } },
          { kind: 'explore', body: '<p>Most neighbouring white keys have a black key between them — so they are a whole step apart. The two exceptions are <strong>E–F</strong> and <strong>B–C</strong>.</p>', defs: [['Half step (semitone)', 'From one key to the very next key, black or white.'], ['Whole step (tone)', 'Two half steps: skip exactly one key.'], ['Natural half steps', 'E–F and B–C: white keys with no black key between them.']], w: { type: 'keyboardExplore', from: 55, to: 79, labels: 'all', mode: 'distance', labelToggle: true } },
          { kind: 'guided', body: '<p>Identify and play half and whole steps.</p>', quiz: { gens: [{ type: 'halfWhole', n: 3 }, { type: 'playHalfWhole', n: 2 }], count: 5 } },
          { kind: 'check', body: '<p>No hints.</p>', quiz: { gens: [{ type: 'halfWhole', n: 3 }, { type: 'playHalfWhole', n: 3 }], count: 6 } },
          { kind: 'recap', recap: ['<strong>Half step</strong> = next key. <strong>Whole step</strong> = skip one key.', 'E–F and B–C are half steps between white keys.'], clue: { text: 'E–F and B–C are the two “no black key” gaps.', limits: 'Only true on the white keys. Between black and white keys, just count keys.' }, review: 'Starting on any key, play a half step up, then a whole step up, then check by counting.', real: 'Play C–C♯–D–D♯–E–F with one finger: every move is a half step. Then C–D–E: whole steps.' },
        ],
      },
      {
        id: 'm8-accidentals', title: 'Sharps, flats, naturals and enharmonics', minutes: 14, skills: ['reading', 'keyboard'],
        goal: 'Read ♯, ♭ and ♮ signs and find the keys they point to.',
        example: 'A <strong>sharp (♯)</strong> raises a note by a half step: F♯ is the black key just to the right of F.',
        steps: [
          { kind: 'intro', body: '<p>Choose a letter and a sign. The staff, the key and the sound change together.</p>', w: { type: 'accidentals' } },
          { kind: 'see', body: '<p>F, then F♯, then F again. The ♮ sign on the third note cancels the sharp — because it is in the same measure.</p>', w: { type: 'demo', staff: 'treble', names: true, labels: 'white', bpm: 60, steps: [{ m: 'F4', cap: 'F (white key)' }, { m: 'F#4', cap: 'F♯: one half step higher (black key)' }, { m: 'F4', cap: 'F♮: the natural sign cancels the sharp' }, { m: 'Bb4', cap: 'B♭: one half step lower than B' }, { m: 'B4', cap: 'B♮: back to the white key' }] } },
          { kind: 'explore', body: '<p>Every black key has two names. Press a black key to see both.</p>', defs: [['Sharp ♯', 'Raise by a half step (one key to the right).'], ['Flat ♭', 'Lower by a half step (one key to the left).'], ['Natural ♮', 'Cancel a sharp or flat: play the plain white key.'], ['Accidental', 'A ♯, ♭ or ♮ written before a note. It lasts until the end of the measure.'], ['Enharmonic', 'Two names for the same key, like C♯ and D♭.']], more: 'Sharps and flats do not always land on black keys: E♯ is the same key as F, and C♭ is the same key as B. These spellings appear in more advanced music.', w: { type: 'keyboardExplore', from: 55, to: 79, labels: 'all', mode: 'name', labelToggle: true } },
          { kind: 'guided', body: '<p>Names, keys, and the barline rule.</p>', quiz: { gens: [{ type: 'accidentalName', n: 2 }, { type: 'playAccidental', n: 2 }, { type: 'enharmonic', n: 1 }, { type: 'barlineRule', n: 1 }], count: 6 } },
          { kind: 'check', body: '<p>No hints.</p>', quiz: { gens: [{ type: 'playAccidental', n: 2 }, { type: 'accidentalName', n: 1 }, { type: 'enharmonic', n: 1 }, { type: 'barlineRule', n: 2 }], count: 6 } },
          { kind: 'recap', recap: ['♯ = up a half step, ♭ = down a half step, ♮ = cancel.', 'An accidental lasts until the next barline.', 'Each black key has two (enharmonic) names.'], clue: { text: 'Sharp = step up (the sign looks like a little ladder); flat = step down (like a deflated “b”).', limits: 'The pictures are only reminders. In some music a sharp or flat lands on a white key (E♯ = F).' }, review: 'Name every black key both ways, from C♯/D♭ to A♯/B♭.', real: 'Play F, F♯, G, G♯, A, A♯/B♭, B with one finger, saying each name.' },
        ],
      },
      {
        id: 'm8-intervals', title: 'Intervals: seconds to octaves', minutes: 14, skills: ['reading', 'listening'],
        goal: 'Name the distance between two notes — 2nd, 3rd, 4th, 5th, octave — on the staff and keyboard, and hear bigger and smaller jumps.',
        example: 'C up to E is a <strong>3rd</strong>: count the letters C (1), D (2), E (3).',
        steps: [
          { kind: 'intro', body: '<p>Five intervals from C. Listen to how the jumps grow.</p>', w: { type: 'demo', staff: 'treble', names: true, labels: 'white', bpm: 50, steps: [{ m: ['C4', 'D4'], cap: 'C–D: a <strong>2nd</strong> (step)' }, { m: ['C4', 'E4'], cap: 'C–E: a <strong>3rd</strong> (skip)' }, { m: ['C4', 'F4'], cap: 'C–F: a <strong>4th</strong>' }, { m: ['C4', 'G4'], cap: 'C–G: a <strong>5th</strong>' }, { m: ['C4', 'C5'], cap: 'C–C: an <strong>octave</strong> (8th)' }] } },
          { kind: 'see', body: '<p>Press two white keys to name the interval — count the letters, including both ends. The staff shows the pair.</p>', w: { type: 'keyboardExplore', from: 60, to: 84, labels: 'white', mode: 'interval', clef: 'treble', labelToggle: true } },
          { kind: 'explore', body: '<p>On the staff you can see intervals without naming notes: 3rds and 5ths are line→line or space→space; 2nds and 4ths go line→space.</p>', defs: [['Interval', 'The distance between two notes.'], ['Counting rule', 'Count letter names from the lower note to the higher, counting both.'], ['2nd = step, 3rd = skip', 'The steps and skips you already know.'], ['Harmonic / melodic', 'Played together / one after the other.']], more: 'Intervals also have a quality: C–E (4 half steps) is a <em>major</em> 3rd; A–C (3 half steps) is a <em>minor</em> 3rd; C–G (7 half steps) is a <em>perfect</em> 5th. You will meet major and minor 3rds again in chords.', w: { type: 'demo', staff: 'treble', names: true, labels: 'white', bpm: 70, steps: [{ m: 'E4', cap: 'E (line 1)' }, { m: 'G4', cap: '3rd up: line → line (E F G)' }, { m: 'B4', cap: '3rd up: line → line (G A B)' }, { m: 'C5', cap: '2nd up: line → space (B C)' }, { m: 'A4', cap: '3rd down: space → space (C B A)' }, { m: 'D5', cap: '4th up: space → line (A B C D)' }] } },
          { kind: 'guided', body: '<p>Name, play and hear intervals.</p>', quiz: { gens: [{ type: 'intervalName', n: 3 }, { type: 'intervalPlay', n: 2 }, { type: 'intervalCompare', n: 1 }], count: 6 } },
          { kind: 'check', body: '<p>No hints.</p>', quiz: { gens: [{ type: 'intervalName', n: 3 }, { type: 'intervalPlay', n: 1 }, { type: 'intervalCompare', n: 2 }], count: 6 } },
          { kind: 'recap', recap: ['An <strong>interval</strong> is the distance between two notes.', 'Count letter names including both ends: C–G = 5th.', 'On the staff: odd intervals (3rd, 5th) are line–line or space–space.'], clue: { text: 'Count the starting note as 1.', limits: 'Letter-counting gives the interval number only. Two 3rds can sound different (major vs minor) — that is the next level of detail.' }, review: 'Play every 3rd from C: C–E, D–F, E–G… then every 5th.', real: 'Play C–G together with the right hand (fingers 1 and 5). Move the same shape up to D–A, E–B.' },
        ],
      },
    ],
  });
})(window.MC = window.MC || {});
