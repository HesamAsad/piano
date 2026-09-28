/* Piece library. Traditional/public-domain melodies (simplified for beginners where noted)
   and original exercises written for this workbook. Voice syntax: see theory.parseVoice. */
(function (MC) {
  'use strict';
  const P = (MC.pieces = {});
  const add = (id, o) => { P[id] = Object.assign({ id, key: 'C', time: [4, 4], tempo: 80 }, o); };

  add('hot-cross-buns', {
    title: 'Hot Cross Buns', short: 'Hot Cross Buns', composer: 'Traditional (English)', level: 1, tempo: 84,
    note: 'Three notes, moving by steps: E – D – C. Measure 3 uses eighth notes (two per beat).',
    staves: [{ clef: 'treble', voice: 'E4q/3 D4q/2 C4h/1 | E4q/3 D4q/2 C4h/1 | C4e/1 C4e C4e C4e D4e/2 D4e D4e D4e | E4q/3 D4q/2 C4h/1' }],
  });
  add('mary', {
    title: 'Mary Had a Little Lamb', short: 'Mary', composer: 'Traditional (American, 1830s)', level: 1, tempo: 88,
    note: 'Right hand in C position. Mostly steps, with one skip up to G (finger 5).',
    staves: [{ clef: 'treble', voice: 'E4q/3 D4q/2 C4q/1 D4q/2 | E4q/3 E4q E4h | D4q/2 D4q D4h | E4q/3 G4q/5 G4h | E4q/3 D4q/2 C4q/1 D4q/2 | E4q/3 E4q E4q E4q | D4q/2 D4q E4q/3 D4q/2 | C4w/1' }],
  });
  add('au-clair', {
    title: 'Au clair de la lune', short: 'Au clair', composer: 'Traditional (French)', level: 1, tempo: 84,
    note: 'Two identical phrases. Look for the repeated pattern — you only need to learn four measures.',
    staves: [{ clef: 'treble', voice: 'C4q/1 C4q C4q D4q/2 | E4h/3 D4h/2 | C4q/1 E4q/3 D4q/2 D4q | C4w/1 | C4q/1 C4q C4q D4q/2 | E4h/3 D4h/2 | C4q/1 E4q/3 D4q/2 D4q | C4w/1' }],
  });
  add('ode-to-joy', {
    title: 'Ode to Joy (theme)', short: 'Ode to Joy', composer: 'Ludwig van Beethoven (1824), simplified', level: 2, tempo: 88,
    note: 'Simplified rhythm: in measures 4 and 8 the original has a dotted rhythm; here every note is a quarter or half note.',
    staves: [{ clef: 'treble', voice: 'E4q/3 E4q F4q/4 G4q/5 | G4q/5 F4q/4 E4q/3 D4q/2 | C4q/1 C4q D4q/2 E4q/3 | E4q/3 D4q/2 D4h | E4q/3 E4q F4q/4 G4q/5 | G4q/5 F4q/4 E4q/3 D4q/2 | C4q/1 C4q D4q/2 E4q/3 | D4q/2 C4q/1 C4h' }],
  });
  add('lightly-row', {
    title: 'Lightly Row', short: 'Lightly Row', composer: 'Traditional (German: “Hänschen klein”)', level: 2, tempo: 88,
    note: 'Starts with finger 5 on G. The last measure leaps from G down to C — use the thumb.',
    staves: [{ clef: 'treble', voice: 'G4q/5 E4q/3 E4h | F4q/4 D4q/2 D4h | C4q/1 D4q/2 E4q/3 F4q/4 | G4q/5 G4q G4h | G4q/5 E4q/3 E4h | F4q/4 D4q/2 D4h | C4q/1 E4q/3 G4q/5 G4q | C4w/1' }],
  });
  add('low-bells', {
    title: 'Low Bells', short: 'Low Bells', composer: 'Original exercise', level: 1, tempo: 80,
    note: 'Left hand in C position: little finger (5) on the C below middle C, thumb (1) on G.',
    staves: [{ clef: 'bass', hand: 'lh', voice: 'C3q/5 D3q/4 E3h/3 | E3q/3 D3q/4 C3h/5 | E3q/3 F3q/2 G3h/1 | G3q/1 F3q/2 E3q/3 D3q/4 | C3w/5' }],
  });
  add('hot-cross-buns-lh', {
    title: 'Hot Cross Buns (left hand)', short: 'Hot Cross Buns LH', composer: 'Traditional (English)', level: 1, tempo: 80,
    note: 'The same tune, an octave lower, in bass clef. Left-hand fingers: E = 3, D = 4, C = 5.',
    staves: [{ clef: 'bass', hand: 'lh', voice: 'E3q/3 D3q/4 C3h/5 | E3q/3 D3q/4 C3h/5 | C3e/5 C3e C3e C3e D3e/4 D3e D3e D3e | E3q/3 D3q/4 C3h/5' }],
  });
  add('bass-walk', {
    title: 'Bass Walk', short: 'Bass Walk', composer: 'Original exercise', level: 2, tempo: 76,
    note: 'Left hand, C position, with skips. Read each skip as line-to-line or space-to-space.',
    staves: [{ clef: 'bass', hand: 'lh', voice: 'C3q/5 E3q/3 G3h/1 | F3q/2 E3q/3 D3h/4 | E3q/3 G3q/1 F3q/2 D3q/4 | C3w/5' }],
  });
  add('echo-hands', {
    title: 'Echo Hands', short: 'Echo Hands', composer: 'Original exercise', level: 2, tempo: 84,
    note: 'The right hand plays a phrase; the left hand answers one octave lower. Only one hand plays at a time.',
    staves: [
      { clef: 'treble', hand: 'rh', voice: 'C4q/1 D4q/2 E4h/3 | rw | E4q/3 F4q/4 G4h/5 | rw | G4q/5 F4q/4 E4q/3 D4q/2 | rw | E4q/3 D4q/2 C4h/1 | rw' },
      { clef: 'bass', hand: 'lh', voice: 'rw | C3q/5 D3q/4 E3h/3 | rw | E3q/3 F3q/2 G3h/1 | rw | G3q/1 F3q/2 E3q/3 D3q/4 | rw | E3q/3 D3q/4 C3h/5' },
    ],
  });
  add('ode-with-bass', {
    title: 'Ode to Joy with bass notes', short: 'Ode + bass', composer: 'Ludwig van Beethoven (1824), arranged', level: 3, tempo: 80,
    note: 'The left hand holds one long note per measure (C or G) while the right hand plays the melody. Try each hand alone first.',
    staves: [
      { clef: 'treble', hand: 'rh', voice: 'E4q/3 E4q F4q/4 G4q/5 | G4q/5 F4q/4 E4q/3 D4q/2 | C4q/1 C4q D4q/2 E4q/3 | E4q/3 D4q/2 D4h | E4q/3 E4q F4q/4 G4q/5 | G4q/5 F4q/4 E4q/3 D4q/2 | C4q/1 C4q D4q/2 E4q/3 | D4q/2 C4q/1 C4h' },
      { clef: 'bass', hand: 'lh', voice: 'C3w/5 | G3w/1 | C3w/5 | G3w/1 | C3w/5 | G3w/1 | C3w/5 | G3h/1 C3h/5' },
    ],
  });
  add('au-clair-bass', {
    title: 'Au clair de la lune with bass notes', short: 'Au clair + bass', composer: 'Traditional (French), arranged', level: 3, tempo: 76,
    note: 'Left hand plays C or G underneath. In measures 3 and 7 it changes halfway through.',
    staves: [
      { clef: 'treble', hand: 'rh', voice: 'C4q/1 C4q C4q D4q/2 | E4h/3 D4h/2 | C4q/1 E4q/3 D4q/2 D4q | C4w/1 | C4q/1 C4q C4q D4q/2 | E4h/3 D4h/2 | C4q/1 E4q/3 D4q/2 D4q | C4w/1' },
      { clef: 'bass', hand: 'lh', voice: 'C3w/5 | G3w/1 | C3h/5 G3h/1 | C3w/5 | C3w/5 | G3w/1 | C3h/5 G3h/1 | C3w/5' },
    ],
  });
  add('waltz-in-c', {
    title: 'Little Waltz in C', short: 'Waltz', composer: 'Original exercise', level: 3, tempo: 96, time: [3, 4],
    note: '3/4 time: count 1-2-3. The left hand holds a dotted half note (3 beats) in every measure.',
    staves: [
      { clef: 'treble', hand: 'rh', voice: 'C4q/1 E4q/3 G4q/5 | G4h./5 | F4q/4 E4q/3 D4q/2 | E4h./3 | C4q/1 E4q/3 G4q/5 | F4q/4 E4q/3 D4q/2 | E4q/3 D4q/2 D4q | C4h./1' },
      { clef: 'bass', hand: 'lh', voice: 'C3h./5 | E3h./3 | G3h./1 | C3h./5 | C3h./5 | G3h./1 | G3h./1 | C3h./5' },
    ],
  });
  add('c-major-scale', {
    title: 'C major scale (right hand)', short: 'C scale', composer: 'Technique', level: 2, tempo: 72,
    note: 'Going up, the thumb passes under after finger 3 (on F). Coming down, finger 3 crosses over the thumb onto E.',
    staves: [{ clef: 'treble', voice: 'C4q/1 D4q/2 E4q/3 F4q/1 | G4q/2 A4q/3 B4q/4 C5q/5 | C5q/5 B4q/4 A4q/3 G4q/2 | F4q/1 E4q/3 D4q/2 C4q/1' }],
  });
  add('g-major-melody', {
    title: 'Morning in G', short: 'Morning in G', composer: 'Original exercise', level: 3, key: 'G', tempo: 80,
    note: 'Key of G major: the sharp in the key signature means every F is F♯. Hand position: thumb on D, finger 3 on F♯.',
    staves: [{ clef: 'treble', voice: 'G4q/4 F#4q/3 E4q/2 D4q/1 | E4q/2 F#4q/3 G4h/4 | A4q/5 G4q/4 F#4q/3 E4q/2 | F#4q/3 E4q/2 D4h/1 | D4q/1 E4q/2 F#4q/3 G4q/4 | A4q/5 A4q G4h/4 | F#4q/3 E4q/2 F#4q/3 A4q/5 | G4w/4' }],
  });
  add('f-major-song', {
    title: 'Song in F', short: 'Song in F', composer: 'Traditional (French) + original second half', level: 3, key: 'F', tempo: 80,
    note: 'Key of F major: the flat in the key signature means every B is B♭ (finger 4). Thumb on F.',
    staves: [{ clef: 'treble', voice: 'F4q/1 F4q F4q G4q/2 | A4h/3 G4h/2 | F4q/1 A4q/3 G4q/2 G4q | F4w/1 | A4q/3 Bb4q/4 C5q/5 A4q/3 | Bb4q/4 A4q/3 G4h/2 | A4q/3 G4q/2 F4q/1 G4q/2 | F4w/1' }],
  });
  add('chord-garden', {
    title: 'Chord Garden (blocked chords)', short: 'Chord Garden (blocked)', composer: 'Original exercise', level: 4, tempo: 72,
    note: 'Left hand plays three-note chords — C, F, G — held for the whole measure. The chord shapes are arranged so your hand hardly moves.',
    staves: [
      { clef: 'treble', hand: 'rh', voice: 'E4q/3 G4q/5 E4q/3 C4q/1 | F4q/4 E4q/3 F4h/4 | D4q/2 G4q/5 F4q/4 D4q/2 | E4h/3 C4h/1 | E4q/3 G4q/5 E4q/3 C4q/1 | F4q/4 E4q/3 F4h/4 | D4q/2 E4q/3 F4q/4 D4q/2 | C4w/1' },
      { clef: 'bass', hand: 'lh', voice: '[C3,E3,G3]w/5,3,1 | [C3,F3,A3]w/5,2,1 | [B2,D3,G3]w/5,3,1 | [C3,E3,G3]w/5,3,1 | [C3,E3,G3]w/5,3,1 | [C3,F3,A3]w/5,2,1 | [B2,D3,G3]w/5,3,1 | [C3,E3,G3]w/5,3,1' },
    ],
  });
  add('chord-garden-broken', {
    title: 'Chord Garden (broken chords)', short: 'Chord Garden (broken)', composer: 'Original exercise', level: 4, tempo: 72,
    note: 'The same chords, played one note at a time: bottom – middle – top – middle.',
    staves: [
      { clef: 'treble', hand: 'rh', voice: 'E4q/3 G4q/5 E4q/3 C4q/1 | F4q/4 E4q/3 F4h/4 | D4q/2 G4q/5 F4q/4 D4q/2 | E4h/3 C4h/1 | E4q/3 G4q/5 E4q/3 C4q/1 | F4q/4 E4q/3 F4h/4 | D4q/2 E4q/3 F4q/4 D4q/2 | C4w/1' },
      { clef: 'bass', hand: 'lh', voice: 'C3q/5 E3q/3 G3q/1 E3q/3 | C3q/5 F3q/2 A3q/1 F3q/2 | B2q/5 D3q/3 G3q/1 D3q/3 | C3q/5 E3q/3 G3h/1 | C3q/5 E3q/3 G3q/1 E3q/3 | C3q/5 F3q/2 A3q/1 F3q/2 | B2q/5 D3q/3 G3q/1 D3q/3 | [C3,E3,G3]w/5,3,1' },
    ],
  });
  add('evening-song', {
    title: 'Evening Song', short: 'Evening Song', composer: 'Original exercise', level: 4, tempo: 76,
    note: 'Soft and smooth, growing louder in measure 3; the second part is detached (staccato) and fades away. Measures 1–4 repeat.',
    staves: [
      { clef: 'treble', hand: 'rh', voice: '|: (C4q/1@p D4q/2 E4q/3 F4q/4) | (G4h/5 E4h/3) | < (F4q/4 E4q/3 D4q/2 E4q/3) | G4h/5 ! G4h :| E4q*/3@mf E4q* F4q*/4 G4q*/5 | > (G4q/5 F4q/4 E4q/3 D4q/2) ! | C4w/1@p' },
      { clef: 'bass', hand: 'lh', voice: '|: C3w/5 | C3w/5 | G3w/1 | G3w/1 :| C3w/5 | G3w/1 | C3w/5' },
    ],
  });
})(window.MC = window.MC || {});
