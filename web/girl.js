// The pixel anime girl: a portrait next to the chart (her mood follows your trading, you can pat her)
// and a full-body chibi that lives in the house. Her look changes with the UI style.
import { disc, ellipse, icon, now, rect } from './pixel.js';

export const LOOKS = {
  neon: { hair: '#36d6f0', shade: '#147c9e', tip: '#ff4fd8', eyes: '#ff3fcf', top: '#2b1d5c', trim: '#00e5ff', acc: 'phones' },
  terminal: { hair: '#5be35b', shade: '#237a2a', tip: '#c8ffc0', eyes: '#1fbf1f', top: '#0e2a12', trim: '#39ff14', acc: 'visor' },
  synthwave: { hair: '#ff5fc8', shade: '#9a1f86', tip: '#ffd319', eyes: '#2de2e6', top: '#3a1470', trim: '#ff6c11', acc: 'shades' },
  amber: { hair: '#ff8a1e', shade: '#a8520c', tip: '#ffd84a', eyes: '#c77800', top: '#3a2400', trim: '#ffb000', acc: 'ears' },
  office: { hair: '#6b3a1e', shade: '#3e200e', tip: '#8a5230', eyes: '#2b4ea6', top: '#2b4ea6', trim: '#ffffff', acc: 'glasses' },
};
const SKIN = '#ffe2cf';
const SKIN2 = '#f2b79f';
const INK = '#2a1630';
const WHITE = '#ffffff';
const BLUSH = '#ff8fab';
const TEAR = '#7fd4ff';
const MOUTH = '#c2405a';

// ---------- portrait (48 x 48)

function eyeOpen(g, cx, cy, h, look, dx, sparkle) {
  const top = cy - h / 2;
  rect(g, cx - 3, top - 1, 7, 1, INK);
  rect(g, cx - 2, top, 5, h, WHITE);
  rect(g, cx - 2 + dx, top, 4, h, look.eyes);
  rect(g, cx - 1 + dx, top + 1, 2, h - 2, INK);
  rect(g, cx - 1 + dx, top, 1, 1, WHITE);
  if (sparkle) rect(g, cx + 1 + dx, top + h - 2, 1, 1, WHITE);
  rect(g, cx - 2, top + h, 5, 1, SKIN2);
}

const ARC_UP = [[-2, 1], [-1, 0], [0, -1], [1, 0], [2, 1]];   // ^  (laughing)
const ARC_DOWN = [[-2, -1], [-1, 0], [0, 0], [1, 0], [2, -1]]; // u  (content)
const dots = (g, cx, cy, pts, c) => pts.forEach(([x, y]) => rect(g, cx + x, cy + y, 1, 1, c));

function eyes(g, mood, t, y, look, blink) {
  const L = 19;
  const R = 29;
  const cy = 28 + y;
  if (mood === 'happy') return [L, R].forEach((x) => dots(g, x, cy, ARC_UP, INK));
  if (mood === 'pat') return [L, R].forEach((x) => dots(g, x, cy, ARC_DOWN, INK));
  if (blink) return [L, R].forEach((x) => rect(g, x - 2, cy, 5, 1, INK));
  if (mood === 'focus') {
    const glance = t % 9 < 1.4 ? 0 : 1; // mostly watching the chart, sometimes looks at you
    return [L, R].forEach((x) => eyeOpen(g, x, cy + 1, 4, look, glance, false));
  }
  if (mood === 'anxious') {
    return [L, R].forEach((x) => {
      rect(g, x - 3, cy - 4, 7, 1, INK);
      rect(g, x - 2, cy - 3, 5, 6, WHITE);
      rect(g, x, cy - 1, 1, 2, INK);
    });
  }
  if (mood === 'sad') {
    [L, R].forEach((x) => { rect(g, x - 2, cy, 5, 1, INK); rect(g, x - 2, cy + 1, 5, 2, look.eyes); });
    return;
  }
  [L, R].forEach((x) => eyeOpen(g, x, cy, 6, look, 0, mood === 'expecting' && t % 0.6 < 0.3));
}

