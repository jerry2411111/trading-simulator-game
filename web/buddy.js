// Your pet next to the chart: a pixel head portrait whose mood follows your trading. Focused when you
// are flat, expecting when an open position is winning, anxious when it is losing, happy (+$) or sad
// (-$) when a trade closes; hover to pat it. It is the pet you picked as companion in the garden.
import { LOOKS, STYLE_PART } from './pets.js';
import { disc, ellipse, icon, now, rect } from './pixel.js';

const INK = '#1a1020';
const WHITE = '#ffffff';
const BLUSH = 'rgba(255,120,160,0.7)';
const TEAR = '#7fd4ff';
const shade = (hex, f) => {  // a lighter (f > 1) or darker (f < 1) version of #rrggbb
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, '0');
  return `#${c(n >> 16)}${c((n >> 8) & 255)}${c(n & 255)}`;
};

// Head templates per group, colored and shaped by the species' look (pets.js). Each head: draw(g, mood, t)
// paints the face; eyes / mouth are where the expression goes; ink is the eye color.
function dogHead(L) {
  const blaze = L.mask || (L.ear === 'up' && !L.saddle);  // corgis and huskies have a white stripe up the face
  return {
    eyes: [[17, 25], [31, 25]], mouth: [24, 37], ink: L.e ?? '#3a2010', big: true,
    draw(g, mood) {
      const droop = mood === 'sad' ? 4 : mood === 'expecting' || mood === 'happy' ? -2 : 0;
      // ears attached to the head: soft rounded triangles, or long floppy ears
      if (L.ear === 'flop') { ellipse(g, 9, 26 + droop, 5, 10, L.d); ellipse(g, 39, 26 + droop, 5, 10, L.d); ellipse(g, 9, 24 + droop, 3, 7, shade(L.d, 1.15)); ellipse(g, 39, 24 + droop, 3, 7, shade(L.d, 1.15)); }
      if (L.ear === 'up' || L.ear === 'big' || L.ear === 'bat') {
        const h = L.ear === 'big' ? 13 : L.ear === 'bat' ? 9 : 11;
        const col = L.saddle ? L.d : L.c;
        const tilt = droop > 0 ? 3 : 0;
        [[13, -1], [35, 1]].forEach(([cx, side]) => {
          for (let j = 0; j < h; j++) {
            const k = j / (h - 1);
            const half = Math.round(1 + k * 5 + (L.ear === 'bat' ? 1 : 0));
            const ox = cx + side * Math.round((1 - k) * 2) + side * tilt * (1 - k);
            rect(g, ox - half, 6 + j + tilt, half * 2 + 1, 1, col);
            if (j > 2 && j < h - 1 && half > 2) rect(g, ox - half + 2, 6 + j + tilt, half * 2 - 3, 1, '#ffb0c0');
          }
        });
      }
      ellipse(g, 24, 27, 15, 13, L.c);                    // a big round face
      ellipse(g, 22, 21, 9, 5, shade(L.c, 1.1));
      if (L.mask) { ellipse(g, 24, 32, 12, 8, L.w); rect(g, 22, 14, 4, 12, L.w); }
      else if (blaze) rect(g, 22, 14, 4, 10, L.w);
      if (L.saddle) { ellipse(g, 24, 35, 7, 5, L.d); }     // a shepherd's dark muzzle
      if (L.coat === 'curly') for (let k = 0; k < 8; k++) disc(g, 14 + k * 3, 15 + (k % 2) * 2, 2, L.w);
      if (L.coat === 'fluffy') { ellipse(g, 10, 33, 5, 6, L.w); ellipse(g, 38, 33, 5, 6, L.w); }
      ellipse(g, 24, 34, 8, 6, L.saddle ? L.d : L.w);       // the snout
      ellipse(g, 24, 31, 3, 2, '#1a1020'); rect(g, 22, 30, 2, 1, '#8a8a9a');  // a round nose
      ellipse(g, 12, 32, 3, 2, 'rgba(255,140,170,0.55)'); ellipse(g, 36, 32, 3, 2, 'rgba(255,140,170,0.55)');  // rosy cheeks
    },
  };
}

