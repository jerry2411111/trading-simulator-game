// The collection: 100 rare pieces won from the slot machine, shown on a full-window shelf. Each piece is
// drawn in code (40 x 32 pixels) from its category's template with its own colors and details.
import { disc, ellipse, glow, hash, outlined, rect } from './pixel.js';

const $ = (id) => document.getElementById(id);
export const RARITY = { rare: '#3fa8ff', epic: '#b45cff', legendary: '#ffc23a', mythic: '#ff4fd8' };
const H = (id, k = 0) => hash([...id].reduce((a, c) => a + c.charCodeAt(0), 0) * 0.37 + k);
const pal = (id, list) => list[Math.floor(H(id, 3) * list.length)];

// ---------------------------------------------------------------- category templates (x 0..40, y 0..32)

const PAINTINGS = {
  starry_night(g, t) { rect(g, 6, 5, 28, 20, '#1a2a6a'); for (let i = 0; i < 6; i++) disc(g, 10 + i * 4, 9 + (i % 2) * 3, 2, i % 2 ? '#4a6ad8' : '#8aa0ff'); disc(g, 29, 8, 2, '#ffe14d'); [[12, 7], [20, 6], [25, 12]].forEach(([x, y]) => rect(g, x, y, 1, 1, '#ffe14d')); rect(g, 9, 12, 3, 13, '#0a1408'); rect(g, 14, 21, 18, 4, '#2a3a5a'); },
  mona_lisa(g) { rect(g, 6, 5, 28, 20, '#6a5a2a'); rect(g, 6, 18, 28, 7, '#4a4020'); ellipse(g, 20, 12, 4, 5, '#e8c08a'); rect(g, 15, 8, 2, 12, '#2a1a0a'); rect(g, 23, 8, 2, 12, '#2a1a0a'); rect(g, 14, 18, 12, 7, '#1a1a10'); rect(g, 19, 14, 3, 1, '#8a4a2a'); },
  great_wave(g) { rect(g, 6, 5, 28, 20, '#f0e8d0'); for (let i = 0; i < 18; i++) rect(g, 6 + i, 25 - Math.round(Math.sin(i / 6) * 12), 2, Math.round(Math.sin(i / 6) * 12), '#2a4a8a'); for (let i = 6; i < 22; i += 2) rect(g, i, 25 - Math.round(Math.sin((i - 6) / 6) * 12), 1, 1, '#ffffff'); rect(g, 26, 17, 6, 8, '#4a6aa8'); rect(g, 28, 17, 2, 2, '#ffffff'); },
  pearl_earring(g) { rect(g, 6, 5, 28, 20, '#141410'); ellipse(g, 20, 15, 5, 6, '#f0d0a0'); rect(g, 14, 7, 12, 5, '#3a6ad8'); rect(g, 20, 6, 6, 3, '#f0d070'); disc(g, 17, 19, 1, '#ffffff'); rect(g, 14, 21, 12, 4, '#c89a40'); },
  the_scream(g) { for (let j = 5; j < 15; j += 2) rect(g, 6, j, 28, 2, j % 4 ? '#ff6a1a' : '#ffb03a'); rect(g, 6, 15, 28, 10, '#2a3a6a'); rect(g, 6, 18, 28, 2, '#8a5a2a'); ellipse(g, 20, 17, 3, 4, '#e8d8a0'); rect(g, 19, 18, 2, 2, '#2a1a10'); rect(g, 17, 20, 6, 5, '#1a1a1a'); },
  birth_venus(g) { rect(g, 6, 5, 28, 12, '#a8d8e8'); rect(g, 6, 17, 28, 8, '#4a8ab0'); ellipse(g, 20, 23, 7, 3, '#f0d0a8'); ellipse(g, 20, 14, 2, 6, '#f8e0c8'); rect(g, 18, 8, 5, 6, '#d8a040'); },
  qingming(g) { rect(g, 4, 9, 32, 12, '#e8d8b0'); for (let i = 6; i < 34; i += 5) { rect(g, i, 14, 4, 4, '#8a6a4a'); rect(g, i - 1, 13, 6, 1, '#4a3a2a'); } for (let i = 5; i < 35; i += 3) rect(g, i, 19, 1, 1, '#3a2a1a'); rect(g, 2, 8, 2, 14, '#7a2a1a'); rect(g, 36, 8, 2, 14, '#7a2a1a'); },
  fuchun(g) { rect(g, 4, 9, 32, 12, '#e8e4d8'); for (let i = 0; i < 32; i++) rect(g, 4 + i, 20 - Math.round(Math.abs(Math.sin(i / 5)) * 8), 1, Math.round(Math.abs(Math.sin(i / 5)) * 8) + 1, i % 3 ? '#6a6a6a' : '#3a3a3a'); rect(g, 2, 8, 2, 14, '#5a3a2a'); rect(g, 36, 8, 2, 14, '#5a3a2a'); },
};

