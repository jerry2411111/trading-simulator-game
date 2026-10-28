// Water life: fish for the house fish tank and the aquarium, sea animals, penguins and seals on the
// ice land, and the aquarium itself (side view). (x, y) is the middle of an animal; `dir` 1 faces right.
import { disc, ellipse, glow, hash, outlined, rect } from './pixel.js';

function mirror(g, x, y, d) {
  return {
    R: (dx, dy, w, h, c) => rect(g, d > 0 ? x + dx : x - dx - w + 1, y + dy, w, h, c),
    E: (dx, dy, rx, ry, c) => ellipse(g, x + dx * d, y + dy, rx, ry, c),
  };
}

// body, shade, fin, accent, pattern, length, height
const FISH = {
  guppy: ['#9ab0c8', '#6a809a', '#ff8a2a', '#3fa8ff', 'tailfan', 6, 3],
  danio: ['#d8dce8', '#9aa0b0', '#c8ccd8', '#2a4ab8', 'lines', 7, 3],
  tetra: ['#c8d0e0', '#8890a8', '#d8e0f0', '#00d8ff', 'neon', 5, 2],
  goldfish: ['#ff8a1c', '#c85a0c', '#ffb050', '#fff0d0', 'fan', 7, 5],
  molly: ['#2a2a34', '#14141a', '#3a3a48', '#6a6a7a', 'plain', 7, 4],
  betta: ['#3a4ae0', '#20289a', '#e02a5a', '#8fa0ff', 'flowing', 6, 4],
  clownfish: ['#ff7a1a', '#c8500a', '#ff9a3a', '#ffffff', 'bands', 7, 4],
  angelfish: ['#d8d8e0', '#a0a0b0', '#e8e8f0', '#1a1a22', 'angel', 6, 8],
  puffer: ['#d8b860', '#a88838', '#e8d090', '#5a4018', 'spots', 7, 6],
  tang: ['#2a5ae8', '#14309a', '#ffd21f', '#0a0a20', 'tang', 8, 5],
  discus: ['#e8402a', '#a02414', '#30d0c8', '#30d0c8', 'disc', 8, 7],
  koi: ['#f4f0e8', '#c8c0b0', '#f4f0e8', '#e8301a', 'koi', 10, 4],
};

// A fish; `tiny` draws the 3-4 pixel version used in the house fish tank.
export function drawFish(g, type, x, y, dir, t, tiny = false) {
  const [body, shade, fin, acc, pat, len, ht] = FISH[type];
  x = Math.round(x);
  y = Math.round(y);
  if (tiny) {
    const { R } = mirror(g, x, y, dir);
    R(0, 0, 3, 2, body); R(0, 1, 3, 1, shade); R(-1, 0, 1, 2, fin); R(2, 0, 1, 1, '#0a0a14');
    if (pat === 'bands' || pat === 'neon' || pat === 'koi') R(1, 0, 1, 1, acc);
    return;
  }
  const { R, E } = mirror(g, x, y, dir);
  const flap = Math.round(Math.sin(t * 8 + x) * 1);
  const hl = Math.floor(len / 2);
  const hh = Math.floor(ht / 2);
  const tail = pat === 'fan' || pat === 'tailfan' || pat === 'flowing' ? 3 : 2;
  R(-hl - tail, -hh + flap, tail, ht + (pat === 'flowing' ? 3 : 0), fin);  // tail
  if (pat === 'flowing' || pat === 'angel') { R(-hl + 1, -hh - 3, len - 2, 3, fin); R(-hl + 1, hh + 1, len - 3, pat === 'angel' ? 4 : 3, fin); }
  E(0, 0, hl, hh, body);
  E(0, 1, hl - 1, Math.max(0, hh - 1), shade);
  E(0, -1, hl - 1, Math.max(0, hh - 1), body);
  R(-hl + 1, -hh, len - 3, 1, 'rgba(255,255,255,0.35)');
  if (pat === 'lines') { R(-hl, -1, len, 1, acc); R(-hl, 1, len, 1, acc); }
  if (pat === 'neon') { R(-hl, -1, len, 1, acc); R(-hl, 0, hl, 1, '#ff2a4a'); }
  if (pat === 'bands') [-2, 1].forEach((dx) => { R(dx, -hh, 1, ht, acc); R(dx - 1, -hh, 1, ht, '#1a1a1a'); });
  if (pat === 'angel') [-2, 1].forEach((dx) => R(dx, -hh - 2, 1, ht + 4, acc));
  if (pat === 'spots') for (let i = 0; i < 4; i++) R(-hl + 1 + i * 2, -1 + (i % 2) * 2, 1, 1, acc);
  if (pat === 'tang') { R(-1, -hh + 1, 4, 1, acc); R(-hl, -1, 2, 2, acc); }
  if (pat === 'disc') for (let j = -hh + 1; j < hh; j += 2) R(-hl + 1, j, len - 2, 1, acc);
  if (pat === 'koi') { R(-2, -hh, 3, 2, acc); R(1, 0, 2, 2, acc); R(hl - 1, -1, 1, 1, acc); }
  R(hl - 2, -1, 1, 1, '#0a0a14');
  if (pat === 'tailfan' || pat === 'flowing') R(-hl - tail, -hh + flap, 1, ht, acc);
}
export const FISH_TYPES = Object.keys(FISH);