function brows(g, mood, y, look) {
  const c = look.shade;
  const by = 23 + y;
  if (mood === 'anxious' || mood === 'sad') {
    dots(g, 19, by, [[-2, 1], [-1, 1], [0, 0], [1, 0], [2, -1]], c);
    dots(g, 29, by, [[-2, -1], [-1, 0], [0, 0], [1, 1], [2, 1]], c);
  } else if (mood === 'focus') {
    rect(g, 17, by + 1, 5, 1, c);
    rect(g, 27, by + 1, 5, 1, c);
  } else {
    rect(g, 17, by - (mood === 'expecting' ? 1 : 0), 5, 1, c);
    rect(g, 27, by - (mood === 'expecting' ? 1 : 0), 5, 1, c);
  }
}

function mouth(g, mood, t, y) {
  const my = 34 + y;
  if (mood === 'happy') {
    rect(g, 21, my - 1, 7, 1, INK);
    rect(g, 22, my, 5, 2, MOUTH);
    rect(g, 23, my + 2, 3, 1, MOUTH);
  } else if (mood === 'expecting' || mood === 'pat') {
    dots(g, 24, my, [[-2, 0], [-1, 1], [0, 1], [1, 1], [2, 0]], MOUTH);
  } else if (mood === 'sad') {
    dots(g, 24, my, [[-2, 1], [-1, 0], [0, 0], [1, 0], [2, 1]], INK);
  } else if (mood === 'anxious') {
    const w = Math.floor(t * 8) % 2;
    dots(g, 24, my, [[-3, w], [-2, 1 - w], [-1, w], [0, 1 - w], [1, w], [2, 1 - w], [3, w]], INK);
  } else {
    rect(g, 23, my, 3, 1, MOUTH);
  }
}

function accessory(g, look, y, t) {
  if (look.acc === 'phones') {
    rect(g, 11, 9 + y, 26, 2, '#1d1d2e');
    rect(g, 7, 21 + y, 4, 9, '#1d1d2e');
    rect(g, 37, 21 + y, 4, 9, '#1d1d2e');
    rect(g, 8, 23 + y, 2, 5, t % 1 < 0.5 ? look.trim : look.tip);
    rect(g, 38, 23 + y, 2, 5, t % 1 < 0.5 ? look.tip : look.trim);
  } else if (look.acc === 'visor') {
    g.fillStyle = 'rgba(57,255,20,0.35)';
    g.fillRect(13, 24 + y, 22, 7);
    rect(g, 13, 24 + y, 22, 1, '#39ff14');
    rect(g, 13 + Math.floor(t * 12) % 22, 27 + y, 1, 1, '#eaffea');
  } else if (look.acc === 'shades') {
    rect(g, 15, 13 + y, 7, 3, '#141414');
    rect(g, 26, 13 + y, 7, 3, '#141414');
    rect(g, 22, 14 + y, 4, 1, '#141414');
    rect(g, 16, 13 + y, 2, 1, look.tip);
  } else if (look.acc === 'ears') {
    for (let i = 0; i < 5; i++) {
      rect(g, 13 + i, 9 - i + y, 6 - i * 1.2 + 1, 1, look.hair);
      rect(g, 30 + i * 0.2, 9 - i + y, 6 - i * 1.2 + 1, 1, look.hair);
    }
    rect(g, 15, 7 + y, 2, 2, '#ffb3c6');
    rect(g, 31, 7 + y, 2, 2, '#ffb3c6');
  } else if (look.acc === 'glasses') {
    g.strokeStyle = INK;
    [19, 29].forEach((x) => { g.strokeRect(x - 3.5, 24.5 + y, 7, 7); });
    rect(g, 23, 27 + y, 2, 1, INK);
    rect(g, 31, 9 + y, 6, 3, '#d8283c');
    rect(g, 33, 8 + y, 2, 5, '#a01828');
  }
}

