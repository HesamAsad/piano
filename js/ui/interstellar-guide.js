/* Practice companion for the supplied single-staff Interstellar score and additional passage. */
(function (MC) {
  'use strict';
  const U = MC.util, { h } = U, A = MC.audio;
  MC.InterstellarGuide = function (opts) {
    const root = h('section.panel.interstellar-guide#interstellar-guide', { 'aria-labelledby': 'interstellar-guide-title' });
    const patterns = {
      long: { label: 'Long E5 · bar 21', notes: ['A4', 'Hold', 'E5', 'Hold', 'Hold', 'Hold'], attacks: { 0: [69, 1], 2: [76, 2] }, chant: '“A — E — hold”', description: 'Play A4 on beat 1 and E5 on beat 2. Hold E5 through beat 3: the hollow note lasts two beats.' },
      quarters: { label: 'Quarter notes · bar 37', notes: ['A4', 'Hold', 'E5', 'Hold', 'A4', 'Hold'], attacks: { 0: [69, 1], 2: [76, 1], 4: [69, 1] }, chant: '“A — E — A”', description: 'Play one note on each numbered beat: A4, E5, A4. Each lasts one beat.' },
      eighths: { label: 'Eighth notes · bar 55', notes: ['C5', 'E4', 'C5', 'E4', 'C5', 'E4'], attacks: { 0: [72, 0.5], 1: [64, 0.5], 2: [72, 0.5], 3: [64, 0.5], 4: [72, 0.5], 5: [64, 0.5] }, chant: '“High — low — high — low — high — low”', description: 'Alternate C5 and E4 on every count, including each “&”. Play the two notes in turn, with three pairs per bar.' },
    };
    let transport = null, bpm = 60, pattern = 'long';
    const cells = [], labels = ['1', '&', '2', '&', '3', '&'];
    const out = h('p.small.muted', { role: 'status', 'aria-live': 'polite' });
    const play = U.btn('▶ Hear & follow', () => {
      stop(); opts.onBeforePlay(); A.ensure();
      const events = Array.from({ length: 24 }, (_, i) => {
        const cell = i % 6, note = patterns[pattern].attacks[cell];
        return { t: i / 2, d: 0.5, midis: note ? [note[0]] : [], durations: note ? [note[1]] : [], vel: 0.5, cell };
      });
      transport = new A.Transport({ bpm, events, beatsPerBar: 3, end: 12,
        onEvent: (e) => cells.forEach((col, i) => col.forEach((el) => el.classList.toggle('is-current', i === e.cell))),
        onEnd: () => { clear(); play.disabled = false; out.textContent = 'Four bars complete. Keep counting and try the pattern yourself.'; },
      });
      transport.play(); play.disabled = true;
      out.textContent = A.canHear() ? 'Follow four repetitions of this bar, then try it yourself.' : 'Sound is off: follow the highlighted counts, or turn sound on at the top.';
    }, 'btn-primary');
    function clear() { cells.flat().forEach((el) => el.classList.remove('is-current')); }
    function stop() { if (transport) { transport.stop(true); transport = null; } clear(); play.disabled = false; }
    const grid = h('table.coordination-grid'), explanation = h('p'), chant = h('p.coordination-chant');
    const draw = () => {
      stop(); U.clear(grid); cells.length = 0;
      const head = h('tr', null, h('th', { scope: 'col' }, 'Count'));
      const notes = h('tr', null, h('th', { scope: 'row' }, 'Right'));
      labels.forEach((label, i) => {
        const th = h('th', { scope: 'col' }, label), td = h('td', null, patterns[pattern].notes[i]);
        cells[i] = [th, td]; head.append(th); notes.append(td);
      });
      grid.append(h('caption', null, patterns[pattern].label + ' · count “1 & 2 & 3 &”'), h('thead', null, head), h('tbody', null, notes));
      explanation.textContent = patterns[pattern].description;
      chant.textContent = patterns[pattern].chant;
      out.textContent = 'Hear & follow repeats this example bar four times. “Hold” means keep the key down.';
    };
    const range = (label, from, to) => U.btn(label, () => { stop(); opts.onRange(from, to); }, 'btn-small');
    const step = (n, title, ...body) => h('section.independence-step', null,
      h('div.independence-step-head', null, h('span', null, String(n).padStart(2, '0')), h('h3', null, title)), ...body);
    root.append(h('div.eyebrow', null, 'Interstellar · Practice companion'),
      h('h2#interstellar-guide-title', null, 'Follow the melody, one phrase at a time.'),
      h('p', null, 'A single melody line in 3/4 at 86 BPM. Learn the long notes first, then the steady quarters and flowing eighth-note pairs.'),
      h('div.callout.callout-plain', null,
        h('p', null, 'Play the opening and sustained phrase in bars 1–11, then the additional passage in bars 12–20. The long E5 pattern follows at bar 21. The passage’s short last bar is preserved. Repeated patterns are written out; play each bar once. Timestamps are labels from the source sheet, not playback times for this reordered version.'),
        h('a', { href: 'scores/interstellar-first-step.abc', download: 'interstellar-first-step.abc' }, 'Download this score as ABC')),
      step(1, 'Hear the three rhythms',
        U.segmented(Object.entries(patterns).map(([value, p]) => ({ value, label: p.label })), pattern, (v) => { pattern = v; draw(); }, 'Melody rhythm'),
        h('div.coordination-table', null, grid), explanation, chant,
        h('div.toolbar', null, U.slider('Tempo', 40, 86, 2, bpm, (v) => { bpm = v; if (transport) transport.setBpm(v); }, (v) => `${v} BPM`)),
        h('div.row', null, play, U.btn('■ Stop', stop)), out),
      h('div.independence-grid', null,
        step(2, 'Count through the sustained phrase',
          h('p', null, 'A4 in bar 5 lasts three beats. B4 starts in bar 6 and is tied through bar 7: hold it for six beats without playing it again. Count “1 2 3, 1 2 3” under that one sound.'),
          h('p', null, 'Then play A–B–C in bar 8 and B–A–B in bar 9. C5 in bar 10 and B4 in bar 11 each last three beats.'),
          range('Practise the sustained phrase · bars 5–11', 5, 11)),
        step(3, 'Continue into the additional passage',
          h('p', null, 'After bar 11, move down to the G4–D5 position. Begin A4–B4–C5–B4–A4–C5, counting one eighth note on each “1 & 2 & 3 &”.'),
          h('p', null, 'The dots on the last notes of bars 12, 15, 17 and 19 mean staccato: release those notes lightly while keeping the same timing. Play the single staccato A4 in bar 20, then return to the A–E position for bar 21. The repeated left-hand E is omitted from this melody-only source.'),
          range('Practise the additional passage · bars 12–20', 12, 20)),
        step(4, 'Keep a quiet counting pulse',
          h('p', null, 'Optional hand-independence drill: tap beats 1, 2 and 3 lightly on your knee with the left hand while the right plays the melody. During the eighth-note pairs, both hands move on the numbers; only the right moves on the “&” counts.'),
          h('p', null, 'For ghosting, silently tap the right-hand pattern on the key surface while keeping the knee pulse. Then let the right hand sound again. This is a separate coordination exercise; the score contains one melody line.'),
          range('Practise the eighth-note pairs · bars 55–58', 55, 58)),
        step(5, 'Shape the phrase without rushing',
          h('p', null, 'Keep the same three-beat pulse when long E5 notes become quarter notes. Try one phrase softly, then a little more clearly, while keeping the timing unchanged. These dynamics are a practice suggestion.'),
          h('p', null, 'Play close to the key surface. An easy, small forearm movement can help with the wider alternating pairs; let the hand travel between notes instead of holding a tense stretch.'),
          range('Practise long E5 notes · bars 21–28', 21, 28),
          h('div', { style: { marginTop: '10px' } }, range('Practise quarter notes · bars 37–44', 37, 44))),
        step(6, 'Prepare each register change',
          h('p', null, 'Return to E4 for bars 53–54. The pairs then rise through C5–E4, D5–G4, A5–C5, B5–E5, C6–E5 and D6–E5. Every pair lasts two bars.'),
          h('p', null, 'Learn each pair slowly before joining it to the next. For D6–E5, release and move between notes if needed. Pause if the movement becomes uncomfortable.'),
          range('Practise the upper register · bars 59–66', 59, 66))),
      h('section.fingering-reference', { 'aria-labelledby': 'finger-placement-title' },
        h('div.eyebrow', null, 'Suggested right-hand fingering'), h('h2#finger-placement-title', null, 'Where each finger goes'),
        h('p', null, '1 = thumb, 2 = index, 3 = middle, 4 = ring, 5 = little finger. These fingerings are practice suggestions added to the supplied score. The printed numbers and keyboard hand agree.'),
        h('div.finger-placement-grid', null,
          placement('Opening & return · bars 1–4, 53–54', ['E4', 'F4', 'G4', 'A4', 'B4'], 'Play E4 with the thumb. The other fingers show a starting position; they do not add notes.'),
          placement('Main melody · bars 5–11 & 21–52', ['A4', 'B4', 'C5', 'D5', 'E5'], 'Use A–E from bar 5, and return to it at bar 21 after the additional passage. A = 1, B = 2, C = 3, D = 4 and high E = 5.'),
          placement('Additional passage · bars 12–18', ['G4', 'A4', 'B4', 'C5', 'D5'], 'Move to G–D after the sustained phrase: G = 1, A = 2, B = 3, C = 4 and D = 5.'),
          placement('Passage ending · bars 19–20', ['G4', 'A4', 'B4', 'D5', 'E5'], 'Use 5 for the E5 in bar 19, with a small hand movement if needed. End the passage on A4 with finger 2, then use the thumb for A4 at bar 21. D5 marks a resting position; it is not played in these two bars.')),
        h('h3', { style: { marginTop: '24px' } }, 'Alternating pairs · bars 55–66'),
        h('p', null, 'Use 5 for the upper note and 1 for the lower note. Each pair repeats three times per bar. These are successive notes; let the hand move as needed.'),
        h('div.finger-placement-grid', null, [
          ['55–56', 'C5', 'E4'], ['57–58', 'D5', 'G4'], ['59–60', 'A5', 'C5'],
          ['61–62', 'B5', 'E5'], ['63–64', 'C6', 'E5'], ['65–66', 'D6', 'E5'],
        ].map(([bars, high, low]) => h('div.finger-placement', null, h('h3', null, 'Bars ' + bars), h('p', null, `${high} (5) → ${low} (1) · three times`)))),
        h('p.small.muted', { style: { marginTop: '16px' } }, 'Choose “Hands on the keys” in the player to show or hide the placement diagram. Adjust suggested fingerings to your hand; the app checks pitches and timing.')));
    function placement(title, notes, text) {
      return h('div.finger-placement', null, h('h3', null, title),
        h('ol', { 'aria-label': title + ', thumb through little finger' }, notes.map((n, i) => h('li', null, h('span.finger-badge', null, String(i + 1)), h('strong', null, n)))), h('p.small', null, text));
    }
    draw(); U.onCleanup(stop);
    return { el: root, stop };
  };
})(window.MC = window.MC || {});
