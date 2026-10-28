// Garden art, drawn in code with whole-pixel rectangles: pets, flower piles, trees with beehives,
// birds and bees, the pool, and the garden ground (wasteland, cleared soil, floors and rubble).
// Everything takes the time `t` so it can idle-animate.
import { disc, ellipse, glow, hash, icon, outlined, rect, sprite } from './pixel.js';

const K = '#1d1d1d';

// Draw relative to (x, y) and facing `d` (1 right, -1 left).
function mirror(g, x, y, d) {
  return {
    R: (dx, dy, w, h, c) => rect(g, d > 0 ? x + dx : x - dx - w + 1, y + dy, w, h, c),
    E: (dx, dy, rx, ry, c) => ellipse(g, x + dx * d, y + dy, rx, ry, c),
  };
}

// ---------------------------------------------------------------- pets (x, y = ground under the body)

function dog(g, x, y, s, t) {
  const { R, E } = mirror(g, x, y, s.dir);
  const b = '#c98a3e'; const d = '#8a5a24'; const w = '#f3e3c3';
  const step = s.moving ? Math.floor(t * 12) % 2 : 0;
  const wag = Math.round(Math.sin(t * (s.pose === 'sit' ? 18 : 9)) * 1.5);
  if (s.pose === 'sleep') {
    E(0, -3, 6, 3, b); E(-1, -2, 4, 1, w); E(5, -3, 3, 2, b); R(3, -6, 2, 3, d); R(6, -3, 2, 1, K); R(-7, -2, 3, 1, d);
    return;
  }
  if (s.pose === 'sit') {
    R(-6 + wag, -1, 3, 1, d);
    E(-1, -5, 3, 4, b); E(-1, -4, 2, 2, w); R(1, -3, 1, 3, b); R(3, -3, 1, 3, b);
    E(2, -10, 3, 2, b); R(4, -10, 2, 2, w); R(6, -10, 1, 1, K); R(3, -11, 1, 1, K); R(0, -12, 2, 4, d);
    R(5, -8, 1, 1, '#ff7f9f');
    return;
  }
  const low = s.pose === 'dig' || s.pose === 'sniff' || s.pose === 'drink';
  R(-4, -3, 1, 3 - step, b); R(-2, -3, 1, 2 + step, b); R(2, -3, 1, 2 + step, b); R(4, -3, 1, 3 - step, b);
  R(-6, -6, 1, 2, d); R(-7, -8 - Math.max(0, wag), 1, 2, d);
  E(0, -5, 5, 2, b); E(0, -4, 3, 1, w);
  const hy = low ? -5 : -8;
  E(5, hy - 1, 3, 2, b); R(7, hy - 1, 2, 2, w); R(9, hy - 1, 1, 1, K); R(5, hy - 2, 1, 1, K); R(3, hy - 3, 2, 3 + step, d);
  if (s.pose === 'bark') R(8, hy + 1, 2, 1, '#a02030');
  if (s.pose === 'dig') R(9 + (Math.floor(t * 10) % 3), -2 - (Math.floor(t * 10) % 2), 1, 1, '#6b4220');
}

function cat(g, x, y, s, t) {
  const { R, E } = mirror(g, x, y, s.dir);
  const o = '#f0a040'; const O = '#c06a20'; const w = '#fff3e0'; const eye = '#4fc04f';
  const step = s.moving ? Math.floor(t * 10) % 2 : 0;
  const tail = Math.round(Math.sin(t * 2.2) * 1.5);
  if (s.pose === 'sleep') {
    E(0, -3, 5, 2, o); R(-3, -4, 1, 1, O); R(0, -5, 1, 1, O); E(4, -3, 2, 2, o);
    R(3, -6, 1, 1, o); R(5, -6, 1, 1, o); R(3, -3, 2, 1, K); R(-5, -1, 8, 1, O);
    return;
  }
  if (s.pose === 'sit' || s.pose === 'groom') {
    R(-4 + tail, -1, 4, 1, O);
    E(0, -5, 3, 3, o); E(0, -4, 2, 2, w); R(-1, -6, 1, 1, O); R(1, -7, 1, 1, O);
    E(1, -10, 3, 2, o); R(-1, -13, 1, 2, o); R(3, -13, 1, 2, o);
    if (s.pose === 'groom') { R(3, -10 + (Math.floor(t * 6) % 2), 1, 3, o); R(2, -11, 1, 1, K); } else R(2, -11, 1, 1, eye);
    R(4, -10, 1, 1, '#ff9ab0');
    return;
  }
  const crouch = s.pose === 'stalk' ? 1 : 0;
  R(-3, -2, 1, 2 - step, o); R(-1, -2, 1, 1 + step, o); R(2, -2, 1, 1 + step, o); R(4, -2, 1, 2 - step, o);
  E(0, -4 + crouch, 4, 2, o); R(-2, -6 + crouch, 1, 1, O); R(0, -6 + crouch, 1, 1, O); R(2, -6 + crouch, 1, 1, O);
  R(-5, -6, 1, 3, o); R(-5 + (tail > 0 ? -1 : 0), -9 + crouch * 2, 1, 3, O);
  E(5, -7 + crouch * 2, 2, 2, o); R(4, -10 + crouch * 2, 1, 1, o); R(6, -10 + crouch * 2, 1, 1, o);
  R(6, -8 + crouch * 2, 1, 1, eye);
}