function catHead(L) {
  const pts = L.pattern === 'points';
  return {
    eyes: [[18, 26], [30, 26]], mouth: [24, 34], ink: L.e,
    draw(g, mood) {
      const flat = mood === 'anxious' || mood === 'sad' ? 3 : 0;
      const ear = pts ? L.d : L.c;
      if (L.ears === 'fold') {
        ellipse(g, 15, 17, 5, 3, ear); ellipse(g, 33, 17, 5, 3, ear);
      } else if (L.ears === 'big' || L.ears === 'small') {  // tall pointed ears (siamese, russian blue) or small low ones (british, persian)
        const n = L.ears === 'big' ? 14 : 6;
        const top = L.ears === 'big' ? 6 : 15;
        [[16, -1], [32, 1]].forEach(([ex, side]) => {
          for (let j = 0; j < n; j++) {
            const half = Math.round(((j + 1) / n) * (L.ears === 'big' ? 6 : 5));
            const sx = ex + side * Math.round((1 - j / n) * 3) + flat * side;
            rect(g, sx - half, top + flat + j, half * 2 + 1, 1, ear);
            if (j > 2 && half > 2) rect(g, sx - half + 2, top + flat + j, half * 2 - 3, 1, '#ff9ab0');
          }
        });
      } else {
        for (let j = 0; j < 9; j++) { rect(g, 11 + flat + Math.floor(j / 2), 13 + flat + j, 9 - j, 1, ear); rect(g, 28 + Math.ceil(j / 2), 13 + flat + j, 9 - j, 1, ear); }
        for (let j = 2; j < 7; j++) { rect(g, 14 + flat + Math.floor(j / 2), 13 + flat + j, 4 - Math.floor(j / 2), 1, '#ff9ab0'); rect(g, 31 + Math.ceil(j / 2), 13 + flat + j, 4 - Math.floor(j / 2), 1, '#ff9ab0'); }
        if (L.ears === 'tuft') { rect(g, 15 + flat, 9 + flat, 1, 4, L.d); rect(g, 32, 9 + flat, 1, 4, L.d); }
      }
      if (L.fur === 'long') { ellipse(g, 24, 32, 17, 11, L.w); }
      ellipse(g, 24, 28, L.chubby ? 16 : L.slim ? 12 : 14, L.chubby ? 11 : 10, L.c); ellipse(g, 22, 25, L.slim ? 7 : 9, 5, L.c);
      if (L.slim) ellipse(g, 24, 35, 7, 5, L.c);  // a long wedge face
      if (L.pattern === 'tabby' || L.pattern === 'classic') [20, 24, 28].forEach((x) => rect(g, x, 18, 1, 4, L.d));
      if (L.pattern === 'classic') [[12, 1], [36, -1]].forEach(([x, d]) => { rect(g, x - 1, 26, 3, 1, L.d); rect(g, x + d * 2, 27, 1, 3, L.d); rect(g, x - 1, 30, 3, 1, L.d); });  // swirls on the cheeks
      if (L.pattern === 'rosettes') [[16, 19], [30, 19], [12, 25], [36, 25], [23, 17]].forEach(([x, y]) => { rect(g, x, y, 3, 2, L.d); rect(g, x + 1, y, 1, 1, '#c87a30'); });
      if (L.sheen) [[16, 20], [28, 19], [34, 24], [13, 26]].forEach(([x, y]) => rect(g, x, y, 1, 1, '#c8d4ec'));
      if (L.mitts) ellipse(g, 24, 37, 6, 3, '#ffffff');
      if (L.pattern === 'spots') [[17, 19], [24, 18], [31, 19], [14, 24], [34, 24]].forEach(([x, y]) => { rect(g, x, y, 2, 2, L.d); rect(g, x, y, 1, 1, L.c); });
      if (pts) ellipse(g, 24, 31, 8, 6, L.d);
      ellipse(g, 24, 33, L.flat ? 5 : 6, L.flat ? 3 : 4, pts ? L.d : L.w); rect(g, 23, L.flat ? 31 : 30, 3, 2, '#ff8aa8');
      [[8, 31], [8, 34], [35, 31], [35, 34]].forEach(([x, y]) => rect(g, x, y, 6, 1, '#f4f0e8'));
    },
  };
}

