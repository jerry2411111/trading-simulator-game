// Store: buy pets, seeds, saplings, houses, furniture, fish and sea life with coins; sell unused items
// back; mortgage the home for trading dollars and pay loans back.
import { drawFloor, drawFlower, drawPet, drawPool, drawTree, PET_SIZE } from './art.js';
import { decorItems, dressTree } from './themes.js';
import { drawFurniture, drawGarage, drawHouse, drawWallPiece, HOUSE_W, TILE, WALL_H } from './build.js';
import { drawPetHead } from './buddy.js';
import { drawCar } from './cars.js';
import { drawSea } from './sea.js';
import { rect } from './pixel.js';

const $ = (id) => document.getElementById(id);
const TABS = ['Pets', 'Pet clothes', 'Flowers', 'Trees', 'Garden themes', 'Garden & houses', 'Cars', 'Furniture', 'Fish', 'Sea life', 'Mortgage', 'Sell'];
const KINDS = {
  Pets: ['pet'], Cars: ['car'], Flowers: ['flower'], Trees: ['tree'], 'Garden themes': ['theme'], 'Garden & houses': ['house'], Furniture: ['furniture'],
  Fish: ['fish'], 'Sea life': ['sea', 'ice'],
};
const BUILD_TAB = { pool: 'Garden & houses', garage: 'Garden & houses', aquarium: 'Fish', iceland: 'Sea life' };
const SEA_SIZE = { whale: [60, 30], shark: [36, 20], manta: [30, 18] };

// A small preview (drawn once) of any catalog item.
function preview(id, info) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const size = {
    pet: [Math.max(36, (PET_SIZE[id]?.[0] ?? 30) + 8), Math.max(27, (PET_SIZE[id]?.[1] ?? 20) + 8)], flower: [26, 20], tree: [46, 56], house: [HOUSE_W[id] + 8, 110], fish: [26, 18],
    sea: SEA_SIZE[id] ?? [26, 26], ice: [26, 24], build: [72, 40], clothes: [48, 48], theme: [96, 60], car: [80, 44],
  }[info.kind] ?? [info.size[0] * TILE + 2, info.size[1] * TILE + 2];
  [c.width, c.height] = size;
  if (info.kind === 'pet') drawPet(g, id, Math.round(size[0] / 2), size[1] - 3, { dir: 1, pose: id === 'parrot' ? 'perch' : 'idle' }, 0);
  else if (info.kind === 'clothes') { [c.width, c.height] = [48, 48]; drawPetHead(g, info.pet, 'happy', 0.2, '#00e5ff', false, { style: info.style, color: info.color }, false); }
  else if (info.kind === 'flower') drawFlower(g, id, 13, 19, 3, 0);
  else if (info.kind === 'tree') drawTree(g, id, 23, 54, 3, 0, 0, false);
  else if (info.kind === 'theme') themePreview(g, id, info);
  else if (info.kind === 'car') drawCar(g, id, 40, 34, 0.5, 2);
  else if (id === 'garage') drawGarage(g, 36, 38, 0);
  else if (info.kind === 'house') drawHouse(g, id, size[0] / 2, 108, 0);
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
    if (info.wall) { [c.width, c.height] = [info.size[0] * TILE + 2, WALL_H + 2]; g.translate(1, 1); drawWallPiece(g, id, info.size[0] * TILE, 0); } else drawFurniture(g, id, info.size[0] * TILE, info.size[1] * TILE, 0);
  }
  const out = crop(c);
  out.className = 'pixel';
  const [bw, bh] = info.kind === 'house' ? [320, 112] : [148, 104];  // the card's art box
  const fit = Math.min(bw / out.width, bh / out.height, 6);
  const scale = fit >= 1 ? Math.floor(fit * 2) / 2 : fit;
  out.style.width = `${Math.round(out.width * scale)}px`;
  out.style.height = `${Math.round(out.height * scale)}px`;
  return out;
}

// A garden theme: its ground with two of its decorations and a dressed tree on it.
function themePreview(g, id, info) {
  drawFloor(g, 0, 0, 96, 60, info.ground, 1);
  drawTree(g, 'apple', 30, 56, 3, 0.4, 0, false);
  dressTree(g, id, 30, 56, 0.4, 0);
  decorItems(g, id, 0.4).slice(0, 2).forEach((it, i) => {
    g.save(); g.translate(i ? 30 : 46, -it.y + 58); it.draw(); g.restore();
  });
}