function parrot(g, x, y, s, t) {
  const { R, E } = mirror(g, x, y, s.dir);
  const r = '#e8322b'; const bl = '#2f6fe0'; const ye = '#f4d35e';
  if (s.pose === 'fly') {
    const flap = Math.floor(t * 12) % 2;
    R(-7, -4, 3, 1, bl); E(0, -4, 4, 2, r); E(4, -5, 2, 2, r); R(6, -5, 1, 2, ye); R(4, -6, 1, 1, K);
    if (flap) { R(-2, -9, 4, 4, bl); R(-2, -9, 4, 1, ye); } else { R(-2, -3, 4, 3, bl); R(-2, -1, 4, 1, ye); }
    return;
  }
  const bob = s.pose === 'sing' ? Math.round(Math.sin(t * 10)) : s.pose === 'preen' ? 1 : 0;
  R(-1, -3, 2, 4, bl); E(0, -6, 2, 4, r); R(-2, -8, 2, 5, bl); R(-2, -4, 2, 1, ye);
  E(1, -11 + bob, 2, 2, r); R(3, -11 + bob, 1, 2, ye); R(1, -12 + bob, 1, 1, K); R(2, -12 + bob, 1, 1, '#fff');
  if (s.pose === 'sing') R(3, -9 + bob, 1, 1, '#400');
  R(-1, 0, 1, 1, '#555'); R(1, 0, 1, 1, '#555');
}

function turtle(g, x, y, s, t) {
  const { R, E } = mirror(g, x, y, s.dir);
  const sk = '#8fbf5f';
  const step = s.moving ? Math.floor(t * 4) % 2 : 0;
  if (s.pose === 'swim') {
    E(0, -2, 5, 2, '#3f8f3f'); R(-2, -3, 1, 1, '#2a6a2a'); R(1, -3, 1, 1, '#2a6a2a');
    R(5, -2, 2, 1, sk); R(-7 - step, -1, 2, 1, '#bfe8ff'); R(7 + step, 0, 2, 1, '#bfe8ff');
    return;
  }
  const hide = s.pose === 'hide';
  if (!hide) {
    R(-4 + step, -1, 2, 1, sk); R(3 - step, -1, 2, 1, sk);
    const eat = s.pose === 'eat' ? Math.floor(t * 5) % 2 : 0;
    R(5, -3 + eat, 3, 2, sk); R(7, -3 + eat, 1, 1, K);
  }
  E(0, -3 + (hide ? 1 : 0), 5, 3, '#3f8f3f');
  R(-2, -4, 1, 1, '#2a6a2a'); R(1, -5, 1, 1, '#2a6a2a'); R(2, -3, 1, 1, '#2a6a2a'); R(-1, -2, 1, 1, '#5fb05f');
  R(-5, -1 + (hide ? 1 : 0), 11, 1, '#6b4a2a');
}

function lizard(g, x, y, s, t) {
  const { R } = mirror(g, x, y, s.dir);
  const c = '#5cc85c'; const C = '#2f8a3f';
  const step = s.moving ? Math.floor(t * 14) % 2 : 0;
  const up = s.pose === 'pushup' && Math.floor(t * 3) % 2 ? -1 : 0;
  const tw = Math.round(Math.sin(t * (s.moving ? 12 : 3)));
  R(-9, -2 + tw, 5, 1, C); R(-4, -2, 8, 2, c); R(-2, -2, 1, 1, C); R(1, -2, 1, 1, C);
  R(4, -3 + up, 3, 2, c); R(5, -3 + up, 1, 1, K);
  if (s.pose === 'bask' && t % 2.5 < 0.2) R(7, -2, 2, 1, '#ff4f6f');
  R(-3, step ? -3 : 0, 1, 1, c); R(2, step ? 0 : -3 + up, 1, 1, c);
  R(-3, step ? 0 : -3, 1, 1, c); R(2, step ? -3 + up : 0, 1, 1, c);
}