function painting(g, it, t) {
  const scroll = it.id === 'qingming' || it.id === 'fuchun';
  if (!scroll) { rect(g, 4, 3, 32, 24, '#c8a020'); rect(g, 5, 4, 30, 22, '#8a6a10'); }
  if (PAINTINGS[it.id]) PAINTINGS[it.id](g, t);
  else {  // water lilies, sunflowers
    const lily = it.id === 'water_lilies';
    rect(g, 6, 5, 28, 20, lily ? '#3a7a8a' : '#d8c070');
    for (let i = 0; i < 9; i++) disc(g, 9 + (i % 5) * 5, 9 + Math.floor(i / 5) * 8 + (i % 2) * 2, lily ? 2 : 3, lily ? (i % 2 ? '#f0a0c0' : '#4a9a5a') : '#ffc61f');
    if (!lily) { rect(g, 15, 18, 10, 7, '#c88a3a'); for (let i = 0; i < 4; i++) disc(g, 13 + i * 5, 10, 1, '#6a3a10'); }
  }
}

function tank(g, it) {
  const camo = { tiger: '#a8945a', sherman: '#5a6a3a', t34: '#4a5a2a', leopard2: '#4a5a3a', abrams: '#c8b07a', challenger2: '#b8a87a', type99: '#5a7a4a', merkava: '#a89a7a', renault_ft: '#6a6a4a', mark_v: '#6a5a3a' }[it.id];
  const old = it.id === 'mark_v' || it.id === 'renault_ft';
  if (it.id === 'mark_v') {
    for (let j = 0; j < 12; j++) rect(g, 6 + Math.abs(6 - j) / 2, 14 + j, 28 - Math.abs(6 - j), 1, j % 2 ? camo : '#4a3a2a');
    rect(g, 14, 16, 12, 6, '#7a6a4a'); rect(g, 17, 18, 6, 2, '#2a2a2a');
    return;
  }
  rect(g, 4, 21, 32, 6, '#2a2a2a');                                         // tracks
  for (let i = 6; i < 35; i += 4) disc(g, i, 24, 1, '#6a6a6a');
  rect(g, 5, 16, 30, 6, camo); rect(g, 5, 16, 30, 1, '#ffffff33');          // hull
  const tw = old ? 8 : 14;
  rect(g, 20 - tw / 2, 11, tw, 6, camo); rect(g, 20 - tw / 2, 11, tw, 1, 'rgba(255,255,255,0.25)');  // turret
  const gun = { tiger: 16, abrams: 18, leopard2: 18, type99: 18, renault_ft: 6 }[it.id] ?? 14;
  rect(g, 20 + tw / 2, 13, gun, 2, '#3a3a3a');
  if (it.id === 'tiger' || it.id === 't34') for (let i = 8; i < 32; i += 6) rect(g, i, 18, 3, 2, '#3a3a2a');  // camo blots
  if (it.id === 'type99') rect(g, 17, 9, 2, 2, '#ff2a2a');
}

