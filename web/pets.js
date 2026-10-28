// Pets: every species' look, its full-body sprite (garden and house) and the clothes it can wear.
// Species share templates by group (dog, cat, critter, lizard, snake, frog) and differ in colors, ears,
// size, coat, tail and markings. (x, y) is the ground under the body; `s` holds pose / dir / outfit.
import { disc, ellipse, icon, outlined, rect } from './pixel.js';

const K = '#1d1d1d';

// c body, d dark (ears, markings), w light (belly, muzzle), e eyes
export const LOOKS = {
  // dogs: size s / m / l; ear flop / up / big / bat; coat smooth / curly / fluffy; tail long / curl / stub / pom
  dog: { g: 'dog', c: '#d8a040', d: '#a8702a', w: '#f6e2b0', ear: 'flop', size: 'l', tail: 'long', coat: 'fluffy' },
  corgi: { g: 'dog', c: '#e08a3a', d: '#b0601e', w: '#fff4e4', ear: 'up', size: 'm', legs: 'short', tail: 'stub' },
  shepherd: { g: 'dog', c: '#c08040', d: '#2a1e16', w: '#d8a868', ear: 'up', size: 'l', tail: 'long', saddle: true },
  labrador: { g: 'dog', c: '#6a3e22', d: '#4a2a14', w: '#8a5a36', ear: 'flop', size: 'l', tail: 'long' },
  poodle: { g: 'dog', c: '#e8b890', d: '#c8906a', w: '#f6dcc4', ear: 'flop', size: 'm', tail: 'pom', coat: 'curly' },
  husky: { g: 'dog', c: '#7a8494', d: '#3a4250', w: '#f4f4f8', ear: 'up', size: 'l', tail: 'curl', mask: true, e: '#4fc8ff' },
  frenchie: { g: 'dog', c: '#c8b8a0', d: '#7a6a58', w: '#e8dcc8', ear: 'bat', size: 's', legs: 'short', tail: 'stub', flat: true },
  bichon: { g: 'dog', c: '#f6f6fa', d: '#d0d0dc', w: '#ffffff', ear: 'flop', size: 's', tail: 'curl', coat: 'curly' },
  pomeranian: { g: 'dog', c: '#f0a040', d: '#c87a20', w: '#ffd890', ear: 'up', size: 's', tail: 'curl', coat: 'fluffy' },
  chihuahua: { g: 'dog', c: '#e8c08a', d: '#b8885a', w: '#f8e4c4', ear: 'big', size: 's', tail: 'long' },
  // cats: pattern tabby / points / spots / solid; fur short / long; ears up / fold / tuft
  cat: { g: 'cat', c: '#f0a040', d: '#c06a20', w: '#fff3e0', pattern: 'tabby', e: '#4fc04f' },
  siamese: { g: 'cat', c: '#f4ead8', d: '#4a3428', w: '#fffaf0', pattern: 'points', e: '#3a8aff' },
  british: { g: 'cat', c: '#8a94a8', d: '#6a7488', w: '#a0aabc', pattern: 'solid', e: '#ffa020', chubby: true },
  american: { g: 'cat', c: '#c8c8cc', d: '#3a3a40', w: '#f0f0f0', pattern: 'tabby', e: '#4fc04f' },
  ragdoll: { g: 'cat', c: '#f4eee4', d: '#7a6a5a', w: '#ffffff', pattern: 'points', fur: 'long', e: '#3a8aff' },
  persian: { g: 'cat', c: '#fafafa', d: '#d8d0d0', w: '#ffffff', pattern: 'solid', fur: 'long', flat: true, e: '#ffa020' },
  mainecoon: { g: 'cat', c: '#8a6a4a', d: '#3a2818', w: '#e8dcc8', pattern: 'tabby', fur: 'long', ears: 'tuft', big: true, e: '#c8c040' },
  scottish: { g: 'cat', c: '#c8c0b4', d: '#9a9284', w: '#f0ece4', pattern: 'solid', ears: 'fold', e: '#ffa020', chubby: true },
  russianblue: { g: 'cat', c: '#7a8aa0', d: '#5a6a80', w: '#8a9ab0', pattern: 'solid', e: '#4fd84f' },
  bengal: { g: 'cat', c: '#e0a850', d: '#4a2a10', w: '#f8e4b8', pattern: 'spots', e: '#a8d84a' },
  // small mammals: body [rx, ry]; ears round / long / tiny / big; tail none / bushy / long / puff / ringed
  hamster: { g: 'critter', c: '#e8a868', d: '#c8884a', w: '#fff4e4', body: [4, 3], ears: 'round', tail: 'none' },
  guineapig: { g: 'critter', c: '#a8683a', d: '#3a2a20', w: '#f4f0e8', body: [5, 3], ears: 'tiny', tail: 'none', patches: true },
  chinchilla: { g: 'critter', c: '#a8a8b4', d: '#7a7a88', w: '#e8e8f0', body: [4, 3], ears: 'big', tail: 'bushy' },
  rabbit: { g: 'critter', c: '#d8c8b8', d: '#a89888', w: '#ffffff', body: [4, 3], ears: 'long', tail: 'puff', hop: true },
  hedgehog: { g: 'critter', c: '#8a6a4a', d: '#4a3424', w: '#f0d8b8', body: [5, 3], ears: 'tiny', tail: 'none', spikes: true },
  ferret: { g: 'critter', c: '#c8a878', d: '#4a3a2a', w: '#f4e8d8', body: [7, 2], ears: 'round', tail: 'long', mask: true },
  glider: { g: 'critter', c: '#9a9aa8', d: '#3a3a44', w: '#f4f0f0', body: [3, 2], ears: 'big', tail: 'bushy', stripe: true, bigEyes: true },
  marmoset: { g: 'critter', c: '#8a7a6a', d: '#3a3028', w: '#f0ece4', body: [3, 3], ears: 'tufts', tail: 'ringed', bigEyes: true },
  capybara: { g: 'critter', c: '#9a6a42', d: '#6a4424', w: '#b88a5a', body: [8, 4], ears: 'tiny', tail: 'none', snout: true },
  // reptiles and a frog
  lizard: { g: 'lizard', c: '#5cc85c', d: '#2f8a3f' },
  gecko: { g: 'lizard', c: '#f0d050', d: '#4a3a2a', spots: true, thick: true },
  dragon: { g: 'lizard', c: '#d8b07a', d: '#9a7040', spikes: true, big: true },
  python: { g: 'snake', c: '#6a4a2a', d: '#2a1a0e', w: '#c8a060' },
  frog: { g: 'frog', c: '#7ac04a', d: '#3a7a2a', w: '#e8803a' },
  parrot: { g: 'parrot' }, turtle: { g: 'turtle' }, lion: { g: 'lion' },
};
export const petGroup = (type) => LOOKS[type]?.g ?? 'critter';
const dark = (hex) => {  // is a color dark enough that a black eye would vanish on it?
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) < 90;
};

