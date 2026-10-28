// Building art: house exteriors for the garden, interiors (walls, windows, floors, inner walls) and
// furniture. Top-down 3/4 view: tops of things are lit, fronts are darker, everything has an outline.
import { drawFish } from './sea.js';
import { disc, ellipse, glow, hash, outlined, rect } from './pixel.js';

const INK = '#120c1c';
const W = ['#c8904c', '#a8703c', '#6a4020', '#40240e'];  // wood: light, mid, dark, deepest
const lamp = (t, k = 0) => (Math.sin(t * 3 + k) > -0.9 ? '#ffe9a8' : '#c8a868');  // a warm light that flickers now and then

function shingles(g, x, y, w, h, [base, dark, light], step = 3) {
  rect(g, x, y, w, h, base);
  for (let j = 0; j < h; j += step) {
    rect(g, x, y + j + step - 1, w, 1, dark);
    for (let i = (j / step) % 2 ? 0 : 2; i < w; i += 4) rect(g, x + i, y + j, 1, step - 1, dark);
    rect(g, x, y + j, w, 1, light);
  }
}

function windowLit(g, x, y, w, h, frame, t, k = 0, glass = '#ffd58a') {
  rect(g, x - 1, y - 1, w + 2, h + 2, frame);
  rect(g, x, y, w, h, Math.sin(t * 0.7 + k * 3) > -0.95 ? glass : '#c89a50');
  rect(g, x, y, w, 1, '#fff4d0');
  rect(g, x + Math.floor(w / 2), y, 1, h, frame);
  if (h > 5) rect(g, x, y + Math.floor(h / 2), w, 1, frame);
}

// ---------------------------------------------------------------- exteriors (x, y = door step); return width

// ---------------------------------------------------------------- exteriors (x, y = door step)
// Better houses are wider: the European palace fills the whole garden.

export const HOUSE_W = { shack: 64, modern: 112, euro: 112, villa: 176, tower: 176, palace_cn: 208, palace_eu: 240, church: 200, palace_gold: 240 };

function plants(g, x, y) { rect(g, x, y - 5, 8, 5, '#3a3a44'); rect(g, x, y - 5, 8, 1, '#5a5a66'); disc(g, x + 4, y - 8, 4, '#2a7a3c'); disc(g, x + 3, y - 9, 2, '#45a34c'); rect(g, x + 2, y - 10, 1, 1, '#9be07a'); }
function lantern(g, x, y, t, i) { rect(g, x - 1, y - 4, 3, 4, '#1a1a22'); rect(g, x, y - 3, 1, 2, lamp(t, i)); glow(g, x, y - 2, 9, '255,200,120', 0.4); }

