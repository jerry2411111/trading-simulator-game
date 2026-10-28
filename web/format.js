// Number formatting shared by the game screen and the dialogs.
export const money = (v) => `${v < 0 ? '-' : ''}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const signed = (v) => `${v >= 0 ? '+' : '-'}${money(Math.abs(v))}`;
export const pct = (v) => (v == null ? '—' : `${(v * 100).toFixed(2)}%`);
export const ratio = (v) => (v == null ? '—' : v.toFixed(2));

// Rows for a day summary or the overall stats.
export const summaryRows = (s) => [
  ['Return', pct(s.return)], ['Max drawdown', pct(s.max_dd)], ['Sharpe', ratio(s.sharpe)],
  ['Sortino', ratio(s.sortino)], ['Trades', s.trades], ['Win rate', pct(s.win_rate)], ['Fees', money(s.fees)],
];

export function fillTable(table, rows) {
  table.innerHTML = rows.map(([k, v]) => `<tr><th>${k}</th><td class="num">${v}</td></tr>`).join('');
}
