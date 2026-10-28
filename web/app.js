// Game screen: WebSocket state, top bar, stock tabs, chart, trading panel and keyboard shortcuts.
import {
  INDICATOR_NAMES, PERIODIC, PriceChart, SINGLES, css, look, store, stored,
} from './chart.js';
import { fillTable, money, signed, summaryRows } from './format.js';
import { Girl } from './girl.js';
import { initHome } from './home.js';
import { applyStoredTheme, initMenus } from './menu.js';
import { showSetup } from './setup.js';
import { initStore } from './store.js';

const $ = (id) => document.getElementById(id);
const SPEEDS = [[0, '⏸'], [1, '▶'], [1.5, '1.5x'], [2, '2x'], [3, '3x'], [5, '5x'], [10, '10x'], [60, '60x']];
const WINDOW_STEPS = [0.25, 0.5, 1, 2, 3, 5, 10, 15, 20, 30, 45, 60, 90]; // chart window, minutes
const AUTH_REASON = 'Alpaca stopped accepting your key, so the game is paused. Connect again to continue.';

let ws = null;
let chart = null;
let state = { phase: 'idle', session: null, account: null, trades: [], ai: { log: [] } };
let lastSpeed = 1;
let shown = new Set();
try { shown = new Set(JSON.parse(stored('tt.indicators') || '[]').filter((n) => INDICATOR_NAMES.includes(n))); } catch { /* keep none */ }
let split = stored('tt.split') === '1';
const minis = new Map(); // split view: alias -> { cell, chart } for the stocks not on the main chart

const send = (cmd, extra = {}) => ws?.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ cmd, ...extra }));
const view = () => state.session?.view;
const allCharts = () => [chart, ...[...minis.values()].map((m) => m.chart)];

applyStoredTheme();
const girl = new Girl($('girl-box'));
const theme = () => document.documentElement.dataset.theme;
const showGirl = (on) => { $('girl-box').hidden = !on; store('tt.girl', on ? '1' : '0'); };
girl.setTheme(theme());
showGirl(stored('tt.girl') !== '0');
const menus = initMenus({
  send, state: () => state, charts: allCharts, lastSpeed: () => lastSpeed, openSetup, toast,
  onTheme: () => girl.setTheme(theme()), showGirl, girlShown: () => !$('girl-box').hidden,
});

// ----- Home and Store: full-window screens; the game pauses while they are open
const setCoins = (c) => { $('coins-btn').textContent = `🪙 ${Math.floor(c).toLocaleString()}`; };
let screenOpen = false;
function openScreen(which, arg) {
  if (!screenOpen && state.speed) send('speed', { value: 0 });
  screenOpen = true;
  document.body.classList.add('in-home');
  if (which === 'home') { shop.close(); home.open(arg); } else { home.close(); shop.open(arg); }
}
function closeScreens() {
  home.close();
  shop.close();
  document.body.classList.remove('in-home');
  if (screenOpen) send('speed', { value: lastSpeed });
  screenOpen = false;
}
const home = initHome({ toast, theme, coins: setCoins, openStore: (tab) => openScreen('store', tab) });
const shop = initStore({ toast, coins: setCoins });
$('home-btn').onclick = () => openScreen('home');
$('store-btn').onclick = () => openScreen('store');
$('coins-btn').onclick = () => openScreen('store');
$('home-store').onclick = () => openScreen('store');
$('store-home').onclick = () => openScreen('home');
document.querySelectorAll('[data-back]').forEach((b) => { b.onclick = closeScreens; });
const refreshCoins = async () => { try { setCoins((await (await fetch('/api/home')).json()).coins); } catch { /* offline */ } };

function openSetup(reason = '', cancellable = false) {
  $('game').hidden = true;
  showSetup($('setup'), {
    reason,
    onDone: startGame,
    onCancel: cancellable ? () => { $('game').hidden = false; } : null,
  });
}

function startGame() {
  $('game').hidden = false;
  chart ??= new PriceChart($('chart'));
  markStyle();
  showWindow();
  renderChips();
  connect();
}

function connect() {
  if (ws && ws.readyState <= WebSocket.OPEN) return;
  ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  ws.onopen = () => {
    send('indicators', { names: [...shown] });
    send('split', { on: split });
  };
  ws.onmessage = (e) => handle(JSON.parse(e.data));
  ws.onclose = () => setTimeout(connect, 1000);
}