// The drawn part of a canvas (non-transparent pixels plus a 1-pixel margin) as a new canvas.
function crop(c) {
  const { data } = c.getContext('2d').getImageData(0, 0, c.width, c.height);
  let [x0, y0, x1, y1] = [c.width, c.height, -1, -1];
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (data[(y * c.width + x) * 4 + 3] > 0) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    }
  }
  if (x1 < 0) return c;
  const out = document.createElement('canvas');
  [x0, y0] = [Math.max(0, x0 - 1), Math.max(0, y0 - 1)];
  out.width = Math.min(c.width, x1 + 2) - x0;
  out.height = Math.min(c.height, y1 + 2) - y0;
  out.getContext('2d').drawImage(c, -x0, -y0);
  return out;
}

function detail(info) {
  if (info.kind === 'pet') return `Meal: ${info.meal} coins${info.premium ? ' · portrait window & clothes' : ''}`;
  if (info.kind === 'clothes') return 'Made for this breed';
  if (info.kind === 'flower') return `Blooms in ${info.hours} h, sells for ${info.sells}`;
  if (info.kind === 'tree') return `Grows in ${info.hours} h, then +${info.yield} every ${info.every} h`;
  if (info.kind === 'house') return `Level ${info.level} · ${info.grid[0]}×${info.grid[1]} floor`;
  if (info.kind === 'car') return `${info.tier[0].toUpperCase()}${info.tier.slice(1)} · up to 5 in the garage`;
  if (info.kind === 'theme') return 'Cleans up the whole garden, lays its ground, decorates it and dresses the trees';
  if (info.kind === 'furniture') return info.wall ? `Hangs on the wall · ${info.size[0]} wide` : `${info.size[0]}×${info.size[1]} tiles`;
  if (['fish', 'sea', 'ice'].includes(info.kind)) return `Food: ${info.meal} coins a meal`;
  return { garage: 'Stands next to your house; holds 5 cars', pool: 'Goes in the pool corner (clean it first)', aquarium: 'Holds sea life; fish move in too', iceland: 'Penguins and seals live on it' }[info.id] ?? '';
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

  function card(id, info, price, label, action, disabled, note = '', body = { item: id }) {
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
    b.onclick = () => (action === 'buy' || action === 'sell' ? act(action, id) : post(action, body).then((r) => r && ctx.toast('Done!')));
    div.append(b);
    return div;
  }

  // Why a tab's items can't be bought yet ('' when they can).
  function lockReason(name) {
    const s = data.state;
    if (name === 'Fish' && !data.has_tank) return 'Buy a fish tank (Furniture) to unlock fish.';
    if (name === 'Cars' && !s.garage) return 'Buy a garage (Garden & houses) to unlock cars.';
    if (name === 'Sea life' && !s.aquarium) return 'Upgrade your fish tank to the aquarium (Fish tab) to unlock sea life.';
    return '';
  }

  function mortgageTab() {
    const out = [];
    const money = (v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    const pct = (r) => `${+(r * 100).toFixed(2)}%`;
    const plans = Object.entries(data.plans);  // [id, [share, rate]]
    const intro = document.createElement('div');
    intro.className = 'mortgage';
    intro.innerHTML = '<p>Mortgage a house (worth $20,000 plus its price and its furniture), a building, a piece of furniture or the whole home (worth $20,000 plus everything in it except pets; '
      + 'that locks the home until you pay it back) for <b>dollars in your trading account</b>. This is the only way to add money.</p>'
      + `<p>Plans: ${plans.map(([, [share, rate]]) => `<b>${pct(share)}</b> of the value at <b>${pct(rate)}</b> a day`).join(' · ')}.</p>`
      + '<p>Interest is taken from your cash at the close of every trading day; you only pay interest until you pay the loan back '
      + '(that takes the same dollars from your cash). <b class="down">If your cash can\'t cover the interest, the bank takes the '
      + 'mortgaged thing.</b> Selling things back pays half their price.</p>';
    out.push(intro);
    const box = (title, items) => {
      const b = document.createElement('div');
      b.className = 'mortgage';
      b.innerHTML = `<div class="box-title">${title}</div>`;
      const ul = document.createElement('ul');
      ul.className = 'list';
      items.forEach((li) => ul.append(li));
      if (!items.length) ul.innerHTML = '<li class="muted">Nothing here.</li>';
      b.append(ul);
      out.push(b);
    };
    const button = (label, onclick, cls = '') => {
      const b = document.createElement('button');
      b.textContent = label;
      b.className = cls;
      b.onclick = onclick;
      return b;
    };
    box('YOUR LOANS', data.state.loans.map((l) => {
      const li = document.createElement('li');
      const rate = l.rate ?? 0.005;
      li.innerHTML = `<span>${l.label} · ${pct(rate)} a day = <b class="down">${money(Math.round(l.amount * rate * 100) / 100)}</b> a day</span><b class="num">${money(l.amount)}</b>`;
      li.append(button('Pay back', () => post('redeem', { id: l.id })));
      return li;
    }));
    box('MORTGAGE', data.loan_offers.map((o) => {
      const li = document.createElement('li');
      li.className = 'loan-offer';
      li.innerHTML = `<span>${o.label} · worth ${money(o.value)}</span>`;
      const row = document.createElement('span');
      row.className = 'group wrap';
      plans.forEach(([plan, [share, rate]]) => {
        const amount = Math.round(o.value * share * 100) / 100;
        const b = button(`${pct(share)}: ${money(amount)} · ${pct(rate)}/day`, () => post('mortgage', { kind: o.kind, ref: o.ref, plan }));
        b.title = `Borrow ${money(amount)}; interest ${money(Math.round(amount * rate * 100) / 100)} every trading day`;
        row.append(b);
      });
      li.append(row);
      return li;
    }));
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
    if (tab === 'Pet clothes') {
      const fancy = s.pets.filter((pt) => pt.status !== 'dead' && data.catalog[pt.type].premium);
      cards = fancy.flatMap((pt) => data.catalog[pt.type].clothes.map((cid) => {
        const info = data.catalog[cid];
        const owned = pt.outfits.includes(cid);
        const short = Math.ceil(info.price - data.coins);
        return card(cid, { ...info, name: `${info.name} (${data.catalog[pt.type].name})` }, info.price, owned ? 'Owned' : short > 0 ? `Need ${short} more` : 'Buy',
          'buy_clothes', owned || short > 0 || data.locked, '', { id: pt.id, item: cid });
      }));
      if (!cards.length) cards = [Object.assign(document.createElement('p'), { className: 'muted lock-note', textContent: 'Clothes are designed for pets that cost 1,000 coins or more. Adopt one (dogs, many cats, the capybara, the marmoset, the parrot...) and its outfits show up here.' })];
    } else if (tab === 'Mortgage') {
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
        const own = (info.kind === 'house' && s.houses.includes(id)) || (info.kind === 'build' && s[id]) || (info.kind === 'theme' && s.themes.includes(id));
        const iceLock = info.kind === 'ice' && !s.iceland;
        const buildLock = info.kind === 'build' && ((id === 'aquarium' && !data.has_tank) || (id === 'iceland' && !s.aquarium));
        const full = info.kind === 'pet' && !(data.pet_room.garden || data.pet_room.house);
        const locked = (lock && info.kind !== 'build') || iceLock || buildLock || full;
        const note = iceLock ? 'Needs the ice land' : buildLock ? (id === 'aquarium' ? 'Needs a fish tank' : 'Needs the aquarium') : '';
        const short = Math.ceil(info.price - data.coins);
        const label = own ? 'Owned' : locked ? 'Locked' : short > 0 ? `Need ${short.toLocaleString()} more` : 'Buy';
        return card(id, info, info.price, label, 'buy', own || locked || data.locked || short > 0, note);
      });
      if (lock) cards.unshift(Object.assign(document.createElement('p'), { className: 'muted lock-note', textContent: lock }));
      if (tab === 'Pets') {
        const r = data.pet_room;
        cards.unshift(Object.assign(document.createElement('p'), {
          className: 'muted lock-note',
          textContent: r.garden || r.house ? `Room for ${r.garden} more in the garden and ${r.house} more in the house (5 and 3 at most). Pets can't be sold, only released.`
            : 'Your home is full of pets (5 in the garden, 3 in the house): release one in Home to adopt another.',
        }));
      }
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