const HOUSES = {
  shack(g, x, y, t) {
    const L = x - 32;
    const T = y - 36;
    rect(g, L, T, 64, 36, '#76767e');                        // concrete block walls
    for (let j = 0; j < 36; j += 5) {
      rect(g, L, T + j, 64, 1, '#5a5a64');
      for (let i = (j / 5) % 2 ? 0 : 6; i < 64; i += 12) rect(g, L + i, T + j, 1, 5, '#5a5a64');
    }
    [[6, 20, 7, 9], [44, 26, 9, 8], [22, 4, 6, 6]].forEach(([dx, dy, w, h]) => rect(g, L + dx, T + dy, w, h, '#64646e'));  // stains
    [[12, 8], [50, 14], [30, 22]].forEach(([dx, dy]) => { for (let k = 0; k < 6; k++) rect(g, L + dx + (k % 2), T + dy + k, 1, 1, '#2a2a32'); });  // cracks
    rect(g, L - 4, T - 6, 72, 6, '#7a4a2e');                 // rusty corrugated roof
    for (let i = 0; i < 72; i += 2) rect(g, L - 4 + i, T - 6, 1, 6, '#a0603a');
    rect(g, L - 4, T, 72, 1, '#2a1a12');
    rect(g, L + 8, T - 8, 16, 3, '#2a5aa8'); rect(g, L + 8, T - 8, 16, 1, '#4a82d0');  // tarp patch
    ellipse(g, L + 30, T - 6, 4, 2, '#18181e'); ellipse(g, L + 30, T - 6, 2, 1, '#3a3a44');  // tire holding the roof down
    rect(g, L + 50, T - 14, 1, 8, '#9a9aa8'); ellipse(g, L + 52, T - 15, 4, 3, '#c8c8d4'); rect(g, L + 52, T - 15, 1, 1, '#ff2a6d');  // dish
    rect(g, x - 6, y - 21, 12, 21, '#3a4448');                // dented metal door
    rect(g, x - 5, y - 20, 10, 19, '#5a6a6e');
    rect(g, x - 5, y - 14, 10, 1, '#4a585c'); rect(g, x - 2, y - 8, 4, 3, '#6e8084');
    rect(g, x + 3, y - 11, 1, 2, '#c8c8d0');
    rect(g, x - 8, y - 1, 16, 1, '#9a9aa4');
    const on = lamp(t) === '#ffe9a8';
    rect(g, x - 7, y - 25, 14, 2, on ? '#7ff8ff' : '#2a6a70');  // flickering tube light
    if (on) glow(g, x, y - 20, 14, '0,229,255', 0.35);
    windowLit(g, L + 7, T + 12, 10, 8, '#2a2a32', t, 1);      // barred window
    for (let i = 0; i < 10; i += 3) rect(g, L + 7 + i, T + 12, 1, 8, '#2a2a32');
    rect(g, L + 45, T + 11, 12, 10, '#1a1418');               // boarded window
    rect(g, L + 44, T + 12, 14, 3, '#8a6a3a'); rect(g, L + 44, T + 17, 14, 3, '#7a5a30');
    rect(g, L + 63, T - 1, 2, 37, '#5a5a62');                 // drain pipe, dripping
    const drip = (t * 9) % 12;
    if (drip < 8) rect(g, L + 63, y - 1 + Math.floor(drip / 4), 1, 1, '#7fd8ff');
    rect(g, L + 26, T + 6, 9, 6, '#a8a8b0'); disc(g, L + 30, T + 9, 2, '#5a5a62');  // AC unit with a turning fan
    rect(g, L + 30 + Math.round(Math.cos(t * 9) * 2), T + 9 + Math.round(Math.sin(t * 9) * 2), 1, 1, '#e8e8f0');
    rect(g, L + 2, y - 5, 5, 5, '#5a6a8a'); rect(g, L + 3, y - 8, 3, 3, '#3a8a3a');  // bucket plant
  },

  modern(g, x, y, t) {
    const w = HOUSE_W.modern;
    const L = x - w / 2;
    const T = y - 50;
    rect(g, L, T + 12, 42, 38, '#e8e8ee');                    // white plaster volume
    for (let j = 16; j < 50; j += 8) rect(g, L, T + j, 42, 1, '#d4d4dc');
    rect(g, L + 42, T, w - 42, 50, '#8e5e34');                // wood-clad volume
    for (let i = 0; i < w - 42; i += 3) rect(g, L + 42 + i, T, 1, 50, '#734a26');
    rect(g, L - 2, T + 10, 46, 3, '#26262e'); rect(g, L + 40, T - 2, w - 38, 3, '#26262e');
    const led = 0.6 + Math.sin(t * 2) * 0.2;
    rect(g, L - 2, T + 13, 46, 1, `rgba(0,229,255,${led})`); rect(g, L + 40, T + 1, w - 38, 1, `rgba(0,229,255,${led})`);
    const gx = L + 48;
    const gw = w - 56;
    rect(g, gx - 1, T + 7, gw + 2, 26, '#1c2c40');            // panorama glass with a warm room inside
    rect(g, gx, T + 8, gw, 24, '#3a5674');
    for (let i = 0; i < gw - 10; i += 18) { rect(g, gx + 3 + i, T + 18, 13, 14, i % 36 ? '#ffcb70' : '#ffd58a'); rect(g, gx + 5 + i, T + 24, 8, 3, '#c0603a'); }
    for (let k = 0; k < 3; k++) { const s = Math.floor((t * 7 + k * 21) % (gw + 30)) - 15; for (let j = 0; j < 24; j++) if (s + j > 0 && s + j < gw) rect(g, gx + s + j, T + 8 + j, 1, 1, 'rgba(255,255,255,0.22)'); }
    for (let i = 0; i < gw; i += 10) rect(g, gx + i, T + 8, 1, 24, '#1c2c40');
    rect(g, gx, T + 38, gw, 2, '#c8d0dc'); for (let i = 0; i < gw; i += 4) rect(g, gx + i, T + 36, 1, 2, '#c8d0dc');  // glass railing
    windowLit(g, L + 6, T + 20, 12, 12, '#26262e', t, 2);
    windowLit(g, L + 24, T + 20, 12, 12, '#26262e', t, 4);
    rect(g, x - 5, y - 22, 10, 22, '#1e1e26');                // tall door and glowing handle
    rect(g, x - 4, y - 21, 8, 21, '#3a3a46'); rect(g, x + 2, y - 16, 1, 8, '#ff4fd8');
    rect(g, x - 14, y - 1, 28, 1, '#b8b8c4');
    plants(g, L + 2, y); plants(g, L + w - 10, y);
    rect(g, L + 34, T + 26, 3, 4, '#c8c8d4'); rect(g, L + 35, T + 26, 1, 1, '#ffe14d');  // house number
  },

  euro(g, x, y, t) {
    const w = HOUSE_W.euro;
    const L = x - w / 2;
    const T = y - 36;
    rect(g, L, y - 6, w, 6, '#8a8494');                       // stone base
    for (let i = 0; i < w; i += 6) rect(g, L + i, y - 6, 1, 6, '#5a5464');
    rect(g, L, T, w, 30, '#efe0c0');                          // half-timbered walls
    for (let i = 0; i <= w - 2; i += 28) rect(g, L + i, T, 2, 30, '#5a3420');
    rect(g, L + w - 2, T, 2, 30, '#5a3420');
    rect(g, L, T + 14, w, 2, '#5a3420');
    for (let b = 0; b < w - 28; b += 56) for (let k = 0; k < 12; k++) { rect(g, L + b + 2 + k * 2, T + 14 - k, 2, 1, '#5a3420'); rect(g, L + b + 30 + k * 2, T + 2 + k, 2, 1, '#5a3420'); }
    rect(g, L + w - 26, T - 34, 7, 14, '#8a3a22'); rect(g, L + w - 27, T - 35, 9, 2, '#5a2414');  // chimney and smoke
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.5 + i / 4) % 1;
      disc(g, L + w - 23 + Math.round(Math.sin(k * 5 + i) * 3), T - 37 - Math.round(k * 16), 1 + Math.round(k * 3), `rgba(200,196,220,${0.7 - k * 0.65})`);
    }
    for (let j = 0; j < 24; j++) {                             // steep tiled roof
      const half = Math.round(w / 2 - 22 + j * 1.05);
      shingles(g, x - half, T - 24 + j, half * 2, 1, ['#b8452a', '#7a2414', j % 3 === 0 ? '#e0703e' : '#b8452a'], 3);
    }
    rect(g, L - 3, T - 1, w + 6, 2, '#5a2414');
    [-28, 0, 28].forEach((dx, i) => {                          // dormers
      rect(g, x + dx - 6, T - 17, 12, 10, '#efe0c0'); rect(g, x + dx - 8, T - 19, 16, 2, '#7a2414');
      windowLit(g, x + dx - 3, T - 14, 6, 6, '#5a3420', t, 3 + i);
    });
    for (let wx = L + 8; wx < L + w - 12; wx += 26) {
      if (Math.abs(wx + 5 - x) < 12) continue;
      windowLit(g, wx, T + 18, 10, 9, '#5a3420', t, wx);
      rect(g, wx - 4, T + 17, 3, 11, '#2f6a44'); rect(g, wx + 11, T + 17, 3, 11, '#2f6a44');
      rect(g, wx - 1, T + 28, 12, 2, '#6a3e22');
      for (let k = 0; k < 6; k++) rect(g, wx + k * 2, T + 27 - (k % 2), 1, 1, ['#ff3b6b', '#ffd84a', '#ff8fc0'][k % 3]);
      windowLit(g, wx + 1, T + 3, 8, 7, '#5a3420', t, wx + 1);
    }
    ellipse(g, x, y - 18, 5, 4, '#3a2010'); rect(g, x - 5, y - 18, 11, 18, '#3a2010');  // arched wooden door
    ellipse(g, x, y - 18, 4, 3, '#7a4a28'); rect(g, x - 4, y - 18, 9, 17, '#7a4a28');
    for (let i = -3; i <= 3; i += 3) rect(g, x + i, y - 20, 1, 19, '#5a3420');
    rect(g, x + 2, y - 9, 1, 1, '#ffd84a');
    lantern(g, x - 9, y - 14, t, 0); lantern(g, x + 9, y - 14, t, 1);
  },

  tower(g, x, y, t) {
    const w = HOUSE_W.tower;
    const L = x - w / 2;
    const tw = 70;
    const T = y - 82;
    [[L + 4, 50], [L + w - 52, 48]].forEach(([wx, ww], s) => {   // side wings
      rect(g, wx, y - 48, ww, 36, '#24324a'); rect(g, wx, y - 48, ww, 1, '#4a6a9a');
      for (let r = 0; r < 6; r++) for (let c = 0; c < ww / 6 - 1; c++) {
        const lit = hash(r * 9 + c + s * 50 + Math.floor(t / 5) * 0.21) > 0.5;
        rect(g, wx + 3 + c * 6, y - 45 + r * 5, 4, 3, lit ? '#ffe58a' : '#3a5a8a');
      }
    });
    rect(g, x - 1, T - 8, 2, 8, '#9a9aa8');
    if (t % 1.4 < 0.7) { rect(g, x - 1, T - 10, 3, 2, '#ff2a2a'); glow(g, x, T - 9, 6, '255,42,42', 0.6); }
    rect(g, x - tw / 2 + 8, T, tw - 16, 8, '#2a3a56');
    rect(g, x - tw / 2, T + 8, tw, 74, '#1e2a40');
    rect(g, x - tw / 2, T + 8, 2, 74, '#3a5070'); rect(g, x + tw / 2 - 2, T + 8, 2, 74, '#141c2c');
    for (let row = 0; row < 13; row++) {
      for (let col = 0; col < 9; col++) {
        const lit = hash(row * 9 + col + Math.floor(t / 4) * 0.13) > 0.45;
        rect(g, x - tw / 2 + 3 + col * 7, T + 10 + row * 5, 5, 3, lit ? '#ffe58a' : '#3a5a8a');
        if (lit && hash(row + col * 3) > 0.8) rect(g, x - tw / 2 + 3 + col * 7, T + 10 + row * 5, 2, 3, '#ff9ad8');
      }
    }
    for (let j = 0; j < 60; j += 2) rect(g, x + tw / 2 - 5, T + 12 + j, 2, 1, (Math.floor(t * 4) + j) % 12 < 6 ? '#ff2fd0' : '#7a1a68');  // vertical neon sign
    rect(g, L, y - 12, w, 12, '#d8dee8');                     // glass podium lobby
    rect(g, L + 2, y - 10, w - 4, 10, '#5fa8d8');
    for (let i = 0; i < w - 4; i += 8) rect(g, L + 2 + i, y - 10, 1, 10, '#d8dee8');
    rect(g, x - 7, y - 10, 14, 10, '#9fe0ff'); rect(g, x, y - 10, 1, 10, '#d8dee8');
    rect(g, L, y - 13, w, 1, `rgba(0,229,255,${0.6 + Math.sin(t * 3) * 0.3})`);
    plants(g, L + 8, y); plants(g, L + w - 16, y); plants(g, x - 22, y); plants(g, x + 14, y);
  },

  palace_cn(g, x, y, t) {
    const w = HOUSE_W.palace_cn;
    const L = x - w / 2;
    const T = y - 56;
    rect(g, L - 2, y - 6, w + 4, 6, '#d8d0c0'); rect(g, L - 2, y - 6, w + 4, 1, '#f4f0e8');  // terrace and stairs
    for (let i = 0; i < w; i += 8) rect(g, L + i, y - 9, 2, 3, '#e8e0d0');
    for (let j = 0; j < 6; j += 2) rect(g, x - 10, y - 6 + j, 20, 1, '#b8b0a0');
    const roof = (cx, top, rows, w0, grow) => {
      for (let i = 0; i < rows; i++) {
        const rw = w0 + i * grow;
        rect(g, cx - rw / 2, top + i, rw, 1, i % 2 ? '#1f6a4c' : '#2c8a62');
        for (let k = -rw / 2; k < rw / 2; k += 3) rect(g, cx + k, top + i, 1, 1, '#145038');
      }
      const rw = w0 + rows * grow;
      rect(g, cx - rw / 2 - 3, top + rows - 3, 3, 2, '#2c8a62'); rect(g, cx + rw / 2, top + rows - 3, 3, 2, '#2c8a62');  // upturned eaves
      rect(g, cx - rw / 2 - 4, top + rows - 4, 1, 1, '#d8a520'); rect(g, cx + rw / 2 + 3, top + rows - 4, 1, 1, '#d8a520');
      rect(g, cx - rw / 2, top + rows, rw, 1, '#d8a520');
    };
    const hall = (cx, hw, base, hh) => {
      rect(g, cx - hw / 2, base - hh, hw, hh, '#b0201a');
      for (let i = 0; i <= hw - 3; i += 10) { rect(g, cx - hw / 2 + i, base - hh, 3, hh, '#7a1410'); rect(g, cx - hw / 2 + i, base - hh, 1, hh, '#d8402a'); }
      for (let i = 4; i < hw - 8; i += 10) for (let k = 0; k < hh - 6; k += 4) rect(g, cx - hw / 2 + i + 1, base - hh + 3 + k, 5, 1, '#d8a520');  // lattice
    };
    [L + 26, L + w - 26].forEach((cx) => { hall(cx, 44, y - 6, 18); roof(cx, y - 34, 8, 36, 2.5); });  // side galleries
    hall(x, 104, y - 6, 24);
    rect(g, x - 30, T + 8, 60, 12, '#b0201a');
    roof(x, T, 8, 52, 3.5);
    roof(x, T + 18, 8, 98, 2.5);
    rect(g, x - 26, T - 1, 52, 1, '#d8a520'); rect(g, x - 28, T - 3, 3, 3, '#d8a520'); rect(g, x + 25, T - 3, 3, 3, '#d8a520');
    rect(g, x - 8, T + 8, 16, 7, '#1a1a40'); rect(g, x - 7, T + 9, 14, 5, '#d8a520');  // plaque
    rect(g, x - 8, y - 24, 16, 18, '#7a1010');
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) rect(g, x - 5 + i * 5, y - 22 + j * 5, 1, 1, '#ffd84a');
    rect(g, x, y - 24, 1, 18, '#4a0808');
    for (let lx = L + 12; lx < L + w; lx += 30) {
      const i = lx / 30;
      const sw = Math.round(Math.sin(t * 2 + i) * 1.5);
      const ly = Math.abs(lx - x) < 50 ? y - 30 : y - 26;
      rect(g, lx + sw, ly - 4, 1, 3, '#d8a520');
      ellipse(g, lx + sw, ly + 1, 3, 4, '#e82828'); rect(g, lx + sw - 2, ly - 1, 5, 1, '#ffd84a'); rect(g, lx + sw, ly + 5, 1, 2, '#ffd84a');
      glow(g, lx + sw, ly + 1, 10, '255,80,40', 0.45);
    }
    [x - 16, x + 16].forEach((sx) => { rect(g, sx - 3, y - 10, 6, 4, '#a8a8b0'); disc(g, sx, y - 12, 3, '#c8c8d0'); rect(g, sx - 1, y - 13, 1, 1, '#2a2a32'); });  // stone lions
  },

  palace_eu(g, x, y, t) {  // the Muslim palace: white marble, an onion dome, minarets and pointed arches
    const w = HOUSE_W.palace_eu;
    const L = x - w / 2;
    const marble = '#f4f0e8';
    const shade = '#d8d0c4';
    const arch = (ax, ay, aw, ah, fill) => {  // a pointed arch opening
      rect(g, ax, ay, aw, ah, fill);
      for (let i = 0; i < aw / 2; i++) rect(g, ax + i, ay - Math.round(Math.sqrt(aw / 2 - i) * 1.6), aw - i * 2, 1, fill);
    };
    rect(g, L, y - 4, w, 4, '#e8e0d0'); rect(g, L, y - 4, w, 1, '#ffffff');
    [L + 4, L + w - 12].forEach((mx, i) => {                     // minarets
      rect(g, mx, y - 70, 8, 66, marble); rect(g, mx, y - 70, 2, 66, '#ffffff'); rect(g, mx + 6, y - 70, 2, 66, shade);
      [y - 50, y - 30].forEach((by) => { rect(g, mx - 2, by, 12, 2, shade); rect(g, mx - 2, by - 1, 12, 1, '#c8a020'); });
      ellipse(g, mx + 4, y - 72, 5, 4, marble); rect(g, mx + 3, y - 80, 2, 5, '#c8a020'); disc(g, mx + 4, y - 81, 1, '#ffe14d');
    });
    rect(g, L + 18, y - 40, w - 36, 36, marble);                  // the long hall with pointed windows
    rect(g, L + 18, y - 42, w - 36, 2, '#c8a020');
    for (let ax = L + 24; ax < L + w - 30; ax += 14) if (Math.abs(ax + 4 - x) > 30) { arch(ax, y - 30, 8, 14, '#1f3a6a'); rect(g, ax + 2, y - 26, 4, 8, Math.sin(t * 0.6 + ax) > -0.9 ? '#ffd58a' : '#c89a50'); }
    for (let i = 0; i < w - 36; i += 6) rect(g, L + 18 + i, y - 44, 3, 2, marble);  // crenellation
    [x - 46, x + 46].forEach((cx) => {                            // small domed pavilions
      rect(g, cx - 8, y - 52, 16, 10, marble); ellipse(g, cx, y - 54, 8, 6, marble); ellipse(g, cx - 2, y - 56, 3, 3, '#ffffff');
      rect(g, cx - 1, y - 63, 2, 4, '#c8a020'); for (let i = -6; i <= 6; i += 4) rect(g, cx + i, y - 50, 2, 6, '#e8e0d0');
    });
    rect(g, x - 26, y - 56, 52, 52, marble); rect(g, x - 26, y - 56, 52, 2, '#c8a020');  // the central iwan
    arch(x - 14, y - 40, 28, 36, '#d8d0c4'); arch(x - 10, y - 34, 20, 30, '#1f3a6a');
    for (let i = 0; i < 6; i++) rect(g, x - 8 + i * 3, y - 30 + (i % 2) * 2, 1, 1, '#4fd8ff');
    rect(g, x - 6, y - 16, 12, 12, '#6a3e20'); rect(g, x, y - 16, 1, 12, '#4a2a14');
    for (let j = 0; j < 30; j++) {                                 // the onion dome: pointed, widest near the base
      const k = j / 29;
      const half = Math.round(20 * (k < 0.65 ? Math.sin((k / 0.65) * Math.PI / 2) ** 1.6 : 1 - ((k - 0.65) / 0.35) * 0.22));
      rect(g, x - half, y - 84 + j, half * 2 + 1, 1, j % 6 === 5 ? '#ffffff' : marble);
      if (half > 3) rect(g, x - half, y - 84 + j, 2, 1, shade);
    }
    rect(g, x - 16, y - 58, 32, 2, shade);
    rect(g, x - 1, y - 91, 2, 8, '#c8a020'); disc(g, x, y - 92, 2, '#ffe14d'); rect(g, x - 2, y - 95, 5, 1, '#ffe14d');
    glow(g, x, y - 92, 8, '255,225,77', 0.4);
    for (let i = -18; i <= 18; i += 6) rect(g, x + i, y - 3, 3, 3, '#1f5aa8');  // a reflecting pool edge
  },

  villa(g, x, y, t) {  // the modern villa: stacked white slabs, walls of glass, a cantilever and a pool
    const w = HOUSE_W.villa;
    const L = x - w / 2;
    rect(g, L, y - 30, w - 20, 30, '#f2f2f6'); rect(g, L, y - 30, w - 20, 1, '#ffffff');
    rect(g, L + 30, y - 58, w - 40, 26, '#e6e6ec'); rect(g, L + 26, y - 60, w - 30, 3, '#26262e');  // the upper slab, sticking out
    rect(g, L - 4, y - 32, w - 12, 3, '#26262e');
    const led = 0.55 + Math.sin(t * 2) * 0.2;
    rect(g, L - 4, y - 29, w - 12, 1, `rgba(0,229,255,${led})`); rect(g, L + 26, y - 57, w - 30, 1, `rgba(255,79,216,${led})`);
    rect(g, L + 34, y - 54, w - 50, 18, '#1c2c40');               // upper glass
    for (let i = 0; i < w - 50; i += 12) { rect(g, L + 36 + i, y - 46, 9, 10, i % 24 ? '#ffd58a' : '#ffcb70'); rect(g, L + 34 + i, y - 54, 1, 18, '#3a4a5e'); }
    rect(g, L + 8, y - 26, w - 40, 22, '#1c2c40');                // lower glass wall
    for (let i = 0; i < w - 40; i += 10) { rect(g, L + 8 + i, y - 26, 1, 22, '#3a4a5e'); if (i % 20 === 0) rect(g, L + 11 + i, y - 16, 6, 12, '#ffd58a'); }
    for (let k = 0; k < 3; k++) { const sx = Math.floor((t * 8 + k * 40) % (w + 20)) - 10; for (let j = 0; j < 22; j++) if (sx + j > 0 && sx + j < w - 40) rect(g, L + 8 + sx + j, y - 26 + j, 1, 1, 'rgba(255,255,255,0.2)'); }
    rect(g, L + w - 20, y - 44, 20, 44, '#8e6e4e'); for (let j = 0; j < 44; j += 3) rect(g, L + w - 20, y - 44 + j, 20, 1, '#6e4e2e');  // wood-clad wing
    rect(g, x - 5, y - 20, 10, 20, '#2a2a34'); rect(g, x + 3, y - 14, 1, 6, '#ffe14d');
    rect(g, L, y - 3, w, 3, '#c8c8d4');
    rect(g, L + 12, y - 2, 46, 2, '#2fa8ef'); rect(g, L + 12, y - 2, 46, 1, '#9fe8ff');  // the pool's edge in front
    [L + 64, L + w - 30].forEach((px) => { rect(g, px, y - 6, 8, 6, '#3a3a44'); disc(g, px + 4, y - 10, 4, '#2a7a3c'); disc(g, px + 3, y - 11, 2, '#45a34c'); });
  },

  church(g, x, y, t) {  // St Sophia: white walls, green and gold onion domes, arched windows, a bell tower
    const w = HOUSE_W.church;
    const L = x - w / 2;
    const white = '#f4f0e6';
    const green = '#3a9a7a';
    const onion = (cx, top, r, color) => {
      for (let j = 0; j < r * 2 + 2; j++) {
        const k = j / (r * 2);
        const half = Math.max(0, Math.round(r * Math.sin(Math.min(Math.PI, k * Math.PI * 1.15)) * (k > 0.85 ? 1 - (k - 0.85) * 3 : 1)));
        rect(g, cx - half, top + r * 2 - j, half * 2 + 1, 1, j % 3 === 0 ? '#ffffff' : color);
      }
      rect(g, cx, top - 6, 1, 7, '#ffd21f'); rect(g, cx - 2, top - 4, 5, 1, '#ffd21f'); rect(g, cx - 1, top - 2, 3, 1, '#ffd21f');
      rect(g, cx - Math.ceil(r * 0.6), top + r * 2 - 1, Math.ceil(r * 0.6) * 2 + 1, 14, white);  // the drum it sits on
      rect(g, cx - Math.ceil(r * 0.6), top + r * 2 - 1, Math.ceil(r * 0.6) * 2 + 1, 1, '#d8d0c0');
    };
    rect(g, L + 10, y - 40, w - 20, 40, white); rect(g, L + 10, y - 40, w - 20, 2, '#d8d0c0');
    for (let ax = L + 18; ax < L + w - 18; ax += 14) if (Math.abs(ax + 3 - x) > 18) {
      ellipse(g, ax + 3, y - 28, 3, 3, '#1f3a5a'); rect(g, ax, y - 28, 7, 12, '#1f3a5a'); rect(g, ax + 1, y - 26, 5, 9, Math.sin(t + ax) > -0.9 ? '#ffd58a' : '#c89a50');
    }
    [[L + 30, 14], [L + w - 30, 14], [x - 34, 18], [x + 34, 18]].forEach(([cx, r]) => { rect(g, cx - r / 2, y - 52, r, 12, white); onion(cx, y - 52 - r * 2 + 2, r / 2, green); });
    rect(g, x - 18, y - 62, 36, 22, white); for (let i = -14; i < 15; i += 7) { ellipse(g, x + i + 2, y - 54, 2, 2, '#1f3a5a'); rect(g, x + i, y - 54, 4, 7, '#1f3a5a'); }
    onion(x, y - 62 - 26, 13, '#e8b020');                           // the great golden dome
    glow(g, x, y - 74, 18, '255,210,60', 0.2);
    rect(g, L, y - 66, 16, 66, white); rect(g, L, y - 66, 16, 2, '#d8d0c0');  // the bell tower
    ellipse(g, L + 8, y - 54, 3, 3, '#1f3a5a'); rect(g, L + 5, y - 54, 7, 10, '#1f3a5a');
    rect(g, L + 7 + Math.round(Math.sin(t * 2) * 1), y - 52, 3, 4, '#ffd21f');  // the bell swings
    onion(L + 8, y - 66 - 14, 7, green);
    ellipse(g, x, y - 18, 7, 6, '#5a3a20'); rect(g, x - 7, y - 18, 15, 18, '#5a3a20'); rect(g, x, y - 18, 1, 18, '#3a2410');
    rect(g, x - 9, y - 26, 19, 2, '#ffd21f');
    for (let j = 0; j < 3; j++) rect(g, x - 12 - j * 3, y - 3 + j, 25 + j * 6, 1, '#e8e0d0');
  },

  palace_gold(g, x, y, t) {  // the golden palace: a baroque facade dripping with gold, slate mansard roofs
    const w = HOUSE_W.palace_gold;
    const L = x - w / 2;
    const stone = '#f4e8c8';
    const gold = '#e8b020';
    const goldL = '#ffe070';
    const wing = (wx, ww, top) => {
      rect(g, wx, top, ww, y - top, stone); rect(g, wx, top, ww, 2, gold);
      rect(g, wx - 2, top - 10, ww + 4, 10, '#3a4a6a'); for (let i = 0; i < ww + 4; i += 4) rect(g, wx - 2 + i, top - 10, 1, 10, '#2a3a5a');  // slate mansard
      rect(g, wx - 2, top - 11, ww + 4, 1, gold);
      for (let i = 6; i < ww - 4; i += 12) { rect(g, wx + i, top - 8, 4, 6, stone); rect(g, wx + i + 1, top - 7, 2, 3, '#7fb0d8'); rect(g, wx + i + 1, top - 10, 2, 2, gold); }  // dormers
      for (let i = 4; i < ww - 6; i += 9) {
        [top + 6, top + 24].forEach((wy, r) => {
          ellipse(g, wx + i + 3, wy, 3, 2, gold);
          rect(g, wx + i, wy, 7, 13 - r * 3, '#3a5a8a');
          rect(g, wx + i + 1, wy + 1, 5, 11 - r * 3, Math.sin(t * 0.5 + i + r) > -0.9 ? '#ffd58a' : '#d8a050');
          rect(g, wx + i + 3, wy, 1, 13 - r * 3, gold); rect(g, wx + i - 1, wy + 13 - r * 3, 9, 1, gold);
        });
      }
      rect(g, wx, top + 21, ww, 1, gold);
      for (let i = 0; i < ww; i += 3) rect(g, wx + i, top - 13, 2, 2, gold);  // gilded roof crest
    };
    wing(L + 2, 78, y - 48);
    wing(L + w - 80, 78, y - 48);
    rect(g, x - 40, y - 62, 80, 62, stone); rect(g, x - 40, y - 62, 80, 2, gold);  // the central pavilion
    for (let i = -36; i < 37; i += 9) { rect(g, x + i, y - 58, 3, 54, '#fff4d8'); rect(g, x + i, y - 58, 3, 2, gold); rect(g, x + i, y - 6, 3, 2, gold); }  // columns
    for (let i = -32; i < 30; i += 9) if (Math.abs(i + 2) > 8) { ellipse(g, x + i + 3, y - 44, 2, 2, gold); rect(g, x + i + 1, y - 44, 5, 16, '#3a5a8a'); rect(g, x + i + 2, y - 43, 3, 14, '#ffd58a'); }
    for (let j = 0; j < 12; j++) rect(g, x - 6 - j * 3, y - 62 - 12 + j, 12 + j * 6, 1, j === 11 ? gold : stone);  // pediment
    disc(g, x, y - 68, 4, gold); disc(g, x, y - 68, 2, goldL); for (let k = 0; k < 8; k++) rect(g, x + Math.round(Math.cos(k * 0.785) * 6), y - 68 + Math.round(Math.sin(k * 0.785) * 5), 1, 1, gold);  // sun emblem
    rect(g, x - 2, y - 82, 4, 6, gold); disc(g, x, y - 84, 2, goldL);
    [-30, 30].forEach((dx) => { rect(g, x + dx - 2, y - 72, 5, 8, '#f0f0e8'); disc(g, x + dx, y - 74, 2, '#f0f0e8'); });  // statues on the roof
    ellipse(g, x, y - 22, 9, 7, gold); rect(g, x - 9, y - 22, 19, 22, gold);  // the golden gate
    for (let i = -8; i <= 8; i += 2) rect(g, x + i, y - 26, 1, 26, i % 4 ? '#c89010' : goldL);
    rect(g, x - 9, y - 12, 19, 1, goldL);
    if (t % 2 < 0.25) rect(g, x - 5, y - 20, 1, 1, '#ffffff');
    for (let j = 0; j < 4; j++) rect(g, x - 16 - j * 4, y - 4 + j, 33 + j * 8, 1, j % 2 ? '#e8dcc0' : '#f8f0e0');
    glow(g, x, y - 30, 30, '255,200,60', 0.15);
  },
};

