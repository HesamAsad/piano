/* SVG music notation renderer using SMuFL (Bravura) glyph metrics.
   Supports treble/bass/grand staff, key & time signatures, ledger lines, accidentals with
   measure-scoped rules, stems, flags, beams, dots, rests, ties, slurs, staccato, dynamics,
   hairpins, repeats, note names, finger numbers, beat counts, click-to-hear and highlighting. */
(function (MC) {
  'use strict';
  const { s: S, h } = MC.util;
  const T = MC.theory;
  const SP = 10;
  const FS = SP * 4;
  const G = {
    gClef: '\uE050', fClef: '\uE062', nhWhole: '\uE0A2', nhHalf: '\uE0A3', nhBlack: '\uE0A4',
    flagUp: '\uE240', flagDown: '\uE241', flag16Up: '\uE242', flag16Down: '\uE243', flat: '\uE260', natural: '\uE261', sharp: '\uE262',
    restW: '\uE4E3', restH: '\uE4E4', restQ: '\uE4E5', rest8: '\uE4E6', rest16: '\uE4E7',
    p: '\uE520', m: '\uE521', f: '\uE522', brace: '\uE000', staccAbove: '\uE4A2', staccBelow: '\uE4A3',
  };
  const HEAD_W = { w: 1.688, h: 1.18, q: 1.18, e: 1.18, s: 1.18 };
  const ACC_GLYPH = { '-1': G.flat, 0: G.natural, 1: G.sharp, 2: '\uE263' };
  const ACC_W = { '-1': 0.904, 0: 0.672, 1: 0.996, 2: 1 };
  const tsGlyphs = (n) => String(n).split('').map((c) => String.fromCharCode(0xe080 + +c)).join('');
  const dynGlyphs = (d) => d.split('').map((c) => G[c]).join('');
  const r3 = (x) => Math.round(x * 1000) / 1000;

  function glyph(ch, x, y, cls, extra) {
    return S('text', Object.assign({ x: r3(x), y: r3(y), class: 'mg' + (cls ? ' ' + cls : ''), 'font-size': FS }, extra || {}), ch);
  }
  function rect(x, y, w, hh, cls) { return S('rect', { x: r3(x), y: r3(y), width: r3(Math.max(0.1, w)), height: r3(Math.max(0.1, hh)), class: cls || '' }); }
  function line(x1, y1, x2, y2, w, cls) { return S('line', { x1: r3(x1), y1: r3(y1), x2: r3(x2), y2: r3(y2), 'stroke-width': w, class: cls || 'st-ink' }); }
  function text(str, x, y, cls, anchor) { return S('text', { x: r3(x), y: r3(y), class: cls, 'text-anchor': anchor || 'middle' }, str); }

  function spaceFor(d) { return Math.max(2.5, 3.9 + 1.7 * Math.log2(d)); }

  /* Prepare display data: staff positions, accidentals shown, stem directions. */
  function prepare(score) {
    score.staves.forEach((st, si) => {
      st.measures.forEach((m, mi) => {
        const accState = {};
        m.events.forEach((ev, ei) => {
          ev._ref = `${si}:${mi}:${ei}`;
          if (ev.kind === 'rest' || ev.hidden) return;
          ev._heads = ev.notes.map((n) => {
            const pos = T.staffPos(n, m.clef || st.clef);
            const k = n.letter + n.octave;
            const cur = k in accState ? accState[k] : T.keyAcc(score.key, n.letter);
            let acc = null;
            if (n.acc !== cur || n.forceNatural || (score.forceAcc && n.acc !== 0)) { acc = n.acc; accState[k] = n.acc; }
            if (ev.tiedFrom || ev.tiedFromMidis?.includes(n.midi)) acc = null;
            return { n, pos, acc, dx: 0 };
          });
          const ps = ev._heads.map((x) => x.pos);
          const hi = Math.max(...ps), lo = Math.min(...ps);
          // the note farthest from the middle line decides; ties go down. 1 = up, -1 = down
          ev._stem = ev.base === 'w' ? 0 : (hi - 4 >= 4 - lo ? -1 : 1);
        });
      });
    });
    // Beam eighths and sixteenths within each beat; use secondary beams for sixteenths.
    score.staves.forEach((st) => {
      st.measures.forEach((m) => {
        m._beams = [];
        let grp = [];
        const flush = () => { if (grp.length >= 2) m._beams.push(grp); else grp.forEach((e) => { e._flag = true; }); grp = []; };
        m.events.forEach((ev) => {
          ev._beamed = false;
          const isE = ev.kind !== 'rest' && !ev.hidden && ['e', 's'].includes(ev.base) && !ev.dots;
          if (!isE) { flush(); return; }
          if (grp.length && Math.floor(grp[0].start + 1e-6) !== Math.floor(ev.start + 1e-6)) flush();
          grp.push(ev);
        });
        flush();
        m._beams.forEach((g) => {
          let sum = 0;
          g.forEach((e) => e._heads.forEach((hd) => { sum += hd.pos - 4; }));
          const dir = sum >= 0 ? -1 : 1;
          g.forEach((e) => { e._stem = dir; e._beamed = true; });
        });
      });
    });
    // seconds in chords → displaced heads
    score.staves.forEach((st) => st.measures.forEach((m) => m.events.forEach((ev) => {
      if (!ev._heads || ev._heads.length < 2) return;
      const hw = HEAD_W[ev.base];
      const sorted = ev._heads.slice().sort((a, b) => a.pos - b.pos);
      if (ev._stem >= 0) {
        for (let i = 1; i < sorted.length; i++) if (sorted[i].pos - sorted[i - 1].pos === 1 && !sorted[i - 1].dx) sorted[i].dx = hw - 0.12;
      } else {
        for (let i = sorted.length - 2; i >= 0; i--) if (sorted[i + 1].pos - sorted[i].pos === 1 && !sorted[i + 1].dx) sorted[i].dx = -(hw - 0.12);
      }
    })));
  }

  function columnsFor(score, mi, o) {
    const map = new Map();
    let end = 0;
    score.staves.forEach((st, si) => {
      const m = st.measures[mi];
      if (!m) return;
      end = Math.max(end, m.total != null ? m.total : m.events.reduce((a, e) => a + e.dur, 0));
      m.events.forEach((ev) => {
        const k = Math.round(ev.start * 1000) / 1000;
        if (!map.has(k)) map.set(k, { t: k, evs: [] });
        map.get(k).evs.push({ si, ev });
      });
    });
    const cols = [...map.values()].sort((a, b) => a.t - b.t);
    cols.forEach((c, i) => {
      const next = i + 1 < cols.length ? cols[i + 1].t : end;
      let lead = 0, extra = 0, headW = 1.18;
      c.evs.forEach(({ ev }) => {
        if (ev._heads) {
          const accs = ev._heads.filter((x) => x.acc != null).length;
          if (accs) lead = Math.max(lead, 1.3 + (accs > 1 ? 1.0 : 0));
          if (ev.arpeggio) lead += 1.1;
          if (ev._heads.some((x) => x.dx < 0)) lead = Math.max(lead, 1.3);
          if (ev._heads.some((x) => x.dx > 0)) extra = Math.max(extra, 1.1);
          headW = Math.max(headW, HEAD_W[ev.base]);
        }
        if (ev.dots) extra = Math.max(extra, 0.7);
        if (ev.measureRest) c.measureRest = true;
      });
      let w = o.free ? (o.freeSpacing || 6) : spaceFor(next - c.t);
      if (o.showNames || o.labels) w = Math.max(w, 2.9);
      if (o.showCounts && next - c.t >= 1) w = Math.max(w, 3.2, (next - c.t) * 2.3);
      c.lead = lead;
      c.w = w + extra;
      c.headW = headW;
      c.dur = next - c.t;
    });
    return { cols, end };
  }

  function staffExtents(score, sysMeasures, si, o) {
    const st = score.staves[si];
    let hi = 4, lo = 0; // in staff spaces from bottom line
    let fingersAbove = 0, fingersBelow = 0, dyn = false, nameLines = 1;
    sysMeasures.forEach((mi) => {
      const m = st.measures[mi];
      if (!m) return;
      m.events.forEach((ev) => {
        if (ev.dyn || ev.hairpinStart) dyn = true;
        if (!ev._heads) return;
        nameLines = Math.max(nameLines, ev._heads.length);
        const ps = ev._heads.map((x) => x.pos / 2);
        const top = Math.max(...ps), bot = Math.min(...ps);
        hi = Math.max(hi, top + (ev._stem === 1 ? 3.5 : 0.7) + (ev.stacc && ev._stem === -1 ? 1 : 0));
        if (ev.fermata || ev.tuplet) hi = Math.max(hi, Math.max(4, top + (ev._stem === 1 ? 3.5 : 0.7)) + 1.8);
        lo = Math.min(lo, bot - (ev._stem === -1 ? 3.5 : 0.7) - (ev.stacc && ev._stem !== -1 ? 1 : 0));
        if (ev.tie || ev.tiedFrom || ev.tiedFromMidis?.length) {
          hi = Math.max(hi, top + 2.2);
          lo = Math.min(lo, bot - 2.2);
        }
        if (ev.fingers && o.showFingers) {
          if (st.hand === 'lh') fingersBelow = Math.max(fingersBelow, ev.fingers.length);
          else fingersAbove = Math.max(fingersAbove, ev.fingers.length);
        }
      });
    });
    const hasTempo = si === 0 && o.showTempo && sysMeasures.some((mi) => mi === 0 || (score.tempoChanges || []).some((c) => c.measure === mi + 1));
    const above = Math.max(o.minAbove != null ? o.minAbove : 2.2, hi - 4 + 0.8) + (fingersAbove ? 0.7 + fingersAbove * 1.25 : 0) + (hasTempo ? 2.6 : 0) + (si === 0 && o.measureNumbersAll ? 1.6 : 0);
    let below = Math.max(o.minBelow != null ? o.minBelow : 2.2, -lo + 0.8);
    const rows = {};
    let yb = below;
    if (fingersBelow) { rows.fingers = yb + 1.3; yb += 0.7 + fingersBelow * 1.25; }
    if (o.showNames || o.labelRow) { rows.names = yb + 1.6; yb += 2.3 + (nameLines - 1) * 1.35; }
    if (dyn) { rows.dyn = Math.max(yb + 1.4, 3.2); yb = rows.dyn + 1.2; }
    if (o.showCounts && si === score.staves.length - 1) { rows.counts = yb + 1.7; yb += 2.4; }
    if (st.pedal === 'bar' && !score.staves[si + 1]?.pedal) { rows.pedal = yb + 1.4; yb += 2.4; }
    below = yb;
    return { above, below, rows, fingersAbove };
  }

  /* ---------- Main render ---------- */
  function render(target, score, opts) {
    const o = Object.assign({ spPx: null, width: null, showNames: false, showCounts: false, showFingers: true, clef: true, keySig: true, timeSig: true, barlines: true, free: false, justify: true, finalBar: true, measureNumbers: false, onNoteClick: null, hands: null, className: '' }, opts);
    prepare(score);
    const containerPx = o.width || (target && target.clientWidth) || 640;
    const spPx = o.spPx || (containerPx < 520 ? 8.5 : 10.5);
    const availSp = containerPx / spPx;
    const nSig = T.KEYS[score.key || 'C'].sig.length;
    const clefW = o.clef ? 4.2 : 1.0;
    const keyW = o.keySig && nSig ? nSig * 1.05 + 0.5 : 0;
    const timeW = o.timeSig && score.time && !o.free ? 2.7 : 0;
    const braceW = score.staves.length > 1 ? 1.4 : 0;
    const count = score.staves[0].measures.length;
    // An optional vocal staff sits above the piano's two-staff brace.
    const groups = [];
    score.staves.forEach((st, si) => {
      const id = st.group || (st.hand === 'vocal' ? 'vocal' : 'piano');
      const last = groups[groups.length - 1];
      if (last && last.id === id) last.to = si;
      else groups.push({ id, from: si, to: si });
    });
    // measure geometry
    const mData = [];
    for (let mi = 0; mi < count; mi++) {
      const { cols, end } = columnsFor(score, mi, o);
      const padL = mi === 0 && !o.barlines ? 1.0 : 1.4;
      const startRep = score.staves[0].measures[mi].startRepeat ? 1.4 : 0;
      const endRep = score.staves[0].measures[mi].endRepeat ? 1.0 : (score.caesuras || []).includes(mi + 1) ? 2.0 : 0;
      const natural = padL + startRep + cols.reduce((a, c) => a + c.lead + c.w, 0) + 0.3 + endRep;
      mData.push({ mi, cols, end, padL: padL + startRep, natural, endRep });
    }
    // line breaking
    const systems = [];
    let cur = [];
    let used = 0;
    const maxPer = o.maxMeasuresPerLine || 99;
    mData.forEach((md) => {
      const header = braceW + clefW + keyW + (systems.length === 0 ? timeW : 0);
      const change = md.mi > 0 && ((score.doubleBars || []).includes(md.mi) || score.staves.some((st) => st.measures[md.mi].clef !== st.measures[md.mi - 1].clef) || (score.tempoChanges || []).some((c) => c.measure === md.mi + 1));
      if (cur.length && (change || used + md.natural + header > availSp || cur.length >= maxPer)) {
        systems.push(cur); cur = []; used = 0;
      }
      cur.push(md);
      used += md.natural;
    });
    if (cur.length) systems.push(cur);

    const svg = S('svg', { class: 'staff-svg ' + o.className, role: 'img', xmlns: 'http://www.w3.org/2000/svg' });
    const title = S('title', null, o.title || describeScore(score));
    svg.appendChild(title);
    const gMain = S('g');
    svg.appendChild(gMain);
    const evInfo = new Map();
    const order = [];
    let y = 0;
    let maxX = 0;
    const sysInfo = [];

    systems.forEach((sys, sIdx) => {
      const header = braceW + clefW + keyW + (sIdx === 0 ? timeW : 0);
      const naturalW = header + sys.reduce((a, md) => a + md.natural, 0);
      const isLast = sIdx === systems.length - 1;
      let stretch = 1;
      const colSum = sys.reduce((a, md) => a + md.cols.reduce((b, c) => b + c.w, 0), 0);
      if (o.justify && !o.free && systems.length > 1 && (!isLast || naturalW / availSp > 0.72)) {
        stretch = Math.max(1, 1 + (availSp - 0.5 - naturalW) / colSum);
      } else if (o.justify && !o.free && systems.length === 1 && o.fill) {
        stretch = Math.max(1, 1 + (availSp - 0.5 - naturalW) / colSum);
      }
      stretch = Math.min(stretch, 2.4);
      // vertical layout
      const ext = score.staves.map((_, si) => staffExtents(score, sys.map((m) => m.mi), si, o));
      const tops = [];
      let yy = y + ext[0].above;
      score.staves.forEach((_, si) => {
        if (si > 0) yy += Math.max(ext[si - 1].below + ext[si].above, o.staffGap || 6.5);
        tops.push(yy);
        yy += 4;
      });
      const sysBottom = yy + ext[ext.length - 1].below;
      const yOf = (si, pos) => (tops[si] + 4 - pos / 2) * SP;
      const x0 = 0.3;
      let x = x0 + braceW;
      const sysStartX = x;
      const g = S('g', { class: 'system' });
      gMain.appendChild(g);
      // header
      score.staves.forEach((st, si) => {
        const clef = st.measures[sys[0].mi].clef || st.clef;
        let hx = sysStartX + 0.6;
        if (o.clef) {
          if (clef === 'treble') g.appendChild(glyph(G.gClef, hx * SP, yOf(si, 2), 'clef'));
          else g.appendChild(glyph(G.fClef, hx * SP, yOf(si, 6), 'clef'));
          hx = sysStartX + clefW;
        } else hx = sysStartX + clefW;
        if (o.keySig && nSig) {
          const type = T.KEYS[score.key].type;
          T.KEYS[score.key].sig.forEach((_, i) => {
            const pos = T.SIG_POS[type][clef][i];
            g.appendChild(glyph(type === 'sharp' ? G.sharp : G.flat, (hx + i * 1.05) * SP, yOf(si, pos), 'keysig'));
          });
        }
        if (sIdx === 0 && timeW) {
          const tx = sysStartX + clefW + keyW + 0.3;
          g.appendChild(glyph(tsGlyphs(score.time[0]), tx * SP, yOf(si, 6), 'timesig'));
          g.appendChild(glyph(tsGlyphs(score.time[1]), tx * SP, yOf(si, 2), 'timesig'));
        }
      });
      x = sysStartX + header - braceW;
      const measureXs = [];
      sys.forEach((md) => {
        const mStart = x;
        const st0 = score.staves[0].measures[md.mi];
        if (st0.startRepeat) {
          score.staves.forEach((_, si) => drawRepeatStart(g, mStart + 0.1, si));
        }
        let cx = mStart + md.padL;
        md.cols.forEach((c) => {
          c.x = cx + c.lead;
          cx = c.x + c.w * stretch;
        });
        const mEnd = cx + 0.3 + md.endRep;
        md.x0 = mStart; md.x1 = mEnd;
        measureXs.push({ mi: md.mi, x0: mStart, x1: mEnd, cols: md.cols });
        // events
        md.cols.forEach((c) => {
          c.evs.forEach(({ si, ev }) => {
            if (ev.hidden) return;
            const st = score.staves[si];
            let ex = c.x;
            if (ev.measureRest || (ev.kind === 'rest' && c.measureRest && ev.base === 'w')) ex = (mStart + md.padL * 0.4 + mEnd) / 2 - 0.56;
            const eg = drawEvent(ev, ex, si, st, yOf, o, score);
            eg.setAttribute('data-ref', ev._ref);
            g.appendChild(eg);
            const info = { ev, x: ex, si, sys: sIdx, g: eg, mi: md.mi, staffTop: tops[si], clef: st.measures[md.mi].clef || st.clef, topY: ev._topY };
            evInfo.set(ev._ref, info);
            order.push(ev._ref);
          });
        });
        // beams
        score.staves.forEach((st, si) => {
          const m = st.measures[md.mi];
          (m && m._beams || []).forEach((grp) => drawBeam(g, grp, evInfo, si, yOf));
          (m && m.tuplets || []).forEach((grp) => {
            const first = evInfo.get(grp[0]._ref), last = evInfo.get(grp[2]._ref);
            const x1 = first.x * SP - 2, x2 = (last.x + HEAD_W[last.ev.base]) * SP + 2;
            const ty = Math.min(yOf(si, 8) - SP, ...grp.map((ev) => ev._topY == null ? yOf(si, 8) : ev._topY - SP));
            const mid = (x1 + x2) / 2;
            const bracket = S('g', { class: 'st-tuplet' });
            bracket.append(line(x1, ty + 5, x1, ty, 1), line(x1, ty, mid - 7, ty, 1), line(mid + 7, ty, x2, ty, 1), line(x2, ty, x2, ty + 5, 1), text('3', mid, ty + 4, 'st-tuplet-number'));
            g.appendChild(bracket);
          });
        });
        // barline
        if (o.barlines) {
          const isFinal = md.mi === count - 1 && o.finalBar;
          groups.forEach(({ from, to }) => {
            const top = yOf(from, 8), bot = yOf(to, 0);
            const nextM = score.staves[0].measures[md.mi + 1];
            if (st0.endRepeat) drawRepeatEnd(g, mEnd, from, to, yOf, top, bot);
            else if (nextM && nextM.startRepeat) { /* the start-repeat sign replaces this barline */ }
            else if (isFinal) {
              g.appendChild(rect((mEnd - 0.5) * SP - 0.5 * SP, top, 0.16 * SP, bot - top, 'st-bar'));
              g.appendChild(rect((mEnd - 0.5) * SP, top, 0.5 * SP, bot - top, 'st-bar'));
            } else if ((score.doubleBars || []).includes(md.mi + 1)) {
              g.appendChild(rect((mEnd - 0.5) * SP, top, 0.16 * SP, bot - top, 'st-bar st-double-bar'));
              g.appendChild(rect((mEnd - 0.1) * SP, top, 0.16 * SP, bot - top, 'st-bar'));
            } else g.appendChild(rect(mEnd * SP - 0.08 * SP, top, 0.16 * SP, bot - top, 'st-bar'));
          });
        }
        const numberY = (tops[0] - ext[0].above + 1.2) * SP;
        if (o.measureNumbers && md === sys[0] && md.mi > 0 && !o.measureNumbersAll) g.appendChild(text(String(md.mi + 1), (mStart + 0.2) * SP, numberY, 'st-mnum', 'start'));
        if (o.measureNumbersAll) g.appendChild(text(String(md.mi + 1), (mStart + 0.5) * SP, numberY, 'st-mnum', 'start'));
        const tempo = md.mi === 0 ? score.tempo : (score.tempoChanges || []).find((c) => c.measure === md.mi + 1)?.bpm;
        if (o.showTempo && tempo) g.appendChild(text(`♩ = ${tempo}`, (mStart + 0.5) * SP, numberY + 1.8 * SP, 'st-tempo', 'start'));
        if (score.daCapo && md.mi === count - 1) g.appendChild(text('D.C.', (mEnd - 0.3) * SP, numberY, 'st-tempo st-da-capo', 'end'));
        if ((score.caesuras || []).includes(md.mi + 1)) {
          const cy = yOf(0, 8), cx = (mEnd - 1.5) * SP;
          g.appendChild(S('path', { d: `M ${cx} ${cy + 4} l 5 -14 M ${cx + 7} ${cy + 4} l 5 -14`, class: 'st-caesura', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6 }));
        }
        x = mEnd;
      });
      const sysEnd = x;
      maxX = Math.max(maxX, sysEnd);
      // staff lines
      const lines = S('g', { class: 'st-lines' });
      score.staves.forEach((_, si) => {
        for (let i = 0; i < 5; i++) lines.appendChild(rect(sysStartX * SP, yOf(si, i * 2) - 0.065 * SP, (sysEnd - sysStartX) * SP, 0.13 * SP, 'st-line'));
      });
      g.insertBefore(lines, g.firstChild);
      // system start barline & brace
      groups.filter(({ from, to }) => to > from).forEach(({ from, to }) => {
        const top = yOf(from, 8), bot = yOf(to, 0);
        g.appendChild(rect(sysStartX * SP - 0.08 * SP, top, 0.16 * SP, bot - top, 'st-bar'));
        const k = (bot - top) / SP / 4;
        const bx = (sysStartX - 0.3 - 0.277 * k) * SP;
        g.appendChild(glyph(G.brace, bx, bot, 'brace', { transform: `translate(${r3(bx)} ${r3(bot)}) scale(${r3(k)}) translate(${r3(-bx)} ${r3(-bot)})` }));
      });
      if (o.handLabels && score.staves.length > 1) {
        score.staves.forEach((st, si) => g.appendChild(text(st.label || (st.hand === 'lh' ? 'L.H.' : 'R.H.'), (sysStartX + 0.2) * SP, yOf(si, 8) - 1.2 * SP, 'st-hand', 'start')));
      }
      // rows: names, fingers, counts, dynamics
      measureXs.forEach((mx) => {
        score.staves.forEach((st, si) => {
          if (!ext[si].rows.pedal) return;
          const py = (tops[si] + 4 + ext[si].rows.pedal) * SP;
          const px = (mx.x0 + 0.7) * SP, end = (mx.x1 - 0.5) * SP;
          g.appendChild(S('path', { d: `M ${px} ${py - 6} V ${py} H ${end} V ${py - 6}`, class: 'st-pedal', fill: 'none', stroke: 'currentColor', 'stroke-width': 0.9 }));
          if (mx.mi === 0) g.appendChild(text('Ped.', px, py - 9, 'st-hand', 'start'));
        });
        mx.cols.forEach((c) => c.evs.forEach(({ si, ev }) => {
          if (ev.hidden) return;
          const info = evInfo.get(ev._ref);
          const st = score.staves[si];
          if (!ev._heads) {
            if (ev.dyn) {
              const dx = ev.measureRest ? mx.x0 + 0.7 : info.x - 0.3;
              info.g.appendChild(glyph(dynGlyphs(ev.dyn), dx * SP, (tops[si] + 4 + ext[si].rows.dyn) * SP, 'dyn'));
            }
            return;
          }
          const hw = HEAD_W[ev.base];
          const cxm = (info.x + hw / 2) * SP;
          if (o.showNames && !ev.tiedFrom) {
            const lbl = typeof o.showNames === 'function' ? o.showNames(ev, si) : ev._heads.slice().reverse().map((hd) => T.name(hd.n, false)).join('\n');
            if (lbl) {
              const parts = String(lbl).split('\n');
              const ny = (tops[si] + 4 + ext[si].rows.names) * SP;
              parts.forEach((p, i) => info.g.appendChild(text(p, cxm, ny + i * 1.35 * SP, 'st-name')));
            }
          }
          if (o.showFingers && ev.fingers && !ev.tiedFrom) {
            // chord fingerings are written lowest note first; stack them with the highest note on top
            const fs = ev.fingers.slice().reverse();
            const lh = 1.25 * SP;
            const cls = 'st-finger' + (fs.length > 1 ? ' st-finger-sm' : '');
            if (st.hand === 'lh') {
              const y0 = (tops[si] + 4 + ext[si].rows.fingers) * SP;
              fs.forEach((f, i) => info.g.appendChild(text(String(f), cxm, y0 + i * lh, cls)));
            } else {
              const yb = Math.min(yOf(si, 8) - 1.0 * SP, info.topY - 0.9 * SP);
              fs.forEach((f, i) => info.g.appendChild(text(String(f), cxm, yb - (fs.length - 1 - i) * lh, cls)));
            }
          }
          if (ev.dyn) {
            const dy = (tops[si] + 4 + (ext[si].rows.dyn || 3.2)) * SP;
            info.g.appendChild(glyph(dynGlyphs(ev.dyn), info.x * SP - 0.3 * SP, dy, 'dyn'));
          }
        }));
        if (o.showCounts) {
          const si = score.staves.length - 1;
          const cy = (tops[si] + 4 + ext[si].rows.counts) * SP;
          const onsets = new Set(mx.cols.map((c) => c.t));
          const xAt = (b) => {
            const cols = mx.cols;
            for (let i = 0; i < cols.length; i++) {
              if (Math.abs(cols[i].t - b) < 1e-6) return cols[i].x + cols[i].headW / 2;
              if (cols[i].t > b) {
                const prev = cols[i - 1];
                const a = prev ? prev.x + prev.headW / 2 : mx.x0 + 1;
                const bt = prev ? prev.t : 0;
                return a + ((cols[i].x + cols[i].headW / 2 - a) * (b - bt)) / (cols[i].t - bt);
              }
            }
            const last = cols[cols.length - 1];
            const a = last.x + last.headW / 2;
            return a + ((mx.x1 - 0.6 - a) * (b - last.t)) / Math.max(0.5, (score.bpm || 4) - last.t);
          };
          const bpm = score.bpm || 4;
          for (let b = 0; b < bpm - 1e-6; b += 0.5) {
            const isBeat = Math.abs(b - Math.round(b)) < 1e-6;
            const onset = [...onsets].some((t) => Math.abs(t - b) < 1e-6);
            if (!isBeat && !onset) continue;
            const lbl = isBeat ? String(Math.round(b) + 1) : '&';
            g.appendChild(text(lbl, xAt(b) * SP, cy, 'st-count' + (onset ? '' : ' st-count-held')));
          }
        }
      });
      sysInfo.push({ tops, top: y, bottom: sysBottom, x0: sysStartX, x1: sysEnd, measureXs, yOf, ext });
      y = sysBottom + (o.systemGap != null ? o.systemGap : 1.5);
    });

    // ties, slurs, hairpins (need all positions)
    drawCurves(gMain, score, evInfo, sysInfo, o);

    const totalH = (y - (o.systemGap != null ? o.systemGap : 1.5)) * SP;
    const totalW = (maxX + 0.6) * SP;
    svg.setAttribute('viewBox', `0 0 ${r3(totalW)} ${r3(totalH)}`);
    svg.setAttribute('width', r3((totalW / SP) * spPx));
    svg.setAttribute('height', r3((totalH / SP) * spPx));
    const cursor = rect(0, 0, 1, 1, 'st-cursor');
    cursor.style.display = 'none';
    gMain.insertBefore(cursor, gMain.firstChild);

    if (target) { MC.util.clear(target); target.appendChild(svg); }

    let clickFn = o.onNoteClick;
    svg.addEventListener('click', (e) => {
      const g = e.target.closest && e.target.closest('.ev');
      if (!g || !clickFn) return;
      const info = evInfo.get(g.getAttribute('data-ref'));
      if (info && info.ev._heads) clickFn(info.ev, info);
    });
    svg.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const g = e.target.closest && e.target.closest('.ev');
      if (!g || !clickFn) return;
      e.preventDefault();
      const info = evInfo.get(g.getAttribute('data-ref'));
      if (info && info.ev._heads) clickFn(info.ev, info);
    });
    if (clickFn) {
      evInfo.forEach((info) => {
        if (!info.ev._heads) return;
        info.g.setAttribute('tabindex', '0');
        info.g.setAttribute('role', 'button');
        info.g.setAttribute('aria-label', 'Play ' + info.ev._heads.map((hd) => T.name(hd.n)).join(' '));
        info.g.classList.add('clickable');
      });
    }

    const api = {
      svg, evInfo, order, systems: sysInfo, score,
      setCurrent(refs, withCursor) {
        refs = [].concat(refs || []);
        evInfo.forEach((info) => info.g.classList.remove('is-current'));
        refs.forEach((r) => { const i = evInfo.get(r); if (i) i.g.classList.add('is-current'); });
        const first = evInfo.get(refs[0]);
        if (first && withCursor !== false) {
          const si = sysInfo[first.sys];
          cursor.style.display = '';
          cursor.setAttribute('x', r3((first.x - 0.55) * SP));
          cursor.setAttribute('width', r3((HEAD_W[first.ev.base] + 1.1) * SP));
          cursor.setAttribute('y', r3((si.tops[0] - 1.2) * SP));
          cursor.setAttribute('height', r3((si.tops[si.tops.length - 1] + 5.2 - si.tops[0] + 1.2) * SP));
          const tgt = first.g;
          if (o.autoScroll && tgt.scrollIntoView) {
            const r = tgt.getBoundingClientRect();
            const behavior = MC.util.reducedMotion() ? 'auto' : 'smooth';
            if (target && target.classList.contains('score-viewport')) {
              const box = target.getBoundingClientRect();
              const moveY = r.top < box.top + 24 || r.bottom > box.bottom - 24;
              const moveX = r.left < box.left + 16 || r.right > box.right - 16;
              if (moveY || moveX) target.scrollTo({
                top: moveY ? target.scrollTop + r.top - box.top - target.clientHeight / 2 : target.scrollTop,
                left: moveX ? target.scrollLeft + r.left - box.left - target.clientWidth / 2 : target.scrollLeft,
                behavior,
              });
            } else if (r.top < 60 || r.bottom > window.innerHeight - 60) tgt.scrollIntoView({ block: 'center', behavior });
          }
        } else if (!refs.length) cursor.style.display = 'none';
      },
      mark(ref, cls, label) {
        const i = evInfo.get(ref);
        if (!i) return;
        i.g.classList.add('mk-' + cls);
        if (label) {
          const hw = HEAD_W[i.ev.base] || 1.18;
          const ly = Math.min(i.topY || 0, sysInfo[i.sys].tops[i.si] * SP) - 1.1 * SP;
          i.g.appendChild(text(label, (i.x + hw / 2) * SP, ly - (i.ev.fingers && o.showFingers ? 1.5 * SP : 0), 'st-mark st-mark-' + cls));
        }
      },
      clearMarks() {
        evInfo.forEach((i) => {
          [...i.g.classList].filter((c) => c.startsWith('mk-')).forEach((c) => i.g.classList.remove(c));
          i.g.querySelectorAll('.st-mark').forEach((n) => n.remove());
        });
      },
      onClick(fn) { clickFn = fn; },
      headPosition(ref) { const i = evInfo.get(ref); return i ? { x: i.x, sys: i.sys } : null; },
    };
    return api;
  }

  function describeScore(score) {
    const clefs = score.staves.map((s) => s.clef).join(' and ');
    const notes = [];
    score.staves.forEach((st) => st.measures.forEach((m) => m.events.forEach((e) => {
      if (e.hidden) return;
      if (e.kind === 'rest') notes.push(T.REST_NAME[e.base] || 'rest');
      else notes.push(e.notes.map((n) => T.name(n)).join('+'));
    })));
    const shown = notes.length > 16 ? notes.slice(0, 16).join(', ') + '…' : notes.join(', ');
    return `Music notation, ${clefs} clef: ${shown}`;
  }

  function drawEvent(ev, x, si, st, yOf, o) {
    const g = S('g', { class: 'ev' + (ev.kind === 'rest' ? ' rest' : '') + (ev.cls ? ' ' + ev.cls : '') });
    if (ev.kind === 'rest') {
      const ch = { w: G.restW, h: G.restH, q: G.restQ, e: G.rest8, s: G.rest16 }[ev.base];
      const pos = ev.base === 'w' ? 6 : 4;
      g.appendChild(glyph(ch, x * SP, yOf(si, pos)));
      if (ev.dots) g.appendChild(S('circle', { cx: r3((x + 1.5) * SP), cy: r3(yOf(si, 5)), r: 0.2 * SP, class: 'st-fill' }));
      return g;
    }
    const heads = ev._heads;
    const hw = HEAD_W[ev.base];
    const ch = ev.base === 'w' ? G.nhWhole : ev.base === 'h' ? G.nhHalf : G.nhBlack;
    const ps = heads.map((hd) => hd.pos);
    const hi = Math.max(...ps), lo = Math.min(...ps);
    // ledger lines
    const ledg = (pos, dx) => g.appendChild(rect((x + dx - 0.4) * SP, yOf(si, pos) - 0.08 * SP, (hw + 0.8) * SP, 0.16 * SP, 'st-ledger'));
    const anyDxR = heads.some((hd) => hd.dx > 0), anyDxL = heads.some((hd) => hd.dx < 0);
    for (let p = -2; p >= lo; p -= 2) ledg(p, anyDxL && p <= lo ? Math.min(0, heads.find((h2) => h2.pos === lo).dx) : 0);
    for (let p = 10; p <= hi; p += 2) ledg(p, anyDxR && p >= hi ? Math.max(0, heads.find((h2) => h2.pos === hi).dx) : 0);
    // accidentals (stacked in columns if close)
    const accHeads = heads.filter((hd) => hd.acc != null).sort((a, b) => b.pos - a.pos);
    const colsUsed = [];
    accHeads.forEach((hd) => {
      let col = 0;
      while (colsUsed[col] && colsUsed[col].some((p) => Math.abs(p - hd.pos) < 6)) col++;
      (colsUsed[col] = colsUsed[col] || []).push(hd.pos);
      const w = ACC_W[hd.acc];
      const leftEdge = Math.min(0, ...heads.map((q) => q.dx));
      const ax = x + leftEdge - 0.25 - w - col * 1.05;
      g.appendChild(glyph(ACC_GLYPH[hd.acc], ax * SP, yOf(si, hd.pos), 'acc'));
    });
    // heads
    heads.forEach((hd) => {
      g.appendChild(glyph(ch, (x + hd.dx) * SP, yOf(si, hd.pos), 'nh'));
      if (ev.dots) {
        const dp = hd.pos % 2 === 0 ? hd.pos + 1 : hd.pos;
        g.appendChild(S('circle', { cx: r3((x + hw + 0.45 + Math.max(0, hd.dx)) * SP), cy: r3(yOf(si, dp)), r: 0.2 * SP, class: 'st-fill' }));
      }
    });
    // stem, flag
    let topY = yOf(si, hi) - 0.6 * SP;
    if (ev._stem) {
      const up = ev._stem === 1;
      const sx = up ? x + hw - 0.12 : x;
      const yStart = up ? yOf(si, lo) - 0.168 * SP : yOf(si, hi) + 0.168 * SP;
      let len = 3.5;
      if (up && hi < 1) len = Math.max(len, (4 - hi) / 2);
      if (!up && lo > 7) len = Math.max(len, (lo - 4) / 2);
      const yFar = up ? yOf(si, hi) - len * SP : yOf(si, lo) + len * SP;
      ev._stemX = sx; ev._stemY0 = yStart; ev._stemY1 = yFar; ev._si = si;
      if (!ev._beamed) {
        const stem = rect(sx * SP, Math.min(yStart, yFar), 0.12 * SP, Math.abs(yFar - yStart), 'st-stem');
        g.appendChild(stem);
        if (ev.base === 'e' || ev.base === 's') g.appendChild(glyph(ev.base === 's' ? (up ? G.flag16Up : G.flag16Down) : (up ? G.flagUp : G.flagDown), sx * SP, yFar, 'flag'));
      } else {
        const stem = rect(sx * SP, Math.min(yStart, yFar), 0.12 * SP, Math.abs(yFar - yStart), 'st-stem');
        stem.classList.add('beam-stem');
        g.appendChild(stem);
        ev._stemEl = stem;
      }
      if (up) topY = Math.min(topY, yFar);
    }
    // staccato
    if (ev.stacc) {
      const up = ev._stem !== -1;
      const p = up ? lo - 2 : hi + 2;
      const py = yOf(si, p % 2 === 0 ? (up ? p - 1 : p + 1) : p);
      g.appendChild(S('circle', { cx: r3((x + hw / 2) * SP), cy: r3(py), r: 0.22 * SP, class: 'st-fill' }));
      if (!up) topY = Math.min(topY, py - 0.4 * SP);
    }
    if (ev.arpeggio) {
      const ax = (x - 0.8 - (accHeads.length ? 1.3 : 0)) * SP;
      const ay = yOf(si, hi) - 0.6 * SP, end = yOf(si, lo) + 0.6 * SP;
      let path = `M ${ax} ${ay}`;
      const waves = Math.ceil((end - ay) / 7);
      for (let i = 0; i < waves; i++) path += ` q -4 1.75 0 3.5 q 4 1.75 0 3.5`;
      g.appendChild(S('path', { d: path, class: 'st-arpeggio', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.3 }));
      if (typeof ev.arpeggio === 'string') {
        const down = ev.arpeggio === 'down', tip = down ? ay + waves * 7 : ay;
        const tail = tip + (down ? -5 : 5);
        g.appendChild(S('path', { d: `M ${ax - 3} ${tail} L ${ax} ${tip} L ${ax + 3} ${tail}`, class: 'st-arpeggio-arrow', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5 }));
      }
    }
    if (ev.fermata) {
      const fx = (x + hw / 2) * SP, fy = Math.min(yOf(si, 8) - SP, topY - SP);
      g.appendChild(S('path', { d: `M ${fx - 7} ${fy} Q ${fx} ${fy - 14} ${fx + 7} ${fy}`, class: 'st-fermata', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.4 }));
      g.appendChild(S('circle', { cx: fx, cy: fy - 1, r: 1.7, class: 'st-fill' }));
      topY = fy - 7;
    }
    // hit area
    g.appendChild(rect((x - 0.6) * SP, yOf(si, hi) - 1.1 * SP, (hw + 1.2) * SP, (yOf(si, lo) - yOf(si, hi)) + 2.2 * SP, 'hit'));
    g._topY = topY;
    ev._topY = topY;
    g.dataset && (g.dataset.top = topY);
    return g;
  }

  function drawBeam(g, grp, evInfo, si) {
    const first = grp[0], last = grp[grp.length - 1];
    const up = first._stem === 1;
    const x1 = first._stemX, x2 = last._stemX + 0.12;
    let y1 = first._stemY1, y2 = last._stemY1;
    let slope = (y2 - y1) / ((x2 - x1) * SP);
    slope = Math.max(-0.12, Math.min(0.12, slope));
    const lineY = (xx) => y1 + slope * (xx - x1) * SP;
    // shift so every stem is at least its natural length
    let shift = 0;
    grp.forEach((e) => {
      const d = e._stemY1 - lineY(e._stemX);
      if (up) shift = Math.min(shift, d); else shift = Math.max(shift, d);
    });
    const Y = (xx) => lineY(xx) + shift;
    const th = 0.5 * SP;
    const pts = up
      ? [[x1, Y(x1)], [x2, Y(x2)], [x2, Y(x2) + th], [x1, Y(x1) + th]]
      : [[x1, Y(x1) - th], [x2, Y(x2) - th], [x2, Y(x2)], [x1, Y(x1)]];
    g.appendChild(S('polygon', { points: pts.map(([a, b]) => `${r3(a * SP)},${r3(b)}`).join(' '), class: 'st-beam' }));
    // Consecutive sixteenths share the second beam; a lone one gets a short hook.
    for (let i = 0; i < grp.length; i++) {
      if (grp[i].base !== 's') continue;
      let j = i;
      while (j + 1 < grp.length && grp[j + 1].base === 's') j++;
      let a = grp[i]._stemX, b = grp[j]._stemX + 0.12;
      if (i === j) {
        if (i === grp.length - 1) a -= Math.min(1, (a - grp[i - 1]._stemX) / 2);
        else b += Math.min(1, (grp[i + 1]._stemX - b) / 2);
      }
      const offset = (up ? 1 : -1) * 0.85 * SP;
      const y1b = Y(a) + offset, y2b = Y(b) + offset, depth = up ? th : -th;
      g.appendChild(S('polygon', { points: [[a, y1b], [b, y2b], [b, y2b + depth], [a, y1b + depth]].map(([xx, yy]) => `${r3(xx * SP)},${r3(yy)}`).join(' '), class: 'st-beam st-beam-secondary' }));
      i = j;
    }
    grp.forEach((e) => {
      const yEnd = Y(e._stemX);
      const y0 = e._stemY0;
      if (e._stemEl) { e._stemEl.setAttribute('y', r3(Math.min(y0, yEnd))); e._stemEl.setAttribute('height', r3(Math.abs(yEnd - y0))); }
      if (up) { const info = evInfo.get(e._ref); if (info) info.topY = Math.min(info.topY || Infinity, yEnd); e._topY = Math.min(e._topY, yEnd); }
    });
  }

  function drawRepeatStart(g, x, si) {
    // drawn later relative to staff; store as marker
    g.appendChild(S('g', { class: 'rep-start', 'data-x': x, 'data-si': si }));
  }
  function drawRepeatEnd(g, xEnd, from, to, yOf, top, bot) {
    const xThick = (xEnd - 0.5) * SP;
    g.appendChild(rect(xThick, top, 0.5 * SP, bot - top, 'st-bar'));
    g.appendChild(rect(xThick - 0.56 * SP, top, 0.16 * SP, bot - top, 'st-bar'));
    for (let si = from; si <= to; si++) {
      [3, 5].forEach((p) => g.appendChild(S('circle', { cx: r3(xThick - 1.05 * SP), cy: r3(yOf(si, p)), r: 0.25 * SP, class: 'st-fill' })));
    }
  }

  function drawCurves(gMain, score, evInfo, sysInfo) {
    // start repeats
    gMain.querySelectorAll('.rep-start').forEach((m) => {
      const x = +m.getAttribute('data-x');
      const si = +m.getAttribute('data-si');
      const sysG = m.parentNode;
      const idx = [...gMain.querySelectorAll('.system')].indexOf(sysG);
      const sy = sysInfo[idx];
      if (!sy) return;
      const top = sy.yOf(si, 8), bot = sy.yOf(si, 0);
      sysG.appendChild(rect(x * SP, top, 0.5 * SP, bot - top, 'st-bar'));
      sysG.appendChild(rect((x + 0.9) * SP, top, 0.16 * SP, bot - top, 'st-bar'));
      [3, 5].forEach((p) => sysG.appendChild(S('circle', { cx: r3((x + 1.5) * SP), cy: r3(sy.yOf(si, p)), r: 0.25 * SP, class: 'st-fill' })));
    });
    score.staves.forEach((st, si) => {
      const flat = [];
      st.measures.forEach((m) => m.events.forEach((e) => { if (!e.hidden) flat.push(e); }));
      let slurFrom = null;
      let hairFrom = null;
      flat.forEach((e, i) => {
        const info = evInfo.get(e._ref);
        if (!info || !e._heads) {
          return;
        }
        // ties
        if (e.tie && flat[i + 1]) {
          const nx = evInfo.get(flat[i + 1]._ref);
          if (nx) {
            e._heads.filter((hd) => !e.tieMidis || e.tieMidis.includes(hd.n.midi)).forEach((hd) => {
              const upperVoice = e.tieMidis && e.tieMidis.length < e._heads.length && hd.pos === Math.max(...e._heads.map((h) => h.pos));
              const below = !upperVoice && (e._stem === 1 || (e._stem === 0 && hd.pos < 4));
              const dir = below ? 1 : -1;
              const sy = sysInfo[info.sys];
              const y0 = sy.yOf(si, hd.pos) + dir * 0.55 * SP;
              const xa = (info.x + HEAD_W[e.base] + 0.15) * SP;
              let xb;
              if (nx.sys === info.sys) xb = (nx.x - 0.15) * SP;
              else xb = (sy.x1 - 0.2) * SP;
              gMain.appendChild(curve(xa, y0, xb, y0, dir, 'st-tie'));
              if (nx.sys !== info.sys) {
                const sy2 = sysInfo[nx.sys];
                const y2 = sy2.yOf(si, hd.pos) + dir * 0.55 * SP;
                gMain.appendChild(curve((nx.x - 2.2) * SP, y2, (nx.x - 0.15) * SP, y2, dir, 'st-tie'));
              }
            });
          }
        }
        if (e.slurStart) slurFrom = { e, i };
        if (e.slurEnd && slurFrom) {
          const a = evInfo.get(slurFrom.e._ref);
          const seg = flat.slice(slurFrom.i, i + 1).filter((x) => x._heads);
          const allDown = seg.every((x) => x._stem === -1);
          const above = allDown || seg.some((x) => x._stem === -1 && x._stem !== 1) && !seg.every((x) => x._stem === 1);
          const dir = above ? -1 : 1;
          const sy = sysInfo[a.sys];
          const endY = (x) => {
            const ps = x._heads.map((hd) => hd.pos);
            return above ? sy.yOf(si, Math.max(...ps)) - 0.9 * SP : sy.yOf(si, Math.min(...ps)) + 0.9 * SP;
          };
          const xa = (a.x + HEAD_W[slurFrom.e.base] / 2) * SP;
          let xb = (info.x + HEAD_W[e.base] / 2) * SP;
          let ya = endY(slurFrom.e), yb = endY(e);
          if (info.sys !== a.sys) { xb = (sy.x1 - 0.3) * SP; yb = ya; }
          // clear the notes in between
          let extreme = above ? Math.min(ya, yb) : Math.max(ya, yb);
          seg.forEach((x) => {
            const inf = evInfo.get(x._ref);
            if (!inf || inf.sys !== a.sys) return;
            const yy = endY(x) + (above ? -0.4 * SP : 0.4 * SP);
            extreme = above ? Math.min(extreme, yy) : Math.max(extreme, yy);
          });
          gMain.appendChild(curve(xa, ya, xb, yb, dir, 'st-slur', extreme));
          slurFrom = null;
        }
        if (e.hairpinStart) hairFrom = { e, info };
        if (e.hairpinEnd && hairFrom) {
          const sy = sysInfo[hairFrom.info.sys];
          const rowsY = (sy.tops[si] + 4 + (sy.ext[si].rows.dyn || 3.2)) * SP - 0.35 * SP;
          const xa = (hairFrom.info.x + (hairFrom.e.dyn ? 2.6 : 0)) * SP;
          const xb = (info.sys === hairFrom.info.sys ? info.x + HEAD_W[e.base] : sy.x1 - 0.5) * SP;
          const open = 0.9 * SP;
          const cresc = hairFrom.e.hairpinStart === 'cresc';
          const [n1, n2] = cresc ? [0, open] : [open, 0];
          gMain.appendChild(S('path', { d: `M${r3(xb)} ${r3(rowsY - n2 / 2)} L${r3(xa)} ${r3(rowsY - n1 / 2)} M${r3(xa)} ${r3(rowsY + n1 / 2)} L${r3(xb)} ${r3(rowsY + n2 / 2)}`, class: 'st-hairpin' }));
          hairFrom = null;
        }
      });
    });
  }
  function curve(xa, ya, xb, yb, dir, cls, extreme) {
    const len = Math.abs(xb - xa);
    let hgt = Math.min(2.2 * SP, Math.max(0.6 * SP, len * 0.18));
    let cy = (ya + yb) / 2 + dir * hgt;
    if (extreme != null) cy = dir < 0 ? Math.min(cy, extreme - 0.4 * SP) : Math.max(cy, extreme + 0.4 * SP);
    const th = 0.2 * SP;
    const c1x = xa + len * 0.25, c2x = xb - len * 0.25;
    const d = `M${r3(xa)} ${r3(ya)} C${r3(c1x)} ${r3(cy)} ${r3(c2x)} ${r3(cy)} ${r3(xb)} ${r3(yb)} C${r3(c2x)} ${r3(cy - dir * th)} ${r3(c1x)} ${r3(cy - dir * th)} ${r3(xa)} ${r3(ya)} Z`;
    return S('path', { d, class: cls });
  }

  /* ---------- Convenience builders ---------- */
  /* Build a score from note specs without time signature (for questions and diagrams).
     notes: ['C4', 'E4'] or [{ n:'C4', dur:'w'|'h'|'q', chord:['C4','E4','G4'], cls, staff }] */
  function fromNotes(spec) {
    const clef = spec.clef || 'treble';
    const grand = clef === 'grand';
    const staffClefs = grand ? ['treble', 'bass'] : [clef];
    const staves = staffClefs.map((c) => ({ clef: c, hand: c === 'bass' ? 'lh' : 'rh', measures: [] }));
    const groups = spec.measures || [spec.notes];
    groups.forEach((notes) => {
      const ms = staves.map(() => ({ events: [], startRepeat: false, endRepeat: false }));
      let t = 0;
      notes.forEach((raw) => {
        const it = typeof raw === 'string' ? { n: raw } : raw;
        const base = it.dur || spec.dur || 'w';
        const d = T.DUR[base] * (it.dots ? 1.5 : 1);
        const isRest = it.rest || it.n === 'r';
        const ns = isRest ? [] : (it.chord || [it.n]).map((x) => T.parse(x)).sort((a, b) => T.diatonic(a) - T.diatonic(b));
        let target = 0;
        if (grand) target = it.staff != null ? it.staff : (ns.length && ns[0].midi < 60 ? 1 : 0);
        staves.forEach((_, si) => {
          const ev = si === target
            ? { kind: isRest ? 'rest' : ns.length > 1 ? 'chord' : 'note', notes: ns, base, dots: it.dots ? 1 : 0, dur: d, start: t, cls: it.cls, hidden: it.hidden, fingers: it.fingers, stacc: it.stacc, dyn: it.dyn, tie: it.tie, tiedFrom: it.tiedFrom, slurStart: it.slurStart, slurEnd: it.slurEnd, hairpinStart: it.hairpinStart, hairpinEnd: it.hairpinEnd, label: it.label, measureRest: it.measureRest }
            : { kind: 'rest', hidden: true, notes: [], base, dur: d, start: t };
          ms[si].events.push(ev);
        });
        t += d;
      });
      ms.forEach((m) => { m.total = t; });
      staves.forEach((st, si) => st.measures.push(ms[si]));
    });
    return { key: spec.key || 'C', time: spec.time || null, bpm: spec.time ? T.beatsPerMeasure(spec.time) : null, staves, forceAcc: !!spec.forceAcc };
  }

  MC.Staff = {
    render,
    fromNotes,
    SP,
    /* Quick render of note specs. */
    notes(target, spec, opts) {
      const score = fromNotes(spec);
      return render(target, score, Object.assign({ free: !spec.time, timeSig: !!spec.time, barlines: !!spec.barlines || !!spec.time, finalBar: !!spec.finalBar, justify: false, freeSpacing: spec.spacing || 5.5, showNames: spec.names }, opts || {}));
    },
    /* Click-to-place staff: pick a line or space. onPick(pos, note). */
    picker(target, o) {
      o = Object.assign({ clef: 'treble', minPos: -3, maxPos: 11, width: 16, spPx: 12, onPick: null, key: 'C' }, o);
      const svg = S('svg', { class: 'staff-svg staff-picker', role: 'group', 'aria-label': `Staff: choose a line or space (${o.clef} clef)` });
      const top = Math.max(2.5, (o.maxPos - 8) / 2 + 1.5);
      const H = top + 4 + Math.max(2.5, -o.minPos / 2 + 1.5);
      const yOf = (pos) => (top + 4 - pos / 2) * SP;
      const g = S('g');
      for (let i = 0; i < 5; i++) g.appendChild(rect(0.3 * SP, yOf(i * 2) - 0.065 * SP, (o.width - 0.6) * SP, 0.13 * SP, 'st-line'));
      g.appendChild(o.clef === 'treble' ? glyph(G.gClef, 0.9 * SP, yOf(2), 'clef') : glyph(G.fClef, 0.9 * SP, yOf(6), 'clef'));
      svg.appendChild(g);
      const noteX = o.width * 0.6;
      const ghost = S('g', { class: 'ghost' });
      const marks = S('g');
      svg.appendChild(marks);
      svg.appendChild(ghost);
      const drawNote = (grp, pos, cls, label) => {
        MC.util.clear(grp);
        if (pos == null) return;
        for (let p = -2; p >= pos; p -= 2) grp.appendChild(rect((noteX - 0.4) * SP, yOf(p) - 0.08 * SP, 2 * SP, 0.16 * SP, 'st-ledger'));
        for (let p = 10; p <= pos; p += 2) grp.appendChild(rect((noteX - 0.4) * SP, yOf(p) - 0.08 * SP, 2 * SP, 0.16 * SP, 'st-ledger'));
        grp.appendChild(glyph(G.nhWhole, noteX * SP, yOf(pos), 'nh ' + (cls || '')));
        if (label) grp.appendChild(text(label, (noteX + 2.6) * SP, yOf(pos) + 0.5 * SP, 'st-pick-label ' + (cls || ''), 'start'));
      };
      const hits = S('g', { class: 'pick-hits' });
      let focusPos = 4;
      for (let p = o.minPos; p <= o.maxPos; p++) {
        const r = rect(3.6 * SP, yOf(p) - 0.25 * SP, (o.width - 4) * SP, 0.5 * SP, 'pick-hit');
        r.setAttribute('data-pos', p);
        hits.appendChild(r);
      }
      svg.appendChild(hits);
      svg.setAttribute('tabindex', '0');
      svg.setAttribute('viewBox', `0 0 ${o.width * SP} ${H * SP}`);
      svg.setAttribute('width', o.width * o.spPx);
      svg.setAttribute('height', H * o.spPx);
      const posFromEvent = (e) => {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
        const pos = Math.round((top + 4 - loc.y / SP) * 2);
        return Math.max(o.minPos, Math.min(o.maxPos, pos));
      };
      let locked = false;
      svg.addEventListener('pointermove', (e) => { if (!locked) drawNote(ghost, posFromEvent(e), 'ghost-note', T.name(T.fromPos(posFromEvent(e), o.clef), false)); });
      svg.addEventListener('pointerleave', () => { if (!locked) drawNote(ghost, null); });
      svg.addEventListener('click', (e) => { if (!locked && o.onPick) { const p = posFromEvent(e); o.onPick(p, T.fromPos(p, o.clef, T.keyAcc(o.key, T.fromPos(p, o.clef).letter))); } });
      svg.addEventListener('keydown', (e) => {
        if (locked) return;
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); focusPos = Math.max(o.minPos, Math.min(o.maxPos, focusPos + (e.key === 'ArrowUp' ? 1 : -1))); drawNote(ghost, focusPos, 'ghost-note', `${T.name(T.fromPos(focusPos, o.clef), false)} — ${T.posDesc(focusPos)}`); }
        if ((e.key === 'Enter' || e.key === ' ') && o.onPick) { e.preventDefault(); o.onPick(focusPos, T.fromPos(focusPos, o.clef)); }
      });
      if (target) { MC.util.clear(target); target.appendChild(svg); }
      return {
        svg,
        show(pos, cls, label) { drawNote(marks, pos, cls, label); },
        addMark(pos, cls, label) { const gg = S('g'); marks.appendChild(gg); drawNote(gg, pos, cls, label); },
        clear() { MC.util.clear(marks); MC.util.clear(ghost); },
        lock(v) { locked = v; if (v) MC.util.clear(ghost); },
      };
    },
  };
})(window.MC = window.MC || {});
