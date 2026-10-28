// Garden themes: decorations placed around the garden, how each theme dresses the trees, and what
// moves on top (snow, fireworks, drones, petals). Positions are garden coordinates (256 x 208).
import { disc, ellipse, glow, hash, outlined, rect } from './pixel.js';

const lantern = (g, x, y, t, i, body = '#e82828', trim = '#ffd84a') => {
  const sw = Math.round(Math.sin(t * 2 + i) * 1);
  rect(g, x + sw, y - 3, 1, 3, trim);
  ellipse(g, x + sw, y + 2, 2, 3, body); rect(g, x + sw - 2, y, 5, 1, trim); rect(g, x + sw, y + 5, 1, 2, trim);
  glow(g, x + sw, y + 2, 7, '255,80,40', 0.4);
};
const fanoos = (g, x, y, t, i) => {
  rect(g, x, y - 3, 1, 3, '#c8a020');
  rect(g, x - 2, y, 5, 5, '#c8902a'); rect(g, x - 1, y + 1, 3, 3, ['#ff4f6a', '#4fd8ff', '#ffe14d'][i % 3]);
  rect(g, x - 1, y - 1, 3, 1, '#e8c040'); rect(g, x, y + 5, 1, 2, '#c8902a');
  glow(g, x, y + 2, 7, '255,200,90', 0.35 + Math.sin(t * 3 + i) * 0.05);
};

