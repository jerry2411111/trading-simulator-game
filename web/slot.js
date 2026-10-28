// The slot machine: every 5 trades three reels spin and stop on the prize (the server rolls it). The game
// is paused while it shows; "Collect" starts the clock again.
import { drawCollectible, RARITY } from './collect.js';

const $ = (id) => document.getElementById(id);
export const SYMBOLS = {  // reel label and color for each outcome
  double: ['2x', '#00ff9f'], x5: ['5x', '#ffe14d'], shield: ['SHIELD', '#00e5ff'], next_day: ['ORACLE', '#b45cff'],
  free10: ['FREE 10', '#ff9a3a'], free30: ['FREE 30', '#ff4fd8'], gift: ['GIFT', '#ffc23a'], range2h: ['2H RANGE', '#7fd4ff'],
};
const ORDER = Object.keys(SYMBOLS);
const CELL = 54;   // px per symbol on a reel

function strip(final, turns) {
  const syms = [];
  for (let i = 0; i < turns * ORDER.length; i++) syms.push(ORDER[(i * 3 + turns) % ORDER.length]);
  syms.push(final);
  return syms;
}

export function initSlot(ctx) {
  const box = $('slot');
  const reels = [...box.querySelectorAll('.reel-strip')];
  let busy = false;
  const queue = [];

  function describe(m) {
    const d = m.detail;
    if (m.outcome === 'gift' && d) return `<canvas id="slot-gift" class="pixel" width="40" height="32"></canvas><p><b>${d.name}</b> <span style="color:${RARITY[d.rarity]}">${d.rarity.toUpperCase()}</span><br>${d.note}</p><p class="muted">Added to your collection.</p>`;
    if (m.outcome === 'next_day' && d) {
      const dir = { up: '▲ UP', down: '▼ DOWN', flat: '■ FLAT', unknown: '? unknown (no next day in this game)' }[d.direction];
      return `<p>${d.stock} closes the next trading day <b class="${d.direction === 'up' ? 'up' : d.direction === 'down' ? 'down' : ''}">${dir}</b> compared with today's close.</p>`;
    }
    if (m.outcome === 'range2h' && d) return `<p>${d.stock}, next 2 hours: high <b class="up">${d.high.toFixed(2)}</b>, low <b class="down">${d.low.toFixed(2)}</b>. Both are marked on the chart.</p>`;
    return '';
  }

  async function show(m) {
    busy = true;
    box.hidden = false;
    box.classList.add('spinning');
    $('slot-result').hidden = true;
    reels.forEach((r, i) => {
      const syms = strip(m.outcome, 3 + i * 2);
      r.innerHTML = syms.map((s) => `<div class="sym" style="color:${SYMBOLS[s][1]}">${SYMBOLS[s][0]}</div>`).join('');
      r.style.transition = 'none';
      r.style.transform = 'translateY(0)';
      void r.offsetHeight;
      r.style.transition = `transform ${1.2 + i * 0.6}s cubic-bezier(0.15, 0.6, 0.25, 1)`;
      r.style.transform = `translateY(-${(syms.length - 1) * CELL}px)`;
    });
    await new Promise((res) => setTimeout(res, 1200 + 2 * 600 + 200));
    box.classList.remove('spinning');
    box.classList.add('won');
    $('slot-title').textContent = m.title;
    $('slot-title').style.color = SYMBOLS[m.outcome][1];
    $('slot-text').textContent = m.text;
    $('slot-detail').innerHTML = describe(m);
    $('slot-result').hidden = false;
    if (m.outcome === 'gift' && m.detail) {
      const c = $('slot-gift');
      const anim = () => { if (!box.hidden && c.isConnected) { drawCollectible(c.getContext('2d'), m.detail, performance.now() / 1000); requestAnimationFrame(anim); } };
      anim();
    }
    ctx.onBonus(m.bonus);
  }

  $('slot-collect').onclick = () => {
    box.hidden = true;
    box.classList.remove('won');
    busy = false;
    if (queue.length) show(queue.shift());
    else ctx.resume();
  };

  return {
    spin(m) { if (busy) queue.push(m); else show(m); },
  };
}