// The garage, standing next to a small house (x, y = door step).
export function drawGarage(g, x, y, t) {
  const L = x - 22;
  rect(g, L, y - 30, 44, 30, '#6e6e78'); for (let j = 0; j < 30; j += 5) rect(g, L, y - 30 + j, 44, 1, '#5a5a64');
  rect(g, L - 2, y - 33, 48, 3, '#2a2a32'); rect(g, L - 2, y - 30, 48, 1, `rgba(0,229,255,${0.5 + Math.sin(t * 2) * 0.2})`);
  rect(g, L + 6, y - 24, 32, 24, '#3a3a46'); for (let j = 0; j < 24; j += 3) rect(g, L + 6, y - 24 + j, 32, 1, '#2a2a34');  // roll-up door
  rect(g, L + 6, y - 6, 32, 1, '#ff4fd8');
  rect(g, L + 12, y - 29, 20, 4, '#120a20'); for (let i = 0; i < 6; i++) rect(g, L + 14 + i * 3, y - 28, 2, 2, (Math.floor(t * 3) + i) % 6 < 4 ? '#00e5ff' : '#0a4a5a');
  glow(g, x, y - 27, 10, '0,229,255', 0.25);
}

export function drawHouse(g, id, x, y, t) {
  HOUSES[id](g, Math.round(x), Math.round(y), t);
  return HOUSE_W[id];
}