function lion(g, x, y, s, t) {
  const { R, E } = mirror(g, x, y, s.dir);
  const b = '#d9a650'; const m = '#9a5a1e'; const M = '#7a3e10'; const w = '#f3e0b0';
  const sway = Math.round(Math.sin(t * 1.5));
  if (s.pose === 'lie' || s.pose === 'sleep') {
    R(-11, -2 + sway, 4, 1, b); R(-12, -3 + sway, 2, 2, M);
    E(0, -3, 8, 2, b); R(6, -1, 5, 1, b);
    E(7, -5, 5, 4, m); E(8, -4, 3, 3, b); R(9, -3, 2, 1, w);
    if (s.pose === 'sleep') R(9, -5, 2, 1, K); else R(9, -5, 1, 1, K);
    return;
  }
  const step = s.moving ? Math.floor(t * 6) % 2 : 0;
  const roar = s.pose === 'roar';
  R(-5, -4, 2, 4 - step, b); R(-2, -4, 2, 3 + step, b); R(3, -4, 2, 3 + step, b); R(6, -4, 2, 4 - step, b);
  R(-8, -9, 1, 3, b); R(-9, -11 + sway, 1, 2, b); R(-10, -12 + sway, 2, 2, M);
  E(0, -7, 7, 3, b); E(0, -6, 5, 1, w);
  E(6, -10 - (roar ? 1 : 0), roar ? 6 : 5, roar ? 6 : 5, m); E(5, -9, 3, 3, M);
  E(7, -10 - (roar ? 1 : 0), 3, 3, b); R(8, -9, 3, 2, w); R(10, -10, 1, 1, K); R(8, -11, 1, 1, K);
  if (roar) { R(9, -8, 2, 2, '#4a0a0a'); R(9, -8, 1, 1, '#fff'); }
}

const PETS = { dog, cat, parrot, turtle, lizard, lion };
export const PET_SIZE = { dog: [20, 13], cat: [16, 13], parrot: [14, 15], turtle: [14, 8], lizard: [18, 6], lion: [26, 17] };

export function drawPet(g, type, x, y, s, t) {
  if (s.dead) return grave(g, x, y);
  outlined(g, x - 17, y - 22, 34, 25, '#120c1c', (sg) => PETS[type](sg, 17, 22, s, t));
  if (s.emote) icon(g, s.emote, x - 2, y - PET_SIZE[type][1] - 7);
}

function grave(g, x, y) {
  ellipse(g, x, y - 8, 3, 2, '#9a9aaa');
  rect(g, x - 3, y - 8, 7, 8, '#9a9aaa');
  rect(g, x - 3, y - 1, 7, 1, '#6a6a7a');
  rect(g, x, y - 7, 1, 4, '#5a5a6a');
  rect(g, x - 1, y - 6, 3, 1, '#5a5a6a');
  rect(g, x - 5, y - 2, 1, 1, '#ff6fa8');
  rect(g, x + 5, y - 2, 1, 1, '#ffd84a');
}

// ---------------------------------------------------------------- flowers: a leafy pile covered in blooms (x, y = ground)

const INK = '#0b1f16';  // outline of plants
const LEAVES = ['#14452a', '#1f6a3a', '#3a9a4a', '#7fd86a'];
// petal, shade, center / highlight
const BLOOM = {
  daisy: ['#ffffff', '#b8c4e0', '#ffc61f'], poppy: ['#ff4a1c', '#a8200a', '#1a0c0c'], tulip: ['#ff3b6b', '#b01844', '#ffb0c8'],
  bluebell: ['#6a86ff', '#2f45c0', '#c0ccff'], sunflower: ['#ffd21f', '#d08a10', '#5a3010'], lavender: ['#b888f8', '#6f42c8', '#ecdcff'],
  rose: ['#f0203f', '#8a0a24', '#ff8a9a'], lily: ['#fff4fa', '#f0a0c8', '#ff4f9a'],
};
const SPOTS9 = [[-6, -6], [-2, -9], [2, -6], [6, -8], [-8, -3], [-3, -4], [4, -3], [8, -4], [0, -11], [-5, -10], [5, -11]];

function leafPile(g, x, y, rx, ry, seed) {
  ellipse(g, x, y - ry, rx, ry, LEAVES[0]);
  for (let i = 0; i < rx * 2; i++) {
    const a = hash(seed + i) * Math.PI;
    const lx = x + Math.round(Math.cos(a) * rx * 0.8 * (0.4 + hash(seed + i + 40) * 0.6));
    const ly = y - ry - Math.round(Math.sin(a) * ry * 0.9);
    ellipse(g, lx, ly, 2, 1, LEAVES[1]);
    rect(g, lx - 1, ly - 1, 2, 1, LEAVES[2]);
    if (i % 3 === 0) rect(g, lx - 1, ly - 1, 1, 1, LEAVES[3]);
  }
}

