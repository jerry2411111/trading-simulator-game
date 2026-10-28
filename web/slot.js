// The slot machine: every 5 trades earns a spin. Spins wait in the rewards window until the player pulls
// the lever; each prize goes into storage and is used whenever the player chooses. The game pauses while
// the reels turn; "Store it" starts the clock again.
import { drawCollectible, RARITY } from './collect.js';

const $ = (id) => document.getElementById(id);
export const SYMBOLS = {  // reel label and color for each outcome
  double: ['2x', '#00ff9f'], x5: ['5x', '#ffe14d'], shield: ['SHIELD', '#00e5ff'], next_day: ['ORACLE', '#b45cff'],
  free10: ['FREE 10', '#ff9a3a'], free30: ['FREE 30', '#ff4fd8'], gift: ['GIFT', '#ffc23a'], range2h: ['2H RANGE', '#7fd4ff'],
};
const ORDER = Object.keys(SYMBOLS);
const CELL = 54;   // px per symbol on a reel
const WHEN = {     // what using a prize applies to
  double: 'your next closing trade', x5: 'your next closing trade', shield: 'your next closing trade',
  free10: 'your next trades', free30: 'your next trades', next_day: 'the stock you are viewing',
  range2h: 'the stock you are viewing, from now', gift: 'your collection',
};

function strip(final, turns) {
  const syms = [];
  for (let i = 0; i < turns * ORDER.length; i++) syms.push(ORDER[(i * 3 + turns) % ORDER.length]);
  syms.push(final);
  return syms;
}

export function initSlot(ctx) {
  const box = $('slot');
  const win = $('prizes');
  const reels = [...box.querySelectorAll('.reel-strip')];
  let busy = false;
  let bonus = null;
  const queue = [];

  function describe(m) {
    const d = m.detail;
    if (m.outcome === 'gift' && d) return `<canvas id="prize-gift" class="pixel" width="40" height="32"></canvas><p><b>${d.name}</b> <span style="color:${RARITY[d.rarity]}">${d.rarity.toUpperCase()}</span><br>${d.note}</p><p class="muted">Added to your collection.</p>`;
    if (m.outcome === 'next_day' && d) {
      const dir = { up: '▲ UP', down: '▼ DOWN', flat: '■ FLAT', unknown: '? unknown (no data for the next day)' }[d.direction];
      return `<p>${d.stock} closes the next trading day <b class="${d.direction === 'up' ? 'up' : d.direction === 'down' ? 'down' : ''}">${dir}</b> compared with today's close.</p>`;
    }
    if (m.outcome === 'range2h' && d) return `<p>${d.stock}, next 2 hours: high <b class="up">${d.high.toFixed(2)}</b>, low <b class="down">${d.low.toFixed(2)}</b>. Both are marked on the chart.</p>`;
    return '';
  }

  function render(b) {
    bonus = b;
    const spins = b.spins ?? 0;
    const stored = (b.prizes ?? []).reduce((a, p) => a + p.n, 0);
    const btn = $('prize-btn');
    btn.textContent = `🎰 ${spins} spin${spins === 1 ? '' : 's'} · 🎁 ${stored} stored`;
    btn.classList.toggle('ready', spins > 0);
    $('prize-spins').textContent = spins ? `${spins} spin${spins === 1 ? '' : 's'} ready to pull` : `No spins. Next spin in ${b.next_spin} trade${b.next_spin === 1 ? '' : 's'}.`;
    $('prize-spin').disabled = !spins;
    const list = [...(b.prizes ?? [])].sort((a, c) => ORDER.indexOf(a.outcome) - ORDER.indexOf(c.outcome));
    $('prize-list').innerHTML = list.length
      ? list.map((p) => `<div class="prize">
          <b class="prize-sym" style="color:${SYMBOLS[p.outcome][1]}">${SYMBOLS[p.outcome][0]}</b>
          <span class="prize-n">×${p.n}</span>
          <span class="prize-text">${p.text}<br><span class="muted">Applies to ${WHEN[p.outcome]}.</span></span>
          <button data-use="${p.outcome}">Use</button>
        </div>`).join('')
      : '<p class="muted">Nothing stored yet. Pull the lever to win something.</p>';
    $('prize-list').querySelectorAll('[data-use]').forEach((el) => { el.onclick = () => ctx.send('use_prize', { outcome: el.dataset.use }); });
  }

  function open() {
    $('prize-used').hidden = true;
    if (bonus) render(bonus);
    if (!win.open) win.showModal();
  }

  async function show(m) {
    busy = true;
    if (win.open) win.close();   // the reels show on top of the game, not behind the window
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
    $('slot-detail').innerHTML = '<p class="muted">Stored in your rewards. Use it whenever you like.</p>';
    $('slot-result').hidden = false;
    ctx.onBonus(m.bonus);
  }

  $('slot-collect').onclick = () => {
    box.hidden = true;
    box.classList.remove('won');
    busy = false;
    if (queue.length) return show(queue.shift());
    ctx.resume();
    open();
  };
  $('prize-btn').onclick = open;
  $('prize-spin').onclick = () => ctx.send('spin');
  $('prizes-close').onclick = () => win.close();

  return {
    render,
    spin(m) { if (busy) queue.push(m); else show(m); },
    used(m) {   // a prize was used: say what it did, in the rewards window
      const el = $('prize-used');
      el.innerHTML = `<p class="slot-title prize-title" style="color:${SYMBOLS[m.outcome][1]}">${m.title}</p><p>${m.text}</p>${describe(m)}`;
      el.hidden = false;
      if (!win.open) win.showModal();
      if (m.outcome === 'gift' && m.detail) {
        const c = $('prize-gift');
        const anim = () => { if (win.open && c.isConnected) { drawCollectible(c.getContext('2d'), m.detail, performance.now() / 1000); requestAnimationFrame(anim); } };
        anim();
      }
    },
  };
}