// ---------------------------------------------------------------- interiors

export const TILE = 16;
export const ROOM = { side: 10, wall: 44, bottom: 10, inner: 14 };  // wall thickness / heights in pixels
export const roomSize = (gw, gh) => [gw * TILE + ROOM.side * 2, ROOM.wall + gh * TILE + ROOM.bottom];
export const tileOrigin = (x, y) => [ROOM.side + x * TILE, ROOM.wall + y * TILE];

const ROOMS = {
  shack: { cap: '#3a3a44', face: '#6a6a74', floor: 'concrete' },
  modern: { cap: '#3a3a48', face: '#e0e2e8', floor: 'oak' },
  euro: { cap: '#4a2a18', face: '#e8d8b0', floor: 'herringbone' },
  tower: { cap: '#0e1424', face: '#24304a', floor: 'polished' },
  palace_cn: { cap: '#4a0a08', face: '#a8221a', floor: 'lacquer' },
  palace_eu: { cap: '#a88a40', face: '#f4f0e8', floor: 'mosaic' },
  villa: { cap: '#2a2a32', face: '#f2f2f6', floor: 'terrazzo' },
  church: { cap: '#8a8070', face: '#f0eadc', floor: 'flagstone' },
  palace_gold: { cap: '#c8a020', face: '#f4e8c8', floor: 'versailles' },
};

function nightWindow(g, x, y, w, h, frame, t, city = true) {
  rect(g, x - 2, y - 2, w + 4, h + 4, frame);
  rect(g, x, y, w, h, '#120a2e');
  rect(g, x, y + Math.floor(h / 2), w, Math.ceil(h / 2), '#1e1446');
  for (let i = 0; i < w; i += 5) if (hash(i + x) > 0.5) rect(g, x + i, y + 1 + Math.floor(hash(i * 3 + x) * (h / 2)), 1, 1, Math.sin(t * 2 + i) > 0 ? '#ffffff' : '#8a8ab0');
  if (city) {
    for (let i = 0; i < w; i += 4) {
      const bh = 3 + Math.floor(hash(i + x * 2) * (h / 2));
      rect(g, x + i, y + h - bh, 3, bh, '#0a0618');
      if (hash(i + Math.floor(t / 2)) > 0.5) rect(g, x + i + 1, y + h - bh + 1, 1, 1, i % 8 ? '#ffe58a' : '#ff4fd8');
    }
  }
  disc(g, x + w - 5, y + 4, 2, '#fff4c8');
}

const BACK = {
  shack(g, Wd, t) {
    rect(g, 0, 0, Wd, ROOM.wall, '#7a7a84');
    for (let j = 4; j < ROOM.wall; j += 6) { rect(g, 0, j, Wd, 1, '#64646e'); for (let i = (j / 6) % 2 ? 0 : 7; i < Wd; i += 14) rect(g, i, j, 1, 6, '#64646e'); }
    [[20, 6, 10, 18], [Wd - 40, 10, 14, 12]].forEach(([x, y, w, h]) => rect(g, x, y, w, h, '#6a6a74'));
    nightWindow(g, Math.round(Wd / 2) - 16, 10, 22, 16, '#3a3a44', t);
    rect(g, Math.round(Wd / 2) - 12, 14, 7, 1, '#d8e8ff'); rect(g, Math.round(Wd / 2) - 8, 15, 1, 5, '#d8e8ff');  // cracked glass
    rect(g, 14, 12, 12, 16, '#d84a8a'); rect(g, 15, 13, 10, 7, '#ffd84a'); rect(g, 16, 22, 8, 1, '#1a1a22'); rect(g, 16, 24, 6, 1, '#1a1a22');  // taped poster
    const sw = Math.round(Math.sin(t * 1.2) * 3);                  // bare bulb on a cord
    for (let j = 0; j < 12; j++) rect(g, Wd - 50 + Math.round((sw * j) / 12), j, 1, 1, '#1a1a1a');
    disc(g, Wd - 50 + sw, 13, 2, lamp(t)); glow(g, Wd - 50 + sw, 14, 16, '255,233,168', 0.35);
  },
  modern(g, Wd, t) {
    rect(g, 0, 0, Wd, ROOM.wall, '#e6e8ee');
    rect(g, 12, 4, 30, 36, '#a8703c'); for (let i = 0; i < 30; i += 3) rect(g, 12 + i, 4, 1, 36, '#8a5a30');
    nightWindow(g, 52, 6, Wd - 70, 30, '#2a2a34', t);
    rect(g, 0, 2, Wd, 1, `rgba(0,229,255,${0.5 + Math.sin(t * 2) * 0.2})`);
    rect(g, 18, 12, 18, 12, '#ffffff'); rect(g, 19, 13, 16, 10, '#ff6fa8'); rect(g, 24, 15, 8, 6, '#4dc3ff');  // art
  },
  euro(g, Wd, t) {
    rect(g, 0, 0, Wd, ROOM.wall, '#e8d8b0');
    for (let i = 3; i < Wd; i += 8) for (let j = 6; j < 26; j += 8) { rect(g, i, j, 1, 3, '#d0b880'); rect(g, i - 1, j + 1, 3, 1, '#d0b880'); }
    rect(g, 0, 28, Wd, 16, '#8a5a30'); for (let i = 4; i < Wd; i += 14) rect(g, i, 30, 10, 11, '#9a6a3a');
    rect(g, 0, 0, Wd, 3, '#f4ecd8'); rect(g, 0, 3, Wd, 1, '#c8a870');
    [24, Wd - 46].forEach((wx) => {
      nightWindow(g, wx, 7, 20, 18, '#f4ecd8', t, false);
      rect(g, wx - 5, 4, 5, 24, '#7a2a3a'); rect(g, wx + 20, 4, 5, 24, '#7a2a3a'); rect(g, wx - 6, 3, 32, 2, '#c8a020');
    });
    rect(g, Math.round(Wd / 2) - 9, 8, 18, 14, '#c8a020'); rect(g, Math.round(Wd / 2) - 7, 10, 14, 10, '#4a6a3a'); disc(g, Math.round(Wd / 2), 14, 3, '#e8c060');
  },
  tower(g, Wd, t) {
    nightWindow(g, 2, 2, Wd - 4, ROOM.wall - 6, '#141c2c', t);
    for (let i = 2; i < Wd - 2; i += 24) rect(g, i, 0, 2, ROOM.wall, '#141c2c');
    for (let i = 0; i < Wd; i += 7) {
      const bh = 8 + Math.floor(hash(i * 1.3) * 22);
      rect(g, i + 2, ROOM.wall - 4 - bh, 6, bh, '#080414');
      for (let j = 2; j < bh - 2; j += 3) if (hash(i + j + Math.floor(t / 3)) > 0.6) rect(g, i + 3 + (j % 2) * 3, ROOM.wall - 4 - bh + j, 1, 1, j % 5 ? '#ffe58a' : '#00e5ff');
    }
    rect(g, 0, ROOM.wall - 4, Wd, 4, '#0e1424');
  },
  palace_cn(g, Wd, t) {
    rect(g, 0, 0, Wd, ROOM.wall, '#a8221a');
    for (let i = 4; i < Wd; i += 12) { rect(g, i, 6, 6, 1, '#d8a520'); rect(g, i + 2, 4, 2, 5, '#d8a520'); }
    rect(g, 0, 32, Wd, 12, '#5a0e0a'); for (let i = 0; i < Wd; i += 6) rect(g, i, 34, 3, 2, '#d8a520');
    const cx = Math.round(Wd / 2);
    disc(g, cx, 18, 12, '#d8a520'); disc(g, cx, 18, 10, '#120a2e'); disc(g, cx + 4, 13, 3, '#fff4c8');  // moon window
    for (let i = -8; i <= 8; i += 4) rect(g, cx + i, 9, 1, 18, '#5a0e0a');
    [20, Wd - 26].forEach((sx) => { rect(g, sx, 6, 8, 22, '#f4ecd8'); rect(g, sx - 1, 5, 10, 1, '#4a2a14'); for (let j = 9; j < 26; j += 4) rect(g, sx + 3, j, 2, 2, '#1a1a1a'); });
    [44, Wd - 48].forEach((lx, i) => { const s = Math.round(Math.sin(t * 1.5 + i)); rect(g, lx + s, 0, 1, 6, '#d8a520'); ellipse(g, lx + s, 10, 4, 4, '#e82828'); rect(g, lx + s - 3, 7, 7, 1, '#ffd84a'); glow(g, lx + s, 10, 12, '255,80,40', 0.4); });
  },
  palace_eu(g, Wd, t) {  // white plaster, pointed arches with carved screens, a zellige dado, lanterns
    rect(g, 0, 0, Wd, ROOM.wall, '#f4f0e8');
    for (let i = 0; i < Wd; i += 8) { rect(g, i, 30, 8, 11, i % 16 ? '#1f5aa8' : '#1f8a8a'); rect(g, i + 3, 33, 2, 2, '#e8b020'); }
    rect(g, 0, 29, Wd, 1, '#c8a020');
    for (let i = 10; i < Wd - 24; i += 40) {
      rect(g, i, 10, 20, 19, '#e0d8c8');
      for (let k = 0; k < 10; k++) rect(g, i + k, 10 - Math.round(Math.sqrt(10 - k) * 2), 20 - k * 2, 1, '#e0d8c8');
      for (let a = i + 2; a < i + 18; a += 3) for (let b = 12; b < 28; b += 3) rect(g, a, b, 2, 2, '#8a6a3a');  // mashrabiya screen
      glow(g, i + 10, 18, 10, '255,200,120', 0.2);
    }
    for (let i = 30; i < Wd - 10; i += 40) {
      rect(g, i, 0, 1, 7, '#c8a020');
      rect(g, i - 2, 7, 5, 5, '#c8902a'); rect(g, i - 1, 8, 3, 3, ['#ff4f6a', '#4fd8ff', '#ffe14d'][(i / 40) % 3 | 0]);
      glow(g, i, 9, 10, '255,200,90', 0.35 + Math.sin(t * 3 + i) * 0.05);
    }
  },
  villa(g, Wd, t) {  // a whole wall of glass over the night city, with a wood-panel corner
    nightWindow(g, 34, 3, Wd - 38, ROOM.wall - 8, '#26262e', t);
    for (let i = 34; i < Wd - 4; i += 30) rect(g, i, 0, 2, ROOM.wall, '#26262e');
    rect(g, 0, 0, 32, ROOM.wall, '#8e6e4e'); for (let j = 0; j < ROOM.wall; j += 3) rect(g, 0, j, 32, 1, '#6e4e2e');
    rect(g, 6, 10, 20, 14, '#f4f4f8'); rect(g, 8, 12, 16, 10, '#ff8a3a'); rect(g, 12, 15, 9, 5, '#2a2a6a');  // art
    rect(g, 0, 1, Wd, 1, `rgba(255,79,216,${0.5 + Math.sin(t * 2) * 0.2})`);
  },
  church(g, Wd, t) {  // pale stone, tall stained-glass windows and a golden icon screen
    rect(g, 0, 0, Wd, ROOM.wall, '#e8e0d0');
    for (let j = 4; j < ROOM.wall; j += 6) for (let i = (j / 6) % 2 ? 0 : 8; i < Wd; i += 16) rect(g, i, j, 1, 6, '#d0c8b4');
    for (let i = 14; i < Wd - 20; i += 34) {
      if (Math.abs(i + 6 - Wd / 2) < 30) continue;
      ellipse(g, i + 6, 8, 6, 4, '#3a3048'); rect(g, i, 8, 13, 24, '#3a3048');
      for (let a = 0; a < 11; a += 2) for (let b = 0; b < 22; b += 2) rect(g, i + 1 + a, 9 + b, 2, 2, ['#d8283c', '#2a6ad8', '#ffd21f', '#2a8a4a', '#8a3ad8'][(a + b + i) % 5]);
      glow(g, i + 6, 20, 10, '255,230,180', 0.15);
    }
    const cx = Math.round(Wd / 2);
    rect(g, cx - 26, 4, 52, 36, '#c8a020'); rect(g, cx - 24, 6, 48, 32, '#e8b020');  // iconostasis
    for (let k = -18; k <= 18; k += 12) { rect(g, cx + k - 4, 9, 9, 13, '#5a2a14'); disc(g, cx + k, 13, 2, '#f0c8a0'); rect(g, cx + k - 3, 16, 7, 5, k % 24 ? '#2a4ab8' : '#a8102e'); disc(g, cx + k, 12, 4, 'rgba(255,225,77,0.3)'); }
    rect(g, cx - 5, 25, 10, 13, '#7a1a1a'); ellipse(g, cx, 25, 5, 3, '#7a1a1a');
    for (let k = -30; k <= 30; k += 60) { rect(g, cx + k, 34, 2, 6, '#c8a020'); rect(g, cx + k, 31 + (t % 1 < 0.5 ? 0 : 1), 2, 3, '#ffe14d'); glow(g, cx + k, 32, 6, '255,200,80', 0.4); }  // candles
  },
  palace_gold(g, Wd, t) {  // a hall of mirrors: arched mirrors framed in gold, crystal chandeliers
    rect(g, 0, 0, Wd, ROOM.wall, '#f4e8c8');
    rect(g, 0, 0, Wd, 4, '#e8b020'); rect(g, 0, 4, Wd, 1, '#a87810');
    for (let i = 6; i < Wd - 16; i += 22) {
      ellipse(g, i + 8, 10, 8, 4, '#e8b020'); rect(g, i, 10, 17, 28, '#e8b020');
      ellipse(g, i + 8, 11, 6, 3, '#c8d8e8'); rect(g, i + 2, 11, 13, 26, '#c8d8e8');
      const sh = Math.floor((t * 6 + i) % 30);
      if (sh < 13) rect(g, i + 2 + sh, 14, 1, 20, 'rgba(255,255,255,0.7)');
      rect(g, i - 1, 37, 19, 2, '#a87810');
      rect(g, i + 18, 12, 3, 26, '#f8f0d8'); rect(g, i + 19, 12, 1, 26, '#e8b020');
    }
    for (let cx = Math.round(Wd / 4); cx < Wd; cx += Math.round(Wd / 2)) {
      rect(g, cx, 0, 1, 5, '#e8b020'); ellipse(g, cx, 8, 9, 3, '#e8b020');
      for (let k = -8; k <= 8; k += 2) { rect(g, cx + k, 9 + (Math.abs(k) < 4 ? 2 : 0), 1, 3, '#e8f4ff'); if ((t * 3 + k) % 4 < 1) rect(g, cx + k, 11, 1, 1, '#ffffff'); }
      glow(g, cx, 9, 22, '255,240,200', 0.35);
    }
  },
};