function dress(g, it) {
  const [c1, c2] = {
    ball_gown: ['#6a8aff', '#c8d4ff'], qipao: ['#c8102e', '#ffd84a'], kimono: ['#ff7aa8', '#ffffff'], hanfu: ['#e8d8f8', '#8a4ad8'],
    wedding_gown: ['#ffffff', '#e8e8f0'], sari: ['#ff8a1a', '#d8a020'], flapper: ['#1a1a1a', '#d8c040'], red_carpet: ['#a8081e', '#ff4a6a'],
    tutu: ['#ffe0ec', '#ffb0d0'], victorian: ['#3a1a5a', '#a87ad8'],
  }[it.id];
  rect(g, 19, 2, 2, 3, '#8a8a9a');                                            // hanger / mannequin neck
  const wide = { ball_gown: 13, wedding_gown: 15, victorian: 12, tutu: 13, hanfu: 11, kimono: 9 }[it.id] ?? 6;
  rect(g, 15, 5, 10, 9, c1); rect(g, 16, 6, 8, 1, c2);                        // bodice
  if (it.id === 'kimono' || it.id === 'hanfu') { rect(g, 9, 6, 6, 8, c1); rect(g, 25, 6, 6, 8, c1); rect(g, 17, 12, 6, 2, c2); }
  if (it.id === 'tutu') { ellipse(g, 20, 15, 13, 3, c1); rect(g, 17, 17, 6, 12, '#f0d0c0'); return; }
  for (let j = 0; j < 16; j++) {                                               // skirt widening down
    const half = 5 + Math.round((wide - 5) * (j / 15));
    rect(g, 20 - half, 14 + j, half * 2, 1, j % 5 === 4 ? c2 : c1);
  }
  if (it.id === 'qipao') for (let k = 0; k < 4; k++) disc(g, 17 + k * 2, 18 + k * 3, 1, c2);
  if (it.id === 'flapper') for (let j = 16; j < 30; j += 2) for (let i = 15; i < 25; i += 2) rect(g, i + (j % 4 ? 1 : 0), j, 1, 1, c2);
  if (it.id === 'sari') for (let j = 0; j < 14; j++) rect(g, 15 + j, 5 + j, 2, 1, c2);
}

function crown(g, it, t) {
  const gold = it.id === 'iron_crown' ? '#8a8a9a' : it.id === 'jade_crown' ? '#4ab87a' : '#e8b020';
  const gem = { imperial_state: '#d8102e', diadem: '#2a5ad8', phoenix_crown: '#2a8ad8', pharaoh: '#d82a2a' }[it.id] ?? pal(it.id, ['#d8102e', '#2a5ad8', '#2ab85a', '#ffffff']);
  if (it.id === 'laurel') { for (let i = 0; i < 9; i++) { ellipse(g, 9 + i * 2, 18 - Math.round(Math.sin((i / 8) * 3.1) * 6), 2, 1, gold); ellipse(g, 31 - i * 2, 18 - Math.round(Math.sin((i / 8) * 3.1) * 6), 2, 1, gold); } return; }
  if (it.id === 'pharaoh') { rect(g, 13, 14, 14, 12, '#f4f0e8'); ellipse(g, 20, 10, 5, 6, '#f4f0e8'); rect(g, 11, 18, 18, 8, '#c8202a'); rect(g, 19, 14, 2, 3, gold); return; }
  if (it.id === 'monomakh') { ellipse(g, 20, 14, 9, 8, gold); rect(g, 10, 20, 20, 5, '#6a4a2a'); for (let i = 11; i < 30; i += 2) rect(g, i, 21, 1, 3, '#8a6a4a'); rect(g, 19, 3, 2, 4, gold); return; }
  if (it.id === 'tiara') { for (let i = 0; i < 24; i++) rect(g, 8 + i, 22 - Math.round(Math.sin((i / 23) * 3.14) * 9), 1, 3, '#d8d8e8'); disc(g, 20, 13, 2, '#bfe8ff'); return; }
  rect(g, 9, 18, 22, 7, gold); rect(g, 9, 18, 22, 1, '#fff4b0');              // band
  for (let i = 0; i < 5; i++) { rect(g, 9 + i * 5, 10 + (i % 2) * 3, 3, 8, gold); disc(g, 10 + i * 5, 10 + (i % 2) * 3, 1, '#fff4b0'); }  // points
  for (let i = 0; i < 4; i++) disc(g, 12 + i * 5, 21, 1, i % 2 ? '#ffffff' : gem);
  if (it.id === 'imperial_state' || it.id === 'holy_roman') { rect(g, 19, 4, 2, 6, gold); rect(g, 17, 6, 6, 2, gold); }
  if (it.id === 'phoenix_crown') for (let i = 0; i < 5; i++) disc(g, 10 + i * 5, 8, 2, '#2a8ad8');
  if (t % 2 < 0.3) rect(g, 13, 12, 1, 1, '#ffffff');
}