// Draw relative to (x, y) and facing `d` (1 right, -1 left).
function mirror(g, x, y, d) {
  return {
    R: (dx, dy, w, h, c) => rect(g, d > 0 ? x + dx : x - dx - w + 1, y + dy, w, h, c),
    E: (dx, dy, rx, ry, c) => ellipse(g, x + dx * d, y + dy, rx, ry, c),
  };
}

// ---------------------------------------------------------------- clothes on the body

// Where each clothing style sits; `at` gives the anchors of the pose being drawn.
export const STYLE_PART = {
  bandana: 'neck', bowtie: 'neck', scarf: 'neck', sailor: 'neck', flower: 'head', crown: 'head', yuzu: 'head',
  sweater: 'torso', hoodie: 'torso', raincoat: 'torso', vest: 'torso', tuxedo: 'torso', kimono: 'torso', tutu: 'waist', cape: 'back',
};

function wear(R, outfit, at, k = 1) {  // k: how many pixels one clothing pixel takes on this sprite
  if (!outfit) return;
  const { style, color } = outfit;
  const part = STYLE_PART[style];
  const [nx, ny] = at.neck;
  const [hx, hy] = at.head;
  const [tx, ty, tw] = at.torso;
  const P = (ax, ay, dx, dy, w, h, c) => R(ax + dx * k, ay + dy * k, w * k, h * k, c);
  if (part === 'torso' || part === 'waist' || part === 'back') {
    const h = part === 'waist' ? 2 : 3;
    R(tx - tw, ty + (part === 'waist' ? k : -k), tw * 2, h * k, color);
    if (style === 'tuxedo') { R(tx + tw - 3 * k, ty - k, 2 * k, 3 * k, '#ffffff'); P(nx, ny, 0, 0, 2, 1, '#d8102e'); }
    if (style === 'kimono') R(tx - k, ty - k, k, 3 * k, '#ffd84a');
    if (style === 'sweater') R(tx - tw, ty + k, tw * 2, k, '#ffffff');
    if (style === 'hoodie' || style === 'raincoat') P(hx, hy, -2, -1, 4, 2, color);
    if (style === 'tutu') R(tx - tw - k, ty + 2 * k, tw * 2 + 2 * k, k, '#ffffff');
    if (style === 'cape') R(tx - tw - k, ty - 2 * k, 3 * k, 4 * k, color);
  } else if (part === 'neck') {
    P(nx, ny, -1, 0, 3, 2, color);
    if (style === 'bowtie') { P(nx, ny, -2, 0, 1, 2, color); P(nx, ny, 2, 0, 1, 2, color); P(nx, ny, 0, 0, 1, 1, '#1a1a1a'); }
    if (style === 'scarf') P(nx, ny, -2, 1, 1, 3, color);
    if (style === 'sailor') { P(nx, ny, -1, 1, 3, 1, '#ffffff'); P(hx, hy, -1, -1, 3, 1, '#ffffff'); P(hx, hy, -1, -2, 3, 1, '#2a4ab8'); }
  } else {
    if (style === 'crown') { P(hx, hy, -1, -2, 4, 2, '#ffd21f'); P(hx, hy, -1, -3, 1, 1, '#ffd21f'); P(hx, hy, 2, -3, 1, 1, '#ffd21f'); P(hx, hy, 0, -1, 1, 1, '#d8102e'); }
    if (style === 'flower') { P(hx, hy, -2, -1, 1, 1, '#ff4f9a'); P(hx, hy, 0, -2, 1, 1, '#ffd84a'); P(hx, hy, 2, -1, 1, 1, '#9fd8ff'); }
    if (style === 'yuzu') { P(hx, hy, -1, -3, 3, 3, '#ffb020'); P(hx, hy, 0, -4, 1, 1, '#3a8a2a'); }
  }
}

