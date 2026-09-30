/* App shell: navigation, pages (Today, Course, Lesson, Practice, Review, Pieces, Tools,
   Progress, Settings, Resources), sound controls, persistence banners. */
(function (MC) {
  'use strict';
  const { h } = MC.util;
  const U = MC.util;
  const S = MC.store;
  const A = MC.audio;
  const T = MC.theory;
  const W = MC.widgets;
  const C = MC.course;
  const btn = U.btn;
  const main = () => document.getElementById('main');
  const allLessons = () => C.modules.flatMap((m) => m.lessons);
  const moduleOf = (l) => C.modules.find((m) => m.n === l.module);
  const STEP_TITLE = { intro: 'Goal', see: 'Hear & see', explore: 'Explore', guided: 'Guided practice', check: 'Check', recap: 'Recap' };

  /* ---------- Icons (24×24 line drawings, currentColor) ---------- */
  const ICONS = {
    screen: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.6"/><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    sprout: '<path d="M12 21v-9"/><path d="M12 12C12 8 9 6 5 6c0 4 3 6 7 6z"/><path d="M12 10c0-3 2.5-5 6.5-5 0 3-2.5 5-6.5 5z"/>',
    piano: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7.5 19v-5.5M12 19v-5.5M16.5 19v-5.5"/><path d="M6.4 5h2.2v8.5H6.4zM10.9 5h2.2v8.5h-2.2zM15.4 5h2.2v8.5h-2.2z" fill="currentColor"/>',
    plug: '<path d="M9 3v5M15 3v5"/><path d="M6 8h12v3a6 6 0 0 1-12 0z"/><path d="M12 17v4"/>',
    keys: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.01M9.5 10h.01M12.5 10h.01M15.5 10h.01M18 10h.01M7.5 14h9"/>',
    chair: '<path d="M7 3v9M17 3v9M7 7.5h10M5 12h14M7 12v9M17 12v9"/>',
    review: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3.5V8h4.5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20.5V16h-4.5"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.1V16h5v-.1c0-.8.4-1.5 1.1-2.1A6 6 0 0 0 12 3z"/>',
    note: '<path d="M9 18V5.5l11-2.3v12.9"/><circle cx="6.5" cy="18" r="2.6"/><circle cx="17.5" cy="16" r="2.6"/>',
    hands: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 10.5V4.5a1.5 1.5 0 0 1 3 0v6"/><path d="M14 10.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5a6 6 0 0 1-4.6-2.2L3 15.5a1.6 1.6 0 0 1 2.4-2l2.6 2"/>',
  };
  const icon = (name, cls) => U.html(`<svg class="ico-svg${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`);

  /* ---------- Lesson status helpers ---------- */
  function status(id) {
    const l = S.peekLesson(id) || {};
    return { completed: !!l.completed, practised: (l.practised || 0) > 0, demonstrated: !!l.demonstrated, real: l.realPiano || 0, started: !!(l.visited && l.visited.length), lastStep: l.lastStep || 0, best: l.best, visited: l.visited || [] };
  }
  function chips(id) {
    const s = status(id);
    const c = (on, label, title) => h('span.chip' + (on ? '.on' : ''), { title }, h('span.dot'), label);
    return h('div.status-chips', null,
      c(s.completed, 'Completed', 'You worked through every step'),
      c(s.practised, 'Practised', 'You finished a guided practice set'),
      c(s.demonstrated, 'Demonstrated', '≥80% on the check, first tries, no hints'),
      s.real ? h('span.chip.self', { title: 'Self-reported practice on a real instrument' }, `Real piano ×${s.real}`) : null);
  }
  function statusIcon(id) {
    const s = status(id);
    const kind = s.demonstrated ? 'star' : s.completed ? 'done' : s.started ? 'half' : 'todo';
    const label = { star: 'Demonstrated', done: 'Completed', half: 'In progress', todo: 'Not started' }[kind];
    return h('span.st-icon.' + kind, { role: 'img', 'aria-label': label, title: label }, kind === 'star' ? '★' : kind === 'done' ? '✓' : '');
  }
  function nextLesson() {
    const last = S.data().last;
    if (last && C.lessons[last.lesson] && !status(last.lesson).completed) return { lesson: C.lessons[last.lesson], step: last.step || 0 };
    const l = allLessons().find((x) => !status(x.id).completed);
    return l ? { lesson: l, step: status(l.id).started ? status(l.id).lastStep : 0 } : null;
  }
  function moduleDone(n) { const m = C.modules.find((x) => x.n === n); return m && m.lessons.every((l) => status(l.id).completed); }
  const plain = (html) => html.replace(/<[^>]+>/g, '');
  const meter = (pct, label, cls) => h('div.meter' + (cls ? '.' + cls : ''), { role: 'img', 'aria-label': label }, h('span', { style: { width: Math.round(pct * 100) + '%' } }));

  /* The course in four stages — the start-to-end path shown on Home, Getting started and the course map. */
  const STAGES = [
    { n: 1, title: 'Foundations', modules: [1, 2, 3, 4], desc: 'Sound, the keyboard, finger numbers, hand positions and a steady beat.' },
    { n: 2, title: 'Reading music', modules: [5, 6], desc: 'Notes on the treble and bass staff, note values and time signatures.' },
    { n: 3, title: 'First music', modules: [7, 8], desc: 'Melodies with each hand, then both — plus steps, sharps and intervals.' },
    { n: 4, title: 'Musicianship', modules: [9, 10, 11, 12], desc: 'Scales, chords, expression, and complete pieces.' },
  ];
  const stageLessons = (st) => st.modules.flatMap((n) => C.modules.find((m) => m.n === n).lessons);
  function journey(opts) {
    const o = Object.assign({ desc: true }, opts);
    const nx = nextLesson();
    const curMod = nx ? nx.lesson.module : null;
    return h('ol.journey', { 'aria-label': 'Your path through the course' }, STAGES.map((st) => {
      const ls = stageLessons(st);
      const done = ls.filter((l) => status(l.id).completed).length;
      const state = done === ls.length ? 'done' : st.modules.includes(curMod) ? 'current' : 'todo';
      const first = ls.find((l) => !status(l.id).completed) || ls[0];
      return h('li.journey-stage.' + state, null,
        h('a.js-link', { href: `#/lesson/${first.id}/0`, 'aria-label': `Stage ${st.n}: ${st.title}. ${done} of ${ls.length} lessons completed.` },
          h('div.js-top', null, h('span.js-num', null, state === 'done' ? '✓' : String(st.n)), h('span.js-kicker', null, state === 'current' ? 'You are here' : `Stage ${st.n}`)),
          h('div.js-title', null, st.title),
          h('div.js-mods', null, `Modules ${st.modules[0]}–${st.modules[st.modules.length - 1]} · ${ls.length} lessons`),
          o.desc ? h('p.js-desc', null, st.desc) : null,
          meter(done / ls.length, `${done} of ${ls.length} lessons completed`),
          h('div.js-count', null, `${done} / ${ls.length} done`)));
    }));
  }

  /* What a lesson needs before you start — shown on its first step. */
  function needsFor(l) {
    const n = [];
    if (l.id !== 'm12-next') n.push('Sound on — speakers or headphones.');
    if (l.skills.includes('rhythm')) n.push('For tapping in time: wired headphones or speakers work best (Bluetooth adds a delay).');
    if (l.module === 3) n.push('A chair, and a piano, keyboard — or just a table — to rest your hands on.');
    if (['m7-two-hands', 'm10-accompany'].includes(l.id)) n.push('Two hands at once: mouse or touch plus computer keys, or a MIDI keyboard (Settings).');
    if (!n.length || l.module <= 2) n.push('Nothing else — mouse, touch or your computer keys all work.');
    return n;
  }
  function beforeCard(l, mod) {
    const pre = mod.prereq.map((n) => C.modules.find((x) => x.n === n));
    const soundRow = h('div.bc-sound');
    const renderSound = () => {
      U.clear(soundRow);
      const st = A.status();
      if (st === 'on') soundRow.append(h('span.pill.pill-ok', null, '● Sound is on'));
      else if (st !== 'unsupported' && l.id !== 'm12-next') soundRow.append(btn('Turn sound on', () => A.enable().then((ok) => { if (ok) { A.setMuted(false); A.play(60, 0.5, 0.6); } }), 'btn-small btn-primary'));
    };
    renderSound();
    U.onCleanup(A.on(renderSound));
    return h('div.before-card', null,
      h('div.bc-title', null, h('span.bc-ico', null, icon('hands')), 'Before you start'),
      h('div.bc-row', null, h('div.bc-label', null, 'Builds on'),
        pre.length ? h('div.bc-chips', null, pre.map((pm) => h('a.pre-chip' + (moduleDone(pm.n) ? '.done' : ''), { href: `#/lesson/${pm.lessons[0].id}/0`, title: moduleDone(pm.n) ? 'Completed' : 'Not completed yet — you can still continue' }, moduleDone(pm.n) ? '✓ ' : '', `Module ${pm.n} · ${pm.title}`)))
          : h('div', null, 'Nothing — this is a starting point.')),
      h('div.bc-row', null, h('div.bc-label', null, 'You’ll need'), h('ul.bc-needs', null, needsFor(l).map((t) => h('li', null, t)))),
      soundRow);
  }

  /* ---------- Top bar ---------- */
  const NAV = [['today', 'Home'], ['course', 'Course'], ['practice', 'Practice'], ['review', 'Review'], ['pieces', 'Pieces'], ['tools', 'Tools']];
  const MORE = [['guide', 'Tips & study guide'], ['progress', 'Progress'], ['start', 'Getting started'], ['settings', 'Settings'], ['resources', 'Resources & credits']];
  function topbar() {
    const moreMenu = h('div.more-menu#more-menu', { role: 'menu' }, MORE.map(([k, t]) => h('a', { href: '#/' + k, 'data-k': k, role: 'menuitem' }, t)));
    const moreBtn = h('button.more-btn', { type: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-controls': 'more-menu' }, 'More', h('span.caret', { 'aria-hidden': 'true' }));
    const more = h('div.more', null, moreBtn, moreMenu);
    const setMore = (open) => { more.classList.toggle('open', open); moreBtn.setAttribute('aria-expanded', String(open)); };
    moreBtn.addEventListener('click', (e) => { e.stopPropagation(); setMore(!more.classList.contains('open')); });
    document.addEventListener('click', (e) => { if (!more.contains(e.target)) setMore(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && more.classList.contains('open')) { setMore(false); moreBtn.focus(); } });
    const nav = h('nav.nav#nav', { 'aria-label': 'Main' }, NAV.map(([k, t]) => h('a', { href: '#/' + k, 'data-k': k }, t, k === 'review' ? h('span.nav-badge', { hidden: true }) : null)), more);
    const menu = btn('Menu', () => nav.classList.toggle('open'), 'btn-small menu-btn', { 'aria-controls': 'nav', 'aria-expanded': 'false' });
    const soundBtn = h('button.btn.btn-small.sound-btn', { type: 'button' });
    const vol = h('input.vol', { type: 'range', min: 0, max: 100, value: Math.round((S.setting('volume') || 0.8) * 100), 'aria-label': 'Volume', oninput: (e) => { A.setVolume(e.target.value / 100); S.setSetting('volume', e.target.value / 100); } });
    const renderSound = () => {
      const st = A.status();
      soundBtn.dataset.state = st;
      const src = A.source && A.source();
      soundBtn.textContent = { off: 'Turn sound on', blocked: 'Resume sound', on: src === 'loading' ? 'Loading piano…' : 'Sound on', muted: 'Muted', unsupported: 'No sound' }[st];
      soundBtn.title = src === 'loading' ? 'Loading the piano samples' : '';
      soundBtn.setAttribute('aria-label', { off: 'Turn sound on', blocked: 'Sound is paused by the browser; click to resume', on: 'Sound on; click to mute', muted: 'Muted; click to unmute', unsupported: 'Sound not supported' }[st]);
    };
    soundBtn.addEventListener('click', () => {
      const st = A.status();
      if (st === 'on') A.setMuted(true);
      else if (st === 'muted') A.setMuted(false);
      else A.enable().then((ok) => { if (ok) { A.setMuted(false); A.play(60, 0.5, 0.6); } else U.toast('The browser did not allow sound. Try clicking again.', 'bad'); });
    });
    A.on(renderSound);
    renderSound();
    const brand = h('a.brand', { href: '#/today', 'aria-label': 'Middle C — home' }, U.html('<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="9" fill="#17161d"/><rect x="6" y="7" width="6" height="18" rx="1.6" fill="#fff"/><rect x="13" y="7" width="6" height="18" rx="1.6" fill="#fff"/><rect x="20" y="7" width="6" height="18" rx="1.6" fill="#fff"/><rect x="10" y="7" width="4.4" height="10.5" rx="1.2" fill="#3347d1"/><rect x="17.8" y="7" width="4.4" height="10.5" rx="1.2" fill="#17161d"/></svg>'), h('span.brand-text', null, h('span.brand-name', null, 'Middle C'), h('span.brand-sub', null, 'Piano & reading workbook')));
    menu.addEventListener('click', () => menu.setAttribute('aria-expanded', String(nav.classList.contains('open'))));
    return h('header.topbar', null, h('div.topbar-inner', null, brand, nav, h('div.sound-ctl', null, soundBtn, vol, menu)));
  }
  function updateNav(page) {
    const cur = page === 'lesson' ? 'course' : page;
    document.querySelectorAll('.nav a[data-k]').forEach((x) => x.setAttribute('aria-current', x.dataset.k === cur ? 'page' : 'false'));
    const more = document.querySelector('.more');
    if (more) { more.classList.remove('open'); more.classList.toggle('is-current', MORE.some(([k]) => k === cur)); const b = more.querySelector('.more-btn'); if (b) b.setAttribute('aria-expanded', 'false'); }
    const badge = document.querySelector('.nav-badge');
    if (badge) { const n = S.dueItems().length; badge.hidden = !n; badge.textContent = n > 99 ? '99+' : String(n); badge.setAttribute('aria-label', `${n} due`); }
  }

  /* ---------- Router ---------- */
  function route() {
    U.cleanup();
    A.stopAll();
    MC.input.releaseAll();
    const hash = location.hash.replace(/^#\/?/, '');
    const [page, a, b] = hash.split('/');
    updateNav(page);
    const nav = document.getElementById('nav');
    if (nav) nav.classList.remove('open');
    const m = main();
    U.clear(m);
    m.className = 'page-' + (page || 'none');
    const pages = { today: pageToday, start: pageStart, course: pageCourse, guide: () => pageGuide(a), lesson: () => pageLesson(a, +b || 0), practice: () => pagePractice(a), review: pageReview, pieces: () => pagePieces(a), tools: pageTools, progress: pageProgress, settings: pageSettings, resources: pageResources };
    const fn = pages[page];
    if (!fn) {
      location.replace(S.isNew() && !S.setting('onboarded') ? '#/start' : '#/today');
      return;
    }
    try { fn(); } catch (e) { console.error(e); m.appendChild(h('div.banner', null, 'Something went wrong on this page: ' + e.message)); }
    if (!hash.startsWith('lesson') || !b) window.scrollTo(0, 0);
    m.focus({ preventScroll: true });
  }

  /* ---------- Getting started: prerequisites, setup, and the path ---------- */
  const STARTS = [
    { value: 'm1-high-low', title: 'I’m brand new', d: 'Never played, can’t read music. Start with sound and the keyboard.', where: 'Module 1 · High and low sounds', rec: true },
    { value: 'm3-fingers', title: 'I know where the notes are', d: 'You can find C, D, E… on a keyboard. Start with fingers and hand positions.', where: 'Module 3 · Finger numbers' },
    { value: 'm5-staff', title: 'I can read a little', d: 'You know some note names and rhythms. Start with reading from the staff.', where: 'Module 5 · The staff' },
  ];
  function pageStart() {
    const m = main();
    const total = allLessons().length;
    const mins = allLessons().reduce((a, l) => a + l.minutes, 0);
    const startAt = () => STARTS.find((x) => x.value === S.setting('startAt')) || STARTS[0];
    const go = () => { S.setSetting('onboarded', true); const l = C.lessons[startAt().value]; location.hash = `#/lesson/${l.id}/0`; };
    const ctaLabel = () => (startAt().value === 'm1-high-low' ? 'Start lesson 1 →' : `Start at ${startAt().where} →`);
    const ctas = [];
    const cta = (cls) => { const b = btn(ctaLabel(), go, 'btn-primary btn-big' + (cls ? ' ' + cls : '')); ctas.push(b); return b; };
    const refreshCtas = () => ctas.forEach((b) => { b.textContent = ctaLabel(); });

    m.append(h('section.hero.hero-start', null,
      h('div.hero-copy', null,
        h('div.eyebrow', null, 'Getting started'),
        h('h1.display', null, 'Learn to play piano and read music — from zero.'),
        h('p.lede', null, `${total} short lessons in 12 modules, about ${Math.round(mins / total)} minutes each. Everything happens in your browser: listen, watch, play on the screen keyboard, and get honest feedback.`),
        h('div.row', null, cta(), btn('Set up first ↓', () => document.getElementById('setup').scrollIntoView({ behavior: U.reducedMotion() ? 'auto' : 'smooth', block: 'start' }), 'btn-ghost btn-big'))),
      heroArt()));

    const need = (ico, t, d) => h('li.need', null, h('span.need-ico', null, icon(ico)), h('div', null, h('strong', null, t), h('span', null, d)));
    m.append(h('section.section', null,
      h('div.section-head', null, h('div.eyebrow', null, 'Step 0'), h('h2', null, 'What you need (prerequisites)'), h('p', null, 'No music knowledge is assumed. Here is everything the course expects — and what is only nice to have.')),
      h('div.need-grid', null,
        h('div.need-card', null, h('h3', null, h('span.tag-req', null, 'Required')),
          h('ul.need-list', null,
            need('screen', 'A computer, tablet or phone', 'Any modern browser: Chrome, Edge, Safari or Firefox. A bigger screen shows more keys.'),
            need('headphones', 'Speakers or headphones', 'Most lessons use sound. Wired headphones are best for rhythm — Bluetooth adds a delay.'),
            need('clock', '10–15 minutes, a few days a week', 'Short, regular sessions beat long, rare ones. Stop any time — progress saves after every step.'),
            need('sprout', 'No prior knowledge', 'Lesson 1 starts with “high and low”. Every term is explained when it first appears.'))),
        h('div.need-card.need-card-soft', null, h('h3', null, h('span.tag-opt', null, 'Nice to have')),
          h('ul.need-list', null,
            need('piano', 'A piano or digital keyboard', 'Every lesson ends with an “On a real piano” step. 61+ full-size keys is plenty.'),
            need('plug', 'A MIDI keyboard + Chrome or Edge', 'Connect by USB and the app checks your real playing, just like the screen keyboard.'),
            need('keys', 'A computer keyboard', 'Play notes with the letter keys A S D F … — handy for two hands at once.'),
            need('chair', 'A chair and a table', 'For posture and hand-position practice away from the screen.'))))));

    // Setup
    const soundBox = h('div.setup-body');
    const renderSound = () => {
      U.clear(soundBox);
      const st = A.status();
      if (st === 'on') soundBox.append(h('p.pill.pill-ok', null, '● Sound is on'), btn('▶ Play a test chord', () => { A.ensure(); const t0 = A.now() + 0.05; [60, 64, 67, 72].forEach((k, i) => A.play(k, 1.2, 0.55, t0 + i * 0.12)); }, 'btn-small'), h('p.small.muted', null, 'Can’t hear it? Check the volume, and on iPhone/iPad the silent switch.'));
      else if (st === 'unsupported') soundBox.append(h('p', null, 'This browser cannot make sound. You can still follow every lesson visually.'));
      else soundBox.append(btn('Turn sound on', () => A.enable().then((ok) => { if (ok) { A.setMuted(false); const t0 = A.now() + 0.05; [60, 64, 67, 72].forEach((k, i) => A.play(k, 1.2, 0.55, t0 + i * 0.12)); } }), 'btn-primary'), h('p.small.muted', null, 'Browsers only allow sound after a click. The piano is a recorded grand, stored with the app.'));
    };
    renderSound();
    U.onCleanup(A.on(renderSound));
    const plan = Object.assign({ days: 5, minutes: 15, piano: 'none' }, S.setting('plan') || {});
    const midiOut = h('p.small.muted', { 'aria-live': 'polite' });
    const midiRow = h('div.row', null, btn('Connect MIDI keyboard', () => MC.input.connectMIDI().then((r) => { midiOut.textContent = r.msg; U.toast(r.msg, r.ok ? 'ok' : 'bad'); }), 'btn-small'), midiOut);
    const instrNote = h('p.small.muted');
    const renderInstr = () => {
      midiRow.hidden = plan.piano !== 'keyboard';
      instrNote.textContent = { none: 'No problem — the on-screen keyboard is enough for the whole course. Tap finger patterns on a table for the hand lessons.', keyboard: MC.input.midiSupported ? 'Connect it by USB to have your real playing checked (Chrome or Edge).' : 'Web MIDI is not available in this browser — try Chrome or Edge on a computer to connect it.', piano: 'Great. Do each lesson’s “On a real piano” step and log it as self-reported practice.' }[plan.piano];
    };
    renderInstr();
    const instr = U.segmented([{ value: 'none', label: 'None yet' }, { value: 'keyboard', label: 'Digital keyboard' }, { value: 'piano', label: 'Acoustic piano' }], plan.piano, (v) => { plan.piano = v; S.setSetting('plan', plan); renderInstr(); }, 'Your instrument');
    const startList = h('div.start-options', { role: 'radiogroup', 'aria-label': 'Where to start' });
    const renderStarts = () => {
      U.clear(startList);
      const cur = startAt().value;
      STARTS.forEach((o) => startList.appendChild(h('button.start-option', { type: 'button', role: 'radio', 'aria-checked': String(o.value === cur), onclick: () => { S.setSetting('startAt', o.value); renderStarts(); refreshCtas(); } },
        h('span.so-radio', { 'aria-hidden': 'true' }),
        h('span.so-body', null, h('span.so-title', null, o.title, o.rec ? h('span.pill.pill-accent', null, 'Recommended') : null), h('span.so-d', null, o.d), h('span.so-where', null, '→ ' + o.where)))));
    };
    renderStarts();
    const setupCard = (n, title, body) => h('div.setup-card', null, h('div.setup-num', null, String(n)), h('div.setup-main', null, h('h3', null, title), body));
    m.append(h('section.section#setup', null,
      h('div.section-head', null, h('div.eyebrow', null, 'Setup · about 30 seconds'), h('h2', null, 'Three quick choices')),
      h('div.setup-grid', null,
        setupCard(1, 'Turn on sound', soundBox),
        setupCard(2, 'Your instrument', h('div.setup-body', null, instr, instrNote, midiRow)),
        setupCard(3, 'Where to start', h('div.setup-body', null, startList, h('p.small.muted', null, 'Prerequisites are suggestions: you can open any lesson later from the course map.'))))));

    // How a lesson works
    const PIPE = [['Goal', 'What you will be able to do, with a real-world example.'], ['Hear & see', 'A short demonstration on the keyboard and staff.'], ['Explore', 'Try it yourself. New words are defined here.'], ['Guided practice', 'Questions with hints — not scored.'], ['Check', 'No hints, first tries count. 80% = demonstrated.'], ['Recap', 'Key points, a memory clue, and a real-piano task.']];
    m.append(h('section.section', null,
      h('div.section-head', null, h('div.eyebrow', null, 'How every lesson works'), h('h2', null, 'Six small steps, the same every time'), h('p', null, 'Each lesson walks the same path, so you always know what comes next. After the lesson, questions return in the review queue at growing intervals.')),
      h('ol.pipeline', null, PIPE.map(([t, d], i) => h('li', null, h('span.pl-n', null, String(i + 1)), h('span.pl-t', null, t), h('span.pl-d', null, d))))));
    m.append(h('section.section', null,
      h('div.section-head', null, h('div.eyebrow', null, 'Your path'), h('h2', null, 'Four stages, start to finish'), h('p', null, 'Each stage builds on the one before. Module prerequisites are listed on the course map and at the start of every lesson.')),
      journey()));
    m.append(h('div.cta-bar', null, h('div', null, h('strong', null, 'Ready?'), h('span.muted', null, ' You can come back to this page any time from More → Getting started.')), cta()));
  }
  function heroArt() {
    const wrap = h('div.hero-art');
    const kb = MC.Keyboard({ from: 48, to: 67, labels: 'white', ownsInput: false, showMapLegend: false, minKeyPx: 22, ariaLabel: 'Try it: a playable keyboard with both hands in C position' });
    kb.setHands([{ hand: 'lh', fingers: { 5: 48, 4: 50, 3: 52, 2: 53, 1: 55 } }, { hand: 'rh', fingers: { 1: 60, 2: 62, 3: 64, 4: 65, 5: 67 } }]);
    wrap.appendChild(kb.el);
    return wrap;
  }

  /* ---------- Today (Home) ---------- */
  function pageToday() {
    const m = main();
    const nx = nextLesson();
    const due = S.dueItems();
    const summ = S.skillSummary();
    const hr = new Date().getHours();
    const greet = hr < 5 ? 'Good evening' : hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
    const fresh = S.isNew();
    if (!S.available) m.append(h('div.banner', null, 'This browser is not letting the app save progress (private mode or storage blocked). Your progress lasts until you close the tab — use Progress → Export to keep a copy.'));
    m.append(h('div.page-head', null, h('div.eyebrow', null, new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })), h('h1', null, fresh ? 'Welcome to Middle C' : greet), h('p', null, 'About 15 minutes: a short review, one new idea, and some music. Stop whenever you like — progress is saved after every step.')));
    if (!S.setting('onboarded') && fresh) m.append(h('div.notice-card', null, h('div', null, h('strong', null, 'New here? '), 'Check the prerequisites, turn on sound and pick where to start — it takes 30 seconds.'), h('a.btn.btn-primary', { href: '#/start' }, 'Getting started →')));
    if (nx) {
      const l = nx.lesson;
      const st = status(l.id);
      const pct = st.visited.length / l.steps.length;
      m.append(h('section.continue-card', null,
        h('div.cc-body', null,
          h('div.eyebrow', null, nx.step || st.started ? 'Continue learning' : 'Next lesson', ` · Module ${l.module}: ${moduleOf(l).title}`),
          h('h2', null, l.title),
          h('p.cc-goal', null, plain(l.goal)),
          h('div.cc-meta', null, h('span.with-ico', null, icon('clock', 'ico-sm'), `${l.minutes} min`), h('span', null, `${l.steps.length} steps`), nx.step ? h('span', null, `Resume at step ${nx.step + 1}: ${l.steps[nx.step].title || STEP_TITLE[l.steps[nx.step].kind]}`) : null),
          st.started ? meter(pct, `${Math.round(pct * 100)} percent of this lesson visited`, 'meter-thin') : null),
        h('a.btn.btn-primary.btn-big', { href: `#/lesson/${l.id}/${nx.step}` }, nx.step ? 'Continue →' : 'Start lesson →')));
    } else m.append(h('section.continue-card', null, h('div.cc-body', null, h('div.eyebrow', null, 'Course complete'), h('h2', null, 'You have completed every lesson.'), h('p.cc-goal', null, 'Keep your skills fresh with review, sight-reading and pieces.')), h('a.btn.btn-primary.btn-big', { href: '#/practice/sight' }, 'Sight-read →')));
    m.append(h('div.section-head.tight', null, h('h2', null, 'Your path'), h('a.link-arrow', { href: '#/course' }, 'Course map →')), journey({ desc: false }));
    const piece = suggestPiece();
    const planCard = (ico, title, d, action) => h('li.plan-card', null, h('span.plan-ico', null, icon(ico)), h('div.plan-body', null, h('strong', null, title), h('span.small.muted', null, d)), action);
    const plan = h('ol.today-plan', null,
      planCard('review', '2 min · Warm up', due.length ? `${due.length} items due. Review a few, starting with mistakes.` : 'Choose one familiar drill. Keep it short and comfortable.', due.length ? h('a.btn.btn-primary', { href: '#/review' }, 'Start review') : h('a.btn', { href: '#/practice/keys' }, 'Keyboard drill')),
      planCard('bulb', '8 min · One new idea', nx ? `${nx.lesson.title}. Work through a few steps; your place is saved.` : 'Revisit a memory clue and try its short exercise.', nx ? h('a.btn', { href: `#/lesson/${nx.lesson.id}/${nx.step}` }, 'Open lesson') : h('a.btn', { href: '#/guide' }, 'Browse tips')),
      planCard('note', '5 min · Make music', piece ? `${piece.title} — listen, then practise a small section slowly.` : 'Explore the keyboard. Make a short pattern and repeat it slowly.', piece ? h('a.btn', { href: '#/pieces/' + piece.id }, 'Play') : h('a.btn', { href: '#/tools' }, 'Free play')));
    m.append(h('div.section-head.tight', null, h('h2', null, 'A 15-minute routine'), h('a.link-arrow', { href: '#/guide' }, 'Tips & study guide →')),
      h('p.small.muted', null, 'A little, often. Use these as time guides; a whole lesson can take more than one session.'), plan,
      h('div.row.practice-log-row', null, h('span.small.muted', null, 'Practised on a real instrument?'), btn('Log practice', () => logPracticeModal(nx ? nx.lesson.id : null), 'btn-small')));
    const sk = h('div.panel', { style: { marginTop: '28px' } }, h('div.row-between', null, h('h2', { style: { margin: 0 } }, 'Skills at a glance'), h('a.link-arrow', { href: '#/progress' }, 'Full progress →')));
    Object.entries(S.SKILLS).forEach(([k, def]) => sk.appendChild(skillRow(k, def, summ[k])));
    sk.appendChild(h('p.small.muted', { style: { marginTop: '10px', marginBottom: 0 } }, 'No streaks and no leaderboards. Bars grow only when you answer correctly on separate days.'));
    m.append(sk);
  }
  function suggestPiece() {
    const done = (n) => moduleDone(n);
    let level = 0;
    if (done(5) || status('m7-right-hand').started) level = 1;
    if (done(7)) level = 2;
    if (done(8)) level = 3;
    if (done(10)) level = 4;
    if (!level) return null;
    const pool = Object.values(MC.pieces).filter((p) => p.level <= level && !p.id.startsWith('c-major'));
    pool.sort((a, b) => ((S.piece(a.id).guided || 0) + (S.piece(a.id).independent || 0)) - ((S.piece(b.id).guided || 0) + (S.piece(b.id).independent || 0)) || b.level - a.level);
    return pool[0];
  }
  function skillRow(k, def, s) {
    const note = s.seen ? `${s.secure} secure · ${s.learning} learning${s.shaky ? ` · ${s.shaky} to review` : ''}` : 'Not started';
    return h('div.skill-row', null, h('div', null, h('div.skill-name', null, def.label), h('div.small.muted', null, def.desc)), meter(s.pct, `${def.label}: ${Math.round(s.pct * 100)} percent`), h('div.skill-note', null, note));
  }

  /* ---------- Course map ---------- */
  function pageCourse() {
    const m = main();
    const nx = nextLesson();
    const all = allLessons();
    const doneN = all.filter((l) => status(l.id).completed).length;
    m.append(h('div.page-head', null, h('div.eyebrow', null, `${C.modules.length} modules · ${all.length} lessons · 4 stages`), h('h1', null, 'Course map'),
      h('p', null, 'From your first sound to reading and playing short pieces. Each module lists what it builds on — you can open any lesson, but later lessons assume the earlier ones.'),
      h('div.overall', null, meter(doneN / all.length, `${doneN} of ${all.length} lessons completed`), h('span.small.muted', null, `${doneN} of ${all.length} lessons completed`), h('a.link-arrow.small', { href: '#/start' }, 'Prerequisites & setup →'))));
    if (nx) m.append(h('section.continue-card.compact', null, h('div.cc-body', null, h('div.eyebrow', null, 'Continue learning'), h('h2', null, nx.lesson.title), h('div.cc-meta', null, h('span', null, `Module ${nx.lesson.module}`), h('span.with-ico', null, icon('clock', 'ico-sm'), `${nx.lesson.minutes} min`))), h('a.btn.btn-primary', { href: `#/lesson/${nx.lesson.id}/${nx.step}` }, 'Continue →')));
    m.append(h('div.study-invitation', null,
      h('div', null, h('h2', null, 'A small idea that stays with you'), h('p', null, 'Memory clues, things to try, and quick recall questions — organized into seven topics.')),
      h('a.btn', { href: '#/guide' }, 'Open the study guide →')));
    m.append(h('div.legend.course-legend', null,
      h('span', null, h('span.st-icon.todo'), ' Not started'), h('span', null, h('span.st-icon.half'), ' In progress'), h('span', null, h('span.st-icon.done', null, '✓'), ' Completed'), h('span', null, h('span.st-icon.star', null, '★'), ' Demonstrated (≥80% on the check)')));
    STAGES.forEach((st) => {
      const ls = stageLessons(st);
      const done = ls.filter((l) => status(l.id).completed).length;
      m.append(h('div.stage-head', null, h('span.stage-num', null, `Stage ${st.n}`), h('h2', null, st.title), h('span.small.muted', null, `${done} / ${ls.length} lessons`), h('p', null, st.desc)));
      st.modules.forEach((n) => {
        const mod = C.modules.find((x) => x.n === n);
        const mDone = mod.lessons.filter((l) => status(l.id).completed).length;
        const isCur = nx && nx.lesson.module === mod.n;
        const pre = mod.prereq.length
          ? h('div.mc-pre', null, h('span.bc-label', null, 'Builds on'), mod.prereq.map((p) => { const pm = C.modules.find((x) => x.n === p); return h('span.pre-chip' + (moduleDone(p) ? '.done' : ''), null, moduleDone(p) ? '✓ ' : '', `${p} · ${pm.title}`); }))
          : h('div.mc-pre', null, h('span.pre-chip.done', null, 'No prerequisites — start here'));
        const list = h('ul.lesson-list');
        mod.lessons.forEach((l) => {
          const isNext = nx && nx.lesson.id === l.id;
          list.appendChild(h('li', null, h('a.lesson-row' + (isNext ? '.next' : ''), { href: `#/lesson/${l.id}/${isNext ? nx.step : 0}` },
            statusIcon(l.id),
            h('div.lr-text', null, h('div.t', null, `${mod.n}.${l.index + 1} · ${l.title}`, isNext ? h('span.pill.pill-accent', null, 'Up next') : null), h('div.d', null, plain(l.goal))),
            h('span.lr-min', null, `${l.minutes} min`))));
        });
        m.append(h('section.module' + (isCur ? '.current' : '') + (mDone === mod.lessons.length ? '.complete' : ''), null,
          h('div.mc-side', null, h('div.mc-num', null, String(mod.n)), h('div.module-num', null, `Module ${mod.n}`), h('h3', null, mod.title), h('p.small', null, mod.summary), pre,
            h('div.mc-prog', null, meter(mDone / mod.lessons.length, `${mDone} of ${mod.lessons.length} lessons completed`, 'meter-thin'), h('span.small.muted', null, `${mDone}/${mod.lessons.length}`))),
          list));
      });
    });
  }

  function pageGuide(topic) {
    main().append(h('div.page-head.study-head', null,
      h('div.eyebrow', null, 'Your piano companion'), h('h1', null, 'Small clues. Lasting habits.'),
      h('p.lede', null, 'Find a memory trick, try it at the keyboard, then check what stuck. Come back whenever a note, a rhythm or a symbol needs a little explanation.'),
      h('div.row', null, h('a.btn', { href: '#/course' }, 'Course map'), h('a.link-arrow', { href: '#/today' }, 'Your 15-minute routine →'))),
      h('ol.study-method', { 'aria-label': 'How to use these tips' },
        ['Remember the clue', 'Try it at the keys', 'Recall, then reveal'].map((t, i) => h('li', null, h('span', null, String(i + 1)), t))),
      W.studyGuide(topic));
  }

  /* ---------- Lesson ---------- */
  function pageLesson(id, stepIdx) {
    const l = C.lessons[id];
    const m = main();
    if (!l) { m.append(h('p', null, 'Lesson not found. '), h('a', { href: '#/course' }, 'Back to the course map')); return; }
    stepIdx = Math.max(0, Math.min(l.steps.length - 1, stepIdx));
    const step = l.steps[stepIdx];
    S.visitStep(id, stepIdx);
    const mod = moduleOf(l);
    const list = allLessons();
    const li = list.indexOf(l);
    const missingPre = mod.prereq.filter((n) => !moduleDone(n));
    if (step.kind === 'recap') {
      const visited = S.lesson(id).visited;
      const missing = l.steps.map((_, i) => i).filter((i) => i < stepIdx && !visited.includes(i));
      if (!missing.length) S.completeLesson(id);
    }
    const stepName = (s) => s.title || STEP_TITLE[s.kind];
    m.append(h('nav.crumbs', { 'aria-label': 'Breadcrumb' }, h('a', { href: '#/course' }, 'Course'), h('span', { 'aria-hidden': 'true' }, '›'), h('span', null, `Module ${mod.n} · ${mod.title}`)));
    m.append(h('div.lesson-head', null,
      h('div', null, h('h1', null, l.title), h('div.lesson-meta', null, h('span', null, `Lesson ${l.index + 1} of ${mod.lessons.length}`), h('span.with-ico', null, icon('clock', 'ico-sm'), `about ${l.minutes} min`), h('span', null, `${l.steps.length} steps`))),
      chips(id)));
    if (missingPre.length && stepIdx === 0) m.append(h('div.banner.banner-info', null, `This lesson builds on ${missingPre.map((n) => `Module ${n} (${C.modules.find((x) => x.n === n).title})`).join(' and ')}. You are welcome to continue — if something is unfamiliar, `, h('a', { href: `#/lesson/${C.modules.find((x) => x.n === missingPre[0]).lessons[0].id}/0` }, 'start there'), '.'));
    const steps = h('ol.steps', { 'aria-label': 'Lesson steps' });
    const visited = S.lesson(id).visited;
    l.steps.forEach((s, i) => {
      const done = visited.includes(i) && i !== stepIdx;
      steps.appendChild(h('li' + (done ? '.done' : '') + (i === stepIdx ? '.current' : ''), null, h('button' + (done ? '.done' : ''), { type: 'button', 'aria-current': i === stepIdx ? 'step' : null, 'aria-label': `Step ${i + 1}: ${stepName(s)}${done ? ' (visited)' : ''}`, onclick: () => { location.hash = `#/lesson/${id}/${i}`; } }, h('span.n', null, done ? '✓' : String(i + 1)), h('span.lbl', null, stepName(s)))));
    });
    m.append(steps);
    const explain = h('div.panel.explain-panel');
    const area = h('div.panel.practice-panel');
    const grid = h('div.lesson-grid', null, h('div.explain', null, explain), h('div.practice-area', null, area));
    m.append(grid);
    const goNext = () => { location.hash = stepIdx + 1 < l.steps.length ? `#/lesson/${id}/${stepIdx + 1}` : (list[li + 1] ? `#/lesson/${list[li + 1].id}/0` : '#/today'); };
    // Explanation column
    explain.append(h('div.eyebrow', null, `Step ${stepIdx + 1} of ${l.steps.length}`), h('h2', null, stepName(step)));
    if (step.kind === 'intro') explain.append(h('p.goal', { html: `<strong>Goal:</strong> ${l.goal}` }), h('div.callout', { html: `<p><strong>Example:</strong> ${l.example}</p>` }));
    if (step.body) explain.append(h('div.prose', { html: step.body }));
    if (step.kind === 'see') explain.append(W.lessonCoach(id, 'see'));
    if (step.defs) explain.append(h('dl.def', null, step.defs.flatMap(([t, d]) => [h('dt', null, t), h('dd', { html: d })])));
    if (step.more) explain.append(U.details('More detail (optional)', h('div', { html: step.more })));
    if (step.kind === 'intro') explain.append(beforeCard(l, mod));
    if (step.kind === 'recap') renderRecap(l, step, explain, area, list[li + 1]);
    else renderStepArea(l, step, area, goNext);
    if (step.kind === 'explore') area.append(W.lessonCoach(id, 'explore'));
    // Step navigation: sticky at the bottom so "Next" is always in reach.
    const next = stepIdx + 1 < l.steps.length ? btn(h('span', null, h('span.hide-mobile', null, 'Next: '), `${stepName(l.steps[stepIdx + 1])} →`), goNext, 'btn-primary') : (list[li + 1] ? h('a.btn.btn-primary', { href: `#/lesson/${list[li + 1].id}/0` }, h('span.hide-mobile', null, 'Next lesson: '), `${list[li + 1].title} →`) : h('a.btn.btn-primary', { href: '#/today' }, 'Finish →'));
    m.append(h('div.step-nav', null,
      stepIdx > 0 ? h('a.btn', { href: `#/lesson/${id}/${stepIdx - 1}` }, '← Back') : (list[li - 1] ? h('a.btn.btn-quiet', { href: `#/lesson/${list[li - 1].id}/0` }, '← ', h('span.hide-mobile', null, 'Previous lesson')) : h('span')),
      h('div.sn-mid', null, meter((stepIdx + 1) / l.steps.length, `Step ${stepIdx + 1} of ${l.steps.length}`, 'meter-thin'), h('span.small.muted', null, `Step ${stepIdx + 1} of ${l.steps.length}`, h('span.hide-mobile', null, ' · your place is saved'))),
      next));
  }

  function renderStepArea(l, step, area, goNext) {
    if (step.quiz) {
      const mode = step.kind === 'check' ? 'check' : 'guided';
      area.appendChild(h('div.area-head', null, h('h3', null, mode === 'check' ? 'Check yourself' : 'Practice with hints'), h('span.pill' + (mode === 'check' ? '.pill-accent' : ''), null, mode === 'check' ? 'Scored · first tries, no hints' : 'Not scored · hints welcome')));
      MC.Quiz.run(area, Object.assign({}, step.quiz, { mode, lessonId: l.id, title: `${l.title} — ${mode === 'check' ? 'check' : 'practice'}`, onDone: goNext, doneLabel: 'Continue to the next step →' }));
      return;
    }
    if (step.practice) {
      area.appendChild(W.pieceChooser({ ids: step.practice.ids, player: { modes: ['guided', 'watch', 'independent'], mode: step.practice.mode || 'guided', names: step.practice.names, onResult: (r) => { if (r.mode === 'guided') { S.markPractised(l.id); U.toast('Recorded: lesson practised.', 'ok'); } } } }));
      return;
    }
    if (step.pieceCheck) {
      const piece = MC.pieces[step.pieceCheck.id];
      const out = h('div', { 'aria-live': 'polite' });
      area.append(h('p.small.muted', null, 'Untimed “Notes only” is what counts for this check. You can also try “Notes + rhythm” for a separate timing score (recorded with the piece, not the lesson).'),
        MC.PiecePlayer(piece, { modes: ['independent', 'guided', 'watch'], mode: 'independent', names: false, onResult: (r) => {
          if (r.mode !== 'independent') { if (r.mode === 'guided') S.markPractised(l.id); return; }
          U.clear(out);
          if (r.timed) { out.append(h('div.feedback.info', null, h('h4', null, 'Timing attempt recorded'), h('p', null, `Pitch ${U.pct(r.pitch)} · rhythm ${U.pct(r.rhythm)}. The lesson check uses the untimed run.`))); return; }
          const passed = S.recordCheck(l.id, Math.round(r.pitch * r.total), r.total);
          out.append(h('div.feedback.' + (passed ? 'ok' : 'bad'), null, h('h4', null, passed ? '✓ Understanding demonstrated' : 'Not demonstrated yet'), h('p', null, passed ? `${U.pct(r.pitch)} of notes right on the first try.` : `${U.pct(r.pitch)} right on the first try — 80% is needed. Practise the tricky measures in guided mode, then try again.`), h('div.row', null, btn('Continue →', goNext, 'btn-primary'))));
        } }).el, out);
      return;
    }
    if (step.w) {
      const f = W[step.w.type];
      area.appendChild(f ? f(step.w) : h('p', null, 'Missing widget: ' + step.w.type));
      return;
    }
    area.append(h('div.stack', null, h('p', null, 'Read the explanation, then continue.'), btn('Continue →', goNext, 'btn-primary')));
  }

  function renderRecap(l, step, explain, area, next) {
    explain.append(h('ul.recap-list', null, step.recap.map((r) => h('li', { html: r }))));
    const st = S.lesson(l.id);
    const missing = l.steps.map((_, i) => i).filter((i) => i < l.steps.length - 1 && !st.visited.includes(i));
    area.append(
      h('div.clue', null, h('h4', null, 'Memory clue'), h('p', { html: step.clue.text }), h('p.small.muted', { html: `<strong>Its limits:</strong> ${step.clue.limits}` })),
      h('div.callout', { style: { marginTop: '14px' } }, h('p', { html: `<strong>Suggested review:</strong> ${step.review}` })),
      h('div.callout.callout-lh', null, h('p', { html: `<strong>On a real piano (optional):</strong> ${step.real}` }), h('div.row', null, btn('I practised this on a real piano', () => logPracticeModal(l.id), 'btn-small'))),
      h('hr.rule'),
      h('h3', null, 'Where you are with this lesson'), chips(l.id),
      h('p.small', { style: { marginTop: '8px' } }, missing.length ? `To mark this lesson “Completed”, visit: ${missing.map((i) => `step ${i + 1} (${l.steps[i].title || STEP_TITLE[l.steps[i].kind]})`).join(', ')}.` : st.demonstrated ? 'Completed and demonstrated. It will still appear in review so it stays fresh.' : l.steps.some((s) => s.kind === 'check') ? 'Completed. Not demonstrated yet — you can retake the check at any time.' : 'Completed.'),
      next ? h('a.btn.btn-primary', { href: `#/lesson/${next.id}/0`, style: { marginTop: '8px' } }, `Next lesson: ${next.title} →`) : h('a.btn.btn-primary', { href: '#/progress' }, 'See your progress →'));
  }

  function logPracticeModal(lessonId) {
    const mins = h('input', { type: 'number', min: 1, max: 240, value: 10, style: { width: '90px' }, 'aria-label': 'Minutes' });
    const note = h('input', { type: 'text', placeholder: 'What did you practise? (optional)', style: { width: '100%' }, 'aria-label': 'Note' });
    U.modal('Log real-piano practice', h('div.stack', null, h('p.small', null, 'This is recorded as self-reported practice. The app cannot hear or see your instrument, so it does not change “Demonstrated”.'), h('label.row', null, 'Minutes: ', mins), note), [
      { label: 'Save', cls: 'btn-primary', onClick: () => { S.logRealPiano(lessonId, +mins.value || 0, note.value); U.toast('Practice logged. Nice work.', 'ok'); route(); } },
      { label: 'Cancel' },
    ]);
  }
  W.practiceLog = function () {
    const wrap = h('div.widget');
    const render = () => {
      U.clear(wrap);
      const log = S.data().log.filter((e) => e.kind === 'real-piano').slice(-6).reverse();
      wrap.append(h('div.row-between', null, h('h3', { style: { margin: 0 } }, 'Practice log (real instrument)'), btn('Log practice', () => logPracticeModal(null), 'btn-primary btn-small')),
        log.length ? h('ul', null, log.map((e) => h('li', null, `${U.fmtDate(e.at)} — ${e.minutes} min${e.lesson && C.lessons[e.lesson] ? ` · ${C.lessons[e.lesson].title}` : ''}${e.note ? ` · ${e.note}` : ''}`))) : h('p.small.muted', null, 'No entries yet. Entries are self-reported.'));
    };
    render();
    const un = S.on(render);
    U.onCleanup(un);
    return wrap;
  };

  /* ---------- Practice hub ---------- */
  const SETS = {
    keys: { skill: 'keyboard', title: 'Find and name keys', d: 'White keys by letter, groups of black keys.', lesson: 'm2-fgab', gens: [{ type: 'findLetter' }, { type: 'nameKey' }, { type: 'blackGroup' }, { type: 'alphabetStep' }] },
    octaves: { skill: 'keyboard', title: 'Middle C and octaves', d: 'Specific notes like C5 or G3.', lesson: 'm2-middle-c', gens: [{ type: 'findSpecific' }, { type: 'octaveJump' }] },
    steps: { skill: 'keyboard', title: 'Half steps, whole steps, sharps & flats', d: 'Distances and black-key names.', lesson: 'm8-accidentals', gens: [{ type: 'halfWhole' }, { type: 'playHalfWhole' }, { type: 'accidentalName' }, { type: 'enharmonic' }] },
    fingers: { skill: 'keyboard', title: 'Fingers and hand positions', d: 'Finger numbers; C, middle C and G positions.', lesson: 'm3-positions', gens: [{ type: 'fingerQuiz' }, { type: 'positionFinger' }, { type: 'playPattern', params: { hand: 'rh', hints: 'thumb' } }, { type: 'playPattern', params: { hand: 'lh', hints: 'thumb' } }, { type: 'playPattern', params: { hand: 'rh', position: 'G4', hints: 'full' } }] },
    treble: { skill: 'reading', title: 'Treble clef notes', d: 'Name and play notes, including ledger lines.', lesson: 'm5-treble', gens: [{ type: 'readNote', params: { clef: 'treble', ledger: true } }, { type: 'playStaffNote', params: { clef: 'treble' } }] },
    bass: { skill: 'reading', title: 'Bass clef notes', d: 'Name and play notes, including ledger lines.', lesson: 'm5-bass', gens: [{ type: 'readNote', params: { clef: 'bass', ledger: true } }, { type: 'playStaffNote', params: { clef: 'bass' } }] },
    grand: { skill: 'reading', title: 'Grand staff, both directions', d: 'Staff → key and key → staff.', lesson: 'm5-grand', gens: [{ type: 'readNote', params: { clef: 'grand', ledger: true } }, { type: 'keyToStaff', params: { clef: 'grand' } }, { type: 'playStaffNote', params: { clef: 'grand', ledger: true } }] },
    intervals: { skill: 'reading', title: 'Intervals on the staff', d: '2nds to octaves.', lesson: 'm8-intervals', gens: [{ type: 'intervalName' }, { type: 'intervalPlay' }, { type: 'stepSkip', params: { clef: 'treble' } }] },
    symbols: { skill: 'reading', title: 'Signs and symbols', d: 'Dynamics, articulation, ties, repeats, accidentals.', lesson: 'm11-phrasing', gens: [{ type: 'symbolMeaning' }, { type: 'tieOrSlur' }, { type: 'barlineRule' }, { type: 'dynamicsOrder' }] },
    values: { skill: 'rhythm', title: 'Note values and measures', d: 'How long notes last; complete a measure.', lesson: 'm6-measures', gens: [{ type: 'noteValue' }, { type: 'valueMatch', params: { rests: true } }, { type: 'measureComplete' }, { type: 'countMeasure' }, { type: 'tieBeats' }] },
    tap: { skill: 'rhythm', title: 'Tap rhythms', d: 'Blocks and notation, with count-in.', lesson: 'm6-eighths', gens: [{ type: 'tapRhythm', params: { display: 'notation', level: 'long' } }, { type: 'tapRhythm', params: { display: 'notation', level: 'eighths' } }, { type: 'tapRhythm', params: { display: 'blocks', level: 'rests' } }] },
    pulse: { skill: 'rhythm', title: 'Steady beat', d: 'Tap along; keep going when clicks stop.', lesson: 'm4-pulse', gens: [{ type: 'tapAlong' }, { type: 'tapAlong', params: { fade: true } }, { type: 'whichBeat' }] },
    ears: { skill: 'listening', title: 'Listening: pitch and direction', d: 'Higher/lower, up/down, interval size (visual versions available).', lesson: 'm8-intervals', gens: [{ type: 'pitchCompare', params: { minGap: 3, maxGap: 12 } }, { type: 'listenDirection', params: { mixed: true } }, { type: 'intervalCompare' }] },
    ears2: { skill: 'listening', title: 'Listening: tempo, beat and touch', d: 'Faster/slower, groups of 3 or 4, legato/staccato, sound qualities.', lesson: 'm11-dynamics', gens: [{ type: 'tempoCompare' }, { type: 'hearGrouping' }, { type: 'hearArticulation' }, { type: 'qualityCompare' }] },
    scales: { skill: 'chords', title: 'Scales and key signatures', d: 'C, G, F major.', lesson: 'm9-keys', gens: [{ type: 'buildScale' }, { type: 'keySig' }, { type: 'keySigEffect' }, { type: 'scaleHalfSteps' }] },
    chords: { skill: 'chords', title: 'Chords', d: 'Build triads, hear major/minor, choose chords.', lesson: 'm10-accompany', gens: [{ type: 'buildChord', params: { chords: ['C', 'F', 'G', 'Am', 'Dm', 'Em'] } }, { type: 'chordQuality' }, { type: 'chordForMelody' }] },
    sight: { skill: 'reading', title: 'Sight-reading', d: 'Fresh melodies, both hands, untimed.', lesson: 'm12-sight', gens: [{ type: 'sightRead', params: { position: 'C4' } }, { type: 'sightRead', params: { position: 'G4', key: 'G' } }, { type: 'sightRead', params: { position: 'C3', hand: 'lh' } }] },
  };
  function pagePractice(setId) {
    const m = main();
    if (setId && SETS[setId]) {
      const set = SETS[setId];
      m.append(h('div.page-head', null, h('a', { href: '#/practice' }, '← All practice'), h('h1', null, set.title), h('p', null, `${set.d} Untimed free practice: explanations after every answer; results feed your review queue.`)));
      const panel = h('div.panel');
      m.append(panel);
      MC.Quiz.run(panel, { gens: set.gens, count: 8, mode: 'practice', title: set.title, onDone: () => { location.hash = '#/practice'; }, doneLabel: 'Back to practice' });
      return;
    }
    m.append(h('div.page-head', null, h('h1', null, 'Practice'), h('p', null, 'Untimed practice with freshly generated questions. Choose any area — each shows the lesson where it is taught.')));
    Object.entries(S.SKILLS).forEach(([k, def]) => {
      const tiles = Object.entries(SETS).filter(([, s]) => s.skill === k);
      if (!tiles.length) return;
      m.append(h('h2', { style: { marginTop: '18px' } }, def.label));
      m.append(h('div.practice-grid', null, tiles.map(([id, s]) => {
        const taught = C.lessons[s.lesson];
        const started = status(s.lesson).started;
        return h('a.practice-tile', { href: '#/practice/' + id }, h('span.t', null, s.title), h('span.d', null, s.d), h('span.tag', null, `${started ? 'Taught in' : 'Not yet taught — see'} ${taught.module}.${taught.index + 1} ${taught.title}`));
      })));
    });
  }

  /* ---------- Review ---------- */
  function pageReview() {
    const m = main();
    const due = S.dueItems();
    m.append(h('div.page-head', null, h('h1', null, 'Review queue'), h('p', null, 'Items come back after a delay: soon after a mistake, then after 1, 3, 7 and 16 days as you keep getting them right. Mistakes come first.')));
    const panel = h('div.panel');
    m.append(panel);
    const bySkill = {};
    due.forEach((it) => { bySkill[it.skill] = (bySkill[it.skill] || 0) + 1; });
    if (due.length) {
      panel.append(h('p', null, h('strong', null, `${due.length} item${due.length > 1 ? 's' : ''} due`), ` — ${Object.entries(bySkill).map(([k, n]) => `${S.SKILLS[k] ? S.SKILLS[k].label : k}: ${n}`).join(', ')}.`), h('p.small.muted', null, 'A session takes up to 8 items (about 3 minutes).'));
      const host = h('div');
      panel.append(btn('Start review', () => { U.clear(host); MC.Quiz.run(host, { items: due.slice(0, 8), mode: 'review', title: 'Review', onDone: () => route(), doneLabel: 'Done' }); }, 'btn-primary'), host);
    } else {
      const recent = Object.entries(S.data().items).filter(([, it]) => it.lastWrong && it.gen).sort((a, b) => b[1].lastWrong - a[1].lastWrong).slice(0, 8).map(([key, it]) => Object.assign({ key }, it));
      panel.append(h('p', null, S.nextDue() ? `Nothing is due right now. The next item comes back ${U.relTime(S.nextDue())}.` : 'Nothing to review yet. Items are added when you answer questions in lessons and practice.'));
      if (recent.length) {
        const host = h('div');
        panel.append(btn(`Practise your ${recent.length} most recent mistakes anyway`, () => { U.clear(host); MC.Quiz.run(host, { items: recent, mode: 'practice', title: 'Recent mistakes', onDone: () => route() }); }), host);
      } else panel.append(h('a.btn', { href: '#/practice' }, 'Go to practice'));
    }
  }

  /* ---------- Pieces ---------- */
  function pagePieces(id) {
    const m = main();
    if (id && MC.pieces[id]) {
      m.append(h('a', { href: '#/pieces' }, '← All pieces'));
      const panel = h('div.panel', { style: { marginTop: '10px' } });
      panel.appendChild(MC.PiecePlayer(MC.pieces[id], { mode: 'watch' }).el);
      m.append(panel);
      return;
    }
    m.append(h('div.page-head', null, h('h1', null, 'Pieces'), h('p', null, 'Traditional melodies, original exercises, and repertoire. Each can be watched, played with guidance, or played independently with separate pitch and rhythm scores.')));
    const levels = { 1: 'First melodies (one hand)', 2: 'Reading on your own', 3: 'Two hands and new keys', 4: 'Chords and expression', 5: 'Repertoire' };
    Object.entries(levels).forEach(([lv, name]) => {
      const ps = Object.values(MC.pieces).filter((p) => p.level === +lv);
      m.append(h('h2', { style: { marginTop: '18px' } }, name));
      m.append(h('div.practice-grid', null, ps.map((p) => {
        const r = S.piece(p.id);
        const hands = p.staves.length > 1 ? 'Both hands' : p.staves[0].clef === 'bass' ? 'Left hand' : 'Right hand';
        const stat = r.bestPitch != null ? `Best: notes ${U.pct(r.bestPitch)}${r.bestRhythm != null ? `, rhythm ${U.pct(r.bestRhythm)}` : ''}` : r.guided ? 'Played with guidance' : 'Not played yet';
        return h('a.practice-tile', { href: '#/pieces/' + p.id }, h('span.t', null, p.title), h('span.d', null, `${hands} · ${p.keyLabel || T.KEYS[p.key].name} · ${p.time.join('/')} · ${p.composer}${p.arranger ? ` · arr. ${p.arranger}` : ''}`), h('span.tag', null, stat));
      })));
    });
  }

  /* ---------- Tools ---------- */
  function pageTools() {
    const m = main();
    m.append(h('div.page-head', null, h('h1', null, 'Tools'), h('p', null, 'A free-play keyboard connected to the staff, a metronome, and scale and chord explorers.')));
    const g1 = h('div.panel', null, h('h2', null, 'Keyboard ↔ staff'), h('p.small.muted', null, 'Play any key to see where it is written; click the staff to hear a note and find its key.'), W.keyboardExplore({ from: 36, to: 84, labels: 'c', mode: 'staff', clef: 'grand', labelToggle: true }), h('hr.rule'), W.staffExplore({ clef: 'grand', landmarks: true }));
    const g2 = h('div.panel', null, h('h2', null, 'Metronome'), W.metronome({ bpm: 80 }));
    const g3 = h('div.panel', null, h('h2', null, 'Scales'), W.scaleBuilder({ tonics: ['C4', 'G4', 'F4', 'D4'] }));
    const g4 = h('div.panel', null, h('h2', null, 'Chords'), W.chordBuilder({}));
    m.append(g1, g2, g3, g4);
  }

  /* ---------- Progress ---------- */
  function pageProgress() {
    const m = main();
    const summ = S.skillSummary();
    m.append(h('div.page-head', null, h('h1', null, 'Progress'), h('p', null, 'Honest progress: opening a lesson does not count as mastering it.')));
    m.append(h('div.panel', null, h('h2', null, 'How progress is measured'),
      h('ul', null,
        h('li', { html: '<strong>Completed</strong> — you visited every step of the lesson up to the recap.' }),
        h('li', { html: '<strong>Practised</strong> — you finished a guided practice set or guided piece in that lesson.' }),
        h('li', { html: '<strong>Demonstrated</strong> — you scored at least <strong>80%</strong> on the lesson’s check, first tries only, without hints, on at least 5 questions (or 80% of notes in an independent piece check).' }),
        h('li', { html: '<strong>Skills</strong> — every question belongs to an item (like “read treble E4”). An item moves up one level only when you answer it correctly on a <em>different day</em>; a mistake sends it back to the start and into review. Items at level 3+ count as “secure”. A skill bar starts growing once items are right on a second day, and is full when about 20 items are fully secure.' }),
        h('li', { html: '<strong>Real piano</strong> — self-reported. The app cannot hear an acoustic piano; with a MIDI keyboard connected, your real playing is checked like on-screen input.' }))));
    const sk = h('div.panel', null, h('h2', null, 'Skills'));
    Object.entries(S.SKILLS).forEach(([k, def]) => sk.appendChild(skillRow(k, def, summ[k])));
    const due = S.dueItems().length;
    sk.appendChild(h('p.small', { style: { marginTop: '10px' } }, `Review queue: ${due} due now${S.nextDue() ? `; next ${U.relTime(S.nextDue())}` : ''}. `, h('a', { href: '#/review' }, 'Open review')));
    m.append(sk);
    const table = h('table.progress-table', null, h('thead', null, h('tr', null, ['Lesson', 'Completed', 'Practised', 'Demonstrated', 'Best check', 'Real piano'].map((t) => h('th', { scope: 'col' }, t)))));
    const tb = h('tbody');
    const mark = (on, cls) => h('span.' + (on ? cls || 'mark-yes' : 'mark-no'), null, on ? '✓ yes' : '—');
    allLessons().forEach((l) => {
      const s = status(l.id);
      tb.appendChild(h('tr', null, h('td', null, h('a', { href: `#/lesson/${l.id}/0` }, `${l.module}.${l.index + 1} ${l.title}`)), h('td', null, mark(s.completed)), h('td', null, mark(s.practised)), h('td', null, mark(s.demonstrated)), h('td', null, s.best != null ? U.pct(s.best) : '—'), h('td', null, s.real ? h('span.mark-self', null, `${s.real}× (self)`) : '—')));
    });
    table.appendChild(tb);
    m.append(h('div.panel', null, h('h2', null, 'Lessons'), h('div', { style: { overflowX: 'auto' } }, table)));
    m.append(h('div.panel', null, W.practiceLog()));
    // Export / import / reset
    const ta = h('textarea', { 'aria-label': 'Progress data (JSON)', placeholder: 'Paste exported progress here to import it.' });
    const file = h('input', { type: 'file', accept: 'application/json,.json', 'aria-label': 'Choose a progress file', onchange: (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { ta.value = r.result; }; r.readAsText(f); } });
    m.append(h('div.panel', null, h('h2', null, 'Save a copy, move, or reset'),
      h('p.small', null, S.available ? 'Progress is saved automatically in this browser (local storage). It stays on this device only. Export a copy to back it up or move it to another browser.' : 'Automatic saving is unavailable in this browser session. Export regularly to keep your progress.'),
      h('div.row', null,
        btn('Download progress file', () => { const ok = U.download(`middle-c-progress-${new Date().toISOString().slice(0, 10)}.json`, S.exportJSON()); U.toast(ok ? 'Progress file downloaded.' : 'Download failed — copy the text below instead.', ok ? 'ok' : 'bad'); }),
        btn('Show as text (copy)', () => { ta.value = S.exportJSON(); ta.select(); })),
      h('hr.rule'),
      h('div.row', null, file, btn('Import', () => {
        if (!ta.value.trim()) { U.toast('Choose a file or paste progress text first.', 'bad'); return; }
        U.modal('Import progress?', h('p', null, 'This replaces the progress currently in this browser with the imported data.'), [{ label: 'Import and replace', cls: 'btn-primary', onClick: () => { const r = S.importJSON(ta.value); U.toast(r.msg, r.ok ? 'ok' : 'bad'); if (r.ok) route(); } }, { label: 'Cancel' }]);
      })), ta,
      h('hr.rule'),
      h('div.row', null, btn('Reset all progress…', () => {
        const inp = h('input', { type: 'text', 'aria-label': 'Type RESET to confirm' });
        U.modal('Reset all progress?', h('div.stack', null, h('p', null, 'This permanently deletes lessons, practice history, review items, piece scores and settings stored in this browser. Consider downloading a progress file first.'), h('label', null, 'Type ', h('strong', null, 'RESET'), ' to confirm: ', inp)), [
          { label: 'Delete everything', cls: 'btn-danger', onClick: () => { if (inp.value.trim().toUpperCase() !== 'RESET') { U.toast('Type RESET to confirm.', 'bad'); return false; } S.reset(); U.toast('Progress reset.', 'ok'); location.hash = '#/lesson/m1-high-low/0'; route(); return true; } },
          { label: 'Cancel' },
        ]);
      }, 'btn-danger'))));
  }

  /* ---------- Settings ---------- */
  function pageSettings() {
    const m = main();
    m.append(h('div.page-head', null, h('h1', null, 'Settings')));
    const src = () => ({ samples: 'Recorded piano samples (Salamander Grand Piano, bundled — no internet needed).', loading: 'Loading the piano samples… a synthesized tone is used meanwhile.', synth: A.isRunning() ? 'Synthesized piano-like tone (the recorded samples could not be loaded).' : 'Sound not started yet.' }[A.source()]);
    const srcEl = h('p.small', null, src());
    const un = A.on(() => { srcEl.textContent = src(); });
    U.onCleanup(un);
    const midiOut = h('p.small', { 'aria-live': 'polite' }, MC.input.midiSupported ? 'Connect a USB/Bluetooth MIDI keyboard to play and be assessed on a real instrument (Chrome or Edge).' : 'Web MIDI is not supported in this browser (try Chrome or Edge on a computer).');
    m.append(
      h('div.panel', null, h('h2', null, 'Sound'), srcEl,
        U.slider('Volume', 0, 100, 1, Math.round((S.setting('volume') || 0.8) * 100), (v) => { A.setVolume(v / 100); S.setSetting('volume', v / 100); }, (v) => v + '%'),
        h('p.small.muted', null, 'On iPhone/iPad, the ring/silent switch can mute web audio — check it if you hear nothing. Bluetooth headphones add a noticeable delay.')),
      h('div.panel', null, h('h2', null, 'Keyboard input'),
        h('label.check', null, h('input', { type: 'checkbox', checked: S.setting('showMap') !== false || null, onchange: (e) => S.setSetting('showMap', e.target.checked) }), 'Show computer-key letters on the piano keys'),
        h('p.small.muted', null, 'Keys A S D F G H J K L ; \' play white keys; W E T Y U O P play black keys; Z / X shift the octave.'),
        btn('Connect MIDI keyboard', () => MC.input.connectMIDI().then((r) => { midiOut.textContent = r.msg; U.toast(r.msg, r.ok ? 'ok' : 'bad'); }), 'btn-small'), midiOut),
      h('div.panel', null, h('h2', null, 'Rhythm timing'),
        h('p.small', null, 'How close to the beat a tap or note must be to count as “on time”.'),
        U.segmented([{ value: 'relaxed', label: 'Relaxed (±200 ms)' }, { value: 'beginner', label: 'Beginner (±150 ms)' }, { value: 'standard', label: 'Standard (±100 ms)' }], S.setting('tolerance') || 'beginner', (v) => S.setSetting('tolerance', v), 'Timing tolerance'),
        h('p.small', { style: { marginTop: '10px' } }, `Latency correction: ${S.setting('latencyMs') != null ? S.setting('latencyMs') + ' ms (calibrated)' : 'browser estimate'}. Calibrate if your taps are consistently marked late or early.`),
        btn('Calibrate timing…', () => MC.calibrateLatency(() => route()), 'btn-small')),
      h('div.panel', null, h('h2', null, 'Motion'),
        U.segmented([{ value: 'auto', label: 'Follow system setting' }, { value: 'on', label: 'Reduce motion' }, { value: 'off', label: 'Allow motion' }], S.setting('reducedMotion') || 'auto', (v) => { S.setSetting('reducedMotion', v); applyMotion(); }, 'Reduced motion')),
    );
  }
  function applyMotion() { document.documentElement.classList.toggle('reduce-motion', U.reducedMotion()); }

  /* ---------- Resources ---------- */
  function pageResources() {
    const m = main();
    m.append(h('div.page-head', null, h('h1', null, 'Resources & credits'), h('p', null, 'Sources consulted while designing this course, free places to continue, and attributions.')));
    const list = (items) => h('ul.resources', null, items.map((r) => h('li', null, h('a', { href: r.url, target: '_blank', rel: 'noopener' }, r.title), h('span.why', null, r.why), r.and ? h('span.why', null, r.and) : null)));
    m.append(h('div.panel', null, h('h2', null, 'Sources consulted'), list(MC.resources)));
    m.append(h('div.panel', null, h('h2', null, 'Free resources for what comes next'), list(MC.freeResources)));
    m.append(h('div.panel', null, h('h2', null, 'Credits and licences'), h('ul', null,
      h('li', null, 'Teaching tips and study structure: adapted from the supplied Middle C Piano Course tutorial. Memory clues, short try-it prompts, seven study topics and the 2–8–5 minute routine are integrated with this course’s lessons and exercises.'),
      h('li', { html: '<strong>Piano sound:</strong> Salamander Grand Piano V3 by Alexander Holm, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC BY 3.0</a>, via the MP3 package by Jan Forst (MIT). Changed for this app: 21 notes (C2–C7), mono, trimmed, re-encoded; other notes are pitch-shifted. See <code>licenses/</code>.' }),
      h('li', { html: '<strong>Notation font:</strong> Bravura © Steinberg Media Technologies GmbH, SIL Open Font License 1.1 (subset embedded).' }),
      h('li', { html: '<strong>Text fonts:</strong> Inter (© The Inter Project Authors) and Fraunces (© The Fraunces Project Authors), both SIL Open Font License 1.1, Latin subsets bundled. See <code>licenses/</code>.' }),
      h('li', { html: '<strong>Melodies:</strong> traditional and public-domain tunes (Hot Cross Buns, Mary Had a Little Lamb, Au clair de la lune, Lightly Row/Hänschen klein, Beethoven’s Ode to Joy theme), some simplified, plus original exercises. The Night King excerpt (measures 1–58) is by Ramin Djawadi, arranged by Liam Hinzman. Interstellar Theme — Easy Piano is by Hans Zimmer, arranged by Matteo248. Begonvil – Benim Yerime de Sev (all 46 written measures), credited to Sezen Aksu in the supplied score, includes the vocal melody and piano accompaniment. These repertoire pieces are transcribed from supplied scores.' }))));
    m.append(h('div.panel', null, h('h2', null, 'Honest limitations'), h('ul', null,
      h('li', null, 'The app checks which keys you press and when. It cannot see posture or hand technique, and cannot hear an acoustic piano (no microphone input). Real-piano practice is self-reported.'),
      h('li', null, 'On-screen and computer keys cannot sense how hard you press; loudness comes from a slider. A MIDI keyboard sends real key speed.'),
      h('li', null, 'Rhythm checks measure when notes start (not how long you hold them), with forgiving tolerances. Device audio delay varies; use calibration in Settings.'),
      h('li', null, 'The piano samples have one recorded loudness; soft notes are made by lowering volume and brightness, which is close to — but not the same as — a real soft touch.'),
      h('li', null, 'A web course cannot replace practice on a real instrument or feedback from a teacher.'))));
  }

  /* ---------- Boot ---------- */
  function boot() {
    S.load();
    A.setVolume(S.setting('volume') || 0.8);
    applyMotion();
    document.body.prepend(h('a.skip-link', { href: '#main', onclick: (e) => { e.preventDefault(); main().focus(); } }, 'Skip to content'), topbar());
    if (document.fonts && document.fonts.load) {
      document.fonts.load('40px BravuraMC', '\uE050').then(() => {
        if (!document.fonts.check('40px BravuraMC', '\uE050')) main().prepend(h('div.banner', null, 'The music notation font did not load, so some symbols may look wrong. Try reloading the page.'));
      }).catch(() => {});
    }
    window.addEventListener('hashchange', route);
    route();
  }
  MC.app = { route, status };
  document.addEventListener('DOMContentLoaded', boot);
})(window.MC = window.MC || {});
