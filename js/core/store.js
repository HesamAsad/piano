/* Progress store: localStorage persistence with in-memory fallback, lesson states,
   spaced review (Leitner boxes), skill summaries, practice log, export/import/reset. */
(function (MC) {
  'use strict';
  const S = (MC.store = {});
  const KEY = 'middle-c-workbook-v1';
  const DAY = 86400000;
  /* Review intervals per box (box 1 = just missed or new). */
  S.BOX_DELAY = [0, 10 * 60000, DAY, 3 * DAY, 7 * DAY, 16 * DAY];
  /* A skill bar is full when about this many items are secure (right on several separate days). */
  S.SKILL_TARGET = 20;
  S.SKILLS = {
    keyboard: { label: 'Keyboard knowledge', desc: 'Finding and naming keys, octaves, half and whole steps.' },
    reading: { label: 'Pitch reading', desc: 'Naming and playing notes from treble, bass and grand staff.' },
    rhythm: { label: 'Rhythm', desc: 'Note values, counting, measures and tapping in time.' },
    listening: { label: 'Listening', desc: 'Hearing higher/lower, direction, tempo, intervals and chord colour.' },
    chords: { label: 'Scales & chords', desc: 'Building scales, key signatures and triads.' },
  };

  const fresh = () => ({
    version: 1,
    created: Date.now(),
    lessons: {},
    items: {},
    pieces: {},
    log: [],
    settings: { labels: 'auto', showMap: true, tolerance: 'beginner', latencyMs: null, reducedMotion: 'auto', volume: 0.8 },
    last: null,
  });

  let data = fresh();
  S.available = false;
  let saveTimer = null;
  const listeners = new Set();
  S.on = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  const changed = () => listeners.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });

  function testStorage() {
    try {
      const k = '__mc_test__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  }

  S.load = function () {
    S.available = testStorage();
    if (!S.available) return data;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) data = merge(fresh(), JSON.parse(raw));
    } catch (e) { data = fresh(); }
    return data;
  };
  function merge(base, obj) {
    if (!obj || typeof obj !== 'object') return base;
    for (const k of Object.keys(base)) {
      if (obj[k] === undefined) continue;
      if (k === 'settings') base.settings = Object.assign(base.settings, obj.settings || {});
      else base[k] = obj[k];
    }
    return base;
  }
  S.save = function (immediate) {
    changed();
    if (!S.available) return;
    clearTimeout(saveTimer);
    const write = () => {
      try { window.localStorage.setItem(KEY, JSON.stringify(data)); }
      catch (e) { S.available = false; changed(); }
    };
    if (immediate) write();
    else saveTimer = setTimeout(write, 250);
  };
  window.addEventListener('pagehide', () => S.save(true));
  S.data = () => data;
  S.isNew = () => !data.last && Object.keys(data.lessons).length === 0;

  /* ---------- Settings ---------- */
  S.setting = (k) => data.settings[k];
  S.setSetting = (k, v) => { data.settings[k] = v; S.save(); };

  /* ---------- Lessons ----------
     completed   = you worked through every step to the recap
     practised   = you finished a guided practice set (or logged real-piano practice)
     demonstrated = you scored ≥ 80% on the check, first tries, no hints */
  S.lesson = (id) => {
    if (!data.lessons[id]) data.lessons[id] = { visited: [], completed: false, practised: 0, demonstrated: false, best: null, attempts: 0, realPiano: 0, lastStep: 0, updated: 0 };
    return data.lessons[id];
  };
  S.peekLesson = (id) => data.lessons[id] || null;
  S.visitStep = (id, step) => {
    const l = S.lesson(id);
    if (!l.visited.includes(step)) l.visited.push(step);
    l.lastStep = step;
    l.updated = Date.now();
    data.last = { lesson: id, step, at: Date.now() };
    S.save();
  };
  S.completeLesson = (id) => { const l = S.lesson(id); if (!l.completed) { l.completed = true; l.completedAt = Date.now(); } S.save(); };
  S.markPractised = (id) => { const l = S.lesson(id); l.practised = (l.practised || 0) + 1; l.practisedAt = Date.now(); S.save(); };
  S.recordCheck = (id, correct, total) => {
    const l = S.lesson(id);
    const pct = total ? correct / total : 0;
    l.attempts += 1;
    l.best = Math.max(l.best || 0, pct);
    l.lastCheck = { correct, total, at: Date.now() };
    const passed = total >= 5 && pct >= 0.8;
    if (passed) { l.demonstrated = true; l.demonstratedAt = l.demonstratedAt || Date.now(); }
    S.save();
    return passed;
  };
  S.logRealPiano = (lessonId, minutes, note) => {
    if (lessonId) { const l = S.lesson(lessonId); l.realPiano = (l.realPiano || 0) + 1; }
    data.log.push({ at: Date.now(), lesson: lessonId || null, minutes: minutes || 0, note: note || '', kind: 'real-piano' });
    S.save();
  };
  S.logSession = (kind, detail) => {
    data.log.push({ at: Date.now(), kind, detail: detail || '' });
    if (data.log.length > 400) data.log.splice(0, data.log.length - 400);
    S.save();
  };

  /* ---------- Spaced review items ---------- */
  S.recordAnswer = function (itemKey, skill, correct, meta) {
    if (!itemKey) return;
    const now = Date.now();
    const it = data.items[itemKey] || (data.items[itemKey] = { skill, box: 0, due: 0, seen: 0, right: 0, wrong: 0, last: 0, lastWrong: 0, days: [] });
    it.skill = skill || it.skill;
    it.seen++;
    const day = new Date(now).toDateString();
    if (correct) {
      it.right++;
      // Only move up one box per calendar day, so "secure" means correct on separate days.
      const sameDay = it.lastUp && new Date(it.lastUp).toDateString() === day;
      if (!sameDay || it.box === 0) { it.box = Math.min(5, it.box + 1); it.lastUp = now; }
      it.due = now + S.BOX_DELAY[it.box];
    } else {
      it.wrong++;
      it.lastWrong = now;
      it.box = 1;
      it.due = now + S.BOX_DELAY[1];
    }
    if (!it.days.includes(day)) { it.days.push(day); if (it.days.length > 12) it.days.shift(); }
    it.last = now;
    if (meta && meta.gen) it.gen = meta.gen;
    if (meta && meta.params) it.params = meta.params;
    S.save();
  };
  S.dueItems = function (limit) {
    const now = Date.now();
    const list = Object.entries(data.items)
      .filter(([, it]) => it.gen && it.due <= now)
      .sort((a, b) => {
        const wa = a[1].lastWrong && a[1].box <= 1 ? 1 : 0;
        const wb = b[1].lastWrong && b[1].box <= 1 ? 1 : 0;
        if (wa !== wb) return wb - wa;
        return a[1].due - b[1].due;
      })
      .map(([key, it]) => Object.assign({ key }, it));
    return limit ? list.slice(0, limit) : list;
  };
  S.nextDue = function () {
    const future = Object.values(data.items).filter((it) => it.gen && it.due > Date.now()).map((it) => it.due);
    return future.length ? Math.min(...future) : null;
  };
  S.skillSummary = function () {
    const out = {};
    for (const k of Object.keys(S.SKILLS)) out[k] = { seen: 0, secure: 0, shaky: 0, learning: 0, score: 0 };
    for (const it of Object.values(data.items)) {
      const s = out[it.skill];
      if (!s) continue;
      s.seen++;
      if (it.box >= 3) s.secure++;
      else if (it.box <= 1 && it.lastWrong) s.shaky++;
      else s.learning++;
      // Box 1 (first correct answer, or a recent mistake) adds nothing; each later day correct adds a quarter.
      s.score += Math.max(0, Math.min(it.box, 5) - 1) / 4;
    }
    for (const k of Object.keys(out)) {
      const s = out[k];
      s.pct = s.score / Math.max(s.seen, S.SKILL_TARGET);
    }
    return out;
  };

  /* ---------- Pieces ---------- */
  S.piece = (id) => data.pieces[id] || (data.pieces[id] = { watched: 0, guided: 0, independent: 0, bestPitch: null, bestRhythm: null, updated: 0 });
  S.recordPiece = (id, mode, result) => {
    const p = S.piece(id);
    p[mode] = (p[mode] || 0) + 1;
    if (result && result.pitch != null) p.bestPitch = Math.max(p.bestPitch || 0, result.pitch);
    if (result && result.rhythm != null) p.bestRhythm = Math.max(p.bestRhythm || 0, result.rhythm);
    p.updated = Date.now();
    S.save();
  };

  /* ---------- Export / import / reset ---------- */
  S.exportJSON = () => JSON.stringify({ app: 'middle-c-workbook', exported: new Date().toISOString(), data }, null, 2);
  S.importJSON = function (text) {
    let obj;
    try { obj = JSON.parse(text); } catch (e) { return { ok: false, msg: 'That file is not valid JSON.' }; }
    const d = obj && obj.app === 'middle-c-workbook' ? obj.data : obj;
    if (!d || typeof d !== 'object' || typeof d.lessons !== 'object' || typeof d.items !== 'object') {
      return { ok: false, msg: 'This does not look like a progress file from this workbook.' };
    }
    data = merge(fresh(), d);
    S.save(true);
    return { ok: true, msg: `Imported progress: ${Object.keys(data.lessons).length} lessons, ${Object.keys(data.items).length} review items.` };
  };
  S.reset = function () {
    data = fresh();
    if (S.available) { try { window.localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
    S.save(true);
  };
})(window.MC = window.MC || {});