// ---------------------------------------------------------------- shared helpers for the detailed sprites

const shade = (hex, f) => {  // a lighter (f > 1) or darker (f < 1) version of #rrggbb
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, '0');
  return `#${c(n >> 16)}${c((n >> 8) & 255)}${c(n & 255)}`;
};
const INKY = '#140c14';
const PINK = '#ff9ab0';

// an upright triangle ear: base centered at (cx, base), w wide, h tall; `inner` paints the inside
function ear(R, cx, base, w, h, c, inner) {
  for (let j = 0; j < h; j++) {
    const half = Math.max(0, Math.round(((j + 1) / h) * (w / 2)));
    R(cx - half, base - h + j, half * 2 + 1, 1, c);
    if (inner && j > 1 && half > 1) R(cx - half + 1, base - h + j, half * 2 - 1, 1, inner);
  }
}

// an eye with a highlight (and a light rim on dark fur)
function eyeAt(R, ex, ey, color, darkFur, size = 2) {
  if (darkFur) R(ex - 1, ey - 1, size + 2, size + 2, '#e8dcc8');
  R(ex, ey, size, size, color);
  R(ex, ey, 1, 1, '#ffffff');
}

// ---------------------------------------------------------------- dogs (detailed)

const DOG_SIZE = { s: { bx: 7, ry: 4, leg: 4, hr: 4 }, m: { bx: 9, ry: 5, leg: 5, hr: 5 }, l: { bx: 11, ry: 5, leg: 7, hr: 6 } };