// Each piece: [x, y (ground), draw(g, x, y, t, i)]
const PIECES = {
  xmas_tree(g, x, y, t) {
    rect(g, x - 1, y - 4, 3, 4, '#5a3420');
    for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) { const half = 2 + j + (3 - i); rect(g, x - half, y - 6 - i * 6 - (6 - j), half * 2 + 1, 1, j % 2 ? '#1f6a3a' : '#2a8a4a'); }
    for (let k = 0; k < 14; k++) rect(g, x - 9 + Math.floor(hash(k) * 18), y - 28 + Math.floor(hash(k + 9) * 22), 1, 1, ['#ff2a2a', '#ffe14d', '#3a8aff', '#ff4fd8'][(k + Math.floor(t * 2)) % 4]);
    rect(g, x - 1, y - 33, 3, 3, '#ffe14d'); glow(g, x, y - 32, 8, '255,225,77', 0.5);
  },
  snowman(g, x, y) {
    disc(g, x, y - 5, 5, '#f4f8ff'); disc(g, x, y - 13, 4, '#ffffff'); rect(g, x - 1, y - 14, 1, 1, '#1a1a1a'); rect(g, x + 1, y - 14, 1, 1, '#1a1a1a');
    rect(g, x, y - 12, 3, 1, '#ff8a1a'); rect(g, x - 3, y - 19, 7, 2, '#1a1a24'); rect(g, x - 2, y - 22, 5, 3, '#1a1a24'); rect(g, x - 4, y - 10, 9, 2, '#d8102e');
  },
  gifts(g, x, y) {
    [[-6, '#d8102e', '#ffd84a'], [1, '#2a8a4a', '#ffffff'], [-2, '#3a6ad8', '#ff4f9a']].forEach(([dx, c, r], i) => {
      const s = 6 - i; const yy = y - (i === 2 ? 11 : 0);
      rect(g, x + dx, yy - s, s + 1, s, c); rect(g, x + dx + Math.floor(s / 2), yy - s, 1, s, r); rect(g, x + dx, yy - s + 2, s + 1, 1, r);
    });
  },
  candy(g, x, y) { for (let j = 0; j < 9; j++) rect(g, x, y - j, 1, 1, j % 2 ? '#ffffff' : '#e81e3a'); rect(g, x + 1, y - 9, 2, 1, '#e81e3a'); rect(g, x + 2, y - 8, 1, 1, '#ffffff'); },
  neon_arch(g, x, y, t) {
    rect(g, x - 14, y - 22, 2, 22, '#2a2a3a'); rect(g, x + 13, y - 22, 2, 22, '#2a2a3a');
    for (let i = -14; i <= 14; i++) rect(g, x + i, y - 24 + Math.round((i * i) / 40), 1, 2, (Math.floor(t * 6) + i) % 6 < 3 ? '#ff4fd8' : '#00e5ff');
    glow(g, x, y - 22, 14, '255,79,216', 0.25);
  },
  billboard(g, x, y, t) {
    rect(g, x - 1, y - 16, 2, 16, '#2a2a3a'); rect(g, x - 12, y - 30, 24, 14, '#0a0a18');
    rect(g, x - 12, y - 30, 24, 1, '#00e5ff'); rect(g, x - 12, y - 17, 24, 1, '#ff4fd8');
    for (let i = 0; i < 4; i++) rect(g, x - 10 + ((Math.floor(t * 12) + i * 6) % 20), y - 27 + i * 3, 4, 1, ['#39ff14', '#ffe14d', '#ff4fd8', '#00e5ff'][i]);
    glow(g, x, y - 23, 14, '0,229,255', 0.25);
  },
  bollard(g, x, y, t, i) { rect(g, x - 1, y - 6, 3, 6, '#1a1a24'); rect(g, x - 1, y - 6, 3, 1, i % 2 ? '#ff4fd8' : '#00e5ff'); glow(g, x, y - 6, 6, i % 2 ? '255,79,216' : '0,229,255', 0.35 + Math.sin(t * 4 + i) * 0.1); },
  lantern_post(g, x, y, t, i) { rect(g, x, y - 16, 1, 16, '#5a1a0a'); rect(g, x - 3, y - 16, 7, 1, '#5a1a0a'); lantern(g, x - 2, y - 13, t, i); lantern(g, x + 3, y - 13, t, i + 1); },
  firecrackers(g, x, y, t) { rect(g, x, y - 24, 1, 4, '#ffd84a'); for (let j = 0; j < 9; j++) { rect(g, x - 1 + (j % 2) * 2, y - 20 + j * 2, 2, 2, '#e81e1e'); rect(g, x - 1 + (j % 2) * 2, y - 20 + j * 2, 2, 1, '#ffd84a'); } },
  fu(g, x, y) {
    rect(g, x, y - 18, 1, 6, '#5a1a0a');
    for (let j = 0; j < 9; j++) { const w = j < 5 ? j : 8 - j; rect(g, x - w, y - 12 + j, w * 2 + 1, 1, '#d81e1e'); }
    rect(g, x - 1, y - 9, 3, 1, '#ffd84a'); rect(g, x, y - 10, 1, 4, '#ffd84a'); rect(g, x - 1, y - 7, 3, 1, '#ffd84a');
  },
  lion_dance(g, x, y, t) {
    const b = Math.round(Math.abs(Math.sin(t * 4)) * 2);
    rect(g, x - 8, y - 6, 12, 4, '#e8c020'); rect(g, x - 8, y - 2, 2, 2, '#1a1a1a'); rect(g, x - 1, y - 2, 2, 2, '#1a1a1a');
    disc(g, x + 6, y - 9 - b, 5, '#e81e1e'); rect(g, x + 4, y - 11 - b, 2, 2, '#ffffff'); rect(g, x + 8, y - 11 - b, 2, 2, '#ffffff');
    rect(g, x + 3, y - 15 - b, 7, 2, '#ffd84a'); rect(g, x + 5, y - 7 - b, 4, 1, '#ffffff');
  },
  fountain(g, x, y, t) {
    ellipse(g, x, y - 2, 9, 3, '#e8e4dc'); ellipse(g, x, y - 2, 7, 2, '#4dc3ff'); rect(g, x - 1, y - 10, 3, 8, '#f0ece4'); ellipse(g, x, y - 10, 4, 1, '#e8e4dc');
    for (let k = 0; k < 8; k++) { const p = (t * 1.2 + k / 8) % 1; rect(g, x + Math.round((k - 3.5) * p * 2), y - 12 - Math.round(Math.sin(p * Math.PI) * 6), 1, 1, '#bff0ff'); }
  },
  topiary(g, x, y, t, i) {
    rect(g, x - 2, y - 4, 5, 4, '#9a5a3a'); rect(g, x, y - 8, 1, 4, '#5a3420');
    if (i % 2) { disc(g, x, y - 12, 5, '#2a7a3a'); disc(g, x - 1, y - 13, 3, '#3a9a4a'); } else for (let j = 0; j < 12; j++) rect(g, x - Math.round((12 - j) / 3), y - 8 - j, Math.round((12 - j) / 1.5) + 1, 1, j % 3 ? '#2a7a3a' : '#3a9a4a');
  },
  statue(g, x, y) {
    rect(g, x - 4, y - 5, 9, 5, '#d8d4cc'); rect(g, x - 4, y - 5, 9, 1, '#ffffff');
    rect(g, x - 2, y - 15, 5, 10, '#ecece8'); disc(g, x, y - 17, 2, '#ecece8'); rect(g, x + 3, y - 15, 1, 6, '#ecece8'); rect(g, x - 1, y - 14, 1, 8, '#c8c4bc');
  },
  urn(g, x, y) { rect(g, x - 3, y - 3, 7, 3, '#c8a020'); ellipse(g, x, y - 7, 3, 4, '#d8b030'); rect(g, x - 2, y - 11, 5, 1, '#e8c040'); disc(g, x, y - 13, 2, '#ff4f9a'); },
  pointed_arch(g, x, y) {
    rect(g, x - 10, y - 18, 3, 18, '#f0e4c8'); rect(g, x + 8, y - 18, 3, 18, '#f0e4c8');
    for (let i = 0; i <= 9; i++) { rect(g, x - 9 + i, y - 18 - Math.round(Math.sqrt(i) * 3), 2, 2, '#f0e4c8'); rect(g, x + 8 - i, y - 18 - Math.round(Math.sqrt(i) * 3), 2, 2, '#f0e4c8'); }
    for (let i = -7; i < 8; i += 3) rect(g, x + i, y - 17, 2, 2, '#1f5aa8');
  },
  octagon_fountain(g, x, y, t) {
    for (let j = 0; j < 6; j++) { const w = j < 2 ? 6 + j : j > 3 ? 11 - j : 8; rect(g, x - w, y - 6 + j, w * 2 + 1, 1, '#1f5aa8'); }
    rect(g, x - 6, y - 4, 13, 2, '#4dc3ff'); rect(g, x, y - 10, 1, 6, '#e8e0c8');
    const k = (t * 2) % 1; rect(g, x, y - 10 - Math.round(k * 4), 1, 1, '#bff0ff');
  },
  date_palm(g, x, y, t) {
    for (let j = 0; j < 22; j++) rect(g, x - 1, y - j, 3, 1, j % 3 ? '#8a6a3a' : '#6a4a22');
    for (let f = 0; f < 7; f++) { const a = (f / 7) * Math.PI * 2 + Math.sin(t) * 0.1; for (let r = 1; r < 10; r++) rect(g, x + Math.round(Math.cos(a) * r), y - 22 + Math.round(Math.sin(a) * r * 0.5 + (r * r) / 25), 1, 1, '#3a8a3a'); }
    rect(g, x - 2, y - 21, 2, 3, '#c87a1a'); rect(g, x + 1, y - 21, 2, 3, '#c87a1a');
  },
  fanoos_post(g, x, y, t, i) { rect(g, x, y - 18, 1, 18, '#6a4a1a'); fanoos(g, x, y - 14, t, i); },
};