const BLOOMS = {
  daisy(g, x, y, [p, s, c]) { rect(g, x - 1, y, 3, 1, p); rect(g, x, y - 1, 1, 3, p); rect(g, x - 2, y, 1, 1, s); rect(g, x + 2, y, 1, 1, s); rect(g, x, y + 2, 1, 1, s); rect(g, x, y, 1, 1, c); },
  poppy(g, x, y, [p, s, c]) { rect(g, x - 1, y - 1, 3, 3, p); rect(g, x + 1, y, 1, 2, s); rect(g, x - 1, y - 1, 1, 1, '#ff9a6a'); rect(g, x, y, 1, 1, c); },
  tulip(g, x, y, [p, s, c]) { rect(g, x - 1, y - 1, 3, 3, p); rect(g, x - 1, y - 2, 1, 1, p); rect(g, x + 1, y - 2, 1, 1, s); rect(g, x + 1, y - 1, 1, 3, s); rect(g, x - 1, y - 1, 1, 1, c); rect(g, x, y + 2, 1, 2, LEAVES[2]); },
  bluebell(g, x, y, [p, s, c]) { rect(g, x - 1, y - 2, 3, 1, LEAVES[2]); rect(g, x - 2, y - 1, 2, 2, p); rect(g, x + 1, y, 2, 2, p); rect(g, x - 2, y + 1, 2, 1, s); rect(g, x + 1, y + 2, 2, 1, s); rect(g, x - 2, y - 1, 1, 1, c); },
  sunflower(g, x, y, [p, s, c]) { rect(g, x, y + 2, 1, 4, LEAVES[2]); disc(g, x, y, 3, p); rect(g, x - 3, y, 1, 1, s); rect(g, x + 3, y, 1, 1, s); rect(g, x, y + 3, 1, 1, s); disc(g, x, y, 1, c); rect(g, x - 1, y - 1, 1, 1, '#8a5a20'); },
  lavender(g, x, y, [p, s, c]) { for (let i = 0; i < 5; i++) rect(g, x + (i % 2 ? 0 : -1), y - 2 + i, 2, 1, i % 2 ? s : p); rect(g, x - 1, y - 3, 1, 1, c); rect(g, x, y + 3, 1, 2, LEAVES[2]); },
  rose(g, x, y, [p, s, c]) { disc(g, x, y, 2, p); rect(g, x, y, 2, 2, s); rect(g, x - 1, y - 1, 1, 1, c); rect(g, x, y, 1, 1, '#5a0414'); },
  lily(g, x, y, [p, s, c]) { rect(g, x - 2, y, 5, 1, p); rect(g, x, y - 2, 1, 5, p); rect(g, x - 1, y - 1, 3, 3, p); rect(g, x + 1, y + 1, 1, 1, s); rect(g, x - 2, y, 1, 1, s); rect(g, x, y, 1, 1, c); },
};

// stage 0 seedlings, 1 leafy pile, 2 buds, 3 full bloom
export function drawFlower(g, type, x, y, stage, t, phase = 0) {
  x = Math.round(x);
  y = Math.round(y);
  const [rx, ry] = [[4, 2], [7, 4], [9, 5], [9, 5]][stage];
  outlined(g, x - 12, y - 18, 24, 19, INK, (sg) => {
    leafPile(sg, 12, 18, rx, ry, phase * 31);
    if (stage === 0) { [[-2, -3], [1, -4], [3, -2]].forEach(([dx, dy]) => rect(sg, 12 + dx, 18 + dy, 1, 2, LEAVES[3])); return; }
    if (stage === 1) return;
    const spots = type === 'sunflower' ? [[-4, -9], [3, -11], [0, -6]] : SPOTS9;
    spots.forEach(([dx, dy], i) => {
      const sway = Math.round(Math.sin(t * 1.3 + phase + i) * 0.6);
      const bx = 12 + Math.round(dx * rx / 9) + sway;
      const by = 18 + Math.round(dy * (type === 'sunflower' ? 1.2 : 0.9)) + 2;
      if (stage === 2) { rect(sg, bx, by, 1, 2, BLOOM[type][0]); rect(sg, bx, by + 2, 1, 1, LEAVES[2]); } else BLOOMS[type](sg, bx, by, BLOOM[type]);
    });
  });
}

// ---------------------------------------------------------------- trees (x, y = ground at the trunk)

const CANOPY = {  // dark, mid, light, highlight, outline
  apple: ['#1a5230', '#2a7a3c', '#45a34c', '#9be07a', '#08200f'],
  maple: ['#7a1e0c', '#c0401a', '#ec7228', '#ffc45a', '#2a0804'],
  sakura: ['#c0507f', '#ec86b4', '#ffb4d4', '#fff0f6', '#4a1430'],
  pine: ['#0f3826', '#1a5a3a', '#2c7c4a', '#6fc07a', '#04140c'],
};
const LUMPS = [[0, 5, 6], [-9, 2, 5], [9, 2, 5], [-11, -3, 4], [11, -3, 4], [0, 0, 8], [-6, -5, 6], [6, -6, 6], [0, -10, 5], [-3, -12, 3], [4, -13, 3]];
const BARK = ['#3a2014', '#5a3420', '#7a4a2c'];

