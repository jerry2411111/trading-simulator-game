// Store: buy pets, seeds, saplings, houses, furniture, fish and sea life with coins; sell unused items
// back; mortgage the home for trading dollars and pay loans back.
import { drawFlower, drawPet, drawPool, drawTree } from './art.js';
import { drawFurniture, drawHouse, HOUSE_W, TILE } from './build.js';
import { drawSea } from './sea.js';
import { rect } from './pixel.js';

const $ = (id) => document.getElementById(id);
const TABS = ['Pets', 'Flowers', 'Trees', 'Garden & houses', 'Furniture', 'Fish', 'Sea life', 'Mortgage', 'Sell'];
const KINDS = {
  Pets: ['pet'], Flowers: ['flower'], Trees: ['tree'], 'Garden & houses': ['house'], Furniture: ['furniture'],
  Fish: ['fish'], 'Sea life': ['sea', 'ice'],
};
const BUILD_TAB = { pool: 'Garden & houses', aquarium: 'Fish', iceland: 'Sea life' };
const SEA_SIZE = { whale: [60, 30], shark: [36, 20], manta: [30, 18] };

// A small preview (drawn once) of any catalog item.
function preview(id, info) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const size = {
    pet: [34, 24], flower: [26, 20], tree: [46, 54], house: [HOUSE_W[id] + 8, 104], fish: [26, 18],
    sea: SEA_SIZE[id] ?? [26, 26], ice: [26, 24], build: [72, 40],
  }[info.kind] ?? [info.size[0] * TILE + 2, info.size[1] * TILE + 2];
  [c.width, c.height] = size;
  if (info.kind === 'pet') drawPet(g, id, 17, 22, { dir: 1, pose: id === 'parrot' ? 'perch' : 'idle' }, 0);
  else if (info.kind === 'flower') drawFlower(g, id, 13, 19, 3, 0);
  else if (info.kind === 'tree') drawTree(g, id, 23, 53, 3, 0, 0, id === 'apple');
  else if (info.kind === 'house') drawHouse(g, id, size[0] / 2, 102, 0);
  else if (['fish', 'sea', 'ice'].includes(info.kind)) {
    rect(g, 0, 0, size[0], size[1], '#0e3a6a');
    drawSea(g, id, size[0] / 2, info.kind === 'ice' ? size[1] - 3 : size[1] / 2, 1, 0, 'stand');
  } else if (info.kind === 'build') {
    if (id === 'pool') drawPool(g, 6, 6, 60, 28, 0);
    else {
      rect(g, 0, 0, 72, 40, id === 'iceland' ? '#8fd0ff' : '#0e4a8a');
      rect(g, 0, 32, 72, 8, id === 'iceland' ? '#e8f4ff' : '#d8c08a');
      if (id === 'iceland') { rect(g, 30, 14, 42, 18, '#ffffff'); drawSea(g, 'penguin', 46, 14, 1, 0, 'stand'); drawSea(g, 'seal', 60, 14, -1, 0, 'stand'); } else { drawSea(g, 'clownfish', 20, 14, 1, 0); drawSea(g, 'jellyfish', 50, 16, 1, 0); }
    }
  } else {
    g.translate(1, 1);
    drawFurniture(g, id, info.size[0] * TILE, info.size[1] * TILE, 0);
  }
  c.className = 'pixel';
  const scale = info.kind === 'house' ? Math.max(1, Math.floor(240 / c.width)) : Math.max(1, Math.min(6, Math.floor(108 / Math.max(c.width, c.height * 1.1))));
  c.style.width = `${c.width * scale}px`;
  c.style.height = `${c.height * scale}px`;
  return c;
}

