// Home art, drawn in code with whole-pixel rectangles: pets, plants, pool, house exteriors and
// interiors, and furniture. Everything takes the time `t` so it can idle-animate.
import { disc, ellipse, hash, icon, rect } from './pixel.js';

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
  PETS[type](g, Math.round(x), Math.round(y), s, t);
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

// ---------------------------------------------------------------- plants (x, y = ground)

const STEM = '#3f9a3f';
const LEAF = '#5cc85c';
const BLOOMS = {
  tulip: (g, x, y) => { rect(g, x - 1, y - 2, 3, 3, '#ff3b5c'); rect(g, x - 1, y - 3, 1, 1, '#ff3b5c'); rect(g, x + 1, y - 3, 1, 1, '#ff3b5c'); rect(g, x, y - 1, 1, 1, '#c81e3c'); },
  rose: (g, x, y) => { disc(g, x, y - 1, 2, '#c8102e'); rect(g, x, y - 1, 1, 1, '#8a0a1e'); rect(g, x - 1, y - 2, 1, 1, '#ff4f6f'); },
  sunflower: (g, x, y) => { disc(g, x, y - 4, 3, '#ffd21f'); disc(g, x, y - 4, 1, '#6b3e12'); },
  daisy: (g, x, y) => { rect(g, x - 2, y - 1, 5, 1, '#ffffff'); rect(g, x, y - 3, 1, 5, '#ffffff'); rect(g, x - 1, y - 2, 3, 3, '#ffffff'); rect(g, x, y - 1, 1, 1, '#ffd21f'); },
  lavender: (g, x, y) => { for (let i = 0; i < 4; i++) { rect(g, x, y - 1 - i * 2, 1, 1, '#a070e0'); rect(g, x + (i % 2 ? 1 : -1), y - 2 - i * 2, 1, 1, '#7a4fd0'); } },
  lily: (g, x, y) => { rect(g, x - 2, y - 1, 5, 2, '#ffe4ef'); rect(g, x - 1, y - 2, 3, 1, '#ffe4ef'); rect(g, x, y - 1, 1, 1, '#ff7fb0'); rect(g, x - 2, y - 2, 1, 1, '#ffffff'); },
  poppy: (g, x, y) => { disc(g, x, y - 1, 2, '#ff4a1c'); rect(g, x, y - 1, 1, 1, K); },
  bluebell: (g, x, y) => { rect(g, x + 1, y - 2, 1, 1, STEM); [[2, 0], [2, 3], [0, 5]].forEach(([dx, dy]) => rect(g, x + dx, y - 3 + dy, 2, 2, '#4f6dff')); },
};
const BUDS = { tulip: '#ff3b5c', rose: '#c8102e', sunflower: '#ffd21f', daisy: '#ffffff', lavender: '#a070e0', lily: '#ffe4ef', poppy: '#ff4a1c', bluebell: '#4f6dff' };

// stage 0 seed, 1 sprout, 2 bud, 3 bloom
export function drawFlower(g, type, x, y, stage, t, phase = 0) {
  if (stage === 0) { rect(g, x - 1, y - 1, 3, 1, '#7a5230'); rect(g, x, y - 2, 1, 1, '#9a6a3a'); return; }
  if (stage === 1) { rect(g, x, y - 3, 1, 3, STEM); rect(g, x - 1, y - 3, 1, 1, LEAF); rect(g, x + 1, y - 2, 1, 1, LEAF); return; }
  const tall = type === 'sunflower' ? 11 : 7;
  const sway = Math.round(Math.sin(t * 1.4 + phase) * 0.7);
  rect(g, x, y - tall, 1, tall, STEM);
  rect(g, x - 1, y - 3, 1, 1, LEAF); rect(g, x - 2, y - 4, 1, 1, LEAF); rect(g, x + 1, y - 5, 1, 1, LEAF); rect(g, x + 2, y - 6, 1, 1, LEAF);
  if (stage === 2) { rect(g, x - 1 + sway, y - tall - 2, 2, 2, BUDS[type]); return; }
  BLOOMS[type](g, x + sway, y - tall);
}