const FLOORS = {
  concrete(g, x, y, gx, gy) {
    rect(g, x, y, TILE, TILE, (gx + gy) % 3 ? '#6e6e78' : '#74747e');
    rect(g, x, y, TILE, 1, '#5e5e68'); rect(g, x, y, 1, TILE, '#5e5e68');
    if (hash(gx * 7 + gy) > 0.7) for (let k = 0; k < 7; k++) rect(g, x + 4 + k, y + 6 + (k % 3), 1, 1, '#4a4a54');
    if (hash(gx + gy * 5) > 0.8) ellipse(g, x + 8, y + 9, 4, 2, '#64646c');
  },
  oak(g, x, y, gx, gy) {
    for (let j = 0; j < TILE; j += 4) {
      rect(g, x, y + j, TILE, 4, ['#d8b07a', '#cca06a', '#e0bc88'][(gy * 4 + j / 4 + gx) % 3]);
      rect(g, x, y + j + 3, TILE, 1, '#a87a48');
      rect(g, x + ((gx * 5 + j) % TILE), y + j, 1, 3, '#a87a48');
    }
  },
  herringbone(g, x, y, gx, gy) {
    rect(g, x, y, TILE, TILE, '#8a5a2e');
    for (let k = 0; k < 4; k++) {
      for (let i = 0; i < 8; i++) {
        rect(g, x + k * 4 + (i % 4), y + i * 2, 1, 1, '#b07a42');
        rect(g, x + k * 4 + 3 - (i % 4), y + i * 2 + 1, 1, 1, '#a06a38');
      }
    }
    rect(g, x, y, TILE, 1, '#6a4020');
  },
  polished(g, x, y, gx, gy) {
    rect(g, x, y, TILE, TILE, (gx + gy) % 2 ? '#262c3a' : '#2e3546');
    rect(g, x, y, TILE, 1, '#3a4256'); rect(g, x, y, 1, TILE, '#3a4256');
    rect(g, x + 3, y + 3, 4, 1, 'rgba(120,200,255,0.18)'); rect(g, x + 3, y + 4, 2, 1, 'rgba(120,200,255,0.12)');
  },
  lacquer(g, x, y, gx, gy) {
    for (let j = 0; j < TILE; j += 4) { rect(g, x, y + j, TILE, 4, (gy + j / 4) % 2 ? '#4a1a10' : '#561e12'); rect(g, x, y + j + 3, TILE, 1, '#2e0e08'); }
  },
  mosaic(g, x, y, gx, gy) {  // patterned tiles: a star in each
    rect(g, x, y, TILE, TILE, '#f0ece0');
    rect(g, x + 4, y + 2, 8, 12, '#1f5aa8'); rect(g, x + 2, y + 4, 12, 8, '#1f5aa8');
    rect(g, x + 5, y + 5, 6, 6, (gx + gy) % 2 ? '#1f8a8a' : '#c8402a'); rect(g, x + 7, y + 7, 2, 2, '#e8b020');
  },
  terrazzo(g, x, y, gx, gy) {
    rect(g, x, y, TILE, TILE, '#d8d8dc');
    for (let k = 0; k < 7; k++) rect(g, x + Math.floor(hash(gx * 13 + gy * 7 + k) * 15), y + Math.floor(hash(gx * 3 + gy * 17 + k * 5) * 15), 1 + (k % 2), 1, ['#8a8a96', '#c86a4a', '#4a6a8a', '#2a2a32'][k % 4]);
    rect(g, x, y, TILE, 1, '#e8e8ec');
  },
  flagstone(g, x, y, gx, gy) {
    rect(g, x, y, TILE, TILE, (gx + gy) % 3 ? '#b8b0a0' : '#a8a090');
    rect(g, x, y, TILE, 1, '#8a8274'); rect(g, x, y, 1, TILE, '#8a8274'); rect(g, x + 1, y + 1, TILE - 2, 1, '#d0c8b8');
  },
  versailles(g, x, y, gx, gy) {  // parquet de Versailles: a lattice of oak strips in each square
    rect(g, x, y, TILE, TILE, '#b07a42');
    rect(g, x, y, TILE, 2, '#8a5a2a'); rect(g, x, y, 2, TILE, '#8a5a2a');
    for (let k = 2; k < TILE; k += 4) { rect(g, x + k, y + 2, 1, TILE - 2, '#c08a52'); rect(g, x + 2, y + k, TILE - 2, 1, '#a06a38'); }
    rect(g, x + 7, y + 7, 2, 2, '#e8b020');
  },
  marble(g, x, y, gx, gy) {
    const light = (gx + gy) % 2 === 0;
    rect(g, x, y, TILE, TILE, light ? '#ece8e0' : '#3a3a46');
    for (let k = 0; k < 6; k++) rect(g, x + 2 + k * 2, y + 3 + Math.round(Math.sin(k + gx) * 2) + k, 1, 1, light ? '#c8c0b8' : '#5a5a6a');
    rect(g, x, y, TILE, 1, light ? '#ffffff' : '#4a4a58');
  },
};

export function drawRoom(g, id, gw, gh, t, grid) {
  const r = ROOMS[id];
  const [Wd, Hd] = roomSize(gw, gh);
  rect(g, 0, 0, Wd, Hd, '#05020a');
  BACK[id](g, Wd, t);
  rect(g, 0, ROOM.wall - 3, Wd, 3, r.cap);                          // baseboard
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    const [x, y] = tileOrigin(gx, gy);
    FLOORS[r.floor](g, x, y, gx, gy);
  }
  rect(g, ROOM.side, ROOM.wall, gw * TILE, 3, 'rgba(0,0,0,0.25)');  // shadow under the back wall
  rect(g, 0, 0, ROOM.side, Hd, r.cap); rect(g, Wd - ROOM.side, 0, ROOM.side, Hd, r.cap);
  rect(g, ROOM.side - 1, ROOM.wall, 1, gh * TILE, r.face); rect(g, Wd - ROOM.side, ROOM.wall, 1, gh * TILE, r.face);
  rect(g, 0, Hd - ROOM.bottom, Wd, ROOM.bottom, r.cap);
  const dx = Math.round(Wd / 2) - TILE;                             // front entrance and door mat
  rect(g, dx, Hd - ROOM.bottom, TILE * 2, ROOM.bottom, '#05020a');
  rect(g, dx + 6, Hd - ROOM.bottom - 1, TILE * 2 - 12, 4, '#7a3a5a'); rect(g, dx + 8, Hd - ROOM.bottom, TILE * 2 - 16, 2, '#a85a7a');
  if (grid) {
    for (let gx = 0; gx <= gw; gx++) rect(g, ROOM.side + gx * TILE, ROOM.wall, 1, gh * TILE, 'rgba(0,229,255,0.28)');
    for (let gy = 0; gy <= gh; gy++) rect(g, ROOM.side, ROOM.wall + gy * TILE, gw * TILE, 1, 'rgba(0,229,255,0.28)');
  }
}

// Inner walls as depth-sortable pieces: [{key, draw}] (key = the floor row line they stand on).
export function wallPieces(g, id, walls) {
  const r = ROOMS[id];
  const H = ROOM.inner;
  const out = [];
  walls.forEach(([kind, at, a0, a1, doors]) => {
    for (let a = a0; a < a1; a++) {
      if (doors.includes(a)) continue;
      if (kind === 'h') {
        const [x, y] = tileOrigin(a, at);
        out.push({
          key: at + 0.05,
          draw: () => {
            rect(g, x, y - H, TILE, H, r.face); rect(g, x, y - H, TILE, 1, 'rgba(255,255,255,0.25)');
            rect(g, x, y - H - 3, TILE, 3, r.cap); rect(g, x, y - 2, TILE, 2, 'rgba(0,0,0,0.25)');
            if (doors.includes(a + 1)) rect(g, x + TILE - 1, y - H - 3, 1, H + 3, r.cap);
            if (doors.includes(a - 1)) rect(g, x, y - H - 3, 1, H + 3, r.cap);
          },
        });
      } else {
        const [x, y] = tileOrigin(at, a);
        const end = a + 1 === a1 || doors.includes(a + 1);
        out.push({
          key: a + 1 + 0.04,
          draw: () => {
            rect(g, x - 2, y - H, 4, TILE, r.cap);
            if (end) { rect(g, x - 2, y + TILE - H, 4, H, r.face); rect(g, x - 2, y + TILE - 2, 4, 2, 'rgba(0,0,0,0.3)'); }
          },
        });
      }
    }
  });
  return out;
}

// ---------------------------------------------------------------- furniture (w x h pixel box, front at the bottom)

const legs = (g, x, y, w, h, c = W[3]) => { rect(g, x, y, 2, h, c); rect(g, x + w - 2, y, 2, h, c); };
const top3 = (g, x, y, w, h, [l, m, d]) => { rect(g, x, y, w, h, m); rect(g, x, y, w, 1, l); rect(g, x, y + h - 1, w, 1, d); };