function jewel(g, it, t) {
  const c = { hope: '#2a5ad8', koh_i_noor: '#e8f4ff', cullinan: '#f0f8ff', pink_star: '#ff7ab8', black_orlov: '#2a2a3a', ruby_ring: '#d8102e', emerald_brooch: '#2ab85a', imperial_jade: '#4ad88a' }[it.id] ?? '#ffffff';
  if (it.id === 'pearl_necklace') { for (let i = 0; i < 13; i++) disc(g, 8 + i * 2, 10 + Math.round(Math.sin((i / 12) * 3.14) * 12), 1, '#f8f4f0'); return; }
  if (it.id === 'faberge') { ellipse(g, 20, 16, 8, 11, '#d8102e'); for (let j = 8; j < 26; j += 4) rect(g, 13, j, 14, 1, '#e8b020'); disc(g, 20, 6, 1, '#ffffff'); return; }
  if (it.id === 'imperial_jade') { ellipse(g, 20, 16, 11, 9, c); ellipse(g, 20, 16, 7, 5, '#0a0a14'); rect(g, 12, 10, 3, 1, '#bfffd8'); return; }
  if (it.id === 'ruby_ring' || it.id === 'emerald_brooch') { ellipse(g, 20, 21, 8, 6, '#e8b020'); ellipse(g, 20, 21, 5, 4, '#0a0a14'); }
  for (let j = 0; j < 6; j++) rect(g, 20 - j * 2, 8 + j, j * 4 + 1, 1, c);    // brilliant cut: crown
  for (let j = 0; j < 8; j++) rect(g, 20 - (10 - j * 1.3), 14 + j, Math.max(1, (10 - j * 1.3) * 2), 1, c);  // pavilion
  rect(g, 12, 13, 17, 1, '#ffffff'); rect(g, 17, 9, 2, 2, 'rgba(255,255,255,0.8)');
  if (t % 1.5 < 0.4) { rect(g, 26, 6, 1, 3, '#ffffff'); rect(g, 25, 7, 3, 1, '#ffffff'); }
}

function car(g, it) {
  const c = { gto: '#d8102e', atlantic: '#2a3a6a', gullwing: '#c8c8d0', miura: '#ff8a1a', phantom: '#1a1a24', gt40: '#2a5ad8', le_mans: '#f0f0f0', db5: '#a8a8b0', e_type: '#2a6a3a', f1: '#e8b020' }[it.id];
  ellipse(g, 20, 20, 16, 4, c); rect(g, 4, 19, 32, 5, c);
  ellipse(g, 19, 15, 8, 4, c); rect(g, 13, 13, 12, 3, '#7fd0ff'); rect(g, 19, 13, 1, 3, c);
  rect(g, 4, 19, 32, 1, 'rgba(255,255,255,0.35)');
  [10, 30].forEach((x) => { disc(g, x, 24, 3, '#141414'); disc(g, x, 24, 1, '#c8c8d0'); });
  rect(g, 34, 20, 2, 2, '#ffe14d'); rect(g, 4, 20, 2, 2, '#ff2a2a');
  if (it.id === 'gt40' || it.id === 'le_mans') rect(g, 4, 18, 32, 1, it.id === 'gt40' ? '#ffffff' : '#2a5ad8');
}

function watch(g, it, t) {
  const pocket = ['grand_complication', 'hunter'].includes(it.id);
  const gold = ['grand_complication', 'hunter', 'jewel_watch', 'astro_clock'].includes(it.id) ? '#e8b020' : '#c8c8d4';
  if (it.id === 'astro_clock') { rect(g, 10, 4, 20, 26, '#4a2a14'); disc(g, 20, 14, 8, '#1a2a6a'); disc(g, 20, 14, 5, gold); disc(g, 20 + Math.round(Math.cos(t) * 6), 14 + Math.round(Math.sin(t) * 6), 1, '#ffe14d'); return; }
  if (!pocket) { rect(g, 16, 2, 8, 28, pal(it.id, ['#2a1a0a', '#1a1a2a', '#3a2a1a', '#c8c8d4'])); }
  else for (let i = 0; i < 6; i++) rect(g, 20 + i, 4 - (i % 2), 1, 1, gold);
  disc(g, 20, 16, 9, gold); disc(g, 20, 16, 7, it.id === 'diver' ? '#1a2a6a' : '#f8f4e8');
  if (it.id === 'skeleton' || it.id === 'tourbillon') { disc(g, 20, 20, 3, '#c8a020'); disc(g, 20, 20, 1, '#5a3a1a'); }
  if (it.id === 'moonphase') { disc(g, 20, 12, 2, '#1a2a6a'); disc(g, 20, 12, 1, '#ffe14d'); }
  if (it.id === 'jewel_watch') for (let k = 0; k < 8; k++) rect(g, 20 + Math.round(Math.cos(k * 0.78) * 8), 16 + Math.round(Math.sin(k * 0.78) * 8), 1, 1, '#ffffff');
  const a = t * 0.8;
  for (let r = 0; r < 6; r++) rect(g, 20 + Math.round(Math.sin(a) * r), 16 - Math.round(Math.cos(a) * r), 1, 1, '#1a1a1a');
  for (let r = 0; r < 4; r++) rect(g, 20 + Math.round(Math.sin(a / 12) * r), 16 - Math.round(Math.cos(a / 12) * r), 1, 1, '#1a1a1a');
}

