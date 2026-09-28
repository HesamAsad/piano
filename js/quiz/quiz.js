/* Quiz runner. Modes:
   guided   – hints available, retry on mistakes; completing a set counts as "practised"
   check    – first tries without hints are scored; ≥80% on ≥5 questions = "demonstrated"
   practice – untimed free practice, explanations after every answer
   review   – spaced-review items from the review queue */
(function (MC) {
  'use strict';
  const { h } = MC.util;
  const A = MC.audio;
  const I = MC.input;
  MC.gens = MC.gens || {};
  MC.Quiz = {};

  function buildPlan(cfg) {
    if (cfg.items) return cfg.items.map((it) => ({ type: it.gen, params: it.params || {} }));
    const plan = [];
    cfg.gens.forEach((g) => { for (let i = 0; i < (g.n || 1); i++) plan.push({ type: g.type, params: g.params || {} }); });
    if (!plan.length) return plan;
    while (plan.length < cfg.count) plan.push(Object.assign({}, plan[plan.length % Math.max(1, cfg.gens.length)]));
    if (cfg.shuffle !== false) {
      // light shuffle that keeps the order roughly easy → hard
      for (let i = plan.length - 1; i > 0; i--) {
        const j = Math.max(0, i - 1 - MC.theory.rand(2));
        if (Math.random() < 0.5) [plan[i], plan[j]] = [plan[j], plan[i]];
      }
    }
    return plan.slice(0, cfg.count || plan.length);
  }

  MC.Quiz.make = function (type, params, prev) {
    const g = MC.gens[type];
    if (!g) { console.warn('Unknown generator', type); return null; }
    let q = null;
    for (let k = 0; k < 6; k++) {
      q = g(Object.assign({}, params));
      if (!q) continue;
      if (!prev || q.sig !== prev.sig) break;
    }
    if (q) { q.gen = type; q.params = q.params || params; }
    return q;
  };

  MC.Quiz.run = function (container, cfg) {
    cfg = Object.assign({ count: 6, mode: 'guided', gens: [], title: '', onDone: null, lessonId: null, items: null }, cfg);
    const root = h('div.quiz');
    container.appendChild(root);
    let plan = buildPlan(cfg);
    let qi = 0;
    let results = [];
    let prevQ = null;
    const scope = MC.util.scope();
    MC.util.onCleanup(() => scope.run());

    const modeLabel = { guided: 'Guided practice — hints welcome', check: 'Check — first tries count, no hints', practice: 'Practice — untimed', review: 'Review' }[cfg.mode];

    function progress() {
      const wrap = h('div.quiz-progress', { 'aria-hidden': 'true' });
      plan.forEach((_, i) => wrap.appendChild(h('span' + (results[i] ? (results[i].correct ? '.ok' : '.bad') : i === qi ? '.cur' : ''))));
      return wrap;
    }

    function start() {
      qi = 0;
      results = [];
      if (!plan.length) { root.innerHTML = '<p>No questions available.</p>'; return; }
      nextQuestion();
    }
    function nextQuestion() {
      const spec = plan[qi];
      const q = MC.Quiz.make(spec.type, spec.params, prevQ);
      prevQ = q;
      if (!q) { results[qi] = { correct: true, skipped: true }; advance(); return; }
      show(q, 0, false);
    }
    function advance() {
      qi++;
      if (qi >= plan.length) summary();
      else nextQuestion();
    }

    function show(q, attempt, visualMode) {
      scope.run();
      I.silent = false;
      MC.util.clear(root);
      const promptEl = h('div.quiz-prompt', { html: q.prompt });
      const sub = h('div.quiz-sub', { html: q.sub || '' });
      if (!q.sub) sub.hidden = true;
      const area = h('div.quiz-area');
      const hintBox = h('div.hint-box', { hidden: true });
      const fb = h('div', { 'aria-live': 'polite' });
      const actions = h('div.quiz-actions');
      const tools = h('div.quiz-actions');
      root.append(
        h('div.quiz-top', null, h('span', null, `Question ${qi + 1} of ${plan.length}${attempt ? ' · another try' : ''} · ${modeLabel}`), progress()),
        promptEl, sub, tools, area, hintBox, fb, actions,
      );
      let answered = false;
      let usedHint = false;
      const ui = {
        area, mode: cfg.mode, attempt, scope, visual: visualMode,
        setPrompt(html, subHtml) { promptEl.innerHTML = html; if (subHtml != null) { sub.innerHTML = subHtml; sub.hidden = !subHtml; } },
        keyboard(opts, host) { const kb = MC.Keyboard(opts); scope.add(() => kb.destroy()); (host || area).appendChild(kb.el); return kb; },
        staff(spec, opts, host) { const d = h('div.stage.stage-tight.staff-wrap'); (host || area).appendChild(d); return MC.Staff.notes(d, spec, Object.assign({ spPx: 15 }, opts || {})); },
        score(score, opts, host) { const d = h('div.stage.stage-tight.staff-wrap'); (host || area).appendChild(d); return MC.Staff.render(d, score, Object.assign({ spPx: 11 }, opts || {})); },
        box(cls) { const d = h('div' + (cls ? '.' + cls : '')); area.appendChild(d); return d; },
        choices(list, onPick, opt) {
          const wrap = h('div.choices', { role: 'group', 'aria-label': 'Answer choices' });
          const btns = list.map((c) => {
            const b = h('button.btn.choice' + (opt && opt.big ? '.big' : '') + (c.el ? '.choice-notation' : ''), { type: 'button', 'aria-label': c.aria || null }, c.el || h('span', { html: c.label }));
            b.addEventListener('click', () => {
              if (answered) return;
              btns.forEach((x) => { x.disabled = true; });
              b.classList.add('sel');
              onPick(c.value, b);
              if (answered) {
                const res = lastRes;
                b.classList.add(res && res.correct ? 'ok' : 'bad');
                if (res && !res.correct && cfg.mode !== 'check') {
                  const good = btns[list.findIndex((x) => x.value === res.answer)];
                  if (good && res.answer !== undefined && showAnswerAfterWrong()) good.classList.add('ok');
                }
              }
            });
            b.dataset.value = String(c.value);
            wrap.appendChild(b);
            return b;
          });
          (opt && opt.host ? opt.host : area).appendChild(wrap);
          return wrap;
        },
        listen(playFn, label) {
          const b = MC.util.btn('▶ ' + (label || 'Play the sound again'), () => { A.ensure(); playFn(); }, '');
          tools.appendChild(b);
          setTimeout(() => { if (A.canHear() && root.isConnected && !answered) playFn(); }, 350);
          return b;
        },
        tool(el) { tools.appendChild(el); return el; },
        onInput(fn) { const un = I.subscribe(fn); scope.add(un); return un; },
        onTap(fn) { const un = I.onTap(fn); scope.add(un); return un; },
        submit(res) {
          if (answered) return;
          answered = true;
          lastRes = res;
          const correct = !!res.correct;
          if (attempt === 0) {
            results[qi] = { correct: correct && !usedHint, skill: q.skill, hinted: usedHint, rawCorrect: correct };
            if (q.item) MC.store.recordAnswer(q.item, q.skill, correct && !usedHint, { gen: q.gen, params: q.reviewParams || q.params });
          }
          MC.util.clear(fb);
          const title = correct ? (usedHint ? 'Correct — with a hint' : res.title || 'Correct') : res.title || 'Not quite';
          const box = h('div.feedback.' + (correct ? 'ok' : 'bad'), null, h('h4', null, (correct ? '✓ ' : '✗ ') + title));
          if (res.msg) box.appendChild(h('div', { html: res.msg }));
          if (q.explain) box.appendChild(h('p.small', { html: q.explain, style: { marginTop: '6px' } }));
          fb.appendChild(box);
          if (res.reveal && (!correct || res.revealAlways)) { try { res.reveal(); } catch (e) { console.error(e); } }
          if (correct && res.after) { try { res.after(); } catch (e) { console.error(e); } }
          MC.util.clear(actions);
          if (!correct) actions.appendChild(MC.util.btn(cfg.mode === 'check' || cfg.mode === 'review' ? 'Try it again (score stays the same)' : 'Try again', () => show(q, attempt + 1, visualMode)));
          const nb = MC.util.btn(qi + 1 < plan.length ? 'Next question →' : 'See results', () => advance(), 'btn-primary');
          actions.appendChild(nb);
          hintBtn.disabled = true;
          setTimeout(() => nb.focus({ preventScroll: true }), 30);
          document.dispatchEvent(new CustomEvent('mc:answer', { detail: { correct, item: q.item } }));
        },
      };
      let lastRes = null;
      const showAnswerAfterWrong = () => true;
      // Hints
      const hintBtn = MC.util.btn('💡 Hint', () => {
        usedHint = true;
        hintBtn.disabled = true;
        const hnt = typeof q.hint === 'function' ? q.hint(ui) : q.hint;
        if (hnt) { hintBox.hidden = false; hintBox.innerHTML = hnt; }
      }, 'btn-quiet');
      hintBtn.innerHTML = '<span class="ico" aria-hidden="true">?</span> Hint';
      if (q.hint && cfg.mode !== 'check') tools.appendChild(hintBtn);
      // Listening questions without sound → visual alternative
      if (q.listen && q.visual) {
        if (visualMode) {
          tools.appendChild(MC.util.btn('Use the listening version', () => show(q, attempt, false), 'btn-quiet'));
          q.visual(ui);
        } else if (!A.canHear()) {
          const note = h('div.callout.callout-warn', null,
            h('p', null, 'This question uses sound, and sound is currently off or muted.'),
            h('div.row', null,
              MC.util.btn('Turn sound on', () => { A.enable().then(() => { A.setMuted(false); show(q, attempt, false); }); }, 'btn-primary btn-small'),
              MC.util.btn('Use a visual version instead', () => show(q, attempt, true), 'btn-small')));
          area.appendChild(note);
          q.render(ui);
        } else {
          tools.appendChild(MC.util.btn('Can’t listen right now? Visual version', () => show(q, attempt, true), 'btn-quiet'));
          q.render(ui);
        }
      } else q.render(ui);
    }

    function summary() {
      scope.run();
      MC.util.clear(root);
      const counted = results.filter((r) => r && !r.skipped);
      const correct = counted.filter((r) => r.correct).length;
      const total = counted.length;
      const pct = total ? correct / total : 0;
      let headline = `${correct} of ${total} right on the first try`;
      const lines = [];
      let passed = null;
      if (cfg.mode === 'check' && cfg.lessonId) {
        passed = MC.store.recordCheck(cfg.lessonId, correct, total);
        lines.push(passed
          ? '<strong>Understanding demonstrated.</strong> This lesson is now marked “Demonstrated”.'
          : '<strong>Not demonstrated yet.</strong> That is normal — the missed items were added to your review queue.');
        lines.push('<span class="small muted">Rule: “Demonstrated” needs at least 80% right on first tries, without hints, in a set of 5 or more questions.</span>');
      } else if (cfg.mode === 'guided' && cfg.lessonId) {
        MC.store.markPractised(cfg.lessonId);
        lines.push('This practice set is recorded as <strong>practised</strong>. Hints are fine here — the check step comes next.');
      } else if (cfg.mode === 'review') {
        MC.store.logSession('review', `${correct}/${total}`);
        lines.push('Items you got right move to a longer review delay; missed items come back soon.');
      } else {
        MC.store.logSession('practice', `${correct}/${total}`);
      }
      const missed = counted.filter((r) => !r.correct).length;
      if (missed) lines.push(`${missed} item${missed > 1 ? 's' : ''} will come back in your review queue.`);
      root.append(
        h('div.quiz-summary.stack', null,
          h('div.eyebrow', null, cfg.title || 'Results'),
          h('div.score-big', null, headline),
          h('div.meter' + (pct >= 0.8 ? '.meter-ok' : ''), { role: 'img', 'aria-label': `Score ${Math.round(pct * 100)} percent` }, h('span', { style: { width: Math.round(pct * 100) + '%' } })),
          ...lines.map((l) => h('p', { html: l })),
          h('div.quiz-actions', null,
            MC.util.btn('↻ New set of questions', () => { plan = buildPlan(cfg); start(); }),
            cfg.onDone ? MC.util.btn(cfg.doneLabel || 'Continue →', () => cfg.onDone({ correct, total, passed }), 'btn-primary') : null)),
      );
      if (cfg.onFinish) cfg.onFinish({ correct, total, passed });
    }

    start();
    return { el: root, restart: start };
  };
})(window.MC = window.MC || {});
