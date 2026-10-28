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

function wear(R, outfit, at) {
  if (!outfit) return;
  const { style, color } = outfit;
  const part = STYLE_PART[style];
  const [nx, ny] = at.neck;
  const [hx, hy] = at.head;
  const [tx, ty, tw] = at.torso;
  if (part === 'torso' || part === 'waist' || part === 'back') {
    const h = part === 'waist' ? 2 : 3;
    R(tx - tw, ty + (part === 'waist' ? 1 : -1), tw * 2, h, color);
    if (style === 'tuxedo') { R(tx + tw - 3, ty - 1, 2, 3, '#ffffff'); R(nx, ny, 2, 1, '#d8102e'); }
    if (style === 'kimono') R(tx - 1, ty - 1, 1, 3, '#ffd84a');
    if (style === 'sweater') R(tx - tw, ty + 1, tw * 2, 1, '#ffffff');
    if (style === 'hoodie' || style === 'raincoat') R(hx - 2, hy - 2, 4, 2, color);
    if (style === 'tutu') R(tx - tw - 1, ty + 2, tw * 2 + 2, 1, '#ffffff');
    if (style === 'cape') R(tx - tw - 1, ty - 2, 3, 4, color);
  } else if (part === 'neck') {
    R(nx - 1, ny, 3, 2, color);
    if (style === 'bowtie') { R(nx - 2, ny, 1, 2, color); R(nx + 2, ny, 1, 2, color); R(nx, ny, 1, 1, '#1a1a1a'); }
    if (style === 'scarf') R(nx - 2, ny + 1, 1, 3, color);
    if (style === 'sailor') { R(nx - 1, ny + 1, 3, 1, '#ffffff'); R(hx - 1, hy - 3, 3, 1, '#ffffff'); R(hx - 1, hy - 4, 3, 1, '#2a4ab8'); }
  } else {
    if (style === 'crown') { R(hx - 1, hy - 4, 4, 2, '#ffd21f'); R(hx - 1, hy - 5, 1, 1, '#ffd21f'); R(hx + 2, hy - 5, 1, 1, '#ffd21f'); R(hx, hy - 3, 1, 1, '#d8102e'); }
    if (style === 'flower') { R(hx - 2, hy - 3, 1, 1, '#ff4f9a'); R(hx, hy - 4, 1, 1, '#ffd84a'); R(hx + 2, hy - 3, 1, 1, '#9fd8ff'); }
    if (style === 'yuzu') { R(hx - 1, hy - 5, 3, 3, '#ffb020'); R(hx, hy - 6, 1, 1, '#3a8a2a'); }
  }
}

// ---------------------------------------------------------------- dogs

const DOG_SIZE = { s: { bx: 3, leg: 2, hx: 4 }, m: { bx: 4, leg: 3, hx: 5 }, l: { bx: 5, leg: 3, hx: 6 } };

