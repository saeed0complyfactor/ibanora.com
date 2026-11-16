// Service page motion. Each [data-svc] mock steps through states while in view (see tools/pages/_service.mjs).
// Markup ships in the final state, so reduced motion and no-JS show a finished mock. No-ops without mocks.
import { onView } from './onview.js';

const num = (s) => parseFloat(s.replace(/,/g, '')) || 0;
const fmt = (n, d) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

function tween(el, to) {
  const from = num(el.textContent), target = num(to), d = (to.split('.')[1] || '').length;
  const id = (el.tw = (el.tw || 0) + 1); // a newer tween on the same element stops this one
  if (from === target) { el.textContent = to; return; }
  const t0 = performance.now();
  const step = (t) => {
    if (el.tw !== id) return;
    const k = Math.min(1, (t - t0) / 800);
    el.textContent = k < 1 ? fmt(from + (target - from) * (1 - (1 - k) ** 3), d) : to;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function cycle(root) {
  const q = (a) => [...root.querySelectorAll(`[data-${a}]`)];
  const ats = q('at'), eqs = q('eq'), vals = q('vals'), txts = q('txt');
  const list = (el, key) => el.dataset[key].split('|');
  const n = Math.max(1, ...ats.map((e) => +e.dataset.at + 1), ...eqs.map((e) => +e.dataset.eq + 1),
    ...vals.map((e) => list(e, 'vals').length), ...txts.map((e) => list(e, 'txt').length));
  const pick = (arr, s) => arr[Math.min(s, arr.length - 1)];

  const set = (s, animate) => {
    ats.forEach((e) => e.classList.toggle('is-off', s < +e.dataset.at));
    eqs.forEach((e) => e.classList.toggle('is-off', s !== +e.dataset.eq));
    txts.forEach((e) => { e.textContent = pick(list(e, 'txt'), s); });
    vals.forEach((e) => { const v = pick(list(e, 'vals'), s); if (animate) tween(e, v); else e.textContent = v; });
  };

  const ms = +root.dataset.ms || 1400;
  let s = 0, timer = 0;
  const tick = () => {
    s = (s + 1) % n;
    set(s, true);
    timer = setTimeout(tick, s === n - 1 ? ms * 2.6 : ms);
  };
  set(0, false);
  onView(root, {
    enter: () => { timer = setTimeout(tick, ms * 0.6); },
    leave: () => clearTimeout(timer),
  });
}

export function init({ reduced }) {
  if (reduced) return;
  document.querySelectorAll('[data-svc]').forEach(cycle);
}