function critterHead(L, type) {
  const capy = type === 'capybara';
  return {
    eyes: L.bigEyes ? [[18, 24], [30, 24]] : capy ? [[16, 22], [32, 22]] : [[19, 26], [29, 26]],
    mouth: [24, capy ? 38 : 35], ink: '#140a10',
    draw(g, mood, t) {
      if (L.ears === 'long') {
        const sag = mood === 'sad' ? 6 : 0;
        [16, 32].forEach((x, i) => { ellipse(g, x + (i ? sag / 2 : -sag / 2), 8 + sag, 4, 9, L.c); ellipse(g, x + (i ? sag / 2 : -sag / 2), 9 + sag, 2, 7, '#ffb0c0'); });
      }
      if (L.ears === 'big') { disc(g, 12, 14, 6, L.d); disc(g, 36, 14, 6, L.d); disc(g, 12, 14, 4, '#e8b0b8'); disc(g, 36, 14, 4, '#e8b0b8'); }
      if (L.ears === 'round') { disc(g, 13, 16, 4, L.d); disc(g, 35, 16, 4, L.d); disc(g, 13, 16, 2, '#f0a8a8'); disc(g, 35, 16, 2, '#f0a8a8'); }
      if (L.ears === 'tufts') { ellipse(g, 9, 22, 5, 7, L.w); ellipse(g, 39, 22, 5, 7, L.w); }
      if (L.spikes) for (let k = 0; k < 20; k++) { const a = Math.PI + (k / 19) * Math.PI; rect(g, 24 + Math.round(Math.cos(a) * 17), 30 + Math.round(Math.sin(a) * 16), 3, 3, k % 2 ? L.d : '#c8a878'); }
      if (capy) {
        rect(g, 9, 13, 30, 24, L.c); rect(g, 9, 13, 30, 2, L.w); rect(g, 13, 32, 22, 10, L.c); rect(g, 13, 38, 22, 4, L.w);
        rect(g, 10, 10, 4, 4, L.d); rect(g, 34, 10, 4, 4, L.d); rect(g, 20, 34, 2, 2, L.d); rect(g, 26, 34, 2, 2, L.d);
        return;
      }
      ellipse(g, 24, 28, 14, 12, L.c);
      if (L.stripe) rect(g, 23, 15, 2, 10, L.d);
      if (L.mask) { ellipse(g, 17, 25, 5, 3, L.d); ellipse(g, 31, 25, 5, 3, L.d); }
      if (L.patches) { ellipse(g, 15, 22, 6, 6, L.d); ellipse(g, 33, 34, 6, 5, L.w); }
      ellipse(g, 24, 33, 8, 6, L.w);
      ellipse(g, 24, 30, 2, 1, type === 'hedgehog' ? '#1a1020' : '#e87a98');
      [[7, 31], [7, 33], [36, 31], [36, 33]].forEach(([x, y]) => rect(g, x, y, 6, 1, '#e8e0e0'));
      if (mood === 'happy' && type === 'hamster') { ellipse(g, 13, 33, 4, 3, L.w); ellipse(g, 35, 33, 4, 3, L.w); }  // stuffed cheeks
    },
  };
}

