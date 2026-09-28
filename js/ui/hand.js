/* Hands seen from above (palms down, player at the bottom), with finger numbers 1–5.
   MC.Hand(hand)      — a stand-alone diagram of one hand with clickable fingers.
   MC.Hand.draw(svg)  — the same hand drawn over a keyboard, each fingertip resting on its key.
   Right hand: thumb on the left. Left hand: thumb on the right. */
(function (MC) {
  'use strict';
  const { s: S } = MC.util;
  const FNAME = { 1: 'thumb', 2: 'index finger', 3: 'middle finger', 4: 'ring finger', 5: 'little finger' };
  const f1 = (v) => Math.round(v * 10) / 10;
  let uid = 0;

  /* Closed Catmull-Rom spline through the points, as an SVG path. */
  function smooth(pts) {
    const n = pts.length;
    let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return d + 'Z';
  }

  /* Draws one hand into `svg`.
     spec: { hand, tips: {1..5: {x, y}} (top of each fingertip), fw (finger width), baseY (knuckles sit just below),
             fadeTo (y where the forearm has faded out), numbers, label }
     Returns { g, parts: {f: [elements]}, badges: g, fingers: {f: fill element} }. */
  function draw(svg, spec) {
    const lh = spec.hand === 'lh';
    const side = lh ? 1 : -1; // x direction of the thumb side
    const t = spec.tips;
    const u = spec.fw;
    const ow = spec.outline || Math.max(1.2, u * 0.07);
    const tc = (t[2].x + t[5].x) / 2;
    const kOff = { 2: 1.55, 3: 1.4, 4: 1.55, 5: 1.95 };
    const kn = {};
    [2, 3, 4, 5].forEach((f) => { kn[f] = { x: tc + (t[f].x - tc) * 0.9, y: spec.baseY + kOff[f] * u }; });
    const pTop = Math.min(kn[2].y, kn[3].y, kn[4].y, kn[5].y);
    const pH = u * 2.75;
    const pBot = pTop + pH;
    const pw = Math.abs(kn[5].x - kn[2].x);
    const wc = (kn[2].x + kn[5].x) / 2 + side * u * 0.15;
    const ww = pw * 0.62 + u * 0.5;
    const fade = spec.fadeTo;
    const palmD = smooth([
      [kn[2].x + side * u * 0.5, kn[2].y + u * 0.15],
      [kn[3].x, kn[3].y - u * 0.05],
      [kn[4].x, kn[4].y],
      [kn[5].x - side * u * 0.5, kn[5].y + u * 0.15],
      [kn[5].x - side * u * 0.6, pTop + pH * 0.62],
      [wc - side * ww / 2, pBot + u * 0.6],
      [wc - side * ww / 2, fade + u],
      [wc + side * ww / 2, fade + u],
      [wc + side * ww / 2, pBot + u * 0.45],
      [kn[2].x + side * u * 1.2, pTop + pH * 0.62],
      [kn[2].x + side * u * 0.62, kn[2].y + u * 0.95],
    ]);

    // Thumb: from inside the palm, a gentle outward curve up to its key.
    const tw = u * 1.14;
    const tb = { x: kn[2].x + side * u * 0.6, y: pTop + pH * 0.74 };
    const dx = t[1].x - tb.x, dy = t[1].y - tb.y, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    let px = -uy, py = ux;
    if (Math.sign(px) !== side) { px = -px; py = -py; }
    const tEnd = { x: t[1].x - ux * tw / 2, y: t[1].y - uy * tw / 2 };
    const tCtl = { x: tb.x + dx * 0.45 + px * u * 0.8, y: tb.y + dy * 0.45 + py * u * 0.8 };
    const thumbD = `M${f1(tb.x)},${f1(tb.y)} Q${f1(tCtl.x)},${f1(tCtl.y)} ${f1(tEnd.x)},${f1(tEnd.y)}`;

    // Fingers 2–5: straight, round-capped, from knuckle to tip.
    const seg = {};
    [2, 3, 4, 5].forEach((f) => { seg[f] = { x1: kn[f].x, y1: kn[f].y + u * 0.45, x2: t[f].x, y2: t[f].y + u / 2 }; });

    const id = 'hk' + (++uid);
    const defs = S('defs', null,
      S('linearGradient', { id: id + 'g', x1: 0, y1: f1(pBot), x2: 0, y2: f1(fade), gradientUnits: 'userSpaceOnUse' },
        S('stop', { offset: 0, 'stop-color': '#fff' }), S('stop', { offset: 1, 'stop-color': '#000' })),
      S('mask', { id: id + 'm', maskUnits: 'userSpaceOnUse', x: -2000, y: -2000, width: 6000, height: 6000 },
        S('rect', { x: -2000, y: -2000, width: 6000, height: 6000, fill: `url(#${id}g)` })));
    svg.appendChild(defs);
    const g = S('g', { class: 'hk ' + spec.hand, mask: `url(#${id}m)` });
    const outline = S('g', { class: 'hk-outline' });
    const fill = S('g', { class: 'hk-fill' });
    const details = S('g', { class: 'hk-details' });
    const badges = S('g', { class: 'hk-badges' });
    const parts = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    const fingers = {};

    outline.appendChild(S('path', { d: palmD, class: 'hk-palm', 'stroke-width': f1(ow * 2) }));
    const addFinger = (f, tag, attrs, width) => {
      const o = S(tag, Object.assign({ 'stroke-width': f1(width + ow * 2), 'data-f': f }, attrs));
      const i = S(tag, Object.assign({ 'stroke-width': f1(width), 'data-f': f }, attrs));
      outline.appendChild(o);
      fill.appendChild(i);
      parts[f].push(o, i);
      fingers[f] = i;
    };
    addFinger(1, 'path', { d: thumbD }, tw);
    [2, 3, 4, 5].forEach((f) => addFinger(f, 'line', { x1: f1(seg[f].x1), y1: f1(seg[f].y1), x2: f1(seg[f].x2), y2: f1(seg[f].y2) }, u));
    fill.appendChild(S('path', { d: palmD, class: 'hk-palm' })); // over the finger bases, so a highlighted finger stops at the palm

    // Nails and number badges, placed along each finger's direction.
    [1, 2, 3, 4, 5].forEach((f) => {
      const tip = t[f];
      const from = f === 1 ? tCtl : { x: kn[f].x, y: kn[f].y };
      const w = f === 1 ? tw : u;
      const ddx = from.x - tip.x, ddy = from.y - tip.y, dl = Math.hypot(ddx, ddy) || 1;
      const vx = ddx / dl, vy = ddy / dl;
      const ang = Math.atan2(vy, vx) * 180 / Math.PI - 90;
      const nc = { x: tip.x + vx * w * 0.52, y: tip.y + vy * w * 0.52 };
      const nail = S('rect', { class: 'hk-nail', x: f1(nc.x - w * 0.27), y: f1(nc.y - w * 0.3), width: f1(w * 0.54), height: f1(w * 0.6), rx: f1(w * 0.24), transform: `rotate(${f1(ang)} ${f1(nc.x)} ${f1(nc.y)})` });
      details.appendChild(nail);
      parts[f].push(nail);
      const r = Math.max(6.5, Math.min(12, u * 0.4));
      const bd = Math.min(dl * 0.55, w * 1.55);
      const bc = { x: tip.x + vx * bd, y: tip.y + vy * bd };
      const b = S('g', { class: 'hk-badge', 'data-f': f },
        S('circle', { cx: f1(bc.x), cy: f1(bc.y), r: f1(r) }),
        S('text', { x: f1(bc.x), y: f1(bc.y + r * 0.42), 'text-anchor': 'middle', 'font-size': f1(r * 1.2) }, String(f)));
      badges.appendChild(b);
      parts[f].push(b);
    });
    g.append(outline, fill, details, badges);
    if (spec.label) {
      const fs = Math.max(9, Math.min(14, u * 0.5));
      g.appendChild(S('text', { class: 'hk-label', x: f1(wc), y: f1(pTop + pH * 0.62), 'text-anchor': 'middle', 'font-size': f1(fs) }, lh ? 'Left hand' : 'Right hand'));
    }
    if (spec.numbers === false) badges.style.display = 'none';
    svg.appendChild(g);
    return { g, parts, badges, fingers };
  }

  MC.Hand = function (hand, opts) {
    const o = Object.assign({ onFinger: null, numbers: true, label: true }, opts);
    const lh = hand === 'lh';
    const X = (x) => (lh ? 200 - x : x);
    const svg = S('svg', { class: 'hand-svg ' + hand, viewBox: '0 0 200 250', role: 'group', 'aria-label': (lh ? 'Left' : 'Right') + ' hand, palm down' });
    const tips = { 1: { x: X(12), y: 82 }, 2: { x: X(64), y: 26 }, 3: { x: X(99), y: 10 }, 4: { x: X(134), y: 22 }, 5: { x: X(167), y: 52 } };
    const d = draw(svg, { hand, tips, fw: 26, baseY: 70, fadeTo: 250, numbers: o.numbers, label: o.label });
    [1, 2, 3, 4, 5].forEach((f) => {
      const el = d.fingers[f];
      el.classList.add('finger');
      el.setAttribute('aria-label', `${lh ? 'Left' : 'Right'} hand finger ${f} (${FNAME[f]})`);
      if (o.onFinger) {
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
        el.addEventListener('click', () => o.onFinger(f));
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); o.onFinger(f); } });
      }
    });
    const clearAll = () => Object.values(d.parts).flat().forEach((e) => e.classList.remove('on', 'ok', 'bad'));
    return {
      el: svg,
      set(f, cls) { clearAll(); if (f) [].concat(f).forEach((ff) => d.parts[ff] && d.parts[ff].forEach((e) => e.classList.add(cls || 'on'))); },
      add(f, cls) { if (d.parts[f]) d.parts[f].forEach((e) => e.classList.add(cls || 'on')); },
      numbers(show) { d.badges.style.display = show ? '' : 'none'; },
    };
  };
  MC.Hand.draw = draw;
  MC.Hand.FNAME = FNAME;
})(window.MC = window.MC || {});