// stage 0 sapling, 1 small, 2 young, 3 grown; `fruit` shows a harvest is ready
export function drawTree(g, type, x, y, stage, t, phase = 0, fruit = false) {
  const trunk = '#7a4a22';
  const sway = Math.round(Math.sin(t * 0.9 + phase) * 0.8);
  if (stage === 0) { rect(g, x, y - 5, 1, 5, trunk); rect(g, x - 1, y - 5, 1, 1, LEAF); rect(g, x + 1, y - 4, 1, 1, LEAF); return; }
  const r = [0, 4, 6, 9][stage];
  const h = [0, 6, 9, 12][stage];
  rect(g, x - 1, y - h, 3, h, trunk);
  rect(g, x - 2, y - 1, 5, 1, '#5a3418');
  const cy = y - h - r + 2;
  const cx = x + sway;
  if (type === 'pine') {
    for (let i = 0; i < 3; i++) {
      const tw = Math.round(r * (1 - i * 0.28));
      for (let j = 0; j < 5; j++) rect(g, cx - Math.round(tw * j / 5), cy + 2 - i * 5 + j, Math.round(tw * j / 5) * 2 + 1, 1, j % 2 ? '#1f6b3a' : '#2f8a4a');
    }
    if (fruit) [[-3, 4], [2, 2]].forEach(([dx, dy]) => rect(g, cx + dx, cy + dy, 2, 2, '#8a5a2a'));
    return;
  }
  const [c1, c2, c3] = {
    maple: ['#c8401a', '#e8682a', '#ffa040'], apple: ['#2d7d3a', '#3fa34d', '#6fd06f'], sakura: ['#ff8fc0', '#ffb7d5', '#ffe4ef'],
  }[type];
  disc(g, cx, cy, r, c1);
  disc(g, cx - Math.round(r / 3), cy - Math.round(r / 3), Math.round(r * 0.7), c2);
  disc(g, cx + Math.round(r / 2), cy - 1, Math.round(r * 0.5), c2);
  for (let i = 0; i < r; i++) {
    const a = hash(i * 7 + phase * 13) * 6.28;
    const d = hash(i * 3 + 1) * (r - 1);
    rect(g, cx + Math.round(Math.cos(a) * d), cy + Math.round(Math.sin(a) * d), 1, 1, c3);
  }
  if (type === 'maple' && fruit) rect(g, x + 2, y - h + 3, 2, 2, '#c08a3a'); // syrup bucket
  if (type === 'apple' && (fruit || stage === 3)) {
    [[-3, 1], [3, -2], [0, 4], [-5, -3], [5, 3]].slice(0, fruit ? 5 : 2).forEach(([dx, dy]) => rect(g, cx + dx, cy + dy, 2, 2, '#e8322b'));
  }
  if (fruit && type !== 'apple') icon(g, 'star', x - 2, cy - r - 7);
}

// ---------------------------------------------------------------- pool

export function drawPool(g, x, y, w, h, t) {
  rect(g, x - 2, y - 2, w + 4, h + 4, '#e6e6ee');
  for (let i = 0; i < w + 4; i += 4) rect(g, x - 2 + i, y - 2, 1, h + 4, '#c8c8d4');
  rect(g, x, y, w, h, '#2fa8ef');
  for (let j = 0; j < h; j += 3) rect(g, x, y + j, w, 1, '#49c2ff');
  for (let i = 0; i < 9; i++) {
    const px = x + ((hash(i) * w + t * (4 + i % 3)) % (w - 4)) + 1;
    const py = y + 2 + Math.floor(hash(i + 9) * (h - 4));
    rect(g, px, py, 3, 1, '#d8f4ff');
  }
  rect(g, x + w - 5, y - 3, 1, 6, '#b8b8c8'); rect(g, x + w - 2, y - 3, 1, 6, '#b8b8c8');
  rect(g, x + w - 5, y - 1, 4, 1, '#b8b8c8'); rect(g, x + w - 5, y + 1, 4, 1, '#b8b8c8');
  const fx = x + 8 + Math.round(Math.sin(t * 0.7) * 3);
  const fy = y + h / 2 + Math.round(Math.sin(t * 1.3));
  disc(g, fx, fy, 3, '#ff6fa8'); disc(g, fx, fy, 1, '#2fa8ef'); rect(g, fx - 3, fy, 1, 1, '#ffffff');
}

// ---------------------------------------------------------------- house exteriors (x, y = door step)

function steppedRoof(g, cx, top, rows, w0, grow, c1, c2) {
  for (let i = 0; i < rows; i++) rect(g, cx - (w0 + i * grow) / 2, top + i, w0 + i * grow, 1, i % 3 === 2 ? c2 : c1);
}

