// Cars as small voxel models, so they can turn on the showcase: each car is built from a shape spec
// (length, width, body and cabin profile, wheels, grille, lights) into colored voxels, then drawn at any
// angle with a simple 3/4 projection, back to front.
import { rect } from './pixel.js';

// body: sedan / coupe / sports / super / suv / limo / ev; paint, trim (bumpers, grille), glass
const SPECS = {
  elantra: { body: 'sedan', L: 30, paint: '#2a5ad8', grille: 'wide' },
  corolla: { body: 'sedan', L: 29, paint: '#c8ccd4', grille: 'wide' },
  civic: { body: 'sedan', L: 30, paint: '#c8102e', grille: 'wide', spoiler: true },
  camry: { body: 'sedan', L: 31, paint: '#f0f0f4', grille: 'wide' },
  accord: { body: 'sedan', L: 31, paint: '#1a1a24', grille: 'wide' },
  model3: { body: 'ev', L: 30, paint: '#f4f4f8', grille: 'none' },
  bmw3: { body: 'sedan', L: 30, paint: '#2a4a9a', grille: 'kidney' },
  lexus_ls: { body: 'limo', L: 33, paint: '#e8e0cc', grille: 'spindle' },
  audi_a8: { body: 'limo', L: 33, paint: '#5a5a66', grille: 'hex' },
  bmw7: { body: 'limo', L: 34, paint: '#2a2a34', grille: 'kidney' },
  panamera: { body: 'coupe', L: 32, paint: '#3a4a5a', grille: 'none', fastback: true },
  range_rover: { body: 'suv', L: 31, paint: '#24382a', grille: 'mesh' },
  sclass: { body: 'limo', L: 34, paint: '#121218', grille: 'chrome' },
  p911: { body: 'sports', L: 27, paint: '#ffcc1a', grille: 'none', round: true },
  flying_spur: { body: 'limo', L: 34, paint: '#5a1424', grille: 'mesh' },
  continental: { body: 'coupe', L: 31, paint: '#1a3a7a', grille: 'mesh' },
  roma: { body: 'sports', L: 29, paint: '#c8102e', grille: 'mesh' },
  huracan: { body: 'super', L: 30, paint: '#86e01a', grille: 'none', spoiler: true },
  ghost: { body: 'limo', L: 35, paint: '#d8dce4', grille: 'chrome' },
  phantom: { body: 'limo', L: 36, paint: '#141418', paint2: '#c8ccd8', grille: 'chrome', tall: true },
};
// per body: [height of the beltline, cabin start, cabin end (fractions of length), roof height, ride height]
const BODY = {
  sedan: [6, 0.30, 0.72, 10, 2], ev: [6, 0.26, 0.80, 10, 2], limo: [6, 0.30, 0.75, 10, 2], coupe: [5, 0.34, 0.74, 9, 2],
  sports: [5, 0.36, 0.72, 8, 1], super: [4, 0.38, 0.70, 7, 1], suv: [8, 0.20, 0.90, 13, 3],
};

const shade = (hex, f) => {  // a lighter or darker version of a #rrggbb color, as #rrggbb
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, '0');
  return `#${c(n >> 16)}${c((n >> 8) & 255)}${c(n & 255)}`;
};

