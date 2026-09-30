/* Piece library: traditional melodies, original exercises, and credited score excerpts.
   Voice syntax: see theory.parseVoice. */
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
  add('the-night-king', {
    title: 'The Night King — opening excerpt', short: 'The Night King',
    composer: 'Ramin Djawadi', arranger: 'Liam Hinzman', level: 5,
    excerpt: true,
    keyLabel: 'A minor', tempo: 60, tempoChanges: [{ measure: 13, bpm: 115 }],
    doubleBars: [12, 40],
    extendedRange: true,
    note: 'Opening excerpt, measures 1–58. The tempo rises to 115 BPM at measure 13. Play three quarter-note triplets in two beats. Rolled chords sound from low to high; fermatas are shown, while playback keeps a steady practice pulse.',
    sections: [
      { label: 'Opening', from: 1, to: 12 },
      { label: 'Theme', from: 13, to: 26 },
      { label: 'Octave melody', from: 27, to: 40 },
      { label: 'Triplets', from: 41, to: 58 },
    ],
    staves: [
      {
        clef: 'treble', hand: 'rh',
        annotations: [1, 2, 3, 4, 5, 7, 9, 11, 12].map((measure) => ({ measure, fermata: true, arpeggio: [5, 7, 9, 11].includes(measure) })),
        voice: [
          // 1–12: quiet opening. No fingering is supplied in the source.
          'A4h@pp re A4e C5e C5e', 'A4w',
          '[A4,A5]h re [A4,A5]e [C5,C6]e [C5,C6]e', '[A4,A5]w',
          '[E5,A5,E6]h re A4e C5e C5e', '[D5,A5,D6]w',
          '[C5,A5,C6]h re A4e C5e C5e', '[A4,E5]w',
          '[E5,A5,E6]h re A4e C5e C5e', '[D5,A5,D6]w',
          '[C5,A5,C6]h re F5e A5e A5e', '[B4,E5]w',
          // 13–26: single-note melody.
          'rm', 'rm', 're C5q@p C5e~ C5h', 'C5e B4e~ B4h.~',
          'B4w', 're C5q C5e~ C5h', 'C5e A4e~ A4h.~', 'A4w',
          're A4q A4e~ A4h', 'A4e F4e~ F4h.~', 'F4w',
          're F4q F4e~ F4h', 'E4w~', 'E4w',
          // 27–40: melody in octaves.
          're [C5,C6]q [C5,C6]e~ [C5,C6]h', '[C5,C6]e [B4,B5]e~ [B4,B5]h.~',
          '[B4,B5]w', 're [C5,C6]q [C5,C6]e~ [C5,C6]h',
          '[C5,C6]e [A4,A5]e~ [A4,A5]h.~', '[A4,A5]w',
          're [A4,A5]q [A4,A5]e~ [A4,A5]h', '[A4,A5]e [F4,F5]e~ [F4,F5]h.~',
          '[F4,F5]w', 're [F4,F5]q [F4,F5]e~ [F4,F5]h',
          '[F4,F5]e [E4,E5]e~ [E4,E5]h.~', '[E4,E5]w', 'rm', 'rh [D4,D5]h',
          // 41–58: quarter-note triplets and low bass octaves.
          '[E4,A4,E5]w@mp', 'A3qt C4qt C4qt A3h',
          'A3w', 'A3qt C4qt C4qt A3h', 'A3w', 'A3qt C4qt C4qt A3h',
          'A3w', 'A3qt C4qt C4qt B3h', 'A3w', 'A3qt C4qt C4qt A3h',
          'A3w', 'A3qt C4qt C4qt B3h', 'A3w', 'A3qt C4qt C4qt A3h',
          'A3w', 'A3qt C4qt C4qt B3h', 'A3q E4e A4e~ A4h~', 'A4w',
        ].join(' | '),
      },
      {
        clef: 'treble', hand: 'lh', clefChanges: { 13: 'bass' },
        annotations: [7, 9, 11, 12].map((measure) => ({ measure, fermata: true })),
        voice: [
          'rm', 'rm', 'rm', 'rm', 'rm', 'E4w@pp', 'D4w', 'E4w', 'A4w', 'E4w', 'D4w', '[E4,G#4]w',
          'A3w@p', 'A3q E4h.', 'A3w', 'A3w', 'A3q E4h.', 'A3w',
          'E3w', 'E3q [B3,E4]h.', 'E3w', 'C3w', 'C3q [A3,C4]h.', 'C3w',
          'A2w', 'A2q [E3,A3]h.', 'A3q E4h.', 'A3q E4h.',
          'A3q E4h.', 'A3q E4h.', 'E3q B3h.', 'E3q B3h.', 'E3q B3h.',
          'C3q A3h.', 'C3q A3h.', 'C3q A3h.',
          'Bb2q D3h.', 'Bb2q D3h.', 'Bb2q D3h.', 'Bb2q D3h.',
          '[A2,E3,A3]w@mp', '[A2,E3]w',
          '[G#1,G#2]w~', '[G#1,G#2]w', '[F#1,F#2]w~', '[F#1,F#2]w',
          '[G#1,G#2]w~', '[G#1,G#2]w', '[A1,A2]w~', '[A1,A2]w',
          '[G#1,G#2]w~', '[G#1,G#2]w', '[F#1,F#2]w~', '[F#1,F#2]w',
          '[G#1,G#2]w~', '[G#1,G#2]w', '[A1,A2]h A2h', 'A2h A2h',
        ].join(' | '),
      },
    ],
  });
  add('interstellar', {
    title: 'Interstellar Theme — Easy Piano', short: 'Interstellar Theme',
    composer: 'Hans Zimmer', arranger: 'Matteo248', level: 5,
    keyLabel: 'A minor', time: [3, 4], tempo: 90, extendedRange: true,
    caesuras: [37],
    note: 'The complete 51-measure arrangement from the supplied score. Start slowly with each hand separately. In measures 35–37, hold the upper E while repeating the lower E. The faster passage begins at measure 38; the written pause at measure 37 keeps its measured length in playback.',
    sections: [
      { label: 'Opening', from: 1, to: 10 },
      { label: 'Melody', from: 11, to: 26 },
      { label: 'Arpeggios', from: 27, to: 37 },
      { label: 'Finale', from: 38, to: 51 },
    ],
    staves: [
      { clef: 'treble', hand: 'rh', voice: [
        // 1–10: alternating eighth notes.
        'E4e C4e E4e C4e E4e C4e', 'E4e C4e E4e C4e E4e C4e',
        'E4e C4e E4e C4e E4e C4e', 'E4e C4e E4e C4e E4e C4e',
        'E4e D4e E4e D4e E4e D4e', 'E4e D4e E4e D4e E4e D4e',
        'E4e C4e E4e D4e E4e D4e', 'E4e D4e E4e C4e E4e D4e',
        'E4e D4e E4e D4e E4e D4e', 'E4e D4e E4e D4e E4e D4e',
        // 11–18: the melody over repeated left-hand intervals.
        'A4q E5h', 'A4q E5h', 'B4q E5h', 'B4q E5h',
        'C5q E5h', 'C5q E5h', 'D5q E5h', 'D5q E5q B4q',
        // 19–26: three-note accompaniment.
        'A4q E5q A4q', 'A4q E5q A4q', 'B4q E5q B4q', 'B4q E5q B4q',
        'C5q E5q C5q', 'C5q E5q C5q', 'D5q E5q D5q', 'D5q E5q B4q',
        // 27–34: the same melodic shape over broken chords.
        'A4q E5q A4q', 'A4q E5q A4q', 'B4q E5q B4q', 'B4q E5q B4q',
        'C5q E5q C5q', 'C5q E5q C5q', 'D5q E5q D5q', 'D5q E5q B4q',
        // 35–37: only the upper note is tied; eight lower Es are separate attacks.
        '[E4,E5]q~[E5] [E4,E5]q~[E5] [E4,E5]q~[E5]',
        '[E4,E5]q~[E5] [E4,E5]q~[E5] [E4,E5]q~[E5]',
        '[E4,E5]q~[E5] [E4,E5]q rq',
        // 38–49: twelve sixteenths per bar, grouped in quarter-note beats.
        'C5s A4s E4s C5s A4s E4s C5s A4s E4s C5s A4s E4s',
        'C5s A4s E4s C5s A4s E4s C5s A4s E4s D5s A4s E4s',
        'C5s A4s E4s C5s A4s E4s C5s A4s E4s C5s A4s E4s',
        'C5s A4s E4s C5s A4s E4s C5s A4s E4s F5s C5s A4s',
        'F5s C5s A4s F5s C5s A4s F5s C5s A4s G5s C5s A4s',
        'G5s C5s A4s G5s C5s A4s G5s C5s A4s B5s G5s E5s',
        'B5s G5s E5s B5s G5s E5s B5s G5s E5s B5s G5s E5s',
        'B5s G5s E5s B5s G5s E5s B5s G5s E5s C6s A5s E5s',
        'C6s A5s E5s C6s A5s E5s C6s A5s E5s C6s A5s E5s',
        'C6s A5s E5s C6s A5s E5s C6s A5s E5s D6s B5s E5s',
        'D6s B5s E5s D6s B5s E5s D6s B5s E5s D6s B5s E5s',
        'D6s B5s E5s D6s B5s E5s [E5,E6]q.~',
        '[E5,E6]h.~', '[E5,E6]h.',
      ].join(' | ') },
      { clef: 'bass', hand: 'lh', voice: [
        'rm', 'rm', 'rm', '[A2,A3]h.', '[B2,B3]h.~', '[B2,B3]h.',
        '[A2,A3]q [B2,B3]q [C3,C4]q', '[B2,B3]q [A2,A3]q [B2,B3]q', '[C3,C4]h.', '[B2,B3]h.',
        '[F2,A2]q [F2,A2]q [F2,A2]q', '[F2,A2]q [F2,A2]q [F2,A2]q',
        '[G2,D3]q [G2,D3]q [G2,D3]q', '[G2,D3]q [G2,D3]q [G2,D3]q',
        '[A2,E3]q [A2,E3]q [A2,E3]q', '[A2,E3]q [A2,E3]q [A2,E3]q',
        '[G2,D3]q [G2,D3]q [G2,D3]q', '[G2,D3]q [G2,D3]q [G2,D3]q',
        '[F2,C3,F3]q [F2,C3,F3]q [F2,C3,F3]q', '[F2,C3,F3]q [F2,C3,F3]q [F2,C3,F3]q',
        '[G2,D3,G3]q [G2,D3,G3]q [G2,D3,G3]q', '[G2,D3,G3]q [G2,D3,G3]q [G2,D3,G3]q',
        '[A2,E3,A3]q [A2,E3,A3]q [A2,E3,A3]q', '[A2,E3,A3]q [A2,E3,A3]q [A2,E3,A3]q',
        '[G2,D3,G3]q [G2,D3,G3]q [G2,D3,G3]q', '[G2,D3,G3]q [G2,D3,G3]q [G2,D3,G3]q',
        'F2e C3e F3e C3e F2e C3e', 'F2e C3e F3e C3e F2e C3e',
        'G2e D3e G3e D3e G2e D3e', 'G2e D3e G3e D3e G2e D3e',
        'A2e E3e A3e E3e A2e E3e', 'A2e E3e A3e E3e A2e E3e',
        'G2e D3e G3e D3e G2e D3e', 'G2e D3e G3e D3e G2e D3e',
        '[E2,E3]h.~', '[E2,E3]h.~', '[E2,E3]h.',
        '[A2,E3,A3]h.~', '[A2,E3,A3]h rs [G2,D3,G3]e.~',
        '[G2,D3,G3]h.~', '[G2,D3,G3]h rs [F2,C3,F3]e.~',
        '[F2,C3,F3]h.~', '[F2,C3,F3]h rs [G2,D3,G3]e.~',
        '[G2,D3,G3]h.~', '[G2,D3,G3]h rs [A2,E3,A3]e.~',
        '[A2,E3,A3]h.~', '[A2,E3,A3]h rs [G2,D3,G3]e.~',
        '[G2,D3,G3]h.~', '[G2,D3,G3]q. [E2,E3]q.~', '[E2,E3]h.~', '[E2,E3]h.',
      ].join(' | ') },
    ],
  });
  add('begonvil', {
    title: 'Begonvil – Benim Yerime de Sev', short: 'Begonvil',
    composer: 'Sezen Aksu', level: 5, key: 'G#m', tempo: 90,
    extendedRange: true, chromatic: true, daCapo: true,
    note: 'All 46 written measures from the three supplied pages. Full playback follows D.C. back to the beginning once; selected sections play once. “Both” practises the piano hands; “Vocal melody” lets you learn the singing line on piano. Pedal clears at barlines, and arrows show the direction of rolled chords.',
    sections: [
      { label: 'Piano introduction', from: 1, to: 8 },
      { label: 'Vocal entry', from: 9, to: 18 },
      { label: 'Middle phrase', from: 19, to: 25 },
      { label: 'Closing phrase', from: 26, to: 32 },
      { label: 'Refrain', from: 31, to: 38 },
      { label: 'Refrain with piano melody', from: 39, to: 46 },
    ],
    staves: [
      { clef: 'treble', hand: 'vocal', group: 'vocal', label: 'Vocal', voice: [
        // 1–9: the piano introduction precedes the vocal pickup in measure 10.
        'rm@f', 'rm', 'rm', 'rm', 'rm', 'rm', 'rm', 'rm', 'rm',
        're re re re re re rs B4e C#5s',
        'D#5q B4e G#4e G#4e G#4q G#4e',
        'C#5h rq rs C#5e D#5s', 'E5q C#5e B4e B4q C#5e B4e',
        'A#4h rq rs C#5e D#5s', 'E5h E5q D#5e D#5e',
        // 16–25: syncopated phrases, with ties across barlines.
        'F#5q E5q rq E5e E5s F#5s', 'F#5q. F#5e A#5e G#5q F#5e',
        'D#5w', 'D#5q E5e. D#5s E5e. D#5s F#5e D#5e~',
        'D#5e B5q A#5e G#5h', 're G#5q F#5s E5s D#5q C#5e C#5e~',
        'C#5e F#5e E5h.', 're C#5q D#5s E5s D#5e C#5e B4e A#4e',
        're B4s C#5s C#5e D#5e D#5e C#5s B4s A#4e G#4e~',
        'G#4q A#4e B4e C#5q E5q',
        // 26–32: B-sharp is written explicitly, rather than respelled as C.
        'D#5q rq B#4e. C#5s~ C#5e D#5e',
        'E5q E5s E5e. D#5e C#5s B4s A#4e B4e',
        'C#5e D#5e D#5s D#5e. C#5s C#5e. B4s A#4e.',
        'rq A#4s A#4e. C#5q D#5e B4s C#5s',
        'C#5e A#4e G#4q rh', 're G#5e A#5e G#5e B5e A#5e G#5e F#5e', 'E5w',
        // 33–46: third page, ending with the written D.C. instruction.
        're F#5e G#5e F#5e A#5e F#5e G#5e E5e', 'D#5w',
        're G#4e A#4e B4e C#5e D#5e G#5e F#5e',
        'E5q E5e D#5e C#5q C#5e B4e',
        'A#4q. G#4e A#4e G#4e Fx4e G#4e', 'B4q A#4q G#4q rq',
        're G#5e A#5e G#5e B5e A#5e G#5e F#5e', 'E5w',
        're F#5e G#5e F#5e A#5e F#5e G#5e E5e', 'D#5w',
        're G#4e A#4e B4e C#5e D#5e G#5e F#5e',
        'E5q E5e D#5e C#5q C#5e B4e',
        'A#4q. G#4e A#4e G#4e Fx4e G#4e', 'B4q A#4q G#4q rq',
      ].join(' | ') },
      { clef: 'treble', hand: 'rh', group: 'piano', pedal: 'bar',
        annotations: [
          { measure: 18, event: 2, arpeggio: 'up' },
          { measure: 20, event: 3, arpeggio: 'down' },
          { measure: 23, event: 1, arpeggio: 'down' },
          { measure: 24, event: 1, arpeggio: 'down' },
          { measure: 25, arpeggio: 'down' },
          { measure: 31, arpeggio: 'up' },
        ],
        voice: [
          're@p [B4,G#5]e [C#5,A#5]e [B4,G#5]e [D#5,B5]e [C#5,A#5]e [B4,G#5]e [A#4,F#5]e',
          '[G#4,E5]w',
          're [A#4,F#5]e [B4,G#5]e [A#4,F#5]e [C#5,A#5]e [A#4,F#5]e [B4,G#5]e [G#4,E5]e',
          '[F#4,D#5]h [C#5,A#5]h',
          're [B4,G#5]e [C#5,A#5]e [D#5,B5]e [E5,C#6]e [F#5,D#6]e [B5,G#6]e [A#5,F#6]e',
          '[G#5,E6]q [G#5,E6]e [F#5,D#6]e [E5,C#6]q [E5,C#6]e [D#5,B5]e',
          '[C#5,A#5]q. [B4,G#5]e [C#5,A#5]e [B4,G#5]e [A#4,Fx5]e [B4,G#5]e',
          '[D#5,B5]q [C#5,A#5]h rq',
          '[A#3,B3,D#4]q [A#3,B3,D#4]q [A#3,B3,D#4]q [A#3,B3,D#4]q',
          '[A#3,B3,D#4]q [A#3,B3,D#4]q [A#3,B3,D#4]q [A#3,B3,D#4]q',
          '[A#3,B3,D#4]q [A#3,B3,D#4]q [A#3,B3,D#4]q [A#3,B3,D#4]q',
          '[B3,C#4,E4]q [B3,C#4,E4]q [Gn3,B3,C#4,E4]q [G3,B3,C#4,E4]q',
          '[B3,C#4,E4]q [B3,C#4,E4]q [B3,C#4,E4]q [B3,C#4,E4]q',
          '[A#3,C#4,F#4]q [A#3,C#4,F#4]q [A#3,C#4,F#4]q [A#3,C#4,F#4]q',
          '[B3,C#4,E4]q [B3,C#4,E4]q [B3,C#4,E4]q [B3,C#4,E4]q',
          '[A#3,C#4,F#4]q [A#3,C#4,F#4]q [A#3,C#4,F#4]q [A#3,C#4,F#4]q',
          '[B3,E4,G#4]q [B3,E4,G#4]q [A#3,Dn4,F#4,A#4]q [A#3,Dn4,F#4,A#4]q',
          '[B3,D#4,F#4]q [B3,D#4,F#4]q [G#4,Bn4,C#5,F#5]q~[G#4,B4,C#5] [G#4,B4,C#5,E5]q',
          '[G#4,B4,D#5]w',
          '[D#5,B5]q. [C#5,A#5]e [B4,G#5]q. [C#5,D#5,F#5,An5,C#6]e',
          'rh re C#5e D#5e F#5e', 'E5h [G#4,B4,C#5,E5]h',
          'rh [G#4,B4,C#5,E5]h', 'rh [F#4,G#4,B4,D#5]h',
          '[A#3,C#4,E4,G#4]h [E4,F#4,G#4,Bn4]q E5q',
          'rh [C#5,E5]e G#4s [D#5,F#5]e G#4s [E5,G#5]e',
          '[C#5,E5]q [B4,C#5,E5]h rq',
          '[F#4,G#4,B4,D#5]h [F#4,G#4,B4,D#5]h',
          '[E4,G#4,A#4,C#5]h [D#4,E4,Gn4,A#4]h', 'rm',
          '[D#5,B5,G#6]w', '[B3,C#4,E4,G#4]q rq rh',
          '[A#3,C#4,F#4]h [Dn4,F#4,A#4]h', '[B3,D#4,F#4]q rq rh',
          '[B3,D#4]q rq rh', '[B3,C#4,E4,G#4]q rq rh',
          '[A#3,C#4,D#4,Gn4]q rq rh',
          '[D#4,E4,G#4,B4]q [C#4,D#4,Gn4,A#4]q [B3,D#4,F#4]h',
          're [B4,G#5]e [C#5,A#5]e [B4,G#5]e [D#5,B5]e [C#5,A#5]e [B4,G#5]e [A#4,F#5]e',
          '[G#4,E5]w',
          're [A#4,F#5]e [B4,G#5]e [A#4,F#5]e [C#5,A#5]q [B4,G#5]e [G#4,E5]e',
          '[F#4,D#5]h [C#5,A#5]h',
          're [B4,G#5]e [C#5,A#5]e [D#5,B5]e [E5,C#6]e [F#5,D#6]e [B5,G#6]e [A#5,F#6]e',
          '[G#5,E6]q [G#5,E6]e [F#5,D#6]e [E5,C#6]q [E5,C#6]e [D#5,B5]e',
          '[C#5,A#5]q. [B4,G#5]e [C#5,A#5]e [B4,G#5]e [A#4,Fx5]e [B4,G#5]e',
          '[D#5,E5,G#5,B5]q [C#5,D#5,Gn5,A#5]q [G#4,B4,D#5,G#5]h',
        ].join(' | '),
      },
      { clef: 'bass', hand: 'lh', group: 'piano', pedal: 'bar', initialDynamic: 'p', voice: [
        'G#2e D#3e G#3e D#3e B3e D#3e F#3e D#3e',
        'C#3e G#3e C#4e G#3e~ [G#3,E4]h',
        'F#2e C#3e F#3e C#3e A#3e C#3e F#3e C#3e',
        'B2e F#3e B3e D#4e~ [D#4,A#4]h',
        'G#2e D#3e G#3e D#3e B3e D#3e G#3e D#3e',
        'C#3e G#3e C#4e G#3e E4e G#3e C#4e G#3e',
        'D#3e A#3e D#4e A#3e Fx4e A#3e D#4e A#3e',
        'E3e B3e D#3e A#3h G#2e~',
        'G#2q rh re G#1e~', 'G#1q rq rq re G#2e~', 'G#2q rh re G#2e~',
        'G#2q rh re C#2e~', 'C#2q rq rq re F#2e~', 'F#2q rq rq re C#2e~',
        'C#2q rq rq re F#2e~', 'F#2q rq rq re F#2e~',
        'F#2q re F#2q. re B1e~', 'B1q rq D#2h', 'G#2w',
        'G#2e D#3e G#3e D#3e B3q G#3e D#3e',
        '[D#2,D#3]e A#3e C#4e E4e An4e re rq',
        'C#3e E3e G#3e C#4e rq rq', 'C#3e G#3e C#4e E4e rh',
        'B2e F#3e B3e D#4e rh', '[A#2,A#3]h [E3,B3]h',
        '[G#2,G#3]h [G#2,G#3]h', 'C#3e G#3e C#4e G#3e~ [G#3,E4]h',
        'B2e F#3e B3e F#3e~ [F#3,D#4]h', 'A#2h D#3h',
        'G#2e D#3e G#3e D#3e B3e D#4e G#4e B4e',
        '[G#2,D#3,G#3]w', 'C#3e G#3e C#4e G#3e~ [G#3,E4]h',
        'F#2e C#3e F#3e C#3e A#3e C#3e F#3e C#3e',
        'B2e F#3e B3e F#3e~ [F#3,D#4]h',
        'G#2e D#3e G#3e D#3e B3e D#3e G#3e D#3e',
        'C#3e G#3e C#4e G#3e E4e G#3e C#4e G#3e',
        'D#3e A#3e D#4e A#3e Fx4e A#3e D#4e A#3e',
        '[E2,E3]q [D#2,D#3]q [G#2,G#3]h',
        'G#2e D#3e G#3e D#3e B3e D#3e F#3e D#3e',
        'C#3e G#3e C#4e G#3e~ [G#3,E4]h',
        'F#2e C#3e F#3e C#3e A#3e C#3e F#3e C#3e',
        'B2e F#3e B3e D#4e~ [D#4,A#4]h',
        'G#2e D#3e G#3e D#3e B3e D#3e G#3e D#3e',
        'C#3e G#3e C#4e G#3e E4e G#3e C#4e G#3e',
        'D#3e A#3e D#4e A#3e Fx4e A#3e D#4e A#3e',
        '[E2,E3]q [D#2,D#3]q [G#1,G#2]h',
      ].join(' | ') },
    ],
  });
})(window.MC = window.MC || {});