function reptileHead(L, type) {
  if (type === 'python') {
    return {
      eyes: [[17, 22], [31, 22]], mouth: null, ink: '#c89a20',
      draw(g, mood, t) {
        ellipse(g, 24, 32, 9, 12, L.c); ellipse(g, 24, 24, 14, 10, L.c);
        [[16, 18], [28, 16], [20, 30], [30, 32]].forEach(([x, y]) => ellipse(g, x, y, 3, 2, L.w));
        rect(g, 20, 30, 2, 1, '#1a1020'); rect(g, 27, 30, 2, 1, '#1a1020');
        if ((mood === 'expecting' || mood === 'happy') && t % 1.2 < 0.4) { rect(g, 23, 34, 2, 5, '#ff4f6f'); rect(g, 22, 39, 1, 2, '#ff4f6f'); rect(g, 25, 39, 1, 2, '#ff4f6f'); }
      },
    };
  }
  if (type === 'frog') {
    return {
      eyes: [[14, 18], [34, 18]], mouth: [24, 34], ink: '#1a1020',
      draw(g) {
        disc(g, 14, 18, 7, L.c); disc(g, 34, 18, 7, L.c);
        ellipse(g, 24, 30, 19, 12, L.c); ellipse(g, 24, 35, 15, 6, '#f0e8a0');
        [[16, 26], [31, 25], [24, 22]].forEach(([x, y]) => disc(g, x, y, 2, L.w));
        rect(g, 7, 31, 34, 1, L.d);
      },
    };
  }
  return {
    eyes: [[15, 22], [33, 22]], mouth: [24, 33], ink: type === 'gecko' ? '#3a2a1a' : '#0a1a0a',
    draw(g, mood, t) {
      if (L.spikes) for (let k = 0; k < 9; k++) { rect(g, 8 + k * 4, 37 + (k % 2) * 2, 3, 5, L.d); rect(g, 9 + k * 4, 41, 1, 3, L.d); }
      ellipse(g, 24, 29, 15, 9, L.c); ellipse(g, 22, 26, 10, 5, L.c);
      disc(g, 15, 22, type === 'gecko' ? 6 : 5, L.c); disc(g, 33, 22, type === 'gecko' ? 6 : 5, L.c);
      if (L.spots) [[18, 30], [27, 28], [31, 33], [14, 33], [24, 25]].forEach(([x, y]) => disc(g, x, y, 1, L.d));
      else for (let k = 0; k < 7; k++) rect(g, 12 + k * 4, 33 + (k % 2), 2, 1, L.d);
      rect(g, 20, 29, 1, 1, L.d); rect(g, 28, 29, 1, 1, L.d);
      if (mood === 'expecting' && t % 1.2 < 0.3) { rect(g, 23, 36, 2, 4, '#ff4f6f'); rect(g, 22, 40, 1, 1, '#ff4f6f'); rect(g, 25, 40, 1, 1, '#ff4f6f'); }
    },
  };
}