// What each theme puts where: [piece, x, ground y]
export const DECOR = {
  christmas: [['xmas_tree', 24, 84], ['xmas_tree', 232, 84], ['snowman', 100, 198], ['gifts', 156, 198], ['candy', 114, 108], ['candy', 142, 108], ['candy', 114, 152], ['candy', 142, 152]],
  cyberpunk: [['neon_arch', 128, 166], ['billboard', 22, 86], ['billboard', 234, 86], ['bollard', 98, 98], ['bollard', 158, 98], ['bollard', 98, 156], ['bollard', 158, 156], ['bollard', 110, 196], ['bollard', 146, 196]],
  cny: [['lantern_post', 98, 98], ['lantern_post', 158, 98], ['firecrackers', 110, 202], ['firecrackers', 146, 202], ['fu', 24, 86], ['fu', 232, 86], ['lion_dance', 100, 196]],
  royal: [['fountain', 26, 98], ['fountain', 230, 98], ['topiary', 96, 104], ['topiary', 160, 104], ['topiary', 96, 158], ['topiary', 160, 158], ['statue', 108, 200], ['statue', 148, 200], ['urn', 60, 98], ['urn', 196, 98]],
  muslim: [['pointed_arch', 128, 170], ['octagon_fountain', 26, 98], ['octagon_fountain', 230, 98], ['date_palm', 20, 84], ['date_palm', 236, 84], ['fanoos_post', 98, 98], ['fanoos_post', 158, 98], ['fanoos_post', 110, 198], ['fanoos_post', 146, 198]],
};

// Decorations as depth-sortable items for the garden.
export function decorItems(g, theme, t) {
  return (DECOR[theme] ?? []).map(([piece, x, y], i) => ({
    y,
    draw: () => outlined(g, x - 18, y - 40, 36, 42, '#0a0612', (sg) => PIECES[piece](sg, 18, 40, t, i)),
  }));
}