function trunk(g, x, y, h, k, sakura) {
  const [d, m, l] = sakura ? ['#2a141c', '#4a2630', '#6a3a44'] : BARK;
  rect(g, x - 2, y - h, 4, h, m);
  rect(g, x - 2, y - h, 1, h, l);
  rect(g, x + 1, y - h, 1, h, d);
  for (let j = 3; j < h; j += 4) rect(g, x - 1, y - j, 1, 2, d);
  rect(g, x - 4, y - 1, 3, 1, m); rect(g, x + 2, y - 1, 3, 1, d); rect(g, x - 3, y - 2, 1, 1, m);
  if (k >= 0.7) {  // two branches reaching into the crown
    for (let i = 0; i < 5; i++) { rect(g, x - 3 - i, y - h - i + 2, 2, 1, m); rect(g, x + 2 + i, y - h - i + 1, 2, 1, d); }
  }
}

function crown(g, cx, cy, k, pal, t, phase) {
  const [d, m, l, hi] = pal;
  const sway = Math.round(Math.sin(t * 0.9 + phase) * 0.8);
  const lumps = LUMPS.map(([dx, dy, r]) => [cx + Math.round(dx * k) + (dy < -4 ? sway : 0), cy + Math.round(dy * k), Math.max(2, Math.round(r * k))]);
  lumps.forEach(([x, y, r]) => disc(g, x, y, r, d));
  lumps.forEach(([x, y, r]) => disc(g, x - 1, y - 1, r - 1, m));
  lumps.forEach(([x, y, r]) => r > 3 && disc(g, x - 2, y - 2, r - 3, l));
  lumps.forEach(([x, y, r], i) => r > 3 && rect(g, x - 2 - Math.round(r / 3), y - 2 - Math.round(r / 3), 2, 1, hi));
  for (let i = 0; i < 14 * k; i++) {  // single leaves breaking the edge
    const a = hash(i + phase * 7) * 6.28;
    const rr = 12 * k;
    rect(g, cx + Math.round(Math.cos(a) * rr), cy - 2 + Math.round(Math.sin(a) * rr * 0.8), 1, 1, i % 2 ? m : l);
  }
}

function pine(g, x, y, k, t, phase) {
  const [d, m, l, hi] = CANOPY.pine;
  const h = Math.round(6 * k);
  trunk(g, x, y, h + 4, 0, false);
  const sway = Math.round(Math.sin(t * 0.8 + phase) * 0.7);
  for (let i = 0; i < 4; i++) {
    const w = Math.round((13 - i * 3) * k);
    const ty = y - h - Math.round((8 + i * 7) * k);
    const tall = Math.round(9 * k);
    for (let j = 0; j < tall; j++) {
      const half = Math.round((w * (j + 1)) / tall);
      const sx = x + (i > 1 ? sway : 0);
      rect(g, sx - half, ty + j, half * 2 + 1, 1, d);
      rect(g, sx - half + 1, ty + j, half, 1, j % 3 === 2 ? m : l);
      if (j % 3 === 0) rect(g, sx - Math.round(half / 2), ty + j, 1, 1, hi);
    }
  }
  return y - h - Math.round(36 * k);
}

// stage 0 sapling, 1 small, 2 young, 3 grown; `fruit` shows a harvest is ready. Returns the crown top y.
export function drawTree(g, type, x, y, stage, t, phase = 0, fruit = false) {
  x = Math.round(x);
  y = Math.round(y);
  const pal = CANOPY[type];
  let top = y - 50;
  outlined(g, x - 22, y - 52, 44, 53, pal[4], (sg) => {
    const X = 22;
    const Y = 52;
    if (stage === 0) {
      rect(sg, X, Y - 7, 1, 7, BARK[1]);
      [[-2, -7], [1, -8], [-1, -5], [2, -5]].forEach(([dx, dy]) => rect(sg, X + dx, Y + dy, 2, 1, pal[2]));
      return;
    }
    const k = [0, 0.45, 0.7, 1][stage];
    if (type === 'pine') {
      pine(sg, X, Y, k, t, phase);
      if (fruit) [[-5, -16], [4, -22], [-2, -28]].forEach(([dx, dy]) => { rect(sg, X + dx, Y + dy, 2, 3, '#7a4a22'); rect(sg, X + dx, Y + dy, 1, 1, '#b07a3a'); });
      if (stage === 3) [[-8, -14], [6, -19], [-4, -25], [3, -31], [-6, -21], [8, -12]].forEach(([dx, dy], i) => {
        if ((t * 2 + i) % 3 < 2) rect(sg, X + dx, Y + dy, 1, 1, ['#00e5ff', '#ff4fd8', '#ffe14d'][i % 3]);  // fairy lights
      });
      return;
    }
    const h = Math.round(16 * k);
    trunk(sg, X, Y, h, k, type === 'sakura');
    const cy = Y - h - Math.round(10 * k);
    crown(sg, X, cy, k, pal, t, phase);
    if (type === 'apple' && stage === 3) {
      [[-7, 0], [6, -4], [-2, 6], [8, 4], [-9, -6], [2, -9], [-4, -2]].slice(0, fruit ? 7 : 3)
        .forEach(([dx, dy]) => { rect(sg, X + dx, cy + dy, 2, 2, '#e02a2a'); rect(sg, X + dx, cy + dy, 1, 1, '#ff9a8a'); });
    }
    if (type === 'sakura' && fruit) [[-6, 3], [5, -2], [1, 6]].forEach(([dx, dy]) => { rect(sg, X + dx, cy + dy, 1, 1, '#c0102a'); rect(sg, X + dx + 2, cy + dy, 1, 1, '#c0102a'); });
    if (type === 'maple' && fruit) { rect(sg, X + 2, Y - 8, 3, 4, '#9aa0aa'); rect(sg, X + 2, Y - 8, 3, 1, '#d8a040'); }
  });
  if (fruit) icon(g, 'star', x - 2, y - 52);
  return top;
}

