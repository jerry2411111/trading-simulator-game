// Game screen: WebSocket state, top bar, stock tabs, chart, trading panel and keyboard shortcuts.
import { INDICATORS, PriceChart, store, stored } from './chart.js';
import { fillTable, money, signed, summaryRows } from './format.js';
import { applyStoredTheme, initMenus } from './menu.js';
import { showSetup } from './setup.js';

const $ = (id) => document.getElementById(id);
const SPEEDS = [[0, '⏸'], [1, '▶'], [1.5, '1.5x'], [2, '2x'], [3, '3x'], [5, '5x'], [10, '10x'], [60, '60x'], [300, '300x']];
const WINDOW_STEPS = [0.5, 1, 2, 3, 5, 10, 15, 20, 30, 45, 60, 90, 120]; // chart window, minutes
const AUTH_REASON = 'Alpaca stopped accepting your key, so the game is paused. Connect again to continue.';

let ws = null;
let chart = null;
let state = { phase: 'idle', session: null, account: null, trades: [], ai: { log: [] } };
let lastSpeed = 1;
let shown = new Set();
try { shown = new Set(JSON.parse(stored('tt.indicators') || '[]')); } catch { /* keep none */ }

const send = (cmd, extra = {}) => ws?.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ cmd, ...extra }));
const view = () => state.session?.view;

applyStoredTheme();
const menus = initMenus({ send, state: () => state, chart: () => chart, openSetup, toast });

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
  ws.onopen = () => send('indicators', { names: [...shown] });
  ws.onmessage = (e) => handle(JSON.parse(e.data));
  ws.onclose = () => setTimeout(connect, 1000);
}

function handle(m) {
  switch (m.type) {
    case 'snapshot':
      state = m;
      chart.setData(m.bars || [], m.ind || {});
      chart.setTrades(viewTrades());
      render();
      break;
    case 'tick':
      Object.assign(state, { clock: m.clock, prices: m.prices, account: m.account });
      chart.append(m.bars, m.ind || {});
      renderClock();
      renderTabs();
      renderAccount();
      break;
    case 'status':
      Object.assign(state, { phase: m.phase, speed: m.speed, loading: m.loading, thinking: m.thinking });
      renderStatus();
      break;
    case 'account':
      Object.assign(state, { account: m.account, trades: m.trades });
      chart.setTrades(viewTrades());
      renderAccount();
      renderTabs();
      m.fills.forEach((f) => toast(`${f.by === 'AI' ? 'AI: ' : ''}${f.qty > 0 ? 'Bought' : 'Sold'} ${Math.abs(f.qty)} ${f.stock} @ ${f.price.toFixed(2)}`));
      break;
    case 'ai':
      state.ai.log = [...state.ai.log, m.entry].slice(-30);
      renderAi();
      break;
    case 'stats':
      menus.showStats(m);
      break;
    case 'error':
      toast(m.text);
      break;
  }
}

const viewTrades = () => state.trades.filter((t) => t.stock === view());

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
  $('lev').textContent = `${a.settings.leverage}x`;
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
  b.onclick = () => { chart.setStyle(b.dataset.style); markStyle(); };
});
function markStyle() {
  document.querySelectorAll('[data-style]').forEach((b) => b.classList.toggle('active', b.dataset.style === chart.style));
}

$('window').max = WINDOW_STEPS.length - 1;
$('window').oninput = () => { chart.setWindow(WINDOW_STEPS[+$('window').value]); showWindow(); };
function showWindow() {
  const m = chart.minutes;
  $('window').value = WINDOW_STEPS.reduce((best, s, i) => (Math.abs(s - m) < Math.abs(WINDOW_STEPS[best] - m) ? i : best), 0);
  $('window-val').textContent = m < 1 ? `${m * 60}s` : `${m}m`;
}

function renderChips() {
  $('chips').replaceChildren(...INDICATORS.map(([name, label]) => {
    const b = document.createElement('button');
    b.className = `chip${shown.has(name) ? ' active' : ''}`;
    b.textContent = label;
    b.onclick = () => {
      if (shown.has(name)) shown.delete(name); else shown.add(name);
      store('tt.indicators', JSON.stringify([...shown]));
      renderChips();
      send('indicators', { names: [...shown] });
    };
    return b;
  }));
}

$('dollars').value = stored('tt.dollars') || 1000;
$('dollars').onchange = () => store('tt.dollars', $('dollars').value);
$('order-type').onchange = () => {
  const market = $('order-type').value === 'MKT';
  $('order-price').disabled = market;
  if (!market && !$('order-price').value) $('order-price').value = state.prices?.[view()]?.toFixed(2) ?? '';
};

function order(side) {
  const type = side === 'close' ? 'MKT' : $('order-type').value;
  send('order', { stock: view(), side, type, price: +$('order-price').value || null, dollars: +$('dollars').value });
}
$('buy').onclick = () => order('buy');
$('sell').onclick = () => order('sell');
$('close').onclick = () => order('close');
$('close-all').onclick = () => send('close_all');
$('new-game').onclick = () => send('new_game');
$('add').onclick = () => send('add');
$('replace').onclick = () => send('replace', { stock: view() });

// Keyboard: B buy, S sell, C close, Space pause/resume, 1-5 switch stock.
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select') || document.querySelector('dialog[open]') || $('game').hidden) return;
  const key = e.key.toLowerCase();
  if (key === 'b') order('buy');
  else if (key === 's') order('sell');
  else if (key === 'c') order('close');
  else if (key === ' ') { e.preventDefault(); send('speed', { value: state.speed ? 0 : lastSpeed }); }
  else if (/^[1-5]$/.test(key) && state.session?.stocks[+key - 1]) send('view', { stock: state.session.stocks[+key - 1] });
});

async function boot() {
  const k = await (await fetch('/api/keys')).json();
  if (k.configured) startGame();
  else openSetup();
}

boot();
