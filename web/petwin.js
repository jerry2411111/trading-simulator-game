// The portrait window of a pricey pet: a big animated portrait you can pat (hover), give a treat, play
// with, and dress in the clothes designed for its breed.
import { drawPetHead } from './buddy.js';
import { disc, now } from './pixel.js';

const $ = (id) => document.getElementById(id);

export function initPetWindow(ctx) {
  const dlg = $('pet-window');
  const canvas = $('pet-portrait');
  const g = canvas.getContext('2d');
  canvas.width = 48;
  canvas.height = 48;
  let data = null;
  let petId = null;
  let react = null;      // { mood, until }
  let ball = null;       // play: a ball bouncing in front of it
  let hover = false;

  const pet = () => data?.state.pets.find((p) => p.id === petId);
  const cat = (id) => data.catalog[id];

  canvas.onmouseenter = () => { hover = true; };
  canvas.onmouseleave = () => { hover = false; };

  function mood(p) {
    if (react && now() < react.until) return react.mood;
    if (hover) return 'pat';
    return p.status === 'hungry' ? 'sad' : 'focus';
  }

  function loop() {
    if (!dlg.open) return;
    const p = pet();
    if (p) {
      const outfit = p.wearing ? { style: cat(p.wearing).style, color: cat(p.wearing).color } : null;
      drawPetHead(g, p.type, mood(p), now(), '#00e5ff', p.status === 'hungry', outfit, false);
      if (ball && now() < ball.until) {
        const k = (now() - ball.start) * 3;
        disc(g, 8 + ((k * 9) % 32), 44 - Math.abs(Math.sin(k * 2)) * 14, 2, '#ff4f9a');
      }
    }
    setTimeout(() => requestAnimationFrame(loop), 60);
  }

  async function act(action, body) {
    const r = await ctx.act(action, body);
    if (r) { data = r; render(); }
    return r;
  }

  function button(label, onclick, cls = '') {
    const b = document.createElement('button');
    b.textContent = label;
    b.className = cls;
    b.onclick = onclick;
    return b;
  }

  function render() {
    const p = pet();
    if (!p) { dlg.close(); return; }
    const c = cat(p.type);
    $('pet-name').textContent = c.name;
    $('pet-facts').innerHTML = `${p.status === 'hungry' ? '<b class="down">Hungry!</b>' : 'Happy and fed.'} Lives in the ${p.place}.
      ${p.wearing ? `Wearing: ${cat(p.wearing).name}.` : ''}<br><span class="muted">Hover the portrait to pat it.</span>`;
    const row = $('pet-actions');
    row.replaceChildren(
      button(`Treat (${c.meal} coins)`, async () => { if (await act('feed', { id: p.id })) react = { mood: 'happy', until: now() + 3 }; }, 'primary'),
      button('Play', () => { react = { mood: 'expecting', until: now() + 3 }; ball = { start: now(), until: now() + 3 }; setTimeout(() => { react = { mood: 'happy', until: now() + 2 }; }, 3000); }),
      button(p.place === 'house' ? 'Move to the garden' : 'Move into the house', () => act('move_pet', { id: p.id })),
    );
    const list = $('pet-clothes');
    list.replaceChildren(...c.clothes.map((id) => {
      const cl = cat(id);
      const li = document.createElement('li');
      const owned = p.outfits.includes(id);
      li.innerHTML = `<span><i class="swatch" style="background:${cl.color}"></i> ${cl.name}</span>`;
      if (!owned) li.append(button(`Buy 🪙 ${cl.price}`, async () => { if (await act('buy_clothes', { id: p.id, item: id })) react = { mood: 'happy', until: now() + 3 }; }));
      else if (p.wearing === id) li.append(button('Take off', () => act('wear', { id: p.id, item: null }), 'active'));
      else li.append(button('Wear', async () => { if (await act('wear', { id: p.id, item: id })) react = { mood: 'happy', until: now() + 2 }; }));
      return li;
    }));
  }

  $('pet-close').onclick = () => dlg.close();

  return {
    async open(id, next) {
      data = next ?? await (await fetch('/api/home')).json();
      petId = id;
      react = { mood: 'happy', until: now() + 1.5 };
      render();
      if (!dlg.open) dlg.showModal();
      loop();
    },
  };
}
