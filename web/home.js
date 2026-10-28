// Home: the garden (a wasteland you clean up and floor, the road lined with flower beds, trees with beehives, the pool,
// pets, birds and bees, the house seen from outside), the house (rooms on a grid, furniture, your pets
// living inside) and the aquarium (fish, sea life, the ice land). Animals run small state machines.
import {
  drawBee, drawBird, drawFloor, drawGarbage, drawFlower, drawHive, drawPet, drawPool, drawTree, GARBAGE_KINDS, PET_SIZE,
} from './art.js';
import {
  drawFurniture, drawGarage, drawHouse, drawRoom, drawWallPiece, HOUSE_W, ROOM, roomSize, TILE, tileOrigin, WALL_H, wallPieces,
} from './build.js';
import { drawCar } from './cars.js';
import { petGroup } from './pets.js';
import { decorItems, dressTree, weather } from './themes.js';
import { AQ, drawAquarium, drawSea } from './sea.js';
import { disc, ellipse, fitCanvas, glow, hash, icon, mouse, now, rect } from './pixel.js';

const $ = (id) => document.getElementById(id);
const GW = 256;
const GH = 208;
const DOOR = { x: 128, y: 86 };
const GARAGE = { x: 64, y: 86 };
const WALL_T = 6;  // the garden wall's thickness
const SCREENS = new Set(['old_laptop', 'computer']);  // clicking these in the house goes back to trading  // the garage stands left of a small house
const ZONES = {  // the garden's parts; the house lot above them is always the house's
  path: [{ x: 6, y: 86, w: 244, h: 14 }, { x: 116, y: 160, w: 24, h: 44 }],
  west: [{ x: 6, y: 100, w: 86, h: 60 }],
  plaza: [{ x: 92, y: 100, w: 72, h: 60 }],
  east: [{ x: 164, y: 100, w: 86, h: 60 }],
  southwest: [{ x: 6, y: 160, w: 110, h: 44 }],
  southeast: [{ x: 140, y: 160, w: 110, h: 44 }],
};
// Two long flower beds line the road through the middle of the garden, three flowers in each.
const BEDS = [{ x: 96, y: 104, w: 24, h: 52 }, { x: 136, y: 104, w: 24, h: 52 }];
const FLOWERS = [[108, 122], [108, 138], [108, 154], [148, 122], [148, 138], [148, 154]].map(([x, y]) => ({ x, y }));
const SPOTS = [{ x: 26, y: 146 }, { x: 68, y: 156 }, { x: 188, y: 156 }, { x: 230, y: 146 }];
const POOL = { x: 24, y: 170, w: 64, h: 24 };
const LAWN = { x0: 10, x1: 246, y0: 92, y1: 200 };
// One unbroken stone road from the gate straight up to the door.
const STONES = Array.from({ length: 19 }, (_, k) => ({ x: 128 + (k % 2 ? 3 : -3), y: 92 + k * 6 }));
const LAMPS = [{ x: 98, y: 98 }, { x: 158, y: 98 }, { x: 110, y: 200 }, { x: 146, y: 200 }];
const NATURAL = new Set(['pine', 'maple', 'apple']);  // bees only build hives in real trees
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const inRects = (p, rects) => rects.some((r) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h);

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
  let selected = null;     // garden: {kind: 'flower'|'tree'|'pet'|'zone', ...}; house: furniture id
  let editing = false;
  let holding = null;      // furniture being placed: {item, rot, id?}
  let hoverTile = null;
  let hoverPet = null;
  let shake = 0;
  let running = false;
  let ground = null;       // pre-rendered garden ground, rebuilt when zones or floors change
  let groundKey = '';
  const pets = new Map();  // garden pets by id
  const inside = new Map(); // the same pets inside the house
  const swimmers = new Map();
  let pellets = [];
  const birds = { flock: [], next: 0, perch: null };

  const t0 = () => now() + clockSkew;  // server time in seconds
  const cat = (id) => data.catalog[id];
  const st = () => data.state;
  const clean = (zone) => Boolean(st().zones[zone]);

  // ------------------------------------------------------------- data

  async function refresh(next) {
    const d = next ?? await api('/api/home');
    if (!d.ok) return ctx.toast(d.message);
    data = d;
    clockSkew = d.now - now();
    $('home-coins').textContent = `🪙 ${Math.floor(d.coins).toLocaleString()}`;
    $('aquarium-tab').hidden = !st().aquarium;
    $('garage-tab').hidden = !st().garage;
    ctx.coins(d.coins);
    ctx.onHome?.(d);
    syncPets();
    syncSwimmers();
    renderSide();
  }

  async function act(action, body) {
    const d = await api(`/api/home/${action}`, body);
    if (!d.ok) return ctx.toast(d.message);
    await refresh(d);
    return d;
  }

  // ------------------------------------------------------------- growth

  function stage(plant) {
    const f = (t0() - plant.planted) / (cat(plant.type).hours * 3600);
    return f >= 1 ? 3 : f >= 0.5 ? 2 : f >= 0.15 ? 1 : 0;
  }
  const grownAt = (plant) => plant.planted + cat(plant.type).hours * 3600;
  function treeReady(plant) {
    const c = cat(plant.type);
    return t0() >= grownAt(plant) && t0() - Math.max(plant.harvested ?? 0, grownAt(plant)) >= c.every * 3600;
  }

  // ------------------------------------------------------------- garden pets

  function syncPets() {
    const ids = new Set(st().pets.map((p) => p.id));
    [pets, inside].forEach((m) => { for (const id of m.keys()) if (!ids.has(id)) m.delete(id); });
    st().pets.forEach((p, i) => {
      if (!pets.has(p.id)) pets.set(p.id, { id: p.id, type: p.type, x: 128 + (i % 3) * 8, y: 196, dir: 1, pose: 'idle', moving: false, until: 0, emote: null, phase: i });
      if (!inside.has(p.id)) inside.set(p.id, { id: p.id, type: p.type, x: 0, y: 0, path: [], until: 0, pose: 'idle', dir: 1, emote: null, act: null, on: null, label: 'is looking around', phase: i });
      const outfit = p.wearing ? { style: cat(p.wearing).style, color: cat(p.wearing).color } : null;
      [pets.get(p.id), inside.get(p.id)].forEach((b) => Object.assign(b, { status: p.status, fed: p.fed, place: p.place, outfit }));
    });
  }

  const lawnPoint = () => ({ x: rand(LAWN.x0, LAWN.x1), y: rand(LAWN.y0, LAWN.y1) });
  const near = (p, r) => ({ x: Math.min(LAWN.x1, Math.max(LAWN.x0, p.x + rand(-r, r))), y: Math.min(LAWN.y1, Math.max(LAWN.y0, p.y + rand(-r / 2, r / 2))) });
  const bloomed = () => st().flowers.map((f, i) => f && stage(f) === 3 && FLOWERS[i]).filter(Boolean);
  const grownTrees = () => st().trees.map((f, i) => f && stage(f) >= 2 && SPOTS[i]).filter(Boolean);
  const outside = () => [...pets.values()].filter((p) => p.place === 'garden');
  const alive = () => outside().filter((p) => p.status !== 'dead');
  const G = (p) => petGroup(p.type);
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
      if (r < 0.2) go(p, lawnPoint(), 38, ['sit', 2, 'heart']);
      else if (r < 0.34 && bloomed().length) go(p, pick(bloomed()), 26, ['sniff', 2.5]);
      else if (r < 0.44) go(p, lawnPoint(), 26, ['dig', 2.5]);
      else if (r < 0.58 && others.length) {
        const o = pick(others);
        go(p, { x: o.x, y: o.y }, 40, ['bark', 1.2, 'bang']);
        if (['cat', 'lizard', 'critter'].includes(G(o))) flee(o, p, t);
      } else if (r < 0.68 && st().pool) go(p, { x: POOL.x + POOL.w + 3, y: POOL.y + 10 }, 26, ['drink', 2.5]);
      else if (r < 0.76 && clean('southeast')) go(p, { x: 222, y: 194 }, 30, ['sleep', rand(5, 8), 'z']);  // the dog house
      else if (r < 0.88) hold(p, t, 'sit', rand(2, 4));
      else hold(p, t, 'sleep', rand(5, 9), 'z');
    },
    cat(p, t) {
      const r = Math.random();
      if (r < 0.22) go(p, lawnPoint(), 12, ['sit', 3]);
      else if (r < 0.36) hold(p, t, 'groom', 3);
      else if (r < 0.54) go(p, near(pick([...grownTrees(), DOOR, ...bloomed()].filter(Boolean)) ?? lawnPoint(), 8), 12, ['sleep', rand(6, 12), 'z']);
      else if (r < 0.72) go(p, butterflyAt(t, 0), 7, ['sit', 1, 'star'], 'stalk');
      else if (r < 0.82 && birds.perch) go(p, near(birds.perch.spot, 6), 9, ['sit', 3, 'bang'], 'stalk');
      else if (r < 0.9) go(p, { x: DOOR.x + 10, y: DOOR.y + 6 }, 12, ['sit', 4]);
      else hold(p, t, 'sit', 2, 'heart');
    },
    parrot(p, t) {
      const r = Math.random();
      const perches = [...grownTrees().map((s) => ({ x: s.x, y: s.y - 40 })), { x: DOOR.x - 20, y: DOOR.y - 40 },
        { x: 6, y: 92 }, { x: 250, y: 92 }, ...LAMPS.map((l) => ({ x: l.x, y: l.y - 12 }))];
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
      else go(p, pick(FLOWERS), 50, ['idle', 3]);
    },
    critter(p, t) {  // hamsters, rabbits, guinea pigs, hedgehogs, ferrets, chinchillas, gliders, marmosets, capybaras
      const r = Math.random();
      const fast = { ferret: 34, rabbit: 30, glider: 30, marmoset: 26, capybara: 6 }[p.type] ?? 14;
      if (p.type === 'glider' && r < 0.35 && grownTrees().length) return go(p, (({ x, y }) => ({ x, y: y - 30 }))(pick(grownTrees())), 32, ['sit', rand(3, 6)], 'glide');
      if (p.type === 'marmoset' && r < 0.4 && grownTrees().length) return go(p, (({ x, y }) => ({ x: x + 3, y: y - 22 }))(pick(grownTrees())), 22, ['sit', rand(3, 7), 'note']);
      if (p.type === 'capybara' && r < 0.35 && st().pool) return go(p, { x: rand(POOL.x + 12, POOL.x + POOL.w - 12), y: POOL.y + POOL.h - 6 }, 5, ['sleep', rand(8, 14), 'heart']);
      if (r < 0.35) go(p, near(p, p.type === 'rabbit' ? 50 : 30), fast, ['idle', rand(1, 3)]);
      else if (r < 0.55 && bloomed().length) go(p, pick(bloomed()), fast, ['eat', rand(3, 5), 'heart']);
      else if (r < 0.7) hold(p, t, 'sit', rand(2, 4), p.type === 'hamster' ? 'star' : null);
      else if (r < 0.85) hold(p, t, 'sleep', rand(5, 10), 'z');
      else go(p, pick([...STONES, ...SPOTS, DOOR]), fast, ['sit', 3]);
    },
    snake(p, t) {
      const r = Math.random();
      if (r < 0.35) go(p, near(p, 40), 6, ['idle', rand(3, 6)]);
      else if (r < 0.7) go(p, pick(STONES), 6, ['bask', rand(6, 12)]);
      else hold(p, t, 'sleep', rand(8, 14), 'z');
    },
    frog(p, t) {
      const r = Math.random();
      if (r < 0.3) go(p, near(p, 24), 20, ['idle', rand(4, 8)]);
      else if (r < 0.5 && st().pool) go(p, { x: POOL.x + POOL.w + 2, y: POOL.y + 6 }, 20, ['idle', 6, 'note']);
      else hold(p, t, 'idle', rand(5, 10), Math.random() < 0.3 ? 'note' : null);
    },
    lion(p, t) {
      const r = Math.random();
      if (r < 0.4) go(p, pick([{ x: 30, y: 110 }, { x: 226, y: 110 }, { x: 226, y: 196 }, { x: 100, y: 196 }, { x: 176, y: 130 }]), 9, ['idle', 2]);
      else if (r < 0.6) hold(p, t, 'lie', rand(6, 10));
      else if (r < 0.72) hold(p, t, 'sleep', rand(8, 12), 'z');
      else if (r < 0.86) { hold(p, t, 'roar', 1.6, 'bang'); roar(p, t); }
      else if (st().pool) go(p, { x: POOL.x + POOL.w + 4, y: POOL.y + 16 }, 9, ['lie', 4]);
      else hold(p, t, 'lie', 5);
    },
  };

  function flee(p, from, t) {
    if (p.status === 'dead' || G(p) === 'lion' || p.type === 'capybara') return;  // nothing scares a capybara
    if (G(p) === 'turtle') return hold(p, t, 'hide', 4);
    if (p.type === 'hedgehog') return hold(p, t, 'sleep', 4, 'bang');  // rolls into a ball
    if (G(p) === 'parrot') return go(p, { x: rand(20, 236), y: rand(40, 80) }, 34, ['perch', 3], 'fly');
    const away = { x: p.x + Math.sign(p.x - from.x || 1) * 40, y: p.y + Math.sign(p.y - from.y || 1) * 20 };
    go(p, near(away, 4), p.type === 'lizard' ? 55 : 36, ['sit', 2, 'bang']);
  }

  function roar(p, t) {
    shake = t + 0.6;
    alive().filter((o) => o !== p && dist(o, p) < 90).forEach((o) => (G(o) === 'dog' ? hold(o, t, 'sit', 2, 'bang') : flee(o, p, t)));
    if (birds.perch) birds.perch.leave = 0;
  }

  function butterflyAt(t, i) {
    const f = bloomed();
    if (!f.length) return { x: 128 + Math.sin(t * 0.4 + i) * 60, y: 130 + Math.sin(t * 0.9 + i) * 20 };
    const c = f[i % f.length];
    return { x: c.x + Math.sin(t * 0.7 + i * 2) * 14, y: c.y - 12 + Math.sin(t * 1.3 + i) * 6 };
  }

  function thinkPet(p, t, dt) {
    if (p.status === 'dead' || p.place !== 'garden') return;
    const slow = p.status === 'hungry' ? 0.5 : 1;
    if (hoverPet === p) {
      p.moving = false;
      p.pose = { dog: 'sit', cat: 'sit', parrot: 'sing', turtle: 'idle', lizard: 'idle', lion: 'lie', critter: 'sit', snake: 'idle', frog: 'idle' }[G(p)];
      p.emote = G(p) === 'parrot' ? 'note' : 'heart';
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
    if (['cat', 'turtle', 'lizard', 'critter', 'frog'].includes(G(p)) && p.pose !== 'hide') {
      const threat = alive().find((o) => (G(o) === 'dog' || G(o) === 'lion') && o.moving && dist(o, p) < 16);
      if (threat) return flee(p, threat, t);
    }
    if (t > p.until) BRAINS[G(p)](p, t);
  }

  // ------------------------------------------------------------- birds flying by, one landing in a tree

  function thinkBirds(t, dt) {
    if (t > birds.next) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      const y = rand(8, 70);
      const n = 3 + Math.floor(Math.random() * 3);
      birds.flock = Array.from({ length: n }, (_, i) => ({ x: dir > 0 ? -10 - i * 7 : GW + 10 + i * 7, y: y + Math.abs(i - n / 2) * 4, dir, i }));
      birds.next = t + rand(14, 26);
      const trees = grownTrees();
      if (!birds.perch && trees.length && Math.random() < 0.6) {
        const spot = pick(trees);
        birds.perch = { spot, x: dir > 0 ? -8 : GW + 8, y: 20, sit: { x: spot.x + 4, y: spot.y - 42 }, landed: false, leave: t + rand(10, 18), dir };
      }
    }
    birds.flock.forEach((b) => { b.x += b.dir * 34 * dt; b.y += Math.sin(t * 2 + b.i) * 0.08; });
    birds.flock = birds.flock.filter((b) => b.x > -40 && b.x < GW + 40);
    const p = birds.perch;
    if (p) {
      const goal = t < p.leave ? p.sit : { x: p.dir > 0 ? GW + 20 : -20, y: 10 };
      const dx = goal.x - p.x;
      const dy = goal.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 1) { p.x += (dx / d) * 40 * dt; p.y += (dy / d) * 40 * dt; p.dir = Math.sign(dx) || p.dir; p.landed = false; } else p.landed = t < p.leave;
      if (t >= p.leave && (p.x < -15 || p.x > GW + 15)) birds.perch = null;
    }
  }

  // ------------------------------------------------------------- garden drawing

  function buildGround() {
    const c = document.createElement('canvas');
    c.width = GW;
    c.height = GH;
    const q = c.getContext('2d');
    // night sky and the city behind the garden
    for (let j = 0; j < 30; j += 2) rect(q, 0, j, GW, 2, `rgb(${10 + j},${6 + j / 2},${30 + j * 1.5})`);
    for (let i = 0; i < GW; i += 9) {
      const h = 8 + Math.floor(hash(i * 0.7) * 16);
      rect(q, i, 30 - h, 8, h, '#0c0820');
      for (let j = 2; j < h - 2; j += 3) if (hash(i + j) > 0.55) rect(q, i + 2 + (j % 2) * 3, 30 - h + j, 1, 1, j % 4 ? '#ffe58a' : '#ff4fd8');
    }
    // the back wall the house stands in front of, then a strip of ground for the house
    drawWallFace(q, 0, 28, GW, 42);
    drawFloor(q, WALL_T, 70, GW - WALL_T * 2, 16, 'base', 0);
    // each part of the garden is one panel of neon ground until a floor is laid on it
    Object.entries(ZONES).forEach(([zone, rects], zi) => {
      const z = st().zones[zone];
      rects.forEach((r, ri) => drawFloor(q, r.x, r.y, r.w, r.h, z?.floor ?? 'base', zi * 17 + ri));
    });
    // wasteland: the same ground with garbage lying around, a few big recognizable pieces
    const junk = [];
    Object.entries(ZONES).forEach(([zone, rects], zi) => {
      if (st().zones[zone]) return;
      rects.forEach((r, ri) => {
        for (let y = r.y + 16; y <= r.y + r.h - 2; y += 20) {
          for (let x = r.x + 12; x <= r.x + r.w - 12; x += 28) {
            const k = zi * 97 + ri * 31 + x * 0.13 + y * 0.71;
            if (hash(k) < 0.75) continue;  // a few pieces per part
            const jx = x + Math.round((hash(k + 1) - 0.5) * 10);
            if (Math.abs(jx - DOOR.x) < 18) continue;  // the stone road from the gate to the door stays clear
            junk.push({ x: jx, y: y - Math.round(hash(k + 2) * 5), kind: GARBAGE_KINDS[Math.floor(hash(k + 3) * GARBAGE_KINDS.length)] });
          }
        }
      });
    });
    junk.sort((a, b) => a.y - b.y).forEach((j) => drawGarbage(q, j.kind, j.x, j.y));
    // the flower beds along the road: a stone curb and leafy ground cover, no bare dirt
    if (clean('plaza')) {
      BEDS.forEach((b, bi) => {
        rect(q, b.x - 2, b.y - 2, b.w + 4, b.h + 4, '#1a1a24');
        rect(q, b.x - 1, b.y - 1, b.w + 2, b.h + 2, '#9a9aa8');
        for (let k = 0; k < b.w + 2; k += 3) { rect(q, b.x - 1 + k, b.y - 1, 2, 1, '#c8c8d4'); rect(q, b.x - 1 + k, b.y + b.h, 2, 1, '#6a6a78'); }
        for (let k = 0; k < b.h + 2; k += 3) { rect(q, b.x - 1, b.y - 1 + k, 1, 2, '#c8c8d4'); rect(q, b.x + b.w, b.y - 1 + k, 1, 2, '#6a6a78'); }
        rect(q, b.x, b.y, b.w, b.h, '#173f24');
        for (let i = 0; i < 110; i++) {
          const x = b.x + Math.floor(hash(i + bi * 300) * (b.w - 2));
          const y = b.y + Math.floor(hash(i * 3 + bi * 300 + 70) * (b.h - 1));
          rect(q, x, y, 2, 1, i % 3 ? '#2a6a38' : '#3f8a48');
          if (i % 7 === 0) rect(q, x, y - 1, 1, 1, '#7fd86a');
        }
      });
    }
    const road = STONES;  // the road is always there, through every part of the garden
    road.forEach((s, k) => {
      ellipse(q, s.x, s.y + 1, 4, 2, '#20202a');
      ellipse(q, s.x, s.y, 4, 2, '#a8a8b8');
      rect(q, s.x - 2, s.y - 1, 3, 1, '#d8d8e4');
      if (k % 4 === 1) rect(q, s.x + 3, s.y + 1, 1, 1, '#5aa850');
    });
    if (clean('southeast')) {   // the play corner: a dog house and a sandbox
      rect(q, 214, 180, 18, 14, '#7a3a2a'); rect(q, 212, 177, 22, 4, '#3a2a4a'); rect(q, 219, 185, 8, 9, '#140a10');
      rect(q, 212, 177, 22, 1, '#ff4fd8');
      rect(q, 158, 182, 26, 14, '#5a4030'); rect(q, 160, 184, 22, 10, '#e8d4a0'); rect(q, 168, 186, 4, 3, '#ff3b6b');
    }
    // the garden wall: down both sides (seen from above: a lit top) and along the front (its face), with the gate
    [[0, 'r'], [GW - WALL_T, 'l']].forEach(([x, inner]) => {
      rect(q, x, 28, WALL_T, GH - 28, '#3a3050');
      for (let y = 34; y < GH; y += 12) rect(q, x, y, WALL_T, 1, '#2a2240');
      rect(q, inner === 'r' ? x + WALL_T - 1 : x, 28, 1, GH - 28, '#00e5ff');
      rect(q, inner === 'r' ? x : x + WALL_T - 1, 28, 1, GH - 28, '#1a1428');
    });
    [[WALL_T, 112], [144, GW - WALL_T]].forEach(([x0, x1]) => drawWallFace(q, x0, 198, x1 - x0, 10));
    [110, 144].forEach((x) => { rect(q, x, 190, 4, 18, '#4a3e62'); rect(q, x, 190, 4, 2, '#6a5a86'); rect(q, x + 1, 186, 2, 4, '#ff4fd8'); });  // gate posts
    ground = c;
  }

  // A wall seen from the front: a lit cap, big concrete panels, neon strips along the top and the base.
  function drawWallFace(q, x0, y0, w, h) {
    rect(q, x0, y0, w, h, '#2e2642');
    for (let x = x0; x < x0 + w; x += 32) { rect(q, x, y0 + 4, 1, h - 4, '#221c34'); rect(q, x + 1, y0 + 4, 1, h - 4, '#3c3254'); }
    if (h > 20) rect(q, x0, y0 + Math.round(h / 2), w, 1, '#221c34');
    rect(q, x0, y0, w, 3, '#5a4c78'); rect(q, x0, y0 + 3, w, 1, '#00e5ff');
    rect(q, x0, y0 + h - 2, w, 1, '#ff4fd8'); rect(q, x0, y0 + h - 1, w, 1, '#120c1c');
  }

  function drawGarden(t) {
    const key = JSON.stringify([st().zones, st().house]);
    if (key !== groundKey || !ground) { groundKey = key; buildGround(); }
    g.drawImage(ground, 0, 0);
    for (let i = 0; i < 24; i++) if ((t * 0.7 + hash(i) * 5) % 5 < 2.5) rect(g, Math.floor(hash(i + 3) * GW), Math.floor(hash(i + 8) * 18), 1, 1, '#ffffff');  // stars
    disc(g, 230, 10, 5, '#fff4c8'); disc(g, 232, 9, 4, '#1a0f3a');  // moon
    Object.entries(st().zones).forEach(([zone, z]) => {  // neon tiles pulse
      if (z.floor !== 'neon') return;
      const a = 0.35 + Math.sin(t * 2 + zone.length) * 0.25;
      ZONES[zone].forEach((r) => {
        for (let x = r.x; x < r.x + r.w; x += 8) rect(g, x, r.y, 1, r.h, `rgba(0,229,255,${a})`);
        for (let y = r.y; y < r.y + r.h; y += 8) rect(g, r.x, y, r.w, 1, `rgba(255,79,216,${a * 0.8})`);
      });
    });
    if (st().pool) drawPool(g, POOL.x, POOL.y, POOL.w, POOL.h, t);
    if (selected?.kind === 'zone') ZONES[selected.id].forEach((r) => strokeBox(r.x, r.y, r.w, r.h, t % 1 < 0.6 ? '#00e5ff' : '#ff4fd8'));

    const items = [];
    items.push({ y: DOOR.y, draw: () => drawHouse(g, st().house, DOOR.x, DOOR.y, t) });
    if (st().garage && !data.garage_merged) items.push({ y: GARAGE.y - 0.5, draw: () => drawGarage(g, GARAGE.x, GARAGE.y, t) });
    if (st().theme) items.push(...decorItems(g, st().theme, t));
    st().trees.forEach((tr, i) => { if (tr && tr.type === 'sakura' && stage(tr) === 3) for (let k = 0; k < 26; k++) rect(g, SPOTS[i].x - 14 + hash(k) * 28, SPOTS[i].y - 4 + hash(k + 40) * 9, 1, 1, k % 3 ? '#ffb4d4' : '#ffe4ef'); });
    st().flowers.forEach((f, i) => {
      const s = FLOWERS[i];
      if (f) items.push({ y: s.y, draw: () => drawFlower(g, f.type, s.x, s.y, stage(f), t, i) });
      else if (clean('plaza') && t % 1.6 < 0.8) { rect(g, s.x - 1, s.y - 3, 3, 1, '#00e5ff'); rect(g, s.x, s.y - 4, 1, 3, '#00e5ff'); }
      if (selected?.kind === 'flower' && selected.i === i) strokeBox(s.x - 10, s.y - 16, 20, 18, '#00e5ff');
    });
    SPOTS.forEach((s, i) => {
      const tr = st().trees[i];
      const zone = i < 2 ? 'west' : 'east';
      items.push({
        y: s.y,
        draw: () => {
          if (clean(zone)) { ellipse(g, s.x, s.y, 7, 3, '#20202a'); ellipse(g, s.x, s.y - 1, 6, 2, '#5a4030'); }
          if (tr) {
            const sg = stage(tr);
            drawTree(g, tr.type, s.x, s.y, sg, t, i, sg === 3 && treeReady(tr));
            if (sg === 3 && st().theme) dressTree(g, st().theme, s.x, s.y, t, i);
            if (sg === 3 && NATURAL.has(tr.type)) {  // bees build a hive over the first day after it is grown
              const level = Math.min(1, (t0() - grownAt(tr)) / 86400);
              drawHive(g, s.x - 8, s.y - 20, level);
            }
          } else if (clean(zone) && t % 1.6 < 0.8) { rect(g, s.x - 1, s.y - 3, 3, 1, '#00e5ff'); rect(g, s.x, s.y - 4, 1, 3, '#00e5ff'); }
          if (selected?.kind === 'tree' && selected.i === i) strokeBox(s.x - 16, s.y - 46, 32, 48, '#00e5ff');
        },
      });
    });
    outside().forEach((p) => items.push({
      y: p.y,
      draw: () => {
        const flying = p.pose === 'fly' || p.pose === 'perch' || p.pose === 'glide';
        if (!flying && p.pose !== 'swim') ellipse(g, p.x, p.y, Math.ceil(PET_SIZE[p.type][0] / 3), 1, 'rgba(0,0,0,0.3)');
        drawPet(g, p.type, p.x, p.y, { dir: p.dir, pose: p.pose, moving: p.moving, dead: p.status === 'dead', emote: p.emote, outfit: p.outfit }, t + p.phase);
        if (selected?.kind === 'pet' && selected.id === p.id) icon(g, 'star', p.x - 2, p.y + 2);
      },
    }));
    LAMPS.forEach((l, i) => items.push({
      y: l.y,
      draw: () => {
        if (!clean('path')) return;
        rect(g, l.x, l.y - 12, 1, 12, '#2a2a3a'); rect(g, l.x - 1, l.y - 1, 3, 1, '#1a1a24');
        rect(g, l.x - 1, l.y - 15, 3, 3, i % 2 ? '#ff4fd8' : '#00e5ff');
        glow(g, l.x, l.y - 13, 14, i % 2 ? '255,79,216' : '0,229,255', 0.3 + Math.sin(t * 3 + i) * 0.05);
      },
    }));
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

    // little life on top: falling sakura petals and maple leaves, bees, butterflies, fireflies, birds
    st().trees.forEach((tr, i) => {
      if (!tr || stage(tr) < 3) return;
      const s = SPOTS[i];
      if (tr.type === 'sakura') {
        for (let k = 0; k < 14; k++) {
          const p = (t * 0.12 + hash(k + i * 9)) % 1;
          rect(g, s.x - 14 + hash(k) * 26 + p * 14 + Math.sin(t * 2 + k) * 2, s.y - 34 + p * 36, k % 4 ? 1 : 2, 1, k % 3 ? '#ffb4d4' : '#fff0f6');
        }
      } else if (tr.type === 'maple') {
        for (let k = 0; k < 3; k++) { const p = (t * 0.08 + hash(k + 5)) % 1; rect(g, s.x - 10 + hash(k) * 20 + Math.sin(t + k) * 3, s.y - 30 + p * 32, 2, 1, '#ec7228'); }
      }
      if (NATURAL.has(tr.type)) {
        const level = Math.min(1, (t0() - grownAt(tr)) / 86400);
        const hive = { x: s.x - 8, y: s.y - 14 };
        const flowers = bloomed();
        for (let k = 0; k < 2 + Math.round(level * 4); k++) {
          let b;
          if (flowers.length && k % 2 && level > 0.3) {
            const f = flowers[(k + i) % flowers.length];
            const p = (t * 0.08 + k * 0.29) % 1;
            const leg = p < 0.4 ? p / 0.4 : p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
            b = { x: hive.x + (f.x - hive.x) * leg + Math.sin(t * 9 + k) * 2, y: hive.y + (f.y - 10 - hive.y) * leg + Math.cos(t * 7 + k) * 2 };
          } else b = { x: hive.x + Math.cos(t * 3 + k * 1.7) * (5 + k), y: hive.y + Math.sin(t * 4 + k) * 4 };
          drawBee(g, b.x, b.y, t, k);
        }
      }
    });
    for (let i = 0; i < 3; i++) {
      const b = butterflyAt(t, i);
      const c = ['#ffd84a', '#ff9fd8', '#9fe8ff'][i];
      const f = Math.floor(t * 10 + i) % 2;
      rect(g, b.x - (f ? 2 : 1), b.y, f ? 2 : 1, 2, c); rect(g, b.x + 1, b.y, f ? 2 : 1, 2, c); rect(g, b.x, b.y, 1, 2, '#333');
    }
    for (let i = 0; i < 8; i++) {
      const fx = 20 + hash(i) * 216 + Math.sin(t * 0.5 + i) * 10;
      const fy = 100 + hash(i + 4) * 96 + Math.cos(t * 0.7 + i) * 6;
      if ((t + i) % 3 < 2) { rect(g, fx, fy, 1, 1, '#d8ff6a'); glow(g, fx, fy, 3, '216,255,106', 0.5); }
    }
    birds.flock.forEach((b) => drawBird(g, b.x, b.y, t, b.i));
    if (birds.perch) drawBird(g, birds.perch.x, birds.perch.y, t, 9, birds.perch.landed);
    if (st().theme) weather(g, st().theme, t, GW, GH);
  }

  function strokeBox(x, y, w, h, c) {
    rect(g, x, y, w, 1, c); rect(g, x, y + h - 1, w, 1, c); rect(g, x, y, 1, h, c); rect(g, x + w - 1, y, 1, h, c);
  }

  // ------------------------------------------------------------- house: grid, walls, furniture, pets inside

  const grid = () => cat(st().house).grid;
  const walls = () => cat(st().house).walls;
  const layout = () => st().layouts[st().house] ?? [];
  const size = (item, rot) => { const [w, h] = cat(item).size; return rot % 2 ? [h, w] : [w, h]; };

  function crossesWall(x, y, w, h) {
    return walls().some(([kind, at, a0, a1]) => (kind === 'v'
      ? x < at && at < x + w && y < a1 && a0 < y + h
      : y < at && at < y + h && x < a1 && a0 < x + w));
  }

  const onWall = (item) => cat(item).wall;
  function fits(item, x, y, rot, skip) {
    const [gw, gh] = grid();
    if (onWall(item)) {  // paintings and windows hang side by side on the back wall
      const w = cat(item).size[0];
      return y === -1 && x >= 0 && x + w <= gw
        && layout().every((f) => f.id === skip || !onWall(f.item) || x >= f.x + cat(f.item).size[0] || f.x >= x + w);
    }
    const [w, h] = size(item, rot);
    if (x < 0 || y < 0 || x + w > gw || y + h > gh || crossesWall(x, y, w, h)) return false;
    return layout().every((f) => {
      if (f.id === skip || onWall(f.item) || (f.item === 'rug') !== (item === 'rug')) return true;
      const [fw, fh] = size(f.item, f.rot);
      return !(x < f.x + fw && f.x < x + w && y < f.y + fh && f.y < y + h);
    });
  }

  function blocked() {
    const [gw, gh] = grid();
    const b = Array.from({ length: gw }, () => new Array(gh).fill(false));
    layout().forEach((f) => {
      if (f.item === 'rug' || onWall(f.item)) return;
      const [w, h] = size(f.item, f.rot);
      for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) b[f.x + i][f.y + j] = true;
    });
    return b;
  }

  // A wall between two neighbouring tiles?
  function wallBetween(a, b) {
    return walls().some(([kind, at, a0, a1, doors]) => {
      if (kind === 'v' && a.y === b.y && Math.max(a.x, b.x) === at && Math.min(a.x, b.x) === at - 1) return a.y >= a0 && a.y < a1 && !doors.includes(a.y);
      if (kind === 'h' && a.x === b.x && Math.max(a.y, b.y) === at && Math.min(a.y, b.y) === at - 1) return a.x >= a0 && a.x < a1 && !doors.includes(a.x);
      return false;
    });
  }

  // Shortest walk on free tiles to any of `goals` (BFS, through doorways); [] if unreachable.
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
        if (n.x >= 0 && n.y >= 0 && n.x < gw && n.y < gh && !b[n.x][n.y] && !prev.has(key(n)) && !wallBetween(c, n)) { prev.set(key(n), key(c)); queue.push(n); }
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

  // What pets do with furniture: [kind of action, gets on top, what the status line says]
  const ACTS = {
    bed: ['rest', true, 'is napping on the bed'], double_bed: ['rest', true, 'is sprawled across the big bed'],
    sofa: ['rest', true, 'is curled up on the sofa'], armchair: ['rest', true, 'has taken the armchair'],
    bean_bag: ['rest', true, 'sank into the bean bag'], cat_bed: ['rest', true, 'is asleep in the pet bed'],
    chair: ['watch', true, 'is sitting on a chair'], office_chair: ['play', true, 'is spinning on the office chair'],
    rug: ['rest', true, 'is rolling on the rug'], fireplace: ['rest', false, 'is warming up by the fire'],
    tv: ['watch', false, 'is watching TV'], fish_tank: ['watch', false, 'is staring at the fish'],
    console: ['watch', false, 'is watching the game console'], arcade: ['watch', false, 'is watching the arcade lights'],
    telescope: ['watch', false, 'is looking at the stars'], clock: ['watch', false, 'is watching the pendulum'],
    computer: ['play', true, 'is sitting on the keyboard'], piano: ['play', true, 'is walking on the piano keys'],
    guitar: ['play', false, 'is plucking the guitar'], record_player: ['play', false, 'is dancing to a record'],
    easel: ['play', false, 'is painting with its paws'],
    fridge: ['beg', false, 'is begging at the fridge'], stove: ['beg', false, 'smells something cooking'],
    counter: ['beg', false, 'is looking for snacks'], dining_table: ['beg', false, 'is begging at the table'],
    sink: ['drink', false, 'is drinking from the sink'], toilet: ['drink', false, 'is drinking from the toilet (ew)'],
    bathtub: ['drink', true, 'is splashing in the bathtub'],
    plant_pot: ['sniff', false, 'is sniffing the plant'], big_plant: ['sniff', false, 'is hiding behind the big plant'],
    vase: ['sniff', false, 'is about to knock over the vase'],
    wardrobe: ['hide', false, 'is hiding in the wardrobe'], dresser: ['hide', true, 'is sitting on the dresser'],
    cat_tree: ['rest', true, 'is lounging on the climbing tower'], mirror: ['watch', false, 'is staring at itself in the mirror'],
    hammock: ['rest', true, 'is swinging in the hammock'], mini_bar: ['beg', false, 'is sniffing the mini bar'],
    jukebox: ['play', false, 'is dancing to the jukebox'], drum_kit: ['play', false, 'is banging the drums'],
    vending: ['beg', false, 'is begging at the vending machine'], treadmill: ['play', true, 'is running on the treadmill'],
    pool_table: ['watch', true, 'is batting the pool balls around'], massage_chair: ['rest', true, 'is getting a massage'],
    grand_fireplace: ['rest', false, 'is warming up by the grand fire'],
    mattress: ['rest', true, 'is curled up on the mattress'], old_laptop: ['watch', false, 'is watching the old laptop flicker'],
    shower: ['drink', false, 'is licking drops off the shower'],
    bookshelf: ['hide', false, 'is napping by the books'], desk: ['hide', true, 'is lying on the desk'],
    coffee_table: ['watch', true, 'is sitting on the coffee table'], floor_lamp: ['watch', false, 'is chasing the lamp light'],
  };
  const POSES = {  // action -> pose per kind of pet
    rest: { dog: 'sleep', cat: 'sleep', parrot: 'perch', turtle: 'hide', lizard: 'bask', lion: 'sleep', critter: 'sleep', snake: 'sleep', frog: 'idle' },
    watch: { dog: 'sit', cat: 'sit', parrot: 'perch', turtle: 'idle', lizard: 'idle', lion: 'lie', critter: 'sit', snake: 'idle', frog: 'idle' },
    play: { dog: 'bark', cat: 'groom', parrot: 'sing', turtle: 'idle', lizard: 'pushup', lion: 'roar', critter: 'sit', snake: 'bask', frog: 'idle' },
    beg: { dog: 'sit', cat: 'sit', parrot: 'sing', turtle: 'eat', lizard: 'idle', lion: 'idle', critter: 'eat', snake: 'idle', frog: 'idle' },
    drink: { dog: 'drink', cat: 'sit', parrot: 'preen', turtle: 'swim', lizard: 'idle', lion: 'lie', critter: 'eat', snake: 'idle', frog: 'idle' },
    sniff: { dog: 'sniff', cat: 'stalk', parrot: 'perch', turtle: 'eat', lizard: 'idle', lion: 'idle', critter: 'eat', snake: 'idle', frog: 'idle' },
    hide: { dog: 'sit', cat: 'sleep', parrot: 'perch', turtle: 'hide', lizard: 'bask', lion: 'lie', critter: 'sleep', snake: 'sleep', frog: 'idle' },
  };
  const EMOTES = { rest: 'z', watch: 'star', play: 'note', beg: 'food', drink: 'drop', sniff: 'heart', hide: 'bang' };

  function petNext(p, t) {
    p.on = null;
    p.act = null;
    const busy = new Set([...inside.values()].filter((q) => q !== p && q.act).map((q) => q.act.id));  // one pet per piece
    const usable = layout().filter((f) => ACTS[f.item] && !busy.has(f.id));
    const here = { x: Math.round(p.x), y: Math.round(p.y) };
    if (usable.length && Math.random() < 0.7) {
      const f = pick(usable);
      const goals = besideTiles(f);
      const steps = path(here, goals);
      if (steps.length || goals.some((q) => q.x === here.x && q.y === here.y)) {
        Object.assign(p, { path: steps, act: f, label: 'is walking over' });
        return;
      }
    }
    const [gw, gh] = grid();
    if (Math.random() < 0.55) {
      p.path = path(here, [{ x: Math.floor(rand(0, gw)), y: Math.floor(rand(0, gh)) }]);
      p.label = 'is exploring the house';
    } else {
      const [pose, label, emote] = pick([['sit', 'is resting', null], ['idle', 'is looking around', null], [POSES.play[G(p)], 'is playing', 'note'], [POSES.rest[G(p)], 'is dozing', 'z']]);
      Object.assign(p, { pose, label, emote, until: t + rand(2, 4) });
    }
  }

  function petArrive(p, t) {
    const f = p.act;
    const [kind, on, label] = ACTS[f.item];
    Object.assign(p, { pose: POSES[kind][G(p)], label, emote: EMOTES[kind], until: t + rand(5, 11) });
    if (on) p.on = f;
    const [w] = size(f.item, f.rot);
    p.dir = f.x + w / 2 > p.x ? 1 : -1;
    if (p.type === 'glider' || G(p) === 'parrot') p.pose = 'perch';
    if (kind === 'play' && G(p) === 'lion') shake = t + 0.4;
  }

  function thinkInside(p, t, dt) {
    if (p.status === 'dead' || p.place !== 'house') return;
    if (p.petted) { Object.assign(p, { pose: POSES.watch[G(p)], emote: 'heart', label: 'is being petted' }); return; }
    if (p.path.length) {
      const n = p.path[0];
      const dx = n.x - p.x;
      const dy = n.y - p.y;
      const d = Math.hypot(dx, dy);
      const step = (p.status === 'hungry' ? 1.5 : 3) * dt;
      Object.assign(p, { pose: p.type === 'parrot' ? 'fly' : 'walk', moving: true, emote: null });
      if (Math.abs(dx) > 0.01) p.dir = Math.sign(dx);
      if (d <= step) { p.x = n.x; p.y = n.y; p.path.shift(); } else { p.x += (dx / d) * step; p.y += (dy / d) * step; }
      if (!p.path.length) {
        p.moving = false;
        if (p.act) petArrive(p, t);
        else if (p.called) Object.assign(p, { pose: POSES.watch[G(p)], emote: 'heart', label: 'came when you called', until: t + 2.5, called: false });
        else Object.assign(p, { pose: 'idle', until: t + rand(1, 3) });
      }
      return;
    }
    p.moving = false;
    if (p.status === 'hungry' && Math.floor(t) % 7 === 0) p.emote = 'food';
    if (t >= p.until) petNext(p, t);
  }

  function petPixel(p) {
    if (p.on) {
      const [w, h] = size(p.on.item, p.on.rot);
      const [x, y] = tileOrigin(p.on.x, p.on.y);
      return { px: x + (w * TILE) / 2, py: p.on.item.includes('bed') ? y + 26 : y + h * TILE - 4 };
    }
    const [x, y] = tileOrigin(p.x, p.y);
    return { px: x + TILE / 2, py: Math.min(y + TILE - 3, ROOM.wall + grid()[1] * TILE - 3) };
  }

  function placePets() {
    const [gw, gh] = grid();
    const b = blocked();
    const free = [];
    for (let y = gh - 1; y >= 0; y--) for (let x = 0; x < gw; x++) if (!b[x][y]) free.push({ x, y });
    [...inside.values()].filter((p) => p.place === 'house').forEach((p, i) => {
      const spot = free[Math.min(free.length - 1, Math.floor(free.length / 2) + i * 2)] ?? { x: 0, y: 0 };
      Object.assign(p, { x: spot.x, y: spot.y, path: [], act: null, on: null, until: 0 });
    });
  }

  function drawItem(item, gx, gy, rot, t, use, alpha = 1) {
    const [w, h] = cat(item).size;
    const scratch = drawItem.c ?? (drawItem.c = document.createElement('canvas'));
    scratch.width = w * TILE + 2;
    scratch.height = h * TILE + 2;
    const sg = scratch.getContext('2d');
    sg.translate(1, 1);
    drawFurniture(sg, item, w * TILE, h * TILE, t, use, item === 'fish_tank' ? { fish: tankFish() } : {});
    const [fw, fh] = size(item, rot);
    const [ox, oy] = tileOrigin(gx, gy);
    g.save();
    g.globalAlpha = alpha;
    g.translate(ox + (fw * TILE) / 2, oy + (fh * TILE) / 2);
    g.rotate((rot * Math.PI) / 2);
    g.drawImage(scratch, (-w * TILE) / 2 - 1, (-h * TILE) / 2 - 1);
    g.restore();
  }
  const WALL_TOP = 9;
  function drawWall(item, gx, t, alpha) {
    const w = cat(item).size[0] * TILE;
    const c = drawWall.c ?? (drawWall.c = document.createElement('canvas'));
    c.width = w + 2;
    c.height = WALL_H + 2;
    const cg = c.getContext('2d');
    cg.translate(1, 1);
    drawWallPiece(cg, item, w, t);
    g.save();
    g.globalAlpha = alpha;
    g.drawImage(c, ROOM.side + gx * TILE - 1, WALL_TOP - 1);
    g.restore();
  }
  const tankFish = () => st().aquatic.filter((a) => cat(a.type).kind === 'fish').map((a) => a.type);

  function drawHouseView(t) {
    const [gw, gh] = grid();
    drawRoom(g, st().house, gw, gh, t, editing);
    layout().filter((f) => onWall(f.item)).forEach((f) => {
      drawWall(f.item, f.x, t, holding?.id === f.id ? 0.35 : 1);
      if (editing && selected === f.id) strokeBox(ROOM.side + f.x * TILE, WALL_TOP, cat(f.item).size[0] * TILE, WALL_H, '#00e5ff');
    });
    layout().filter((f) => f.item === 'rug').forEach((f) => drawItem(f.item, f.x, f.y, f.rot, t, false));
    const home = () => [...inside.values()].filter((p) => p.place === 'house' && p.status !== 'dead');
    const using = new Set(home().filter((p) => p.act && !p.path.length).map((p) => p.act.id));
    const stand = layout().filter((f) => f.item !== 'rug' && !onWall(f.item)).map((f) => ({
      key: f.y + size(f.item, f.rot)[1],
      draw: () => {
        drawItem(f.item, f.x, f.y, f.rot, t, using.has(f.id), holding?.id === f.id ? 0.35 : 1);
        if (editing && selected === f.id) {
          const [w, h] = size(f.item, f.rot);
          const [x, y] = tileOrigin(f.x, f.y);
          strokeBox(x, y, w * TILE, h * TILE, '#00e5ff');
        }
      },
    }));
    stand.push(...wallPieces(g, st().house, walls()));
    home().forEach((p) => {
      const { px, py } = petPixel(p);
      stand.push({
        key: (p.on ? p.on.y + size(p.on.item, p.on.rot)[1] : p.y + 1) + 0.1,
        draw: () => {
          if (p.status === 'dead') return;
          if (!p.on) ellipse(g, px, py, Math.ceil(PET_SIZE[p.type][0] / 3), 1, 'rgba(0,0,0,0.3)');
          drawPet(g, p.type, px, py, { dir: p.dir, pose: p.pose === 'fly' ? 'glide' : p.pose, moving: p.moving, emote: t % 2 < 1.4 ? p.emote : null, outfit: p.outfit }, t + p.phase);
          if (p.on?.item === 'bathtub') rect(g, px - 8, py - 5, 16, 4, '#8fd8ff');
        },
      });
    });
    stand.sort((a, b) => a.key - b.key).forEach((it) => it.draw());
    drawExit(t);
    if (editing && holding && hoverTile && onWall(holding.item)) {
      const ok = fits(holding.item, hoverTile.x, -1, 0, holding.id);
      drawWall(holding.item, hoverTile.x, t, 0.7);
      g.fillStyle = ok ? 'rgba(0,255,159,0.25)' : 'rgba(255,42,109,0.35)';
      g.fillRect(ROOM.side + hoverTile.x * TILE, WALL_TOP, cat(holding.item).size[0] * TILE, WALL_H);
    } else if (editing && holding && hoverTile) {
      const ok = fits(holding.item, hoverTile.x, hoverTile.y, holding.rot, holding.id);
      drawItem(holding.item, hoverTile.x, hoverTile.y, holding.rot, t, false, 0.7);
      const [w, h] = size(holding.item, holding.rot);
      const [x, y] = tileOrigin(hoverTile.x, hoverTile.y);
      g.fillStyle = ok ? 'rgba(0,255,159,0.25)' : 'rgba(255,42,109,0.35)';
      g.fillRect(x, y, w * TILE, h * TILE);
    }
  }

  // The front door at the bottom of the room: click it to go out to the garden.
  function exitBox() {
    const [w, h] = roomSize(...grid());
    return { x: Math.round(w / 2) - TILE, y: h - ROOM.bottom - 6, w: TILE * 2, h: ROOM.bottom + 6 };
  }
  function drawExit(t) {
    const b = exitBox();
    const on = hoverExit || t % 1.2 < 0.8;
    rect(g, b.x + 2, b.y + 6, b.w - 4, b.h - 6, hoverExit ? '#2a0a3a' : '#120618');
    rect(g, b.x + 2, b.y + 6, 1, b.h - 6, '#00e5ff'); rect(g, b.x + b.w - 3, b.y + 6, 1, b.h - 6, '#00e5ff');
    const ax = b.x + b.w / 2;  // an arrow pointing out
    [[0, 0, 1], [-1, 1, 3], [-2, 2, 5]].forEach(([dx, dy, w]) => rect(g, ax + dx - 0.5, b.y + b.h - 6 + dy, w, 1, on ? '#ff4fd8' : '#7a2a6a'));
    rect(g, ax - 1, b.y + b.h - 10, 2, 4, on ? '#ff4fd8' : '#7a2a6a');
    if (on) glow(g, ax, b.y + b.h - 6, 8, '255,79,216', 0.35);
  }
  let hoverExit = false;
  const atExit = (m) => { const b = exitBox(); return m.x >= b.x && m.x < b.x + b.w && m.y >= b.y && m.y < b.y + b.h + 2; };

  // ------------------------------------------------------------- aquarium

  const REGION = {  // where each kind swims: [x0, x1, y0, y1], speed
    starfish: [[8, 248, AQ.sand - 3, AQ.sand + 2], 2], seahorse: [[30, 50, 90, 140], 3], eel: [[200, 230, AQ.sand - 8, AQ.sand - 4], 4],
    octopus: [[150, 200, AQ.sand - 10, AQ.sand - 6], 4], jellyfish: [[20, 236, 40, 120], 4], whale: [[50, 200, 60, 110], 9],
    shark: [[30, 226, 40, 120], 16], manta: [[30, 226, 50, 120], 10], sea_turtle: [[20, 236, 40, 130], 8],
    lionfish: [[60, 200, 110, 140], 6],
  };
  function syncSwimmers() {
    const ids = new Set(st().aquatic.map((a) => a.id));
    for (const id of swimmers.keys()) if (!ids.has(id)) swimmers.delete(id);
    st().aquatic.forEach((a, i) => {
      if (swimmers.has(a.id)) return;
      const ice = cat(a.type).kind === 'ice';
      swimmers.set(a.id, {
        id: a.id, type: a.type, kind: cat(a.type).kind, dir: i % 2 ? 1 : -1, until: 0, pose: ice ? 'stand' : 'swim',
        x: ice ? rand(AQ.ice.x0 + 8, 246) : rand(30, 220), y: ice ? AQ.ice.top : rand(50, 130), target: null, onIce: ice,
      });
    });
  }

  function thinkSwimmer(s, t, dt) {
    const hungry = data.aqua_hungry ? 0.4 : 1;
    if (pellets.length && s.kind === 'fish') {
      const p = pellets.reduce((a, b) => (dist(a, s) < dist(b, s) ? a : b));
      s.target = { x: p.x, y: p.y };
      s.speed = 24;
      if (dist(p, s) < 3) { pellets = pellets.filter((q) => q !== p); s.emote = 'heart'; s.emoteUntil = t + 1.5; }
    } else if (!s.target || t > s.until) {
      if (s.kind === 'ice') return thinkIce(s, t);
      const [[x0, x1, y0, y1], speed] = REGION[s.type] ?? [[10, 246, AQ.surface + 10, AQ.sand - 8], 12];
      s.target = { x: rand(x0, x1), y: rand(y0, y1) };
      s.speed = speed;
      s.until = t + rand(4, 9);
    }
    const dx = s.target.x - s.x;
    const dy = s.target.y - s.y;
    const d = Math.hypot(dx, dy);
    const step = s.speed * hungry * dt;
    if (Math.abs(dx) > 1) s.dir = Math.sign(dx);
    if (d > step) { s.x += (dx / d) * step; s.y += (dy / d) * step; } else if (s.kind !== 'ice') s.until = Math.min(s.until, t + rand(0.5, 2));
    if (s.kind === 'ice' && d <= step) arriveIce(s, t);
  }

  // Penguins and seals: on the ice they waddle, flap, bark and clap; now and then they dive in for a
  // swim and later climb back out at the edge of the ice.
  function thinkIce(s, t) {
    const ice = AQ.ice;
    s.until = t + rand(3, 7);
    s.emote = null;
    if (!s.onIce) {
      Object.assign(s, { target: { x: ice.x0 - 3, y: ice.base + 4 }, speed: 18, climb: true, until: t + 30 });
      return;
    }
    const r = Math.random();
    const stay = { x: s.x, y: s.y };
    if (r < 0.3) Object.assign(s, { target: { x: rand(ice.x0 + 6, 248), y: ice.top }, speed: s.type === 'penguin' ? 8 : 4, pose: s.type === 'penguin' ? 'walk' : 'flop' });
    else if (r < 0.5) Object.assign(s, { target: stay, pose: { penguin: 'flap', seal: 'stand', sea_dog: 'bark' }[s.type], emote: s.type === 'sea_dog' ? 'note' : null, emoteUntil: t + 2 });
    else if (r < 0.62 && s.type === 'sea_dog') Object.assign(s, { target: stay, pose: 'clap', emote: 'star', emoteUntil: t + 2 });
    else if (r < 0.82) Object.assign(s, { target: { x: ice.x0 + 2, y: ice.top }, speed: 10, pose: s.type === 'penguin' ? 'slide' : 'flop', dive: true, until: t + 30 });
    else Object.assign(s, { target: stay, pose: 'stand' });
  }

  function arriveIce(s, t) {
    if (s.dive) {         // splash in
      Object.assign(s, { dive: false, onIce: false, pose: 'swim', target: { x: rand(30, 200), y: rand(60, 130) }, speed: s.type === 'penguin' ? 26 : 16, until: t + rand(6, 10) });
    } else if (s.climb) { // hop out
      Object.assign(s, { climb: false, onIce: true, pose: 'stand', x: AQ.ice.x0 + 4, y: AQ.ice.top, target: null, until: t + 1 });
    } else if (!s.onIce) s.until = Math.min(s.until, t + rand(1, 3));
  }

  function drawAquariumView(t) {
    const dt = drawAquariumView.dt ?? 0;
    pellets.forEach((p) => { p.y = Math.min(AQ.sand - 2, p.y + 6 * dt); });
    swimmers.forEach((s) => thinkSwimmer(s, t, dt));
    drawAquarium(g, t, st().iceland);
    pellets.forEach((p) => rect(g, p.x, p.y, 1, 1, '#c87a2a'));
    [...swimmers.values()].sort((a, b) => (a.type === 'whale' ? -1 : b.type === 'whale' ? 1 : 0)).forEach((s) => {
      const pose = s.onIce ? s.pose : 'swim';
      drawSea(g, s.type, s.x, s.y, s.dir, t + (s.id.charCodeAt(0) % 7), pose);
      if (s.emote && t < (s.emoteUntil ?? 0)) icon(g, s.emote, s.x - 2, s.y - 14);
      else if (data.aqua_hungry && (t + s.x) % 5 < 1) icon(g, 'food', s.x - 2, s.y - 14);
    });
  }

  // ------------------------------------------------------------- garage: a showroom with a turntable

  const show = { pick: null, angle: 0.6, auto: true, drag: null };
  const BAYS = Array.from({ length: 5 }, (_, i) => ({ x: 24 + i * 52, y: 164 }));
  const cars = () => st().cars;
  const shown = () => cars().find((c) => c.id === show.pick) ?? cars()[0];

  function drawGarageView(t, dt) {
    if (show.auto && !show.drag) show.angle += dt * 0.5;
    rect(g, 0, 0, GW, 176, '#0c0618');
    for (let x = 0; x < GW; x += 32) { rect(g, x + 14, 0, 4, 96, '#120a24'); rect(g, x + 15, 0, 2, 96, `rgba(0,229,255,${0.25 + Math.sin(t * 2 + x) * 0.1})`); }
    rect(g, 98, 10, 60, 12, '#140a26'); rect(g, 98, 10, 60, 1, '#ff4fd8'); rect(g, 98, 21, 60, 1, '#ff4fd8');
    for (let i = 0; i < 8; i++) rect(g, 104 + i * 6, 14, 4, 4, (Math.floor(t * 4) + i) % 8 < 6 ? '#ff4fd8' : '#5a1a4a');  // the neon sign
    for (let y = 96; y < 176; y += 8) for (let x = 0; x < GW; x += 16) rect(g, x, y, 16, 8, ((x / 16 + y / 8) % 2) ? '#141024' : '#181430');
    rect(g, 0, 96, GW, 1, '#3a2a5a');
    [64, 192].forEach((sx) => { for (let j = 0; j < 90; j += 2) rect(g, sx - j / 3, 6 + j, (j / 3) * 2 + 2, 2, 'rgba(255,240,210,0.035)'); });  // spotlights
    ellipse(g, 128, 126, 76, 23, '#05020a'); ellipse(g, 128, 124, 74, 22, '#2a2a3a'); ellipse(g, 128, 123, 70, 19, '#363648');  // the turntable
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2 + show.angle;
      rect(g, 128 + Math.cos(a) * 72, 124 + Math.sin(a) * 21, 2, 1, k % 2 ? '#00e5ff' : '#ff4fd8');
    }
    glow(g, 128, 124, 40, '0,229,255', 0.08);
    const car = shown();
    if (car) {
      ellipse(g, 128, 126, 40, 10, 'rgba(0,0,0,0.35)');
      drawCar(g, car.type, 128, 122, show.angle, 2.5);
    } else {
      rect(g, 104, 120, 48, 1, '#5a4a7a');
    }
    BAYS.forEach((b, i) => {  // the five parking bays
      const c = cars()[i];
      rect(g, b.x - 24, b.y - 16, 48, 28, '#0a0614'); rect(g, b.x - 24, b.y - 16, 48, 1, c && c.id === car?.id ? '#00e5ff' : '#3a2a5a');
      rect(g, b.x - 24, b.y - 16, 1, 28, '#3a2a5a'); rect(g, b.x + 23, b.y - 16, 1, 28, '#3a2a5a');
      if (c) drawCar(g, c.type, b.x, b.y + 4, 0.35, 1); else rect(g, b.x - 2, b.y - 2, 4, 1, '#3a2a5a');
    });
  }

  function garageClick(m) {
    const i = BAYS.findIndex((b) => Math.abs(m.x - b.x) < 24 && m.y > b.y - 16 && m.y < b.y + 12);
    if (i >= 0 && cars()[i]) { show.pick = cars()[i].id; renderSide(); }
  }
  canvas.addEventListener('mousedown', (e) => { if (view === 'garage') show.drag = { x: e.clientX, angle: show.angle }; });
  window.addEventListener('mousemove', (e) => { if (show.drag) show.angle = show.drag.angle + (e.clientX - show.drag.x) / 60; });
  window.addEventListener('mouseup', () => { show.drag = null; });

  function renderGarageSide(s) {
    side.append(el(`<div class="box-title">GARAGE · ${s.cars.length}/5 CARS</div>`));
    const car = shown();
    if (car) {
      const c = cat(car.type);
      side.append(el(`<p><b>${c.name}</b><br><span class="muted">${c.tier} · bought for 🪙 ${c.price.toLocaleString()}</span></p>`));
      const row = document.createElement('div');
      row.className = 'group wrap';
      row.append(
        button('⟲', () => { show.auto = false; show.angle -= 0.4; }),
        button('⟳', () => { show.auto = false; show.angle += 0.4; }),
        button(show.auto ? 'Stop turning' : 'Turn by itself', () => { show.auto = !show.auto; renderSide(); }, show.auto ? 'active' : ''),
      );
      side.append(row);
      side.append(el('<p class="muted">Drag the car to turn the showcase. Click a bay below to put another car on it.</p>'));
    } else side.append(el('<p class="muted">The showroom is empty: buy a car in the store (up to 5).</p>'));
    const ul = document.createElement('ul');
    ul.className = 'list';
    s.cars.forEach((c) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${cat(c.type).name}${c.id === car?.id ? ' ★' : ''}</span>`;
      li.append(button('Show', () => { show.pick = c.id; renderSide(); }));
      li.append(button(`Sell 🪙 ${Math.floor(cat(c.type).price / 2).toLocaleString()}`, () => { if (window.confirm(`Sell the ${cat(c.type).name} for half its price?`)) act('sell_car', { id: c.id }); }));
      ul.append(li);
    });
    side.append(ul);
    side.append(button('Buy cars', () => ctx.openStore('Cars'), 'primary'));
  }

  // A house with the garage built in: clicking it asks where to go.
  function chooseDoor(e) {
    document.querySelector('.door-choice')?.remove();
    const menu = document.createElement('div');
    menu.className = 'door-choice';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
    menu.append(button('🏠 House', () => { menu.remove(); setView('house'); }), button('🚗 Garage', () => { menu.remove(); setView('garage'); }));
    document.body.append(menu);
    setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);
  }

  // ------------------------------------------------------------- loop and input

  let last = now();
  function frame() {
    if (!running) return;
    const t = t0();
    const dt = Math.min(0.1, now() - last);
    last = now();
    if (data) {
      g.save();
      if (t < shake) g.translate(Math.round(Math.sin(t * 60) * 2), 0);
      if (view === 'garage') {
        drawGarageView(t, dt);
      } else if (view === 'garden') {
        pets.forEach((p) => thinkPet(p, t, dt));
        thinkBirds(t, dt);
        drawGarden(t);
      } else if (view === 'house') {
        inside.forEach((p) => thinkInside(p, t, dt));
        drawHouseView(t);
      } else {
        drawAquariumView.dt = dt;
        drawAquariumView(t);
      }
      g.restore();
      if (Math.floor(t) !== frame.sec) { frame.sec = Math.floor(t); if (frame.sec % 3 === 0) renderStatusLine(); }
    }
    requestAnimationFrame(frame);
  }

  function fit() {
    if (!data) return;
    const [w, h] = view === 'garden' ? [GW, GH] : view === 'house' ? roomSize(...grid()) : view === 'garage' ? [GW, 176] : [AQ.w, AQ.h];
    fitCanvas(canvas, w, h);
  }
  new ResizeObserver(fit).observe(canvas.parentElement);

  function petAt(m) {
    return outside().reverse().find((p) => {
      const [w, h] = PET_SIZE[p.type];
      return Math.abs(m.x - p.x) <= w / 2 && m.y <= p.y + 2 && m.y >= p.y - h;
    });
  }
  function petInsideAt(m) {
    return [...inside.values()].reverse().find((p) => {
      if (p.status === 'dead' || p.place !== 'house') return false;
      const { px, py } = petPixel(p);
      const [w, h] = PET_SIZE[p.type];
      return Math.abs(m.x - px) <= w / 2 && m.y <= py + 2 && m.y >= py - h;
    });
  }
  const tileAt = (m) => ({ x: Math.floor((m.x - ROOM.side) / TILE), y: m.y < ROOM.wall ? -1 : Math.floor((m.y - ROOM.wall) / TILE) });
  const furnitureAt = (tile) => [...layout()].reverse().find((f) => {
    if (onWall(f.item)) return tile.y === -1 && tile.x >= f.x && tile.x < f.x + cat(f.item).size[0];
    const [w, h] = size(f.item, f.rot);
    return tile.x >= f.x && tile.x < f.x + w && tile.y >= f.y && tile.y < f.y + h;
  });

  canvas.onmousemove = (e) => {
    if (!data) return;
    const m = mouse(canvas, e);
    if (view === 'garden') {
      hoverPet = petAt(m) ?? null;
      canvas.style.cursor = hoverPet || hitGarden(m) ? 'pointer' : 'default';
    } else if (view === 'house') {
      hoverTile = tileAt(m);
      hoverExit = !holding && atExit(m);
      const p = editing || hoverExit ? null : petInsideAt(m);
      inside.forEach((q) => { q.petted = q === p; });
      canvas.style.cursor = p ? 'grab' : 'pointer';
      const screen = !editing && !p && SCREENS.has(furnitureAt(hoverTile)?.item);
      canvas.title = hoverExit ? 'Go out to the garden' : screen ? 'Back to trading' : '';
    }
  };
  canvas.onmouseleave = () => { hoverPet = null; hoverExit = false; inside.forEach((q) => { q.petted = false; }); hoverTile = null; };

  function hitGarden(m) {
    const w = HOUSE_W[st().house];
    if (st().garage && !data.garage_merged && Math.abs(m.x - GARAGE.x) < 24 && m.y > GARAGE.y - 34 && m.y < GARAGE.y + 2) return { kind: 'garage' };
    if (Math.abs(m.x - DOOR.x) < 9 && m.y > DOOR.y - 22 && m.y < DOOR.y + 2) return { kind: 'door' };
    if (Math.abs(m.x - DOOR.x) < w / 2 && m.y > 20 && m.y < DOOR.y) return { kind: 'door' };
    if (clean('plaza')) {
      const fl = FLOWERS.findIndex((s) => Math.abs(m.x - s.x) <= 9 && m.y >= s.y - 15 && m.y <= s.y + 2);
      if (fl >= 0) return { kind: 'flower', i: fl };
    }
    const spot = SPOTS.findIndex((s, i) => clean(i < 2 ? 'west' : 'east') && Math.abs(m.x - s.x) < 12 && m.y > s.y - 44 && m.y < s.y + 3);
    if (spot >= 0) return { kind: 'tree', i: spot };
    const zone = Object.keys(ZONES).find((z) => inRects(m, ZONES[z]));
    return zone ? { kind: 'zone', id: zone } : null;
  }

  canvas.onclick = async (e) => {
    if (!data) return;
    const m = mouse(canvas, e);
    if (view === 'garden') {
      const pet = petAt(m);
      const hit = pet ? { kind: 'pet', id: pet.id } : hitGarden(m);
      if (hit?.kind === 'garage') return setView('garage');
      if (hit?.kind === 'door' && data.garage_merged) return chooseDoor(e);
      if (hit?.kind === 'door') return setView('house');
      selected = hit;
      return renderSide();
    }
    if (view === 'aquarium') return;
    if (view === 'garage') return garageClick(m);
    if (!holding && atExit(m)) return setView('garden');
    const tile = tileAt(m);
    if (editing) {
      if (holding) {
        if (onWall(holding.item)) { tile.y = -1; holding.rot = 0; }
        if (!fits(holding.item, tile.x, tile.y, holding.rot, holding.id)) return ctx.toast(onWall(holding.item) ? 'Hang it on the back wall, next to the other pieces.' : "It doesn't fit there.");
        const ok = holding.id
          ? await act('move', { id: holding.id, x: tile.x, y: tile.y, rot: holding.rot })
          : await act('place', { item: holding.item, x: tile.x, y: tile.y, rot: holding.rot });
        if (ok) { if (holding.id || !(st().inventory[holding.item] > 0)) holding = null; renderSide(); }
        return;
      }
      selected = furnitureAt(tile)?.id ?? null;
      return renderSide();
    }
    const t = t0();
    const p = petInsideAt(m);
    if (p) {
      if (cat(p.type).premium) return ctx.openPet(p.id);  // pricey pets open their portrait window
      const trick = { dog: ['bark', 'heart'], cat: ['groom', 'heart'], parrot: ['sing', 'note'], turtle: ['hide', 'bang'], lizard: ['pushup', 'star'], lion: ['roar', 'bang'], critter: ['sit', 'heart'], snake: ['bask', 'star'], frog: ['idle', 'note'] }[G(p)];
      Object.assign(p, { pose: trick[0], emote: trick[1], label: 'shows off a trick', until: t + 1.6, path: [], act: null, on: null });
      if (G(p) === 'lion') shake = t + 0.5;
      return;
    }
    if (SCREENS.has(furnitureAt(tile)?.item)) return ctx.backToTrading();  // the laptop takes you back to the charts
    const indoor = [...inside.values()].filter((q) => q.place === 'house' && q.status !== 'dead');
    const buddy = indoor.find((q) => q.id === data.companion) ?? indoor[0];
    if (!buddy) return;
    const steps = path({ x: Math.round(buddy.x), y: Math.round(buddy.y) }, [tile]);
    if (steps.length) Object.assign(buddy, { path: steps, act: null, on: null, called: true, label: 'is coming over' });
  };

  document.addEventListener('keydown', (e) => {
    if ($('home').hidden || view !== 'house' || !editing) return;
    if (e.key.toLowerCase() === 'r' && holding && !onWall(holding.item)) holding.rot = (holding.rot + 1) % 4;
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
  const petName = (type) => cat(type).name;

  function renderStatusLine() {
    const s = $('home-status');
    if (!s || view !== 'house') return;
    s.innerHTML = [...inside.values()].filter((p) => p.status !== 'dead' && p.place === 'house').map((p) => `The ${petName(p.type).toLowerCase()} ${p.label}.`).join('<br>')
      || 'No pets inside: move some in from the garden (up to 3).';
  }

  function renderSide() {
    if (!data) return;
    side.replaceChildren();
    const s = st();
    side.append(el(`<div class="box-title">WALLET</div><div class="kv"><span>Coins</span><b class="num">🪙 ${Math.floor(data.coins).toLocaleString()}</b></div>`));
    if (data.locked) side.append(el('<p class="down">The whole home is mortgaged: pay it back in the Store (Mortgage) to change things.</p>'));
    if (view === 'garden') renderGardenSide(s);
    else if (view === 'house') renderHouseSide(s);
    else if (view === 'garage') renderGarageSide(s);
    else renderAquariumSide(s);
    side.append(el('<div class="box-title">RECENT</div>'));
    const log = document.createElement('ul');
    log.className = 'list';
    log.innerHTML = s.log.slice(-5).reverse().map((l) => `<li><span>${l.text}</span><b class="${l.amount >= 0 ? 'up' : 'down'}">${l.amount ? `${l.amount > 0 ? '+' : ''}${l.amount}` : ''}</b></li>`).join('')
      || '<li class="muted">Nothing yet. Profit from trading becomes coins.</li>';
    side.append(log);
  }

  function renderZone(zone) {
    const z = st().zones[zone];
    const c = cat(zone);
    if (!z) {
      side.append(el(`<p><b>${c.name}</b> is wasteland: trash bags, tires, oil drums, boxes, broken TVs and scrap. Clean it up to use it.</p>`));
      side.append(button(`Clean it up (${c.price} coins)`, () => act('clean', { zone }), 'primary'));
      return;
    }
    side.append(el(`<p><b>${c.name}</b> — ${z.floor ? cat(z.floor).name.toLowerCase() : 'clean, bare neon ground'}. Lay a new floor:</p>`));
    const grid2 = document.createElement('div');
    grid2.className = 'group wrap';
    Object.entries(data.catalog).filter(([, i]) => i.kind === 'floor').forEach(([id, i]) => {
      grid2.append(button(`${i.name} ${i.price}`, () => act('floor', { zone, item: id }), z.floor === id ? 'active' : ''));
    });
    side.append(grid2);
  }

  function renderGardenSide(s) {
    side.append(el('<div class="box-title">GARDEN</div>'));
    if (!selected) {
      const dirty = Object.keys(ZONES).filter((z) => !s.zones[z]).length;
      side.append(el(`<p class="muted">${dirty ? `${dirty} of 6 parts are still wasteland (the front path is clean from the start): click one to clean it up, or buy a garden theme (Store) that cleans everything. ` : ''}Click a flower spot by the road, a tree spot, a pet or any part of the garden. Hover a pet to pet it. Click the house to go inside.</p>`));
      renderThemes(s);
    }
    if (selected?.kind === 'zone') renderZone(selected.id);
    if (selected?.kind === 'flower' || selected?.kind === 'tree') {
      const where = selected.kind === 'flower' ? 'flowers' : 'trees';
      const plant = s[where][selected.i];
      if (!plant) {
        const kind = selected.kind;
        const seeds = Object.entries(s.inventory).filter(([k, n]) => n > 0 && cat(k).kind === kind);
        side.append(el(`<p>${where === 'flowers' ? `Flower spot ${selected.i + 1}` : `Tree spot ${selected.i + 1}`} is empty.</p>`));
        seeds.forEach(([k, n]) => side.append(button(`Plant ${cat(k).name} (${n})`, () => act('plant', { where, slot: selected.i, item: k }))));
        if (!seeds.length) side.append(button(`Buy ${kind === 'flower' ? 'seeds' : 'saplings'} in the store`, () => ctx.openStore(kind === 'flower' ? 'Flowers' : 'Trees')));
      } else {
        const c = cat(plant.type);
        const left = grownAt(plant) - t0();
        if (left > 0) side.append(el(`<p><b>${c.name}</b> is growing: ${where === 'flowers' ? 'blooms' : 'grows up'} ${until(left)}.</p>`));
        else if (where === 'flowers') {
          side.append(el(`<p><b>${c.name}</b> is in full bloom.</p>`));
          side.append(button(`Pick and sell (+${c.sells} coins)`, () => act('harvest', { where, slot: selected.i }), 'primary'));
        } else {
          const next = Math.max(plant.harvested ?? 0, grownAt(plant)) + c.every * 3600 - t0();
          const hive = !NATURAL.has(plant.type) ? '' : ` Bees are ${t0() - grownAt(plant) < 86400 ? 'building a hive in it' : 'living in their hive'}.`;
          side.append(el(`<p><b>${c.name}</b> is grown. Harvest of ${c.yield} coins every ${c.every} h; next ${until(next)}.${hive}</p>`));
          if (next <= 0) side.append(button(`Harvest (+${c.yield} coins)`, () => act('harvest', { where, slot: selected.i }), 'primary'));
        }
        side.append(button('Dig up', () => act('dig', { where, slot: selected.i })));
      }
    }
    if (selected?.kind === 'pet') {
      const pet = s.pets.find((p) => p.id === selected.id);
      if (pet) {
        const c = cat(pet.type);
        const mood = { ok: 'happy and fed', hungry: 'HUNGRY', dead: 'has died' }[pet.status];
        side.append(el(`<p><b>${c.name}</b> — ${mood}. Last meal ${ago(t0() - pet.fed)} ago.<br><span class="muted">Hungry after 2 days, dies after 7 days without food.</span></p>`));
        if (pet.status === 'dead') side.append(button('Bury', () => act('bury', { id: pet.id })));
        else {
          side.append(button(`Feed (${c.meal} coins)`, () => act('feed', { id: pet.id }), 'primary'));
          side.append(button(data.companion === pet.id ? 'Your companion next to the chart ✓' : 'Make it my companion next to the chart', () => act('companion', { id: pet.id }), data.companion === pet.id ? 'active' : ''));
        }
      }
    }
    renderPetList(s);
  }

  function renderThemes(s) {
    side.append(el('<div class="box-title">GARDEN THEME</div>'));
    const row = document.createElement('div');
    row.className = 'group wrap';
    row.append(button('None', () => act('theme', { item: null }), s.theme ? '' : 'active'));
    s.themes.forEach((id) => row.append(button(cat(id).name.replace(' garden', ''), () => act('theme', { item: id }), s.theme === id ? 'active' : '')));
    row.append(button('More in the store', () => ctx.openStore('Garden themes')));
    side.append(row);
  }

  function renderPetList(s) {
    if (!s.pets.length) return;
    const room = data.pet_room;
    side.append(el(`<div class="box-title">PETS · garden ${5 - room.garden}/5 · house ${3 - room.house}/3</div>`));
    const ul = document.createElement('ul');
    ul.className = 'list pet-list';
    s.pets.forEach((p) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${p.place === 'house' ? '🏠' : '🌳'} ${petName(p.type)}${p.id === data.companion ? ' ★' : ''} <i class="${p.status === 'ok' ? 'up' : 'down'}">${p.status === 'ok' ? 'fed' : p.status}</i></span>`;
      if (p.status !== 'dead') {
        li.append(button(`Feed ${cat(p.type).meal}`, () => act('feed', { id: p.id })));
        li.append(button(p.place === 'house' ? 'To garden' : 'To house', () => act('move_pet', { id: p.id })));
        if (cat(p.type).premium) li.append(button('Portrait', () => ctx.openPet(p.id)));
        li.append(button('Release', () => { if (window.confirm(`Release the ${petName(p.type).toLowerCase()}? Pets can't be sold: it leaves for free.`)) act('release', { id: p.id }); }));
      } else li.append(button('Bury', () => act('bury', { id: p.id })));
      ul.append(li);
    });
    side.append(ul);
  }

  function renderHouseSide(s) {
    side.append(el(`<div class="box-title">HOUSE — ${cat(s.house).name.toUpperCase()}</div>`));
    if (s.houses.length > 1) {
      const row = document.createElement('div');
      row.className = 'group wrap';
      s.houses.forEach((h) => row.append(button(cat(h).name, () => act('house', { item: h }).then(() => { fit(); placePets(); }), h === s.house ? 'active' : '')));
      side.append(row);
    }
    side.append(el('<p id="home-status" class="muted"></p>'));
    renderPetList(s);
    side.append(button(editing ? 'Done arranging' : 'Arrange furniture', () => { editing = !editing; holding = null; selected = null; renderSide(); }, editing ? 'active' : 'primary'));
    if (!editing) {
      side.append(el('<p class="muted">Your pets live here and use the furniture. Hover a pet to pet it, click it for a trick, click the floor to call your companion. Click the front door (bottom) to go back out, or the laptop to go back to trading.</p>'));
      renderStatusLine();
      return;
    }
    side.append(el(`<p class="muted">${holding ? (onWall(holding.item) ? `Hanging ${cat(holding.item).name}: click a spot on the back wall, Esc cancels.` : `Placing ${cat(holding.item).name}: click a spot, R rotates, Esc cancels. Furniture can't cross walls.`) : 'Pick an item below, or click furniture in the room (or a painting / window on the wall).'}</p>`));
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

  function renderAquariumSide(s) {
    side.append(el(`<div class="box-title">AQUARIUM${s.iceland ? ' + ICE LAND' : ''}</div>`));
    const counts = {};
    s.aquatic.forEach((a) => { counts[a.type] = (counts[a.type] ?? 0) + 1; });
    side.append(el(`<p>${data.aqua_hungry ? '<b class="down">Everyone is hungry.</b>' : 'Everyone is fed.'} Water animals get hungry after 2 days but never die.</p>`));
    side.append(button(`Feed everyone (${data.aqua_meal} coins)`, async () => {
      if (await act('feed_aquatic')) pellets = Array.from({ length: 24 }, () => ({ x: rand(20, 236), y: AQ.surface + 2 }));
    }, 'primary'));
    const ul = document.createElement('ul');
    ul.className = 'list';
    ul.innerHTML = Object.entries(counts).map(([k, n]) => `<li><span>${cat(k).name}</span><b>×${n}</b></li>`).join('') || '<li class="muted">Empty: buy sea life in the store.</li>';
    side.append(ul);
    side.append(button('Buy sea life', () => ctx.openStore('Sea life')));
  }

  function setView(v) {
    view = v;
    selected = null;
    editing = false;
    holding = null;
    document.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
    if (v === 'house') placePets();
    fit();
    renderSide();
  }
  document.querySelectorAll('[data-view]').forEach((b) => { b.onclick = () => setView(b.dataset.view); });

  return {
    async open(v = 'garden') {
      $('home').hidden = false;
      await refresh();
      if (!data) return;
      setView((v === 'aquarium' && !st().aquarium) || (v === 'garage' && !st().garage) ? 'garden' : v);
      if (!running) { running = true; last = now(); requestAnimationFrame(frame); }
    },
    close() { running = false; $('home').hidden = true; },
    refresh,
    act,
  };
}