const FURN = {
  chair(g) { rect(g, 3, 1, 10, 6, W[2]); for (let i = 4; i < 12; i += 3) rect(g, i, 2, 2, 4, W[1]); top3(g, 3, 7, 10, 5, W); legs(g, 3, 12, 10, 3); },
  cat_bed(g) { ellipse(g, 8, 9, 7, 5, '#a83a6a'); ellipse(g, 8, 8, 7, 4, '#c94f7c'); ellipse(g, 8, 9, 5, 3, '#f1a7c3'); rect(g, 5, 7, 3, 1, '#ffd0e0'); rect(g, 2, 9, 1, 2, '#e070a0'); },
  plant_pot(g, w, h, t) {
    rect(g, 4, 10, 8, 5, '#b85030'); rect(g, 3, 9, 10, 2, '#d8704a'); rect(g, 4, 12, 8, 1, '#8a3820');
    const s = Math.round(Math.sin(t * 1.5));
    [[-3, -3], [3, -4], [0, -6], [-2, -8], [2, -8]].forEach(([dx, dy], i) => { ellipse(g, 8 + dx + (dy < -5 ? s : 0), 9 + dy, 2, 2, '#2a7a3c'); rect(g, 7 + dx, 8 + dy, 1, 1, i % 2 ? '#6fd06f' : '#45a34c'); });
  },
  floor_lamp(g, w, h, t) { ellipse(g, 8, 14, 3, 1, '#2a2a32'); rect(g, 8, 5, 1, 9, '#5a5a66'); rect(g, 4, 1, 9, 5, '#f0d090'); rect(g, 4, 1, 9, 1, '#fff4d0'); rect(g, 4, 5, 9, 1, '#c8a060'); glow(g, 8, 6, 12, '255,233,168', 0.35 + Math.sin(t * 3) * 0.05); },
  big_plant(g, w, h, t) {
    rect(g, 4, 11, 8, 5, '#3a3a48'); rect(g, 4, 11, 8, 1, '#5a5a6a');
    const s = Math.round(Math.sin(t * 1.2));
    [[-4, -2], [4, -3], [0, -6], [-3, -8], [3, -9], [0, -11]].forEach(([dx, dy]) => { ellipse(g, 8 + dx + (dy < -5 ? s : 0), 10 + dy, 2, 3, '#1f6a34'); rect(g, 8 + dx, 9 + dy, 1, 2, '#4fae5a'); });
  },
  bean_bag(g) { ellipse(g, 8, 10, 7, 5, '#5a34a8'); ellipse(g, 7, 8, 5, 4, '#7a4fd0'); ellipse(g, 6, 7, 3, 2, '#9a70f0'); rect(g, 5, 6, 2, 1, '#c8a8ff'); },
  office_chair(g) { rect(g, 4, 1, 8, 6, '#2a2a34'); rect(g, 5, 2, 6, 4, '#3a3a48'); top3(g, 3, 7, 10, 5, ['#5a5a6a', '#44444f', '#2a2a34']); rect(g, 7, 12, 2, 2, '#666'); rect(g, 2, 14, 12, 1, '#222'); rect(g, 2, 14, 1, 1, '#777'); rect(g, 13, 14, 1, 1, '#777'); },
  easel(g) {
    rect(g, 3, 13, 1, 3, W[2]); rect(g, 12, 13, 1, 3, W[2]); rect(g, 7, 0, 2, 2, W[2]);
    rect(g, 2, 2, 12, 10, '#f8f6ee'); rect(g, 2, 11, 12, 1, '#c8c4b8');
    rect(g, 3, 7, 10, 4, '#4dc3ff'); disc(g, 10, 5, 2, '#ffd84a'); rect(g, 3, 8, 4, 3, '#45a34c'); rect(g, 6, 9, 5, 2, '#2a7a3c');
    rect(g, 2, 12, 12, 1, W[1]);
  },
  vase(g) { ellipse(g, 8, 11, 4, 4, '#2f5fd0'); rect(g, 6, 5, 5, 4, '#2f5fd0'); rect(g, 6, 5, 1, 4, '#6f9fff'); rect(g, 5, 10, 6, 1, '#ffffff'); rect(g, 6, 1, 1, 4, '#ff3b6b'); rect(g, 9, 0, 1, 5, '#ffd84a'); rect(g, 8, 2, 1, 3, '#45a34c'); disc(g, 6, 1, 1, '#ff3b6b'); disc(g, 9, 0, 1, '#ffd84a'); },
  coffee_table(g) { top3(g, 1, 3, 30, 8, W); rect(g, 1, 11, 30, 2, W[2]); legs(g, 2, 13, 28, 2); rect(g, 22, 5, 4, 3, '#ffffff'); rect(g, 23, 6, 2, 1, '#6b3e12'); rect(g, 6, 5, 7, 4, '#e84a6a'); rect(g, 6, 5, 7, 1, '#ff8aa0'); },
  rug(g, w, h) {
    rect(g, 0, 0, w, h, '#d8a83a'); rect(g, 2, 2, w - 4, h - 4, '#7a1e44'); rect(g, 4, 4, w - 8, h - 8, '#a83a5a');
    for (let i = 6; i < w - 6; i += 6) for (let j = 6; j < h - 6; j += 6) { rect(g, i, j, 3, 3, '#d8a83a'); rect(g, i + 1, j + 1, 1, 1, '#7a1e44'); }
    for (let i = 0; i < w; i += 2) { rect(g, i, 0, 1, 1, '#f0d890'); rect(g, i, h - 1, 1, 1, '#f0d890'); }
  },
  sink(g, w, h, t) { top3(g, 1, 3, 14, 8, ['#ffffff', '#e8eef2', '#b8c4cc']); ellipse(g, 8, 7, 4, 2, '#a8b8c4'); rect(g, 8, 1, 1, 4, '#9aa8b4'); rect(g, 7, 1, 3, 1, '#c8d4dc'); rect(g, 1, 11, 14, 4, '#d0d8de'); rect(g, 7, 12, 2, 1, '#9aa8b4'); if (t % 1.5 < 0.25) rect(g, 8, 6, 1, 1, '#4dc3ff'); },
  armchair(g) { rect(g, 1, 1, 14, 6, '#24508a'); rect(g, 1, 1, 14, 1, '#4a7ac0'); rect(g, 1, 4, 3, 10, '#24508a'); rect(g, 12, 4, 3, 10, '#24508a'); top3(g, 4, 6, 8, 6, ['#6a9ae0', '#3f7fbf', '#2a5a90']); rect(g, 1, 12, 14, 3, '#1a3a68'); },
  desk(g) { top3(g, 1, 3, 30, 7, W); rect(g, 1, 10, 30, 5, W[2]); rect(g, 3, 11, 9, 3, W[1]); rect(g, 7, 12, 2, 1, '#ffd84a'); rect(g, 4, 1, 7, 5, '#f8f8f0'); rect(g, 5, 2, 4, 1, '#9a9aa8'); rect(g, 22, 0, 5, 6, '#2a2a34'); rect(g, 21, 0, 7, 2, '#ffe9a8'); },
  toilet(g) { rect(g, 4, 0, 8, 4, '#f4f4f8'); rect(g, 4, 0, 8, 1, '#ffffff'); ellipse(g, 8, 9, 4, 5, '#e8eef2'); ellipse(g, 8, 9, 3, 3, '#ffffff'); ellipse(g, 8, 9, 2, 2, '#bfe0f0'); rect(g, 7, 13, 2, 2, '#c8d0d8'); },
  dresser(g) { top3(g, 1, 1, 30, 4, W); rect(g, 1, 5, 30, 10, W[2]); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { rect(g, 2 + i * 10, 6 + j * 4, 9, 3, W[1]); rect(g, 6 + i * 10, 7 + j * 4, 2, 1, '#ffd84a'); } rect(g, 20, 0, 5, 2, '#ff8fc0'); rect(g, 6, 0, 3, 2, '#9fe8ff'); },
  bookshelf(g) {
    rect(g, 0, 0, 32, 16, W[3]); rect(g, 1, 1, 30, 14, W[2]);
    for (let s = 0; s < 3; s++) {
      for (let i = 2; i < 30; i += 2) { const bh = 3 + Math.floor(hash(i + s * 9) * 2); rect(g, i, 1 + s * 5 + (4 - bh), 2, bh, ['#d8283c', '#3f6fd8', '#5cc85c', '#ffd84a', '#a070e0', '#ff8a1e'][(i + s) % 6]); rect(g, i, 1 + s * 5 + (4 - bh), 1, 1, 'rgba(255,255,255,0.4)'); }
      rect(g, 1, 5 + s * 5, 30, 1, W[1]);
    }
  },
  dining_table(g, w, h, t) {
    [[3, 0], [19, 0], [3, 27], [19, 27]].forEach(([x, y]) => { rect(g, x, y, 10, 5, W[2]); rect(g, x + 1, y + 1, 8, 3, W[1]); });
    top3(g, 2, 5, 28, 20, W); rect(g, 2, 25, 28, 2, W[2]); rect(g, 4, 7, 24, 16, '#f4ecd8');
    [[8, 10], [22, 10], [8, 19], [22, 19]].forEach(([x, y]) => { disc(g, x, y, 2, '#ffffff'); rect(g, x, y, 1, 1, '#e8a040'); });
    rect(g, 15, 13, 2, 4, '#f4f0e8'); rect(g, 15, 11 + (t % 0.5 < 0.25 ? 0 : 1), 1, 2, '#ffb000'); glow(g, 15, 12, 8, '255,180,0', 0.4);
  },
  guitar(g, w, h, t, use) { ellipse(g, 8, 11, 4, 4, '#c8681c'); ellipse(g, 8, 11, 3, 3, '#e08a2c'); disc(g, 8, 10, 1, '#3a2010'); rect(g, 8, 1, 1, 7, '#5a3a1e'); rect(g, 7, 0, 3, 2, '#2a1408'); rect(g, 7, 13, 3, 1, '#2a1408'); if (use) rect(g, 7 + Math.floor((t * 8) % 3), 9, 1, 3, '#fff4d0'); },
  counter(g) { top3(g, 0, 1, 32, 5, ['#f4f4f8', '#e0e0e8', '#b8b8c4']); rect(g, 0, 6, 32, 9, '#d0d0d8'); rect(g, 15, 7, 1, 7, '#a8a8b4'); rect(g, 8, 9, 3, 1, '#8a8a96'); rect(g, 20, 9, 3, 1, '#8a8a96'); rect(g, 3, 2, 8, 3, '#c08a5a'); rect(g, 22, 1, 3, 4, '#ff6a3a'); rect(g, 26, 2, 3, 3, '#ffd84a'); },
  wardrobe(g) { rect(g, 0, 0, 32, 16, W[3]); rect(g, 1, 1, 30, 14, W[2]); rect(g, 2, 2, 13, 12, W[1]); rect(g, 17, 2, 13, 12, W[1]); rect(g, 4, 4, 9, 8, W[2]); rect(g, 19, 4, 9, 8, W[2]); rect(g, 14, 7, 1, 3, '#ffd84a'); rect(g, 17, 7, 1, 3, '#ffd84a'); rect(g, 0, 0, 32, 1, W[0]); },
  record_player(g, w, h, t) { top3(g, 1, 2, 14, 11, ['#8a5a30', '#6a4020', '#40240e']); disc(g, 7, 7, 4, '#111'); disc(g, 7, 7, 1, '#d8283c'); const a = t * 6; rect(g, 7 + Math.round(Math.cos(a) * 3), 7 + Math.round(Math.sin(a) * 3), 1, 1, '#666'); rect(g, 12, 3, 1, 6, '#cfcfd8'); rect(g, 10, 8, 3, 1, '#cfcfd8'); rect(g, 1, 13, 14, 2, '#40240e'); },
  bed(g) {
    rect(g, 0, 0, 32, 6, W[2]); rect(g, 0, 0, 32, 1, W[0]); rect(g, 2, 6, 28, 38, '#f4f4f8');
    rect(g, 5, 7, 22, 7, '#ffffff'); rect(g, 5, 13, 22, 1, '#d0d0dc');
    rect(g, 2, 18, 28, 26, '#3f6fd0'); rect(g, 2, 18, 28, 3, '#7fa8ff'); for (let j = 24; j < 44; j += 5) rect(g, 2, j, 28, 1, '#2f5ab0');
    rect(g, 0, 44, 32, 4, W[2]); legs(g, 0, 44, 32, 4, W[3]);
  },
  double_bed(g) {
    rect(g, 0, 0, 48, 7, '#5a2a14'); rect(g, 0, 0, 48, 1, '#8a4a28'); rect(g, 2, 7, 44, 37, '#f4f4f8');
    rect(g, 5, 8, 17, 7, '#ffffff'); rect(g, 26, 8, 17, 7, '#ffffff'); rect(g, 5, 14, 17, 1, '#d0d0dc'); rect(g, 26, 14, 17, 1, '#d0d0dc');
    rect(g, 2, 19, 44, 25, '#d84a8a'); rect(g, 2, 19, 44, 3, '#ff8fc0'); for (let i = 6; i < 44; i += 8) for (let j = 25; j < 44; j += 8) rect(g, i, j, 2, 2, '#ffc0dc');
    rect(g, 0, 44, 48, 4, '#5a2a14');
  },
  fish_tank(g, w, h, t, use, extra = {}) {
    rect(g, 0, 11, 32, 5, W[2]); rect(g, 0, 11, 32, 1, W[1]);
    rect(g, 1, 0, 30, 11, '#a8b8c8'); rect(g, 2, 1, 28, 9, '#1f8fd8'); rect(g, 2, 1, 28, 2, '#5fc8ff');
    rect(g, 2, 8, 28, 2, '#e6d28a'); rect(g, 6, 7, 3, 2, '#9a9aa8'); rect(g, 22, 6, 4, 3, '#b08a6a'); rect(g, 23, 5, 1, 1, '#b08a6a');
    [[4, 0], [27, 1], [14, 2]].forEach(([x, k]) => { const s = Math.round(Math.sin(t * 2 + k)); rect(g, x + s, 4, 1, 4, '#2f8a4a'); rect(g, x, 6, 1, 2, '#2f8a4a'); });
    const fish = (extra.fish ?? []).slice(0, 7);
    fish.forEach((type, i) => {
      const p = (t * (2 + (i % 3)) + i * 9) % 48;
      const fx = p < 24 ? 3 + p : 51 - p;
      drawFish(g, type, fx, 3 + (i * 2) % 5, p < 24 ? 1 : -1, t, true);
    });
    rect(g, 9, 1 + Math.floor(8 - ((t * 5) % 8)), 1, 1, '#d8f4ff'); rect(g, 10, 1 + Math.floor(8 - ((t * 5 + 3) % 8)), 1, 1, '#d8f4ff');
    rect(g, 1, 0, 30, 1, '#00e5ff');
  },
  telescope(g) { rect(g, 3, 14, 1, 2, '#555'); rect(g, 12, 14, 1, 2, '#555'); rect(g, 7, 9, 2, 6, '#555'); rect(g, 3, 14, 10, 1, '#555'); for (let i = 0; i < 8; i++) rect(g, 3 + i, 10 - i, 3, 3, i < 2 ? '#8a8aa0' : '#d8d8e8'); rect(g, 11, 1, 3, 3, '#4dc3ff'); rect(g, 4, 9, 1, 1, '#ffd84a'); },
  sofa(g) {
    rect(g, 0, 0, 48, 6, '#901e18'); rect(g, 0, 0, 48, 1, '#c8402a');
    top3(g, 4, 6, 40, 7, ['#ff6a50', '#e04f3f', '#b03026']); rect(g, 17, 6, 1, 7, '#b03026'); rect(g, 31, 6, 1, 7, '#b03026');
    rect(g, 0, 3, 5, 12, '#901e18'); rect(g, 43, 3, 5, 12, '#901e18'); rect(g, 0, 3, 5, 1, '#c8402a'); rect(g, 43, 3, 5, 1, '#c8402a');
    rect(g, 4, 13, 40, 2, '#701410'); rect(g, 8, 3, 6, 4, '#ffd84a'); rect(g, 34, 3, 6, 4, '#4dc3ff');
  },
  console(g, w, h, t) { rect(g, 1, 6, 14, 6, '#1a1a22'); rect(g, 1, 6, 14, 1, '#3a3a48'); rect(g, 3, 8, 2, 1, t % 1 < 0.5 ? '#39ff14' : '#0a3a0a'); rect(g, 8, 8, 5, 2, '#2a2a34'); rect(g, 1, 13, 5, 3, '#4a4a58'); rect(g, 10, 13, 5, 3, '#4a4a58'); rect(g, 2, 14, 1, 1, '#ff3b6b'); rect(g, 13, 14, 1, 1, '#4dc3ff'); rect(g, 5, 12, 1, 1, '#2a2a34'); },
  stove(g, w, h, t, use) { top3(g, 0, 0, 16, 9, ['#5a5a66', '#44444e', '#2a2a32']); rect(g, 0, 9, 16, 7, '#d8d8e0'); rect(g, 3, 10, 10, 4, '#2a2a32'); rect(g, 4, 11, 8, 2, use ? '#ff6a1c' : '#3a3a44'); [[4, 3], [11, 3], [4, 7], [11, 7]].forEach(([x, y], i) => { disc(g, x, y, 2, '#1a1a1a'); if (i === 0 && (use || t % 0.6 < 0.3)) disc(g, x, y, 1, '#ff4a1c'); }); },
  tv(g, w, h, t) {
    rect(g, 2, 10, 28, 6, W[2]); rect(g, 2, 10, 28, 1, W[1]); rect(g, 4, 0, 24, 11, '#0a0a10'); rect(g, 5, 1, 22, 8, '#1a1a40');
    for (let i = 0; i < 22; i++) rect(g, 5 + i, 1 + ((i + Math.floor(t * 8)) % 8), 1, 1, ['#ff4fd8', '#4dc3ff', '#ffd84a'][i % 3]);
    rect(g, 5, 1, 22, 1, 'rgba(255,255,255,0.2)'); glow(g, 16, 5, 14, '77,195,255', 0.25);
  },
  clock(g, w, h, t) {
    rect(g, 3, 0, 10, 16, '#5a2a14'); rect(g, 3, 0, 10, 1, '#8a4a28'); disc(g, 8, 4, 3, '#f4ecd8');
    const now = new Date();
    const a = (now.getSeconds() / 60) * 6.28;
    rect(g, 8 + Math.round(Math.sin(a) * 2), 4 - Math.round(Math.cos(a) * 2), 1, 1, '#1a1a1a'); rect(g, 8, 4, 1, 1, '#1a1a1a');
    rect(g, 5, 8, 6, 7, '#2a1408'); rect(g, 8 + Math.round(Math.sin(t * 3) * 2), 9, 1, 4, '#d8a520'); disc(g, 8 + Math.round(Math.sin(t * 3) * 2), 13, 1, '#ffd84a');
  },
  bathtub(g, w, h, t, use) {
    rect(g, 0, 0, 32, 13, '#ffffff'); rect(g, 0, 12, 32, 4, '#d8dee4'); rect(g, 2, 2, 28, 9, '#8fd8ff'); rect(g, 2, 2, 28, 1, '#c8f0ff');
    for (let i = 0; i < (use ? 9 : 4); i++) disc(g, 5 + i * 3, 4 + Math.round(Math.sin(t * 2 + i)), 1 + (i % 2), '#f0fbff');
    rect(g, 28, 0, 2, 3, '#c0c8d0'); legs(g, 1, 14, 30, 2, '#c8a020');
  },
  fridge(g) { rect(g, 1, 0, 14, 16, '#c8d4dc'); rect(g, 2, 1, 12, 14, '#e8eef4'); rect(g, 2, 6, 12, 1, '#b8c4cc'); rect(g, 12, 2, 1, 3, '#8a96a0'); rect(g, 12, 8, 1, 4, '#8a96a0'); rect(g, 4, 8, 3, 3, '#ff6fa8'); rect(g, 8, 9, 2, 2, '#ffd84a'); rect(g, 4, 2, 2, 2, '#4dc3ff'); },
  fireplace(g, w, h, t) {
    rect(g, 0, 0, 32, 16, '#7a7a86'); for (let j = 0; j < 16; j += 4) for (let i = (j / 4) % 2 ? 0 : 3; i < 32; i += 6) rect(g, i, j, 1, 4, '#5a5a66');
    rect(g, 0, 0, 32, 2, '#9a9aa6'); rect(g, 8, 5, 16, 11, '#1a1010'); ellipse(g, 16, 5, 8, 2, '#1a1010');
    for (let i = 0; i < 7; i++) { const fh = 3 + Math.floor(hash(i + Math.floor(t * 10)) * 6); rect(g, 9 + i * 2, 16 - fh, 2, fh, i % 2 ? '#ffb000' : '#ff4a1c'); rect(g, 9 + i * 2, 16 - fh, 1, 1, '#ffe14d'); }
    rect(g, 10, 14, 12, 2, '#5a3420'); glow(g, 16, 12, 16, '255,140,40', 0.45);
  },
  computer(g, w, h, t) {
    top3(g, 0, 4, 32, 7, W); rect(g, 0, 11, 32, 4, W[2]); legs(g, 1, 14, 30, 2);
    rect(g, 8, 0, 16, 9, '#1a1a22'); rect(g, 9, 1, 14, 6, '#08140a');
    for (let i = 0; i < 4; i++) rect(g, 10, 2 + i, 2 + Math.floor(hash(i + Math.floor(t * 2)) * 10), 1, i === 3 ? '#00e5ff' : '#39ff14');
    rect(g, 15, 9, 2, 1, '#2a2a34'); rect(g, 9, 9, 12, 2, '#d8d8e0'); rect(g, 24, 9, 3, 2, '#d8d8e0'); glow(g, 16, 4, 12, '57,255,20', 0.2);
  },
  arcade(g, w, h, t) {
    rect(g, 1, 0, 14, 16, '#24145a'); rect(g, 1, 0, 14, 2, '#ff00d4'); rect(g, 3, 3, 10, 6, '#0a0a10');
    rect(g, 4 + Math.floor(t * 4) % 7, 6, 2, 2, '#ffd84a'); rect(g, 4, 4, 8, 1, '#00e5ff');
    rect(g, 2, 10, 12, 3, '#3a2a7a'); rect(g, 4, 10, 1, 2, '#ff3b6b'); rect(g, 8, 11, 2, 1, '#4dc3ff'); rect(g, 11, 11, 2, 1, '#ffd84a');
    rect(g, 1, 0, 1, 16, '#ff00d4'); rect(g, 14, 0, 1, 16, '#00e5ff'); glow(g, 8, 6, 12, '255,0,212', 0.25);
  },
  cat_tree(g) { rect(g, 7, 2, 2, 13, '#c8a878'); for (let j = 3; j < 15; j += 2) rect(g, 7, j, 2, 1, '#a88858'); [[2, 10, 8], [7, 5, 7], [1, 2, 7]].forEach(([x, y, w]) => { rect(g, x, y, w, 3, '#7a5ac8'); rect(g, x, y, w, 1, '#9a7ae8'); }); rect(g, 3, 14, 10, 2, '#5a3aa8'); disc(g, 12, 9, 1, '#ff4f9a'); },
  mirror(g, w, h, t) { rect(g, 4, 0, 8, 14, '#c8a020'); rect(g, 5, 1, 6, 12, '#a8c8e8'); rect(g, 6, 2, 1, 6, '#ffffff'); const k = Math.floor((t * 3) % 12); rect(g, 5, 1 + k, 6, 1, 'rgba(255,255,255,0.5)'); rect(g, 6, 14, 1, 2, '#c8a020'); rect(g, 9, 14, 1, 2, '#c8a020'); },
  hammock(g, w, h, t) { rect(g, 0, 2, 2, 14, W[2]); rect(g, 30, 2, 2, 14, W[2]); const sw = Math.round(Math.sin(t * 1.5)); for (let i = 2; i < 30; i++) rect(g, i, 6 + Math.round(Math.sin(((i - 2) / 28) * Math.PI) * 5) + sw, 1, 3, i % 4 < 2 ? '#e84a6a' : '#ffd84a'); },
  mini_bar(g, w, h, t) { top3(g, 0, 4, 32, 5, ['#5a3420', '#3a2010', '#20100a']); rect(g, 0, 9, 32, 7, '#2a1a10'); for (let i = 2; i < 30; i += 5) { rect(g, i, 0, 2, 4, ['#2a8a4a', '#a8102e', '#e8b020', '#3a6ad8'][(i / 5) % 4 | 0]); rect(g, i, 0, 2, 1, '#ffffff'); } rect(g, 0, 9, 32, 1, `rgba(255,79,216,${0.5 + Math.sin(t * 2) * 0.3})`); },
  jukebox(g, w, h, t) { rect(g, 2, 2, 12, 14, '#a8102e'); ellipse(g, 8, 3, 6, 3, '#e8b020'); rect(g, 4, 5, 8, 5, '#1a1a24'); for (let i = 0; i < 4; i++) rect(g, 5 + i * 2, 6 + ((Math.floor(t * 6) + i) % 3), 1, 1, '#ffe14d'); for (let j = 11; j < 15; j++) rect(g, 3, j, 10, 1, j % 2 ? '#ff4fd8' : '#00e5ff'); glow(g, 8, 10, 10, '255,79,216', 0.25); },
  drum_kit(g, w, h, t, use) { ellipse(g, 9, 11, 6, 3, '#d8d8e4'); ellipse(g, 9, 10, 5, 2, '#a8102e'); [[3, 5], [15, 4], [24, 6]].forEach(([x, y]) => { ellipse(g, x + 3, y + 1, 4, 2, '#d8d8e4'); rect(g, x + 3, y + 2, 1, 6, '#8a8a96'); }); disc(g, 28, 2, 3, '#e8c040'); rect(g, 28, 4, 1, 10, '#8a8a96'); if (use && t % 0.4 < 0.2) disc(g, 28, 2, 3, '#ffffff'); },
  vending(g, w, h, t) { rect(g, 1, 0, 14, 16, '#1a1a2a'); rect(g, 2, 1, 9, 12, '#0a2a3a'); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) rect(g, 3 + c * 3, 2 + r * 3, 2, 2, ['#ff4f6a', '#ffe14d', '#39ff14', '#4fd8ff'][(r + c) % 4]); rect(g, 12, 3, 2, 3, '#ff4fd8'); rect(g, 12, 8, 2, 1, '#8a8a96'); rect(g, 2, 13, 9, 2, '#05050a'); rect(g, 1, 0, 14, 1, '#00e5ff'); glow(g, 6, 7, 10, '0,229,255', 0.2); },
  treadmill(g, w, h, t, use) { rect(g, 3, 8, 10, 22, '#2a2a34'); rect(g, 4, 9, 8, 20, '#3a3a48'); for (let j = 0; j < 20; j += 3) rect(g, 4, 9 + ((j + Math.floor(t * (use ? 20 : 2))) % 20), 8, 1, '#5a5a6a'); rect(g, 3, 1, 1, 8, '#8a8a96'); rect(g, 12, 1, 1, 8, '#8a8a96'); rect(g, 3, 1, 10, 3, '#1a1a24'); rect(g, 5, 2, 6, 1, '#39ff14'); },
  pool_table(g) { rect(g, 0, 0, 48, 32, '#5a2a14'); rect(g, 3, 3, 42, 24, '#1f7a3a'); rect(g, 3, 3, 42, 1, '#2a9a4a'); [[3, 3], [23, 2], [44, 3], [3, 26], [23, 27], [44, 26]].forEach(([x, y]) => disc(g, x, y, 1, '#05050a')); [[30, 12, '#ffffff'], [14, 14, '#e8102e'], [16, 12, '#ffe14d'], [16, 16, '#2a4ab8'], [18, 14, '#1a1a1a']].forEach(([x, y, c]) => disc(g, x, y, 1, c)); rect(g, 31, 12, 12, 1, '#c8a878'); rect(g, 0, 28, 48, 4, '#3a1a0a'); },
  massage_chair(g, w, h, t, use) { rect(g, 2, 1, 12, 7, '#2a2a34'); rect(g, 3, 2, 10, 5, '#4a4a5a'); rect(g, 1, 6, 3, 8, '#2a2a34'); rect(g, 12, 6, 3, 8, '#2a2a34'); top3(g, 4, 7, 8, 6, ['#6a6a7a', '#4a4a5a', '#2a2a34']); rect(g, 5, 13, 6, 3, '#3a3a48'); if (use) rect(g, 6 + Math.round(Math.sin(t * 8)), 3, 4, 1, '#00e5ff'); rect(g, 13, 7, 1, 1, '#39ff14'); },
  grand_fireplace(g, w, h, t) {
    rect(g, 0, 0, 48, 16, '#8a8a96'); for (let j = 0; j < 16; j += 4) for (let i = (j / 4) % 2 ? 0 : 4; i < 48; i += 8) rect(g, i, j, 1, 4, '#6a6a76');
    rect(g, 0, 0, 48, 3, '#c8c8d4'); rect(g, 2, 3, 2, 13, '#c8c8d4'); rect(g, 44, 3, 2, 13, '#c8c8d4');
    rect(g, 10, 5, 28, 11, '#1a1010'); ellipse(g, 24, 5, 14, 3, '#1a1010');
    for (let i = 0; i < 12; i++) { const fh = 3 + Math.floor(hash(i + Math.floor(t * 10)) * 7); rect(g, 12 + i * 2, 16 - fh, 2, fh, i % 2 ? '#ffb000' : '#ff4a1c'); rect(g, 12 + i * 2, 16 - fh, 1, 1, '#ffe14d'); }
    rect(g, 14, 14, 20, 2, '#5a3420'); [8, 40].forEach((cx) => { rect(g, cx - 1, 0, 3, 3, '#e8b020'); }); glow(g, 24, 12, 20, '255,140,40', 0.45);
  },
  piano(g, w, h, t, use) {
    rect(g, 0, 0, 32, 10, '#0e0e12'); rect(g, 0, 0, 32, 1, '#3a3a48'); rect(g, 4, 2, 24, 4, '#1a1a22'); rect(g, 6, 3, 6, 2, '#f4ecd8');
    rect(g, 0, 10, 32, 5, '#ffffff'); for (let i = 1; i < 32; i += 3) rect(g, i, 10, 1, 3, '#0e0e12');
    if (use) rect(g, 2 + Math.floor(hash(Math.floor(t * 6)) * 27), 13, 2, 2, '#ffd84a');
    legs(g, 1, 15, 30, 1, '#0e0e12');
  },
};