function dogT(g, x, y, s, t, L) {
  const { R, E } = mirror(g, x, y, s.dir);
  const Z = DOG_SIZE[L.size];
  const leg = L.legs === 'short' ? 1 : Z.leg;
  const bx = Z.bx;
  const step = s.moving ? Math.floor(t * 12) % 2 : 0;
  const wag = Math.round(Math.sin(t * (s.pose === 'sit' ? 18 : 9)) * 1.5);
  const ears = (hx, hy) => {
    if (L.ear === 'flop') R(hx - 2, hy - 1, 2, 3 + step, L.d);
    if (L.ear === 'up') { R(hx - 1, hy - 4, 1, 2, L.d); R(hx + 1, hy - 4, 1, 2, L.d); }
    if (L.ear === 'big') { R(hx - 2, hy - 5, 2, 3, L.c); R(hx + 1, hy - 5, 2, 3, L.c); R(hx - 2, hy - 4, 1, 1, '#ffb0b0'); }
    if (L.ear === 'bat') { R(hx - 2, hy - 4, 2, 2, L.c); R(hx + 1, hy - 4, 2, 2, L.c); }
  };
  const head = (hx, hy, open) => {
    E(hx, hy, 3, 2, L.c);
    if (L.mask) { R(hx - 2, hy - 2, 4, 1, L.d); R(hx + 1, hy, 3, 2, L.w); }
    R(hx + 2, hy, L.flat ? 1 : 2, 2, L.w);
    R(hx + (L.flat ? 3 : 4), hy, 1, 1, K);
    R(hx, hy - 1, 1, 1, L.e ?? K);
    if (L.coat === 'curly') { R(hx - 1, hy - 3, 3, 1, L.w); R(hx - 2, hy - 2, 1, 1, L.w); }
    if (L.coat === 'fluffy') R(hx - 3, hy + 1, 2, 2, L.w);
    ears(hx, hy);
    if (open) R(hx + 3, hy + 2, 2, 1, '#a02030');
  };
  if (s.pose === 'sleep') {
    E(0, -3, bx + 1, 2, L.c); E(-1, -2, bx - 1, 1, L.w); E(bx + 1, -3, 3, 2, L.c); R(bx - 1, -5, 2, 2, L.d); R(bx + 3, -3, 2, 1, K);
    if (L.tail !== 'stub') R(-bx - 2, -2, 3, 1, L.d);
    wear(R, s.outfit, { neck: [bx, -2], head: [bx + 1, -4], torso: [0, -3, bx - 1] });
    return;
  }
  if (s.pose === 'sit') {
    if (L.tail !== 'stub') R(-bx - 1 + wag, -1, 3, 1, L.d);
    E(-1, -4 - leg, 3, 3 + leg / 2, L.c); E(-1, -3 - leg, 2, 2, L.w);
    R(1, -2 - leg, 1, 2 + leg, L.c); R(3, -2 - leg, 1, 2 + leg, L.c);
    head(2, -9 - leg, false);
    wear(R, s.outfit, { neck: [1, -7 - leg], head: [2, -11 - leg], torso: [-1, -5 - leg, 3] });
    return;
  }
  const low = s.pose === 'dig' || s.pose === 'sniff' || s.pose === 'drink';
  const by = -leg - 2;
  [-bx + 1, -bx + 3, bx - 3, bx - 1].forEach((lx, i) => R(lx, by + 1, 1, leg + 1 - (i % 3 ? step : 1 - step), L.c));
  if (L.tail === 'long') { R(-bx - 1, by - 1, 1, 2, L.c); R(-bx - 2, by - 3 - Math.max(0, wag), 1, 2, L.d); }
  if (L.tail === 'curl') { R(-bx, by - 3, 2, 1, L.c); R(-bx + 1, by - 4 + Math.max(0, wag) / 2, 1, 1, L.w); }
  if (L.tail === 'stub') R(-bx - 1, by - 1, 1, 1, L.c);
  if (L.tail === 'pom') { R(-bx - 1, by - 2, 1, 2, L.c); disc(g, x - (bx + 2) * s.dir, y + by - 4, 1, L.w); }
  E(0, by, bx, 2 + (L.coat === 'fluffy' ? 1 : 0), L.c); E(0, by + 1, bx - 2, 1, L.w);
  if (L.saddle) R(-bx + 1, by - 2, bx * 2 - 3, 2, L.d);
  if (L.mask) R(-bx + 1, by - 2, bx * 2 - 2, 1, L.d);
  if (L.coat === 'curly') for (let i = -bx + 1; i < bx; i += 2) R(i, by - 1, 1, 1, L.w);
  const hy = low ? by + 1 : by - 4;
  head(Z.hx, hy, s.pose === 'bark');
  if (s.pose === 'dig') R(Z.hx + 4 + (Math.floor(t * 10) % 3), -2 - (Math.floor(t * 10) % 2), 1, 1, '#6b4220');
  wear(R, s.outfit, { neck: [Z.hx - 2, hy + 2], head: [Z.hx, hy - 2], torso: [0, by, bx - 1] });
}

// ---------------------------------------------------------------- cats