// A beehive hanging from a branch; `level` 0..1 is how far the bees have built it.
export function drawHive(g, x, y, level) {
  const rows = 2 + Math.round(level * 6);
  rect(g, x, y, 1, 2, BARK[0]);
  for (let j = 0; j < rows; j++) {
    const w = Math.max(1, Math.round(Math.sin(((j + 1) / (rows + 1)) * Math.PI) * (2 + level * 3)));
    rect(g, x - w, y + 2 + j, w * 2 + 1, 1, j % 2 ? '#c8861c' : '#f0b83a');
    rect(g, x - w, y + 2 + j, 1, 1, '#6a4008');
  }
  if (level > 0.5) rect(g, x, y + 2 + Math.round(rows * 0.6), 1, 1, '#2a1404');
}

export function drawBee(g, x, y, t, i) {
  rect(g, x, y, 2, 1, '#ffd21f');
  rect(g, x + 1, y, 1, 1, '#1a1a1a');
  if (Math.floor(t * 20 + i) % 2) rect(g, x, y - 1, 1, 1, '#e8f6ff');
}

const BIRD = { up: ['k...k', '.kdk.', '..k..'], down: ['..k..', '.kdk.', 'k...k'] };
export function drawBird(g, x, y, t, i, perched = false) {
  if (perched) {
    rect(g, x - 1, y - 2, 3, 2, '#2a2440'); rect(g, x - 1, y - 2, 1, 1, '#4a4a70'); rect(g, x + 2, y - 2, 1, 1, '#ffb000'); rect(g, x, y, 1, 1, '#ffb000');
    return;
  }
  sprite(g, BIRD[Math.floor(t * 8 + i) % 2 ? 'up' : 'down'], { k: '#1c1830', d: '#3fd8ff' }, x - 2, y - 1);
}

// ---------------------------------------------------------------- pool

export function drawPool(g, x, y, w, h, t) {
  rect(g, x - 3, y - 3, w + 6, h + 6, '#20202c');
  rect(g, x - 2, y - 2, w + 4, h + 4, '#d8d8e4');
  for (let i = 0; i < w + 4; i += 5) { rect(g, x - 2 + i, y - 2, 1, 2, '#a8a8b8'); rect(g, x - 2 + i, y + h, 1, 2, '#a8a8b8'); }
  rect(g, x - 2, y - 2, w + 4, 1, '#ffffff');
  rect(g, x, y, w, h, '#1f8fd8');
  rect(g, x, y, w, 3, '#156aa8');
  for (let i = 0; i < w; i += 6) for (let j = 4; j < h; j += 6) rect(g, x + i, y + j, 1, 1, '#2aa0e8');
  for (let i = 0; i < 14; i++) {  // caustics
    const px = x + 1 + ((hash(i) * w + t * (3 + (i % 3))) % (w - 5));
    const py = y + 4 + Math.floor(hash(i + 9) * (h - 6));
    rect(g, px, py, 3, 1, '#9fe8ff'); rect(g, px + 1, py + 1, 2, 1, '#5fc8ff');
  }
  [[x + 4, y + h - 1], [x + w - 5, y + h - 1]].forEach(([lx, ly]) => { rect(g, lx, ly, 2, 1, '#bff8ff'); glow(g, lx, ly - 3, 7, '0,229,255', 0.5); });
  rect(g, x + w - 7, y - 4, 1, 7, '#c8c8d8'); rect(g, x + w - 3, y - 4, 1, 7, '#c8c8d8');
  for (let j = 0; j < 3; j++) rect(g, x + w - 7, y - 2 + j * 2, 5, 1, '#e8e8f0');
  const fx = x + 12 + Math.round(Math.sin(t * 0.6) * 4);
  const fy = y + Math.round(h / 2) + Math.round(Math.sin(t * 1.2));
  disc(g, fx, fy, 3, '#ff4f9a'); disc(g, fx, fy, 1, '#1f8fd8'); rect(g, fx - 3, fy, 1, 1, '#ffffff'); rect(g, fx + 3, fy, 1, 1, '#ffffff');
}

