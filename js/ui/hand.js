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

  /* One continuous silhouette, with separate clipped finger regions for interaction.
     Geometry is built as a right hand, then mirrored for the left. Tips stay anchored
     to the keys supplied by Keyboard; only the palm and finger contours are shaped. */
  function draw(svg, spec) {
    const lh = spec.hand === 'lh', mirror = lh ? -1 : 1;
    const onKeys = spec.pose === 'keyboard';
    const u = spec.fw, base = spec.baseY, fade = spec.fadeTo;
    const pt = (x, y) => ({ x, y });
    const p = (v) => `${f1(v.x * mirror)},${f1(v.y)}`;
    const move = (a, v, n) => pt(a.x + v.x * n, a.y + v.y * n);
    const tip = Object.fromEntries(Object.entries(spec.tips).map(([f, t]) => [f, pt(t.x * mirror, t.y)]));
    const center = (tip[2].x + tip[5].x) / 2;
    const roots = {}, fs = {};
    const widths = { 1: 1.05, 2: 0.98, 3: 1, 4: 0.94, 5: 0.82 };
    const offsets = { 2: 1.6, 3: 1.52, 4: 1.65, 5: 1.83 };
    [2, 3, 4, 5].forEach((f) => {
      roots[f] = pt(center + (tip[f].x - center) * (onKeys ? 0.74 : 0.82), base + offsets[f] * u);
    });
    // A short thumb turns gently into the palm instead of extending to the wrist.
    roots[1] = pt(tip[1].x + u * (onKeys ? 0.42 : 0.6), base + u * 2);

    [1, 2, 3, 4, 5].forEach((f) => {
      const root = roots[f], t = tip[f], w = u * widths[f];
      const len = Math.hypot(root.x - t.x, root.y - t.y);
      const v = pt((root.x - t.x) / len, (root.y - t.y) / len);
      const n = pt(v.y, -v.x), r = w * 0.44;
      const c = move(t, v, r);
      const l = move(c, n, -r), right = move(c, n, r);
      const bl = pt(root.x - w * 0.5, root.y), br = pt(root.x + w * 0.5, root.y);
      // Elliptical fingertip cap, tangent to both tapered sides.
      const cap = `C${p(move(l, v, -r * 0.56))} ${p(move(t, n, -r * 0.56))} ${p(t)}` +
        ` C${p(move(t, n, r * 0.56))} ${p(move(right, v, -r * 0.56))} ${p(right)}`;
      const edge = `C${p(pt(bl.x, bl.y - len * 0.35))} ${p(move(l, v, len * 0.3))} ${p(l)} ${cap}` +
        ` C${p(move(right, v, len * 0.3))} ${p(pt(br.x, br.y - len * 0.35))} ${p(br)}`;
      fs[f] = { root, w, len, v, n, c, l, r: right, bl, br, cap, edge };
    });

    const palmW = roots[5].x - roots[2].x;
    const wristX = center - u * 0.12, wristHalf = palmW * 0.3 + u * 0.18;
    const wristY = base + u * 3.45;
    const wl = pt(wristX - wristHalf, wristY), wr = pt(wristX + wristHalf, wristY);
    const thumb = fs[1];
    const web = pt(roots[2].x - u * 0.64, base + u * 1.88);
    const thenar = pt(tip[1].x + u * 0.55, base + u * 2.2);
    const thumbUpper = `C${p(pt(thenar.x - u * 0.45, thenar.y - u * 0.52))} ${p(move(thumb.l, thumb.v, thumb.len * 0.4))} ${p(thumb.l)} ${thumb.cap}`;
    const thumbInner = `C${p(move(thumb.r, thumb.v, thumb.len * 0.35))} ${p(pt(web.x - u * 0.18, web.y - u * 0.12))} ${p(web)}`;
    let shape = `M${p(pt(wl.x - u * 0.1, fade + u))} L${p(wl)}` +
      ` C${p(pt(wl.x, base + u * 2.85))} ${p(pt(thenar.x + u * 0.6, thenar.y + u * 0.7))} ${p(thenar)} ${thumbUpper} ${thumbInner}` +
      ` Q${p(pt(fs[2].bl.x, web.y + u * 0.08))} ${p(fs[2].bl)}`;
    [2, 3, 4, 5].forEach((f) => {
      shape += ' ' + fs[f].edge;
      if (f < 5) {
        const a = fs[f].br, b = fs[f + 1].bl;
        const valleyY = Math.max(a.y, b.y) + u * 0.16;
        shape += ` C${p(pt(a.x, valleyY))} ${p(pt(b.x, valleyY))} ${p(b)}`;
      }
    });
    shape += ` C${p(pt(fs[5].br.x + u * 0.12, base + u * 2.65))} ${p(pt(wr.x, base + u * 2.8))} ${p(wr)}` +
      ` L${p(pt(wr.x + u * 0.12, fade + u))} Z`;

    const id = 'hk' + (++uid);
    const defs = S('defs', null,
      S('linearGradient', { id: id + 'fade', x1: 0, y1: f1(wristY - u * 0.2), x2: 0, y2: f1(fade), gradientUnits: 'userSpaceOnUse' },
        S('stop', { offset: 0, 'stop-color': '#fff' }), S('stop', { offset: 1, 'stop-color': '#000' })),
      S('clipPath', { id: id + 'clip' }, S('path', { d: shape })),
      S('mask', { id: id + 'mask', maskUnits: 'userSpaceOnUse', x: -2000, y: -2000, width: 6000, height: 6000 },
        S('rect', { x: -2000, y: -2000, width: 6000, height: 6000, fill: `url(#${id}fade)` })));
    const g = S('g', { class: 'hk ' + spec.hand, mask: `url(#${id}mask)`, style: `--hk-outline: ${f1(Math.max(1.2, Math.min(1.8, u * 0.08)))}` });
    g.appendChild(defs);
    const silhouette = S('path', { d: shape, class: 'hk-silhouette' });
    const fill = S('g', { class: 'hk-fill', 'clip-path': `url(#${id}clip)` });
    const colors = S('g', { class: 'hk-colors', 'clip-path': `url(#${id}clip)`, 'aria-hidden': 'true' });
    const outline = S('path', { d: shape, class: 'hk-contour', 'aria-hidden': 'true' });
    const cues = S('g', { class: 'hk-cues', 'aria-hidden': 'true' });
    const badges = S('g', { class: 'hk-badges', 'aria-hidden': 'true' });
    const parts = { 1: [], 2: [], 3: [], 4: [], 5: [] }, fingers = {};
    [1, 2, 3, 4, 5].forEach((f) => {
      const a = fs[f];
      const d = f === 1
        ? `M${p(thenar)} ${thumbUpper} ${thumbInner} Q${p(pt(web.x, base + u * 2.5))} ${p(thenar)} Z`
        : `M${p(a.bl)} ${a.edge} Q${p(pt(a.root.x, a.root.y + u * 0.7))} ${p(a.bl)} Z`;
      const region = S('path', { d, class: 'hk-finger', 'data-f': f });
      fill.appendChild(region);
      fingers[f] = region;
      parts[f].push(region);

      // Two flat colour bands follow the finger's angle and stay inside its outline.
      // The same colour always identifies the same finger on either hand.
      const clipId = `${id}f${f}`;
      defs.appendChild(S('clipPath', { id: clipId }, S('path', { d })));
      const color = S('g', { class: 'hk-color', 'data-f': f, 'clip-path': `url(#${clipId})` });
      const local = S('g', { transform: `matrix(${a.n.x * mirror} ${a.n.y} ${a.v.x * mirror} ${a.v.y} ${tip[f].x * mirror} ${tip[f].y})` });
      const band = (depth) => `M${-a.w * 1.2},${-a.w} H${a.w * 1.2} V${depth} Q0,${depth - a.w * 0.9} ${-a.w * 1.2},${depth} Z`;
      const softDepth = f === 1 ? Math.max(a.len * 0.92, a.w * 1.9) : a.len * 0.82;
      const tipDepth = f === 1 ? Math.max(a.len * 0.62, a.w * 1.22) : a.len * 0.54;
      local.append(
        S('path', { class: 'hk-color-soft', d: band(softDepth) }),
        S('path', { class: 'hk-color-tip', d: band(tipDepth) }));
      color.appendChild(local);
      colors.appendChild(color);
      parts[f].push(color);
      if (!onKeys) {
        // A shape cue keeps a selected finger clear even when quiz numbers are hidden.
        const cueAt = move(tip[f], a.v, a.len * 0.88);
        const cue = S('path', { class: 'hk-cue', d: `M${p(move(cueAt, a.n, -a.w * 0.18))} L${p(move(cueAt, a.v, -a.w * 0.2))} L${p(move(cueAt, a.n, a.w * 0.18))}` });
        cues.appendChild(cue);
        parts[f].push(cue);
      }
      const r = Math.max(5.5, Math.min(10, u * 0.34));
      const bc = move(tip[f], a.v, Math.min(a.len * 0.43, a.w * 0.86));
      const badge = S('g', { class: 'hk-badge', 'data-f': f },
        S('circle', { cx: f1(bc.x * mirror), cy: f1(bc.y), r: f1(r) }),
        S('text', { x: f1(bc.x * mirror), y: f1(bc.y), dy: '.35em', 'text-anchor': 'middle', 'font-size': f1(r * 1.25) }, String(f)));
      badges.appendChild(badge);
      parts[f].push(badge);
    });
    g.append(silhouette, colors, fill, outline, cues, badges);
    if (spec.label) {
      const fontSize = Math.max(9, Math.min(12, u * 0.44));
      g.appendChild(S('text', { class: 'hk-label', x: f1(wristX * mirror), y: f1(base + u * 2.85), 'text-anchor': 'middle', 'font-size': f1(fontSize) }, lh ? 'Left hand' : 'Right hand'));
    }
    if (spec.numbers === false) badges.style.display = 'none';
    svg.appendChild(g);
    return { g, parts, badges, fingers };
  }

  MC.Hand = function (hand, opts) {
    const o = Object.assign({ onFinger: null, numbers: true, label: true }, opts);
    const lh = hand === 'lh';
    const X = (x) => (lh ? 200 - x : x);
    const svg = S('svg', { class: 'hand-svg ' + hand, viewBox: '0 0 200 205', role: 'group', 'aria-label': (lh ? 'Left' : 'Right') + ' hand, palm down' });
    const tips = { 1: { x: X(25), y: 93 }, 2: { x: X(64), y: 26 }, 3: { x: X(99), y: 10 }, 4: { x: X(134), y: 22 }, 5: { x: X(167), y: 52 } };
    const d = draw(svg, { hand, tips, fw: 26, baseY: 70, fadeTo: 205, numbers: o.numbers, label: o.label });
    [1, 2, 3, 4, 5].forEach((f) => {
      const el = d.fingers[f];
      el.classList.add('finger');
      el.setAttribute('aria-label', `${lh ? 'Left' : 'Right'} hand finger ${f} (${FNAME[f]})`);
      if (o.onFinger) {
        el.classList.add('is-interactive');
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