function handle(m) {
  switch (m.type) {
    case 'snapshot':
      state = m;
      chart.setData(m.bars || [], m.ind || {});
      chart.setTrades(viewTrades());
      renderMinis(m.others || {});
      render();
      break;
    case 'tick':
      Object.assign(state, { clock: m.clock, prices: m.prices, account: m.account });
      chart.append(m.bars, m.ind || {});
      for (const [name, rows] of Object.entries(m.others || {})) minis.get(name)?.chart.append(rows, {});
      renderClock();
      renderTabs();
      renderAccount();
      renderTitles();
      break;
    case 'status':
      Object.assign(state, { phase: m.phase, speed: m.speed, loading: m.loading, thinking: m.thinking });
      renderStatus();
      break;
    case 'account':
      Object.assign(state, { account: m.account, trades: m.trades });
      chart.setTrades(viewTrades());
      for (const [name, mini] of minis) mini.chart.setTrades(state.trades.filter((t) => t.stock === name));
      renderAccount();
      renderTabs();
      m.fills.forEach((f) => toast(`${f.by === 'AI' ? 'AI: ' : ''}${f.qty > 0 ? 'Bought' : 'Sold'} ${Math.abs(f.qty)} ${f.stock} @ ${f.price.toFixed(2)}`));
      m.fills.filter((f) => f.pnl).forEach((f) => girl.tradeClosed(f.pnl - f.fee));
      if (m.fills.some((f) => f.pnl)) refreshCoins();
      break;
    case 'ai':
      state.ai.log = [...state.ai.log, m.entry].slice(-30);
      renderAi();
      break;
    case 'stats':
      menus.showStats(m);
      break;
    case 'error':
    case 'notice':
      toast(m.text);
      break;
  }
}

const viewTrades = () => state.trades.filter((t) => t.stock === view());

// ----- split view: one small chart per other stock next to the main chart

function renderMinis(others) {
  const names = split ? Object.keys(others) : [];
  for (const [name, mini] of minis) {
    if (names.includes(name)) continue;
    mini.chart.destroy();
    mini.cell.remove();
    minis.delete(name);
  }
  for (const name of names) {
    if (!minis.has(name)) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.innerHTML = '<button class="cell-title" title="Show on the main chart"></button><div class="cell-chart"></div>';
      cell.querySelector('button').onclick = () => send('view', { stock: name });
      $('charts').append(cell);
      minis.set(name, { cell, chart: new PriceChart(cell.querySelector('.cell-chart')) });
    }
    const mini = minis.get(name).chart;
    mini.setData(others[name], {});
    mini.setTrades(state.trades.filter((t) => t.stock === name));
  }
  const n = names.length + 1;
  $('charts').style.gridTemplateColumns = `repeat(${n <= 3 ? n : n === 4 ? 2 : 3}, minmax(0, 1fr))`;
  $('main-title').hidden = n === 1;
  renderTitles();
}

function renderTitles() {
  const title = (name) => {
    const p = state.account?.positions[name];
    const pos = p ? ` ${p.shares > 0 ? '▲' : '▼'}${Math.abs(p.shares)}` : '';
    return `${name}  ${state.prices?.[name]?.toFixed(2) ?? ''}${pos}`;
  };
  if (view()) $('main-title').textContent = `${title(view())}  (main)`;
  for (const [name, mini] of minis) mini.cell.querySelector('.cell-title').textContent = title(name);
}

// ----- rendering

function render() {
  const s = state.session;
  $('day').textContent = s ? `DAY ${s.day}` : '—';
  $('feed').textContent = state.feed === 'sip' ? 'SIP' : state.feed === 'iex' ? 'IEX ONLY' : '';
  $('feed').hidden = !state.feed;
  $('fallback').hidden = !s?.fallback.length;
  $('fallback').textContent = `1m DATA: ${s?.fallback.join(' ') ?? ''}`;
  renderClock();
  renderTabs();
  renderAccount();
  renderStatus();
  renderAi();
}

function renderClock() {
  $('clock').textContent = state.clock || '--:--:--';
}