// ---------------------------------------------------------------- sea animals

const SEA = {
  starfish(g, x, y, dir, t) {
    const a0 = t * 0.1;
    for (let k = 0; k < 5; k++) {
      const a = a0 + (k * Math.PI * 2) / 5 - Math.PI / 2;
      for (let r = 1; r <= 4; r++) rect(g, x + Math.round(Math.cos(a) * r), y + Math.round(Math.sin(a) * r), r < 3 ? 2 : 1, r < 3 ? 2 : 1, r < 4 ? '#ff7a3a' : '#ffb07a');
    }
    disc(g, x, y, 1, '#ffd0a0');
  },
  seahorse(g, x, y, dir, t) {
    const { R } = mirror(g, x, Math.round(y + Math.sin(t * 1.5) * 1.5), dir);
    const c = '#f0c03a';
    const d = '#b8861c';
    R(0, -6, 3, 2, c); R(3, -5, 2, 1, c); R(1, -6, 1, 1, '#1a1a1a');  // head and snout
    R(-1, -4, 3, 6, c); R(1, -4, 1, 6, d); R(-2, -3, 1, 3, Math.floor(t * 10) % 2 ? '#ffe8a0' : c);  // body, fluttering fin
    R(0, 2, 2, 2, c); R(1, 4, 2, 1, d); R(2, 3, 1, 1, d);              // curled tail
  },
  jellyfish(g, x, y, dir, t) {
    const p = Math.sin(t * 3) * 0.5 + 0.5;
    glow(g, x, y, 10, '255,120,220', 0.4);
    ellipse(g, x, y, 5 + Math.round(p), 3, 'rgba(255,150,230,0.8)');
    rect(g, x - 5, y, 11, 1, 'rgba(255,200,240,0.9)');
    rect(g, x - 2, y - 2, 2, 1, '#ffffff');
    for (let k = 0; k < 4; k++) for (let j = 1; j < 9; j++) rect(g, x - 3 + k * 2 + Math.round(Math.sin(t * 3 + j * 0.6 + k)), y + j, 1, 1, `rgba(255,170,230,${0.9 - j * 0.08})`);
  },
  lionfish(g, x, y, dir, t) {
    const { R, E } = mirror(g, x, y, dir);
    for (let k = 0; k < 6; k++) { R(-4 + k * 2, -7 + (k % 2), 1, 4, '#f4e8e0'); R(-4 + k * 2, 3, 1, 3 + (k % 2), '#d83a2a'); }
    R(-8, -2 + Math.round(Math.sin(t * 6)), 3, 4, '#f4e8e0');
    E(0, 0, 5, 3, '#d83a2a');
    for (let k = -4; k <= 4; k += 2) R(k, -3, 1, 6, '#f4e8e0');
    R(4, -1, 1, 1, '#0a0a14');
  },
  eel(g, x, y, dir, t) {
    for (let i = 0; i < 18; i++) {
      const sx = x - dir * i;
      const sy = y + Math.round(Math.sin(t * 3 - i * 0.5) * 2);
      rect(g, sx, sy - 1, 1, 3, i % 4 ? '#3a8a3a' : '#2a6a2a');
      if (i % 3 === 1) rect(g, sx, sy - 1, 1, 1, '#9ad86a');
    }
    const { R } = mirror(g, x, y + Math.round(Math.sin(t * 3) * 2), dir);
    R(0, -2, 4, 4, '#4a9a3a'); R(2, -2, 1, 1, '#ffe14d');
    if (Math.floor(t * 1.5) % 2) R(3, 1, 2, 1, '#8a1a2a');
  },
  octopus(g, x, y, dir, t) {
    const hue = ['#a83ad8', '#d84a6a', '#c88a4a'][Math.floor(t / 6) % 3];
    for (let k = 0; k < 6; k++) for (let j = 0; j < 6; j++) rect(g, x - 5 + k * 2 + Math.round(Math.sin(t * 2 + k + j * 0.7) * (j / 3)), y + 2 + j, 1, 1, hue);
    ellipse(g, x, y - 2, 4, 4, hue); rect(g, x - 2, y - 5, 2, 1, 'rgba(255,255,255,0.4)');
    rect(g, x - 2, y - 1, 1, 2, '#ffffff'); rect(g, x + 1, y - 1, 1, 2, '#ffffff'); rect(g, x - 2, y, 1, 1, '#0a0a14'); rect(g, x + 1, y, 1, 1, '#0a0a14');
  },
  sea_turtle(g, x, y, dir, t) {
    const { R, E } = mirror(g, x, y, dir);
    const s = Math.round(Math.sin(t * 2) * 2);
    R(2, -5 + s, 4, 2, '#7ab05a'); R(2, 3 - s, 4, 2, '#7ab05a'); R(-6, -3 - s, 3, 2, '#7ab05a'); R(-6, 2 + s, 3, 2, '#7ab05a');
    E(0, 0, 6, 4, '#3a6a2a'); E(-1, -1, 4, 2, '#5a8a3a');
    for (let k = -4; k <= 3; k += 3) R(k, -1, 2, 2, '#2a4a1a');
    R(6, -1, 3, 3, '#7ab05a'); R(8, -1, 1, 1, '#0a0a14');
  },
  manta(g, x, y, dir, t) {
    const f = Math.round(Math.sin(t * 2) * 3);
    for (let i = -11; i <= 11; i++) {
      const h = Math.max(1, 4 - Math.floor(Math.abs(i) / 3));
      const yy = y + Math.round((Math.abs(i) / 11) * f);
      rect(g, x + i, yy - h, 1, h * 2, '#2a3044');
      rect(g, x + i, yy + h - 1, 1, 1, '#d8dce8');
    }
    const { R } = mirror(g, x, y, dir);
    R(-12, 0, 10, 1, '#2a3044'); R(4, -2, 1, 1, '#0a0a14'); R(5, 1, 2, 1, '#3a4058');
  },
  shark(g, x, y, dir, t) {
    const { R, E } = mirror(g, x, y, dir);
    const s = Math.round(Math.sin(t * 4) * 2);
    R(-14, -4 + s, 3, 4, '#6a7888'); R(-14, 1 + s, 3, 3, '#6a7888');
    E(0, 0, 11, 4, '#7a8898'); E(0, 2, 9, 2, '#e8ecf0'); R(-8, -3, 14, 1, '#9aa8b8');
    R(-3, -8, 4, 4, '#6a7888'); R(-2, -9, 2, 1, '#6a7888');
    R(1, 3, 4, 3, '#6a7888');
    for (let k = 0; k < 3; k++) R(5 + k, -1, 1, 2, '#4a5868');
    R(8, -2, 1, 1, '#0a0a14'); R(9, 1, 2, 1, '#3a4048');
  },
  whale(g, x, y, dir, t) {
    const { R, E } = mirror(g, x, y, dir);
    const s = Math.round(Math.sin(t * 1.2) * 2);
    R(-26, -6 + s, 4, 3, '#2a4a8a'); R(-26, 2 - s, 4, 3, '#2a4a8a'); R(-22, -2, 3, 4, '#2a4a8a');
    E(0, 0, 20, 7, '#3a5aa8'); E(2, 3, 17, 4, '#a8c0e0');
    for (let k = -12; k < 16; k += 3) R(k, 4, 1, 3, '#7a98c8');
    R(-14, -6, 28, 1, '#5a7ac8'); R(14, -1, 1, 1, '#0a0a14'); R(2, 6, 6, 3, '#2a4a8a');
    if ((t * 0.3) % 1 < 0.3) for (let k = 0; k < 3; k++) disc(g, x + dir * 8 + k, y - 10 - k * 3 - Math.floor(((t * 0.3) % 1) * 20), 1, '#bfe8ff');
  },
};

