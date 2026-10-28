// Garden art, drawn in code with whole-pixel rectangles: flower piles, trees with beehives, birds and
// bees, the pool, and the garden ground (neon tiles, floors, and the garbage on the wasteland). Pets
// live in pets.js. Everything takes the time `t` so it can idle-animate.
import { disc, ellipse, glow, hash, icon, outlined, rect, sprite } from './pixel.js';

export { drawPet, PET_SIZE } from './pets.js';

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

// ---------------------------------------------------------------- garden ground: neon tiles, floors and garbage

export const FLOOR_LOOK = {
  lawn: ['#2c7436', '#378442', '#246630', '#5ab85a'], clover: ['#245e30', '#2f7038', '#1c5028', '#7ed06a'],
  gravel: ['#8a8a98', '#a2a2b0', '#70707e', '#c8c8d4'], brick: ['#9a3a24', '#b04a30', '#80301c', '#4a3430'],
  stone: ['#7c7c8c', '#92929e', '#666676', '#30303c'], deck: ['#8e5e32', '#a06c3a', '#734a26', '#40260f'],
  neon: ['#150b28', '#1c1034', '#0e0820', '#00e5ff'],
  base: ['#0b0614', '#0e091a', '#12606e', '#6e1c5c'],  // the bare ground: black tiles, neon blue and pink edges
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
  base(g, x0, y0, w, h, p) {  // 8 px square tiles: blue top / left edge, pink bottom / right edge
    for (let y = y0; y < y0 + h; y += 8) {
      for (let x = x0; x < x0 + w; x += 8) {
        const tw = Math.min(8, x0 + w - x);
        const th = Math.min(8, y0 + h - y);
        rect(g, x, y, tw, th, ((x + y) / 8) % 2 ? p[0] : p[1]);
        rect(g, x, y, tw, 1, p[2]); rect(g, x, y, 1, th, p[2]);
        if (th === 8) rect(g, x + 1, y + 7, tw - 1, 1, p[3]);
        if (tw === 8) rect(g, x + 7, y + 1, 1, th - 1, p[3]);
      }
    }
  },
};

export function drawFloor(g, x0, y0, w, h, floor, seed) {
  PATTERNS[floor](g, x0, y0, w, h, FLOOR_LOOK[floor], seed);
}

// Garbage lying on the wasteland, big enough to tell what it is (x, y = where it touches the ground).
const GARBAGE = {
  bag(g, x, y) {  // a black trash bag tied at the top
    ellipse(g, x, y - 5, 6, 5, '#1c1828'); ellipse(g, x - 1, y - 6, 4, 3, '#2c2640');
    rect(g, x - 3, y - 8, 2, 2, '#4a4468'); rect(g, x - 1, y - 12, 3, 2, '#1c1828'); rect(g, x - 3, y - 13, 2, 2, '#2c2640'); rect(g, x + 2, y - 13, 2, 2, '#2c2640');
    rect(g, x + 2, y - 4, 2, 1, '#0e0a16');
  },
  tire(g, x, y) {  // an old tire standing on its edge
    disc(g, x, y - 6, 6, '#141418'); disc(g, x, y - 6, 2, '#0b0614');
    for (let k = 0; k < 8; k++) rect(g, x + Math.round(Math.cos(k * 0.785) * 5), y - 6 + Math.round(Math.sin(k * 0.785) * 5), 1, 1, '#4a4a56');
    disc(g, x, y - 6, 3, '#5a5a66'); disc(g, x, y - 6, 1, '#0b0614');
  },
  barrel(g, x, y) {  // a rusty oil drum
    rect(g, x - 4, y - 12, 9, 12, '#9a4a22'); rect(g, x - 4, y - 12, 2, 12, '#c8703a'); rect(g, x + 3, y - 12, 2, 12, '#6a2e14');
    [y - 12, y - 7, y - 2].forEach((ry) => rect(g, x - 4, ry, 9, 1, '#5a2410'));
    ellipse(g, x, y - 12, 4, 1, '#7a3818'); rect(g, x - 1, y - 9, 3, 3, '#ffd21f'); rect(g, x, y - 8, 1, 1, '#1a1a1a');
  },
  box(g, x, y) {  // a soggy cardboard box with tape
    rect(g, x - 6, y - 8, 12, 8, '#a87a44'); rect(g, x - 6, y - 10, 12, 3, '#c89a5e');
    rect(g, x - 1, y - 10, 2, 10, '#e8d8a0'); rect(g, x - 8, y - 12, 3, 3, '#c89a5e'); rect(g, x + 4, y - 4, 2, 1, '#6a4a22');
  },
  tv: (g, x, y) => {  // a broken TV with a cracked screen
    rect(g, x - 7, y - 11, 14, 11, '#5a5a66'); rect(g, x - 6, y - 10, 10, 8, '#16202e');
    [[-4, -9], [-3, -8], [-2, -6], [-1, -5], [0, -4], [1, -6], [2, -7]].forEach(([dx, dy]) => rect(g, x + dx, y + dy, 1, 1, '#c8d8e8'));
    rect(g, x + 5, y - 9, 1, 1, '#ff2a6d'); rect(g, x + 5, y - 6, 1, 1, '#8a8a96');
    rect(g, x - 3, y - 14, 1, 3, '#8a8a96'); rect(g, x + 2, y - 15, 1, 4, '#8a8a96'); rect(g, x - 4, y - 15, 1, 1, '#8a8a96'); rect(g, x + 3, y - 16, 1, 1, '#8a8a96');
  },
  cans(g, x, y) {  // crushed cans and a bottle
    rect(g, x - 6, y - 3, 4, 3, '#d82a2a'); rect(g, x - 6, y - 3, 4, 1, '#e8e8f0');
    rect(g, x - 1, y - 2, 3, 2, '#c8c8d4'); rect(g, x - 1, y - 2, 1, 2, '#2a6ad8');
    rect(g, x + 3, y - 3, 6, 2, '#2a8a4a'); rect(g, x + 9, y - 3, 2, 1, '#2a8a4a'); rect(g, x + 4, y - 3, 2, 1, '#7ad89a');
  },
  pipes(g, x, y) {  // a pile of scrap pipes
    [[-7, -3], [-5, -6], [-3, -9]].forEach(([dx, dy], i) => {
      rect(g, x + dx, y + dy, 13, 3, i % 2 ? '#7a7a86' : '#8a8a98'); rect(g, x + dx, y + dy, 13, 1, '#b8b8c8');
      disc(g, x + dx + 12, y + dy + 1, 1, '#2a2a34'); rect(g, x + dx + 3, y + dy + 1, 2, 1, '#9a4a22');
    });
  },
  chair(g, x, y) {  // a broken chair on its side
    rect(g, x - 6, y - 4, 10, 3, '#7a4a22'); rect(g, x - 6, y - 4, 10, 1, '#a8703c');
    rect(g, x + 3, y - 11, 3, 10, '#6a3e1c'); rect(g, x - 5, y - 1, 2, 1, '#4a2a10'); rect(g, x + 1, y - 1, 2, 1, '#4a2a10');
    rect(g, x - 6, y - 7, 1, 3, '#6a3e1c'); rect(g, x - 2, y - 6, 1, 2, '#6a3e1c');
  },
};
export const GARBAGE_KINDS = Object.keys(GARBAGE);
export function drawGarbage(g, kind, x, y) {
  x = Math.round(x);
  y = Math.round(y);
  ellipse(g, x, y, 7, 2, 'rgba(0,0,0,0.45)');
  outlined(g, x - 12, y - 18, 24, 19, '#05020a', (sg) => GARBAGE[kind](sg, 12, 18));
}
