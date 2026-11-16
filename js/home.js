// Homepage motion. Each piece no-ops when its root is absent, so this is safe on every page.
import { onView } from './onview.js';
import { initTabs } from './tabs.js';

export function init({ reduced }) {
  const all = (s) => document.querySelectorAll(s);
  all('[data-field]').forEach((c) => canvasLoop(c, reduced, dotField()));
  all('[data-globe]').forEach((c) => canvasLoop(c, reduced, globe()));
  all('[data-ticker]').forEach((el) => ticker(el, reduced));
  all('[data-live]').forEach((el) => live(el, reduced));
  all('[data-ftabs]').forEach((el) => featureTabs(el, reduced));
}

// Toggle .is-live while el is on screen; CSS runs (or pauses) its animations from that.
function live(el, reduced) {
  if (reduced) { el.classList.add('is-live'); return; }
  onView(el, { enter: () => el.classList.add('is-live'), leave: () => el.classList.remove('is-live'), threshold: 0.2 });
}

// DPR-aware canvas that redraws on resize and animates only while on screen; one static frame when reduced.
function canvasLoop(canvas, reduced, { setup, draw }) {
  const ctx = canvas.getContext('2d');
  const t0 = performance.now();
  let raf = 0;
  const now = () => (reduced ? 0 : (performance.now() - t0) / 1000);
  const frame = () => { draw(ctx, now()); raf = requestAnimationFrame(frame); };
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    setup(w, h);
    draw(ctx, now());
  };
  new ResizeObserver(resize).observe(canvas);
  document.fonts?.ready.then(resize);
  if (reduced) return;
  onView(canvas, {
    enter: () => { raf ||= requestAnimationFrame(frame); },
    leave: () => { cancelAnimationFrame(raf); raf = 0; },
    threshold: 0,
  });
}