// ---------------------------------------------------------------- ice land animals (x, y = feet or middle when swimming)

const ICE = {
  penguin(g, x, y, dir, t, pose) {
    const { R } = mirror(g, x, y, dir);
    if (pose === 'swim' || pose === 'slide') {
      R(-5, -3, 9, 4, '#1a1a24'); R(-4, -1, 7, 2, '#f4f4f8'); R(4, -3, 2, 1, '#ff9a1a'); R(2, -3, 1, 1, '#ffffff');
      R(-6, -2 + Math.round(Math.sin(t * 10)), 2, 1, '#ff9a1a');
      return;
    }
    const w = Math.round(Math.sin(t * 8) * (pose === 'walk' ? 1 : 0));
    R(-2 + w, -9, 5, 9, '#1a1a24'); R(-1 + w, -7, 3, 6, '#f4f4f8'); R(0 + w, -9, 2, 1, '#2a2a34');
    R(1 + w, -8, 1, 1, '#ffffff'); R(3 + w, -7, 2, 1, '#ff9a1a');
    R(-3 + w, -6 + (pose === 'flap' && Math.floor(t * 8) % 2 ? -2 : 0), 1, 4, '#1a1a24');
    R(-1, 0, 2, 1, '#ff9a1a'); R(1, 0, 2, 1, '#ff9a1a');
  },
  seal(g, x, y, dir, t, pose) {
    const { R, E } = mirror(g, x, y, dir);
    const b = pose === 'flop' ? -Math.abs(Math.round(Math.sin(t * 6) * 2)) : 0;
    R(-9, -2 + b, 3, 2, '#7a8494');
    E(0, -3 + b, 7, 3, '#8a94a4'); E(0, -2 + b, 5, 1, '#c8ccd4');
    for (let k = -4; k < 4; k += 3) R(k, -5 + b, 1, 1, '#5a6474');
    E(6, -5 + b, 3, 3, '#8a94a4'); R(7, -6 + b, 1, 1, '#0a0a14'); R(9, -5 + b, 1, 1, '#2a2a34'); R(8, -4 + b, 2, 1, '#c8ccd4');
    R(2, -1 + b, 3, 1, '#6a7484');
  },
  sea_dog(g, x, y, dir, t, pose) {
    const { R, E } = mirror(g, x, y, dir);
    if (pose === 'swim') { E(0, -2, 7, 2, '#6a4a30'); R(6, -4, 3, 3, '#6a4a30'); R(7, -4, 1, 1, '#0a0a14'); R(-8, -2, 2, 2, '#5a3a20'); return; }
    R(-7, -1, 3, 1, '#5a3a20');
    E(-1, -3, 5, 3, '#6a4a30');
    R(1, -10, 4, 7, '#7a5a3a'); R(2, -9, 2, 5, '#9a7a52');            // sits up proudly
    E(4, -11, 3, 2, '#7a5a3a'); R(6, -11, 1, 1, '#0a0a14'); R(7, -10, 1, 1, '#2a2a34'); R(2, -12, 1, 1, '#5a3a20');
    R(5, -9, 3, 1, '#d8c8a8');
    if (pose === 'bark' && Math.floor(t * 6) % 2) R(7, -9, 2, 1, '#8a1a2a');
    const clap = pose === 'clap' && Math.floor(t * 6) % 2 ? 1 : 0;
    R(3 + clap, -6, 3, 1, '#5a3a20'); R(0 - clap, -6, 2, 1, '#5a3a20');
  },
};