function instrument(g, it, t) {
  const wood = '#b05a1a';
  switch (it.id) {
    case 'stradivarius': case 'cello':
      ellipse(g, 20, 22, 7, 6, wood); ellipse(g, 20, 12, 5, 4, wood); rect(g, 17, 16, 6, 2, wood); rect(g, 19, 2, 2, 8, '#2a1408'); rect(g, 18, 1, 4, 2, '#2a1408');
      for (let i = 18; i < 23; i++) rect(g, i, 8, 1, 18, '#e8e0c8'); rect(g, 15, 20, 1, 3, '#2a1408'); rect(g, 24, 20, 1, 3, '#2a1408'); break;
    case 'golden_harp':
      for (let j = 0; j < 26; j++) rect(g, 10 + Math.round(j * 0.2), 4 + j, 2, 1, '#e8b020'); for (let i = 0; i < 18; i++) rect(g, 12 + i, 4 + Math.round(Math.sin(i / 6) * 3), 1, 1, '#e8b020');
      rect(g, 28, 4, 2, 26, '#e8b020'); for (let i = 13; i < 28; i += 2) rect(g, i, 6, 1, 22, '#fff4c8'); break;
    case 'concert_grand':
      ellipse(g, 22, 16, 14, 8, '#0e0e12'); rect(g, 6, 12, 10, 10, '#0e0e12'); rect(g, 6, 22, 30, 3, '#ffffff'); for (let i = 7; i < 36; i += 2) rect(g, i, 22, 1, 2, '#0e0e12'); rect(g, 18, 6, 14, 2, '#2a2a34'); break;
    case 'guqin':
      rect(g, 3, 13, 34, 7, '#5a2a14'); rect(g, 3, 13, 34, 1, '#8a4a28'); for (let j = 14; j < 20; j += 1) rect(g, 6, j, 30, 1, j % 2 ? '#e8e0c8' : '#5a2a14'); for (let i = 8; i < 34; i += 4) rect(g, i, 12, 1, 1, '#ffffff'); break;
    case 'pipa':
      ellipse(g, 20, 21, 8, 9, '#8a3a1a'); rect(g, 19, 2, 3, 12, '#5a2a14'); for (let i = 18; i < 23; i++) rect(g, i, 6, 1, 22, '#e8e0c8'); for (let j = 6; j < 14; j += 2) rect(g, 18, j, 5, 1, '#4ad88a'); break;
    case 'jade_flute': rect(g, 3, 15, 34, 3, '#4ad88a'); rect(g, 3, 15, 34, 1, '#bfffd8'); for (let i = 10; i < 34; i += 4) disc(g, i, 16, 0, '#0a3a1a'); rect(g, 2, 14, 2, 5, '#c8102e'); break;
    case 'legend_guitar':
      ellipse(g, 15, 21, 7, 6, '#e8e8f0'); ellipse(g, 21, 23, 6, 5, '#e8e8f0'); rect(g, 22, 8, 12, 2, '#8a5a2a'); rect(g, 33, 6, 4, 6, '#1a1a1a'); rect(g, 13, 20, 8, 3, '#1a1a1a'); break;
    case 'silver_trumpet':
      rect(g, 6, 15, 22, 2, '#d8d8e4'); ellipse(g, 32, 16, 4, 6, '#d8d8e4'); ellipse(g, 32, 16, 2, 4, '#7a7a8a'); rect(g, 12, 11, 2, 4, '#d8d8e4'); rect(g, 16, 11, 2, 4, '#d8d8e4'); rect(g, 20, 11, 2, 4, '#d8d8e4'); rect(g, 4, 14, 3, 4, '#a8a8b4'); break;
    default:  // bianzhong bells
      rect(g, 3, 4, 34, 2, '#5a2a14'); for (let i = 0; i < 5; i++) { const h = 10 - i; rect(g, 6 + i * 6, 6, 1, 3, '#2a1a0a'); ellipse(g, 6 + i * 6, 12 + h / 2, 3, h / 2 + 2, '#7a8a5a'); rect(g, 4 + i * 6, 10 + h, 5, 1, '#4a5a3a'); }
  }
  if (t % 2 < 0.2) rect(g, 30, 4, 1, 1, '#ffffff');
}