function dogT(g, x, y, s, t, L) {
  const { R, E } = mirror(g, x, y, s.dir);
  const Z = DOG_SIZE[L.size];
  const { bx, ry, hr } = Z;
  const leg = L.legs === 'short' ? 3 : Z.leg;
  const c = L.c;
  const sh = shade(c, 0.78);
  const hl = shade(c, 1.15);
  const darkFur = dark(c);
  const eye = L.e ?? INKY;
  const paw = L.legs === 'short' || L.ear === 'big' || L.mask ? L.w : sh;
  const step = s.moving ? Math.floor(t * 10) % 2 : 0;
  const wag = Math.round(Math.sin(t * (s.pose === 'sit' ? 16 : 8)) * 2);

  const head = (hx, hy, open, closed) => {
    if (L.ear === 'flop') { E(hx - 3, hy + 1, 2, hr - 1, L.d); E(hx - 3, hy, 1, hr - 2, shade(L.d, 1.2)); }
    if (L.ear === 'up') { ear(R, hx - 3, hy - hr + 3, 4, 5, sh, null); ear(R, hx, hy - hr + 3, 4, 5, L.d, PINK); }
    if (L.ear === 'big') { ear(R, hx - 3, hy - hr + 3, 5, 7, sh, null); ear(R, hx + 1, hy - hr + 3, 5, 7, c, PINK); }
    if (L.ear === 'bat') { E(hx - 3, hy - hr, 2, 3, sh); E(hx + 1, hy - hr, 2, 3, c); R(hx + 1, hy - hr - 1, 1, 3, PINK); }
    E(hx, hy, hr, hr - 1, c);
    E(hx - 1, hy - 2, hr - 2, 1, hl);
    if (L.mask) { E(hx + 1, hy + 1, hr - 1, hr - 2, L.w); R(hx - hr + 1, hy - hr + 1, hr * 2 - 2, 2, L.d); }
    if (L.coat === 'curly') { [-2, 0, 2].forEach((dx) => E(hx + dx, hy - hr, 2, 1, L.w)); }
    if (L.coat === 'fluffy') E(hx - 2, hy + 2, 3, 2, L.w);
    const ml = L.flat ? 2 : 4;
    R(hx + hr - 2, hy, ml, 3, L.saddle ? L.d : L.w);   // the muzzle
    R(hx + hr - 2 + ml, hy, 2, 2, '#1a1010'); R(hx + hr - 2 + ml, hy, 1, 1, '#6a6a7a');  // the nose
    R(hx + hr - 1, hy + 2, ml, 1, sh);
    if (open) { R(hx + hr, hy + 3, ml, 2, '#7a1020'); R(hx + hr + 1, hy + 4, 2, 1, '#ff7a9a'); }
    if (closed) R(hx + 1, hy - 1, 3, 1, INKY); else eyeAt(R, hx + 1, hy - 2, eye, darkFur);
    R(hx, hy - 3, 3, 1, sh);  // brow
  };

  if (s.pose === 'sleep') {
    if (L.tail !== 'stub') R(-bx - 2, -3, bx, 2, L.tail === 'long' ? L.d : c);
    E(0, -ry, bx + 1, ry, c); E(-1, -ry - 1, bx - 1, 1, hl); E(0, -2, bx - 2, 1, L.w);
    if (L.saddle || L.mask) E(-1, -ry - 1, bx - 2, 2, L.d);
    head(bx + 1, -hr + 1, false, true);
    wear(R, s.outfit, { neck: [bx - 1, -2], head: [bx + 1, -hr * 2 + 1], torso: [0, -ry, bx - 2] }, 2);
    return;
  }
  if (s.pose === 'sit') {
    if (L.tail !== 'stub') R(-bx + wag, -2, bx - 2, 2, L.tail === 'long' ? L.d : c);
    E(-2, -ry - 1, bx - 3, ry + 1, sh);                    // haunch
    E(1, -leg - ry - 3, Math.max(4, bx - 4), ry + 3, c);    // chest, upright
    E(2, -leg - ry - 2, 2, ry, L.w);
    if (L.saddle || L.mask) E(-1, -leg - ry - 5, 3, ry, L.d);
    R(1, -leg - 2, 2, leg + 2, sh); R(4, -leg - 2, 2, leg + 2, c);
    R(1, -1, 3, 1, paw); R(4, -1, 3, 1, paw);
    const hy = -leg - ry * 2 - hr;
    head(4, hy, false, false);
    wear(R, s.outfit, { neck: [3, hy + hr - 1], head: [4, hy - hr], torso: [1, -leg - ry - 3, 4] }, 2);
    return;
  }
  const low = s.pose === 'dig' || s.pose === 'sniff' || s.pose === 'drink';
  const by = -leg - ry;
  if (L.tail === 'long') for (let i = 0; i < 6; i++) R(-bx - 1 - Math.floor(i / 2), by - 1 - i + (i > 3 ? wag : 0), 2, 2, i > 3 ? L.d : c);
  if (L.tail === 'curl') { R(-bx, by - ry - 1, 3, 2, c); R(-bx + 1, by - ry - 3, 2, 2, L.w); R(-bx + 3, by - ry - 2, 1, 2, c); }
  if (L.tail === 'stub') R(-bx - 2, by - 2, 2, 2, c);
  if (L.tail === 'pom') { R(-bx - 2, by - 2, 1, 4, c); disc(g, x - (bx + 3) * s.dir, y + by - 5, 2, L.w); }
  // far legs, a shade darker
  [[-bx + 3, step], [bx - 4, 1 - step]].forEach(([lx, lift]) => { R(lx, -leg - 1, 2, leg + 1 - lift, sh); R(lx, -1 - lift, 3, 1, shade(paw, 0.85)); });
  E(0, by, bx, ry, c);
  E(-1, by - ry + 1, bx - 2, 1, hl);
  E(0, by + ry - 1, bx - 3, 1, L.w);
  if (L.saddle) E(-1, by - 2, bx - 3, 2, L.d);
  if (L.mask) E(0, by - 2, bx - 1, 2, L.d);
  if (L.coat === 'fluffy') { E(bx - 3, by, 3, ry, L.w); for (let i = -bx + 1; i < bx; i += 3) R(i, by - ry - 1, 2, 1, c); }
  if (L.coat === 'curly') for (let i = -bx + 1; i < bx; i += 2) { R(i, by - ry, 1, 1, L.w); R(i + 1, by + ry - 1, 1, 1, L.w); }
  // near legs with paws
  [[-bx + 1, 1 - step], [bx - 2, step]].forEach(([lx, lift]) => { R(lx, -leg - 1, 2, leg + 1 - lift, c); R(lx, -1 - lift, 3, 1, paw); });
  R(bx - 3, by - ry - 2, 4, ry + 1, c);  // the neck
  const hx = low ? bx + 4 : bx + 2;
  const hy = low ? by + 2 : by - ry - hr + 1;
  head(hx, hy, s.pose === 'bark', false);
  if (s.pose === 'dig') R(hx + hr + 4 + (Math.floor(t * 10) % 3), -2 - (Math.floor(t * 10) % 2), 2, 1, '#6b4220');
  if (s.pose === 'drink') R(hx + hr + 2, -1, 4, 1, '#4dc3ff');
  wear(R, s.outfit, { neck: [bx - 2, by - ry + 1], head: [hx, hy - hr], torso: [0, by - 1, bx - 3] }, 2);
}

// ---------------------------------------------------------------- cats (detailed)