const built = {};
function build(type) {
  if (built[type]) return built[type];
  const S = SPECS[type];
  const [belt, c0, c1, roof0, ride] = BODY[S.body];
  const L = S.L;
  const W = S.body === 'suv' ? 14 : S.body === 'super' ? 14 : 13;
  const roof = roof0 + (S.tall ? 1 : 0);
  const cs = Math.round(L * c0);
  const ce = Math.round(L * c1);
  const solid = new Map();
  const key = (x, y, z) => `${x},${y},${z}`;
  const put = (x, y, z, c) => solid.set(key(x, y, z), [x, y, z, c]);
  for (let x = 0; x < L; x++) {
    // the body tapers at the nose and tail; supercars and coupes slope down at the front
    const nose = x > L - 4 ? x - (L - 4) : 0;
    const tail = x < 2 ? 2 - x : 0;
    let top = belt - Math.round(nose * (S.body === 'super' || S.body === 'sports' ? 0.9 : 0.5)) - (tail ? 1 : 0);
    if (S.round) top -= x > L * 0.8 ? 1 : 0;
    for (let y = 0; y < W; y++) {
      const edge = (y === 0 || y === W - 1) && (x < 1 || x > L - 2);
      if (edge) continue;
      for (let z = ride; z <= top; z++) put(x, y, z, z === ride ? shade(S.paint, 0.55) : S.paint);
      // the cabin: glass all round, a sloped windshield and rear window
      if (x >= cs && x <= ce && y > 0 && y < W - 1) {
        const fromFront = ce - x;
        const fromBack = x - cs;
        let h = roof;
        if (fromFront < 3) h = Math.min(h, top + 1 + fromFront * Math.ceil((roof - top) / 3));
        const back = S.fastback || S.body === 'ev' || S.body === 'coupe' || S.body === 'sports' || S.body === 'super' ? 5 : 2;
        if (fromBack < back) h = Math.min(h, top + 1 + Math.round(fromBack * ((roof - top) / back)));
        for (let z = top + 1; z <= h; z++) {
          const glass = z < h && (y === 1 || y === W - 2 || fromFront < 3 || fromBack < back);
          put(x, y, z, glass ? '#1c3450' : z === h && S.paint2 ? S.paint2 : S.paint);
        }
      }
    }
  }
  // grille, headlights and taillights
  const front = L - 1;
  const fz = ride + 1;
  for (let y = 2; y < W - 2; y++) {
    if (S.grille === 'chrome' && y > 3 && y < W - 4) for (let z = fz; z <= belt; z++) put(front, y, z, (y + z) % 2 ? '#f0f0f8' : '#a8a8b8');
    if (S.grille === 'wide' && y > 2 && y < W - 3) put(front, y, fz + 1, '#1a1a1a');
    if (S.grille === 'mesh' && y > 3 && y < W - 4) { put(front, y, fz, '#2a2a2a'); put(front, y, fz + 1, '#4a4a4a'); }
    if (S.grille === 'hex' && y > 3 && y < W - 4) for (let z = fz; z <= fz + 2; z++) put(front, y, z, '#1a1a1a');
    if (S.grille === 'spindle' && y > 4 && y < W - 5) for (let z = fz; z <= fz + 2; z++) put(front, y, z, '#2a2a30');
    if (S.grille === 'kidney' && (y === 5 || y === 7)) { put(front, y, fz, '#c8c8d4'); put(front, y, fz + 1, '#1a1a1a'); }
  }
  [1, 2, W - 3, W - 2].forEach((y) => { put(front, y, fz + 1, S.body === 'ev' ? '#ffffff' : '#fff4c8'); put(0, y, fz + 1, '#e81e2a'); });
  if (S.body === 'ev') for (let y = 1; y < W - 1; y++) put(0, y, fz + 1, '#e81e2a');  // full-width light bar
  if (S.spoiler) for (let y = 1; y < W - 1; y++) put(0, y, belt + 2, '#1a1a1a');
  // wheels: a disc of tire with a silver hub on both sides, front and back
  const r = S.body === 'suv' ? 3 : 2;
  [4, L - 6].forEach((wx) => {
    for (let dx = -r - 1; dx <= r + 1; dx++) for (let dz = -r - 1; dz <= r + 1; dz++) {
      const d2 = dx * dx + dz * dz;
      if (d2 > (r + 1) * (r + 1)) continue;
      const z = ride + dz;
      if (z < 0) continue;
      const c = d2 <= 1 ? '#d8d8e4' : '#141418';
      put(wx + dx, -1, z, c); put(wx + dx, W, z, c);
    }
  });
  // keep only voxels that can be seen (one neighbour empty)
  const visible = [];
  for (const [x, y, z, c] of solid.values()) {
    const open = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1]].filter(([a, b, d]) => !solid.has(key(x + a, y + b, z + d)));
    if (open.length) visible.push({ x: x - L / 2, y: y - W / 2, z, c, up: open.some(([, , d]) => d), open });
  }
  built[type] = visible;
  return visible;
}

// Draw a car centered at (cx, cy) on its ground line, turned by `angle` (radians), `s` px per voxel.
export function drawCar(g, type, cx, cy, angle, s = 2) {
  const vox = build(type);
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const pts = vox.map((v) => {
    const rx = v.x * ca - v.y * sa;
    const ry = v.x * sa + v.y * ca;
    // light from the front-left: faces turned toward the viewer are brighter
    const lit = v.up ? 1.15 : v.open.reduce((m, [a, b]) => Math.max(m, (a * sa + b * ca)), -1) > 0 ? 1.0 : 0.72;
    return { sx: cx + rx * s, sy: cy + ry * s * 0.45 - v.z * s, depth: ry * 10 + v.z, c: lit === 1 ? v.c : shade(v.c, lit) };
  });
  pts.sort((a, b) => a.depth - b.depth);
  pts.forEach((p) => rect(g, p.sx, p.sy, s + 0.6, s + 0.6, p.c));
}

export const CAR_TYPES = Object.keys(SPECS);