function renderTabs() {
  const s = state.session;
  $('tabs').replaceChildren(...(s?.stocks ?? []).map((name, i) => {
    const b = document.createElement('button');
    const pos = state.account?.positions[name];
    b.className = `tab${name === s.view ? ' active' : ''}`;
    b.title = `Key ${i + 1}`;
    b.innerHTML = `<b>${name}</b><span class="num">${state.prices?.[name]?.toFixed(2) ?? '—'}</span>`
      + (pos ? `<i class="${pos.shares > 0 ? 'up' : 'down'}">${pos.shares > 0 ? '▲' : '▼'}${Math.abs(pos.shares)}</i>` : '');
    b.onclick = () => send('view', { stock: name });
    return b;
  }));
  $('add').disabled = !s || s.stocks.length >= 5;
  $('replace').disabled = !s;
  $('split').hidden = !s || s.stocks.length < 2;
  $('split').textContent = split ? '▣ Single view' : '⊞ Split view';
}

function setPnl(el, v) {
  el.textContent = signed(v);
  el.className = `num ${v > 0 ? 'up' : v < 0 ? 'down' : ''}`;
}

function renderAccount() {
  const a = state.account;
  if (!a) return;
  $('equity').textContent = money(a.equity);
  setPnl($('pnl-today'), a.today);
  setPnl($('pnl-total'), a.total);
  const open = Object.values(a.positions);
  girl.setPosition(open.length ? open.reduce((sum, p) => sum + p.pnl, 0) : null);
  $('buying-power').textContent = money(a.buying_power);
  showLeverage(a.settings.leverage);
  const p = a.positions[view()];
  $('position').innerHTML = p
    ? `${p.shares > 0 ? 'LONG' : 'SHORT'} ${Math.abs(p.shares)} @ ${p.avg.toFixed(2)} · P/L <b class="${p.pnl >= 0 ? 'up' : 'down'}">${signed(p.pnl)}</b>`
    : 'No position';
  $('pending').replaceChildren(...a.pending.map((o) => {
    const li = document.createElement('li');
    const kind = { LMT: 'LMT', IF_ABOVE: 'if ≥', IF_BELOW: 'if ≤' }[o.type];
    li.innerHTML = `<span>${o.by === 'AI' ? 'AI ' : ''}${o.side.toUpperCase()} ${o.stock} ${kind} ${o.price.toFixed(2)} · $${o.dollars}</span>`;
    const x = document.createElement('button');
    x.textContent = '×';
    x.title = 'Cancel order';
    x.onclick = () => send('cancel', { id: o.id });
    li.append(x);
    return li;
  }));
  $('fills').innerHTML = state.trades.slice(-14).reverse().map((t) => `<li><span class="${t.qty > 0 ? 'up' : 'down'}">${t.qty > 0 ? '▲' : '▼'} ${Math.abs(t.qty)}</span> ${t.stock} @ ${t.price.toFixed(2)}${t.by === 'AI' ? ' <i>AI</i>' : ''}${t.pnl ? ` <b class="${t.pnl > 0 ? 'up' : 'down'}">${signed(t.pnl)}</b>` : ''}</li>`).join('');
}

function renderAi() {
  const ai = state.ai;
  $('ai-box').hidden = !ai.enabled;
  $('ai-log').innerHTML = ai.log.slice(-8).reverse().map((e) => `<li><b>${e.time}</b> ${e.error
    ? `<span class="down">${e.error}</span>`
    : `${e.note || '(no note)'}${e.orders.length ? ` → ${e.orders.map((o, i) => `${o.side} ${o.stock} ${o.type}${o.price ? ` ${o.price}` : ''} $${o.dollars} (${e.results[i]})`).join('; ')}` : ''}`}</li>`).join('');
}

const OVERLAYS = {
  idle: () => ({ title: 'READY', text: 'Replay a random real trading day.', buttons: [['New game', 'new_game']] }),
  picking: () => ({ title: 'NEW GAME', text: 'Picking a random day and stocks…' }),
  loading: (st) => ({
    title: st.session.day > 1 ? 'Loading next day…' : 'Loading…',
    text: st.loading?.text ?? '',
    progress: st.loading?.progress,
  }),
  day_end: (st) => {
    const s = st.summary;
    const green = !s || s.return >= 0;
    return {
      title: `DAY ${st.session.day} ${green ? 'CLEARED' : 'IN THE RED'}`,
      text: st.session.last_day ? 'No more data after this day.' : 'Market closed. Positions were closed at the bell.',
      summary: s,
      green,
      buttons: st.session.last_day ? [['New game', 'new_game']] : [['Next day', 'next_day']],
    };
  },
  game_over: () => ({
    title: 'GAME OVER', text: 'Equity hit zero.', buttons: [['Clear PnL', 'clear_pnl'], ['New game', 'new_game']],
  }),
};