export function drawHead(g, look, mood, t) {
  g.clearRect(0, 0, 48, 48);
  const y = mood === 'happy' ? -Math.round(Math.abs(Math.sin(t * 7)) * 2)
    : mood === 'anxious' ? Math.round(Math.sin(t * 37) * 0.6)
      : mood === 'sad' ? 1 : Math.round(Math.sin(t * 1.6) * 0.6);
  const sway = Math.round(Math.sin(t * 1.3));
  const blink = t % 3.7 < 0.12;

  rect(g, 9, 41, 30, 7, look.top);                 // shoulders
  rect(g, 14, 39, 20, 2, look.top);
  rect(g, 21, 36, 6, 5, SKIN2);                     // neck
  rect(g, 20, 40, 8, 1, look.trim);
  ellipse(g, 24, 22 + y, 17, 16, look.shade);       // hair, back
  rect(g, 8, 22 + y, 6, 18 + sway, look.shade);
  rect(g, 34, 22 + y, 6, 18 - sway, look.shade);
  ellipse(g, 24, 27 + y, 11, 10, SKIN);             // face
  rect(g, 12, 27 + y, 2, 4, SKIN2);                 // ears
  rect(g, 34, 27 + y, 2, 4, SKIN2);
  ellipse(g, 24, 16 + y, 14, 9, look.hair);         // hair, top
  for (let i = 0; i < 9; i++) {                     // fringe
    rect(g, 12 + i * 3, 19 + y, 3, 3 + (i % 3 === 1 ? 3 : i % 2 ? 1 : 2), look.hair);
  }
  rect(g, 11, 20 + y, 4, 16 + sway, look.hair);    // side locks
  rect(g, 33, 20 + y, 4, 16 - sway, look.hair);
  rect(g, 11, 35 + y + sway, 4, 2, look.tip);
  rect(g, 33, 35 + y - sway, 4, 2, look.tip);
  rect(g, 17, 10 + y, 6, 1, 'rgba(255,255,255,0.55)'); // shine

  eyes(g, mood, t, y, look, blink);
  brows(g, mood, y, look);
  mouth(g, mood, t, y);
  if (['happy', 'pat', 'expecting'].includes(mood)) {
    rect(g, 15, 31 + y, 3, 1, BLUSH);
    rect(g, 30, 31 + y, 3, 1, BLUSH);
  }
  accessory(g, look, y, t);

  if (mood === 'anxious') rect(g, 35, 21 + y + Math.floor((t * 6) % 6), 2, 3, TEAR);         // sweat drop
  if (mood === 'sad') [17, 29].forEach((x, i) => rect(g, x, 31 + y + Math.floor((t * 7 + i * 3) % 7), 1, 2, TEAR));
  if (mood === 'happy' || mood === 'pat') icon(g, 'heart', 37 + Math.sin(t * 3) * 2, 12 - ((t * 9) % 10));
  if (mood === 'expecting' && t % 1.2 < 0.6) icon(g, 'star', 38, 6);
  if (mood === 'pat') {                              // your hand, patting
    const hx = 15 + Math.round(Math.sin(t * 12) * 3);
    rect(g, hx, 4 + y, 12, 5, SKIN);
    rect(g, hx, 9 + y, 12, 1, SKIN2);
    [0, 3, 6, 9].forEach((f) => rect(g, hx + f, 8 + y, 2, 3, SKIN));
  }
}

// The portrait widget: base mood from open positions, reactions to closed trades, patting on hover.
export class Girl {
  constructor(box) {
    this.box = box;
    this.canvas = box.querySelector('canvas');
    this.canvas.width = 48;
    this.canvas.height = 48;
    this.g = this.canvas.getContext('2d');
    this.look = LOOKS.neon;
    this.base = 'focus';
    this.react = null; // { mood, until }
    this.patting = false;
    this.canvas.onmouseenter = () => { this.patting = true; };
    this.canvas.onmouseleave = () => { this.patting = false; };
    this.canvas.onmousemove = () => { this.patting = true; };
    const loop = () => {
      if (!this.box.hidden) this.draw();
      setTimeout(() => requestAnimationFrame(loop), 70);
    };
    loop();
  }

  setTheme(name) { this.look = LOOKS[name] ?? LOOKS.neon; }

  // Unrealized PnL of open positions (null: no position).
  setPosition(pnl) { this.base = pnl == null ? 'focus' : pnl >= 0 ? 'expecting' : 'anxious'; }

  // A closed trade: happy with +$ or sad with -$ above her head.
  tradeClosed(pnl) {
    this.react = { mood: pnl >= 0 ? 'happy' : 'sad', until: now() + 4 };
    const pop = document.createElement('div');
    pop.className = `girl-pop ${pnl >= 0 ? 'up' : 'down'}`;
    pop.textContent = `${pnl >= 0 ? '+' : '-'}$${Math.abs(pnl).toFixed(2)}`;
    this.box.append(pop);
    setTimeout(() => pop.remove(), 2600);
  }

  mood() {
    if (this.react && now() < this.react.until) return this.react.mood;
    return this.patting ? 'pat' : this.base;
  }

