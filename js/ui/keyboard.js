/* Playable piano keyboard with realistic black-key placement, labels, finger numbers,
   computer-key mapping labels, highlights, pointer (mouse/touch) and keyboard access. */
(function (MC) {
  'use strict';
  const { h } = MC.util;
  const T = MC.theory;
  const I = MC.input;
  const WHITE_IDX = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };
  /* Black-key centres in white-key units from C (C–E split in 5, F–B split in 7). */
  const BLACK_CENTER = { 1: 0.9, 3: 2.1, 6: 3 + 6 / 7, 8: 5, 10: 6 + 1 / 7 };
  const BLACK_W = 0.58;
  const absWhite = (m) => Math.floor(m / 12) * 7 + WHITE_IDX[T.mod(m, 12)];
  const absBlack = (m) => Math.floor(m / 12) * 7 + BLACK_CENTER[T.mod(m, 12)];
  const active = []; // stack of keyboards that own computer-key mapping

  function describe(midi) {
    const nm = T.keyName(midi);
    return midi === 60 ? `${nm}, middle C` : nm;
  }

  MC.Keyboard = function (opts) {
    const o = Object.assign({
      from: 48, to: 72, labels: 'c', showOct: true, fingers: null, hand: 'rh', interactive: true,
      onNote: null, minKeyPx: 30, height: null, ariaLabel: 'Piano keyboard', mapBase: null,
      ownsInput: true, showMapLegend: true, markMiddleC: true, groups: false, compact: false,
    }, opts);
    if (T.isBlack(o.from)) o.from -= 1;
    if (T.isBlack(o.to)) o.to += 1;
    const marks = new Map(); // midi -> Map(cls -> tag)
    const keyEls = new Map();
    let win = { from: o.from, to: o.to };
    let focusMidi = null;
    const pointers = new Map();
    let destroyed = false;

    const root = h('div.kbd-wrap' + (o.compact ? '.kbd-compact' : ''));
    const nav = h('div.kbd-nav');
    const kbd = h('div.kbd', { role: 'group', 'aria-label': o.ariaLabel + ' — use arrow keys to move, Enter or Space to play' });
    const stage = h('div.kbd-stage', null, kbd);
    const legend = h('div.kbd-legend');
    root.append(nav, stage, legend);
    let hands = []; // [{ hand: 'rh'|'lh', fingers: {1: midi, …, 5: midi}, numbers }]
    const handParts = []; // [{ hand, midi, parts }] for the hands currently drawn
    const pressed = new Set(); // keys a drawn finger is pressing
    const hinted = new Set(); // 'rh:60' — fingers that should play next
    let entering = new Set(); // hands that just moved: animate them in
    let handSvg = null;
    const btnLow = MC.util.btn('◀ Lower', () => shiftWindow(-7), 'btn-small btn-quiet', { 'aria-label': 'Show lower keys' });
    const btnHigh = MC.util.btn('Higher ▶', () => shiftWindow(7), 'btn-small btn-quiet', { 'aria-label': 'Show higher keys' });
    const winLabel = h('span.kbd-winlabel');
    nav.append(btnLow, winLabel, btnHigh);
    if (o.height) kbd.style.setProperty('--kbd-h', o.height + 'px');

    function whiteCount(a, b) { return absWhite(b) - absWhite(a) + 1; }
    function fitWindow() {
      const w = root.clientWidth || kbd.clientWidth || 600;
      const total = whiteCount(o.from, o.to);
      const fit = Math.max(8, Math.floor(w / o.minKeyPx));
      if (total <= fit) { win = { from: o.from, to: o.to }; nav.hidden = true; return; }
      nav.hidden = false;
      // keep the current window start if the size is unchanged; otherwise centre on a mark or middle C
      const span = fit - 1;
      const minW = absWhite(o.from);
      const maxW = absWhite(o.to) - span;
      let startW;
      if (absWhite(win.to) - absWhite(win.from) === span) startW = absWhite(win.from);
      else {
        let c = marks.size ? [...marks.keys()][0] : (o.mapBase || (o.from <= 60 && o.to >= 60 ? 60 : o.from));
        if (T.isBlack(c)) c -= 1;
        startW = absWhite(c) - Math.floor(span / 2);
      }
      startW = Math.max(minW, Math.min(maxW, startW));
      win = { from: whiteToMidi(startW), to: whiteToMidi(startW + span) };
    }
    function whiteToMidi(wi) {
      const oct = Math.floor(wi / 7);
      const idx = T.mod(wi, 7);
      return (oct) * 12 + [0, 2, 4, 5, 7, 9, 11][idx];
    }
    function shiftWindow(dw) {
      const span = absWhite(win.to) - absWhite(win.from);
      let s = absWhite(win.from) + dw;
      s = Math.max(absWhite(o.from), Math.min(absWhite(o.to) - span, s));
      win = { from: whiteToMidi(s), to: whiteToMidi(s + span) };
      build();
    }
    function showSpan(lo, hi) {
      if (lo >= win.from && hi <= win.to) return;
      // A hand diagram must fit all of its fingers, including on a narrow screen.
      const needed = absWhite(T.isBlack(hi) ? hi + 1 : hi) - absWhite(T.isBlack(lo) ? lo - 1 : lo);
      const span = Math.max(absWhite(win.to) - absWhite(win.from), needed);
      const mid = (absWhite(T.isBlack(lo) ? lo - 1 : lo) + absWhite(T.isBlack(hi) ? hi + 1 : hi)) / 2;
      let s = Math.round(mid - span / 2);
      s = Math.max(absWhite(o.from), Math.min(absWhite(o.to) - span, s));
      win = { from: whiteToMidi(s), to: whiteToMidi(s + span) };
      nav.hidden = win.from === o.from && win.to === o.to;
      build();
    }
    function ensureVisible(midi) {
      if (midi >= win.from && midi <= win.to) return;
      if (midi < o.from || midi > o.to) return;
      const span = absWhite(win.to) - absWhite(win.from);
      let s = absWhite(T.isBlack(midi) ? midi - 1 : midi) - Math.floor(span / 2);
      s = Math.max(absWhite(o.from), Math.min(absWhite(o.to) - span, s));
      win = { from: whiteToMidi(s), to: whiteToMidi(s + span) };
      build();
    }

    function labelFor(midi) {
      const pc = T.mod(midi, 12);
      const oct = Math.floor(midi / 12) - 1;
      const black = T.isBlack(midi);
      const L = o.labels;
      if (L === 'none') return '';
      if (L === 'c') return pc === 0 ? 'C' + (o.showOct ? oct : '') : '';
      if (black) {
        if (L !== 'all') return '';
        const s = T.fromMidi(midi, 'sharp');
        const f = T.fromMidi(midi, 'flat');
        return `${s.letter}♯\n${f.letter}♭`;
      }
      return T.letterOf(midi) + (o.showOct && (pc === 0 || L === 'all-oct') ? oct : '');
    }

    function build() {
      MC.util.clear(kbd);
      keyEls.clear();
      const baseW = absWhite(win.from);
      const nW = whiteCount(win.from, win.to);
      winLabel.textContent = `${T.keyName(win.from)} – ${T.keyName(win.to)}`;
      btnLow.disabled = win.from <= o.from;
      btnHigh.disabled = win.to >= o.to;
      for (let m = win.from; m <= win.to; m++) {
        const black = T.isBlack(m);
        const el = h('div.key.' + (black ? 'black' : 'white'), { role: 'button', tabindex: '-1', 'aria-label': describe(m), dataset: { midi: m } });
        if (black) {
          const c = absBlack(m) - baseW;
          el.style.left = ((c - BLACK_W / 2) / nW) * 100 + '%';
          el.style.width = (BLACK_W / nW) * 100 + '%';
        } else {
          const i = absWhite(m) - baseW;
          el.style.left = (i / nW) * 100 + '%';
          el.style.width = (1 / nW) * 100 + '%';
        }
        const lab = labelFor(m);
        el.append(h('span.key-tag'), h('span.key-finger'), h('span.key-name', null, lab), h('span.key-map'));
        if (m === 60 && o.markMiddleC) el.classList.add('is-middle-c');
        if (o.groups && black) {
          const pc = T.mod(m, 12);
          el.classList.add(pc === 1 || pc === 3 ? 'grp2' : 'grp3');
        }
        kbd.appendChild(el);
        keyEls.set(m, el);
      }
      if (focusMidi == null || !keyEls.has(focusMidi)) focusMidi = keyEls.has(60) ? 60 : win.from;
      const fe = keyEls.get(focusMidi);
      if (fe) fe.tabIndex = 0;
      renderFingers();
      renderMarks();
      renderMap();
      renderHeld();
      renderHands();
    }

    /* Hands resting on the keys: an SVG layer over the keyboard, fingertips on their keys,
       palms below the front edge. Redrawn whenever the visible keys or the width change. */
    function renderHands() {
      if (handSvg) { handSvg.remove(); handSvg = null; }
      handParts.length = 0;
      root.classList.toggle('with-hands', hands.length > 0);
      if (!hands.length) { stage.style.paddingBottom = ''; return; }
      const white = [...keyEls.values()].find((el) => el.classList.contains('white'));
      const W = stage.clientWidth;
      if (!W || !white || !white.offsetWidth) return;
      const keyW = white.offsetWidth;
      const H = white.offsetHeight;
      const top = kbd.offsetTop + kbd.clientTop;
      const left = kbd.offsetLeft + kbd.clientLeft;
      const fw = Math.max(10, Math.min(27, keyW * 0.56));
      const room = Math.round(Math.max(65, Math.min(140, fw * 4.7)));
      stage.style.paddingBottom = room + 'px';
      const total = top + H + room;
      handSvg = MC.util.s('svg', { class: 'hands-layer', width: W, height: total, viewBox: `0 0 ${W} ${total}`, 'aria-hidden': 'true' });
      const shared = {};
      hands.forEach((hd) => Object.values(hd.fingers).forEach((m) => { shared[m] = (shared[m] || 0) + 1; }));
      const REACH = { 1: 0.95, 2: 0.76, 3: 0.73, 4: 0.77, 5: 0.85 };
      hands.forEach((hd) => {
        const tips = {};
        for (const f of [1, 2, 3, 4, 5]) {
          const m = hd.fingers[f];
          const el = keyEls.get(m);
          if (!el) return; // this hand is not fully inside the visible keys
          let x = left + el.offsetLeft + el.offsetWidth / 2;
          if (shared[m] > 1) x += (hd.hand === 'rh' ? 1 : -1) * el.offsetWidth * 0.2; // e.g. both thumbs on middle C
          tips[f] = { x, y: top + H * (el.classList.contains('black') ? 0.42 : REACH[f]) };
        }
        const d = MC.Hand.draw(handSvg, { hand: hd.hand, pose: 'keyboard', tips, fw, baseY: top + H, fadeTo: total, numbers: hd.numbers !== false, label: fw >= 17 });
        if (entering.has(hd.hand)) d.g.classList.add('hk-enter');
        [1, 2, 3, 4, 5].forEach((f) => handParts.push({ hand: hd.hand, midi: hd.fingers[f], parts: d.parts[f] }));
      });
      stage.appendChild(handSvg);
      entering = new Set();
      renderPressed();
    }
    function renderPressed() {
      handParts.forEach((p) => {
        const next = hinted.has(p.hand + ':' + p.midi);
        p.parts.forEach((el) => { el.classList.toggle('down', pressed.has(p.midi)); el.classList.toggle('next', next); });
      });
    }

    function renderFingers() {
      for (const [m, el] of keyEls) {
        const f = o.fingers && o.fingers[m];
        const fe = el.querySelector('.key-finger');
        fe.textContent = f ? String(f) : '';
        el.classList.toggle('has-finger', !!f);
        el.classList.toggle('finger-lh', !!f && (o.fingerHand ? o.fingerHand[m] === 'lh' : o.hand === 'lh'));
      }
    }
    function renderMarks() {
      for (const [m, el] of keyEls) {
        el.className = el.className.split(' ').filter((c) => !c.startsWith('hl-')).join(' ');
        const mk = marks.get(m);
        const tagEl = el.querySelector('.key-tag');
        tagEl.textContent = '';
        if (!mk) continue;
        for (const [cls, tag] of mk) {
          el.classList.add('hl-' + cls);
          if (tag) tagEl.textContent = tag;
        }
      }
    }
    function isOwner() { return o.ownsInput && active[active.length - 1] === api; }
    function renderMap() {
      const show = isOwner() && MC.store.setting('showMap') !== false;
      const base = I.base();
      for (const [m, el] of keyEls) {
        const k = show ? I.keyFor(m) : null;
        el.querySelector('.key-map').textContent = k ? (k === ';' ? ';' : k.toUpperCase()) : '';
      }
      if (o.showMapLegend && isOwner()) {
        legend.hidden = false;
        legend.innerHTML = '';
        legend.append(
          h('span', null, 'Computer keys: '),
          h('kbd', null, 'A'), '–', h('kbd', null, "'"), ' white, ',
          h('kbd', null, 'W E T Y U O P'), ' black. ',
          h('kbd', null, 'Z'), '/', h('kbd', null, 'X'), ` octave down/up (now ${T.keyName(base)}–${T.keyName(base + 17)}).`,
        );
        if (MC.store.setting('showMap') === false) legend.hidden = true;
      } else legend.hidden = true;
    }
    function renderHeld() {
      for (const [m, el] of keyEls) el.classList.toggle('is-down', I.held.has(m));
    }

    /* Pointer input: supports multi-touch and sliding (glissando). */
    function keyAt(x, y) {
      const el = document.elementFromPoint(x, y);
      const k = el && el.closest && el.closest('.key');
      return k && kbd.contains(k) ? +k.dataset.midi : null;
    }
    kbd.addEventListener('pointerdown', (e) => {
      if (!o.interactive) return;
      const m = keyAt(e.clientX, e.clientY);
      if (m == null) return;
      e.preventDefault();
      try { kbd.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      pointers.set(e.pointerId, m);
      setFocus(m, false);
      I.noteOn(m, 'ptr:' + e.pointerId, pointerVel(e));
    });
    kbd.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      const m = keyAt(e.clientX, e.clientY);
      const prev = pointers.get(e.pointerId);
      if (m == null || m === prev) return;
      I.noteOff(prev, 'ptr:' + e.pointerId);
      pointers.set(e.pointerId, m);
      I.noteOn(m, 'ptr:' + e.pointerId, pointerVel(e));
    });
    const endPtr = (e) => {
      if (!pointers.has(e.pointerId)) return;
      I.noteOff(pointers.get(e.pointerId), 'ptr:' + e.pointerId);
      pointers.delete(e.pointerId);
    };
    kbd.addEventListener('pointerup', endPtr);
    kbd.addEventListener('pointercancel', endPtr);
    kbd.addEventListener('lostpointercapture', endPtr);
    kbd.addEventListener('contextmenu', (e) => e.preventDefault());
    function pointerVel(e) {
      // On-screen keys cannot sense force; use the loudness setting (pressure only if a pen reports it).
      const base = MC.audio.getVelocity();
      return e.pointerType === 'pen' && e.pressure ? Math.max(0.2, e.pressure) : base;
    }

    /* Keyboard focus navigation on keys. */
    function setFocus(m, move) {
      const old = keyEls.get(focusMidi);
      if (old) old.tabIndex = -1;
      focusMidi = m;
      ensureVisible(m);
      const el = keyEls.get(m);
      if (el) { el.tabIndex = 0; if (move) el.focus(); }
    }
    const kbHeld = new Set();
    kbd.addEventListener('keydown', (e) => {
      const k = e.target.closest('.key');
      if (!k) return;
      const m = +k.dataset.midi;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const n = m + (e.key === 'ArrowRight' ? 1 : -1);
        if (n >= o.from && n <= o.to) setFocus(n, true);
      } else if (e.key === 'Home') { e.preventDefault(); setFocus(o.from, true); }
      else if (e.key === 'End') { e.preventDefault(); setFocus(o.to, true); }
      else if ((e.key === 'Enter' || e.key === ' ') && !I.hasTapListeners()) {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat && !kbHeld.has(m)) { kbHeld.add(m); I.noteOn(m, 'focus'); }
      }
    });
    kbd.addEventListener('keyup', (e) => {
      const k = e.target.closest('.key');
      if (!k) return;
      if (e.key === 'Enter' || e.key === ' ') { const m = +k.dataset.midi; kbHeld.delete(m); I.noteOff(m, 'focus'); }
    });
    kbd.addEventListener('focusout', () => { for (const m of kbHeld) I.noteOff(m, 'focus'); kbHeld.clear(); });

    const unsub = I.subscribe((ev) => {
      if (handParts.length) {
        if (ev.source === 'all') pressed.clear();
        else if (handParts.some((p) => p.midi === ev.midi)) { if (ev.type === 'on') pressed.add(ev.midi); else if (!I.held.has(ev.midi)) pressed.delete(ev.midi); }
        renderPressed();
      }
      const el = keyEls.get(ev.midi);
      if (el) el.classList.toggle('is-down', ev.type === 'on' || I.held.has(ev.midi));
      else if (ev.type === 'on' && ev.midi >= o.from && ev.midi <= o.to && ev.source.startsWith('key')) ensureVisible(ev.midi);
      if (ev.type === 'off' && ev.source === 'all') renderHeld();
      if (o.onNote && ev.midi >= o.from && ev.midi <= o.to) o.onNote(ev);
      else if (o.onNote && o.acceptOutOfRange) o.onNote(ev);
    });
    const unBase = I.onBase(() => { if (isOwner()) renderMap(); });

    let ro = null;
    const api = {
      el: root,
      opts: o,
      setMark(midi, cls, tag) { if (!marks.has(midi)) marks.set(midi, new Map()); marks.get(midi).set(cls, tag || ''); renderMarks(); if (cls !== 'play') ensureVisible(midi); return api; },
      setMarks(list, cls) { list.forEach((m) => { if (!marks.has(m.midi != null ? m.midi : m)) marks.set(m.midi != null ? m.midi : m, new Map()); marks.get(m.midi != null ? m.midi : m).set(m.cls || cls, m.tag || ''); }); renderMarks(); if (list.length) ensureVisible(list[0].midi != null ? list[0].midi : list[0]); return api; },
      unmark(midi, cls) { const mk = marks.get(midi); if (mk) { if (cls) mk.delete(cls); else mk.clear(); if (!mk.size) marks.delete(midi); } renderMarks(); return api; },
      clearMarks(cls) { if (!cls) marks.clear(); else for (const [m, mk] of marks) { mk.delete(cls); if (!mk.size) marks.delete(m); } renderMarks(); return api; },
      flash(midi, cls, ms, tag) { api.setMark(midi, cls, tag); setTimeout(() => { if (!destroyed) api.unmark(midi, cls); }, ms || 600); },
      setFingers(map, hand, perKeyHand) { o.fingers = map; if (hand) o.hand = hand; o.fingerHand = perKeyHand || null; renderFingers(); return api; },
      setLabels(mode) { o.labels = mode; build(); return api; },
      /* list: [{ hand, fingers: {1..5: midi}, numbers }] — draws hands resting on those keys; [] removes them. */
      setHands(list) {
        const before = Object.fromEntries(hands.map((hd) => [hd.hand, JSON.stringify(hd.fingers)]));
        hands = (list || []).filter(Boolean);
        entering = new Set(hands.filter((hd) => before[hd.hand] !== JSON.stringify(hd.fingers)).map((hd) => hd.hand));
        pressed.clear();
        const ms = hands.flatMap((hd) => Object.values(hd.fingers));
        if (ms.length) showSpan(Math.min(...ms), Math.max(...ms));
        renderHands();
        return api;
      },
      /* list: [{ hand, midi }] — those fingers are marked as the ones to play next. */
      hintFinger(list) { hinted.clear(); (list || []).forEach((x) => hinted.add(x.hand + ':' + x.midi)); renderPressed(); return api; },
      pressFinger(midi, on) { if (on) pressed.add(midi); else if (midi == null) pressed.clear(); else pressed.delete(midi); renderPressed(); return api; },
      setGroups(on) { o.groups = on; build(); return api; },
      setRange(from, to) { o.from = T.isBlack(from) ? from - 1 : from; o.to = T.isBlack(to) ? to + 1 : to; win = { from: o.from, to: o.to }; fitWindow(); build(); return api; },
      show(midi) { ensureVisible(midi); },
      activate() {
        const i = active.indexOf(api);
        if (i >= 0) active.splice(i, 1);
        active.push(api);
        if (o.ownsInput) {
          let b = o.mapBase != null ? o.mapBase : null;
          if (b == null) {
            b = o.from <= 60 && o.to >= 64 ? 60 : Math.ceil(o.from / 12) * 12;
            if (o.to - b < 12 && o.from <= b - 12) b -= 12;
          }
          I.setBase(b - T.mod(b, 12));
        }
        active.forEach((k) => k.refreshMap && k.refreshMap());
        return api;
      },
      refreshMap() { renderMap(); },
      range() { return { from: o.from, to: o.to }; },
      destroy() {
        destroyed = true;
        unsub(); unBase();
        if (ro) ro.disconnect();
        for (const [id, m] of pointers) I.noteOff(m, 'ptr:' + id);
        for (const m of kbHeld) I.noteOff(m, 'focus');
        const i = active.indexOf(api);
        if (i >= 0) active.splice(i, 1);
        const top = active[active.length - 1];
        if (top) top.activate();
      },
    };
    fitWindow();
    build();
    if (window.ResizeObserver) {
      let lastW = 0;
      // Rebuild on the next frame: changing layout inside the observer callback triggers loop warnings.
      ro = new ResizeObserver(() => requestAnimationFrame(() => {
        if (destroyed) return;
        const w = root.clientWidth;
        if (Math.abs(w - lastW) < 4) return;
        lastW = w;
        const before = `${win.from}-${win.to}`;
        fitWindow();
        if (hands.length) { const ms = hands.flatMap((hd) => Object.values(hd.fingers)); if (ms.length && (Math.min(...ms) < win.from || Math.max(...ms) > win.to)) { showSpan(Math.min(...ms), Math.max(...ms)); return; } }
        if (`${win.from}-${win.to}` !== before || !keyEls.size) build();
        else if (hands.length) renderHands();
      }));
      ro.observe(root);
    }
    if (o.ownsInput) api.activate();
    MC.util.onCleanup(() => { if (!destroyed) api.destroy(); });
    return api;
  };
  MC.Keyboard.describe = describe;
})(window.MC = window.MC || {});
