// Your pet next to the chart: a pixel head portrait whose mood follows your trading. Focused when you
// are flat, expecting when an open position is winning, anxious when it is losing, happy (+$) or sad
// (-$) when a trade closes; hover to pat it. It is the pet you picked as companion in the garden.
import { disc, ellipse, icon, now, rect } from './pixel.js';

const INK = '#1a1020';
const WHITE = '#ffffff';
const BLUSH = 'rgba(255,120,160,0.7)';
const TEAR = '#7fd4ff';

// Each head: draw(g, mood, t) paints the face; eyes / mouth are where the expression goes.
const HEADS = {
  dog: {
    eyes: [[18, 25], [30, 25]], mouth: [24, 35], ink: '#2a1408',
    draw(g, mood) {
      const droop = mood === 'sad' ? 4 : mood === 'expecting' || mood === 'happy' ? -3 : 0;
      ellipse(g, 11, 25 + droop, 4, 9, '#7a4a1c'); ellipse(g, 37, 25 + droop, 4, 9, '#7a4a1c');
      ellipse(g, 24, 27, 13, 11, '#c98a3e'); ellipse(g, 22, 23, 9, 6, '#d89a4e');
      ellipse(g, 24, 33, 7, 5, '#f3e3c3'); rect(g, 23, 16, 2, 8, '#f3e3c3');
      ellipse(g, 24, 30, 2, 1, INK); rect(g, 23, 29, 1, 1, '#5a5a6a');
    },
  },
  cat: {
    eyes: [[18, 26], [30, 26]], mouth: [24, 34], ink: '#1a3a1a',
    draw(g, mood) {
      const flat = mood === 'anxious' || mood === 'sad' ? 3 : 0;
      for (let j = 0; j < 9; j++) { rect(g, 11 + flat + Math.floor(j / 2), 13 + flat + j, 9 - j, 1, '#f0a040'); rect(g, 28 + Math.ceil(j / 2), 13 + flat + j, 9 - j, 1, '#f0a040'); }
      for (let j = 2; j < 7; j++) { rect(g, 14 + flat + Math.floor(j / 2), 13 + flat + j, 4 - Math.floor(j / 2), 1, '#ff9ab0'); rect(g, 31 + Math.ceil(j / 2), 13 + flat + j, 4 - Math.floor(j / 2), 1, '#ff9ab0'); }
      ellipse(g, 24, 28, 14, 10, '#f0a040'); ellipse(g, 22, 25, 9, 5, '#f8b858');
      [20, 24, 28].forEach((x) => rect(g, x, 18, 1, 4, '#c06a20'));
      ellipse(g, 24, 33, 6, 4, '#fff3e0'); rect(g, 23, 30, 3, 2, '#ff8aa8');
      [[8, 31], [8, 34], [35, 31], [35, 34]].forEach(([x, y]) => rect(g, x, y, 6, 1, '#fff3e0'));
    },
  },
  parrot: {
    eyes: [[17, 23], [31, 23]], mouth: null, ink: '#1a1a1a',
    draw(g, mood) {
      for (let k = 0; k < 4; k++) rect(g, 20 + k * 2, 8 - (k % 2) * 2 + (mood === 'sad' ? 3 : 0), 2, 6, k % 2 ? '#ff5a3a' : '#e8322b');  // crest
      disc(g, 24, 26, 13, '#e8322b'); ellipse(g, 22, 22, 9, 6, '#ff5a40');
      ellipse(g, 17, 24, 5, 4, '#f4f4f8'); ellipse(g, 31, 24, 5, 4, '#f4f4f8');
      for (let k = 0; k < 3; k++) { rect(g, 14, 22 + k * 2, 3, 1, '#c8c8d0'); rect(g, 32, 22 + k * 2, 3, 1, '#c8c8d0'); }
      ellipse(g, 24, 31, 5, 5, '#f4d35e'); ellipse(g, 24, 35, 3, 2, '#2a2a2a'); rect(g, 22, 29, 3, 1, '#fff4b0');  // beak
      rect(g, 11, 36, 26, 3, '#2f6fe0');
    },
  },
  turtle: {
    eyes: [[18, 24], [30, 24]], mouth: [24, 33], ink: '#0a2a0a',
    draw(g, mood) {
      const hide = mood === 'anxious' ? 3 : 0;
      ellipse(g, 24, 44, 22, 9, '#3f8f3f'); ellipse(g, 24, 44, 19, 7, '#2a6a2a');
      for (let k = 0; k < 5; k++) rect(g, 8 + k * 8, 39, 5, 3, '#5fb05f');
      ellipse(g, 24, 28 + hide, 12, 10, '#8fbf5f'); ellipse(g, 22, 25 + hide, 8, 5, '#a8d878');
      [[16, 32], [30, 31], [22, 36]].forEach(([x, y]) => rect(g, x, y + hide, 2, 1, '#6f9f3f'));
    },
  },
  lizard: {
    eyes: [[15, 22], [33, 22]], mouth: [24, 33], ink: '#0a1a0a',
    draw(g, mood, t) {
      ellipse(g, 24, 29, 15, 9, '#5cc85c'); ellipse(g, 22, 26, 10, 5, '#7ad87a');
      disc(g, 15, 22, 5, '#5cc85c'); disc(g, 33, 22, 5, '#5cc85c');
      for (let k = 0; k < 7; k++) rect(g, 12 + k * 4, 33 + (k % 2), 2, 1, '#2f8a3f');
      rect(g, 20, 29, 1, 1, '#2f8a3f'); rect(g, 28, 29, 1, 1, '#2f8a3f');
      if (mood === 'expecting' && t % 1.2 < 0.3) { rect(g, 23, 36, 2, 4, '#ff4f6f'); rect(g, 22, 40, 1, 1, '#ff4f6f'); rect(g, 25, 40, 1, 1, '#ff4f6f'); }
    },
  },
  lion: {
    eyes: [[19, 26], [29, 26]], mouth: [24, 35], ink: '#2a1404',
    draw(g, mood, t) {
      const puff = mood === 'expecting' || mood === 'happy' ? 1 : 0;
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        disc(g, 24 + Math.round(Math.cos(a) * (15 + puff)), 27 + Math.round(Math.sin(a) * (14 + puff)), 5, k % 2 ? '#9a5a1e' : '#7a3e10');
      }
      disc(g, 24, 27, 15, '#9a5a1e');
      disc(g, 14, 15, 3, '#d9a650'); disc(g, 34, 15, 3, '#d9a650');
      ellipse(g, 24, 28, 11, 11, '#d9a650'); ellipse(g, 22, 24, 7, 5, '#e8b860');
      ellipse(g, 24, 34, 6, 4, '#f3e0b0'); ellipse(g, 24, 31, 3, 2, '#5a2a14');
    },
  },
};