  draw() { drawHead(this.g, this.look, this.mood(), now()); }
}

// ---------- full-body chibi for the house (about 12 x 20, x/y = feet)

export function drawChibi(g, look, x, y, pose, dir, t, outfit) {
  const top = outfit ?? look.top;
  const walk = pose === 'walk' ? Math.floor(t * 8) % 2 : 0;
  const hop = pose === 'jump' ? -Math.round(Math.abs(Math.sin(t * 9)) * 4)
    : pose === 'dance' ? -Math.round(Math.abs(Math.sin(t * 6)) * 2) : 0;
  const by = y + hop;
  const sit = pose === 'sit' || pose === 'play' || pose === 'read';
  const flip = dir === 'left' ? -1 : 1;
  const blink = t % 4 < 0.15;

  // legs and feet
  if (sit) {
    rect(g, x - 3, by - 3, 6, 2, SKIN);
    rect(g, x - 3 + (flip > 0 ? 4 : -1), by - 3, 2, 2, INK);
  } else {
    rect(g, x - 2, by - 4, 1, 3 + (walk ? 0 : 1), SKIN);
    rect(g, x + 1, by - 4, 1, 3 + (walk ? 1 : 0), SKIN);
    rect(g, x - 3, by - 1 - (walk ? 1 : 0), 2, 1, INK);
    rect(g, x + 1, by - 1 - (walk ? 0 : 1), 2, 1, INK);
  }
  // dress and arms
  const dy = sit ? 2 : 0;
  rect(g, x - 3, by - 10 + dy, 7, 6, top);
  rect(g, x - 4, by - 5 + dy, 9, 1, top);
  rect(g, x - 3, by - 10 + dy, 7, 1, look.trim);
  const wave = pose === 'wave' ? Math.round(Math.sin(t * 10)) : 0;
  rect(g, x - 5, by - 9 + dy + (pose === 'dance' ? walk * -2 : 0), 1, 4, SKIN);
  rect(g, x + 5, by - (pose === 'wave' || pose === 'cheer' ? 14 + wave : 9) + dy, 1, 4, SKIN);
  if (pose === 'read') rect(g, x - 2, by - 8 + dy, 5, 3, '#d8283c');
  if (pose === 'cook') rect(g, x + 4, by - 9, 3, 1, '#9a9aa8');
  if (pose === 'water') rect(g, x + 5, by - 9, 3, 2, '#4dc3ff');

  // head
  const hy = by - 15 + dy;
  disc(g, x, hy, 6, look.shade);
  rect(g, x - 6, hy, 2, 7, look.shade);
  rect(g, x + 5, hy, 2, 7, look.shade);
  if (dir === 'up') {
    disc(g, x, hy, 5, look.hair);
  } else {
    ellipse(g, x, hy + 1, 4, 4, SKIN);
    rect(g, x - 5, hy - 5, 11, 3, look.hair);
    rect(g, x - 5, hy - 2, 2, 5, look.hair);
    rect(g, x + 4, hy - 2, 2, 5, look.hair);
    const ex = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    if (pose === 'sleep' || pose === 'pat' || blink) {
      rect(g, x - 3 + ex, hy + 1, 2, 1, INK);
      rect(g, x + 1 + ex, hy + 1, 2, 1, INK);
    } else {
      rect(g, x - 2 + ex, hy, 1, 2, look.eyes);
      rect(g, x + 1 + ex, hy, 1, 2, look.eyes);
    }
    rect(g, x - 3, hy + 2, 1, 1, BLUSH);
    rect(g, x + 3, hy + 2, 1, 1, BLUSH);
    if (pose === 'yawn' || pose === 'cheer') rect(g, x, hy + 3, 1, 1, MOUTH);
  }
  rect(g, x - 2, hy - 5, 2, 1, 'rgba(255,255,255,0.6)');
  if (look.acc === 'ears') { rect(g, x - 5, hy - 7, 2, 2, look.hair); rect(g, x + 4, hy - 7, 2, 2, look.hair); }
  if (look.acc === 'phones') rect(g, x - 6, hy - 1, 1, 3, '#1d1d2e');
  if (look.acc === 'glasses' && dir !== 'up') rect(g, x - 3, hy, 7, 1, 'rgba(42,22,48,0.5)');
}