function relic(g, it, t) {
  switch (it.id) {
    case 'terracotta': ellipse(g, 20, 6, 3, 3, '#a8784a'); rect(g, 15, 9, 10, 12, '#9a6a3a'); for (let j = 10; j < 20; j += 2) rect(g, 15, j, 10, 1, '#7a4a2a'); rect(g, 16, 21, 3, 9, '#9a6a3a'); rect(g, 21, 21, 3, 9, '#9a6a3a'); break;
    case 'ming_vase': ellipse(g, 20, 20, 9, 9, '#f4f4f8'); rect(g, 17, 5, 6, 7, '#f4f4f8'); rect(g, 16, 4, 8, 2, '#f4f4f8'); for (let i = 0; i < 6; i++) { rect(g, 13 + i * 2, 17 + Math.round(Math.sin(i) * 2), 2, 1, '#2a4ab8'); rect(g, 14 + i, 23 - (i % 2), 1, 1, '#2a4ab8'); } rect(g, 17, 8, 6, 1, '#2a4ab8'); break;
    case 'bronze_ding': rect(g, 8, 12, 24, 10, '#5a7a5a'); rect(g, 8, 12, 24, 1, '#8aaa7a'); for (let i = 10; i < 30; i += 4) rect(g, i, 15, 2, 4, '#3a5a3a'); rect(g, 10, 7, 3, 5, '#5a7a5a'); rect(g, 27, 7, 3, 5, '#5a7a5a'); [10, 20, 29].forEach((x) => rect(g, x, 22, 2, 7, '#4a6a4a')); break;
    case 'golden_mask': ellipse(g, 20, 16, 10, 13, '#e8b020'); for (let j = 4; j < 30; j += 3) rect(g, 9, j, 3, 1, '#2a4ab8'); rect(g, 15, 13, 3, 2, '#1a1a40'); rect(g, 22, 13, 3, 2, '#1a1a40'); rect(g, 19, 17, 2, 4, '#c8901a'); rect(g, 17, 23, 6, 1, '#8a5a10'); rect(g, 18, 26, 4, 5, '#2a4ab8'); break;
    case 'katana': for (let i = 0; i < 26; i++) rect(g, 6 + i, 26 - i * 0.8 - Math.round(Math.sin(i / 26 * 3) * 2), 1, 2, '#e8ecf4'); rect(g, 6, 24, 2, 6, '#1a1a2a'); rect(g, 5, 23, 5, 1, '#e8b020'); break;
    case 'viking_helm': ellipse(g, 20, 17, 10, 9, '#8a8a9a'); rect(g, 10, 17, 21, 9, '#0a0a14'); rect(g, 10, 15, 21, 3, '#6a6a7a'); rect(g, 19, 15, 2, 8, '#6a6a7a'); rect(g, 13, 19, 4, 2, '#8a8a9a'); rect(g, 23, 19, 4, 2, '#8a8a9a'); break;
    case 'gladius': rect(g, 19, 3, 3, 18, '#d8dce8'); rect(g, 19, 3, 1, 18, '#ffffff'); rect(g, 15, 21, 11, 2, '#e8b020'); rect(g, 19, 23, 3, 6, '#5a2a14'); disc(g, 20, 30, 2, '#e8b020'); break;
    case 'jade_suit': ellipse(g, 20, 5, 3, 3, '#4ab87a'); rect(g, 14, 8, 12, 12, '#4ab87a'); rect(g, 15, 20, 4, 10, '#4ab87a'); rect(g, 21, 20, 4, 10, '#4ab87a'); for (let j = 8; j < 30; j += 2) for (let i = 14; i < 26; i += 2) rect(g, i, j, 1, 1, '#e8b020'); break;
    case 'astrolabe': disc(g, 20, 17, 11, '#c8902a'); disc(g, 20, 17, 9, '#e8b84a'); disc(g, 20, 17, 5, '#c8902a'); rect(g, 19, 3, 3, 4, '#c8902a'); for (let r = 0; r < 9; r++) rect(g, 20 + Math.round(Math.cos(t * 0.5) * r), 17 + Math.round(Math.sin(t * 0.5) * r), 1, 1, '#5a3a1a'); break;
    default: rect(g, 8, 4, 24, 26, '#3a3a44'); for (let j = 7; j < 28; j += 2) rect(g, 10, j, 20 - (j % 6), 1, '#8a8a9a');  // rosetta stone
  }
}