const HOUSES = {
  cabin(g, x, y, t) {
    const L = x - 22;
    const T = y - 34;
    rect(g, L + 32, T + 1, 4, 9, '#7a7a80');
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.8 + i / 3) % 1;
      disc(g, L + 34 + Math.round(Math.sin(k * 6 + i) * 2), T - Math.round(k * 14), 1 + Math.round(k * 2), `rgba(200,200,210,${0.8 - k * 0.7})`);
    }
    steppedRoof(g, x, T, 13, 8, 3.4, '#5a3a1e', '#4a2e14');
    rect(g, L + 8, T + 7, 6, 2, '#7a6a4a');
    rect(g, L, T + 13, 44, 21, '#9a6634');
    for (let j = T + 15; j < y; j += 4) rect(g, L, j, 44, 1, '#7a4a22');
    rect(g, x - 4, y - 12, 8, 12, '#4a2e14'); rect(g, x + 2, y - 6, 1, 1, '#f4d35e');
    rect(g, L + 5, T + 17, 9, 7, '#9fd8ff'); rect(g, L + 9, T + 17, 1, 7, '#4a2e14'); rect(g, L + 5, T + 20, 9, 1, '#4a2e14');
    rect(g, L + 30, T + 17, 9, 7, '#9fd8ff'); rect(g, L + 34, T + 17, 1, 7, '#4a2e14');
    return 44;
  },
  modern(g, x, y, t) {
    const L = x - 30;
    const T = y - 34;
    rect(g, L, T + 8, 60, 26, '#f2f2f4'); rect(g, L + 28, T, 32, 14, '#e4e4ea');
    rect(g, L - 1, T + 7, 30, 2, '#2e2e36'); rect(g, L + 27, T - 1, 34, 2, '#2e2e36');
    rect(g, L + 4, T + 12, 14, 22, '#c08a5a');
    for (let i = 0; i < 14; i += 3) rect(g, L + 4 + i, T + 12, 1, 22, '#9a6a3a');
    rect(g, L + 30, T + 3, 27, 8, '#7fd0ff'); rect(g, L + 22, T + 16, 35, 12, '#7fd0ff');
    const sh = Math.floor((t * 6) % 50);
    for (let j = 0; j < 12; j++) rect(g, L + 22 + ((sh + j) % 35), T + 16 + j, 2, 1, 'rgba(255,255,255,0.6)');
    rect(g, x - 3, y - 14, 6, 14, '#2e3a4a');
    rect(g, L + 20, y - 4, 4, 4, '#4caf50');
    return 60;
  },
  euro(g, x, y, t) {
    const L = x - 28;
    const T = y - 40;
    rect(g, L + 40, T + 1, 5, 10, '#a33a22');
    steppedRoof(g, x, T, 17, 4, 3.3, '#c0482c', '#a33a22');
    rect(g, L, T + 17, 56, 23, '#f3e6c8');
    [[L + 6], [L + 38]].forEach(([wx]) => {
      rect(g, wx, T + 22, 10, 8, '#9fd8ff'); rect(g, wx + 5, T + 22, 1, 8, '#ffffff');
      rect(g, wx - 3, T + 22, 3, 8, '#3a7a4a'); rect(g, wx + 10, T + 22, 3, 8, '#3a7a4a');
      for (let i = 0; i < 10; i += 2) rect(g, wx + i, T + 31, 1, 1, hash(i + wx) > 0.5 ? '#ff3b5c' : '#ffd84a');
      rect(g, wx, T + 32, 10, 1, '#7a4a22');
    });
    ellipse(g, x, y - 12, 4, 3, '#6b3a1e'); rect(g, x - 4, y - 12, 9, 12, '#6b3a1e'); rect(g, x + 2, y - 6, 1, 1, '#f4d35e');
    return 56;
  },
  tower(g, x, y, t) {
    const L = x - 20;
    const T = y - 62;
    rect(g, x, T - 7, 1, 7, '#9a9aa8');
    if (t % 1.4 < 0.7) rect(g, x - 1, T - 8, 3, 2, '#ff2a2a');
    rect(g, L, T, 40, 62, '#2f5f8f');
    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 5; col++) {
        const lit = hash(row * 5 + col + Math.floor(t / 3) * 0.37) > 0.55;
        rect(g, L + 2 + col * 8, T + 3 + row * 5, 6, 3, lit ? '#ffe58a' : '#7fb8e8');
      }
    }
    rect(g, L - 2, y - 10, 44, 10, '#dfe6ee'); rect(g, x - 6, y - 9, 12, 9, '#7fd0ff'); rect(g, x, y - 9, 1, 9, '#dfe6ee');
    return 40;
  },
  palace_cn(g, x, y, t) {
    const L = x - 42;
    const T = y - 46;
    rect(g, L - 2, y - 4, 88, 4, '#e8e0d0'); rect(g, x - 8, y - 4, 16, 4, '#f4f0e8');
    rect(g, L + 6, T + 22, 72, 20, '#b3261e');
    for (let i = 0; i < 8; i++) rect(g, L + 8 + i * 10, T + 22, 2, 20, '#8a1a14');
    rect(g, L + 14, T + 10, 56, 10, '#b3261e');
    steppedRoof(g, x, T + 4, 7, 50, 4, '#2a7a5a', '#1f5f46');
    rect(g, L + 10, T + 10, 64, 1, '#d8a520');
    steppedRoof(g, x, T + 17, 7, 76, 2, '#2a7a5a', '#1f5f46');
    rect(g, L - 3, T + 23, 90, 1, '#d8a520');
    [[L - 3, T + 22], [L + 86, T + 22], [L + 9, T + 9], [L + 74, T + 9]].forEach(([cx, cy]) => rect(g, cx, cy, 2, 2, '#d8a520'));
    rect(g, x - 1, T, 2, 4, '#d8a520');
    rect(g, x - 6, y - 16, 12, 12, '#7a1010');
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) rect(g, x - 4 + i * 4, y - 14 + j * 4, 1, 1, '#d8a520');
    [L + 14, L + 68].forEach((lx, i) => {
      const sw = Math.round(Math.sin(t * 2 + i) * 1.5);
      rect(g, lx + sw, T + 24, 1, 3, '#d8a520');
      ellipse(g, lx + sw, T + 29, 2, 3, '#e83030');
      rect(g, lx + sw, T + 28, 1, 2, '#ffd84a');
    });
    return 84;
  },
  palace_eu(g, x, y, t) {
    const L = x - 44;
    const T = y - 52;
    rect(g, L, T + 24, 16, 28, '#f4efe6'); rect(g, L + 72, T + 24, 16, 28, '#f4efe6');
    ellipse(g, L + 8, T + 23, 6, 5, '#6a8fbf'); ellipse(g, L + 80, T + 23, 6, 5, '#6a8fbf');
    [L + 8, L + 80].forEach((fx, i) => {
      rect(g, fx, T + 10, 1, 9, '#9a9aa8');
      for (let k = 0; k < 6; k++) rect(g, fx + 1 + k, T + 10 + Math.round(Math.sin(t * 5 + k * 0.8 + i)), 1, 3, '#d8283c');
    });
    rect(g, L + 14, T + 18, 60, 34, '#f4efe6');
    rect(g, L + 14, T + 18, 60, 2, '#ddd6c8');
    ellipse(g, x, T + 16, 12, 10, '#6a8fbf'); ellipse(g, x - 3, T + 13, 4, 4, '#8fb0d8');
    rect(g, x - 1, T + 2, 2, 5, '#d8a520'); disc(g, x, T + 2, 1, '#ffd84a');
    for (let i = 0; i < 6; i++) rect(g, L + 18 + i * 10, T + 24, 3, 24, '#e2dbcc');
    for (let i = 0; i < 5; i++) {
      ellipse(g, L + 26 + i * 10, T + 30, 2, 2, '#7fb8e8'); rect(g, L + 24 + i * 10, T + 30, 5, 6, '#7fb8e8');
      rect(g, L + 24 + i * 10, T + 36, 5, 1, '#d8a520');
    }
    rect(g, x - 5, y - 13, 10, 13, '#5a3a1e'); ellipse(g, x, y - 13, 5, 3, '#5a3a1e');
    rect(g, x - 14, y - 3, 28, 3, '#e8e0d0');
    return 88;
  },
};

