/* Course content, modules 9–12: scales & keys, chords, expression, putting it together. */
(function (MC) {
  'use strict';

  MC.courseAdd({
    n: 9, title: 'Scales and keys', prereq: [8],
    summary: 'The major-scale pattern, C major with thumb-under fingering, then G major, F major and their key signatures.',
    lessons: [
      {
        id: 'm9-major-scale', title: 'The major scale: C major', minutes: 14, skills: ['chords', 'keyboard'],
        goal: 'Build a major scale from its pattern of whole and half steps, starting with C major.',
        example: '“Do re mi fa sol la ti do” is a major scale. On the piano, C D E F G A B C — all white keys — is C major.',
        steps: [
          { kind: 'intro', body: '<p>Hear C major going up and down. The small letters show the step between each pair of notes: W = whole step, H = half step.</p>', w: { type: 'scaleBuilder', tonics: ['C4'] } },
          { kind: 'see', body: '<p>Watch the fingering. Going up, the thumb passes <strong>under</strong> the hand after finger 3, so the hand can keep going. Coming down, finger 3 crosses <strong>over</strong> the thumb.</p>', w: { type: 'piece', id: 'c-major-scale', modes: ['watch'], mode: 'watch' } },
          { kind: 'explore', body: '<p>The same pattern — <strong>W W H W W W H</strong> — makes a major scale from any starting note. C major happens to need no black keys because its half steps land on E–F and B–C.</p>', defs: [['Scale', 'Notes in order, step by step, from one note to the same note an octave higher.'], ['Major scale pattern', 'Whole, whole, half, whole, whole, whole, half.'], ['Scale degrees', 'The positions 1–8 in the scale; 1 and 8 are the same letter (the “home” note).'], ['Thumb under', 'Passing the thumb beneath the hand to continue a scale smoothly.']], w: { type: 'piece', id: 'c-major-scale', modes: ['guided', 'watch'], mode: 'guided' } },
          { kind: 'guided', body: '<p>Build C major with the fingering shown, then without, and find the half steps.</p>', quiz: { gens: [{ type: 'buildScale', params: { key: 'C', guide: true }, n: 1 }, { type: 'scaleHalfSteps', n: 1 }, { type: 'buildScale', params: { key: 'C' }, n: 1 }, { type: 'halfWhole', n: 1 }], count: 4, shuffle: false } },
          { kind: 'check', body: '<p>No hints.</p>', quiz: { gens: [{ type: 'buildScale', params: { key: 'C' }, n: 1 }, { type: 'scaleHalfSteps', n: 1 }, { type: 'halfWhole', n: 2 }, { type: 'playHalfWhole', n: 1 }], count: 5, shuffle: false } },
          { kind: 'recap', recap: ['Major scale = <strong>W W H W W W H</strong>.', 'In C major the half steps are E–F (3–4) and B–C (7–8).', 'RH fingering up: 1 2 3, thumb under, 1 2 3 4 5.'], clue: { text: 'Two wholes, a half; three wholes, a half.', limits: 'This pattern is for <em>major</em> scales only. Minor scales use a different pattern (an optional later topic).' }, review: 'Play C major up and down with the right hand, slowly, three times.', real: 'Practise the thumb-under motion slowly: play E with finger 3, then tuck the thumb under to F. Keep the wrist level.' },
        ],
      },
      {
        id: 'm9-keys', title: 'G major, F major and key signatures', minutes: 15, skills: ['chords', 'reading'],
        goal: 'Use the major-scale pattern starting on G and F, and read their key signatures.',
        example: 'Start the pattern on G and you reach F — but the pattern needs a half step before G, so F must become <strong>F♯</strong>.',
        steps: [
          { kind: 'intro', body: '<p>Compare C, G and F major. Tick “Use a key signature” to see the ♯ or ♭ written once at the start instead of on each note.</p>', w: { type: 'scaleBuilder', tonics: ['C4', 'G4', 'F4'] } },
          { kind: 'see', body: '<p>A melody in G major. The sharp on the top line (F) at the start means <strong>every F is F♯</strong> — look for it in the music.</p>', w: { type: 'piece', id: 'g-major-melody', modes: ['watch', 'guided'], mode: 'watch' } },
          { kind: 'explore', body: '<p>And a song in F major: every B is B♭.</p>', defs: [['Key', 'The scale a piece is built on — its “home” note (tonic) and its notes.'], ['Key signature', 'Sharps or flats right after the clef that apply to every octave, for the whole piece.'], ['G major', 'One sharp: F♯.'], ['F major', 'One flat: B♭.'], ['C major', 'No sharps or flats.']], w: { type: 'piece', id: 'f-major-song', modes: ['watch', 'guided'], mode: 'guided' } },
          { kind: 'guided', body: '<p>Build the scales and read key signatures.</p>', quiz: { gens: [{ type: 'buildScale', params: { key: 'G', guide: true }, n: 1 }, { type: 'buildScale', params: { key: 'F', guide: true }, n: 1 }, { type: 'keySig', n: 2 }, { type: 'keySigEffect', n: 1 }], count: 5, shuffle: false } },
          { kind: 'check', body: '<p>No hints.</p>', quiz: { gens: [{ type: 'buildScale', params: { keys: ['G', 'F'] }, n: 1 }, { type: 'keySig', n: 2 }, { type: 'keySigEffect', n: 2 }, { type: 'scaleHalfSteps', n: 1 }], count: 6, shuffle: false } },
          { kind: 'recap', recap: ['G major has one sharp (F♯); F major has one flat (B♭).', 'The key signature applies to every note with that letter, in every octave.', 'The pattern W W H W W W H explains why.'], clue: { text: 'Go Sharp: G has a sharp. Fine Flat: F has a flat.', limits: 'Only for these first keys. Other keys have more sharps or flats — read the signature itself, not a slogan.' }, review: 'Play G major (with F♯) and F major (with B♭) with the right hand.', real: 'Play the G major scale: RH 1 2 3, thumb under, 1 2 3 4 5 — the same fingering as C. F major: 1 2 3 4, thumb under, 1 2 3 4.' },
        ],
      },
    ],
  });

  MC.courseAdd({
    n: 10, title: 'Chords and accompaniment', prereq: [8, 9],
    summary: 'Major and minor triads, the chords C, F, G and Am, blocked versus broken chords, and melody with accompaniment.',
    lessons: [
      {
        id: 'm10-triads', title: 'Major and minor triads', minutes: 14, skills: ['chords', 'listening'],
        goal: 'Build three-note chords by stacking skips — and hear the difference between major and minor.',
        example: 'Play C, skip D, play E, skip F, play G: C–E–G is a <strong>C major chord</strong>.',
        steps: [
          { kind: 'intro', body: '<p>Pick a root note and a quality. Each chord is played together, then one note at a time.</p>', w: { type: 'chordBuilder', roots: ['C4', 'F4', 'G4', 'A4'] } },
          { kind: 'see', body: '<p>C major and A minor, blocked and broken. On the staff, a root-position triad looks like a snowman: line-line-line or space-space-space.</p>', w: { type: 'demo', staff: 'treble', names: true, labels: 'white', bpm: 60, steps: [{ m: ['C4', 'E4', 'G4'], d: 2, cap: 'C major (blocked)' }, { m: 'C4', d: 0.5, cap: 'broken: C' }, { m: 'E4', d: 0.5, cap: 'E' }, { m: 'G4', d: 1, cap: 'G' }, { m: ['A4', 'C5', 'E5'], d: 2, cap: 'A minor (blocked) — a darker colour' }, { m: 'A4', d: 0.5, cap: 'broken: A' }, { m: 'C5', d: 0.5, cap: 'C' }, { m: 'E5', d: 1, cap: 'E' }] } },
          { kind: 'explore', body: '<p>Change only the middle note of a major chord down by a half step, and it becomes minor.</p>', defs: [['Chord', 'Three or more notes sounding together.'], ['Triad', 'A three-note chord: root, 3rd, 5th (stacked skips).'], ['Major triad', '4 half steps, then 3 (e.g. C–E–G).'], ['Minor triad', '3 half steps, then 4 (e.g. A–C–E).'], ['Chord symbol', 'C = C major; Am = A minor; F, G = F and G major.']], more: 'Many listeners describe major as bright and minor as darker or sadder, but that is a cultural impression, not a rule — trust the half-step count.', w: { type: 'chordBuilder' } },
          { kind: 'guided', body: '<p>Build chords and listen for major or minor.</p>', quiz: { gens: [{ type: 'buildChord', params: { chords: ['C', 'F', 'G', 'Am'] }, n: 3 }, { type: 'chordQuality', n: 2 }], count: 5 } },
          { kind: 'check', body: '<p>Includes two new chords (Dm, Em) built the same way.</p>', quiz: { gens: [{ type: 'buildChord', params: { chords: ['C', 'F', 'G', 'Am', 'Dm', 'Em'] }, n: 3 }, { type: 'chordQuality', n: 3 }], count: 6 } },
          { kind: 'recap', recap: ['A <strong>triad</strong> = root + 3rd + 5th (skip, skip).', 'Major = 4 + 3 half steps; minor = 3 + 4.', 'C, F, G are major; Am, Dm, Em are minor — all white keys.'], clue: { text: 'Snowman chords: three notes all on lines or all in spaces.', limits: 'Only root-position triads look like snowmen. Rearranged (inverted) chords look different on the staff — they still have the same letters.' }, review: 'Play C, F, G and Am with the right hand, blocked then broken.', real: 'Right-hand fingers 1-3-5 for each chord. Listen: can you hear which ones are minor without looking?' },
        ],
      },
      {
        id: 'm10-accompany', title: 'Blocked and broken chords under a melody', minutes: 15, skills: ['chords', 'keyboard'],
        goal: 'Accompany a melody with left-hand chords — held together (blocked) or one note at a time (broken).',
        example: 'Many songs use just three chords: C, F and G. The melody sits on top; the chords support it underneath.',
        steps: [
          { kind: 'intro', body: '<p>Listen to “Chord Garden”: a right-hand melody over left-hand blocked chords.</p>', w: { type: 'piece', id: 'chord-garden', modes: ['watch'], mode: 'watch' } },
          { kind: 'see', body: '<p>Compare the same piece with broken chords.</p>', w: { type: 'pieceChooser', ids: ['chord-garden', 'chord-garden-broken'], player: { modes: ['watch'], mode: 'watch' } } },
          { kind: 'explore', body: '<p>The left-hand shapes are arranged so the hand hardly moves: C = C–E–G, F = C–F–A, G = B–D–G. Rearranging a chord’s notes like this is called an <strong>inversion</strong>. Practise the left hand alone with the melody played for you.</p>', defs: [['Blocked chord', 'All chord notes played together.'], ['Broken chord', 'Chord notes played one after another.'], ['Accompaniment', 'The supporting part under a melody.'], ['Inversion', 'The same chord letters in a different order (not starting on the root).']], w: { type: 'piece', id: 'chord-garden', modes: ['guided', 'watch'], mode: 'guided', hands: 'lh' } },
          { kind: 'guided', body: '<p>Build left-hand chords and choose chords for melodies.</p>', quiz: { gens: [{ type: 'buildChord', params: { chords: ['C', 'F', 'G'], hand: 'lh' }, n: 2 }, { type: 'chordForMelody', n: 2 }], count: 4 } },
          { kind: 'check', body: '<p>No hints.</p>', quiz: { gens: [{ type: 'chordForMelody', n: 3 }, { type: 'buildChord', params: { chords: ['C', 'F', 'G', 'Am'], hand: 'lh' }, n: 2 }], count: 5 } },
          { kind: 'recap', recap: ['Blocked = together; broken = one at a time.', 'A chord fits a melody when they share notes.', 'Inversions keep the left hand close: C–E–G, C–F–A, B–D–G.'], clue: { text: 'Find the chord that shares the most notes with the melody.', limits: 'A good first guess, not the whole story: composers also use chords that clash for colour. For beginner melodies it works very well.' }, review: 'Play the left hand of Chord Garden alone, blocked, then broken.', real: 'Play the three LH shapes (C, F, G) in a loop: C – F – G – C, blocked, then broken. Keep your hand relaxed as it moves.' },
        ],
      },
    ],
  });

  MC.courseAdd({
    n: 11, title: 'Making music expressive', prereq: [7],
    summary: 'Dynamics, legato and staccato, phrasing, ties versus slurs, repeat signs, and practising musically at a slow tempo.',
    lessons: [
      {
        id: 'm11-dynamics', title: 'Dynamics, legato and staccato', minutes: 13, skills: ['reading', 'listening'],
        goal: 'Read and hear dynamics (loud and soft) and articulation (smooth or short).',
        example: '<em>p</em> under a note means “play softly”; dots above or below notes mean “short and detached”.',
        steps: [
          { kind: 'intro', body: '<p>The same phrase, played four ways.</p>', w: { type: 'demo', labels: 'white', bpm: 96, steps: [['C4', 'soft (p)'], ['E4'], ['G4'], ['E4']].map(([m, c]) => ({ m, vel: 0.28, cap: '<em>p</em> — soft' })).concat(['C4', 'E4', 'G4', 'E4'].map((m) => ({ m, vel: 0.95, cap: '<em>f</em> — loud' }))).concat(['C4', 'E4', 'G4', 'E4'].map((m) => ({ m, vel: 0.6, cap: 'legato — smooth and connected' }))).concat(['C4', 'E4', 'G4', 'E4'].map((m) => ({ m, vel: 0.6, stacc: true, cap: 'staccato — short and detached' }))) } },
          { kind: 'see', body: '<p>Change the markings and hear the result. Watch how each marking is written.</p>', w: { type: 'expression' } },
          { kind: 'explore', body: '<p>Honest note: the on-screen and computer keys cannot sense how hard you press. Use the loudness slider in the first lessons’ explorer, or a MIDI keyboard (which sends real key speed), or a real piano to practise dynamics.</p>', defs: [['p / mp', 'piano (soft) / mezzo piano (moderately soft).'], ['mf / f', 'mezzo forte (moderately loud) / forte (loud).'], ['Crescendo (<)', 'Gradually louder.'], ['Diminuendo (>)', 'Gradually softer.'], ['Legato', 'Smooth and connected — shown by a curved line (slur).'], ['Staccato', 'Short and detached — shown by a dot.']], more: 'Extremes: <em>pp</em> (pianissimo, very soft) and <em>ff</em> (fortissimo, very loud). Dynamics are relative — <em>f</em> in a lullaby is gentler than <em>f</em> in a march.', w: { type: 'piece', id: 'evening-song', modes: ['watch'], mode: 'watch' } },
          { kind: 'guided', body: '<p>Read and hear the markings.</p>', quiz: { gens: [{ type: 'symbolMeaning', params: { symbols: ['p', 'mp', 'mf', 'f', 'cresc', 'dim', 'stacc', 'slur'] }, n: 3 }, { type: 'dynamicsOrder', n: 1 }, { type: 'hearArticulation', n: 1 }], count: 5 } },
          { kind: 'check', body: '<p>No hints.</p>', quiz: { gens: [{ type: 'symbolMeaning', params: { symbols: ['p', 'mp', 'mf', 'f', 'cresc', 'dim', 'stacc', 'slur'] }, n: 3 }, { type: 'dynamicsOrder', n: 1 }, { type: 'hearArticulation', n: 2 }], count: 6 } },
          { kind: 'recap', recap: ['Dynamics: <em>p</em>, <em>mp</em>, <em>mf</em>, <em>f</em>; hairpins for gradual changes.', 'Legato (slur) = smooth; staccato (dot) = short.', 'The app can show and play these, but judging your own dynamics needs touch-sensitive keys.'], clue: { text: 'p = piano = peaceful; f = forte = forceful. m softens either one.', limits: 'The words are Italian. “Piano” as a dynamic means soft — the instrument’s full name, pianoforte, means “soft-loud”.' }, review: 'Say the dynamics in order from softest to loudest: pp p mp mf f ff.', real: 'Play C D E F G five times: p, mf, f, then legato, then staccato. Listen to yourself — a phone recording helps.' },
        ],
      },
      {
        id: 'm11-phrasing', title: 'Phrases, ties, slurs and repeat signs', minutes: 14, skills: ['reading', 'rhythm'],
        goal: 'Shape phrases, tell ties from slurs, follow repeat signs — and practise musically at a slow tempo.',
        example: 'A <strong>phrase</strong> is a musical sentence. Like a spoken sentence, it has a shape and a small breath at the end.',
        steps: [
          { kind: 'intro', body: '<p>Two curved lines that look alike but mean different things.</p>', w: { type: 'tieSlur' } },
          { kind: 'see', body: '<p>Repeat signs send you back. Watch the highlight jump.</p>', w: { type: 'repeats' } },
          { kind: 'explore', body: '<p><strong>Practising musically, slowly:</strong> choose a tempo where you can play without mistakes (often 50–60%). Loop 2–4 measures (use the measure selector). Shape each phrase: a little louder toward its high point, softer at its end. Only then speed up.</p>', defs: [['Phrase', 'A musical sentence — often 2 or 4 measures.'], ['Tie', 'Joins two notes of the <em>same</em> pitch: play once, hold for both.'], ['Slur', 'Joins <em>different</em> pitches: play smoothly.'], ['Repeat signs', 'Thick and thin barlines with two dots facing the music. Play the section between them twice.']], w: { type: 'piece', id: 'evening-song', modes: ['guided', 'watch', 'independent'], mode: 'guided' } },
          { kind: 'guided', body: '<p>Ties, slurs and repeats.</p>', quiz: { gens: [{ type: 'tieOrSlur', n: 2 }, { type: 'tieBeats', n: 2 }, { type: 'repeatOrder', n: 1 }], count: 5 } },
          { kind: 'check', body: '<p>No hints.</p>', quiz: { gens: [{ type: 'tieOrSlur', n: 2 }, { type: 'tieBeats', n: 2 }, { type: 'repeatOrder', n: 2 }], count: 6 } },
          { kind: 'recap', recap: ['Tie = same pitch, one long sound. Slur = different pitches, smooth.', 'Repeat signs: go back to the start-repeat (or the beginning).', 'Practise slowly, in short loops, shaping each phrase.'], clue: { text: 'Tie = same note tied together; slur = slide between different notes.', limits: 'In advanced music, slurs can also show phrasing over many notes. The core rule — same pitch = tie — still holds.' }, review: 'Play Evening Song with its repeat, counting the measures as you go.', real: 'Record yourself playing Evening Song slowly. Listen back for: steady beat, smooth slurs, clear staccato, and soft ending.' },
        ],
      },
    ],
  });

  MC.courseAdd({
    n: 12, title: 'Putting everything together', prereq: [7, 9, 10, 11],
    summary: 'Short beginner pieces, a sight-reading challenge, a cumulative assessment and a practical plan for what comes next.',
    lessons: [
      {
        id: 'm12-pieces', title: 'Beginner pieces', minutes: 15, skills: ['reading', 'keyboard'],
        goal: 'Learn a short piece from start to finish using a reliable routine.',
        example: 'Professional pianists learn new music the same way you will here: listen, look, hands separately, slowly, then together.',
        steps: [
          { kind: 'intro', body: '<p><strong>A routine for any new piece:</strong></p><ol><li>Listen once (Watch & listen).</li><li>Look: clef, key signature, time signature, hand positions, repeated patterns.</li><li>Guided, hands separately, a few measures at a time.</li><li>Independent, untimed. Fix the red spots.</li><li>With the beat, slowly (60–70%), then gradually faster.</li></ol>', w: { type: 'pieceChooser', ids: ['lightly-row', 'ode-to-joy', 'waltz-in-c', 'au-clair-bass'], player: { modes: ['watch', 'guided', 'independent'], mode: 'watch' } } },
          { kind: 'see', body: '<p>A complete two-hand piece in 3/4: the Little Waltz.</p>', w: { type: 'piece', id: 'waltz-in-c', modes: ['watch', 'guided', 'independent'], mode: 'watch' } },
          { kind: 'explore', body: '<p>Use the measure selector to loop only the hard part. Short, focused loops are more effective than playing the whole piece again and again.</p>', defs: [['Practice loop', 'Repeating a short section (2–4 measures) until it is comfortable.'], ['Slow practice', 'Playing below full tempo so the notes stay correct.']], w: { type: 'piece', id: 'lightly-row', modes: ['guided', 'independent', 'watch'], mode: 'guided' } },
          { kind: 'guided', body: '<p>Play at least one piece through with guidance.</p>', practice: { ids: ['lightly-row', 'ode-to-joy', 'waltz-in-c', 'evening-song', 'g-major-melody'], mode: 'guided' } },
          { kind: 'check', body: '<p>Play <strong>Ode to Joy</strong> independently. Then try it with the beat for a separate rhythm score.</p>', pieceCheck: { id: 'ode-to-joy' } },
          { kind: 'recap', recap: ['Listen → look → hands separately → untimed → with the beat → faster.', 'Loop short sections; slow is fast in the long run.'], clue: { text: 'If you can’t play it slowly, you can’t play it fast.', limits: 'Slow practice needs the <em>same</em> fingering and shape as the final version — otherwise you practise something different.' }, review: 'Play one piece from the library each day this week, rotating through them.', real: 'Print or copy one piece and learn it on a real piano with the same routine. Log your practice below.' },
        ],
      },
      {
        id: 'm12-sight', title: 'Sight-reading challenge', minutes: 12, skills: ['reading'],
        goal: 'Play short melodies you have never seen, using a quick “look before you play” routine.',
        example: 'Sight-reading is like reading aloud a sentence you have never seen: you recognise familiar words (patterns) and keep going.',
        steps: [
          { kind: 'intro', body: '<p><strong>Look before you play (30 seconds):</strong></p><ol><li>Clef — which hand?</li><li>Key signature — any sharps or flats?</li><li>Time signature — count 3 or 4?</li><li>First note — where does your hand go?</li><li>Patterns — steps, skips, repeats.</li></ol><p>Press “New melody” for a fresh one; watch it, then play it with guidance.</p>', w: { type: 'randomPiece', position: 'C4' } },
          { kind: 'see', body: '<p>A melody in G major (thumb on G).</p>', w: { type: 'randomPiece', position: 'G4', key: 'G' } },
          { kind: 'explore', body: '<p>A left-hand melody in bass clef.</p>', defs: [['Sight-reading', 'Playing music at first sight.'], ['Keep going', 'In real sight-reading, you continue after a mistake instead of stopping.']], w: { type: 'randomPiece', position: 'C3', hand: 'lh' } },
          { kind: 'guided', body: '<p>Sight-read with finger numbers shown.</p>', quiz: { gens: [{ type: 'sightRead', params: { position: 'C4' }, n: 2 }, { type: 'sightRead', params: { position: 'G4', key: 'G' }, n: 1 }], count: 3, shuffle: false } },
          { kind: 'check', body: '<p>New melodies, no finger numbers, plus note reading.</p>', quiz: { gens: [{ type: 'sightRead', params: { position: 'C4', fingers: false }, n: 2 }, { type: 'sightRead', params: { position: 'C3', hand: 'lh', fingers: false }, n: 1 }, { type: 'readNote', params: { clef: 'grand', ledger: true }, n: 2 }], count: 5, shuffle: false } },
          { kind: 'recap', recap: ['Look first: clef, key, time, first note, patterns.', 'Read patterns (steps, skips) rather than single notes.', 'A little sight-reading every day builds fluency fast.'], clue: { text: 'CKT-FP: Clef, Key, Time, First note, Patterns.', limits: 'A checklist to get started. With experience you will scan these in a few seconds without listing them.' }, review: 'Sight-read two new melodies every day (Practice → Sight-reading).', real: 'Find easy printed music (method books, hymn melodies) and sight-read one line a day on a real piano.' },
        ],
      },
      {
        id: 'm12-assessment', title: 'Cumulative assessment', minutes: 15, skills: ['keyboard', 'reading', 'rhythm', 'listening', 'chords'],
        goal: 'Check what you know across the whole course — keyboard, reading, rhythm, listening, scales and chords.',
        example: 'Sixteen mixed questions, no hints. The results show which skills are secure and which to review.',
        steps: [
          { kind: 'intro', body: '<p>This is a mixed check of everything so far. It is untimed. Wrong answers are not a problem: they tell the review queue what to bring back.</p><p>Before starting, do the short warm-up if you like.</p>' },
          { kind: 'guided', title: 'Warm-up', body: '<p>Five mixed questions with hints available.</p>', quiz: { gens: [{ type: 'findSpecific' }, { type: 'readNote', params: { clef: 'grand' } }, { type: 'noteValue' }, { type: 'intervalName' }, { type: 'buildChord' }], count: 5 } },
          { kind: 'check', title: 'Assessment', body: '<p>Sixteen questions across all five skills. First tries count.</p>', quiz: { gens: [{ type: 'findLetter' }, { type: 'findSpecific' }, { type: 'playHalfWhole' }, { type: 'readNote', params: { clef: 'treble' } }, { type: 'readNote', params: { clef: 'bass' } }, { type: 'playStaffNote', params: { clef: 'grand', ledger: true } }, { type: 'keySigEffect' }, { type: 'measureComplete' }, { type: 'noteValue' }, { type: 'tapRhythm', params: { display: 'notation', level: 'long' } }, { type: 'listenDirection', params: { mixed: true } }, { type: 'intervalCompare' }, { type: 'buildScale', params: { keys: ['C', 'G'] } }, { type: 'buildChord', params: { chords: ['C', 'F', 'G', 'Am'] } }, { type: 'chordQuality' }, { type: 'symbolMeaning' }], count: 16, shuffle: false } },
          { kind: 'recap', recap: ['Look at the Progress page: the skill bars now include this assessment.', 'Anything you missed is in your review queue.', 'Retake the assessment in a week and compare.'], clue: { text: 'A mistake is information, not a verdict.', limits: 'One test is a snapshot. Real mastery shows up as being right on different days — which is exactly what the review queue checks.' }, review: 'Do your review queue daily for a week, then retake this assessment.', real: 'Play your favourite piece from this course for someone — or record it. Performing is a skill of its own.' },
        ],
      },
      {
        id: 'm12-next', title: 'Your next steps', minutes: 10, skills: [],
        goal: 'Make a realistic practice plan and know what to learn next.',
        example: 'Fifteen focused minutes on five days beats two unfocused hours once a week.',
        steps: [
          { kind: 'intro', body: '<p>You can now find any note, read simple notation in both clefs, count basic rhythms, play short pieces slowly with each hand and together, and build scales and chords. Build a plan that fits your week.</p>', w: { type: 'planBuilder' } },
          { kind: 'explore', title: 'What next', body: '<p><strong>Good next topics:</strong></p><ul><li>Dotted quarter notes (the real rhythm of Ode to Joy) and 6/8 time.</li><li>More hand positions and keys (D major, A minor), and minor scales.</li><li>The sustain pedal.</li><li>Playing from chord symbols (lead sheets).</li><li>Longer pieces from a graded method book.</li></ul><p><strong>A teacher</strong> — even a few lessons — can check posture and technique, which no app can see. <strong>An instrument:</strong> a digital piano with 88 weighted, touch-sensitive keys is ideal; 61 full-size touch-sensitive keys is a workable start.</p><p>See the Resources page for free materials.</p>', w: { type: 'practiceLog' } },
          { kind: 'recap', recap: ['Short, regular practice with a clear plan.', 'Keep using review, sight-reading and slow practice.', 'Get feedback on posture and technique from a teacher when you can.'], clue: { text: 'Little and often.', limits: 'Consistency matters more than any single session. Missing a day is normal — just continue the next day.' }, review: 'Open the Today page each day: it suggests review, one new thing and one piece.', real: 'Schedule your practice times in your calendar for next week.' },
        ],
      },
    ],
  });

  MC.resources = [
    { title: 'Open Music Theory, 2nd edition (Gotham et al.)', url: 'https://viva.pressbooks.pub/openmusictheory/', why: 'Open textbook (CC BY-SA). Checked the order of fundamentals topics, American Standard Pitch Notation (middle C = C4), clef reading and notation conventions such as displacing seconds in chords.' },
    { title: 'SMuFL — Standard Music Font Layout (W3C Community Group)', url: 'https://w3c-cg.github.io/smufl/latest/specification/scoring-metrics-glyph-registration.html', why: 'Glyph registration rules used to position clefs, noteheads, rests, flags and accidentals correctly.' },
    { title: 'Bravura music font (Steinberg)', url: 'https://github.com/steinbergmedia/bravura', why: 'Notation glyphs, SIL Open Font License 1.1 — bundled as a small subset.' },
    { title: 'Piano Ecademy — Guide to sight-reading for adult pianists', url: 'https://www.pianoecademy.com/guide-to-piano-sight-reading/', why: 'Landmark notes and intervallic reading for adult beginners; informed Modules 5 and 12.' },
    { title: 'The Curious Piano Teachers — How to use landmark notes', url: 'https://thecuriouspianoteachers.org/the-blog/6959/how-to-use-landmark-notes-for-note-reading', why: 'Landmark notes (Bass F, Middle C, Treble G) as anchors linked to steps and skips.' },
    { title: 'University of Ottawa thesis: Music reading and beginner piano students', url: 'https://ruor.uottawa.ca/server/api/core/bitstreams/1a2fc912-9f98-404a-b86b-cc40912eeae4/content', why: 'Overview of middle-C, multi-key, intervallic and eclectic reading approaches, and “sound before sign” — the reason rhythm and pitch are felt before notation here.' },
    { title: 'Yamaha Musical Instrument Guide — Correct posture when playing the piano', url: 'https://www.yamaha.com/en/musical_instrument_guide/piano/play/play002.html', why: 'Bench position, elbow height and the “holding an egg” hand shape used in Module 3.' },
    { title: 'MuseScore “All About Piano”, Chapter 2: Good posture and practice habits', url: 'https://musescore.com/articles/all-about-piano/chapter/chapter-2-good-posture-and-practice-habits', why: 'Posture, relaxation and practice habits.' },
    { title: 'Practis blog — Simply Piano vs Flowkey for adult learners', url: 'https://pract.is/blog/simply-piano-vs-flowkey-adult-learners', why: 'Wait mode helps learn notes but should not replace playing in time — so this app separates guided, untimed and timed modes.' },
    { title: 'MusicRadar — Flowkey review', url: 'https://www.musicradar.com/reviews/flowkey-review', why: 'Useful app interactions: looping sections, hands separately, slower tempos.' },
    { title: 'MDN — Web Audio API best practices', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices', and: 'Chromium autoplay policy: https://www.chromium.org/audio-video/autoplay/', why: 'Why sound starts with an explicit “Enable sound” click.' },
    { title: 'Salamander Grand Piano V3 (Alexander Holm) via @audio-samples/piano-mp3-velocity8 (Jan Forst)', url: 'https://archive.org/details/SalamanderGrandPianoV3', why: 'Piano recordings, CC BY 3.0 (package MIT). Trimmed, mono and re-encoded for this app; notes between recordings are pitch-shifted.' },
  ];
  MC.freeResources = [
    { title: 'musictheory.net', url: 'https://www.musictheory.net/', why: 'Free lessons and drills for note reading, intervals, key signatures.' },
    { title: 'IMSLP — Petrucci Music Library', url: 'https://imslp.org/', why: 'Public-domain sheet music, including easy classical pieces.' },
    { title: 'Open Music Theory', url: 'https://viva.pressbooks.pub/openmusictheory/', why: 'Go deeper into theory when you are ready.' },
    { title: 'MuseScore (free notation software)', url: 'https://musescore.org/', why: 'Write out your own exercises, or find arrangements (check each score’s licence).' },
  ];
})(window.MC = window.MC || {});
