/* DOM helpers, small UI primitives (modal, toast, disclosure), lifecycle cleanup. */
(function (MC) {
  'use strict';
  const U = (MC.util = {});
  const SVGNS = 'http://www.w3.org/2000/svg';
  // Components pass optional parts as null/false; native append() would print them as text.
  [Element.prototype, DocumentFragment.prototype].forEach((proto) => {
    const nativeAppend = proto.append;
    proto.append = function (...kids) { return nativeAppend.apply(this, kids.filter((k) => k != null && k !== false)); };
  });

  /* h('div.cls#id', {attrs}, ...children) */
  U.h = function (sel, attrs, ...kids) {
    const m = /^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i.exec(sel) || [];
    const el = document.createElement(m[1] || 'div');
    (m[2] || '').replace(/([.#])([\w-]+)/g, (_, t, v) => { if (t === '.') el.classList.add(v); else el.id = v; });
    applyAttrs(el, attrs);
    append(el, kids);
    return el;
  };
  U.s = function (tag, attrs, ...kids) {
    const el = document.createElementNS(SVGNS, tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) { if (v != null && v !== false) el.setAttribute(k, v); }
    append(el, kids);
    return el;
  };
  function applyAttrs(el, attrs) {
    if (!attrs) return;
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  function append(el, kids) {
    for (const k of kids.flat(Infinity)) {
      if (k == null || k === false) continue;
      el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
    }
  }
  U.clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  U.html = (str) => { const t = document.createElement('template'); t.innerHTML = str; return t.content; };
  U.btn = (label, onClick, cls, attrs) => U.h('button.btn' + (cls ? '.' + cls.split(' ').join('.') : ''), Object.assign({ type: 'button', onclick: onClick }, attrs || {}), label);

  /* Lifecycle: components register cleanups; the router calls U.cleanup() on navigation. */
  let cleanups = [];
  U.onCleanup = (fn) => { cleanups.push(fn); return fn; };
  U.cleanup = () => { const c = cleanups; cleanups = []; c.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } }); };
  /* Scoped cleanups for sub-parts that re-render (e.g. quiz questions). */
  U.scope = () => {
    const fns = [];
    return { add: (fn) => { fns.push(fn); return fn; }, run: () => { fns.splice(0).forEach((fn) => { try { fn(); } catch (e) { console.error(e); } }); } };
  };

  U.reducedMotion = () => {
    const s = MC.store && MC.store.setting('reducedMotion');
    if (s === 'on') return true;
    if (s === 'off') return false;
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  U.toast = function (msg, kind) {
    let host = document.getElementById('toasts');
    if (!host) { host = U.h('div#toasts', { 'aria-live': 'polite', role: 'status' }); document.body.appendChild(host); }
    const t = U.h('div.toast' + (kind ? '.toast-' + kind : ''), null, msg);
    host.appendChild(t);
    setTimeout(() => t.classList.add('out'), 3200);
    setTimeout(() => t.remove(), 3700);
  };

  /* Accessible modal dialog. Returns close(). */
  U.modal = function (title, body, actions) {
    const prev = document.activeElement;
    const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey, true); if (prev && prev.focus) prev.focus(); };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if (e.key === 'Tab') {
        const f = wrap.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    const dlg = U.h('div.modal', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'modal-title' },
      U.h('h2#modal-title', null, title),
      U.h('div.modal-body', null, body),
      U.h('div.modal-actions', null, (actions || [{ label: 'Close' }]).map((a) => U.btn(a.label, () => { if (!a.onClick || a.onClick() !== false) close(); }, a.cls || ''))));
    const wrap = U.h('div.modal-wrap', { onclick: (e) => { if (e.target === wrap) close(); } }, dlg);
    document.body.appendChild(wrap);
    document.addEventListener('keydown', onKey, true);
    setTimeout(() => { const b = dlg.querySelector('input, textarea, .btn'); if (b) b.focus(); }, 10);
    return close;
  };

  U.details = (summary, content, open) => U.h('details.more', open ? { open: true } : null, U.h('summary', null, summary), U.h('div.more-body', null, content));
  U.pct = (x) => Math.round((x || 0) * 100) + '%';
  U.plural = (n, w, pl) => `${n} ${n === 1 ? w : pl || w + 's'}`;
  U.fmtDate = (t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  U.relTime = (t) => {
    const d = t - Date.now();
    const m = Math.round(Math.abs(d) / 60000);
    if (m < 1) return 'now';
    if (m < 60) return d > 0 ? `in ${m} min` : `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return d > 0 ? `in ${h} h` : `${h} h ago`;
    const days = Math.round(h / 24);
    return d > 0 ? `in ${days} day${days > 1 ? 's' : ''}` : `${days} day${days > 1 ? 's' : ''} ago`;
  };
  U.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  U.download = function (filename, text) {
    try {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = U.h('a', { href: url, download: filename });
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
      return true;
    } catch (e) { return false; }
  };
  U.segmented = function (options, value, onChange, label) {
    const wrap = U.h('div.seg', { role: 'radiogroup', 'aria-label': label || '' });
    const render = () => {
      U.clear(wrap);
      options.forEach((o) => {
        const b = U.h('button.seg-btn', { type: 'button', role: 'radio', 'aria-checked': String(o.value === value), onclick: () => { value = o.value; render(); onChange(o.value); } }, o.label);
        wrap.appendChild(b);
      });
    };
    render();
    wrap.set = (v) => { value = v; render(); };
    return wrap;
  };
  U.slider = function (label, min, max, step, value, onInput, fmt) {
    const id = 'sl' + Math.random().toString(36).slice(2, 8);
    const out = U.h('output', { for: id }, fmt ? fmt(value) : value);
    const inp = U.h('input', { id, type: 'range', min, max, step, value, oninput: (e) => { const v = +e.target.value; out.textContent = fmt ? fmt(v) : v; onInput(v); } });
    const wrap = U.h('label.slider', { for: id }, U.h('span.slider-label', null, label), inp, out);
    wrap.input = inp;
    wrap.set = (v) => { inp.value = v; out.textContent = fmt ? fmt(v) : v; };
    return wrap;
  };
})(window.MC = window.MC || {});