export function drawHouse(g, id, x, y, t) { return HOUSES[id](g, Math.round(x), Math.round(y), t); }

// ---------------------------------------------------------------- house interiors

export const TILE = 12;
const ROOMS = {
  cabin: { wall: '#8a5a2b', trim: '#5a3a1e', floor: ['#b07a45', '#a06a38'], deco: 'logs' },
  modern: { wall: '#eef0f4', trim: '#c8ccd4', floor: ['#d4d8de', '#c6cad2'], deco: 'strip' },
  euro: { wall: '#e8d8b8', trim: '#a87444', floor: ['#c0884c', '#a87444'], deco: 'paper' },
  tower: { wall: '#1a2a44', trim: '#4a6a9a', floor: ['#2e3440', '#3a4150'], deco: 'city' },
  palace_cn: { wall: '#b3261e', trim: '#d8a520', floor: ['#6b2a1a', '#5a2214'], deco: 'gold' },
  palace_eu: { wall: '#f4efe6', trim: '#d8a520', floor: ['#f0ece4', '#cfc8bc'], deco: 'frames' },
};

export const roomSize = (gw, gh) => [gw * TILE + 16, gh * TILE + 30];

export function drawRoom(g, id, gw, gh, t, grid) {
  const r = ROOMS[id];
  const [W, H] = roomSize(gw, gh);
  rect(g, 0, 0, W, 22, r.wall);
  if (r.deco === 'logs') for (let j = 3; j < 22; j += 4) rect(g, 0, j, W, 1, r.trim);
  if (r.deco === 'paper') for (let i = 4; i < W; i += 8) for (let j = 3; j < 20; j += 6) rect(g, i, j, 1, 2, '#d4b88a');
  if (r.deco === 'gold') for (let i = 6; i < W; i += 14) { rect(g, i, 4, 6, 1, r.trim); rect(g, i + 2, 2, 2, 5, r.trim); }
  if (r.deco === 'city') {
    for (let i = 0; i < W; i += 6) {
      const bh = 6 + Math.floor(hash(i) * 12);
      rect(g, i, 22 - bh, 5, bh, '#0e1626');
      if (hash(i + Math.floor(t / 2)) > 0.5) rect(g, i + 2, 22 - bh + 2, 1, 1, '#ffe58a');
    }
  }
  if (r.deco === 'frames') for (let i = 10; i < W - 10; i += 30) { rect(g, i, 4, 12, 10, r.trim); rect(g, i + 1, 5, 10, 8, '#7fa8c8'); }
  if (r.deco !== 'city') {
    const wx = Math.round(W / 2) - 10;
    rect(g, wx - 1, 3, 22, 15, r.trim); rect(g, wx, 4, 20, 13, '#9fd8ff');
    const cx = wx + ((t * 2) % 26) - 4;
    rect(g, Math.max(wx, cx), 7, Math.min(6, wx + 20 - Math.max(wx, cx)), 2, '#ffffff');
    rect(g, wx + 9, 4, 1, 13, r.trim); rect(g, wx, 10, 20, 1, r.trim);
  }
  rect(g, 0, 20, W, 2, r.trim);
  rect(g, 0, 22, 8, H - 22, r.trim); rect(g, W - 8, 22, 8, H - 22, r.trim); rect(g, 0, H - 8, W, 8, r.trim);
  rect(g, W / 2 - 8, H - 8, 16, 8, r.floor[1]);
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      rect(g, 8 + gx * TILE, 22 + gy * TILE, TILE, TILE, r.floor[(gx + gy) % 2]);
      if (grid) { rect(g, 8 + gx * TILE, 22 + gy * TILE, TILE, 1, 'rgba(0,229,255,0.25)'); rect(g, 8 + gx * TILE, 22 + gy * TILE, 1, TILE, 'rgba(0,229,255,0.25)'); }
    }
  }
}