function eyes(g, head, mood, t) {
  const blink = mood !== 'happy' && mood !== 'pat' && t % 4 < 0.15;
  head.eyes.forEach(([x, y]) => {
    if (mood === 'happy') { [[-2, 1], [-1, 0], [0, -1], [1, 0], [2, 1]].forEach(([dx, dy]) => rect(g, x + dx, y + dy, 1, 1, INK)); return; }
    if (mood === 'pat') { [[-2, -1], [-1, 0], [0, 0], [1, 0], [2, -1]].forEach(([dx, dy]) => rect(g, x + dx, y + dy, 1, 1, INK)); return; }
    if (blink) { rect(g, x - 2, y, 5, 1, INK); return; }
    if (mood === 'sad') { rect(g, x - 2, y - 1, 5, 1, INK); rect(g, x - 2, y, 5, 2, head.ink); rect(g, x - 1, y, 1, 1, WHITE); return; }
    if (mood === 'anxious') {
      rect(g, x - 2, y - 2, 5, 5, WHITE); rect(g, x, y, 1, 1, INK);
      rect(g, x - 3, y - 4 + (x < 24 ? 1 : 0), 3, 1, INK); rect(g, x, y - 4 + (x < 24 ? 0 : 1), 3, 1, INK);  // worried brows
      return;
    }
    const big = mood === 'expecting';
    const r = big ? 3 : 2;
    disc(g, x, y, r, head.ink);
    const look = mood === 'focus' && t % 9 > 1.4 ? 1 : 0;  // mostly watching the chart, sometimes you
    rect(g, x - 1 + look, y - 1, 1, 1, WHITE);
    if (big) { rect(g, x + 1, y + 1, 1, 1, WHITE); rect(g, x - 1, y - 2, 2, 1, WHITE); }
  });
}

function mouth(g, head, mood, t) {
  if (!head.mouth) return;
  const [x, y] = head.mouth;
  if (mood === 'happy' || mood === 'expecting') {
    rect(g, x - 3, y, 7, 1, INK); rect(g, x - 2, y + 1, 5, 2, '#a8203a'); rect(g, x - 1, y + 2, 3, 1, '#ff7a9a');
  } else if (mood === 'sad') {
    rect(g, x - 2, y + 1, 5, 1, INK); rect(g, x - 3, y + 2, 1, 1, INK); rect(g, x + 3, y + 2, 1, 1, INK);
  } else if (mood === 'anxious') {
    for (let i = -3; i <= 3; i++) rect(g, x + i, y + 1 + (i % 2 ? 1 : 0), 1, 1, INK);
  } else if (mood === 'pat') {
    rect(g, x - 2, y, 1, 1, INK); rect(g, x - 1, y + 1, 1, 1, INK); rect(g, x, y, 1, 1, INK); rect(g, x + 1, y + 1, 1, 1, INK); rect(g, x + 2, y, 1, 1, INK);
  } else rect(g, x - 1, y + 1, 3, 1, INK);
}

