// Tiny pixel-art toolkit: everything is drawn with whole-pixel rectangles on a low-resolution canvas
// that CSS scales up with `image-rendering: pixelated`.

export const now = () => performance.now() / 1000;

export function rect(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function ellipse(g, cx, cy, rx, ry, color) {
  g.fillStyle = color;
  for (let dy = -ry; dy <= ry; dy++) {
    const dx = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry || 1))));
    g.fillRect(Math.round(cx - dx), Math.round(cy + dy), dx * 2 + 1, 1);
  }
}

export const disc = (g, cx, cy, r, color) => ellipse(g, cx, cy, r, r, color);

// A sprite from rows of characters: '.' is transparent, other characters index `pal`.
export function sprite(g, rows, pal, x, y, flip = false) {
  const w = rows[0].length;
  rows.forEach((row, j) => {
    for (let i = 0; i < w; i++) {
      const c = row[i];
      if (c !== '.') rect(g, x + (flip ? w - 1 - i : i), y + j, 1, 1, pal[c]);
    }
  });
}

// Small emote icons drawn above characters.
const ICONS = {
  heart: ['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'],
  note: ['..kk', '..k.', '..k.', 'kkk.', 'kk..'],
  z: ['zzzz', '..z.', '.z..', 'zzzz'],
  bang: ['k', 'k', 'k', '.', 'k'],
  star: ['..y..', '.yyy.', 'yyyyy', '.yyy.', '..y..'],
  drop: ['.b.', 'bbb', 'bbb', '.b.'],
  food: ['.oo.', 'oooo', 'wwww', '.ww.'],
  steam: ['.w.', 'w..', '.w.', '..w'],
};
const ICON_PAL = { r: '#ff3b6b', k: '#1a1a2e', z: '#9be7ff', y: '#ffe14d', b: '#4dc3ff', o: '#c46a2a', w: '#f4f4f4' };

export function icon(g, name, x, y) {
  sprite(g, ICONS[name], ICON_PAL, Math.round(x), Math.round(y));
}

// A canvas of logical size w x h scaled to the largest whole multiple that fits its container.
export function fitCanvas(canvas, w, h) {
  const box = canvas.parentElement.getBoundingClientRect();
  const s = Math.max(1, Math.floor(Math.min(box.width / w, box.height / h)));
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${w * s}px`;
  canvas.style.height = `${h * s}px`;
  return s;
}

// Mouse position in logical pixels.
export function mouse(canvas, e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height };
}

// Stable pseudo-random number per seed (for idle offsets that differ between objects).
export const hash = (n) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