function renderStatus() {
  const { phase, loading } = state;
  if (phase === 'auth' && $('setup').hidden) openSetup(AUTH_REASON);
  if (phase === 'nokey' && $('setup').hidden) openSetup();
  if (state.speed) lastSpeed = state.speed;
  $('speeds').querySelectorAll('button').forEach((b) => b.classList.toggle('active', +b.dataset.speed === state.speed));
  $('bg-status').textContent = phase === 'ready' && loading ? loading.text : '';
  $('ai-badge').hidden = !state.thinking;
  $('ai-badge').textContent = 'AI THINKING…';

  const o = OVERLAYS[phase]?.(state);
  $('overlay').hidden = !o;
  $('overlay').classList.toggle('red', o?.green === false);
  if (!o) return;
  $('overlay-title').textContent = o.title;
  $('overlay-text').textContent = o.text;
  $('overlay-bar').parentElement.hidden = o.progress == null;
  $('overlay-bar').style.width = `${Math.round((o.progress ?? 0) * 100)}%`;
  $('overlay-summary').hidden = !o.summary;
  if (o.summary) fillTable($('overlay-summary'), summaryRows(o.summary));
  $('overlay-buttons').replaceChildren(...(o.buttons ?? []).map(([label, cmd]) => {
    const b = document.createElement('button');
    b.className = 'primary';
    b.textContent = label;
    b.onclick = () => send(cmd);
    return b;
  }));
  if (o.green === false && phase === 'day_end') {
    $('game').classList.remove('shake');
    requestAnimationFrame(() => $('game').classList.add('shake'));
  }
}

let toastTimer = 0;
function toast(text) {
  $('toast').textContent = text;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000);
}

// ----- controls

$('speeds').append(...SPEEDS.map(([speed, label]) => {
  const b = document.createElement('button');
  b.dataset.speed = speed;
  b.textContent = label;
  b.onclick = () => send('speed', { value: speed });
  return b;
}));

document.querySelectorAll('[data-style]').forEach((b) => {
  b.onclick = () => { allCharts().forEach((c) => c.setStyle(b.dataset.style)); markStyle(); };
});
function markStyle() {
  document.querySelectorAll('[data-style]').forEach((b) => b.classList.toggle('active', b.dataset.style === chart.style));
}

$('window').max = WINDOW_STEPS.length - 1;
$('window').oninput = () => { allCharts().forEach((c) => c.setWindow(WINDOW_STEPS[+$('window').value])); showWindow(); };
function showWindow() {
  const m = chart.minutes;
  $('window').value = WINDOW_STEPS.reduce((best, s, i) => (Math.abs(s - m) < Math.abs(WINDOW_STEPS[best] - m) ? i : best), 0);
  $('window-val').textContent = m < 1 ? `${m * 60}s` : `${m}m`;
}

// Indicator buttons: MA ▾ / EMA ▾ open a box of period checkboxes; the others toggle directly.
let openGroup = null;

function toggleIndicator(name) {
  if (shown.has(name)) shown.delete(name); else shown.add(name);
  store('tt.indicators', JSON.stringify([...shown]));
  renderChips();
  send('indicators', { names: [...shown] });
}

function chip(label, active) {
  const b = document.createElement('button');
  b.className = `chip${active ? ' active' : ''}`;
  b.textContent = label;
  return b;
}

function renderChips() {
  const groups = PERIODIC.map(([key, label, periods]) => {
    const b = chip(`${label} ▾`, periods.some((p) => shown.has(`${key}${p}`)));
    b.dataset.group = key;
    b.onclick = () => { openGroup = openGroup === key ? null : key; renderPeriodBox(); };
    return b;
  });
  const singles = SINGLES.map(([name, label]) => {
    const b = chip(label, shown.has(name));
    b.onclick = () => toggleIndicator(name);
    return b;
  });
  $('chips').replaceChildren(...groups, ...singles);
  renderPeriodBox();
}

