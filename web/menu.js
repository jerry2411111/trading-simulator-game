// Dialogs: API status, Settings (UI style, trading, save / load, AI operation, exit) and Stats.
import { equityChart, store, stored } from './chart.js';
import { fillTable, money, pct, ratio, summaryRows } from './format.js';

const $ = (id) => document.getElementById(id);
const THEMES = [['neon', 'Neon'], ['terminal', 'Terminal'], ['synthwave', 'Synthwave'], ['amber', 'Amber CRT'], ['office', 'Office 95']];
const DEFAULT_MODEL = { anthropic: 'claude-opus-5-5', openai: '' };

const post = async (url, body) => (await fetch(url, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})).json();

export function applyStoredTheme() {
  const theme = stored('tt.theme');
  document.documentElement.dataset.theme = THEMES.some(([id]) => id === theme) ? theme : 'neon';
}

export function initMenus(ctx) {
  document.querySelectorAll('dialog [data-close]').forEach((b) => { b.onclick = () => b.closest('dialog').close(); });

  // ----- API status
  $('api-btn').onclick = () => {
    const feed = ctx.state().feed;
    $('api-feed').textContent = feed === 'sip' ? 'connected, full-market (SIP) data' : feed ? 'connected, IEX data only' : 'not connected';
    $('api').showModal();
  };
  $('change-key').onclick = () => { $('api').close(); ctx.openSetup('', true); };
  $('forget-key').onclick = async () => {
    $('api').close();
    await fetch('/api/keys', { method: 'DELETE' });
    ctx.openSetup();
  };

  // ----- Settings: the game pauses while it is open and starts again when it closes
  let exiting = false;
  $('menu-btn').onclick = () => {
    exiting = false;
    if (ctx.state().speed) ctx.send('speed', { value: 0 });
    fillTrading(ctx.state().account?.settings);
    showTab('style');
    $('menu').showModal();
  };
  $('menu').addEventListener('close', () => {
    if (!exiting) ctx.send('speed', { value: ctx.lastSpeed() });
  });
  document.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => showTab(b.dataset.tab); });
  function showTab(tab) {
    document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== tab; });
    document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    if (tab === 'games') loadSaves();
    if (tab === 'ai') loadAi();
  }

  // UI style
  $('themes').append(...THEMES.map(([id, label]) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.dataset.theme = id;
    b.onclick = () => {
      document.documentElement.dataset.theme = id;
      store('tt.theme', id);
      ctx.charts().forEach((c) => c?.applyTheme());
      ctx.onTheme();
      markTheme();
    };
    return b;
  }));
  const markTheme = () => $('themes').querySelectorAll('button')
    .forEach((b) => b.classList.toggle('active', b.dataset.theme === document.documentElement.dataset.theme));
  markTheme();
  $('show-girl').checked = ctx.girlShown();
  $('show-girl').onchange = () => ctx.showGirl($('show-girl').checked);

  // Trading
  function fillTrading(s) {
    if (!s) return;
    $('set-spread').value = s.spread;
    $('set-fee').value = s.fee_per_share;
    $('set-min-fee').value = s.min_fee;
    $('deposit').value = '';
  }
  $('apply-trading').onclick = () => {
    ctx.send('configure', { spread: +$('set-spread').value, fee_per_share: +$('set-fee').value, min_fee: +$('set-min-fee').value });
    ctx.toast('Trading settings applied.');
  };
  $('apply-deposit').onclick = () => {
    ctx.send('deposit', { amount: +$('deposit').value });
    $('deposit').value = '';
  };
  $('clear-pnl').onclick = () => {
    ctx.send('clear_pnl');
    $('menu').close();
  };

  // Save / load
  async function loadSaves() {
    const list = await (await fetch('/api/saves')).json();
    $('saves').replaceChildren(...list.map((s) => {
      const li = document.createElement('li');
      li.innerHTML = `<span><b>${s.name}</b> · Day ${s.day ?? '—'} · ${money(s.equity)} · ${new Date(s.saved_at * 1000).toLocaleString()}</span>`;
      const load = document.createElement('button');
      load.textContent = 'Load';
      load.onclick = async () => {
        const r = await post(`/api/saves/${s.id}/load`, {});
        if (!r.ok) return ctx.toast(r.message);
        $('menu').close();
        ctx.toast(`Loaded "${s.name}".`);
      };
      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.onclick = async () => { await fetch(`/api/saves/${s.id}`, { method: 'DELETE' }); loadSaves(); };
      li.append(load, del);
      return li;
    }));
    if (!list.length) $('saves').innerHTML = '<li class="muted">No saved games yet.</li>';
  }
  $('save-game').onclick = async () => {
    const r = await post('/api/saves', { name: $('save-name').value });
    ctx.toast(r.ok ? 'Game saved.' : r.message);
    $('save-name').value = '';
    loadSaves();
  };

  // AI operation
  let standardPrompt = '';
  async function loadAi() {
    const a = await (await fetch('/api/ai')).json();
    standardPrompt = a.standard_prompt;
    $('ai-enabled').checked = a.enabled;
    $('ai-provider').value = a.provider;
    $('ai-model').value = a.model;
    $('ai-base').value = a.base_url;
    $('ai-key').value = '';
    $('ai-key').placeholder = a.has_key ? 'saved — leave empty to keep' : 'paste your API key';
    $('ai-interval').value = a.interval;
    $('ai-max').value = a.max_dollars;
    $('ai-remember').checked = a.remember;
    $('ai-price').checked = a.share_price;
    $('ai-volume').checked = a.share_volume;
    $('ai-indicators').checked = a.share_indicators;
    $('ai-prompt').value = a.prompt;
    $('ai-status').textContent = '';
  }
  $('ai-provider').onchange = () => { $('ai-model').value = DEFAULT_MODEL[$('ai-provider').value]; };
  $('ai-reset').onclick = () => { $('ai-prompt').value = standardPrompt; };
  $('ai-save').onclick = async () => {
    const r = await post('/api/ai', {
      enabled: $('ai-enabled').checked, provider: $('ai-provider').value, model: $('ai-model').value.trim(),
      base_url: $('ai-base').value.trim(), api_key: $('ai-key').value, interval: +$('ai-interval').value,
      max_dollars: +$('ai-max').value, remember: $('ai-remember').checked, share_price: $('ai-price').checked,
      share_volume: $('ai-volume').checked, share_indicators: $('ai-indicators').checked, prompt: $('ai-prompt').value,
    });
    $('ai-key').value = '';
    if (r.ok) $('ai-key').placeholder = r.has_key ? 'saved — leave empty to keep' : 'paste your API key';
    $('ai-status').textContent = !r.ok ? r.message
      : r.enabled && !r.has_key ? 'Saved, but the AI needs an API key to trade.' : 'Saved.';
  };

  // Exit: autosaves; the desktop window closes itself
  $('exit-game').onclick = async () => {
    exiting = true;
    const r = await post('/api/exit', {});
    if (!r.closing) {
      $('menu').close();
      ctx.toast('Game saved. You can close this window.');
    }
  };

  // ----- Stats
  let eqChart = null;
  $('stats-btn').onclick = () => ctx.send('stats');
  $('stats').addEventListener('close', () => { eqChart?.remove(); eqChart = null; });

  return {
    showStats(m) {
      const o = m.overall;
      fillTable($('stats-overall'), [['Days played', o.days], ...summaryRows(o)]);
      $('stats-days').innerHTML = '<tr><th>Day</th><th>Return</th><th>Max DD</th><th>Sharpe</th><th>Sortino</th><th>Trades</th><th>Win</th><th>Fees</th></tr>'
        + m.days.map((d) => `<tr><td>${d.day}</td><td class="${d.return >= 0 ? 'up' : 'down'}">${pct(d.return)}</td><td>${pct(d.max_dd)}</td>`
          + `<td>${ratio(d.sharpe)}</td><td>${ratio(d.sortino)}</td><td>${d.trades}</td><td>${pct(d.win_rate)}</td><td>${money(d.fees)}</td></tr>`).join('');
      if (!$('stats').open) $('stats').showModal();
      eqChart?.remove();
      eqChart = m.curve.length > 1 ? equityChart($('equity-chart'), m.curve) : null;
    },
  };
}