function catT(g, x, y, s, t, L) {
  const { R, E } = mirror(g, x, y, s.dir);
  const bx = L.big ? 11 : 9;
  const ry = L.chubby ? 5 : 4;
  const leg = 5;
  const c = L.c;
  const sh = shade(c, 0.8);
  const hl = shade(c, 1.12);
  const pts = L.pattern === 'points';
  const ext = pts ? L.d : c;               // ears, legs and tail of a pointed cat are dark
  const fur = L.fur === 'long' ? 1 : 0;
  const darkFur = dark(c);
  const step = s.moving ? Math.floor(t * 9) % 2 : 0;
  const sway = Math.round(Math.sin(t * 2) * 1.5);

  const marks = (cx, cy, rx) => {
    if (L.pattern === 'tabby') for (let i = -rx + 2; i < rx - 1; i += 3) R(cx + i, cy, 1, 3, L.d);
    if (L.pattern === 'spots') for (let i = -rx + 2; i < rx - 1; i += 3) { R(cx + i, cy + (i % 2 ? 0 : 2), 2, 2, L.d); R(cx + i, cy + (i % 2 ? 0 : 2), 1, 1, hl); }
  };
  const head = (hx, hy, closed, lick) => {
    if (L.ears === 'fold') { R(hx - 4, hy - 4, 3, 2, ext); R(hx + 1, hy - 4, 3, 2, ext); }
    else {
      ear(R, hx - 2, hy - 2, 4, 5, ext, PINK); ear(R, hx + 3, hy - 2, 4, 5, shade(ext, 0.85), null);
      if (L.ears === 'tuft') { R(hx - 2, hy - 9, 1, 2, L.d); R(hx + 3, hy - 9, 1, 2, L.d); }
    }
    if (fur) E(hx - 1, hy + 2, 6, 3, L.w);            // the ruff of a long-haired cat
    E(hx, hy, L.chubby ? 6 : 5, 4, c);
    E(hx - 1, hy - 2, 3, 1, hl);
    if (L.pattern === 'tabby') { R(hx - 1, hy - 4, 1, 2, L.d); R(hx + 1, hy - 4, 1, 2, L.d); }
    if (pts) E(hx + 2, hy + 1, 3, 2, L.d);
    if (closed) { R(hx, hy - 1, 2, 1, INKY); R(hx + 3, hy - 1, 2, 1, INKY); }
    else {
      eyeAt(R, hx, hy - 1, L.e, darkFur); R(hx + 1, hy - 1, 1, 2, INKY);
      R(hx + 3, hy - 1, 2, 2, L.e); R(hx + 4, hy - 1, 1, 2, INKY);
    }
    R(hx + (L.flat ? 4 : 5), hy + 1, 1, 1, PINK);
    R(hx + 3, hy + 2, 2, 1, sh);
    R(hx + 5, hy + 1, 4, 1, '#f4f0e8'); R(hx + 5, hy + 3, 4, 1, '#f4f0e8');  // whiskers
    if (lick) R(hx + 4, hy + 3, 2, 1, '#ff7a9a');
  };

  if (s.pose === 'sleep') {  // curled up, tail wrapped round
    R(-bx - 1, -2, bx * 2, 2 + fur, ext);
    E(0, -ry - 1, bx, ry + 1, c); E(-1, -ry - 2, bx - 2, 1, hl); marks(0, -ry * 2, bx);
    head(bx - 3, -ry - 1, true, false);
    wear(R, s.outfit, { neck: [bx - 5, -ry + 1], head: [bx - 3, -ry * 2 - 4], torso: [0, -ry - 1, bx - 3] }, 2);
    return;
  }
  if (s.pose === 'sit' || s.pose === 'groom') {
    for (let i = 0; i < bx; i++) R(-bx + i + sway, -2 - (i < 3 ? 2 - i : 0), 1, 2 + fur, ext);  // tail around the paws
    E(-2, -ry - 1, bx - 3, ry + 1, sh);
    E(1, -leg - ry - 2, 5, ry + 3, c); E(2, -leg - ry - 1, 3, ry + 1, L.w); marks(-2, -leg - ry - 3, 4);
    R(1, -leg - 2, 2, leg + 2, ext); R(4, -leg - 2, 2, leg + 2, ext);
    R(1, -1, 3, 1, pts ? L.d : L.w); R(4, -1, 3, 1, pts ? L.d : L.w);
    const hy = -leg - ry * 2 - 4;
    head(3, hy, s.pose === 'groom', s.pose === 'groom');
    if (s.pose === 'groom') R(6, hy + 1 + (Math.floor(t * 6) % 2), 2, 4, ext);  // a paw up to the face
    wear(R, s.outfit, { neck: [2, hy + 4], head: [3, hy - 5], torso: [1, -leg - ry - 2, 4] }, 2);
    return;
  }
  const crouch = s.pose === 'stalk' ? 2 : 0;
  const by = -leg - ry + crouch;
  for (let i = 0; i < 10; i++) R(-bx - Math.floor(i / 3), by - 1 - i + (i > 6 ? sway : 0) + crouch, 2 + fur, 2, i > 7 && L.pattern === 'tabby' ? L.d : ext);
  [[-bx + 3, step], [bx - 4, 1 - step]].forEach(([lx, lift]) => { R(lx, -leg - 1 + crouch, 2, leg + 1 - lift - crouch, shade(ext, 0.8)); });
  E(0, by, bx, ry, c); E(-1, by - ry + 1, bx - 2, 1, hl); E(0, by + ry - 1, bx - 3, 1, L.w);
  marks(0, by - ry + 1, bx);
  if (fur) for (let i = -bx; i < bx; i += 2) R(i, by + ry, 1, 1, c);
  [[-bx + 1, 1 - step], [bx - 2, step]].forEach(([lx, lift]) => { R(lx, -leg - 1 + crouch, 2, leg + 1 - lift - crouch, ext); R(lx, -1 - lift, 3, 1, pts ? L.d : L.w); });
  const hx = bx + 2;
  const hy = by - ry - 1 + crouch;
  head(hx, hy, false, false);
  wear(R, s.outfit, { neck: [bx - 1, by - ry + 1], head: [hx, hy - 5], torso: [0, by - 1, bx - 3] }, 2);
}