function renderPeriodBox() {
  const box = $('ind-menu');
  const group = PERIODIC.find(([key]) => key === openGroup);
  box.hidden = !group;
  if (!group) return;
  const [key, label, periods] = group;
  box.innerHTML = `<div class="box-title">${label} periods</div>${periods.map((p) => {
    const c = look(`${key}${p}`)[0];
    return `<label class="check"><input type="checkbox" data-name="${key}${p}"${shown.has(`${key}${p}`) ? ' checked' : ''}>`
      + `<i class="swatch" style="border-top: 3px ${c.style ? 'dashed' : 'solid'} ${css(c.color)}"></i>${label}${p}</label>`;
  }).join('')}`;
  box.querySelectorAll('input').forEach((i) => { i.onchange = () => toggleIndicator(i.dataset.name); });
  const host = box.parentElement.getBoundingClientRect();
  const anchor = $('chips').querySelector(`[data-group="${key}"]`).getBoundingClientRect();
  box.style.left = `${anchor.left - host.left}px`;
  box.style.top = `${anchor.bottom - host.top + 4}px`;
}

document.addEventListener('click', (e) => {
  if (openGroup && !e.target.closest('#ind-menu, [data-group]')) {
    openGroup = null;
    renderPeriodBox();
  }
});

$('dollars').value = stored('tt.dollars') || 1000;
$('dollars').oninput = () => { store('tt.dollars', $('dollars').value); showSize(); };
$('order-type').onchange = () => {
  const market = $('order-type').value === 'MKT';
  $('order-price').disabled = market;
  if (!market && !$('order-price').value) $('order-price').value = state.prices?.[view()]?.toFixed(2) ?? '';
  showSize();
};
$('order-price').oninput = showSize;
$('order-lev').onchange = () => send('leverage', { value: +$('order-lev').value });

// With leverage the size field is margin: the order is margin x leverage.
const leverage = () => state.account?.settings.leverage ?? 1;
const orderDollars = () => +$('dollars').value * leverage();

function showLeverage(lev) {
  const sel = $('order-lev');
  if (![...sel.options].some((o) => +o.value === lev)) sel.add(new Option(`${lev}x`, lev));
  sel.value = String([...sel.options].find((o) => +o.value === lev).value);
  $('size-label').textContent = lev > 1 ? 'Margin $' : 'Size $';
  showSize();
}

function showSize() {
  const lev = leverage();
  const price = $('order-type').value === 'MKT' ? state.prices?.[view()] : +$('order-price').value;
  const shares = price ? Math.floor(orderDollars() / price) : null;
  const sh = shares == null ? '' : ` ≈ ${shares} sh`;
  $('size-hint').textContent = lev > 1
    ? `${money(+$('dollars').value)} margin × ${lev}x = ${money(orderDollars())} position${sh}`
    : `${money(orderDollars())} position${sh}`;
}

function order(side) {
  const type = side === 'close' ? 'MKT' : $('order-type').value;
  send('order', { stock: view(), side, type, price: +$('order-price').value || null, dollars: orderDollars() });
}
$('buy').onclick = () => order('buy');
$('sell').onclick = () => order('sell');
$('close').onclick = () => order('close');
$('close-all').onclick = () => send('close_all');
$('new-game').onclick = () => send('new_game');
$('add').onclick = () => send('add');
$('replace').onclick = () => send('replace', { stock: view() });
$('split').onclick = () => {
  split = !split;
  store('tt.split', split ? '1' : '0');
  send('split', { on: split });
};
$('quick-save').onclick = async () => {
  const r = await (await fetch('/api/saves', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Quick save' }),
  })).json();
  toast(r.ok ? 'Quick saved. Load it from Settings → Save / load.' : r.message);
};

// Keyboard: B buy, S sell, C close, Space pause/resume, 1-5 switch stock.
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select') || document.querySelector('dialog[open]') || $('game').hidden || screenOpen) return;
  const key = e.key.toLowerCase();
  if (key === 'b') order('buy');
  else if (key === 's') order('sell');
  else if (key === 'c') order('close');
  else if (key === ' ') { e.preventDefault(); send('speed', { value: state.speed ? 0 : lastSpeed }); }
  else if (/^[1-5]$/.test(key) && state.session?.stocks[+key - 1]) send('view', { stock: state.session.stocks[+key - 1] });
});

async function boot() {
  refreshCoins();
  setInterval(refreshCoins, 60000);
  const k = await (await fetch('/api/keys')).json();
  if (k.configured) startGame();
  else openSetup();
}

boot();
