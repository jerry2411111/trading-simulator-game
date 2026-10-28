// Game screen: WebSocket state, top bar, stock tabs, chart and overlays.
import { PriceChart } from './chart.js';
import { showSetup } from './setup.js';

const $ = (id) => document.getElementById(id);
const SPEED_LABELS = { 0: '⏸', 1: '1x', 10: '10x', 60: '60x', 300: '300x' };
const AUTH_REASON = 'Alpaca stopped accepting your key, so the game is paused. Connect again to continue.';

let ws = null;
let chart = null;
let state = { phase: 'idle', session: null };
let overlayCmd = null;

const send = (cmd, extra = {}) => ws?.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ cmd, ...extra }));

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
  connect();
}

function connect() {
  if (ws && ws.readyState <= WebSocket.OPEN) return;
  ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  ws.onmessage = (e) => handle(JSON.parse(e.data));
  ws.onclose = () => setTimeout(connect, 1000);
}

function handle(m) {
  if (m.type === 'snapshot') {
    state = m;
    chart.setBars(m.bars || []);
    render();
  } else if (m.type === 'tick') {
    Object.assign(state, { clock: m.clock, prices: m.prices });
    chart.append(m.bars);
    renderClock();
    renderTabs();
  } else if (m.type === 'status') {
    Object.assign(state, { phase: m.phase, speed: m.speed, loading: m.loading });
    renderStatus();
  } else if (m.type === 'error') {
    toast(m.text);
  }
}

// ----- rendering

function render() {
  const s = state.session;
  $('date').textContent = s ? `${s.date} · DAY ${s.day}` : '—';
  $('feed').textContent = state.feed === 'sip' ? 'SIP' : state.feed === 'iex' ? 'IEX ONLY' : '';
  $('feed').hidden = !state.feed;
  $('fallback').hidden = !s?.fallback.length;
  $('fallback').textContent = `1m DATA: ${s?.fallback.join(' ') ?? ''}`;
  renderClock();
  renderTabs();
  renderStatus();
}

function renderClock() {
  $('clock').textContent = state.clock || '--:--:--';
}

function renderTabs() {
  const s = state.session;
  $('tabs').replaceChildren(...(s?.tickers ?? []).map((t) => {
    const b = document.createElement('button');
    b.className = `tab${t === s.view ? ' active' : ''}`;
    b.innerHTML = `<b>${t}</b><span class="num">${state.prices?.[t]?.toFixed(2) ?? '—'}</span>`;
    b.onclick = () => send('view', { ticker: t });
    return b;
  }));
  $('add').disabled = !s || s.tickers.length >= 5;
  $('replace').disabled = !s;
}

const OVERLAYS = {
  idle: () => ({ title: 'READY', text: 'Replay a random real trading day.', button: ['New game', 'new_game'] }),
  picking: () => ({ title: 'NEW GAME', text: 'Picking a random day and stocks…' }),
  loading: (st) => ({
    title: st.session.day > 1 ? 'Loading next day…' : 'Loading…',
    text: st.loading?.text ?? '',
    progress: st.loading?.progress,
  }),
  day_end: (st) => (st.session.last_day
    ? { title: 'MARKET CLOSED', text: 'No more data after this day.', button: ['New game', 'new_game'] }
    : { title: 'MARKET CLOSED', text: `Day ${st.session.day} is over.`, button: ['Next day', 'next_day'] }),
};

function renderStatus() {
  const { phase, loading } = state;
  if (phase === 'auth' && $('setup').hidden) openSetup(AUTH_REASON);
  if (phase === 'nokey' && $('setup').hidden) openSetup();
  $('speeds').querySelectorAll('button').forEach((b) => b.classList.toggle('active', +b.dataset.speed === state.speed));
  $('bg-status').textContent = phase === 'ready' && loading ? loading.text : '';

  const o = OVERLAYS[phase]?.(state);
  $('overlay').hidden = !o;
  if (!o) return;
  $('overlay-title').textContent = o.title;
  $('overlay-text').textContent = o.text;
  $('overlay-bar').parentElement.hidden = o.progress == null;
  $('overlay-bar').style.width = `${Math.round((o.progress ?? 0) * 100)}%`;
  $('overlay-btn').hidden = !o.button;
  [$('overlay-btn').textContent, overlayCmd] = o.button ?? ['', null];
}

let toastTimer = 0;
function toast(text) {
  $('toast').textContent = text;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000);
}

// ----- controls

$('speeds').append(...Object.entries(SPEED_LABELS).map(([speed, label]) => {
  const b = document.createElement('button');
  b.dataset.speed = speed;
  b.textContent = label;
  b.onclick = () => send('speed', { value: +speed });
  return b;
}));

document.querySelectorAll('[data-style]').forEach((b) => {
  b.onclick = () => { chart.setStyle(b.dataset.style); markStyle(); };
});
function markStyle() {
  document.querySelectorAll('[data-style]').forEach((b) => b.classList.toggle('active', b.dataset.style === chart.style));
}

$('new-game').onclick = () => send('new_game');
$('add').onclick = () => send('add');
$('replace').onclick = () => send('replace', { ticker: state.session?.view });
$('overlay-btn').onclick = () => overlayCmd && send(overlayCmd);

$('settings-btn').onclick = () => {
  $('settings-feed').textContent = state.feed === 'sip' ? 'connected (full-market SIP data)' : 'connected (IEX data only)';
  $('settings').showModal();
};
$('settings-close').onclick = () => $('settings').close();
$('change-key').onclick = () => { $('settings').close(); openSetup('', true); };
$('forget-key').onclick = async () => {
  $('settings').close();
  await fetch('/api/keys', { method: 'DELETE' });
  openSetup();
};

async function boot() {
  const k = await (await fetch('/api/keys')).json();
  if (k.configured) startGame();
  else openSetup();
}

boot();
