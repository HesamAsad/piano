/* Teaching cues adapted from the user-supplied Middle C Piano Course tutorial.
   Data is shared by lesson coaching and the searchable study guide. */
(function (MC) {
  'use strict';
  const G = MC.study = { topics: [
    { id: 'keyboard', title: 'Meet the keyboard', desc: 'Find your way with patterns, letters and octaves.' },
    { id: 'hands', title: 'Your hands', desc: 'Comfortable posture, finger numbers and first positions.' },
    { id: 'rhythm', title: 'Feel the rhythm', desc: 'A steady pulse, note lengths and counted silences.' },
    { id: 'reading', title: 'Read the notes', desc: 'Use landmarks, then follow steps, skips and leaps.' },
    { id: 'songs', title: 'Play your first music', desc: 'Listen, practise a small section, then put it together.' },
    { id: 'scales', title: 'Sharps, flats & scales', desc: 'Small distances explain scales and key signatures.' },
    { id: 'expression', title: 'Chords & expression', desc: 'Support a melody and give the music shape.' },
  ], cards: [] };
  const add = (topic, lesson, title, remember, why, task, question, answer) => G.cards.push({ topic, lesson, title, remember, why, task, question, answer });

  add('keyboard', 'm1-pattern', 'Black-key landmarks',
    'Two black keys: chopsticks. Three black keys: a fork.',
    'The groups of two and three repeat across the keyboard. Find the group before looking for a letter.',
    'Turn labels off. Point to a group of two, then a group of three, in three different places.',
    'Does a higher group of two have a different pattern?',
    'No. Its position is higher, but the arrangement of neighbouring keys stays the same.');
  add('keyboard', 'm2-cde', 'D is the dog in the doghouse',
    'D lives between the two black keys. C is the doorstep on the left.',
    'C, D and E surround each pair of black keys: left, middle, right.',
    'Find D without labels. Play its white-key neighbours: C on the left, E on the right. Repeat at another pair.',
    'Where is E in relation to the doghouse?',
    'Immediately to the right of the two black keys.');
  add('keyboard', 'm2-fgab', 'The alphabet loops',
    'After G comes A. Music forgets H.',
    'Around the three black keys, F is the front door and B the back door. G and A sit inside.',
    'Say C–D–E–F–G–A–B–C while moving right. Come back saying the letters in reverse.',
    'Which white key is immediately left of C?',
    'B. Going down, the letters run backwards: C, B, A, G…');
  add('keyboard', 'm2-middle-c', 'Numbers change at C',
    'B3 → C4 → D4. Middle C is C4.',
    'An octave connects a note to the next note with the same letter. Count eight letter positions including both ends.',
    'Play C3, C4 and C5. Listen for the shared character of the three Cs, then find the B just below C4.',
    'Why is that B called B3 rather than B4?',
    'The octave number changes at C. B3 is the last white key before the next numbered octave starts at C4.');
  add('hands', 'm3-fingers', 'Thumbs up for number one',
    'Both hands: thumb 1, index 2, middle 3, ring 4, little finger 5.',
    'The numbering starts at the thumb on each hand. It does not reverse just because a hand faces the other way.',
    'Hold up both thumbs, then touch thumb to finger 2, 3, 4 and 5 on each hand. Say the numbers aloud.',
    'What number is your left ring finger?',
    '4, just like your right ring finger.');
  add('hands', 'm3-posture', 'Hold a bubble',
    'A rounded hand, a free wrist, relaxed shoulders.',
    'Sit toward the front of the bench with supported feet and forearms roughly level with the keys. Keep a natural curve; the thumb contacts the key on its side.',
    'Let your arms hang, then bring your hands to the keys without stiffening them. Play five gentle notes and release any tension.',
    'Should your thumb copy the fingertip angle of the other fingers?',
    'No. Its shape is different: use the side of the thumb comfortably, with no forced bend or stretch.');
  add('hands', 'm3-positions', 'One finger, one key — for this pattern',
    'C position: RH 1–2–3–4–5; LH 5–4–3–2–1.',
    'Both hands cover C–D–E–F–G. In this exercise, the right hand starts at C4 and the left at C3. Other music may use different positions.',
    'Choose C position. Find the right thumb’s C4 and the left little finger’s C3. Play each hand separately.',
    'Which finger plays G3 in left-hand C position?',
    'The left thumb, finger 1. Finger numbers belong to fingers, not permanently to notes.');
  add('rhythm', 'm4-pulse', 'Music has a heartbeat',
    'The pulse keeps going even when a note stops.',
    'Tempo is the speed of the pulse. At 60 beats per minute, one beat lasts one second.',
    'Set the metronome to 70 BPM. Listen for four clicks, then tap eight steady beats. Listen again before changing the speed.',
    'Does a rest make the metronome pause?',
    'No. Keep the pulse moving through the silence.');
  add('rhythm', 'm4-counting', 'Give the beat a home',
    'ONE–two–three–four. Or ONE–two–three.',
    'A little emphasis on beat one helps you hear where each group begins.',
    'Switch the metronome between groups of four and three. Count aloud and make only the first tap a little stronger.',
    'In a group of three, what follows beat three?',
    'Beat one of the next group. Keep the space between clicks even.');
  add('rhythm', 'm6-values', 'Read the shape, then count',
    'Hollow with no stem: 4. Hollow with a stem: 2. Filled with a stem: 1. One flag: ½.',
    'These beat values use a quarter-note beat. One whole note equals two halves, four quarters or eight eighths. Whole rests hang; half rests sit like hats.',
    'Build a half note followed by two quarters. Count “1–2, 3, 4”; keep holding through beat two. Then replace the half note with a half rest.',
    'How many eighth notes have the same length as a half note?',
    'Four: ½ + ½ + ½ + ½ = 2 quarter-note beats. A whole-measure rest fills the bar, including a 3/4 bar.');
  add('rhythm', 'm6-measures', 'A dot adds half again',
    'Dotted half: 2 + 1 = 3. Dotted quarter: 1 + ½ = 1½.',
    'In 3/4 or 4/4, the top number counts quarter-note beats per measure. The bottom 4 tells you that the quarter note gets one beat.',
    'Fill a 3/4 measure with a dotted half note. Count all three beats aloud before starting the next measure.',
    'Does a dot always add one beat?',
    'No. It adds half of that note’s own value: one beat for a half note, half a beat for a quarter.');
  add('rhythm', 'm6-eighths', 'The “&” lives between beats',
    'Say “1 & 2 & 3 & 4 &” evenly.',
    'A beam joins eighth notes without changing their lengths. The numbers land on the pulse; each “&” falls halfway between.',
    'Tap a steady pulse with one hand. Say two syllables per tap: a number, then “&”. Try the eighth-note measure in Hot Cross Buns.',
    'Do two beamed eighth notes last two beats?',
    'They last one quarter-note beat together: ½ + ½ = 1.');
  add('reading', 'm5-treble', 'There is a FACE in the space',
    'Treble spaces: F–A–C–E. Lines: E–G–B–D–F, bottom to top.',
    '“Every Good Bird Does Fly” names the lines. First recognise landmarks: G4 on line 2, middle C below, and F5 on the top line.',
    'Find G4 in the explorer, then move to the neighbouring space above and below. Name each note before playing it.',
    'Which space is immediately above the G4 line?',
    'A4, the second space. A line-to-neighbouring-space move is one letter step.');
  add('reading', 'm5-bass', 'All Cows Eat Grass',
    'Bass spaces: A–C–E–G. Lines: G–B–D–F–A, bottom to top.',
    '“Good Birds Don’t Fly Away” names the lines. The bass-clef dots surround F3 on line 4. The treble mnemonic does not apply here.',
    'Find F3 between the dots. Move down to E3, then up from F3 to G3. Use the landmark before naming other notes.',
    'Is the bottom line of both clefs called E?',
    'No. Treble starts with E4; bass starts with G2. Always identify the clef first.');
  add('reading', 'm5-grand', 'Middle C is the bridge',
    'One ledger line below treble; one ledger line above bass.',
    'These are two ways to write the same C4 key. The clef tells the pitch; it does not force a particular hand to play it.',
    'Play B3, C4 and D4 in the grand-staff explorer. Watch how the notes cross between the two staves.',
    'Are the two written middle Cs an octave apart?',
    'No. They are the very same pitch and the same piano key.');
  add('reading', 'm8-intervals', 'Read the distance',
    'Next line or space: step. Line to next line: skip.',
    'Count both endpoints: C–D is a 2nd, C–D–E a 3rd, C–D–E–F–G a 5th. A line-to-space move can also be a larger leap, so check the distance.',
    'Play C–D, C–E and C–G. Look at each pair on the staff and say “step”, “skip”, or “leap”.',
    'Does every line-to-line move mean a 3rd?',
    'No. Neighbouring lines make a 3rd; farther-apart lines can make a 5th or larger odd-numbered interval.');
  add('songs', 'm7-right-hand', 'Listen → look → play',
    'Learn the shape before chasing speed.',
    'Hear a phrase, locate its first note, then follow its repeated notes, steps and skips. Fingering depends on the tune and arrangement.',
    'Listen to Mary Had a Little Lamb. Use guidance for its first two measures, then hide the next-key light. Hide note names when comfortable.',
    'What should you do if one measure keeps going wrong?',
    'Isolate that measure, slow it down, and work out the notes and fingering before reconnecting it to the phrase.');
  add('songs', 'm7-two-hands', 'Separate, then together',
    'Practise one hand while the app plays the other.',
    'Vertical alignment in the score shows which notes start together. A held note can continue while the other hand moves.',
    'Choose one short passage. Play right hand with “Hear the other hand”, then left hand. Combine them at a comfortable tempo.',
    'Must both hands always play a new note on every beat?',
    'No. They can move independently, hold notes, or rest. Follow each staff while keeping one shared pulse.');
  add('songs', 'm12-pieces', 'Small loops, steady progress',
    'Two good measures are useful practice.',
    'Listen → scan the score → hands separately → together slowly → add the beat. Keep the same fingering as you get faster.',
    'Select two difficult measures. Practise them slowly, then add the measure before them so the join becomes comfortable too.',
    'When is it time to increase the tempo?',
    'When the notes, rhythm and movement feel secure at the current speed. Increase it a little and listen again.');
  add('scales', 'm8-half-whole', 'The kissing keys',
    'E–F and B–C have no black key between them.',
    'A half step goes to the very next key, black or white. A whole step travels two half steps.',
    'Compare E–F with C–D. Touch every key on the way, including black keys, and count the half steps.',
    'Can a half step be white key to white key?',
    'Yes: E–F and B–C are the two neighbouring-white-key half steps.');
  add('scales', 'm8-accidentals', 'Sharp up, flat down',
    'A sharp pokes up; a flat tyre goes down.',
    '♯ raises a letter by a half step; ♭ lowers it. A natural restores the unaltered letter. The destination is not always a black key: E♯ sounds on F.',
    'Find C, then move one key right to C♯. Find D and move one key left to D♭. Compare the destinations.',
    'Do C♯ and D♭ use different keys on this piano?',
    'No. They share a piano key but use different written names. The spelling depends on the musical context.');
  add('scales', 'm9-major-scale', 'Two wholes and a half',
    'W–W–H · W–W–W–H.',
    'Every major scale uses this distance pattern. Its seven different notes use each letter once; the eighth repeats the first letter.',
    'Say the pattern as you play C major. Pause at E–F and B–C to notice the two half steps.',
    'Why does G major use F♯ rather than G♭?',
    'It needs one of each letter: G A B C D E F♯ G. G♭ would repeat the letter G and leave out F.');
  add('scales', 'm9-keys', 'Read the signature once; remember it everywhere',
    'G major: F♯. F major: B♭. C major: no sharps or flats.',
    'A signature applies to each octave until a new signature replaces it. A written accidental can override it for that note in the measure.',
    'Find each F in the G-major melody before playing. Then find each B in the F-major song.',
    'Does a G-major signature change only the F on the top line?',
    'No. All Fs become F♯, in every octave, unless an accidental says otherwise.');
  add('scales', 'm9-keys', 'Read more key signatures',
    'Sharps: Father Charles Goes Down And Ends Battle.',
    'The order is F C G D A E B. Flats reverse it: B E A D G C F. For a major key, go one half step above the last sharp, or name the second-to-last flat. One flat is F major; no signs is C major.',
    'Work out two sharps (F♯, C♯), then three flats (B♭, E♭, A♭). Use the major-key rule before revealing the answer.',
    'Which major keys have two sharps and three flats?',
    'D major and E♭ major. A signature can also belong to a relative minor key; this shortcut names the major key, not the only possible key.');
  add('expression', 'm10-triads', 'A snowman made of notes',
    'Root, third, fifth: play one, skip one, play one, skip one, play one.',
    'A root-position triad stacks neighbouring lines or neighbouring spaces. Major uses 4 then 3 half steps; minor uses 3 then 4.',
    'Build C major (C–E–G), then C minor (C–E♭–G). Keep the outside notes and listen to the changed third.',
    'Does “lower the middle note” work for every inversion?',
    'Lower the chord’s third. It is the middle note in root position, but an inversion can put it at the top or bottom.');
  add('expression', 'm10-progressions', 'Numbers travel with the key',
    'I–V–vi–IV in C = C–G–Am–F.',
    'Roman numerals name chords by their scale degree. Uppercase marks major, lowercase minor; the small circle in vii° means diminished.',
    'Listen to both progressions in the explorer. Count four beats per chord, then play the bass roots while the app plays the right hand.',
    'What does vi mean in C major?',
    'A minor: A is scale degree six, and A–C–E is a minor triad.');
  add('expression', 'm10-accompany', 'One chord, two textures',
    'Blocked = together. Broken = one note after another.',
    'An inversion rearranges a chord’s notes so your hand can move less between chords.',
    'Compare the two versions of Chord Garden. Follow C–E–G, C–F–A and B–D–G in the left hand.',
    'Is C–F–A a C chord because C is lowest?',
    'No. Its letters are F–A–C: an F-major chord with C in the bass. The lowest note and the root can differ.');
  add('expression', 'm11-dynamics', 'Soft to strong, one step at a time',
    'pp → p → mp → mf → f → ff.',
    'Piano means soft; forte means loud; mezzo means moderately. A crescendo gets louder, not faster. Staccato is a light, short release; legato connects notes smoothly.',
    'Listen to the same phrase with different markings. Keep the tempo fixed so you can hear changes in loudness and touch.',
    'What is the difference between a dot beside a note and a dot above it?',
    'A dot beside it adds half its value. A staccato dot above or below it asks for a short, detached sound.');
  add('expression', 'm11-phrasing', 'Tie it; do not strike it twice',
    'Tie: one sound held across two written notes.',
    'A tie links the same pitch and adds the values. A slur shapes a connected group of notes. A fermata asks you to hold beyond the written duration.',
    'Listen to the tie and slur examples. Count the tied E for four beats without imagining a second key press.',
    'A half note tied to a half note lasts how long with a quarter-note beat?',
    'Four beats, played once. Keep counting through the tie.');

  G.forLesson = (id) => G.cards.filter((c) => c.lesson === id);
  G.chords = [
    { numeral: 'I', name: 'C', root: 'C3', notes: ['C4', 'E4', 'G4'], quality: 'major' },
    { numeral: 'ii', name: 'Dm', root: 'D3', notes: ['D4', 'F4', 'A4'], quality: 'minor' },
    { numeral: 'iii', name: 'Em', root: 'E3', notes: ['E4', 'G4', 'B4'], quality: 'minor' },
    { numeral: 'IV', name: 'F', root: 'F3', notes: ['F4', 'A4', 'C5'], quality: 'major' },
    { numeral: 'V', name: 'G', root: 'G3', notes: ['G4', 'B4', 'D5'], quality: 'major' },
    { numeral: 'vi', name: 'Am', root: 'A3', notes: ['A4', 'C5', 'E5'], quality: 'minor' },
    { numeral: 'vii°', name: 'Bdim', root: 'B3', notes: ['B4', 'D5', 'F5'], quality: 'diminished' },
  ];
  G.progressions = [
    { id: 'home', name: 'I–IV–V–I', degrees: [0, 3, 4, 0] },
    { id: 'pop', name: 'I–V–vi–IV', degrees: [0, 4, 5, 3] },
  ];
  G.progressionPiece = (id, broken) => {
    const progression = G.progressions.find((p) => p.id === id) || G.progressions[0];
    const chords = progression.degrees.map((d) => G.chords[d]);
    return { id: 'progression-' + progression.id + (broken ? '-broken' : ''), title: progression.name + ' in C major', key: 'C', time: [4, 4], tempo: 72,
      staves: [
        { clef: 'treble', hand: 'rh', voice: chords.map((c) => broken ? [0, 1, 2, 1].map((i) => c.notes[i] + 'q').join(' ') : '[' + c.notes.join(',') + ']w').join(' | ') },
        { clef: 'bass', hand: 'lh', voice: chords.map((c) => c.root + 'w').join(' | ') },
      ] };
  };
})(window.MC = window.MC || {});