function catT(g, x, y, s, t, L) {
  const { R, E } = mirror(g, x, y, s.dir);
  const big = L.big ? 1 : 0;
  const fat = L.chubby ? 1 : 0;
  const step = s.moving ? Math.floor(t * 10) % 2 : 0;
  const tail = Math.round(Math.sin(t * 2.2) * 1.5);
  const marks = (ox, oy, w) => {
    if (L.pattern === 'tabby') for (let i = 0; i < w; i += 2) R(ox + i, oy, 1, 1, L.d);
    if (L.pattern === 'spots') for (let i = 0; i < w; i += 2) R(ox + i, oy + (i % 4 ? 1 : 0), 1, 1, L.d);
  };
  const ears = (hx, hy) => {
    if (L.ears === 'fold') { R(hx - 2, hy - 2, 2, 1, L.c); R(hx + 1, hy - 2, 2, 1, L.c); return; }
    R(hx - 2, hy - 3, 1, 2, L.pattern === 'points' ? L.d : L.c); R(hx + 2, hy - 3, 1, 2, L.pattern === 'points' ? L.d : L.c);
    if (L.ears === 'tuft') { R(hx - 2, hy - 4, 1, 1, L.d); R(hx + 2, hy - 4, 1, 1, L.d); }
  };
  const head = (hx, hy, closed) => {
    E(hx, hy, 3 + fat, 2, L.c);
    if (L.pattern === 'points') { R(hx, hy, 3, 2, L.d); }
    if (L.fur === 'long') R(hx - 3, hy + 1, 2, 2, L.w);
    ears(hx, hy);
    R(hx + 1, hy - 1, 1, 1, closed ? K : L.e);
    R(hx + (L.flat ? 2 : 3), hy, 1, 1, '#ff9ab0');
  };
  if (s.pose === 'sleep') {
    E(0, -3, 5 + big, 2 + fat, L.c); marks(-3, -5, 6); E(4 + big, -3, 2, 2, L.c);
    R(3 + big, -6, 1, 1, L.c); R(5 + big, -6, 1, 1, L.c); R(3 + big, -3, 2, 1, K); R(-5 - big, -1, 8, 1, L.pattern === 'points' ? L.d : L.c);
    wear(R, s.outfit, { neck: [3, -2], head: [4, -5], torso: [0, -3, 3] });
    return;
  }
  if (s.pose === 'sit' || s.pose === 'groom') {
    R(-4 + tail - big, -1, 4 + big, 1 + (L.fur === 'long' ? 1 : 0), L.pattern === 'points' ? L.d : L.c);
    E(0, -5 - big, 3 + fat, 3 + big, L.c); E(0, -4 - big, 2, 2, L.w); marks(-1, -7 - big, 3);
    head(1, -10 - big, s.pose === 'groom');
    if (s.pose === 'groom') R(3, -10 - big + (Math.floor(t * 6) % 2), 1, 3, L.c);
    wear(R, s.outfit, { neck: [0, -8 - big], head: [1, -12 - big], torso: [0, -6 - big, 3] });
    return;
  }
  const crouch = s.pose === 'stalk' ? 1 : 0;
  R(-3, -2, 1, 2 - step, L.c); R(-1, -2, 1, 1 + step, L.c); R(2, -2, 1, 1 + step, L.c); R(4, -2, 1, 2 - step, L.c);
  E(0, -4 + crouch, 4 + big, 2 + fat, L.c); marks(-2, -6 + crouch, 5);
  R(-5 - big, -6, 1 + (L.fur === 'long' ? 1 : 0), 3, L.c); R(-5 - big + (tail > 0 ? -1 : 0), -9 + crouch * 2, 1 + (L.fur === 'long' ? 1 : 0), 3, L.pattern === 'points' ? L.d : L.d);
  head(5 + big, -7 + crouch * 2, false);
  wear(R, s.outfit, { neck: [4, -5 + crouch], head: [5 + big, -9 + crouch * 2], torso: [0, -4 + crouch, 3] });
}

// ---------------------------------------------------------------- small mammals