function hand(g, t) {
  const x = 18 + Math.round(Math.sin(t * 9) * 4);
  rect(g, x, 4, 13, 6, '#ffe2cf'); rect(g, x, 9, 13, 1, '#f2b79f');
  for (let i = 0; i < 4; i++) rect(g, x + 1 + i * 3, 10, 2, 2, '#ffe2cf');
  rect(g, x + 13, 5, 6, 4, '#4a3aa8');
}

// The whole portrait for one frame.
export function drawPetHead(g, type, mood, t, accent = '#00e5ff', hungry = false) {
  g.clearRect(0, 0, 48, 48);
  disc(g, 24, 26, 22, 'rgba(255,255,255,0.05)');
  for (let i = 0; i < 48; i += 3) rect(g, i, 40 - Math.round(Math.sin(i / 6 + t * 0.5) * 4 + i / 8), 2, 1, accent);  // a chart behind it
  if (!type) {
    ellipse(g, 24, 38, 16, 6, '#7a4a2a'); ellipse(g, 24, 37, 13, 4, '#c94f7c'); ellipse(g, 24, 37, 10, 3, '#f1a7c3');
    rect(g, 22, 20 + Math.round(Math.sin(t * 2)), 4, 6, accent); rect(g, 23, 28, 2, 2, accent);
    return;
  }
  const head = HEADS[type];
  const shake = mood === 'anxious' ? Math.round(Math.sin(t * 40)) : 0;
  const hop = mood === 'happy' ? -Math.abs(Math.round(Math.sin(t * 8) * 3)) : mood === 'expecting' ? -Math.abs(Math.round(Math.sin(t * 4))) : 0;
  g.save();
  g.translate(shake, hop);
  head.draw(g, mood, t);
  eyes(g, head, mood, t);
  mouth(g, head, mood, t);
  if (mood === 'happy' || mood === 'pat') { rect(g, head.eyes[0][0] - 4, head.eyes[0][1] + 4, 3, 1, BLUSH); rect(g, head.eyes[1][0] + 2, head.eyes[1][1] + 4, 3, 1, BLUSH); }
  if (mood === 'sad') head.eyes.forEach(([x, y], i) => { const k = (t * 1.5 + i * 0.5) % 1; rect(g, x + (i ? 2 : -2), y + 3 + Math.round(k * 10), 1, 2, TEAR); });
  if (mood === 'anxious') { const k = (t * 0.8) % 1; rect(g, 38, 14 + Math.round(k * 8), 2, 3, TEAR); rect(g, 38, 13 + Math.round(k * 8), 1, 1, TEAR); }
  g.restore();
  if (mood === 'expecting' && t % 0.8 < 0.5) { icon(g, 'star', 2, 6); icon(g, 'star', 41, 10); }
  if (mood === 'happy') { icon(g, 'heart', 2, 8 + Math.round(Math.sin(t * 6))); icon(g, 'note', 42, 6); }
  if (mood === 'pat') { hand(g, t); icon(g, 'heart', 40, 14 - Math.round((t * 6) % 6)); }
  if (hungry && t % 3 < 1.5) icon(g, 'food', 3, 36);
}

export class Buddy {
  constructor(box) {
    this.box = box;
    this.canvas = box.querySelector('canvas');
    this.canvas.width = 48;
    this.canvas.height = 48;
    this.g = this.canvas.getContext('2d');
    this.label = box.querySelector('.pet-label');
    this.pet = null;      // { type, name, hungry }
    this.accent = '#00e5ff';
    this.base = 'focus';
    this.react = null;    // { mood, until }
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

  setAccent(color) { this.accent = color || '#00e5ff'; }

  setPet(pet) {
    this.pet = pet;
    this.label.textContent = pet ? `${pet.name}${pet.hungry ? ' is hungry!' : ''}` : 'No pet yet: adopt one in the Store';
    this.canvas.title = pet ? 'Pat me!' : '';
  }

  // Unrealized PnL of open positions (null: no position).
  setPosition(pnl) { this.base = pnl == null ? 'focus' : pnl >= 0 ? 'expecting' : 'anxious'; }

  // A closed trade: happy with +$ or sad with -$ above its head.
  tradeClosed(pnl) {
    this.react = { mood: pnl >= 0 ? 'happy' : 'sad', until: now() + 4 };
    const pop = document.createElement('div');
    pop.className = `pet-pop ${pnl >= 0 ? 'up' : 'down'}`;
    pop.textContent = `${pnl >= 0 ? '+' : '-'}$${Math.abs(pnl).toFixed(2)}`;
    this.box.append(pop);
    setTimeout(() => pop.remove(), 2600);
  }

  mood() {
    if (this.react && now() < this.react.until) return this.react.mood;
    return this.patting && this.pet ? 'pat' : this.base;
  }

  draw() { drawPetHead(this.g, this.pet?.type, this.mood(), now(), this.accent, this.pet?.hungry); }
}