const FIXED = {
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
  lion: {
    eyes: [[19, 26], [29, 26]], mouth: [24, 35], ink: '#2a1404',
    draw(g, mood) {
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

const headCache = {};
function headFor(type) {
  if (headCache[type]) return headCache[type];
  const L = LOOKS[type] ?? LOOKS.hamster;
  const h = FIXED[type] ?? { dog: dogHead, cat: catHead, critter: critterHead, lizard: reptileHead, snake: reptileHead, frog: reptileHead }[L.g](L, type);
  headCache[type] = h;
  return h;
}

// Shoulders and chest under the head, in the pet's own coat, so the portrait matches its body.
function bust(g, type) {
  const L = LOOKS[type];
  if (!L || !['dog', 'cat', 'critter'].includes(L.g) || type === 'capybara') return;
  const side = L.pattern === 'points' ? L.d : L.c;
  ellipse(g, 24, 50, 17, 9, side);
  ellipse(g, 24, 49, 15, 8, L.c);
  ellipse(g, 24, 48, 7, 7, L.w);
  if (L.saddle || L.mask) { ellipse(g, 10, 47, 5, 4, L.d); ellipse(g, 38, 47, 5, 4, L.d); }
  if (L.pattern === 'tabby') for (let x = 10; x < 40; x += 4) if (Math.abs(x - 24) > 6) rect(g, x, 44, 1, 4, L.d);
  if (L.pattern === 'spots') [[11, 45], [35, 46], [15, 47], [33, 44]].forEach(([x, y]) => rect(g, x, y, 2, 2, L.d));
  if (L.coat === 'curly' || L.fur === 'long') for (let x = 9; x < 41; x += 3) rect(g, x, 42 + (x % 2), 2, 2, L.w);
}

// Clothes on the portrait: around the neck, on the shoulders or on top of the head.
function drawOutfit(g, outfit, t) {
  if (!outfit) return;
  const { style, color } = outfit;
  const part = STYLE_PART[style];
  if (part === 'torso' || part === 'waist' || part === 'back') {
    ellipse(g, 24, 48, 18, 7, color);
    if (style === 'sweater') for (let x = 8; x < 41; x += 3) rect(g, x, 43, 1, 1, '#ffffff');
    if (style === 'tuxedo') { rect(g, 21, 41, 6, 7, '#ffffff'); rect(g, 22, 40, 4, 2, '#d8102e'); }
    if (style === 'kimono') { rect(g, 18, 41, 2, 7, '#ffd84a'); rect(g, 28, 41, 2, 7, '#ffd84a'); }
    if (style === 'vest') for (let y = 42; y < 48; y += 2) rect(g, 23, y, 2, 1, '#ffd84a');
    if (style === 'hoodie' || style === 'raincoat') { for (let a = 0; a <= 12; a++) { const r = 18; const x = 24 + Math.round(Math.cos(Math.PI + (a / 12) * Math.PI) * r); const y = 28 + Math.round(Math.sin(Math.PI + (a / 12) * Math.PI) * 16); rect(g, x - 1, y - 1, 3, 3, color); } }
    if (style === 'tutu') for (let x = 6; x < 43; x += 2) rect(g, x, 42 + (x % 4 ? 0 : 1), 2, 2, '#ffffff');
    if (style === 'cape') { rect(g, 4, 34, 4, 14, color); rect(g, 40, 34, 4, 14, color); rect(g, 22, 41, 4, 2, '#ffd21f'); }
  } else if (part === 'neck') {
    if (style === 'bandana') for (let j = 0; j < 7; j++) rect(g, 15 + j, 40 + j, 18 - j * 2, 1, color);
    if (style === 'bowtie') { for (let j = 0; j < 5; j++) { rect(g, 17, 40 + j, 1 + j, 1, color); rect(g, 31 - j, 40 + j, 1 + j, 1, color); } rect(g, 22, 41, 4, 3, color); rect(g, 23, 42, 2, 1, '#1a1a1a'); }
    if (style === 'scarf') { rect(g, 12, 40, 24, 4, color); rect(g, 29, 43, 4, 5, color); for (let x = 13; x < 36; x += 3) rect(g, x, 41, 1, 2, '#ffffff'); }
    if (style === 'sailor') { rect(g, 13, 40, 22, 5, '#2a4ab8'); rect(g, 13, 41, 22, 1, '#ffffff'); rect(g, 22, 44, 4, 3, '#d8102e'); rect(g, 15, 4, 18, 4, '#ffffff'); rect(g, 15, 7, 18, 1, '#2a4ab8'); }
  } else {
    if (style === 'crown') { rect(g, 15, 6, 18, 5, '#ffd21f'); [15, 21, 27, 32].forEach((x) => rect(g, x, 3, 2, 3, '#ffd21f')); rect(g, 23, 7, 2, 2, '#d8102e'); if (t % 2 < 0.3) rect(g, 30, 4, 1, 1, '#ffffff'); }
    if (style === 'flower') [[14, 9, '#ff4f9a'], [19, 6, '#ffd84a'], [24, 5, '#9fd8ff'], [29, 6, '#ff9ab0'], [34, 9, '#ffffff']].forEach(([x, y, c]) => { disc(g, x, y, 2, c); rect(g, x, y, 1, 1, '#ffd21f'); });
    if (style === 'yuzu') { disc(g, 24, 8, 5, '#ffb020'); rect(g, 22, 5, 2, 1, '#ffe08a'); rect(g, 24, 2, 2, 2, '#3a8a2a'); }
  }
}

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
    const r = (head.big ? 3 : 2) + (big ? 1 : 0);  // dogs get big, shiny eyes
    const look = mood === 'focus' && t % 9 > 1.4 ? 1 : 0;  // mostly watching the chart, sometimes you
    disc(g, x, y, r + 1, INK);                               // a dark rim so the eye shows on any fur
    disc(g, x, y, r, head.ink);                              // the iris
    rect(g, x - (big ? 1 : 0) + look, y - (big ? 1 : 0), big ? 2 : 1, big ? 2 : 1, INK);  // the pupil
    rect(g, x - 1 + look, y - 1, 1, 1, WHITE);
    if (big || head.big) { rect(g, x + 1, y + 1, 1, 1, WHITE); rect(g, x - 1, y - 2, 2, 1, WHITE); }
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
  } else if (head.big) {  // a happy little "w"
    rect(g, x - 3, y, 1, 1, INK); rect(g, x - 2, y + 1, 1, 1, INK); rect(g, x - 1, y, 1, 1, INK); rect(g, x, y, 1, 1, INK); rect(g, x + 1, y + 1, 1, 1, INK); rect(g, x + 2, y, 1, 1, INK);
  } else rect(g, x - 1, y + 1, 3, 1, INK);
}

function hand(g, t) {
  const x = 18 + Math.round(Math.sin(t * 9) * 4);
  rect(g, x, 4, 13, 6, '#ffe2cf'); rect(g, x, 9, 13, 1, '#f2b79f');
  for (let i = 0; i < 4; i++) rect(g, x + 1 + i * 3, 10, 2, 2, '#ffe2cf');
  rect(g, x + 13, 5, 6, 4, '#4a3aa8');
}

// The whole portrait for one frame.
export function drawPetHead(g, type, mood, t, accent = '#00e5ff', hungry = false, outfit = null, chart = true) {
  g.clearRect(0, 0, 48, 48);
  disc(g, 24, 26, 22, 'rgba(255,255,255,0.05)');
  if (chart) for (let i = 0; i < 48; i += 3) rect(g, i, 40 - Math.round(Math.sin(i / 6 + t * 0.5) * 4 + i / 8), 2, 1, accent);  // a chart behind it
  if (!type) {
    ellipse(g, 24, 38, 16, 6, '#7a4a2a'); ellipse(g, 24, 37, 13, 4, '#c94f7c'); ellipse(g, 24, 37, 10, 3, '#f1a7c3');
    rect(g, 22, 20 + Math.round(Math.sin(t * 2)), 4, 6, accent); rect(g, 23, 28, 2, 2, accent);
    return;
  }
  const head = headFor(type);
  const shake = mood === 'anxious' ? Math.round(Math.sin(t * 40)) : 0;
  const hop = mood === 'happy' ? -Math.abs(Math.round(Math.sin(t * 8) * 3)) : mood === 'expecting' ? -Math.abs(Math.round(Math.sin(t * 4))) : 0;
  g.save();
  g.translate(shake, hop);
  bust(g, type);
  head.draw(g, mood, t);
  eyes(g, head, mood, t);
  mouth(g, head, mood, t);
  drawOutfit(g, outfit, t);
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
    this.pet = null;      // { type, name, hungry, outfit }
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

  draw() { drawPetHead(this.g, this.pet?.type, this.mood(), now(), this.accent, this.pet?.hungry, this.pet?.outfit); }
}