function detail(info) {
  if (info.kind === 'pet') return `Meal: ${info.meal} coins`;
  if (info.kind === 'flower') return `Blooms in ${info.hours} h, sells for ${info.sells}`;
  if (info.kind === 'tree') return `Grows in ${info.hours} h, then +${info.yield} every ${info.every} h`;
  if (info.kind === 'house') return `Level ${info.level} · ${info.grid[0]}×${info.grid[1]} floor`;
  if (info.kind === 'furniture') return `${info.size[0]}×${info.size[1]} tiles`;
  if (['fish', 'sea', 'ice'].includes(info.kind)) return `Food: ${info.meal} coins a meal`;
  return { pool: 'Goes in the pool corner (clean it first)', aquarium: 'Holds sea life; fish move in too', iceland: 'Penguins and seals live on it' }[info.id] ?? '';
}

export function initStore(ctx) {
  let tab = 'Pets';
  let data = null;

  async function load(next) {
    data = next ?? await (await fetch('/api/home')).json();
    ctx.coins(data.coins);
    ctx.onHome?.(data);
    render();
  }

  async function post(action, body) {
    const r = await (await fetch(`/api/home/${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })).json();
    if (!r.ok) { ctx.toast(r.message); return null; }
    load(r);
    return r;
  }

  async function act(action, item) {
    if (await post(action, { item })) ctx.toast(action === 'buy' ? `Bought ${data.catalog[item].name.split(' (')[0]}!` : `Sold ${data.catalog[item].name}.`);
  }

  function card(id, info, price, label, action, disabled, note = '') {
    const div = document.createElement('div');
    div.className = `card${info.kind === 'house' ? ' wide' : ''}`;
    const pv = document.createElement('div');
    pv.className = 'card-art';
    pv.append(preview(id, { ...info, id }));
    const owned = data.state.inventory[id] ? ` · own ${data.state.inventory[id]}` : '';
    div.append(pv);
    div.insertAdjacentHTML('beforeend', `<b>${info.name}</b><span class="num">🪙 ${price.toLocaleString()}</span><small class="muted">${note || detail({ ...info, id })}${owned}</small>`);
    const b = document.createElement('button');
    b.textContent = label;
    b.className = 'primary';
    b.disabled = disabled;
    b.onclick = () => act(action, id);
    div.append(b);
    return div;
  }

  // Why a tab's items can't be bought yet ('' when they can).
  function lockReason(name) {
    const s = data.state;
    if (name === 'Fish' && !data.has_tank) return 'Buy a fish tank (Furniture) to unlock fish.';
    if (name === 'Sea life' && !s.aquarium) return 'Upgrade your fish tank to the aquarium (Fish tab) to unlock sea life.';
    return '';
  }

  function mortgageTab() {
    const out = [];
    const intro = document.createElement('div');
    intro.className = 'mortgage';
    intro.innerHTML = '<p>Mortgage things for <b>dollars in your trading account</b>: one house, building or piece of furniture '
      + 'for 70% of its price, or the whole home for $20,000 + 70% of everything in it (that locks the home until you pay it back). '
      + 'Paying back takes the same dollars from your account\'s cash. This is the only way to add money to the account.</p>';
    out.push(intro);
    const list = (title, rows) => {
      const box = document.createElement('div');
      box.className = 'mortgage';
      box.innerHTML = `<div class="box-title">${title}</div>`;
      const ul = document.createElement('ul');
      ul.className = 'list';
      rows.forEach((r) => ul.append(r));
      if (!rows.length) ul.innerHTML = '<li class="muted">Nothing here.</li>';
      box.append(ul);
      out.push(box);
    };
    const row = (text, amount, label, onclick, cls) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${text}</span><b class="num">$${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</b>`;
      const b = document.createElement('button');
      b.textContent = label;
      b.className = cls;
      b.onclick = onclick;
      li.append(b);
      return li;
    };
    list('YOUR LOANS', data.state.loans.map((l) => row(l.label, l.amount, 'Pay back', () => post('redeem', { id: l.id }), '')));
    list('MORTGAGE', data.loan_offers.map((o) => row(o.label, o.amount, 'Mortgage', () => post('mortgage', { kind: o.kind, ref: o.ref }), o.kind === 'all' ? 'primary' : '')));
    return out;
  }

  function render() {
    const s = data.state;
    $('store-coins').textContent = `🪙 ${Math.trunc(data.coins).toLocaleString()}`;
    $('store-tabs').replaceChildren(...TABS.map((name) => {
      const b = document.createElement('button');
      b.textContent = `${name}${lockReason(name) ? ' 🔒' : ''}`;
      b.classList.toggle('active', name === tab);
      b.onclick = () => { tab = name; render(); };
      return b;
    }));
    const entries = Object.entries(data.catalog);
    let cards = [];
    if (tab === 'Mortgage') {
      cards = mortgageTab();
    } else if (tab === 'Sell') {
      cards = Object.entries(s.inventory).filter(([, n]) => n > 0).map(([id, n]) => {
        const info = data.catalog[id];
        return card(id, info, Math.floor(info.price / 2), `Sell (${n})`, 'sell', data.locked);
      });
      if (!cards.length) cards = [Object.assign(document.createElement('p'), { className: 'muted', textContent: 'Nothing to sell: unplaced furniture, seeds and saplings show up here. Collection pieces can never be sold.' })];
    } else {
      const lock = lockReason(tab);
      const builds = entries.filter(([id, info]) => info.kind === 'build' && BUILD_TAB[id] === tab);
      const items = entries.filter(([, info]) => KINDS[tab].includes(info.kind)).sort((a, b) => a[1].price - b[1].price);
      cards = [...builds, ...items].map(([id, info]) => {
        const own = (info.kind === 'house' && s.houses.includes(id)) || (info.kind === 'build' && s[id]);
        const iceLock = info.kind === 'ice' && !s.iceland;
        const buildLock = info.kind === 'build' && ((id === 'aquarium' && !data.has_tank) || (id === 'iceland' && !s.aquarium));
        const locked = (lock && info.kind !== 'build') || iceLock || buildLock;
        const note = iceLock ? 'Needs the ice land' : buildLock ? (id === 'aquarium' ? 'Needs a fish tank' : 'Needs the aquarium') : '';
        const short = Math.ceil(info.price - data.coins);
        const label = own ? 'Owned' : locked ? 'Locked' : short > 0 ? `Need ${short.toLocaleString()} more` : 'Buy';
        return card(id, info, info.price, label, 'buy', own || locked || data.locked || short > 0, note);
      });
      if (lock) cards.unshift(Object.assign(document.createElement('p'), { className: 'muted lock-note', textContent: lock }));
      if (data.coins <= 0) cards.unshift(Object.assign(document.createElement('p'), { className: 'muted lock-note', textContent: 'No coins yet: profit from trading in this game becomes coins. Your home starts as a concrete shack on a wasteland.' }));
    }
    $('store-grid').replaceChildren(...cards);
    $('wallet').innerHTML = [
      ['From trading (this game)', data.trading], ['Home income', s.income], ['Spent', -s.spent], ['Coins', data.coins],
    ].map(([k, v]) => `<div class="kv"><span>${k}</span><b class="num ${v < 0 ? 'down' : ''}">${Math.trunc(v).toLocaleString()}</b></div>`).join('')
      + (s.loans.length ? `<div class="kv"><span>Mortgage loans</span><b class="num down">$${s.loans.reduce((a, l) => a + l.amount, 0).toLocaleString()}</b></div>` : '');
    $('ledger').innerHTML = s.log.slice().reverse().map((l) => `<li><span>${l.text}</span><b class="${l.amount >= 0 ? 'up' : 'down'}">${l.amount ? `${l.amount > 0 ? '+' : ''}${l.amount}` : ''}</b></li>`).join('')
      || '<li class="muted">No purchases yet.</li>';
  }

  return {
    async open(name) {
      if (name) tab = name;
      $('store').hidden = false;
      await load();
    },
    close() { $('store').hidden = true; },
  };
}