// ---------------------------------------------------------------- garden ground: wasteland, cleared soil and floors

export const FLOOR_LOOK = {
  lawn: ['#2c7436', '#378442', '#246630', '#5ab85a'], clover: ['#245e30', '#2f7038', '#1c5028', '#7ed06a'],
  gravel: ['#8a8a98', '#a2a2b0', '#70707e', '#c8c8d4'], brick: ['#9a3a24', '#b04a30', '#80301c', '#4a3430'],
  stone: ['#7c7c8c', '#92929e', '#666676', '#30303c'], deck: ['#8e5e32', '#a06c3a', '#734a26', '#40260f'],
  neon: ['#150b28', '#1c1034', '#0e0820', '#00e5ff'], soil: ['#4a3a2e', '#544234', '#3c2e24', '#6a5a4a'],
  waste: ['#463a36', '#52443c', '#382c28', '#2a1e1c'],
};

function noise(g, x0, y0, w, h, pal, seed, step = 2) {
  for (let y = y0; y < y0 + h; y += step) {
    for (let x = x0; x < x0 + w; x += step) {
      const r = hash(x * 0.37 + y * 1.71 + seed);
      if (r < 0.25) rect(g, x, y, step, step, pal[1]); else if (r > 0.8) rect(g, x, y, step, step, pal[2]);
    }
  }
}

const PATTERNS = {
  lawn(g, x0, y0, w, h, p, s) {
    noise(g, x0, y0, w, h, p, s);
    for (let i = 0; i < (w * h) / 18; i++) {
      const x = x0 + Math.floor(hash(i + s) * w);
      const y = y0 + Math.floor(hash(i * 3 + s) * h);
      rect(g, x, y, 1, 2, i % 4 ? p[3] : '#8fe07a');
      if (i % 37 === 0) rect(g, x + 1, y, 1, 1, i % 2 ? '#ffffff' : '#ffe14d');
    }
  },
  clover(g, x0, y0, w, h, p, s) {
    noise(g, x0, y0, w, h, p, s, 3);
    for (let i = 0; i < (w * h) / 30; i++) {
      const x = x0 + Math.floor(hash(i + s) * w);
      const y = y0 + Math.floor(hash(i * 3 + s) * h);
      rect(g, x, y, 1, 1, p[3]); rect(g, x + 1, y + 1, 1, 1, p[3]); rect(g, x - 1, y + 1, 1, 1, '#5aa850');
    }
  },
  gravel(g, x0, y0, w, h, p, s) {
    noise(g, x0, y0, w, h, p, s, 1);
    for (let y = y0 + 2; y < y0 + h; y += 4) for (let x = x0; x < x0 + w; x++) rect(g, x, y + Math.round(Math.sin(x / 4) * 1), 1, 1, p[3]);
  },
  brick(g, x0, y0, w, h, p, s) {
    rect(g, x0, y0, w, h, p[3]);
    for (let y = y0, row = 0; y < y0 + h; y += 4, row++) {
      for (let x = x0 - (row % 2) * 4; x < x0 + w; x += 8) {
        const c = p[Math.floor(hash(x + y * 7 + s) * 3)];
        rect(g, Math.max(x0, x), y, Math.min(7, x + 7 - Math.max(x0, x)), 3, c);
        rect(g, Math.max(x0, x), y, Math.min(7, x + 7 - Math.max(x0, x)), 1, '#c8644a');
      }
    }
  },
  stone(g, x0, y0, w, h, p, s) {
    rect(g, x0, y0, w, h, p[3]);
    for (let y = y0, row = 0; y < y0 + h; y += 7, row++) {
      for (let x = x0 - (row % 2) * 5; x < x0 + w; x += 10) {
        const sw = 8 + Math.floor(hash(x + y + s) * 2);
        const sx = Math.max(x0, x + 1);
        const ww = Math.min(sw, x + 1 + sw - sx);
        rect(g, sx, y + 1, ww, 5, p[Math.floor(hash(x * 3 + y + s) * 3)]);
        rect(g, sx, y + 1, ww, 1, '#b4b4c4');
        if (hash(x + y * 2) > 0.7) rect(g, sx + ww, y + 3, 1, 2, '#4a8a3a');
      }
    }
  },
  deck(g, x0, y0, w, h, p, s) {
    rect(g, x0, y0, w, h, p[3]);
    for (let y = y0, row = 0; y < y0 + h; y += 4, row++) {
      for (let x = x0 - Math.floor(hash(row + s) * 20); x < x0 + w; x += 22) {
        const sx = Math.max(x0, x);
        rect(g, sx, y, Math.min(21, x + 21 - sx), 3, p[row % 3]);
        rect(g, sx, y, Math.min(21, x + 21 - sx), 1, '#b88048');
        if (x + 2 >= x0) rect(g, x + 2, y + 1, 1, 1, '#d0d0d8');
      }
    }
  },
  neon(g, x0, y0, w, h, p) {
    for (let y = y0; y < y0 + h; y += 8) for (let x = x0; x < x0 + w; x += 8) rect(g, x, y, 8, 8, p[((x + y) / 8) % 2 ? 0 : 1]);
  },
  soil(g, x0, y0, w, h, p, s) {
    noise(g, x0, y0, w, h, p, s);
    for (let y = y0 + 2; y < y0 + h; y += 5) rect(g, x0, y, w, 1, p[2]);
    for (let i = 0; i < (w * h) / 60; i++) rect(g, x0 + Math.floor(hash(i + s) * w), y0 + Math.floor(hash(i * 5 + s) * h), 1, 1, p[3]);
  },
  waste(g, x0, y0, w, h, p, s) {
    noise(g, x0, y0, w, h, p, s, 3);
    for (let i = 0; i < (w * h) / 220; i++) {  // cracks
      let x = x0 + Math.floor(hash(i + s) * w);
      let y = y0 + Math.floor(hash(i * 7 + s) * h);
      for (let k = 0; k < 7; k++) {
        rect(g, x, y, 1, 1, p[3]);
        x += hash(i * 11 + k) > 0.5 ? 1 : -1;
        y += hash(i * 13 + k) > 0.4 ? 1 : 0;
      }
    }
    for (let i = 0; i < (w * h) / 90; i++) {  // dead grass
      const x = x0 + Math.floor(hash(i * 3 + s + 1) * w);
      const y = y0 + Math.floor(hash(i * 9 + s + 2) * h);
      rect(g, x, y, 1, 2, '#8a7a4a'); rect(g, x + 1, y + 1, 1, 1, '#6a5a32');
    }
  },
};

