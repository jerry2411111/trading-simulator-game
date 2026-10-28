// Store: buy pets, seeds, saplings, the pool, houses and furniture with coins; sell unused items back.
import { drawFlower, drawFurniture, drawHouse, drawPet, drawPool, drawTree, TILE } from './art.js';

const $ = (id) => document.getElementById(id);
const TABS = ['Pets', 'Flowers', 'Trees', 'Garden & houses', 'Furniture', 'Sell'];
const KINDS = { Pets: ['pet'], Flowers: ['flower'], Trees: ['tree'], 'Garden & houses': ['pool', 'house'], Furniture: ['furniture'] };

// A small animated-looking preview (drawn once) of any catalog item.
function preview(id, info) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const size = {
    pet: [34, 22], flower: [16, 18], tree: [34, 36], pool: [70, 38], house: [96, 76],
  }[info.kind] ?? [info.size[0] * TILE, info.size[1] * TILE];
  [c.width, c.height] = size;
  if (info.kind === 'pet') drawPet(g, id, 17, 20, { dir: 1, pose: id === 'parrot' ? 'perch' : 'idle' }, 0);
  else if (info.kind === 'flower') drawFlower(g, id, 8, 17, 3, 0);
  else if (info.kind === 'tree') drawTree(g, id, 17, 35, 3, 0, 0, id === 'apple');
  else if (info.kind === 'pool') drawPool(g, 5, 5, 60, 28, 0);
  else if (info.kind === 'house') drawHouse(g, id, 48, 74, 0);
  else drawFurniture(g, id, c.width, c.height, 0);
  c.className = 'pixel';
  const scale = Math.max(1, Math.min(6, Math.floor(108 / Math.max(c.width, c.height))));
  c.style.width = `${c.width * scale}px`;
  c.style.height = `${c.height * scale}px`;
  return c;
}

function detail(info) {
  if (info.kind === 'pet') return `Meal: ${info.meal} coins`;
  if (info.kind === 'flower') return `Blooms in ${info.hours} h, sells for ${info.sells}`;
  if (info.kind === 'tree') return `Grows in ${info.hours} h, then +${info.yield} every ${info.every} h`;
  if (info.kind === 'house') return `Level ${info.level} · floor ${info.grid[0]}×${info.grid[1]}`;
  if (info.kind === 'furniture') return `${info.size[0]}×${info.size[1]} tiles`;
  return 'Goes in the garden';
}

export function initStore(ctx) {
  let tab = 'Pets';
  let data = null;

  async function load(next) {
    data = next ?? await (await fetch('/api/home')).json();
    ctx.coins(data.coins);
    render();
  }

  async function act(action, item) {
    const r = await (await fetch(`/api/home/${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item }),
    })).json();
    if (!r.ok) return ctx.toast(r.message);
    ctx.toast(action === 'buy' ? `Bought ${data.catalog[item].name}!` : `Sold ${data.catalog[item].name}.`);
    load(r);
  }

  function card(id, info, price, label, action, disabled) {
    const div = document.createElement('div');
    div.className = 'card';
    const pv = document.createElement('div');
    pv.className = 'card-art';
    pv.append(preview(id, info));
    const owned = data.state.inventory[id] ? ` · own ${data.state.inventory[id]}` : '';
    div.append(pv);
    div.insertAdjacentHTML('beforeend', `<b>${info.name}</b><span class="num">🪙 ${price.toLocaleString()}</span><small class="muted">${detail(info)}${owned}</small>`);
    const b = document.createElement('button');
    b.textContent = label;
    b.className = 'primary';
    b.disabled = disabled;
    b.onclick = () => act(action, id);
    div.append(b);
    return div;
  }

  function render() {
    const s = data.state;
    $('store-coins').textContent = `🪙 ${Math.trunc(data.coins).toLocaleString()}`;
    $('store-tabs').replaceChildren(...TABS.map((name) => {
      const b = document.createElement('button');
      b.textContent = name;
      b.classList.toggle('active', name === tab);
      b.onclick = () => { tab = name; render(); };
      return b;
    }));
    const entries = Object.entries(data.catalog);
    let cards;
    if (tab === 'Sell') {
      cards = Object.entries(s.inventory).filter(([, n]) => n > 0).map(([id, n]) => {
        const info = data.catalog[id];
        return card(id, info, Math.floor(info.price / 2), `Sell (${n})`, 'sell', false);
      });
      if (!cards.length) cards = [Object.assign(document.createElement('p'), { className: 'muted', textContent: 'Nothing to sell: unplaced furniture, seeds and saplings show up here.' })];
    } else {
      cards = entries.filter(([, info]) => KINDS[tab].includes(info.kind)).sort((a, b) => a[1].price - b[1].price).map(([id, info]) => {
        const own = (info.kind === 'house' && s.houses.includes(id)) || (info.kind === 'pool' && s.pool);
        return card(id, info, info.price, own ? 'Owned' : 'Buy', 'buy', own || data.coins < info.price);
      });
    }
    $('store-grid').replaceChildren(...cards);
    $('wallet').innerHTML = [
      ['From trading (all games)', data.trading], ['Home income', s.income], ['Spent', -s.spent], ['Coins', data.coins],
    ].map(([k, v]) => `<div class="kv"><span>${k}</span><b class="num ${v < 0 ? 'down' : ''}">${Math.trunc(v).toLocaleString()}</b></div>`).join('');
    $('ledger').innerHTML = s.log.slice().reverse().map((l) => `<li><span>${l.text}</span><b class="${l.amount >= 0 ? 'up' : 'down'}">${l.amount >= 0 ? '+' : ''}${l.amount}</b></li>`).join('')
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
