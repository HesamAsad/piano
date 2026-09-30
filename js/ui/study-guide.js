/* Shared teaching cards and a searchable reference, using the course's existing lessons. */
(function (MC) {
  'use strict';
  const U = MC.util, { h } = U, W = MC.widgets;
  const G = MC.study;
  const lessonLink = (card) => {
    const lesson = MC.course.lessons[card.lesson];
    const step = Math.max(0, lesson.steps.findIndex((s) => s.kind === 'explore'));
    return `#/lesson/${lesson.id}/${step}`;
  };
  const recall = (card) => h('div.study-recall', null,
    h('h4', null, 'Pause & recall'), h('p', null, card.question),
    U.details('Reveal answer', h('p', null, card.answer)));
  const tryCard = (card) => h('div.study-try', null,
    h('h4', null, 'Try it now'), h('p', null, card.task));

  W.lessonCoach = function (id, kind) {
    const cards = G.forLesson(id);
    if (!cards.length) return null;
    if (kind === 'see') return h('aside.study-memory', { 'aria-label': 'Memory clue' },
      h('div.eyebrow', null, 'Remember'), h('p', null, cards[0].remember));
    if (kind !== 'explore') return null;
    return h('section.lesson-coach', { 'aria-label': 'Tips and a quick recall' }, cards.map((card, i) =>
      i ? U.details(card.title, h('div', null, h('p', null, card.remember), h('p', null, card.why), tryCard(card), recall(card)))
        : h('div', null, h('div.eyebrow', null, 'Make it stick'), h('h3', null, card.title),
          h('p', null, card.why), tryCard(card), recall(card))),
      h('a.link-arrow.small', { href: '#/guide/' + cards[0].topic }, 'More tips on this topic →'));
  };

  W.studyGuide = function (topicId) {
    const topic = G.topics.find((t) => t.id === topicId);
    const root = h('div.study-guide');
    const input = h('input#study-search', { type: 'search', placeholder: 'Try “middle C”, “rests” or “chords”…', autocomplete: 'off' });
    const count = h('p.small.muted.study-count', { role: 'status', 'aria-live': 'polite' });
    const body = h('div.study-results');
    const render = () => {
      const terms = input.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
      const cards = G.cards.filter((c) => (!topic || c.topic === topic.id) && terms.every((t) =>
        [c.title, c.remember, c.why, c.task, c.question, c.answer, MC.course.lessons[c.lesson].title].join(' ').toLocaleLowerCase().includes(t)));
      U.clear(body);
      count.textContent = `${cards.length} ${cards.length === 1 ? 'tip' : 'tips'}${topic ? ' · ' + topic.title : ' across 7 topics'}`;
      if (!cards.length) {
        body.append(h('div.panel', null, h('h2', null, 'No matching tips'), h('p', null, 'Try fewer words or choose All topics.'),
          U.btn('Clear search', () => { input.value = ''; render(); input.focus(); }, 'btn-small')));
        return;
      }
      G.topics.forEach((t) => {
        const group = cards.filter((c) => c.topic === t.id);
        if (!group.length) return;
        body.append(h('section.study-section', { 'aria-labelledby': 'study-' + t.id },
          h('div.study-section-head', null, h('span.study-topic-number', null, String(G.topics.indexOf(t) + 1).padStart(2, '0')),
            h('div', null, h('h2#study-' + t.id, null, t.title), h('p.muted.small', null, t.desc))),
          h('div.study-grid', null, group.map((card) => h('article.study-card', { 'data-lesson': card.lesson },
            h('h3', null, card.title), h('p.study-memory-line', null, card.remember),
            h('p.small', null, card.why),
            U.details('Try it & check yourself', h('div', null, tryCard(card), recall(card))),
            h('a.link-arrow.small', { href: lessonLink(card) }, 'Explore in the lesson →'))))));
      });
    };
    input.addEventListener('input', render);
    root.append(h('nav.study-topics', { 'aria-label': 'Study guide topics' },
      h('a', { href: '#/guide', 'aria-current': !topic ? 'page' : null }, 'All topics'),
      G.topics.map((t) => h('a', { href: '#/guide/' + t.id, 'aria-current': topic === t ? 'page' : null }, t.title))),
      h('div.study-search', null, h('label', { for: 'study-search' }, 'Find a tip'), input), count, body);
    render();
    return root;
  };

  W.progressions = function (o) {
    const root = h('div.widget.progression-explorer');
    const host = h('div');
    const roadmap = h('ol.chord-roadmap', { 'aria-label': 'One chord per measure' });
    let selected = o && o.progression || 'home', broken = false, player = null;
    const render = () => {
      if (player) player.destroy();
      U.clear(host); U.clear(roadmap);
      const progression = G.progressions.find((p) => p.id === selected);
      progression.degrees.forEach((d, i) => {
        const chord = G.chords[d];
        roadmap.append(h('li', null, h('span.small.muted', null, 'Bar ' + (i + 1)), h('strong', null, chord.numeral), h('span', null, chord.name), h('span.small.muted', null, '4 beats')));
      });
      player = MC.PiecePlayer(G.progressionPiece(selected, broken), { modes: ['watch', 'guided', 'independent'], mode: 'watch', names: true, showInfo: false });
      host.append(player.el);
    };
    root.append(
      h('div.toolbar', null, U.segmented(G.progressions.map((p) => ({ value: p.id, label: p.name })), selected, (v) => { selected = v; render(); }, 'Chord progression')),
      h('div.toolbar', null, U.segmented([{ value: false, label: 'Blocked chords' }, { value: true, label: 'Broken chords' }], broken, (v) => { broken = v; render(); }, 'Accompaniment texture')),
      h('p.small.muted', null, 'C major · one chord every four beats. Listen first, then choose guidance and practise one hand at a time.'), roadmap, host);
    render();
    U.onCleanup(() => player.destroy());
    return root;
  };
})(window.MC = window.MC || {});
