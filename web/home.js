// Home: the garden (plants, pets, pool, the house seen from outside) and the house (furniture on a
// grid, the chibi girl who lives there). Pets and the girl run small behavior state machines.
import {
  drawFlower, drawFurniture, drawHouse, drawPet, drawPool, drawRoom, drawTree, PET_SIZE, roomSize, TILE,
} from './art.js';
import { drawChibi, LOOKS } from './girl.js';
import { disc, ellipse, fitCanvas, hash, icon, mouse, now, rect } from './pixel.js';

const $ = (id) => document.getElementById(id);
const GW = 256;
const GH = 176;
const DOOR = { x: 128, y: 66 };
const PLOTS = Array.from({ length: 6 }, (_, i) => ({ x: 20 + (i % 3) * 21, y: 82 + Math.floor(i / 3) * 20, w: 14, h: 10 }));
const SPOTS = [{ x: 176, y: 108 }, { x: 222, y: 108 }, { x: 176, y: 154 }, { x: 222, y: 154 }];
const POOL = { x: 20, y: 128, w: 58, h: 28 };
const LAWN = { x0: 12, x1: 244, y0: 74, y1: 168 };
const STONES = Array.from({ length: 15 }, (_, k) => ({ x: DOOR.x + (k % 2 ? 3 : -3), y: DOOR.y + 4 + k * 7 }));
const TUFTS = Array.from({ length: 160 }, (_, i) => ({ x: Math.floor(hash(i) * GW), y: 10 + Math.floor(hash(i + 500) * (GH - 12)) }));
const OUTFITS = [null, '#d8283c', '#3f6fd8', '#f4f4f4', '#2a2a2a', '#ff6fa8', '#5cc85c'];
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

async function api(path, body) {
  const r = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  return r.json();
}

const ago = (s) => (s < 3600 ? `${Math.max(1, Math.round(s / 60))} min` : s < 86400 ? `${Math.round(s / 3600)} h` : `${(s / 86400).toFixed(1)} days`);