// ---------------------------------------------------------------- furniture (top-down, front at the bottom)

const wood = '#a87444';
const woodD = '#7a4a22';
const FURN = {
  chair: (g) => { rect(g, 2, 1, 8, 3, woodD); rect(g, 2, 4, 8, 6, wood); rect(g, 2, 10, 1, 2, woodD); rect(g, 9, 10, 1, 2, woodD); },
  cat_bed: (g) => { ellipse(g, 6, 7, 5, 4, '#c94f7c'); ellipse(g, 6, 7, 3, 2, '#f1a7c3'); },
  plant_pot: (g, w, h, t) => { rect(g, 4, 7, 4, 4, '#c0603a'); rect(g, 3, 7, 6, 1, '#d8774a'); const s = Math.round(Math.sin(t * 1.5)); disc(g, 6 + s, 4, 3, '#3fa34d'); rect(g, 5 + s, 2, 1, 1, '#6fd06f'); },
  floor_lamp: (g, w, h, t) => { disc(g, 6, 10, 2, '#444'); rect(g, 6, 4, 1, 6, '#666'); disc(g, 6, 3, 3, '#ffe9a8'); g.fillStyle = `rgba(255,233,168,${0.15 + Math.sin(t * 3) * 0.05})`; g.fillRect(0, 0, 12, 12); },
  big_plant: (g, w, h, t) => { rect(g, 3, 8, 6, 4, '#8a5a3a'); const s = Math.round(Math.sin(t * 1.2)); [[-3, -2], [3, -3], [0, -5], [-2, -6], [2, -6]].forEach(([dx, dy]) => ellipse(g, 6 + dx + s, 7 + dy, 2, 3, '#2d7d3a')); },
  bean_bag: (g) => { ellipse(g, 6, 7, 5, 4, '#7a4fd0'); ellipse(g, 5, 6, 3, 2, '#9a70f0'); },
  office_chair: (g) => { rect(g, 3, 1, 6, 3, '#333'); disc(g, 6, 7, 3, '#444'); rect(g, 1, 10, 10, 1, '#222'); },
  easel: (g, w, h, t) => { rect(g, 2, 2, 8, 7, '#f8f8f0'); [[3, 3, '#ff6fa8'], [6, 4, '#4dc3ff'], [4, 6, '#ffd84a'], [7, 6, '#5cc85c']].forEach(([x, y, c]) => rect(g, x, y, 2, 2, c)); rect(g, 2, 9, 1, 3, woodD); rect(g, 9, 9, 1, 3, woodD); },
  vase: (g) => { ellipse(g, 6, 8, 3, 3, '#3f6fd8'); rect(g, 5, 4, 3, 3, '#3f6fd8'); rect(g, 4, 8, 4, 1, '#ffffff'); rect(g, 5, 2, 1, 2, '#ff3b5c'); rect(g, 7, 1, 1, 3, '#ffd84a'); },
  coffee_table: (g) => { rect(g, 1, 2, 22, 8, wood); rect(g, 1, 9, 22, 1, woodD); rect(g, 15, 4, 3, 3, '#ffffff'); rect(g, 16, 5, 1, 1, '#6b3e12'); },
  rug: (g, w, h) => { rect(g, 0, 0, w, h, '#e0b84a'); rect(g, 2, 2, w - 4, h - 4, '#8e2f4f'); for (let i = 4; i < w - 4; i += 6) { rect(g, i, h / 2 - 1, 3, 2, '#e0b84a'); } },
  sink: (g, w, h, t) => { rect(g, 0, 2, 12, 9, '#eeeeee'); ellipse(g, 6, 7, 3, 2, '#b8c4cc'); rect(g, 6, 2, 1, 3, '#9aa'); if (t % 1.5 < 0.2) rect(g, 6, 6, 1, 1, '#4dc3ff'); },
  armchair: (g) => { rect(g, 1, 1, 10, 10, '#2f5f9f'); rect(g, 3, 3, 6, 7, '#3f7fbf'); rect(g, 1, 10, 10, 1, '#1f3f6f'); },
  desk: (g) => { rect(g, 1, 1, 22, 9, '#b0804a'); rect(g, 3, 3, 5, 4, '#ffffff'); rect(g, 17, 2, 3, 3, '#ffe9a8'); rect(g, 1, 9, 22, 1, woodD); },
  toilet: (g) => { rect(g, 3, 0, 6, 3, '#ffffff'); ellipse(g, 6, 7, 3, 4, '#f0f0f0'); ellipse(g, 6, 7, 2, 2, '#cfe8f4'); },
  dresser: (g) => { rect(g, 1, 1, 22, 10, '#8a5a3a'); for (let i = 0; i < 3; i++) { rect(g, 2 + i * 7, 3, 6, 6, '#a06a48'); rect(g, 5 + i * 7, 6, 1, 1, '#f4d35e'); } },
  bookshelf: (g) => { rect(g, 0, 0, 24, 12, '#6b4220'); for (let i = 1; i < 23; i += 2) rect(g, i, 2, 1, 4, ['#d8283c', '#3f6fd8', '#5cc85c', '#ffd84a', '#a070e0'][i % 5]); for (let i = 2; i < 22; i += 3) rect(g, i, 7, 2, 3, ['#ff8a1e', '#4dc3ff', '#ff6fa8'][i % 3]); },
  dining_table: (g, w, h, t) => { rect(g, 2, 2, 20, 20, wood); rect(g, 2, 21, 20, 1, woodD); [[5, 5], [15, 5], [5, 15], [15, 15]].forEach(([x, y]) => disc(g, x + 1, y + 1, 2, '#ffffff')); rect(g, 11, 10, 2, 3, '#f4f0e8'); if (t % 0.5 < 0.25) rect(g, 11, 9, 1, 1, '#ffb000'); else rect(g, 12, 9, 1, 1, '#ff7a00'); },
  guitar: (g) => { ellipse(g, 6, 8, 3, 3, '#d9822b'); disc(g, 6, 8, 1, '#3a2010'); rect(g, 6, 1, 1, 5, '#5a3a1e'); rect(g, 5, 0, 3, 2, '#3a2010'); },
  counter: (g) => { rect(g, 0, 0, 24, 12, '#d8d8d8'); rect(g, 0, 0, 24, 3, '#efefef'); rect(g, 12, 4, 1, 7, '#b8b8b8'); rect(g, 3, 4, 6, 4, '#c08a5a'); },
  wardrobe: (g) => { rect(g, 0, 0, 24, 12, '#7a4a2a'); rect(g, 11, 1, 1, 10, '#5a3418'); rect(g, 9, 5, 1, 2, '#f4d35e'); rect(g, 14, 5, 1, 2, '#f4d35e'); },
  record_player: (g, w, h, t) => { rect(g, 1, 1, 10, 10, '#5a3a1e'); disc(g, 6, 6, 4, '#111'); const a = t * 6; rect(g, 6 + Math.round(Math.cos(a) * 3), 6 + Math.round(Math.sin(a) * 3), 1, 1, '#666'); rect(g, 6, 6, 1, 1, '#d8283c'); rect(g, 9, 2, 1, 5, '#cfcfd8'); },
  bed: (g) => { rect(g, 0, 0, 24, 36, '#7a4a2a'); rect(g, 2, 2, 20, 32, '#f4f4f4'); rect(g, 4, 3, 16, 6, '#ffffff'); rect(g, 4, 8, 16, 1, '#dddddd'); rect(g, 2, 13, 20, 21, '#4f7fd8'); rect(g, 2, 13, 20, 2, '#7fa8ff'); },
  double_bed: (g) => { rect(g, 0, 0, 36, 36, '#6b3a1e'); rect(g, 2, 2, 32, 32, '#f4f4f4'); rect(g, 4, 3, 13, 6, '#ffffff'); rect(g, 19, 3, 13, 6, '#ffffff'); rect(g, 2, 13, 32, 21, '#e86fa8'); rect(g, 2, 13, 32, 2, '#ff9fc8'); },
  fish_tank: (g, w, h, t) => {
    rect(g, 0, 0, 24, 12, '#5a5a6a'); rect(g, 1, 1, 22, 10, '#4dc3ff'); rect(g, 1, 9, 22, 2, '#e6d28a');
    [[4, 0], [18, 1]].forEach(([x, k]) => { const s = Math.round(Math.sin(t * 2 + k)); rect(g, x + s, 5, 1, 4, '#2f8a4a'); rect(g, x, 7, 1, 2, '#2f8a4a'); });
    [['#ff8a1e', 1.1, 3], ['#ffd84a', 0.8, 5], ['#ff4fd8', 1.5, 7]].forEach(([c, sp, fy], i) => {
      const p = (t * sp * 4 + i * 7) % 36; const fx = p < 18 ? 2 + p : 38 - p; const dir = p < 18 ? 1 : -1;
      rect(g, fx, fy, 2, 1, c); rect(g, fx - dir, fy, 1, 1, c);
    });
    rect(g, 10, 1 + Math.floor((12 - (t * 5) % 9)), 1, 1, '#d8f4ff');
  },
  telescope: (g) => { rect(g, 2, 10, 1, 2, '#555'); rect(g, 9, 10, 1, 2, '#555'); rect(g, 5, 7, 2, 4, '#555'); for (let i = 0; i < 6; i++) rect(g, 3 + i, 8 - i, 2, 2, '#cfcfe0'); rect(g, 9, 1, 2, 2, '#4dc3ff'); },
  sofa: (g) => { rect(g, 0, 0, 36, 4, '#a02a20'); rect(g, 0, 4, 36, 7, '#e04f3f'); rect(g, 0, 0, 3, 11, '#a02a20'); rect(g, 33, 0, 3, 11, '#a02a20'); rect(g, 12, 4, 1, 7, '#c03a2c'); rect(g, 24, 4, 1, 7, '#c03a2c'); },
  console: (g, w, h, t) => { rect(g, 2, 4, 8, 5, '#222'); rect(g, 3, 5, 1, 1, t % 1 < 0.5 ? '#39ff14' : '#0a3a0a'); rect(g, 1, 10, 3, 2, '#444'); rect(g, 8, 10, 3, 2, '#444'); },
  stove: (g, w, h, t) => { rect(g, 0, 0, 12, 12, '#555'); [[3, 3], [9, 3], [3, 8], [9, 8]].forEach(([x, y], i) => disc(g, x, y, 2, i === 0 && t % 0.6 < 0.4 ? '#ff4a1c' : '#333')); },
  tv: (g, w, h, t) => { rect(g, 0, 7, 24, 5, '#333'); rect(g, 2, 0, 20, 8, '#111'); for (let i = 0; i < 18; i++) rect(g, 3 + i, 1 + ((i + Math.floor(t * 8)) % 6), 1, 1, ['#ff4fd8', '#4dc3ff', '#ffd84a'][i % 3]); },
  clock: (g, w, h, t) => { rect(g, 2, 0, 8, 12, '#6b3a1e'); disc(g, 6, 3, 2, '#ffffff'); const now = new Date(); const a = (now.getSeconds() / 60) * 6.28; rect(g, 6 + Math.round(Math.sin(a) * 2), 3 - Math.round(Math.cos(a) * 2), 1, 1, K); rect(g, 6 + Math.round(Math.sin(t * 3) * 1.5), 8, 1, 3, '#d8a520'); },
  bathtub: (g, w, h, t) => { rect(g, 0, 0, 24, 12, '#ffffff'); rect(g, 2, 2, 20, 8, '#8fd8ff'); for (let i = 0; i < 5; i++) disc(g, 5 + i * 3, 4 + Math.round(Math.sin(t * 2 + i)), 1, '#f0fbff'); },
  fridge: (g) => { rect(g, 1, 0, 10, 12, '#e8eef4'); rect(g, 1, 4, 10, 1, '#b8c4cc'); rect(g, 9, 1, 1, 2, '#8a96a0'); rect(g, 9, 6, 1, 3, '#8a96a0'); rect(g, 3, 6, 2, 2, '#ff6fa8'); },
  fireplace: (g, w, h, t) => { rect(g, 0, 0, 24, 12, '#8a8a8a'); for (let i = 0; i < 24; i += 4) rect(g, i, 3, 1, 9, '#6a6a6a'); rect(g, 6, 4, 12, 8, '#1a1010'); for (let i = 0; i < 5; i++) { const fh = 2 + Math.floor(hash(i + Math.floor(t * 10)) * 4); rect(g, 8 + i * 2, 12 - fh, 2, fh, i % 2 ? '#ffb000' : '#ff4a1c'); } },
  computer: (g, w, h, t) => { rect(g, 0, 2, 24, 9, '#b0804a'); rect(g, 6, 0, 12, 7, '#222'); for (let i = 0; i < 4; i++) rect(g, 7, 1 + i, 2 + Math.floor(hash(i + Math.floor(t * 2)) * 9), 1, '#39ff14'); rect(g, 7, 8, 10, 2, '#ddd'); },
  arcade: (g, w, h, t) => { rect(g, 1, 0, 10, 12, '#2a1a6a'); rect(g, 1, 0, 10, 1, '#ff00d4'); rect(g, 2, 2, 8, 5, '#111'); rect(g, 3 + Math.floor(t * 4) % 6, 4, 2, 2, '#ffd84a'); rect(g, 3, 9, 2, 2, '#ff3b5c'); rect(g, 7, 9, 2, 2, '#4dc3ff'); },
  piano: (g, w, h, t, use) => { rect(g, 0, 0, 24, 8, '#151515'); rect(g, 0, 8, 24, 4, '#ffffff'); for (let i = 1; i < 24; i += 3) rect(g, i, 8, 1, 2, '#151515'); if (use) rect(g, 2 + Math.floor(hash(Math.floor(t * 6)) * 20), 10, 2, 2, '#ffd84a'); },
};

// Draw one furniture item into a w x h pixel box (unrotated); `use` is true while the girl uses it.
export function drawFurniture(g, id, w, h, t, use = false) { FURN[id](g, w, h, t, use); }
