/* Course content, modules 1–4: sound & keyboard, finding notes, first movements, rhythm.
   Each lesson: intro (goal + example) → see/hear → explore (definitions) → guided → check → recap. */
(function (MC) {
  'use strict';
  const C = (MC.course = MC.course || { modules: [], lessons: {} });
  MC.courseAdd = MC.courseAdd || function (mod) {
    mod.lessons.forEach((l, i) => { l.module = mod.n; l.index = i; C.lessons[l.id] = l; });
    C.modules.push(mod);
    C.modules.sort((a, b) => a.n - b.n);
  };

  MC.courseAdd({
    n: 1, title: 'Sound and the keyboard', prereq: [],
    summary: 'High and low, loud and soft, long and short — and the pattern of keys that repeats across every piano.',
    lessons: [
      {
        id: 'm1-high-low', title: 'High and low sounds', minutes: 10, skills: ['listening', 'keyboard'],
        goal: 'Hear the difference between high and low sounds — and find them on the piano.',
        example: 'A tuba sounds low; a flute sounds high. On a piano, keys on the <strong>left</strong> make low sounds and keys on the <strong>right</strong> make high sounds.',
        steps: [
          { kind: 'intro', body: '<p>Welcome. You do not need to know anything yet — we start with your ears.</p><p>Turn on sound, then press one key far to the left and one far to the right. You can click, tap, or use the letter keys on your computer keyboard shown on each key.</p>', w: { type: 'firstSound' } },
          { kind: 'see', body: '<p>Watch and listen. The demonstration walks from the left end toward the right, then comes back.</p><p>The dots underneath draw the “shape” of the sound: they climb as the sound gets higher.</p>', w: { type: 'demo', labels: 'none', graph: true, bpm: 110, steps: ['C3', 'G3', 'C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6', 'G5', 'E5', 'C5', 'G4', 'E4', 'C4', 'G3', 'C3'].map((m, i) => ({ m, cap: i < 9 ? 'Moving <strong>right</strong> → the sound gets <strong>higher</strong>' : 'Moving <strong>left</strong> → the sound gets <strong>lower</strong>' })) } },
          { kind: 'explore', body: '<p>Now explore on your own. Every time you press a key, the box tells you whether it was higher or lower than the key before.</p>', defs: [['Pitch', 'How high or low a sound is.'], ['Higher', 'On the piano: further to the right.'], ['Lower', 'On the piano: further to the left.']], more: 'Sound is vibration. A higher sound vibrates faster. Piano strings for low notes are long and heavy, so they vibrate slowly; strings for high notes are short and thin, so they vibrate quickly.', w: { type: 'keyboardExplore', from: 36, to: 84, labels: 'none', mode: 'compare', labelToggle: false } },
          { kind: 'guided', body: '<p>Some listening, some playing. Use the hint button whenever you like — hints are part of learning.</p>', quiz: { gens: [{ type: 'pitchCompare', params: { minGap: 7, maxGap: 19 }, n: 3 }, { type: 'keyHigherLower', n: 2 }], count: 5 } },
          { kind: 'check', body: '<p>Now without hints. The two sounds may be closer together this time — listen carefully. Your first answer counts.</p>', quiz: { gens: [{ type: 'pitchCompare', params: { minGap: 4, maxGap: 12 }, n: 3 }, { type: 'keyHigherLower', n: 3 }], count: 6 } },
          { kind: 'recap', recap: ['<strong>Pitch</strong> means how high or low a sound is.', 'On a piano: <strong>left = lower</strong>, <strong>right = higher</strong>.', 'Your ears can already compare pitches — that skill grows with practice.'], clue: { text: 'The keyboard is a staircase lying on its side: step to the right to climb higher.', limits: 'This left–right rule is for pianos and keyboards. On a guitar or violin the layout is different — but “high” and “low” mean the same thing everywhere.' }, review: 'Tomorrow: play three keys — one low, one in the middle, one high — and say “low, middle, high” out loud.', real: 'Sit in front of the middle of the piano. Play the lowest key with one finger, then the highest. Notice that low notes ring much longer than high ones.' },
        ],
      },
      {
        id: 'm1-loud-long', title: 'Loud and soft, long and short', minutes: 12, skills: ['listening'],
        goal: 'Tell apart three different things about a sound: how high, how loud, and how long.',
        example: 'A whisper and a shout can use the same height of voice — only the loudness differs. A doorbell can go “ding” (short) or “diiing” (long).',
        steps: [
          { kind: 'intro', body: '<p>Listen to the same key played four ways: soft, loud, short, long. The key does not move — so the pitch stays the same.</p>', w: { type: 'demo', labels: 'c', bpm: 60, steps: [{ m: 'C4', vel: 0.22, d: 1.5, cap: '<strong>Soft</strong> — same key, gentle press' }, { m: 'C4', vel: 1, d: 1.5, cap: '<strong>Loud</strong> — same key, strong press' }, { m: 'C4', d: 0.3, gap: 1.2, cap: '<strong>Short</strong> — press and let go' }, { m: 'C4', d: 3, cap: '<strong>Long</strong> — press and hold' }] } },
          { kind: 'see', body: '<p>High/low and loud/soft are <em>independent</em>: a high note can be soft or loud, and so can a low note.</p>', w: { type: 'demo', labels: 'none', bpm: 60, steps: [{ m: 'C6', vel: 0.25, d: 1.5, cap: 'High and <strong>soft</strong>' }, { m: 'C3', vel: 1, d: 1.5, cap: 'Low and <strong>loud</strong>' }, { m: 'C6', vel: 1, d: 1.5, cap: 'High and <strong>loud</strong>' }, { m: 'C3', vel: 0.25, d: 1.5, cap: 'Low and <strong>soft</strong>' }] } },
          { kind: 'explore', body: '<p>Build your own sound: choose a key, a loudness and a length. The shape shows all three at once.</p>', defs: [['Dynamics', 'How loud or soft music is.'], ['Duration', 'How long a sound lasts.'], ['Pitch', 'How high or low (from the last lesson).']], more: 'On a real piano, loudness comes from how <em>fast</em> the key goes down: a quick press throws the hammer harder at the string. Holding the key keeps the sound going; letting go drops a felt “damper” onto the string and stops it.', w: { type: 'soundQualities' } },
          { kind: 'guided', body: '<p>Each question plays two sounds that differ in exactly one way. Say what changed in the second sound.</p>', quiz: { gens: [{ type: 'qualityCompare', n: 5 }], count: 5 } },
          { kind: 'check', body: '<p>Same kind of question, no hints.</p>', quiz: { gens: [{ type: 'qualityCompare', n: 6 }], count: 6 } },
          { kind: 'recap', recap: ['Every sound has a <strong>pitch</strong> (high/low), a <strong>dynamic</strong> (loud/soft) and a <strong>duration</strong> (long/short).', 'They change independently: low is not the same as soft.', 'On a piano, speed of the key press controls loudness; holding the key controls length.'], clue: { text: 'Three questions for every sound: Where? (high/low) — How strong? (loud/soft) — How long? (long/short).', limits: 'Real music changes several at once. Practising them one at a time first makes that easier to hear later.' }, review: 'Hum one note softly, then loudly, then short, then long — same pitch each time.', real: 'Press one key slowly so it barely sounds, then quickly for a strong sound. Then hold a key while counting to 4, and compare with a quick tap.' },
        ],
      },
      {
        id: 'm1-pattern', title: 'The repeating pattern of keys', minutes: 10, skills: ['keyboard'],
        goal: 'See the pattern that repeats across every piano: groups of two and three black keys.',
        example: 'A full piano has 88 keys, but it is really one small pattern of 12 keys repeated over and over.',
        steps: [
          { kind: 'intro', body: '<p>Look at the black keys. They are not evenly spaced: they come in groups of <strong>two</strong> and <strong>three</strong>, with a gap between groups.</p>', w: { type: 'patternMap' } },
          { kind: 'see', body: '<p>Listen to the same little tune played in three places — each time starting at the same spot next to a group of two black keys. It is the “same” tune, only higher.</p>', w: { type: 'demo', labels: 'none', bpm: 150, steps: [48, 50, 52, 50, 48, 60, 62, 64, 62, 60, 72, 74, 76, 74, 72].map((m, i) => ({ m, d: i % 5 === 4 ? 2 : 1, cap: i < 5 ? 'Low' : i < 10 ? 'Middle — same place in the next pattern' : 'High — and again' })) } },
          { kind: 'explore', body: '<p>Press any black key: the app marks its group and every group of the same size.</p>', defs: [['White keys', 'The long keys. Seven in each pattern.'], ['Black keys', 'The short raised keys, in groups of 2 and 3. Five in each pattern.'], ['The pattern', '7 white + 5 black = 12 keys, repeating from low to high.']], w: { type: 'keyboardExplore', from: 36, to: 83, labels: 'none', mode: 'group', labelToggle: false } },
          { kind: 'guided', body: '<p>Find groups, and find the same spot in the next pattern.</p>', quiz: { gens: [{ type: 'blackGroup', n: 3 }, { type: 'samePlace', n: 2 }], count: 5 } },
          { kind: 'check', body: '<p>No hints this time.</p>', quiz: { gens: [{ type: 'blackGroup', n: 3 }, { type: 'samePlace', n: 3 }], count: 6 } },
          { kind: 'recap', recap: ['Black keys come in groups of <strong>two</strong> and <strong>three</strong>.', 'One pattern = 12 keys (7 white, 5 black). It repeats across the whole piano.', 'The same spot in the next pattern sounds like the same note, higher or lower.'], clue: { text: 'Two black keys look like chopsticks; three look like a fork.', limits: 'This picture only helps you spot the groups quickly — it says nothing about the sound. Soon you will see the groups without thinking of chopsticks.' }, review: 'Close your eyes and touch the screen (or a real piano): can you find a group of three by feel?', real: 'Run a finger along the black keys from low to high, saying “two, three, two, three…”. Then find a group of two with your eyes closed.' },
        ],
      },
    ],
  });

  MC.courseAdd({
    n: 2, title: 'Finding notes', prereq: [1],
    summary: 'The seven letter names A–G, finding every white key by its black-key neighbours, middle C and octaves.',
    lessons: [
      {
        id: 'm2-cde', title: 'C, D and E', minutes: 10, skills: ['keyboard'],
        goal: 'Find C, D and E anywhere on the keyboard, using the groups of two black keys.',
        example: 'Every C sits just to the <strong>left</strong> of a group of two black keys. D is in the middle of them; E is just to the right.',
        steps: [
          { kind: 'intro', body: '<p>Watch where C, D and E appear. Each time, look at the group of two black keys next to them.</p>', w: { type: 'demo', labels: 'none', bpm: 70, keepMarks: true, steps: [{ m: 'C3', tag: 'C', cap: 'C — just left of two black keys' }, { m: 'C4', tag: 'C', cap: 'Another C — same spot, next group' }, { m: 'C5', tag: 'C', cap: 'And another C' }, { m: 'D4', tag: 'D', cap: 'D — between the two black keys' }, { m: 'E4', tag: 'E', cap: 'E — just right of the two black keys' }, { m: ['C4', 'E4'], d: 2, tags: ['C', 'E'], cap: 'C and E surround the pair; D sits between' }] } },
          { kind: 'see', body: '<p>Press white keys around the groups of two. The box names each key and tells you how to find it.</p>', w: { type: 'keyboardExplore', from: 48, to: 76, labels: 'none', mode: 'name', groupToggle: true } },
          { kind: 'explore', body: '<p>Music uses only seven letter names for the white keys: <strong>A B C D E F G</strong>. After G, it starts again at A. Try turning on “Letters” to see them all.</p>', defs: [['Musical alphabet', 'A B C D E F G, then repeat.'], ['Note', 'A single musical sound — and its name, like C or D.']], more: 'Why do lessons start with C instead of A? C is easy to find, and a very important scale (C major) uses only white keys starting on C. The alphabet itself still runs A–G.', w: { type: 'keyboardExplore', from: 48, to: 76, labels: 'white', mode: 'name' } },
          { kind: 'guided', body: '<p>Find and name C, D and E. The hint marks the black-key groups.</p>', quiz: { gens: [{ type: 'findLetter', params: { letters: ['C', 'D', 'E'] }, n: 3 }, { type: 'nameKey', params: { letters: ['C', 'D', 'E'] }, n: 2 }], count: 5 } },
          { kind: 'check', body: '<p>No labels, no hints.</p>', quiz: { gens: [{ type: 'findLetter', params: { letters: ['C', 'D', 'E'] }, n: 3 }, { type: 'nameKey', params: { letters: ['C', 'D', 'E'] }, n: 3 }], count: 6 } },
          { kind: 'recap', recap: ['The white keys use the letters A–G, repeating.', '<strong>C</strong> = left of two black keys, <strong>D</strong> = between them, <strong>E</strong> = right of them.'], clue: { text: 'C comes before the couple (the pair of black keys).', limits: 'It only finds C. D and E follow from it; F, G, A, B need the three black keys (next lesson). Use the clue until you simply recognise C by sight.' }, review: 'Find every C on the keyboard, low to high. Then every E.', real: 'Play all the Cs from bottom to top with finger 3. Then all the Ds, then all the Es.' },
        ],
      },
      {
        id: 'm2-fgab', title: 'F, G, A and B', minutes: 10, skills: ['keyboard'],
        goal: 'Find F, G, A and B using the groups of three black keys — and name any white key.',
        example: 'F sits just to the <strong>left</strong> of a group of three black keys; B sits just to the <strong>right</strong>. G and A are inside the group.',
        steps: [
          { kind: 'intro', body: '<p>Now the group of three. Four white keys live around it: F, G, A, B.</p>', w: { type: 'demo', labels: 'none', bpm: 70, keepMarks: true, steps: [{ m: 'F4', tag: 'F', cap: 'F — just left of three black keys' }, { m: 'G4', tag: 'G', cap: 'G — between the 1st and 2nd black keys' }, { m: 'A4', tag: 'A', cap: 'A — between the 2nd and 3rd' }, { m: 'B4', tag: 'B', cap: 'B — just right of three black keys' }, { m: 'C5', tag: 'C', cap: 'Then C again — the alphabet starts over' }] } },
          { kind: 'see', body: '<p>The alphabet walking up the keyboard: C D E F G A B, then C again.</p>', w: { type: 'demo', labels: 'none', bpm: 100, keepMarks: true, autoLabel: true, steps: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'].map((m) => ({ m, tag: m[0] })) } },
          { kind: 'explore', body: '<p>Name any white key: first find its group (two or three black keys), then its place in the group.</p>', defs: [['Around 2 black keys', 'C, D, E'], ['Around 3 black keys', 'F, G, A, B']], w: { type: 'keyboardExplore', from: 48, to: 76, labels: 'none', mode: 'name', groupToggle: true } },
          { kind: 'guided', body: '<p>All seven letters now.</p>', quiz: { gens: [{ type: 'findLetter', params: { letters: ['F', 'G', 'A', 'B'] }, n: 2 }, { type: 'nameKey', n: 2 }, { type: 'alphabetStep', n: 1 }], count: 5 } },
          { kind: 'check', body: '<p>Any white key, no hints.</p>', quiz: { gens: [{ type: 'findLetter', n: 3 }, { type: 'nameKey', n: 2 }, { type: 'alphabetStep', n: 1 }], count: 6 } },
          { kind: 'recap', recap: ['<strong>F</strong> is left of three black keys, <strong>B</strong> right of them; G and A are inside.', 'After G comes A: the alphabet repeats.'], clue: { text: 'F is at the Front of the three; B is at the Back.', limits: 'Front/back only works if you read left to right. Check yourself with the black keys, not just the words.' }, review: 'Say the alphabet backwards from G: G F E D C B A — then play it downward.', real: 'Play every F on the piano, then every B. Then play C D E F G A B C with one finger, saying the names.' },
        ],
      },
      {
        id: 'm2-middle-c', title: 'Middle C and octaves', minutes: 12, skills: ['keyboard', 'listening'],
        goal: 'Find middle C and understand octaves: the same letter name at a higher or lower pitch.',
        example: 'When a man and a woman sing “the same note” together, they are usually an octave apart. The two sounds blend so well that they share a name.',
        steps: [
          { kind: 'intro', body: '<p>Listen to four Cs, low to high. Then hear two of them together.</p>', w: { type: 'demo', labels: 'c', bpm: 60, steps: [{ m: 'C3', cap: 'C3 — one octave below middle C' }, { m: 'C4', cap: '<strong>Middle C (C4)</strong> — near the centre of the piano' }, { m: 'C5', cap: 'C5 — one octave above' }, { m: 'C6', cap: 'C6 — two octaves above' }, { m: ['C4', 'C5'], d: 2, cap: 'C4 + C5 together: they blend as if they were one note' }] } },
          { kind: 'see', body: '<p>Press any key. All the keys with the same name light up — each one an octave apart.</p>', w: { type: 'keyboardExplore', from: 36, to: 84, labels: 'c', mode: 'octave', playOctaves: true, labelToggle: false } },
          { kind: 'explore', body: '<p>Each octave gets a number, starting on C. Middle C is <strong>C4</strong>; the D just above it is D4; the B just below it is B3.</p>', defs: [['Middle C', 'The C closest to the centre of the piano (often right under the brand name). Called C4.'], ['Octave', 'From one note to the next note with the same letter: 8 white keys counting both ends, or 12 keys counting black and white.'], ['Octave number', 'The number after the letter (C4, G3). It goes up by one at every C.']], more: 'This numbering is called scientific pitch notation. An 88-key piano runs from A0 (lowest) to C8 (highest). Small keyboards have fewer keys, so find middle C by counting groups from the centre.', w: { type: 'keyboardExplore', from: 36, to: 84, labels: 'c', mode: 'name', labelToggle: true } },
          { kind: 'guided', body: '<p>Find specific notes, and jump by octaves.</p>', quiz: { gens: [{ type: 'findSpecific', params: { targets: ['C4', 'C5', 'C3', 'D4', 'G4', 'A3'] }, n: 3 }, { type: 'octaveJump', n: 2 }], count: 5 } },
          { kind: 'check', body: '<p>The only labels now are on the Cs. Exact octave counts.</p>', quiz: { gens: [{ type: 'findSpecific', params: { targets: ['C4', 'C5', 'C3', 'E4', 'G3', 'F4', 'B3'] }, n: 4 }, { type: 'octaveJump', n: 2 }], count: 6 } },
          { kind: 'recap', recap: ['<strong>Middle C = C4</strong>, near the centre.', 'An <strong>octave</strong> is the distance to the next key with the same letter.', 'Octave numbers change at every C: B3 is just below C4.'], clue: { text: 'Oct means eight (an octopus has 8 arms): count 8 white keys from letter to letter.', limits: '8 is counting white keys including both ends. Counting every key (black too), an octave is 12 half steps. Both are correct — they just count different things.' }, review: 'Find middle C quickly three times in a row. Then play C3 – C4 – C5.', real: 'Find middle C on your instrument — usually near the brand name. Play it, then the C an octave higher with the same finger.' },
        ],
      },
    ],
  });

  MC.courseAdd({
    n: 3, title: 'Your first piano movements', prereq: [2],
    summary: 'Finger numbers for both hands, a relaxed posture and hand shape, and five-finger hand positions — C, middle C and G — shown on the keys.',
    lessons: [
      {
        id: 'm3-fingers', title: 'Finger numbers', minutes: 10, skills: ['keyboard'],
        goal: 'Learn the finger numbers used in piano music: thumbs are 1, little fingers are 5 — in both hands.',
        example: 'A small “3” above a note means “play this with your middle finger”.',
        steps: [
          { kind: 'intro', body: '<p>Watch the numbers: right hand first (thumb on middle C), then left hand (little finger on the C below).</p>', w: { type: 'demo', labels: 'white', bpm: 90, steps: [['C4', 1], ['D4', 2], ['E4', 3], ['F4', 4], ['G4', 5]].map(([m, f]) => ({ m, tag: String(f), cap: `Right hand, finger <strong>${f}</strong>` })).concat([['C3', 5], ['D3', 4], ['E3', 3], ['F3', 2], ['G3', 1]].map(([m, f]) => ({ m, tag: String(f), mark: 'lh', cap: `Left hand, finger <strong>${f}</strong>` }))) } },
          { kind: 'see', body: '<p>Click any finger on either hand. You will see and hear which key it plays in “C position”.</p>', w: { type: 'handExplore' } },
          { kind: 'explore', body: '<p>The two hands are mirror images. On the keyboard, the right thumb is on the <em>left</em> side of the right hand, and the left thumb is on the <em>right</em> side of the left hand. Numbers always start at the thumb.</p>', defs: [['Finger numbers', '1 = thumb, 2 = index, 3 = middle, 4 = ring, 5 = little finger.'], ['Fingering', 'The finger numbers written in music to suggest which finger plays which note.']], more: 'Some old British music marks the thumb with “+” and the fingers 1–4. Modern piano music always uses 1–5 with the thumb as 1.', w: { type: 'positionExplore' } },
          { kind: 'guided', body: '<p>Click fingers and name them. Numbers appear if you need another try.</p>', quiz: { gens: [{ type: 'fingerQuiz', params: { variant: 'click' }, n: 3 }, { type: 'fingerQuiz', params: { variant: 'name' }, n: 2 }], count: 5 } },
          { kind: 'check', body: '<p>Both hands, mixed.</p>', quiz: { gens: [{ type: 'fingerQuiz', n: 6 }], count: 6 } },
          { kind: 'recap', recap: ['Thumbs are <strong>1</strong>, little fingers <strong>5</strong> — in both hands.', 'The hands mirror each other: the right thumb points left, the left thumb points right.'], clue: { text: 'Thumbs up for number one.', limits: 'The clue tells you where counting starts, not how to move. Fingering in music is a suggestion that helps you play smoothly.' }, review: 'Away from the screen: rest both hands on a table and tap 1 2 3 4 5, then 5 4 3 2 1, one hand at a time.', real: 'Put your right thumb on middle C and let each finger rest on the next white key. Say each finger number as you press it.' },
        ],
      },
      {
        id: 'm3-posture', title: 'Posture and five-finger patterns', minutes: 14, skills: ['keyboard'],
        goal: 'Sit comfortably, shape your hands, and play simple five-finger patterns with each hand separately.',
        example: 'In <strong>C position</strong>, your right thumb rests on middle C and each finger gets its own key: C D E F G.',
        steps: [
          { kind: 'intro', body: '<p>Good habits from day one prevent strain later. If you have a piano, keyboard or even a table nearby, go through this checklist now.</p>', w: { type: 'posture' } },
          { kind: 'see', body: '<p>Watch the patterns in C position. Each finger stays over its own key — the hand does not need to move.</p>', w: { type: 'positionExplore' } },
          { kind: 'explore', body: '<p>Five-finger patterns are the building blocks of your first pieces. Play each hand separately — two hands together comes later.</p>', defs: [['Five-finger position', 'Five neighbouring white keys, one finger on each.'], ['Right-hand C position', 'Thumb (1) on middle C … little finger (5) on G.'], ['Left-hand C position', 'Little finger (5) on the C below middle C … thumb (1) on G.'], ['Hands separately', 'Practising one hand at a time — normal for everyone, not only beginners.']], more: 'Aim for even sounds: every note the same loudness and length. Keep fingertips curved and the wrist loose. Slow is better than fast here.', w: { type: 'demo', labels: 'white', bpm: 84, steps: [1, 2, 3, 4, 5, 4, 3, 2, 1].map((f) => ({ m: ['C4', 'D4', 'E4', 'F4', 'G4'][f - 1], tag: String(f), cap: `Right hand: <strong>${f}</strong>` })) } },
          { kind: 'guided', body: '<p>Play patterns by finger number. All five finger numbers are shown on the keys.</p>', quiz: { gens: [{ type: 'playPattern', params: { hand: 'rh', hints: 'full' }, n: 2 }, { type: 'playPattern', params: { hand: 'lh', hints: 'full' }, n: 2 }], count: 4 } },
          { kind: 'check', body: '<p>Now only the starting finger is marked. Work out the rest from the position.</p>', quiz: { gens: [{ type: 'playPattern', params: { hand: 'rh', hints: 'thumb' }, n: 3 }, { type: 'playPattern', params: { hand: 'lh', hints: 'thumb' }, n: 3 }], count: 6 } },
          { kind: 'recap', recap: ['Sit centred, feet flat, shoulders loose, forearms level with the keys.', 'Curved fingers, loose wrists, one finger per key.', 'C position: RH 1 on middle C; LH 5 on the C below.', 'The app checks which keys you press — not how your hand moves. Only you (or a teacher) can check posture.'], clue: { text: 'Hold an imaginary egg: that is your hand shape.', limits: 'The egg is a starting point, not a rule. Fingers flatten slightly for some notes later — what matters is staying relaxed.' }, review: 'Play 1-2-3-4-5-4-3-2-1 with each hand, slowly, listening for even sounds.', real: 'Go through the posture checklist on your instrument, then play the patterns with each hand. Stop and shake out your hands if anything feels tight.' },
        ],
      },
      {
        id: 'm3-positions', title: 'Hand positions on the keyboard', minutes: 14, skills: ['keyboard'],
        goal: 'Place each hand in a five-finger position — C, middle C and G — and know which finger plays which key without looking.',
        example: 'In <strong>C position</strong> your hands rest an octave apart: left hand on C–G below middle C, right hand on C–G starting at middle C. Each finger “owns” one key.',
        steps: [
          { kind: 'intro', body: '<p>A <strong>hand position</strong> tells you where each of your five fingers rests before you play. Once your hand is in place, you can play many notes without moving it.</p><p>Here are both hands in <strong>C position</strong>, drawn on the keys. Press a key under a finger — that finger goes down.</p>', w: { type: 'handPosition', positions: ['bothC'], patterns: true } },
          { kind: 'see', body: '<p>Step through the positions and watch the hands. Notice:</p><ul><li>The <strong>right</strong> hand counts <strong>1 → 5</strong> from left to right.</li><li>The <strong>left</strong> hand counts <strong>5 → 1</strong> from left to right.</li><li>In <strong>middle C position</strong> both thumbs share middle C.</li></ul>', w: { type: 'handPosition', positions: ['rhC', 'lhC', 'bothC', 'midC', 'rhG', 'lhG'] } },
          { kind: 'explore', body: '<p>Pick a position and play keys yourself. The box tells you which finger plays each key — or that the key is outside the position and the hand would have to <em>shift</em>.</p>', defs: [['Hand position', 'Where your five fingers rest, one finger per key.'], ['C position', 'RH thumb on middle C (C4–G4); LH little finger on C3 (C3–G3).'], ['Middle C position', 'Both thumbs share middle C: LH on F3–C4, RH on C4–G4.'], ['G position', 'RH thumb on G4 (G4–D5); LH little finger on G2 (G2–D3).'], ['Shift', 'Moving the whole hand to a new position.']], more: 'Beginner books use these positions because you can play whole tunes without moving your hands. Later, the hands shift often — but the idea of “one finger per key” stays.', w: { type: 'handPosition', positions: ['rhC', 'lhC', 'midC', 'rhG', 'lhG'], start: 'rhG', patterns: false } },
          { kind: 'guided', body: '<p>Play finger patterns in different positions. The hand is drawn on the keys to help you.</p>', quiz: { gens: [{ type: 'playPattern', params: { hand: 'rh', position: 'G4', hints: 'full' }, n: 1 }, { type: 'playPattern', params: { hand: 'lh', position: 'G2', hints: 'full' }, n: 1 }, { type: 'positionFinger', n: 3 }], count: 5 } },
          { kind: 'check', body: '<p>No hand drawing now for the patterns — only the starting finger is marked. Work out the rest from the position.</p>', quiz: { gens: [{ type: 'playPattern', params: { hand: 'rh', position: 'G4', hints: 'thumb' }, n: 1 }, { type: 'playPattern', params: { hand: 'lh', position: 'C3', hints: 'thumb' }, n: 1 }, { type: 'positionFinger', params: { positions: [['rh', 'C4'], ['lh', 'C3'], ['rh', 'G4'], ['lh', 'G2'], ['lh', 'F3']] }, n: 4 }], count: 6 } },
          { kind: 'recap', recap: ['A hand position = five neighbouring keys, one finger on each.', '<strong>C position:</strong> RH 1 on middle C; LH 5 on the C below.', '<strong>Middle C position:</strong> both thumbs on middle C.', '<strong>G position:</strong> RH 1 on G4; LH 5 on G2.', 'Right hand counts 1→5 left to right; left hand counts 5→1.'], clue: { text: 'Find the thumb’s key first — the other fingers fall into place next to it.', limits: 'This works for five-finger positions on white keys. Positions with black keys, and pieces where the hand moves, need reading and fingering marks too.' }, review: 'Put your hands in C position, then middle C position, then G position — say the thumb’s key out loud each time.', real: 'On a real piano: place both hands in C position with your eyes closed, then open them and check. Repeat for middle C position and G position.' },
        ],
      },
    ],
  });

  MC.courseAdd({
    n: 4, title: 'Feeling rhythm', prereq: [1],
    summary: 'Steady pulse, tempo, counting in groups of 3 and 4, long sounds and half beats — before any notation.',
    lessons: [
      {
        id: 'm4-pulse', title: 'Steady pulse and tempo', minutes: 12, skills: ['rhythm', 'listening'],
        goal: 'Feel a steady beat — and learn that tempo means how fast that beat goes.',
        example: 'Your footsteps when walking make a steady beat. Walking slowly or quickly changes the tempo, not the steadiness.',
        steps: [
          { kind: 'intro', body: '<p>Start the metronome and nod, tap your foot, or clap along. Try changing the speed with the slider.</p>', w: { type: 'metronome', bpm: 72, showGrouping: false, compact: true } },
          { kind: 'see', body: '<p>The same tune at a slow tempo, then at a fast tempo. The notes stay the same; only the speed of the beat changes.</p>', w: { type: 'demo', labels: 'c', bpm: 80, steps: [60, 62, 64, 65, 67].map((m) => ({ m, d: 1.6, cap: '<strong>Slow</strong> tempo' })).concat([{ m: [], d: 1, cap: '…' }]).concat([60, 62, 64, 65, 67].map((m) => ({ m, d: 0.5, cap: '<strong>Fast</strong> tempo — same notes' }))) } },
          { kind: 'explore', body: '<p>Try a few tempos. Which feels like walking? Which like running?</p>', defs: [['Beat (pulse)', 'The steady “tick” underneath music — what you tap your foot to.'], ['Tempo', 'How fast the beat goes.'], ['BPM', 'Beats per minute. 60 BPM = one beat per second.']], more: 'Music often names tempos in Italian: <em>Adagio</em> (slow), <em>Andante</em> (walking pace), <em>Moderato</em> (moderate), <em>Allegro</em> (fast).', w: { type: 'metronome', bpm: 90, showGrouping: false } },
          { kind: 'guided', body: '<p>Tap with the clicks. The app measures how close each tap is — the tolerance is generous. Bluetooth headphones add delay; you can calibrate in Settings.</p>', quiz: { gens: [{ type: 'tapAlong', params: { bpm: 72 }, n: 1 }, { type: 'tempoCompare', n: 2 }, { type: 'tapAlong', params: { bpm: 84 }, n: 1 }], count: 4, shuffle: false } },
          { kind: 'check', body: '<p>In the tapping questions the clicks stop halfway — keep the beat going in your head.</p>', quiz: { gens: [{ type: 'tapAlong', params: { fade: true, bpm: 72 }, n: 1 }, { type: 'tempoCompare', n: 3 }, { type: 'tapAlong', params: { fade: true, bpm: 88 }, n: 1 }], count: 5, shuffle: false } },
          { kind: 'recap', recap: ['The <strong>beat</strong> is the steady pulse of music.', '<strong>Tempo</strong> is its speed, measured in <strong>BPM</strong>.', 'Keeping a steady beat — even when you are thinking hard — is one of the most important skills in music.'], clue: { text: 'The beat is the music’s heartbeat: it stays steady even when the notes do not.', limits: 'Unlike your real heartbeat, the musical beat does not speed up when you get excited — that is exactly what practice helps you control.' }, review: 'Put on any song you like and tap its beat for 30 seconds.', real: 'Set the metronome to 60 and play middle C on every click, 8 times. Then try 90.' },
        ],
      },
      {
        id: 'm4-counting', title: 'Counting beats in groups', minutes: 12, skills: ['rhythm', 'listening'],
        goal: 'Count beats in groups of 4 and 3, feeling beat 1 as the strongest.',
        example: 'A march goes LEFT-right-left-right: <strong>1</strong> 2 3 4. A waltz sways <strong>ONE</strong>-two-three.',
        steps: [
          { kind: 'intro', body: '<p>Listen for the strong first beat of each group. The key tags show the count.</p>', w: { type: 'demo', labels: 'none', bpm: 110, steps: [0, 1, 2, 3, 0, 1, 2, 3].map((b) => ({ m: b === 0 ? 'C3' : 'C4', vel: b === 0 ? 1 : 0.38, tag: String(b + 1), cap: `Groups of 4: <strong>${b + 1}</strong>` })).concat([0, 1, 2, 0, 1, 2].map((b) => ({ m: b === 0 ? 'C3' : 'C4', vel: b === 0 ? 1 : 0.38, tag: String(b + 1), cap: `Groups of 3: <strong>${b + 1}</strong>` }))) } },
          { kind: 'see', body: '<p>Now the metronome in groups. The first click of each group is higher. Count aloud: “<strong>1</strong> 2 3 4”, or switch to 3.</p>', w: { type: 'metronome', bpm: 96, beatsPerBar: 4, compact: true } },
          { kind: 'explore', body: '<p>Groups of beats are the backbone of rhythm. Soon you will see them written as <em>measures</em>.</p>', defs: [['Downbeat', 'Beat 1 — the strongest beat, where each group starts.'], ['Counting', 'Saying the beat numbers aloud: 1 2 3 4 | 1 2 3 4.'], ['Groups of 4', 'The most common grouping (marches, pop songs).'], ['Groups of 3', 'The feel of a waltz.']], w: { type: 'metronome', bpm: 88, beatsPerBar: 3 } },
          { kind: 'guided', body: '<p>Count, listen for groups, and tap only on beat 1.</p>', quiz: { gens: [{ type: 'whichBeat', n: 2 }, { type: 'hearGrouping', n: 2 }, { type: 'tapRhythm', params: { pattern: [4, 4], measures: 2, bpm: 90 }, n: 1 }], count: 5 } },
          { kind: 'check', body: '<p>No hints.</p>', quiz: { gens: [{ type: 'hearGrouping', n: 2 }, { type: 'whichBeat', n: 2 }, { type: 'tapRhythm', params: { pattern: [4, 4], measures: 2, bpm: 96 }, n: 1 }], count: 5 } },
          { kind: 'recap', recap: ['Beats come in groups; beat <strong>1</strong> is the strong <strong>downbeat</strong>.', 'Groups of 4 and groups of 3 are the most common.', 'Counting aloud keeps you steady.'], clue: { text: 'March in 4, waltz in 3.', limits: 'There are other groupings (2, 6, and more) — 3 and 4 are simply the best place to start.' }, review: 'Walk around the room counting “1 2 3 4” with a slightly heavier step on 1.', real: 'Play C3 (low) on beat 1 and middle C on beats 2, 3, 4 with the metronome. Then try groups of 3.' },
        ],
      },
      {
        id: 'm4-long-short', title: 'Long sounds and split beats', minutes: 14, skills: ['rhythm'],
        goal: 'Make sounds that last 1, 2 or 4 beats — and split a beat in half (“1 &”).',
        example: 'Say “walk, walk, walk, walk” (1 beat each), “stri-ide, stri-ide” (2 beats each), and “run-ning, run-ning” (half a beat each).',
        steps: [
          { kind: 'intro', body: '<p>Listen to sounds of different lengths against the same beat.</p>', w: { type: 'demo', labels: 'c', bpm: 80, steps: [{ m: 'C4', d: 1, cap: '1 beat (walk)' }, { m: 'C4', d: 1, cap: '1 beat (walk)' }, { m: 'E4', d: 2, cap: '2 beats (stri-ide)' }, { m: 'G4', d: 4, cap: '4 beats — hold while counting 1 2 3 4' }, { m: 'E4', d: 0.5, cap: '½ beat (run-)' }, { m: 'E4', d: 0.5, cap: '½ beat (-ning)' }, { m: 'D4', d: 0.5, cap: '½ (run-)' }, { m: 'D4', d: 0.5, cap: '½ (-ning)' }, { m: 'C4', d: 2, cap: '2 beats' }] } },
          { kind: 'see', body: '<p>Build a 4-beat pattern from blocks and play it with a count-in. Each block starts a sound; its length shows how many beats it lasts. A dashed block is a rest (silence).</p>', w: { type: 'rhythmBuilder', beats: 4, values: [1, 2, 4, 0.5, -1], start: [1, 1, 2] } },
          { kind: 'explore', body: '<p>When a beat is split in two, count “1 & 2 &”: the numbers land on the beats, the “&”s exactly halfway between.</p>', defs: [['Long sound', 'Lasts several beats — you keep counting while holding it.'], ['Half beat', 'Two sounds in the time of one beat: “1 &”.'], ['Rest', 'A measured silence — you still count through it.']], w: { type: 'rhythmBuilder', beats: 4, values: [1, 2, 0.5, -1], start: [0.5, 0.5, 1, 2] } },
          { kind: 'guided', body: '<p>Tap the patterns. Press “Hear it first” to listen before you try.</p>', quiz: { gens: [{ type: 'tapRhythm', params: { level: 'long' }, n: 2 }, { type: 'tapRhythm', params: { level: 'eighths' }, n: 1 }, { type: 'rhythmListen', params: { level: 'long' }, n: 1 }], count: 4, shuffle: false } },
          { kind: 'check', body: '<p>Tap without hearing the pattern first.</p>', quiz: { gens: [{ type: 'tapRhythm', params: { level: 'long' }, n: 2 }, { type: 'tapRhythm', params: { level: 'eighths' }, n: 1 }, { type: 'rhythmListen', params: { level: 'long' }, n: 2 }], count: 5, shuffle: false } },
          { kind: 'recap', recap: ['Sounds can last 1, 2 or 4 beats — you count while holding.', 'A beat can split into two halves: “1 &”.', 'Rests are silences you still count.', 'The app checks when each sound <em>starts</em>; it cannot tell how long you hold a tap.'], clue: { text: 'Walk = 1, stri-ide = 2, run-ning = ½ + ½.', limits: 'Words help you feel lengths, but a steady beat underneath is what really keeps rhythm accurate — keep the metronome in your head.' }, review: 'Clap “walk walk stri-ide” and “run-ning run-ning walk walk” to a steady beat.', real: 'On middle C, play the patterns from this lesson with the metronome at 70, holding the long notes for their full length.' },
        ],
      },
    ],
  });
})(window.MC = window.MC || {});
