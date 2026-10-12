/* Practice companion for the user-supplied First Step ABC study. */
(function (MC) {
  'use strict';
  const U = MC.util, { h } = U, A = MC.audio;
  MC.InterstellarGuide = function (opts) {
    const root = h('section.panel.interstellar-guide#interstellar-guide', { 'aria-labelledby': 'interstellar-guide-title' });
    let transport = null, bpm = 60, pattern = 'drill', hear = 'both';
    const cells = [], labels = ['1', '&', '2', '&', '3', '&'];
    const out = h('p.small.muted', { role: 'status', 'aria-live': 'polite' }, 'Start away from the keys. Count evenly and tap lightly.');
    const play = U.btn('▶ Hear & follow', () => {
      stop(); opts.onBeforePlay(); A.ensure();
      const events = Array.from({ length: 24 }, (_, i) => {
        const cell = i % 6, midis = [], durations = [];
        if (hear !== 'lh') { midis.push(cell % 2 ? 71 : 76); durations.push(0.45); }
        if (hear !== 'rh' && (pattern === 'drill' ? cell % 2 === 0 : cell === 0)) {
          midis.push(57); durations.push(pattern === 'drill' ? 0.9 : 3);
        }
        return { t: i / 2, d: 0.5, midis, durations, vel: 0.5, cell };
      });
      transport = new A.Transport({ bpm, events, end: 12,
        onEvent: (e) => cells.forEach((col, i) => col.forEach((el) => el.classList.toggle('is-current', i === e.cell))),
        onEnd: () => { clear(); play.disabled = false; out.textContent = 'Four bars complete. Keep counting and try the pattern yourself.'; },
      });
      transport.play(); play.disabled = true;
      out.textContent = A.canHear() ? 'Follow four bars, then repeat the pattern yourself.' : 'Sound is off: follow the highlighted counts, or turn sound on at the top.';
    }, 'btn-primary');
    function clear() { cells.flat().forEach((el) => el.classList.remove('is-current')); }
    function stop() { if (transport) { transport.stop(true); transport = null; } clear(); play.disabled = false; }
    const grid = h('table.coordination-grid');
    const explanation = h('p');
    const chant = h('p.coordination-chant');
    const draw = () => {
      stop(); U.clear(grid); cells.length = 0;
      const head = h('tr', null, h('th', { scope: 'col' }, 'Count'));
      labels.forEach((label, i) => { const th = h('th', { scope: 'col' }, label); cells[i] = [th]; head.append(th); });
      const rh = h('tr', null, h('th', { scope: 'row' }, 'Right'));
      const lh = h('tr', null, h('th', { scope: 'row' }, 'Left'));
      labels.forEach((_, i) => {
        const r = h('td', null, 'Tap');
        const l = h('td', null, pattern === 'drill' ? (i % 2 ? '—' : 'Tap') : (i === 0 ? 'Play' : 'Hold'));
        cells[i].push(r, l); rh.append(r); lh.append(l);
      });
      grid.append(h('caption', null, pattern === 'drill' ? 'Preparation: two right-hand taps for each left-hand tap' : 'Score pattern, bars 11–18: six right-hand notes over one held bass note'), h('thead', null, head), h('tbody', null, rh, lh));
      explanation.textContent = pattern === 'drill' ? 'Both hands tap on 1, 2 and 3; only the right taps on each “&”. This is a coordination exercise. In the score’s ostinato, the left hand holds its note for the whole bar.' : 'Start both hands on beat 1. Keep the left key down through all six counts while the right alternates E5 with B4, C5 or D5. Re-strike the bass at the next barline, as written.';
      chant.textContent = pattern === 'drill' ? '“Together — Right — Together — Right — Together — Right”' : '“Together — Right — Right — Right — Right — Right”';
      out.textContent = 'Count “1 & 2 & 3 &”. Four bars play when you press Hear & follow.';
    };
    const range = (label, from, to) => U.btn(label, () => { stop(); opts.onRange(from, to); }, 'btn-small');
    const step = (n, title, ...body) => h('section.independence-step', null,
      h('div.independence-step-head', null, h('span', null, String(n).padStart(2, '0')), h('h3', null, title)), ...body);
    root.append(h('div.eyebrow', null, 'Interstellar · Practice companion'),
      h('h2#interstellar-guide-title', null, 'One pulse. Two independent hands.'),
      h('p', null, 'Learn the timing first, then add notes, balance and comfortable movement. Start at a pace where the counts stay even.'),
      h('div.callout.callout-plain', null, h('p', null, 'This study follows the corrected ABC: A minor, 3/4, 96 BPM, 30 written measures. Bars 11–18 and 27–30 each repeat once, giving 42 performed bars. With an eighth-note unit, A6 lasts three quarter-note beats. The supplied prose describes longer phrases; those extra bars are not in this ABC.'),
        h('p.small', null, 'The introduction’s bass-staff E is E4 in standard ABC pitch notation. Clef choice does not move a note down an octave. The closing dyads repeat once, as written; this is not a verified full transcription of the video.'),
        h('div.row', null, h('a', { href: 'scores/interstellar-first-step.abc', download: 'interstellar-first-step.abc' }, 'Download the supplied ABC'),
          h('a', { href: 'https://www.youtube.com/watch?v=OQeUvNHR0Ac', target: '_blank', rel: 'noopener' }, 'Open the video reference ↗'))),
      step(1, 'Lock the rhythmic grid',
        h('p', null, 'Tap on your knees or a closed piano lid. First practise two taps against one; then switch to the score’s held-bass pattern.'),
        U.segmented([{ value: 'drill', label: '2-against-1 drill' }, { value: 'score', label: 'Held bass · score pattern' }], pattern, (v) => { pattern = v; draw(); }, 'Coordination pattern'),
        h('div.coordination-table', null, grid), explanation, chant,
        h('div.toolbar', null, U.slider('Tempo', 40, 96, 2, bpm, (v) => { bpm = v; if (transport) transport.setBpm(v); }, (v) => `${v} BPM`)),
        h('div.toolbar', null, h('span.small.muted', null, 'Listen to:'), U.segmented([{ value: 'both', label: 'Both hands' }, { value: 'rh', label: 'Right only' }, { value: 'lh', label: 'Left only' }], hear, (v) => { hear = v; stop(); }, 'Drill listening focus')),
        h('div.row', null, play, U.btn('■ Stop', stop), range('Practise ostinato · bars 11–18', 11, 18)), out),
      h('div.independence-grid', null,
        step(2, 'Ghost one hand',
          h('p', null, 'Let one hand sound while the other rehearses its movement silently. This helps you notice whether the timing changes when one part becomes quiet.'),
          h('ol', null,
            h('li', null, 'Play the right-hand pattern gently. Tap the left-hand rhythm on your knee or on the key surface without pressing it down.'),
            h('li', null, 'Swap: sound the left-hand pulse while the right taps its eighth-note pattern silently.'),
            h('li', null, 'For the written ostinato, practise one left-hand press per bar and hold it while the right hand continues.')),
          h('p.small.muted', null, 'A digital key may still sound under a slow press. Tapping the surface is enough. The listening controls above mute the demo; they do not mute a connected instrument.')),
        step(3, 'Separate the dynamic levels',
          h('p', null, 'Try a quiet left hand (pp) under a clear right-hand melody (mf). Keep the beat and finger heights small as the melody changes.'),
          h('p', null, 'Practise the repeated E4 pulse under the opening melody. Listen for the left hand getting louder when the right enters, then repeat with a quieter left hand. Avoid pushing or dropping forcefully into the keys.'),
          h('p.small.muted', null, 'These dynamics are a practice suggestion. The supplied ABC has no dynamic markings. Use a touch-sensitive keyboard or piano to practise the contrast; screen and computer keys cannot measure it.'),
          range('Practise balance · bars 5–10', 5, 10)),
        step(4, 'Let the hand move comfortably',
          h('p', null, 'Try a small, easy forearm rotation as you alternate E5 and B4, rather than lifting each finger high. Think of a gentle rocking motion, not a large twist at the wrist.'),
          h('p', null, 'With the suggested fingering, E5 uses 5 and B4 uses 2; C5 uses 3 and D5 uses 4. Keep the motion especially small for neighbouring D5–E5. Fingers still work with the arm; rotation is not a fixed motion to force onto every pair.'),
          h('p.small.muted', null, 'If the movement feels tense or uncomfortable, pause and reset. Fingerings are starting points that can be adjusted for your hand.'),
          range('Start with E5–B4 · bars 11–12', 11, 12)),
        step(5, 'Put the parts back together',
          h('ol', null, h('li', null, 'Use guidance with one hand and “Hear the other hand”.'), h('li', null, 'Combine two measures at a comfortable tempo.'), h('li', null, 'Count through the long notes. Increase speed only while the pulse and balance stay steady.')),
          h('p', null, 'The root bass under E5–B4 is a texture, not a complete A-minor triad. Follow the actual note names rather than filling in extra chord tones.'),
          range('Practise melody · bars 19–26', 19, 26))),
      h('section.fingering-reference', { 'aria-labelledby': 'finger-placement-title' },
        h('div.eyebrow', null, 'Suggested fingering'), h('h2#finger-placement-title', null, 'Where each finger goes'),
        h('p', null, 'Both hands use 1 = thumb, 2 = index, 3 = middle, 4 = ring, 5 = little finger. These suggestions are added for this study, not copied from the video. The numbers on the score match the hands on the keyboard.'),
        h('div.finger-placement-grid', null,
          placement('Right hand · bars 5–29', ['A4', 'B4', 'C5', 'D5', 'E5'], 'Keep this A–E position for the motif and ostinato: E–B = 5–2; E–C = 5–3; E–D = 5–4.'),
          placement('Left hand · bars 1–10', ['E4', 'D4', 'C4', 'B3', 'A3'], 'Only the thumb plays the repeated E4. The other keys show a relaxed starting position, not extra notes to play.'),
          placement('Left hand · bars 11–26', ['E4', 'D4', 'C4', 'B3', 'A3'], 'Keep the A3–E4 position. Bass roots: A3 = 5, C4 = 3, D4 = 2, E4 = 1. Hold each for three beats, then re-strike at the barline; the ABC has no ties.'),
          placement('Left hand · bars 27–30', ['C3', 'A2', 'G2', 'F2', 'E2'], 'Move down before bar 27. A suggested wider shape: C3 = 1, G2 = 3, A2 = 2, E2 = 5. Move the hand between notes if the span is uncomfortable; do not hold a stretch.')),
        h('div.callout', null, h('p', null, 'Closing right-hand dyads: [C5 + E5] = 3 + 5; [B4 + D5] = 2 + 4; [A4 + C5] = 1 + 3. Before bar 30, shift the hand one white key left: [G4 + B4] = 1 + 3. Shift back to A–E when the repeat returns to bar 27.'), range('Practise dyads · bars 27–30', 27, 30)),
        h('p.small.muted', null, 'Choose “Hands on the keys” in the player to show or hide the placement diagrams. The app checks pitches and timing; it cannot identify which physical finger you use.')));
    function placement(title, notes, text) {
      return h('div.finger-placement', null, h('h3', null, title),
        h('ol', { 'aria-label': title + ', thumb through little finger' }, notes.map((n, i) => h('li', null, h('span.finger-badge', null, String(i + 1)), h('strong', null, n)))), h('p.small', null, text));
    }
    draw(); U.onCleanup(stop);
    return { el: root, stop };
  };
})(window.MC = window.MC || {});