// ---------------------------------------------------------------- small mammals (detailed)

const CRITTER_BODY = {
  hamster: [7, 5], guineapig: [9, 5], chinchilla: [7, 6], rabbit: [7, 5], hedgehog: [9, 5], ferret: [13, 3],
  glider: [5, 3], marmoset: [5, 5], capybara: [14, 7],
};

function critterT(g, x, y, s, t, L, type) {
  const { R, E } = mirror(g, x, y, s.dir);
  const [rx, ry] = CRITTER_BODY[type] ?? [7, 5];
  const c = L.c;
  const sh = shade(c, 0.8);
  const hl = shade(c, 1.15);
  const step = s.moving ? Math.floor(t * (L.hop ? 6 : 12)) % 2 : 0;
  const hop = L.hop && s.moving ? -Math.abs(Math.round(Math.sin(t * 10) * 4)) : 0;
  const curl = s.pose === 'sleep' || (type === 'hedgehog' && s.pose === 'hide');
  const up = s.pose === 'sit' || s.pose === 'eat';
  const legH = type === 'capybara' ? 3 : 2;
  const by = -ry - legH + hop - (up ? 2 : 0);
  if (s.pose === 'glide') {  // a sugar glider spreads its membrane
    R(-9, -12, 19, 3, c); R(-9, -10, 19, 1, L.w); R(-8, -12, 17, 1, L.d);
    R(-13, -11, 4, 2, L.d); R(9, -13, 4, 3, c); eyeAt(R, 11, -13, INKY, false, 2);
    return;
  }
  // tails behind the body
  if (L.tail === 'long') for (let i = 0; i < 7; i++) R(-rx - 1 - i, by + 1 + Math.round(Math.sin(t * 3 + i / 2)), 2, 2, i > 4 ? L.d : c);
  if (L.tail === 'bushy') { disc(g, x - (rx + 2) * s.dir, y + by - 1, 3, c); disc(g, x - (rx + 3) * s.dir, y + by - 2, 2, hl); }
  if (L.tail === 'puff') disc(g, x - (rx + 1) * s.dir, y + by + 1, 2, L.w);
  if (L.tail === 'ringed') for (let i = 0; i < 14; i++) R(-rx - 1 - Math.floor(i * 0.8), by - Math.round(Math.sin(i / 3 + t) * 3) - Math.floor(i / 3), 2, 2, i % 3 ? L.d : L.w);
  if (!curl) {
    if (type === 'capybara') [[-rx + 2, step], [-rx + 5, 1 - step], [rx - 6, 1 - step], [rx - 3, step]].forEach(([lx, lift], i) => R(lx, -legH - 1, 2, legH + 1 - lift, i % 2 ? sh : c));
    else [[-rx + 2, step], [rx - 3, 1 - step]].forEach(([lx, lift]) => R(lx, -legH - 1, 3, legH + 1 - lift, L.d === c ? sh : shade(c, 0.85)));
  }
  E(0, by, rx, ry, c);
  E(-1, by - ry + 1, rx - 2, 1, hl);
  E(1, by + Math.ceil(ry / 2), rx - 2, Math.max(1, Math.floor(ry / 2)), L.w);
  if (L.patches) { E(-3, by - 1, 3, 3, L.d); E(3, by - 2, 2, 2, L.w); }
  if (L.stripe) R(-rx + 1, by - ry, rx * 2 - 2, 1, L.d);
  if (type === 'chinchilla') for (let i = -rx; i < rx; i += 2) R(i, by - ry - 1, 1, 1, c);
  if (L.spikes) for (let i = -rx + 1; i < rx - 1; i += 2) for (let r = 0; r < 2; r++) { R(i + r, by - ry - 2 + r * 3, 1, 3, L.d); R(i + r, by - ry - 2 + r * 3, 1, 1, '#d8b888'); }
  // the head
  if (type === 'capybara') {
    const hx = rx - 2;
    const hy = by - 3;
    R(hx, hy - 3, 9, 7, c); R(hx, hy - 3, 9, 1, hl); R(hx + 7, hy - 1, 3, 5, L.d); R(hx + 8, hy, 1, 1, INKY);
    R(hx + 1, hy - 5, 2, 2, L.d);
    if (curl) R(hx + 4, hy - 1, 2, 1, INKY); else eyeAt(R, hx + 4, hy - 2, INKY, false);
    wear(R, s.outfit, { neck: [hx, hy + 3], head: [hx + 3, hy - 5], torso: [0, by, rx - 3] }, 2);
    return;
  }
  const hx = rx - 1;
  const hy = by - (up ? 4 : 2);
  if (L.ears === 'long') {
    const flop = s.moving ? 0 : Math.round(Math.sin(t) * 0.8);
    E(hx - 1 + flop, hy - 8, 1, 5, c); E(hx + 2, hy - 8, 1, 5, sh); R(hx - 1 + flop, hy - 11, 1, 6, PINK);
  }
  if (L.ears === 'big') { disc(g, x + (hx - 1) * s.dir, y + hy - 4, 3, L.d); disc(g, x + (hx - 1) * s.dir, y + hy - 4, 2, PINK); }
  if (L.ears === 'round') { disc(g, x + (hx) * s.dir, y + hy - 4, 2, L.d); disc(g, x + hx * s.dir, y + hy - 4, 1, PINK); }
  if (L.ears === 'tiny') R(hx, hy - 4, 2, 2, L.d);
  if (L.ears === 'tufts') { disc(g, x + (hx - 2) * s.dir, y + hy - 1, 2, L.w); disc(g, x + (hx + 4) * s.dir, y + hy - 1, 2, L.w); }
  if (type === 'ferret') { E(hx + 3, hy, 4, 3, c); R(hx + 1, hy - 1, 6, 2, L.d); }
  else E(hx + 2, hy, 4, 3, c);
  E(hx + 3, hy + 1, 2, 1, L.w);
  if (curl) R(hx + 3, hy - 1, 2, 1, INKY); else eyeAt(R, hx + 3, hy - 2, INKY, false, L.bigEyes ? 3 : 2);
  R(hx + 6, hy, 1, 1, type === 'hedgehog' ? INKY : PINK);
  R(hx + 5, hy + 1, 4, 1, '#f4f0e8');  // whiskers
  if (s.pose === 'eat') { R(hx + 4, hy + 2, 2, 2, c); if (Math.floor(t * 6) % 2) R(hx + 6, hy + 2, 2, 2, '#7ac04a'); }
  wear(R, s.outfit, { neck: [hx, hy + 3], head: [hx + 2, hy - 4], torso: [0, by, rx - 3] }, 2);
}