// Hero band: a dot grid lit by drifting green waves, with currency tags gliding along rows and leaving a trail.
function dotField() {
  const GAP = 22, TRAIL = 150, LABELS = ['EUR', 'USD', 'GBP', '€', '$', '£'];
  let w = 0, h = 0, cols = 0, rows = 0, tags = [];
  const setup = (W, H) => {
    w = W; h = H;
    cols = Math.ceil(w / GAP) + 1;
    rows = Math.max(3, Math.floor(h / GAP));
    const n = Math.max(4, Math.min(10, Math.round(w / 150)));
    // keep tags off the rows behind the centred hero card
    const oy = (h - (rows - 1) * GAP) / 2;
    let free = [...Array(rows - 2).keys()].map((r) => r + 1).filter((r) => Math.abs(oy + r * GAP - h / 2) > 44);
    if (!free.length) free = [1];
    free.sort(() => Math.random() - 0.5);
    tags = Array.from({ length: n }, (_, i) => ({
      label: LABELS[i % LABELS.length],
      row: free[i % free.length],
      x: Math.random() * (w + 200),
      v: (16 + Math.random() * 22) * (i % 2 ? -1 : 1),
    }));
  };
  const draw = (ctx, t) => {
    ctx.clearRect(0, 0, w, h);
    const ox = (w - (cols - 1) * GAP) / 2, oy = (h - (rows - 1) * GAP) / 2, span = w + 200;
    for (const g of tags) g.cx = ((((g.x + g.v * t) % span) + span) % span) - 100;
    ctx.fillStyle = 'rgba(13,31,23,.13)';
    ctx.beginPath();
    const lit = [];
    for (let r = 0; r < rows; r++) {
      const y = oy + r * GAP, onRow = tags.filter((g) => g.row === r);
      for (let c = 0; c < cols; c++) {
        const x = ox + c * GAP;
        const s = Math.sin(x * 0.011 + t * 0.7) + Math.sin(y * 0.05 - t * 0.45 + x * 0.004) + Math.sin((x - y) * 0.007 + t * 0.35);
        let a = Math.min(1, Math.max(0, (s - 1.5) / 1.2));
        for (const g of onRow) {
          const d = (g.cx - x) * Math.sign(g.v); // distance behind the tag
          if (d > 0 && d < TRAIL) a = Math.max(a, 1 - d / TRAIL);
        }
        if (a > 0.04) lit.push(x, y, a);
        else { ctx.moveTo(x + 1.1, y); ctx.arc(x, y, 1.1, 0, Math.PI * 2); }
      }
    }
    ctx.fill();
    for (let i = 0; i < lit.length; i += 3) {
      ctx.fillStyle = `rgba(47,210,127,${0.25 + lit[i + 2] * 0.75})`;
      ctx.beginPath();
      ctx.arc(lit[i], lit[i + 1], 1.1 + lit[i + 2] * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
    ctx.textBaseline = 'middle';
    for (const g of tags) {
      const y = oy + g.row * GAP, tw = ctx.measureText(g.label).width, pw = tw + 28, x = g.cx - pw / 2;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(13,31,23,.12)';
      ctx.beginPath();
      ctx.roundRect(x, y - 11, pw, 22, 11);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#2fd27f';
      ctx.beginPath();
      ctx.arc(x + 10, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0d1f17';
      ctx.fillText(g.label, x + 18, y + 0.5);
    }
  };
  return { setup, draw };
}

// Payments pillar: a slowly turning dotted sphere with a few glowing hubs.
function globe() {
  const N = 560, GOLD = Math.PI * (3 - Math.sqrt(5)), HUBS = new Set([61, 148, 233, 317, 402, 488]);
  const pts = Array.from({ length: N }, (_, i) => {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = GOLD * i;
    return [Math.cos(th) * r, y, Math.sin(th) * r];
  });
  let w = 0, h = 0;
  const setup = (W, H) => { w = W; h = H; };
  const draw = (ctx, t) => {
    ctx.clearRect(0, 0, w, h);
    const R = Math.min(w, h) * 0.4, cx = w / 2, cy = h / 2, a = t * 0.22 + 0.6, tilt = 0.38;
    const ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(tilt), st = Math.sin(tilt);
    ctx.strokeStyle = 'rgba(13,31,23,.08)';
    ctx.beginPath();
    ctx.arc(cx, cy, R + 6, 0, Math.PI * 2);
    ctx.stroke();
    pts.forEach(([x, y, z], i) => {
      const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
      const y2 = y * ct - z1 * st, z2 = y * st + z1 * ct; // z2 > 0 faces the viewer
      const depth = (z2 + 1) / 2;
      const hub = HUBS.has(i) && z2 > 0;
      ctx.fillStyle = hub ? `rgba(47,210,127,${0.6 + 0.4 * Math.sin(t * 2 + i)})` : `rgba(13,31,23,${0.05 + depth * 0.4})`;
      ctx.beginPath();
      ctx.arc(cx + x1 * R, cy - y2 * R, hub ? 3.2 : 0.6 + depth * 1.1, 0, Math.PI * 2);
      ctx.fill();
    });
  };
  return { setup, draw };
}

// Accounts pillar: cycle the balance EUR -> USD -> GBP with a counting number.
function ticker(el, reduced) {
  const amt = el.querySelector('[data-amt]'), code = el.querySelector('[data-ccy]'), chips = el.querySelectorAll('[data-chip]');
  const SET = [['EUR', 12480.2], ['USD', 8215.75], ['GBP', 4930.1]];
  if (reduced || !amt) return;
  let i = 0, timer = 0;
  const step = () => {
    const from = SET[i][1];
    i = (i + 1) % SET.length;
    const [c, to] = SET[i];
    const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: c });
    code.textContent = c;
    chips.forEach((ch, j) => ch.classList.toggle('is-on', j === i));
    tween(from, to, (v) => { amt.textContent = fmt.format(v); });
  };
  onView(el, { enter: () => { timer ||= setInterval(step, 3000); }, leave: () => { clearInterval(timer); timer = 0; } });
}

function tween(from, to, set, ms = 900) {
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / ms);
    set(from + (to - from) * (1 - (1 - p) ** 3));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Sticky feature tabs: the active panel's bar fills (CSS, ~5s) and advances on animationend.
// Paused while hovered, focused or off screen; no auto-advance when reduced.
function featureTabs(root, reduced) {
  const scenes = root.querySelectorAll('.h-ft__scene');
  const tabs = initTabs(root, { onChange: (i) => scenes.forEach((s, j) => s.classList.toggle('is-active', j === i)) });
  if (reduced) return;
  const st = { hover: false, focus: false, view: false };
  const sync = () => root.classList.toggle('is-paused', st.hover || st.focus || !st.view);
  root.classList.add('is-auto');
  sync();
  root.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { st.hover = true; sync(); } });
  root.addEventListener('pointerleave', () => { st.hover = false; sync(); });
  root.addEventListener('focusin', () => { st.focus = true; sync(); });
  root.addEventListener('focusout', (e) => { st.focus = root.contains(e.relatedTarget); sync(); });
  onView(root, { enter: () => { st.view = true; sync(); }, leave: () => { st.view = false; sync(); }, threshold: 0.15 });
  root.addEventListener('animationend', (e) => {
    if (e.target.classList.contains('h-ft__bar')) tabs.select((tabs.index + 1) % tabs.count);
  });
}