function critterT(g, x, y, s, t, L, type) {
  const { R, E } = mirror(g, x, y, s.dir);
  const [rx, ry] = L.body;
  const step = s.moving ? Math.floor(t * (L.hop ? 6 : 12)) % 2 : 0;
  const hop = L.hop && s.moving ? -Math.abs(Math.round(Math.sin(t * 10) * 3)) : 0;
  const curl = s.pose === 'sleep' || (type === 'hedgehog' && s.pose === 'hide');
  const by = -ry - 1 + hop;
  if (s.pose === 'glide') {  // sugar glider: arms out, gliding membrane
    R(-5, -6, 11, 2, L.c); R(-5, -5, 11, 1, L.w); R(-8, -6, 3, 1, L.d); R(5, -7, 2, 2, L.c); R(6, -7, 1, 1, K);
    return;
  }
  if (L.tail === 'long') R(-rx - 4, by + 1, 4, 1, L.c);
  if (L.tail === 'bushy') { R(-rx - 3, by - 2, 3, 3, L.c); R(-rx - 4, by - 3, 2, 2, L.d); }
  if (L.tail === 'puff') disc(g, x - (rx + 1) * s.dir, y + by, 1, L.w);
  if (L.tail === 'ringed') for (let i = 0; i < 7; i++) R(-rx - 1 - i, by - 1 - Math.round(Math.sin(i / 2 + t) * 1.5), 1, 1, i % 2 ? L.d : L.w);
  if (!curl && s.pose !== 'sit') { [-rx + 1, rx - 2].forEach((lx, i) => R(lx, by + ry - 1 + 1, 2, 1 + (i ? step : 1 - step), L.d)); }
  E(0, by, rx, ry, L.c);
  E(0, by + 1, Math.max(1, rx - 2), Math.max(0, ry - 2), L.w);
  if (L.patches) { R(-2, by - 2, 3, 2, L.d); R(2, by, 2, 2, L.w); }
  if (L.stripe) R(-rx, by - ry, rx * 2, 1, L.d);
  if (L.spikes) for (let i = -rx; i < rx; i += 2) { R(i, by - ry - 1, 1, 2, L.d); R(i + 1, by - ry, 1, 1, '#c8a878'); }
  if (curl) {
    R(rx - 2, by - 1, 1, 1, K);
    if (type === 'capybara') R(rx - 1, by - 2, 2, 1, L.d);
    wear(R, s.outfit, { neck: [rx - 2, by + 1], head: [rx - 1, by - ry], torso: [0, by, rx - 1] });
    return;
  }
  const sitUp = s.pose === 'sit' || s.pose === 'eat';
  const hx = rx - (type === 'capybara' ? 0 : 1);
  const hy = by - (sitUp ? 3 : 1) - (type === 'capybara' ? 1 : 0);
  if (type === 'capybara') { R(hx - 1, hy - 1, 6, 4, L.c); R(hx + 4, hy, 1, 2, L.d); R(hx + 4, hy, 1, 1, K); R(hx + 1, hy - 1, 1, 1, K); }
  else if (type === 'ferret') { E(hx + 1, hy, 2, 2, L.c); R(hx, hy - 1, 3, 1, L.d); R(hx + 3, hy, 1, 1, '#ff9ab0'); R(hx + 1, hy - 1, 1, 1, K); }
  else {
    E(hx + 1, hy, 2 + (L.bigEyes ? 1 : 0), 2, L.c);
    R(hx + 1, hy - 1, L.bigEyes ? 2 : 1, L.bigEyes ? 2 : 1, K);
    R(hx + 3, hy, 1, 1, type === 'hedgehog' ? K : '#ff9ab0');
  }
  if (L.ears === 'round') R(hx, hy - 3, 2, 1, L.d);
  if (L.ears === 'tiny') R(hx, hy - 2, 1, 1, L.d);
  if (L.ears === 'big') { disc(g, x + (hx - 1) * s.dir, y + hy - 3, 1, L.d); disc(g, x + (hx + 2) * s.dir, y + hy - 3, 1, L.d); }
  if (L.ears === 'long') { const flop = s.moving ? 0 : Math.round(Math.sin(t) * 0.6); R(hx - 1 + flop, hy - 6, 1, 4, L.c); R(hx + 1, hy - 6, 1, 4, L.c); R(hx + 1, hy - 5, 1, 2, '#ffb0c0'); }
  if (L.ears === 'tufts') { R(hx - 2, hy - 3, 2, 2, L.w); R(hx + 2, hy - 3, 2, 2, L.w); }
  if (s.pose === 'eat' && Math.floor(t * 6) % 2) R(hx + 3, hy + 1, 1, 1, '#7ac04a');
  wear(R, s.outfit, { neck: [hx - 1, hy + 2], head: [hx + 1, hy - 2], torso: [0, by, rx - 1] });
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
  dog: (L) => ({ s: [16, 11], m: [18, 12], l: [20, 14] }[L.size]), cat: (L) => (L.big ? [18, 14] : [16, 13]),
  critter: (L) => [L.body[0] * 2 + 6, L.body[1] * 2 + (L.ears === 'long' ? 9 : 5)], lizard: () => [18, 6], snake: () => [16, 8],
  frog: () => [12, 8], parrot: () => [14, 15], turtle: () => [14, 8], lion: () => [26, 17],
};
export const PET_SIZE = Object.fromEntries(Object.entries(LOOKS).map(([k, L]) => [k, SIZE_OF[L.g](L)]));

function body(g, type, x, y, s, t) {
  const L = LOOKS[type] ?? LOOKS.hamster;
  if (L.g === 'dog') return dogT(g, x, y, s, t, L);
  if (L.g === 'cat') return catT(g, x, y, s, t, L);
  if (L.g === 'critter') return critterT(g, x, y, s, t, L, type);
  if (L.g === 'lizard') return lizardT(g, x, y, s, t, L);
  if (L.g === 'snake') return snakeT(g, x, y, s, t, L);
  if (L.g === 'frog') return frogT(g, x, y, s, t, L);
  return { parrot, turtle, lion }[L.g](g, x, y, s, t);
}

export function drawPet(g, type, x, y, s, t) {
  if (s.dead) return grave(g, x, y);
  outlined(g, x - 17, y - 24, 34, 27, '#120c1c', (sg) => body(sg, type, 17, 24, s, t));
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