function legend(g, it, t) {
  switch (it.id) {
    case 'superyacht': rect(g, 4, 18, 32, 5, '#f4f4f8'); for (let j = 0; j < 5; j++) rect(g, 4 + j, 23 + j, 32 - j * 2, 1, '#2a3a6a'); rect(g, 10, 13, 18, 5, '#e8e8f0'); rect(g, 12, 14, 14, 2, '#2a4a6a'); rect(g, 16, 9, 8, 4, '#f4f4f8'); break;
    case 'private_jet': ellipse(g, 20, 16, 15, 3, '#f4f4f8'); rect(g, 14, 12, 8, 2, '#c8c8d4'); rect(g, 14, 18, 8, 3, '#c8c8d4'); rect(g, 4, 10, 3, 6, '#c8c8d4'); for (let i = 12; i < 32; i += 3) rect(g, i, 15, 1, 1, '#2a4a6a'); break;
    case 'space_capsule': for (let j = 0; j < 20; j++) rect(g, 20 - (4 + j * 0.5), 6 + j, (4 + j * 0.5) * 2, 1, j % 6 === 5 ? '#8a8a9a' : '#d8d8e4'); rect(g, 17, 12, 6, 4, '#2a4a6a'); rect(g, 10, 26, 20, 3, '#5a5a6a'); break;
    case 'gold_trophy': ellipse(g, 20, 9, 9, 6, '#e8b020'); rect(g, 11, 9, 18, 4, '#e8b020'); rect(g, 18, 15, 4, 8, '#c8901a'); rect(g, 13, 23, 14, 5, '#5a3a1a'); ellipse(g, 9, 11, 3, 4, '#c8901a'); ellipse(g, 31, 11, 3, 4, '#c8901a'); rect(g, 14, 7, 4, 2, '#fff4b0'); break;
    case 'gold_medal': for (let i = 0; i < 8; i++) { rect(g, 13 + i, 2 + i, 2, 1, '#2a4ab8'); rect(g, 26 - i, 2 + i, 2, 1, '#d8102e'); } disc(g, 20, 20, 8, '#e8b020'); disc(g, 20, 20, 6, '#f8d050'); rect(g, 19, 17, 2, 6, '#c8901a'); break;
    case 'treasure_chest': rect(g, 6, 14, 28, 14, '#7a4a1a'); ellipse(g, 20, 14, 14, 5, '#8a5a2a'); for (let i = 8; i < 33; i += 4) rect(g, i, 9, 2, 3, i % 8 ? '#ffd84a' : '#ffffff'); rect(g, 6, 18, 28, 2, '#c8901a'); rect(g, 18, 18, 4, 5, '#e8b020'); break;
    case 'meteorite': ellipse(g, 20, 18, 12, 9, '#3a3a40'); for (let k = 0; k < 8; k++) disc(g, 12 + hash(k) * 16, 13 + hash(k + 3) * 10, 1, '#1a1a20'); rect(g, 14, 12, 6, 2, '#8a8a9a'); break;
    case 'dragon_egg': glow(g, 20, 17, 14, '255,80,40', 0.5); ellipse(g, 20, 17, 8, 11, '#a8201a'); for (let j = 8; j < 28; j += 3) for (let i = 13; i < 28; i += 3) rect(g, i + (j % 2), j, 2, 1, '#d84a1a'); if (t % 3 < 0.3) rect(g, 22, 14, 1, 4, '#ffe14d'); break;
    case 'phoenix_feather': glow(g, 20, 16, 14, '255,160,40', 0.55); for (let i = 0; i < 26; i++) { const y = 28 - i; const w = Math.round(Math.sin((i / 25) * 3.1) * 5); rect(g, 20 - w + Math.round(i / 6), y, w * 2 + 1, 1, i % 4 < 2 ? '#ff6a1a' : '#ffc61f'); } rect(g, 20, 4, 1, 26, '#fff4b0'); break;
    default: ellipse(g, 20, 18, 12, 7, '#7a5a2a'); rect(g, 10, 22, 3, 7, '#6a4a1a'); rect(g, 27, 22, 3, 7, '#6a4a1a'); ellipse(g, 31, 14, 4, 4, '#7a5a2a'); rect(g, 33, 9, 4, 1, '#d8c890'); rect(g, 29, 9, 1, 3, '#d8c890'); rect(g, 6, 15, 4, 1, '#7a5a2a');  // bull
  }
}