// ---------------------------------------------------------------- reptiles, snake, frog

function lizardT(g, x, y, s, t, L) {
  const { R } = mirror(g, x, y, s.dir);
  const step = s.moving ? Math.floor(t * 14) % 2 : 0;
  const up = s.pose === 'pushup' && Math.floor(t * 3) % 2 ? -1 : 0;
  const tw = Math.round(Math.sin(t * (s.moving ? 12 : 3)));
  const b = L.big ? 1 : 0;
  R(-9 - b, -2 + tw, 5, L.thick ? 2 : 1, L.thick ? L.c : L.d); R(-4 - b, -2 - b, 8 + b * 2, 2 + b, L.c);
  if (L.spots) for (let i = -8; i < 4; i += 3) R(i, -2, 1, 1, L.d); else { R(-2, -2, 1, 1, L.d); R(1, -2, 1, 1, L.d); }
  if (L.spikes) { for (let i = -4; i < 5; i += 2) R(i, -3 - b, 1, 1, L.d); R(5, -1 + up, 3, 1, L.d); }
  R(4 + b, -3 + up - b, 3, 2 + b, L.c); R(5 + b, -3 + up - b, 1, 1, K);
  if (s.pose === 'bask' && t % 2.5 < 0.2) R(7 + b, -2, 2, 1, '#ff4f6f');
  R(-3, step ? -3 : 0, 1, 1, L.c); R(2, step ? 0 : -3 + up, 1, 1, L.c);
  R(-3, step ? 0 : -3, 1, 1, L.c); R(2, step ? -3 + up : 0, 1, 1, L.c);
}

function snakeT(g, x, y, s, t, L) {
  const { R } = mirror(g, x, y, s.dir);
  const coil = !s.moving && (s.pose === 'sleep' || s.pose === 'bask' || s.pose === 'idle' || s.pose === 'hide');
  if (coil) {
    ellipse(g, x, y - 2, 6, 2, L.c); ellipse(g, x, y - 3, 4, 1, L.d); ellipse(g, x - s.dir, y - 4, 3, 1, L.c);
    for (let i = -5; i < 6; i += 3) R(i, -2, 1, 1, L.w);
    R(2, -6, 3, 2, L.c); R(4, -6, 1, 1, K);
    if (t % 3 < 0.25) R(5, -5, 2, 1, '#ff4f6f');
    return;
  }
  for (let i = 0; i < 16; i++) {
    const sy = Math.round(Math.sin(t * 6 - i * 0.6) * 1.5);
    R(-i + 4, -2 + sy, 1, 2, L.c);
    if (i % 3 === 0) R(-i + 4, -2 + sy, 1, 1, L.w);
  }
  R(5, -3 + Math.round(Math.sin(t * 6) * 1.5), 3, 2, L.c); R(7, -3 + Math.round(Math.sin(t * 6) * 1.5), 1, 1, K);
}