// ---------------------------------------------------------------- wall pieces (w x 26 pixel box on the back wall)

const WALL_FURN = {
  painting_portrait(g) { rect(g, 1, 2, 14, 20, '#c8a020'); rect(g, 3, 4, 10, 16, '#3a2a1a'); disc(g, 8, 9, 3, '#e8c0a0'); rect(g, 5, 13, 6, 7, '#2a4a8a'); rect(g, 6, 6, 4, 2, '#4a2a14'); },
  painting_sunset(g) { rect(g, 1, 3, 30, 18, '#c8a020'); for (let j = 0; j < 14; j++) rect(g, 3, 5 + j, 26, 1, ['#ff4f6a', '#ff7a3a', '#ffb03a', '#ffd86a'][Math.floor(j / 3.5)]); disc(g, 16, 14, 4, '#fff0a0'); rect(g, 3, 15, 26, 4, '#2a1a3a'); rect(g, 3, 15, 26, 1, '#ff9a6a'); },
  painting_mountain(g) { rect(g, 1, 3, 30, 18, '#5a3a20'); rect(g, 3, 5, 26, 14, '#9fd0ff'); for (let i = 0; i < 26; i++) { const hgt = Math.round(10 - Math.abs(((i % 13) - 6.5)) * 1.3); rect(g, 3 + i, 19 - hgt, 1, hgt, i < 13 ? '#6a7a8a' : '#4a5a6a'); if (hgt > 7) rect(g, 3 + i, 19 - hgt, 1, 2, '#ffffff'); } rect(g, 3, 17, 26, 2, '#3a7a3a'); },
  painting_abstract(g) { rect(g, 1, 3, 30, 18, '#1a1a1a'); rect(g, 3, 5, 26, 14, '#f4f0e8'); rect(g, 5, 7, 9, 6, '#d81e2a'); rect(g, 16, 6, 3, 12, '#1a1a1a'); rect(g, 20, 12, 7, 5, '#2a4ab8'); rect(g, 6, 15, 8, 2, '#ffd21f'); rect(g, 14, 9, 14, 1, '#1a1a1a'); },
  painting_neon(g, w, h, t) { rect(g, 1, 3, 30, 18, '#ff4fd8'); rect(g, 3, 5, 26, 14, '#0a0618'); for (let i = 3; i < 29; i += 4) { const bh = 3 + Math.floor(hash(i) * 9); rect(g, i, 19 - bh, 3, bh, '#1a1036'); if (hash(i + Math.floor(t)) > 0.4) rect(g, i + 1, 19 - bh + 1, 1, 1, '#ffe58a'); } rect(g, 3, 8, 26, 1, '#00e5ff'); glow(g, 16, 12, 12, '255,79,216', 0.2); },
  window_round(g, w, h, t) { disc(g, 8, 12, 7, '#c8c8d4'); disc(g, 8, 12, 5, '#120a2e'); rect(g, 3, 12, 11, 1, '#c8c8d4'); rect(g, 8, 7, 1, 11, '#c8c8d4'); if (Math.sin(t) > 0) rect(g, 6, 9, 1, 1, '#ffffff'); disc(g, 10, 14, 1, '#fff4c8'); },
  window_arched(g, w, h, t) { ellipse(g, 8, 7, 6, 5, '#e8e0d0'); rect(g, 2, 7, 13, 17, '#e8e0d0'); ellipse(g, 8, 7, 4, 3, '#120a2e'); rect(g, 4, 7, 9, 15, '#120a2e'); rect(g, 8, 4, 1, 18, '#e8e0d0'); rect(g, 4, 14, 9, 1, '#e8e0d0'); rect(g, 5, 9, 1, 1, Math.sin(t * 2) > 0 ? '#ffffff' : '#8a8ab0'); rect(g, 10, 18, 2, 4, '#0a0618'); },
  window_panorama(g, w, h, t) { rect(g, 0, 2, 48, 22, '#3a3a48'); rect(g, 2, 4, 44, 18, '#120a2e'); for (let i = 2; i < 46; i += 4) { const bh = 3 + Math.floor(hash(i * 2) * 10); rect(g, i, 22 - bh, 3, bh, '#0a0618'); if (hash(i + Math.floor(t / 2)) > 0.5) rect(g, i + 1, 22 - bh + 1, 1, 1, i % 8 ? '#ffe58a' : '#ff4fd8'); } disc(g, 40, 8, 2, '#fff4c8'); rect(g, 16, 4, 1, 18, '#3a3a48'); rect(g, 32, 4, 1, 18, '#3a3a48'); },
};
export const WALL_H = 26;
export function drawWallPiece(g, id, w, t) { outlined(g, 0, 0, w, WALL_H, INK, (sg) => WALL_FURN[id](sg, w, WALL_H, t)); }

// One furniture item into a w x h pixel box (unrotated), outlined; `use` is true while a pet uses it.
export function drawFurniture(g, id, w, h, t, use = false, extra = {}) {
  outlined(g, 0, 0, w, h, INK, (sg) => FURN[id](sg, w, h, t, use, extra));
}