const DRAW = { art: painting, tank, dress, crown, jewel, car, watch, instrument, relic, legend };

export function drawCollectible(g, item, t, owned = true) {
  g.clearRect(0, 0, 40, 32);
  if (!owned) {  // a dark silhouette with a question mark
    outlined(g, 0, 0, 40, 32, '#3a2a5a', (sg) => DRAW[item.category](sg, item, 0));
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = '#140a24';
    g.fillRect(0, 0, 40, 32);
    g.globalCompositeOperation = 'source-over';
    return;
  }
  if (item.rarity === 'mythic' || item.rarity === 'legendary') glow(g, 20, 16, 18, item.rarity === 'mythic' ? '255,79,216' : '255,194,58', 0.3);
  outlined(g, 0, 0, 40, 32, '#0a0612', (sg) => DRAW[item.category](sg, item, t));
}

// ---------------------------------------------------------------- the collection screen

export function initCollection(ctx) {
  let data = null;
  let pick = null;
  const canvases = [];

  function render() {
    const { items, categories } = data.collection;
    const owned = new Map(data.state.collection.map((c) => [c.id, c]));
    $('collection-count').textContent = `${owned.size} / 100`;
    canvases.length = 0;
    const shelves = Object.entries(categories).map(([cat, title]) => {
      const sec = document.createElement('section');
      sec.className = 'shelf';
      const list = Object.values(items).filter((i) => i.category === cat);
      sec.innerHTML = `<div class="box-title">${title.toUpperCase()} · ${list.filter((i) => owned.has(i.id)).length}/${list.length}</div>`;
      const row = document.createElement('div');
      row.className = 'shelf-row';
      list.forEach((item) => {
        const b = document.createElement('button');
        b.className = 'piece';
        b.style.borderColor = owned.has(item.id) ? RARITY[item.rarity] : '';
        const c = document.createElement('canvas');
        c.width = 40;
        c.height = 32;
        c.className = 'pixel';
        canvases.push([c, item, owned.has(item.id)]);
        b.append(c);
        b.title = owned.has(item.id) ? item.name : '???';
        b.onclick = () => { pick = item; detail(owned); };
        row.append(b);
      });
      sec.append(row);
      return sec;
    });
    $('collection-shelves').replaceChildren(...shelves);
    detail(owned);
  }

  function detail(owned) {
    const box = $('collection-detail');
    if (!pick) { box.innerHTML = '<p class="muted">Every 5 trades you spin the slot machine; a GIFT adds a piece here. Rarer pieces come up less often. Collection pieces can never be sold.</p>'; return; }
    const have = owned.get(pick.id);
    box.innerHTML = `<canvas id="piece-big" class="pixel" width="40" height="32"></canvas>
      <p><b>${have ? pick.name : '???'}</b><br><span style="color:${RARITY[pick.rarity]}">${pick.rarity.toUpperCase()}</span></p>
      <p>${have ? pick.note : 'Not found yet. Keep trading and spinning.'}</p>${have ? `<p class="muted">Won on day ${have.day}.</p>` : ''}`;
    canvases.push([$('piece-big'), pick, Boolean(have)]);
  }

  let running = false;
  function loop() {
    if (!running) return;
    const t = performance.now() / 1000;
    canvases.forEach(([c, item, own]) => { if (own || !c.drawn) { drawCollectible(c.getContext('2d'), item, t, own); c.drawn = true; } });
    setTimeout(() => requestAnimationFrame(loop), 100);
  }

  return {
    async open() {
      $('collection').hidden = false;
      data = await (await fetch('/api/home')).json();
      pick = null;
      render();
      running = true;
      loop();
    },
    close() { running = false; $('collection').hidden = true; },
  };
}