export function drawFloor(g, x0, y0, w, h, floor, seed) {
  PATTERNS[floor](g, x0, y0, w, h, FLOOR_LOOK[floor], seed);
}

// Rubble lying on the wasteland (x, y = ground point).
const DEBRIS = {
  rock(g, x, y) { ellipse(g, x, y - 2, 3, 2, '#1a1418'); ellipse(g, x, y - 2, 2, 1, '#6a6070'); rect(g, x - 1, y - 3, 2, 1, '#9a90a0'); },
  tire(g, x, y) { ellipse(g, x, y - 2, 4, 2, '#0c0c10'); ellipse(g, x, y - 2, 2, 1, '#3a3040'); rect(g, x - 3, y - 4, 2, 1, '#3a3a44'); },
  bag(g, x, y) { ellipse(g, x, y - 3, 3, 3, '#0e0a14'); ellipse(g, x - 1, y - 3, 2, 2, '#2a2236'); rect(g, x, y - 7, 1, 2, '#2a2236'); rect(g, x - 2, y - 5, 1, 1, '#5a5070'); },
  crate(g, x, y) { rect(g, x - 4, y - 6, 8, 6, '#2a1a0e'); rect(g, x - 3, y - 5, 6, 4, '#7a5a30'); rect(g, x - 3, y - 3, 6, 1, '#4a3418'); rect(g, x + 1, y - 6, 2, 2, '#2a1a0e'); },
  barrel(g, x, y) { rect(g, x - 3, y - 7, 6, 7, '#1a0e0a'); rect(g, x - 2, y - 6, 4, 6, '#8a3e1e'); rect(g, x - 2, y - 4, 4, 1, '#5a2a14'); rect(g, x - 2, y - 6, 1, 6, '#b0582e'); ellipse(g, x, y - 7, 2, 0, '#c87040'); },
  bush(g, x, y) { [[-3, -4], [0, -6], [3, -4], [-1, -3], [2, -2]].forEach(([dx, dy]) => { rect(g, x, y, 1, 1, '#5a4228'); for (let k = 0; k < 4; k++) rect(g, x + Math.round((dx * k) / 4), y + Math.round((dy * k) / 4), 1, 1, '#6a4e2c'); }); },
  can(g, x, y) { rect(g, x - 1, y - 2, 3, 2, '#a8a8b8'); rect(g, x - 1, y - 2, 1, 2, '#d03a3a'); },
  puddle(g, x, y, t) { ellipse(g, x, y - 1, 6, 2, '#1e1438'); rect(g, x - 3, y - 2, 4, 1, '#3fd8ff'); rect(g, x + 1, y - 1, 2, 1, '#ff4fd8'); },
};
export const DEBRIS_KINDS = Object.keys(DEBRIS);
export function drawDebris(g, kind, x, y) { DEBRIS[kind](g, Math.round(x), Math.round(y)); }