// The theme's touch on a grown tree (x, y = trunk base; top = the crown's top).
export function dressTree(g, theme, x, y, t, i) {
  const top = y - 40;
  if (theme === 'christmas') {
    for (let k = -8; k <= 8; k += 2) rect(g, x + k, top + 6 + Math.abs(k) / 2, 2, 1, '#ffffff');  // snow on the crown
    for (let k = 0; k < 8; k++) rect(g, x - 10 + Math.floor(hash(k + i * 9) * 20), top + 10 + Math.floor(hash(k + 3) * 16), 1, 1, ['#ff2a2a', '#ffe14d', '#3a8aff'][(k + Math.floor(t * 2)) % 3]);
    rect(g, x - 1, top - 1, 3, 3, '#ffe14d');
  } else if (theme === 'cyberpunk') {
    for (let a = 0; a < 16; a++) { const r = 12; rect(g, x + Math.round(Math.cos(a / 16 * 6.28 + t) * r), top + 16 + Math.round(Math.sin(a / 16 * 6.28 + t) * 3), 1, 1, a % 2 ? '#00e5ff' : '#ff4fd8'); }
  } else if (theme === 'cny') {
    lantern(g, x - 8, top + 18, t, i); lantern(g, x + 8, top + 16, t, i + 2);
    rect(g, x - 2, y - 14, 4, 2, '#e81e1e');
  } else if (theme === 'royal') {
    for (let k = -9; k <= 9; k += 3) rect(g, x + k, top + 14 + Math.round(Math.sin(k / 3) * 2), 1, 1, (t * 2 + k) % 3 < 2 ? '#ffe14d' : '#c8a020');
    rect(g, x - 3, y - 12, 7, 2, '#c8a020');
  } else if (theme === 'muslim') {
    fanoos(g, x - 9, top + 18, t, i); fanoos(g, x + 9, top + 16, t, i + 1);
  }
}

// What moves above everything: snow, fireworks, drones, drifting lights.
export function weather(g, theme, t, W, H) {
  if (theme === 'christmas') {
    for (let k = 0; k < 60; k++) { const x = (hash(k) * W + Math.sin(t + k) * 6 + t * 4) % W; const y = (hash(k + 100) * H + t * (10 + (k % 5) * 3)) % H; rect(g, x, y, k % 7 ? 1 : 2, 1, '#ffffff'); }
  } else if (theme === 'cny') {
    const n = Math.floor(t / 3);
    const p = (t % 3) / 3;
    const fx = 30 + hash(n) * 196;
    const fy = 10 + hash(n + 7) * 20;
    if (p < 0.6) for (let k = 0; k < 14; k++) { const a = (k / 14) * 6.28; rect(g, fx + Math.cos(a) * p * 26, fy + Math.sin(a) * p * 20 + p * p * 8, 1, 1, ['#ff2a2a', '#ffe14d', '#ff8a1a'][k % 3]); }
  } else if (theme === 'cyberpunk') {
    [0, 1].forEach((i) => {
      const x = (t * (18 + i * 7) + i * 120) % (W + 40) - 20;
      const y = 40 + i * 30 + Math.sin(t * 2 + i) * 4;
      rect(g, x - 3, y, 7, 2, '#2a2a3a'); rect(g, x - 4, y - 1, 2, 1, '#8a8a96'); rect(g, x + 3, y - 1, 2, 1, '#8a8a96');
      if ((t * 3 + i) % 1 < 0.5) rect(g, x, y + 2, 1, 1, i ? '#ff4fd8' : '#00e5ff');
    });
  } else if (theme === 'royal') {
    for (let k = 0; k < 10; k++) { const x = (hash(k) * W + t * 3) % W; const y = 100 + (hash(k + 5) * 100 + Math.sin(t + k) * 4); if ((t + k) % 2 < 1.2) rect(g, x, y, 1, 1, '#ffe14d'); }
  } else if (theme === 'muslim') {
    for (let k = 0; k < 12; k++) { const x = (hash(k) * W + Math.sin(t * 0.5 + k) * 8) % W; const y = 30 + hash(k + 3) * 150 - ((t * 3 + k * 10) % 30); if ((t + k) % 3 < 2) rect(g, x, y, 1, 1, '#ffd890'); }
  }
}