function frogT(g, x, y, s, t, L) {
  const { R, E } = mirror(g, x, y, s.dir);
  const jump = s.moving ? -Math.abs(Math.round(Math.sin(t * 8) * 4)) : 0;
  const puff = Math.round(Math.sin(t * 3)) > 0 ? 1 : 0;
  E(0, -3 + jump, 5, 3, L.c); E(0, -2 + jump, 4, 1, L.d);
  [-3, 1, 3].forEach((dx) => R(dx, -5 + jump, 1, 1, L.w));
  R(-5, -1 + jump, 2, 1, L.d); R(4, -1 + jump, 2, 1, L.d);
  R(1, -7 + jump, 2, 2, L.c); R(-2, -7 + jump, 2, 2, L.c); R(2, -7 + jump, 1, 1, K); R(-1, -7 + jump, 1, 1, K);
  R(-2, -2 + jump + puff, 6, 1, '#f0e8a0');
}

// ---------------------------------------------------------------- the original parrot, turtle and lion

function parrot(g, x, y, s, t) {
  const { R, E } = mirror(g, x, y, s.dir);
  const r = '#e8322b'; const bl = '#2f6fe0'; const ye = '#f4d35e';
  if (s.pose === 'fly' || s.pose === 'glide') {
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
  wear(R, s.outfit, { neck: [0, -9], head: [1, -13 + bob], torso: [0, -6, 2] });
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

function lion(g, x, y, s, t) {
  const { R, E } = mirror(g, x, y, s.dir);
  const b = '#d9a650'; const m = '#9a5a1e'; const M = '#7a3e10'; const w = '#f3e0b0';
  const sway = Math.round(Math.sin(t * 1.5));
  if (s.pose === 'lie' || s.pose === 'sleep') {
    R(-11, -2 + sway, 4, 1, b); R(-12, -3 + sway, 2, 2, M);
    E(0, -3, 8, 2, b); R(6, -1, 5, 1, b);
    E(7, -5, 5, 4, m); E(8, -4, 3, 3, b); R(9, -3, 2, 1, w);
    if (s.pose === 'sleep') R(9, -5, 2, 1, K); else R(9, -5, 1, 1, K);
    wear(R, s.outfit, { neck: [6, -1], head: [8, -9], torso: [0, -3, 5] });
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
  wear(R, s.outfit, { neck: [5, -5], head: [7, -15], torso: [0, -7, 5] });
}

// ---------------------------------------------------------------- drawing any pet

const SIZE_OF = {
  dog: (L) => ({ s: [22, 18], m: [28, 20], l: [34, 24] }[L.size]), cat: (L) => (L.big ? [34, 24] : [30, 22]),
  critter: (L, type) => (type === 'capybara' ? [36, 20] : [CRITTER_BODY[type][0] * 2 + 10, CRITTER_BODY[type][1] * 2 + (L.ears === 'long' ? 16 : 8)]),
  lizard: () => [36, 12], snake: () => [32, 14], frog: () => [24, 16], parrot: () => [28, 30], turtle: () => [28, 16], lion: () => [52, 34],
};
export const PET_SIZE = Object.fromEntries(Object.entries(LOOKS).map(([k, L]) => [k, SIZE_OF[L.g](L, k)]));

// The small sprites (reptiles, frog, parrot, turtle, lion) are drawn at twice their size.
const small = document.createElement('canvas');
small.width = 40;
small.height = 30;
function twice(g, draw, X, Y, s, t) {
  const sg = small.getContext('2d');
  sg.clearRect(0, 0, 40, 30);
  draw(sg, 20, 26, s, t);
  g.imageSmoothingEnabled = false;
  g.drawImage(small, X - 40, Y - 52, 80, 60);
}

function body(g, type, x, y, s, t) {
  const L = LOOKS[type] ?? LOOKS.hamster;
  if (L.g === 'dog') return dogT(g, x, y, s, t, L);
  if (L.g === 'cat') return catT(g, x, y, s, t, L);
  if (L.g === 'critter') return critterT(g, x, y, s, t, L, type);
  const fn = { lizard: (sg, X, Y, ss, tt) => lizardT(sg, X, Y, ss, tt, L), snake: (sg, X, Y, ss, tt) => snakeT(sg, X, Y, ss, tt, L),
    frog: (sg, X, Y, ss, tt) => frogT(sg, X, Y, ss, tt, L), parrot, turtle, lion }[L.g];
  return twice(g, fn, x, y, s, t);
}

export function drawPet(g, type, x, y, s, t) {
  if (s.dead) return grave(g, x, y);
  outlined(g, x - 40, y - 56, 80, 60, '#120c1c', (sg) => body(sg, type, 40, 56, s, t));
  if (s.emote) icon(g, s.emote, x - 2, y - (PET_SIZE[type]?.[1] ?? 12) - 7);
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