export function drawSea(g, type, x, y, dir, t, pose = 'swim') {
  x = Math.round(x);
  y = Math.round(y);
  if (FISH[type]) return outlined(g, x - 16, y - 10, 32, 20, '#06101c', (sg) => drawFish(sg, type, 16, 10, dir, t));
  if (type === 'jellyfish') return SEA.jellyfish(g, x, y, dir, t);  // see-through: no outline
  const size = type === 'whale' ? [64, 32] : [36, 30];
  const draw = SEA[type] ? (sg) => SEA[type](sg, size[0] / 2, size[1] / 2, dir, t) : (sg) => ICE[type](sg, size[0] / 2, size[1] / 2, dir, t, pose);
  outlined(g, x - size[0] / 2, y - size[1] / 2, size[0], size[1], '#06101c', draw);
}

// ---------------------------------------------------------------- the aquarium (side view)

export const AQ = { w: 256, h: 176, surface: 26, sand: 150, ice: { x0: 172, top: 16, base: 30 } };

export function drawAquarium(g, t, iceland, animals) {
  const { w, h, surface, sand } = AQ;
  rect(g, 0, 0, w, surface, '#0a0618');                         // dark hall above the water
  for (let i = 8; i < w; i += 32) { rect(g, i, 0, 14, 2, '#3a2a5a'); rect(g, i + 2, 2, 10, 1, '#00e5ff'); glow(g, i + 7, 3, 10, '0,229,255', 0.3); }
  for (let j = surface; j < h; j += 4) {
    const k = (j - surface) / (h - surface);
    rect(g, 0, j, w, 4, `rgb(${Math.round(20 - k * 14)},${Math.round(110 - k * 70)},${Math.round(190 - k * 90)})`);
  }
  for (let i = 0; i < 5; i++) {                                 // light rays
    const x0 = ((i * 61 + t * 4) % (w + 60)) - 30;
    for (let j = surface; j < sand; j += 2) rect(g, x0 + (j - surface) * 0.3, j, 6, 2, 'rgba(160,230,255,0.05)');
  }
  for (let i = 0; i < w; i++) rect(g, i, surface + Math.round(Math.sin(i / 6 + t * 2)), 1, 1, '#9fe8ff');  // surface waves
  rect(g, 0, sand, w, h - sand, '#d8c08a');                     // sand, shells and rocks
  for (let i = 0; i < w; i += 3) rect(g, i, sand - Math.round(Math.sin(i / 14) * 2), 3, 2, '#e8d4a0');
  for (let i = 0; i < 40; i++) rect(g, Math.floor(hash(i) * w), sand + 4 + Math.floor(hash(i + 9) * (h - sand - 5)), 1, 1, i % 3 ? '#b8a070' : '#ffffff');
  [[20, 8], [212, 6]].forEach(([sx, r]) => { ellipse(g, sx, sand - 2, r + 6, r, '#4a4a5a'); ellipse(g, sx - 2, sand - 4, r + 3, r - 2, '#6a6a7a'); ellipse(g, sx + 4, sand, 4, 3, '#0a0a14'); });  // rocks; the right one is the eel's cave
  [[60, '#ff4f9a'], [100, '#ff8a2a'], [150, '#b04fff'], [186, '#00e5c8']].forEach(([cx, c], i) => {  // glowing corals
    for (let k = 0; k < 5; k++) rect(g, cx - 4 + k * 2, sand - 4 - Math.floor(hash(i * 5 + k) * 10), 1, 4 + Math.floor(hash(i * 5 + k) * 10), c);
    rect(g, cx - 5, sand - 3, 11, 3, c);
    glow(g, cx, sand - 6, 12, '255,100,200', 0.15);
  });
  [36, 44, 128, 136, 240].forEach((kx, i) => {                 // kelp
    for (let j = 0; j < 50 + (i % 2) * 20; j++) rect(g, kx + Math.round(Math.sin(t * 1.2 + j * 0.15 + i) * (j / 18)), sand - j, 2, 1, j % 6 < 3 ? '#2a8a3a' : '#3aa04a');
  });
  rect(g, 84, sand - 10, 22, 10, '#5a3a20'); rect(g, 84, sand - 10, 22, 2, '#7a5030'); rect(g, 100, sand - 18, 2, 10, '#5a3a20');  // sunken ship
  rect(g, 90, sand - 7, 3, 3, '#ffd84a');
  for (let i = 0; i < 12; i++) {                                // bubbles
    const bx = [30, 92, 141, 220][i % 4] + Math.round(Math.sin(t * 2 + i) * 2);
    const by = sand - ((t * 18 + i * 37) % (sand - surface));
    rect(g, bx, by, 1 + (i % 2), 1 + (i % 2), '#d8f8ff');
  }
  if (iceland) {
    const { x0, top, base } = AQ.ice;
    rect(g, x0, top, w - x0, base - top, '#e8f4ff');            // the ice floe above water
    rect(g, x0, top, w - x0, 2, '#ffffff');
    for (let i = x0 + 6; i < w; i += 18) ellipse(g, i, top, 6, 2, '#ffffff');
    rect(g, x0, base, w - x0, 44, 'rgba(200,236,255,0.55)');    // ice below the waterline
    for (let i = x0; i < x0 + 8; i += 2) rect(g, i, base + Math.floor(hash(i) * 10), 2, 34 + Math.floor(hash(i + 1) * 10), 'rgba(220,244,255,0.6)');
    for (let i = x0 + 4; i < w; i += 7) rect(g, i, base + 44, 1, 3 + Math.floor(hash(i) * 5), '#d8f0ff');  // icicles
    rect(g, x0 + 30, top - 8, 12, 8, '#ffffff'); rect(g, x0 + 32, top - 6, 8, 6, '#c8e4f8'); rect(g, x0 + 35, top - 3, 2, 3, '#4a6a8a');  // igloo
  }
  rect(g, 0, 0, 3, h, '#2a2a3a'); rect(g, w - 3, 0, 3, h, '#2a2a3a'); rect(g, 0, h - 3, w, 3, '#2a2a3a');  // the glass frame
  rect(g, 3, surface, 1, sand - surface, 'rgba(255,255,255,0.15)');
}