export function initHome(ctx) {
  const canvas = $('home-canvas');
  const g = canvas.getContext('2d');
  const side = $('home-side');
  let data = null;
  let clockSkew = 0;
  let view = 'garden';
  let selected = null;     // garden: {kind: 'plot'|'tree'|'pet', i|id}; house: furniture id
  let editing = false;
  let holding = null;      // furniture being placed: {item, rot, id?}
  let hoverTile = null;
  let hoverPet = null;
  let shake = 0;
  let running = false;
  const pets = new Map();
  const girl = { x: 1, y: 1, path: [], until: 0, pose: 'stand', dir: 'down', emote: null, act: null, on: null, label: 'is looking around', outfit: null, petted: false };

  const t0 = () => now() + clockSkew;  // server time in seconds
  const cat = (id) => data.catalog[id];
  const st = () => data.state;

  // ------------------------------------------------------------- data

  async function refresh(next) {
    const d = next ?? await api('/api/home');
    if (!d.ok) return ctx.toast(d.message);
    data = d;
    clockSkew = d.now - now();
    $('home-coins').textContent = `🪙 ${Math.floor(d.coins).toLocaleString()}`;
    ctx.coins(d.coins);
    syncPets();
    renderSide();
  }

  async function act(action, body) {
    const d = await api(`/api/home/${action}`, body);
    if (!d.ok) return ctx.toast(d.message);
    await refresh(d);
    return true;
  }

  // ------------------------------------------------------------- growth and pets

  function stage(plant) {
    const f = (t0() - plant.planted) / (cat(plant.type).hours * 3600);
    return f >= 1 ? 3 : f >= 0.5 ? 2 : f >= 0.15 ? 1 : 0;
  }

  function treeReady(plant) {
    const c = cat(plant.type);
    const grownAt = plant.planted + c.hours * 3600;
    return t0() >= grownAt && t0() - Math.max(plant.harvested ?? 0, grownAt) >= c.every * 3600;
  }

  function syncPets() {
    const ids = new Set(st().pets.map((p) => p.id));
    for (const id of pets.keys()) if (!ids.has(id)) pets.delete(id);
    st().pets.forEach((p, i) => {
      if (!pets.has(p.id)) {
        pets.set(p.id, { id: p.id, type: p.type, x: 128 + (i % 3) * 6, y: 166, dir: 1, pose: 'idle', moving: false, until: 0, emote: null, phase: i });
      }
      Object.assign(pets.get(p.id), { status: p.status, fed: p.fed });
    });
  }

  const lawnPoint = () => ({ x: rand(LAWN.x0, LAWN.x1), y: rand(LAWN.y0, LAWN.y1) });
  const near = (p, r) => ({ x: Math.min(LAWN.x1, Math.max(LAWN.x0, p.x + rand(-r, r))), y: Math.min(LAWN.y1, Math.max(LAWN.y0, p.y + rand(-r / 2, r / 2))) });
  const bloomed = () => st().flowers.map((f, i) => f && stage(f) === 3 && { x: PLOTS[i].x + 7, y: PLOTS[i].y + 9 }).filter(Boolean);
  const grownTrees = () => st().trees.map((f, i) => f && stage(f) >= 2 && SPOTS[i]).filter(Boolean);
  const alive = () => [...pets.values()].filter((p) => p.status !== 'dead');
  const inPool = (p) => st().pool && p.x > POOL.x + 4 && p.x < POOL.x + POOL.w - 4 && p.y > POOL.y + 4 && p.y < POOL.y + POOL.h;

  function go(p, target, speed, then, movePose = 'walk') {
    Object.assign(p, { target, speed, then, moving: true, pose: movePose, until: Infinity, emote: null });
  }
  function hold(p, t, pose, dur, emote = null) {
    Object.assign(p, { target: null, moving: false, pose, until: t + dur, emote });
  }

  // Each species picks its next action; `t` is seconds.
  const BRAINS = {
    dog(p, t) {
      const r = Math.random();
      const others = alive().filter((o) => o !== p);
      if (r < 0.22) go(p, lawnPoint(), 38, ['sit', 2, 'heart']);
      else if (r < 0.36 && bloomed().length) go(p, pick(bloomed()), 26, ['sniff', 2.5]);
      else if (r < 0.46) go(p, lawnPoint(), 26, ['dig', 2.5]);
      else if (r < 0.6 && others.length) {
        const o = pick(others);
        go(p, { x: o.x, y: o.y }, 40, ['bark', 1.2, 'bang']);
        if (o.type === 'cat' || o.type === 'lizard') flee(o, p, t);
      } else if (r < 0.7 && st().pool) go(p, { x: POOL.x + POOL.w + 3, y: POOL.y + 10 }, 26, ['drink', 2.5]);
      else if (r < 0.85) hold(p, t, 'sit', rand(2, 4));
      else hold(p, t, 'sleep', rand(5, 9), 'z');
    },
    cat(p, t) {
      const r = Math.random();
      if (r < 0.25) go(p, lawnPoint(), 12, ['sit', 3]);
      else if (r < 0.4) hold(p, t, 'groom', 3);
      else if (r < 0.58) go(p, near(pick([...grownTrees(), DOOR, ...bloomed()].filter(Boolean)) ?? lawnPoint(), 8), 12, ['sleep', rand(6, 12), 'z']);
      else if (r < 0.75) go(p, butterflyAt(t, 0), 7, ['sit', 1, 'star'], 'stalk');
      else if (r < 0.87) go(p, { x: DOOR.x + 8, y: DOOR.y + 4 }, 12, ['sit', 4]);
      else hold(p, t, 'sit', 2, 'heart');
    },
    parrot(p, t) {
      const r = Math.random();
      const perches = [...grownTrees().map((s) => ({ x: s.x, y: s.y - 18 })), { x: DOOR.x - 14, y: DOOR.y - 30 },
        { x: 6, y: 40 }, { x: 250, y: 60 }, { x: 116, y: 170 }, { x: 140, y: 170 }];
      if (r < 0.55) go(p, pick(perches), 30, ['perch', rand(3, 7)], 'fly');
      else if (r < 0.72) hold(p, t, 'sing', 3, 'note');
      else if (r < 0.86) hold(p, t, 'preen', 3);
      else go(p, lawnPoint(), 30, ['perch', 3], 'fly');
    },
    turtle(p, t) {
      const r = Math.random();
      if (r < 0.3) go(p, near(p, 30), 4, ['idle', 2]);
      else if (r < 0.45) hold(p, t, 'hide', rand(3, 6));
      else if (r < 0.62 && bloomed().length) go(p, pick(bloomed()), 4, ['eat', 4, 'heart']);
      else if (r < 0.8 && st().pool) go(p, { x: rand(POOL.x + 8, POOL.x + POOL.w - 8), y: rand(POOL.y + 8, POOL.y + POOL.h - 2) }, 5, ['swim', 6]);
      else go(p, pick(STONES), 4, ['idle', 5]);
    },
    lizard(p, t) {
      const r = Math.random();
      if (r < 0.4) go(p, near(p, 45), 50, ['idle', rand(1, 4)]);
      else if (r < 0.6) hold(p, t, 'pushup', 2);
      else if (r < 0.85) go(p, pick(STONES), 50, ['bask', rand(4, 8)]);
      else go(p, pick(PLOTS), 50, ['idle', 3]);
    },
    lion(p, t) {
      const r = Math.random();
      if (r < 0.4) go(p, pick([{ x: 30, y: 80 }, { x: 230, y: 80 }, { x: 230, y: 160 }, { x: 100, y: 160 }, { x: 160, y: 120 }]), 9, ['idle', 2]);
      else if (r < 0.6) hold(p, t, 'lie', rand(6, 10));
      else if (r < 0.72) hold(p, t, 'sleep', rand(8, 12), 'z');
      else if (r < 0.86) { hold(p, t, 'roar', 1.6, 'bang'); roar(p, t); }
      else if (st().pool) go(p, { x: POOL.x + POOL.w + 4, y: POOL.y + 16 }, 9, ['lie', 4]);
      else hold(p, t, 'lie', 5);
    },
  };

  function flee(p, from, t) {
    if (p.status === 'dead' || p.type === 'lion') return;
    if (p.type === 'turtle') return hold(p, t, 'hide', 4);
    if (p.type === 'parrot') return go(p, { x: rand(20, 236), y: rand(20, 60) }, 34, ['perch', 3], 'fly');
    const away = { x: p.x + Math.sign(p.x - from.x || 1) * 40, y: p.y + Math.sign(p.y - from.y || 1) * 20 };
    go(p, near(away, 4), p.type === 'lizard' ? 55 : 36, ['sit', 2, 'bang']);
  }

  function roar(p, t) {
    shake = t + 0.6;
    alive().filter((o) => o !== p && dist(o, p) < 90).forEach((o) => (o.type === 'dog' ? hold(o, t, 'sit', 2, 'bang') : flee(o, p, t)));
  }

  function butterflyAt(t, i) {
    const f = bloomed();
    if (!f.length) return { x: 50 + Math.sin(t * 0.4 + i) * 30, y: 95 + Math.sin(t * 0.9 + i) * 10 };
    const c = f[i % f.length];
    return { x: c.x + Math.sin(t * 0.7 + i * 2) * 14, y: c.y - 10 + Math.sin(t * 1.3 + i) * 6 };
  }

  function thinkPet(p, t, dt) {
    if (p.status === 'dead') return;
    const slow = p.status === 'hungry' ? 0.5 : 1;
    if (hoverPet === p) {
      p.moving = false;
      p.pose = { dog: 'sit', cat: 'sit', parrot: 'sing', turtle: 'idle', lizard: 'idle', lion: 'lie' }[p.type];
      p.emote = p.type === 'parrot' ? 'note' : 'heart';
      p.until = t + 0.5;
      return;
    }
    if (p.status === 'hungry' && Math.floor(t) % 6 === 0) p.emote = 'food';
    if (p.moving && p.target) {
      const dx = p.target.x - p.x;
      const dy = p.target.y - p.y;
      const d = Math.hypot(dx, dy);
      const step = p.speed * slow * dt;
      if (Math.abs(dx) > 0.5) p.dir = Math.sign(dx);
      if (d <= step) {
        p.x = p.target.x; p.y = p.target.y;
        const [pose, dur, emote] = p.then ?? ['idle', 1];
        hold(p, t, inPool(p) && p.type === 'turtle' ? 'swim' : pose, dur, emote);
      } else {
        p.x += (dx / d) * step; p.y += (dy / d) * step;
        if (p.type === 'turtle' && inPool(p)) p.pose = 'swim';
      }
      return;
    }
    if (['cat', 'turtle', 'lizard'].includes(p.type) && p.pose !== 'hide') {
      const threat = alive().find((o) => (o.type === 'dog' || o.type === 'lion') && o.moving && dist(o, p) < 16);
      if (threat) return flee(p, threat, t);
    }
    if (t > p.until) BRAINS[p.type](p, t);
  }

  // ------------------------------------------------------------- garden drawing

  function drawGarden(t) {
    rect(g, 0, 0, GW, GH, '#4f9f45');
    TUFTS.forEach((q, i) => {
      const s = i % 5 === 0 ? Math.round(Math.sin(t * 1.5 + i)) : 0;
      rect(g, q.x + s, q.y, 1, 2, i % 2 ? '#62b555' : '#3e8a38');
    });
    for (let i = 0; i < 2; i++) {               // drifting cloud shadows
      g.fillStyle = 'rgba(0,0,0,0.07)';
      const cx = ((t * 3 + i * 140) % (GW + 80)) - 40;
      ellipse(g, cx, 60 + i * 60, 30, 9, 'rgba(0,0,0,0.07)');
    }
    for (let x = 0; x < GW; x += 6) disc(g, x + 3, 4 + (x % 12 ? 1 : 0), 5, x % 12 ? '#2e7d32' : '#3a9a3e'); // hedge
    for (let y = 12; y < 172; y += 8) { rect(g, 3, y, 2, 6, '#8a6a3a'); rect(g, 251, y, 2, 6, '#8a6a3a'); }
    rect(g, 3, 12, 1, 160, '#c8a26a'); rect(g, 252, 12, 1, 160, '#c8a26a');
    for (let x = 4; x < 252; x += 8) if (x < 112 || x > 142) rect(g, x, 170, 2, 6, '#8a6a3a');
    rect(g, 4, 172, 108, 1, '#c8a26a'); rect(g, 144, 172, 108, 1, '#c8a26a');
    [112, 142].forEach((x) => { rect(g, x, 164, 3, 12, '#6b4a2a'); rect(g, x, 161, 3, 3, t % 2 < 1.6 ? '#ffd84a' : '#ffb000'); });
    STONES.forEach((s, k) => { ellipse(g, s.x, s.y, 4, 2, '#b8b8c0'); rect(g, s.x - 3, s.y + 2, 7, 1, '#8a8a96'); if (k % 4 === 1) rect(g, s.x + 2, s.y - 1, 1, 1, '#6fa060'); });
    drawHouse(g, st().house, DOOR.x, DOOR.y, t);
    rect(g, 16, 78, 64, 37, '#8a5a3a');
    PLOTS.forEach((pl, i) => {
      rect(g, pl.x, pl.y, pl.w, pl.h, '#6b4220');
      for (let j = 2; j < pl.h; j += 3) rect(g, pl.x + 1, pl.y + j, pl.w - 2, 1, '#5a3418');
      if (selected?.kind === 'plot' && selected.i === i) strokeBox(pl.x - 1, pl.y - 1, pl.w + 2, pl.h + 2, '#00e5ff');
    });
    if (st().pool) drawPool(g, POOL.x, POOL.y, POOL.w, POOL.h, t);

    // everything standing on the ground, back to front
    const items = [];
    st().flowers.forEach((f, i) => f && items.push({ y: PLOTS[i].y + 9, draw: () => drawFlower(g, f.type, PLOTS[i].x + 7, PLOTS[i].y + 9, stage(f), t, i) }));
    SPOTS.forEach((s, i) => {
      const tr = st().trees[i];
      items.push({
        y: s.y,
        draw: () => {
          if (tr) drawTree(g, tr.type, s.x, s.y, stage(tr), t, i, stage(tr) === 3 && treeReady(tr));
          else { ellipse(g, s.x, s.y - 1, 5, 2, '#6b4220'); if (t % 1.6 < 0.8) { rect(g, s.x - 1, s.y - 2, 3, 1, '#00e5ff'); rect(g, s.x, s.y - 3, 1, 3, '#00e5ff'); } }
          if (selected?.kind === 'tree' && selected.i === i) strokeBox(s.x - 8, s.y - 30, 16, 32, '#00e5ff');
        },
      });
    });
    pets.forEach((p) => items.push({
      y: p.y,
      draw: () => {
        const flying = p.type === 'parrot' && (p.pose === 'fly' || p.y < LAWN.y0 || p.pose === 'perch');
        if (!flying && p.pose !== 'swim') ellipse(g, p.x, p.y, Math.ceil(PET_SIZE[p.type][0] / 3), 1, 'rgba(0,0,0,0.2)');
        drawPet(g, p.type, p.x, p.y, { dir: p.dir, pose: p.pose, moving: p.moving, dead: p.status === 'dead', emote: p.emote }, t + p.phase);
        if (selected?.kind === 'pet' && selected.id === p.id) icon(g, 'star', p.x - 2, p.y + 2);
      },
    }));
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

    for (let i = 0; i < 3; i++) {               // butterflies
      const b = butterflyAt(t, i);
      const c = ['#ffd84a', '#ff9fd8', '#9fe8ff'][i];
      const f = Math.floor(t * 10 + i) % 2;
      rect(g, b.x - (f ? 2 : 1), b.y, f ? 2 : 1, 2, c); rect(g, b.x + 1, b.y, f ? 2 : 1, 2, c); rect(g, b.x, b.y, 1, 2, '#333');
    }
    st().trees.forEach((tr, i) => {             // sakura petals
      if (!tr || tr.type !== 'sakura' || stage(tr) < 3) return;
      for (let k = 0; k < 10; k++) {
        const px = SPOTS[i].x - 14 + ((t * 6 + k * 13) % 40) + Math.sin(t * 2 + k) * 2;
        const py = SPOTS[i].y - 30 + ((t * 9 + k * 17) % 36);
        rect(g, px, py, 1, 1, k % 2 ? '#ffb7d5' : '#ffe4ef');
      }
    });
  }

  function strokeBox(x, y, w, h, c) {
    rect(g, x, y, w, 1, c); rect(g, x, y + h - 1, w, 1, c); rect(g, x, y, 1, h, c); rect(g, x + w - 1, y, 1, h, c);
  }

  // ------------------------------------------------------------- house: grid, furniture, girl

  const grid = () => cat(st().house).grid;
  const layout = () => st().layouts[st().house] ?? [];
  const size = (item, rot) => { const [w, h] = cat(item).size; return rot % 2 ? [h, w] : [w, h]; };

  function fits(item, x, y, rot, skip) {
    const [gw, gh] = grid();
    const [w, h] = size(item, rot);
    if (x < 0 || y < 0 || x + w > gw || y + h > gh) return false;
    return layout().every((f) => {
      if (f.id === skip || (f.item === 'rug') !== (item === 'rug')) return true;
      const [fw, fh] = size(f.item, f.rot);
      return !(x < f.x + fw && f.x < x + w && y < f.y + fh && f.y < y + h);
    });
  }

  function blocked() {
    const [gw, gh] = grid();
    const b = Array.from({ length: gw }, () => new Array(gh).fill(false));
    layout().forEach((f) => {
      if (f.item === 'rug') return;
      const [w, h] = size(f.item, f.rot);
      for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) b[f.x + i][f.y + j] = true;
    });
    return b;
  }

  // Shortest walk on free tiles to any of `goals` (BFS); [] if unreachable.
  function path(from, goals) {
    const [gw, gh] = grid();
    const b = blocked();
    const key = (p) => p.x * 100 + p.y;
    const want = new Set(goals.map(key));
    const prev = new Map([[key(from), null]]);
    const queue = [from];
    while (queue.length) {
      const c = queue.shift();
      if (want.has(key(c))) {
        const out = [];
        for (let k = key(c); k != null && k !== key(from); k = prev.get(k)) out.unshift({ x: Math.floor(k / 100), y: k % 100 });
        return out;
      }
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const n = { x: c.x + dx, y: c.y + dy };
        if (n.x >= 0 && n.y >= 0 && n.x < gw && n.y < gh && !b[n.x][n.y] && !prev.has(key(n))) { prev.set(key(n), key(c)); queue.push(n); }
      });
    }
    return [];
  }

  function besideTiles(f) {
    const [w, h] = size(f.item, f.rot);
    const out = [];
    for (let i = -1; i <= w; i++) for (let j = -1; j <= h; j++) {
      const edge = i === -1 || j === -1 || i === w || j === h;
      const corner = (i === -1 || i === w) && (j === -1 || j === h);
      if (edge && !corner) out.push({ x: f.x + i, y: f.y + j });
    }
    const [gw, gh] = grid();
    const b = blocked();
    return out.filter((p) => p.x >= 0 && p.y >= 0 && p.x < gw && p.y < gh && !b[p.x][p.y]).sort((a, c) => c.y - a.y);
  }

  // What she does with each piece of furniture.
  const ACTS = {
    bed: ['sleep', 'is sleeping', 'z', 9, 15, true], double_bed: ['sleep', 'is sleeping', 'z', 9, 15, true],
    sofa: ['sit', 'is relaxing on the sofa', 'note', 5, 9, true], armchair: ['sit', 'is sitting in the armchair', 'heart', 5, 8, true],
    chair: ['sit', 'is sitting down', null, 4, 6, true], office_chair: ['sit', 'is spinning in the chair', 'star', 4, 6, true],
    bean_bag: ['sit', 'sank into the bean bag', 'heart', 5, 9, true], bookshelf: ['read', 'is reading a book', 'star', 6, 10],
    desk: ['read', 'is studying', 'bang', 5, 8], fish_tank: ['stand', 'is watching the fish', 'heart', 5, 8],
    piano: ['sit', 'is playing the piano', 'note', 6, 10], guitar: ['stand', 'is strumming the guitar', 'note', 5, 8],
    record_player: ['dance', 'is dancing to a record', 'note', 6, 10], tv: ['sit', 'is watching TV', 'star', 6, 11],
    console: ['play', 'is playing video games', 'star', 6, 11], arcade: ['play', 'is playing the arcade', 'star', 5, 9],
    computer: ['play', 'is chatting online', 'heart', 5, 9], stove: ['cook', 'is cooking', 'steam', 5, 8],
    counter: ['cook', 'is making a snack', 'steam', 4, 7], fridge: ['stand', 'is looking for snacks', 'heart', 3, 5],
    sink: ['cook', 'is washing dishes', 'drop', 4, 6], bathtub: ['sit', 'is taking a bubble bath', 'drop', 7, 11, true],
    plant_pot: ['water', 'is watering the plant', 'drop', 3, 5], big_plant: ['water', 'is watering the plant', 'drop', 3, 5],
    vase: ['water', 'is arranging flowers', 'heart', 3, 5], telescope: ['stand', 'is stargazing', 'star', 5, 8],
    easel: ['stand', 'is painting', 'star', 6, 10], fireplace: ['sit', 'is warming up by the fire', 'heart', 5, 9],
    dresser: ['stand', 'is trying on outfits', 'star', 3, 4], wardrobe: ['stand', 'is changing clothes', 'star', 3, 4],
    clock: ['stand', 'is checking the time', 'bang', 2, 3], cat_bed: ['stand', 'is fluffing the cat bed', 'heart', 3, 4],
    dining_table: ['sit', 'is having a meal', 'heart', 5, 8],
  };
  const tileXY = (x, y) => ({ px: 8 + x * TILE + TILE / 2, py: 22 + y * TILE + TILE - 2 });

  function girlNext(t) {
    girl.on = null;
    girl.act = null;
    const usable = layout().filter((f) => ACTS[f.item]);
    if (usable.length && Math.random() < 0.72) {
      const f = pick(usable);
      const steps = path({ x: Math.round(girl.x), y: Math.round(girl.y) }, besideTiles(f));
      if (steps.length || besideTiles(f).some((p) => p.x === Math.round(girl.x) && p.y === Math.round(girl.y))) {
        girl.path = steps;
        girl.act = f;
        girl.label = 'is walking over';
        return;
      }
    }
    const r = Math.random();
    const [gw, gh] = grid();
    if (r < 0.5) {
      girl.path = path({ x: Math.round(girl.x), y: Math.round(girl.y) }, [{ x: Math.floor(rand(0, gw)), y: Math.floor(rand(0, gh)) }]);
      girl.label = 'is wandering around';
    } else {
      const [pose, label, emote] = pick([['yawn', 'yawns', 'z'], ['dance', 'is dancing', 'note'], ['cheer', 'stretches', 'star'], ['stand', 'is daydreaming', 'heart']]);
      Object.assign(girl, { pose, label, emote, until: t + rand(2, 4) });
    }
  }

  function girlArrive(t) {
    const f = girl.act;
    const [pose, label, emote, lo, hi, on] = ACTS[f.item];
    Object.assign(girl, { pose, label, emote, until: t + rand(lo, hi), dir: on ? 'down' : f.y + size(f.item, f.rot)[1] <= girl.y ? 'up' : 'down' });
    if (on) girl.on = f;
    if (f.item === 'dresser' || f.item === 'wardrobe') girl.outfit = pick(OUTFITS.filter((o) => o !== girl.outfit));
  }

  function thinkGirl(t, dt) {
    if (girl.petted) { girl.pose = 'pat'; girl.emote = 'heart'; girl.label = 'is being patted'; return; }
    if (girl.path.length) {
      const n = girl.path[0];
      const dx = n.x - girl.x;
      const dy = n.y - girl.y;
      const d = Math.hypot(dx, dy);
      const step = 3 * dt;
      girl.pose = 'walk';
      girl.emote = null;
      girl.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      if (d <= step) { girl.x = n.x; girl.y = n.y; girl.path.shift(); } else { girl.x += (dx / d) * step; girl.y += (dy / d) * step; }
      if (!girl.path.length) {
        if (girl.act) girlArrive(t);
        else if (girl.called) { Object.assign(girl, { pose: 'wave', emote: 'heart', label: 'came when you called', until: t + 2, called: false }); }
        else Object.assign(girl, { pose: 'stand', until: t + rand(1, 3) });
      }
      return;
    }
    if (girl.act && t >= girl.until) girl.act = null;
    if (t >= girl.until) girlNext(t);
  }

  function girlPixel() {
    if (girl.on) {
      const [w, h] = size(girl.on.item, girl.on.rot);
      const px = 8 + girl.on.x * TILE + (w * TILE) / 2;
      const top = 22 + girl.on.y * TILE;
      return { px, py: girl.on.item.includes('bed') ? top + 16 : top + h * TILE - 2 };
    }
    return tileXY(girl.x, girl.y);
  }

  function drawItem(item, gx, gy, rot, t, use, alpha = 1) {
    const [w, h] = cat(item).size;
    const scratch = drawItem.c ?? (drawItem.c = document.createElement('canvas'));
    scratch.width = w * TILE;
    scratch.height = h * TILE;
    const sg = scratch.getContext('2d');
    drawFurniture(sg, item, w * TILE, h * TILE, t, use);
    const [fw, fh] = size(item, rot);
    g.save();
    g.globalAlpha = alpha;
    g.translate(8 + gx * TILE + (fw * TILE) / 2, 22 + gy * TILE + (fh * TILE) / 2);
    g.rotate((rot * Math.PI) / 2);
    g.drawImage(scratch, (-w * TILE) / 2, (-h * TILE) / 2);
    g.restore();
  }

  function drawHouseView(t) {
    const [gw, gh] = grid();
    drawRoom(g, st().house, gw, gh, t, editing);
    const look = LOOKS[ctx.theme()] ?? LOOKS.neon;
    const items = layout().filter((f) => f.item === 'rug');
    items.forEach((f) => drawItem(f.item, f.x, f.y, f.rot, t, false));
    const stand = layout().filter((f) => f.item !== 'rug').map((f) => ({
      y: f.y + size(f.item, f.rot)[1],
      draw: () => {
        drawItem(f.item, f.x, f.y, f.rot, t, girl.act === f && !girl.path.length, holding?.id === f.id ? 0.35 : 1);
        if (editing && selected === f.id) {
          const [w, h] = size(f.item, f.rot);
          strokeBox(8 + f.x * TILE, 22 + f.y * TILE, w * TILE, h * TILE, '#00e5ff');
        }
      },
    }));
    const { px, py } = girlPixel();
    stand.push({
      y: girl.on ? girl.on.y + size(girl.on.item, girl.on.rot)[1] + 0.1 : girl.y + 1,
      draw: () => {
        const sleeping = girl.pose === 'sleep';
        drawChibi(g, look, px, py, girl.pose, girl.dir, t, girl.outfit);
        if (sleeping) rect(g, px - 7, py - 8, 15, 8, '#4f7fd8');
        if (girl.on?.item === 'bathtub') rect(g, px - 7, py - 7, 15, 6, '#8fd8ff');
        if (girl.emote && t % 2 < 1.4) icon(g, girl.emote, px - 2, py - 30 - (sleeping ? -8 : 0) - Math.round((t * 3) % 3));
      },
    });
    stand.sort((a, b) => a.y - b.y).forEach((it) => it.draw());
    if (editing && holding && hoverTile) {
      const ok = fits(holding.item, hoverTile.x, hoverTile.y, holding.rot, holding.id);
      drawItem(holding.item, hoverTile.x, hoverTile.y, holding.rot, t, false, 0.7);
      const [w, h] = size(holding.item, holding.rot);
      g.fillStyle = ok ? 'rgba(0,255,159,0.25)' : 'rgba(255,42,109,0.35)';
      g.fillRect(8 + hoverTile.x * TILE, 22 + hoverTile.y * TILE, w * TILE, h * TILE);
    }
  }

  // ------------------------------------------------------------- loop and input

  let last = now();
  function frame() {
    if (!running) return;
    const t = t0();
    const dt = Math.min(0.1, now() - last);
    last = now();
    if (data) {
      if (view === 'garden') {
        pets.forEach((p) => thinkPet(p, t, dt));
        g.save();
        if (t < shake) g.translate(Math.round(Math.sin(t * 60) * 2), 0);
        drawGarden(t);
        g.restore();
      } else {
        thinkGirl(t, dt);
        drawHouseView(t);
      }
      if (Math.floor(t) !== frame.sec) { frame.sec = Math.floor(t); if (frame.sec % 5 === 0) renderStatusLine(); }
    }
    requestAnimationFrame(frame);
  }

  function fit() {
    if (!data) return;
    const [w, h] = view === 'garden' ? [GW, GH] : roomSize(...grid());
    fitCanvas(canvas, w, h);
  }
  new ResizeObserver(fit).observe(canvas.parentElement);

  function petAt(m) {
    return [...pets.values()].reverse().find((p) => {
      const [w, h] = PET_SIZE[p.type];
      return Math.abs(m.x - p.x) <= w / 2 && m.y <= p.y + 2 && m.y >= p.y - h;
    });
  }
  const tileAt = (m) => ({ x: Math.floor((m.x - 8) / TILE), y: Math.floor((m.y - 22) / TILE) });
  const furnitureAt = (tile) => [...layout()].reverse().find((f) => {
    const [w, h] = size(f.item, f.rot);
    return tile.x >= f.x && tile.x < f.x + w && tile.y >= f.y && tile.y < f.y + h;
  });

  canvas.onmousemove = (e) => {
    if (!data) return;
    const m = mouse(canvas, e);
    if (view === 'garden') {
      hoverPet = petAt(m) ?? null;
      canvas.style.cursor = hoverPet || hitGarden(m) ? 'pointer' : 'default';
    } else {
      hoverTile = tileAt(m);
      const { px, py } = girlPixel();
      girl.petted = !editing && Math.abs(m.x - px) < 7 && m.y > py - 24 && m.y < py + 1;
      canvas.style.cursor = girl.petted ? 'grab' : 'pointer';
    }
  };
  canvas.onmouseleave = () => { hoverPet = null; girl.petted = false; hoverTile = null; };

  function hitGarden(m) {
    if (Math.abs(m.x - DOOR.x) < 9 && m.y > DOOR.y - 18 && m.y < DOOR.y + 2) return { kind: 'door' };
    const plot = PLOTS.findIndex((p) => m.x >= p.x - 1 && m.x <= p.x + p.w && m.y >= p.y - 12 && m.y <= p.y + p.h);
    if (plot >= 0) return { kind: 'plot', i: plot };
    const spot = SPOTS.findIndex((s) => Math.abs(m.x - s.x) < 9 && m.y > s.y - 30 && m.y < s.y + 3);
    if (spot >= 0) return { kind: 'tree', i: spot };
    return null;
  }

  canvas.onclick = async (e) => {
    if (!data) return;
    const m = mouse(canvas, e);
    if (view === 'garden') {
      const pet = petAt(m);
      const hit = pet ? { kind: 'pet', id: pet.id } : hitGarden(m);
      if (hit?.kind === 'door') return setView('house');
      selected = hit;
      return renderSide();
    }
    const tile = tileAt(m);
    if (editing) {
      if (holding) {
        if (!fits(holding.item, tile.x, tile.y, holding.rot, holding.id)) return ctx.toast("It doesn't fit there.");
        const ok = holding.id
          ? await act('move', { id: holding.id, x: tile.x, y: tile.y, rot: holding.rot })
          : await act('place', { item: holding.item, x: tile.x, y: tile.y, rot: holding.rot });
        if (ok) { if (holding.id || !(st().inventory[holding.item] > 0)) holding = null; renderSide(); }
        return;
      }
      selected = furnitureAt(tile)?.id ?? null;
      return renderSide();
    }
    const { px, py } = girlPixel();
    if (Math.abs(m.x - px) < 7 && m.y > py - 24 && m.y < py + 1) {
      Object.assign(girl, { pose: 'jump', emote: 'heart', label: 'is happy to see you', until: t0() + 1.2, path: [], act: null, on: null });
      return;
    }
    const steps = path({ x: Math.round(girl.x), y: Math.round(girl.y) }, [tile]);
    if (steps.length) Object.assign(girl, { path: steps, act: null, on: null, called: true, label: 'is coming over' });
  };

  document.addEventListener('keydown', (e) => {
    if ($('home').hidden || view !== 'house' || !editing) return;
    if (e.key.toLowerCase() === 'r' && holding) holding.rot = (holding.rot + 1) % 4;
    if (e.key === 'Escape') { holding = null; renderSide(); }
  });

  // ------------------------------------------------------------- side panel

  function el(html) {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d;
  }
  function button(label, onclick, cls = '') {
    const b = document.createElement('button');
    b.textContent = label;
    b.className = cls;
    b.onclick = onclick;
    return b;
  }
  const until = (secs) => (secs <= 0 ? 'now' : `in ${ago(secs)}`);

  function renderStatusLine() {
    const s = $('home-status');
    if (s) s.textContent = view === 'house' ? `She ${girl.label}.` : '';
  }

  function renderSide() {
    if (!data) return;
    side.replaceChildren();
    const s = st();
    side.append(el(`<div class="box-title">WALLET</div><div class="kv"><span>Coins</span><b class="num">🪙 ${Math.floor(data.coins).toLocaleString()}</b></div>`));
    if (view === 'garden') renderGardenSide(s);
    else renderHouseSide(s);
    side.append(el('<div class="box-title">RECENT</div>'));
    const log = document.createElement('ul');
    log.className = 'list';
    log.innerHTML = s.log.slice(-5).reverse().map((l) => `<li><span>${l.text}</span><b class="${l.amount >= 0 ? 'up' : 'down'}">${l.amount >= 0 ? '+' : ''}${l.amount}</b></li>`).join('')
      || '<li class="muted">Nothing yet. Profit from trading becomes coins.</li>';
    side.append(log);
  }

  function renderGardenSide(s) {
    side.append(el('<div class="box-title">GARDEN</div>'));
    if (!selected) side.append(el('<p class="muted">Click a flower plot, a tree spot or a pet. Hover a pet to pet it. Click the front door to go inside.</p>'));
    if (selected?.kind === 'plot' || selected?.kind === 'tree') {
      const where = selected.kind === 'plot' ? 'flowers' : 'trees';
      const plant = s[where][selected.i];
      if (!plant) {
        const kind = where === 'flowers' ? 'flower' : 'tree';
        const seeds = Object.entries(s.inventory).filter(([k, n]) => n > 0 && cat(k).kind === kind);
        side.append(el(`<p>${where === 'flowers' ? `Flower plot ${selected.i + 1}` : `Tree spot ${selected.i + 1}`} is empty.</p>`));
        seeds.forEach(([k, n]) => side.append(button(`Plant ${cat(k).name} (${n})`, () => act('plant', { where, slot: selected.i, item: k }))));
        if (!seeds.length) side.append(button(`Buy ${kind === 'flower' ? 'seeds' : 'saplings'} in the store`, () => ctx.openStore(kind === 'flower' ? 'Flowers' : 'Trees')));
      } else {
        const c = cat(plant.type);
        const left = plant.planted + c.hours * 3600 - t0();
        if (left > 0) side.append(el(`<p><b>${c.name}</b> is growing: ${where === 'flowers' ? 'blooms' : 'grows up'} ${until(left)}.</p>`));
        else if (where === 'flowers') {
          side.append(el(`<p><b>${c.name}</b> is in full bloom.</p>`));
          side.append(button(`Pick and sell (+${c.sells} coins)`, () => act('harvest', { where, slot: selected.i }), 'primary'));
        } else {
          const next = Math.max(plant.harvested ?? 0, plant.planted + c.hours * 3600) + c.every * 3600 - t0();
          side.append(el(`<p><b>${c.name}</b> is grown. Harvest of ${c.yield} coins every ${c.every} h; next ${until(next)}.</p>`));
          if (next <= 0) side.append(button(`Harvest (+${c.yield} coins)`, () => act('harvest', { where, slot: selected.i }), 'primary'));
        }
        side.append(button('Dig up', () => act('dig', { where, slot: selected.i })));
      }
    }
    if (selected?.kind === 'pet') {
      const pet = s.pets.find((p) => p.id === selected.id);
      const b = pets.get(selected.id);
      if (pet && b) {
        const c = cat(pet.type);
        const mood = { ok: 'happy and fed', hungry: 'HUNGRY', dead: 'has died' }[pet.status];
        side.append(el(`<p><b>${c.name}</b> — ${mood}. Last meal ${ago(t0() - pet.fed)} ago.<br><span class="muted">Hungry after 2 days, dies after 7 days without food.</span></p>`));
        if (pet.status === 'dead') side.append(button('Bury', () => act('bury', { id: pet.id })));
        else side.append(button(`Feed (${c.meal} coins)`, () => act('feed', { id: pet.id }), 'primary'));
      }
    }
    if (s.pets.length) {
      side.append(el('<div class="box-title">PETS</div>'));
      const ul = document.createElement('ul');
      ul.className = 'list';
      s.pets.forEach((p) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${cat(p.type).name} <i class="${p.status === 'ok' ? 'up' : 'down'}">${p.status === 'ok' ? 'fed' : p.status}</i></span>`;
        if (p.status !== 'dead') li.append(button(`Feed ${cat(p.type).meal}`, () => act('feed', { id: p.id })));
        ul.append(li);
      });
      side.append(ul);
    }
  }

  function renderHouseSide(s) {
    side.append(el(`<div class="box-title">HOUSE — ${cat(s.house).name.toUpperCase()}</div>`));
    if (s.houses.length > 1) {
      const row = document.createElement('div');
      row.className = 'group wrap';
      s.houses.forEach((h) => row.append(button(cat(h).name, () => act('house', { item: h }).then(() => { fit(); placeGirl(); }), h === s.house ? 'active' : '')));
      side.append(row);
    }
    side.append(el('<p id="home-status" class="muted"></p>'));
    side.append(button(editing ? 'Done arranging' : 'Arrange furniture', () => { editing = !editing; holding = null; selected = null; renderSide(); }, editing ? 'active' : 'primary'));
    if (!editing) {
      side.append(el('<p class="muted">Hover her to pat her, click her to say hi, click the floor to call her over.</p>'));
      renderStatusLine();
      return;
    }
    side.append(el(`<p class="muted">${holding ? `Placing ${cat(holding.item).name}: click a spot, R rotates, Esc cancels.` : 'Pick an item below, or click furniture in the room.'}</p>`));
    if (holding) side.append(button('Rotate (R)', () => { holding.rot = (holding.rot + 1) % 4; }));
    const sel = layout().find((f) => f.id === selected);
    if (sel && !holding) {
      side.append(el(`<p><b>${cat(sel.item).name}</b></p>`));
      const row = document.createElement('div');
      row.className = 'group wrap';
      row.append(
        button('Rotate', () => act('move', { id: sel.id, x: sel.x, y: sel.y, rot: (sel.rot + 1) % 4 })),
        button('Move', () => { holding = { item: sel.item, rot: sel.rot, id: sel.id }; renderSide(); }),
        button('Put away', () => { selected = null; act('stash', { id: sel.id }); }),
      );
      side.append(row);
    }
    const inv = Object.entries(s.inventory).filter(([k, n]) => n > 0 && cat(k).kind === 'furniture');
    side.append(el('<div class="box-title">INVENTORY</div>'));
    const ul = document.createElement('ul');
    ul.className = 'list';
    inv.forEach(([k, n]) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${cat(k).name} ×${n}</span>`;
      li.append(button('Place', () => { holding = { item: k, rot: 0 }; selected = null; renderSide(); }));
      ul.append(li);
    });
    if (!inv.length) ul.innerHTML = '<li class="muted">No furniture waiting. Buy some in the store.</li>';
    side.append(ul);
  }

  function placeGirl() {
    const [gw, gh] = grid();
    const b = blocked();
    for (let y = gh - 1; y >= 0; y--) for (let x = Math.floor(gw / 2); x < gw; x++) if (!b[x][y]) { Object.assign(girl, { x, y, path: [], act: null, on: null, until: 0 }); return; }
  }

  function setView(v) {
    view = v;
    selected = null;
    editing = false;
    holding = null;
    document.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
    if (v === 'house') placeGirl();
    fit();
    renderSide();
  }
  document.querySelectorAll('[data-view]').forEach((b) => { b.onclick = () => setView(b.dataset.view); });

  return {
    async open(v = 'garden') {
      $('home').hidden = false;
      await refresh();
      setView(v);
      if (!running) { running = true; last = now(); requestAnimationFrame(frame); }
    },
    close() { running = false; $('home').hidden = true; },
    refresh,
  };
}
