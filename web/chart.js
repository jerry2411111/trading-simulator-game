// Main chart: price (candle or line) with trade triangles and indicator overlays, volume bars always below,
// optional MACD / KDJ panes and a random-walk cone. Shows the last N minutes and follows the clock.
import {
  createChart, createSeriesMarkers, CandlestickSeries, LineSeries, HistogramSeries,
} from 'https://unpkg.com/lightweight-charts@5.0.0/dist/lightweight-charts.standalone.production.mjs';

const STYLE_KEY = 'tt.priceStyle';
const WINDOW_KEY = 'tt.windowMinutes';
const CONE = 300; // random-walk band horizon, seconds
const CONE_Z = 1.96;

export function stored(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function store(key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable: choice lasts this visit */ }
}

export const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Chart times are day * 86400 + seconds since midnight: show only the time of day.
const hms = (t) => new Date((t % 86400) * 1000).toISOString().slice(11, 19);

// Indicators with a period: the player ticks which periods to draw.
export const PERIODIC = [['ma', 'MA', [5, 10, 20, 30, 60, 120]], ['ema', 'EMA', [5, 9, 12, 20, 26, 50, 100, 200]]];
export const SINGLES = [['boll', 'BOLL'], ['sar', 'SAR'], ['band', 'RW 95%'], ['macd', 'MACD'], ['kdj', 'KDJ']];
export const INDICATOR_NAMES = [...PERIODIC.flatMap(([k, , ps]) => ps.map((p) => `${k}${p}`)), ...SINGLES.map(([k]) => k)];
const PERIOD_COLORS = ['--accent', '--accent2', '--warn', '--up', '--down', '--ink', '--muted', '--hi'];
const DASHED = 2;
const LARGE_DASHED = 3;

// Per indicator: one entry per data column (color variable, line style, dots, histogram).
const LOOK = {
  boll: [{ color: '--accent2', style: DASHED }, { color: '--muted' }, { color: '--accent2', style: DASHED }],
  sar: [{ color: '--warn', dots: true }],
  macd: [{ color: '--accent' }, { color: '--accent2' }, { hist: true }],
  kdj: [{ color: '--accent' }, { color: '--accent2' }, { color: '--warn' }],
};
const PANES = new Set(['macd', 'kdj']);

// MA lines are solid, EMA lines dashed; each period has its own color.
export function look(name) {
  const m = name.match(/^(ma|ema)(\d+)$/);
  if (!m) return LOOK[name];
  const periods = PERIODIC.find(([k]) => k === m[1])[2];
  const shift = m[1] === 'ema' ? 3 : 0; // EMA colors start elsewhere in the palette than MA colors
  return [{
    color: PERIOD_COLORS[(periods.indexOf(+m[2]) + shift) % PERIOD_COLORS.length],
    style: m[1] === 'ema' ? LARGE_DASHED : 0,
  }];
}

// Rows arrive as [time, open, high, low, close, volume], one per second.
const candle = ([time, open, high, low, close]) => ({ time, open, high, low, close });
const point = ([time, , , , value]) => ({ time, value });

export class PriceChart {
  constructor(el) {
    this.rows = [];
    this.ind = {};       // name -> columns of values aligned with rows
    this.series = {};    // name -> chart series per column
    this.trades = [];
    this.chart = createChart(el, {
      autoSize: true,
      localization: { timeFormatter: hms },
      timeScale: {
        timeVisible: true, secondsVisible: true, minBarSpacing: 0.01,
        tickMarkFormatter: (t) => (hms(t).endsWith(':00') ? hms(t).slice(0, 5) : hms(t)),
      },
      handleScroll: false,
      handleScale: false,
    });
    this.candle = this.chart.addSeries(CandlestickSeries, { borderVisible: false });
    this.line = this.chart.addSeries(LineSeries, { lineWidth: 2 });
    this.volume = this.chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' }, lastValueVisible: false, priceLineVisible: false,
    }, 1);
    this.el = el;
    this.observer = new ResizeObserver(() => this.layoutPanes());
    this.observer.observe(el);
    this.legend = document.createElement('div');
    this.legend.className = 'legend';
    el.append(this.legend);
    this.markers = [createSeriesMarkers(this.candle), createSeriesMarkers(this.line)];
    this.minutes = Number(stored(WINDOW_KEY)) || 10;
    this.applyTheme();
    this.setStyle(stored(STYLE_KEY) === 'line' ? 'line' : 'candle');
  }

  destroy() {
    this.observer.disconnect();
    this.chart.remove();
    this.legend.remove();
  }

  get style() { return this.line.options().visible ? 'line' : 'candle'; }

  setStyle(style) {
    this.candle.applyOptions({ visible: style === 'candle' });
    this.line.applyOptions({ visible: style === 'line' });
    store(STYLE_KEY, style);
  }

  // Re-read the palette (after a UI style change) and redraw everything with it.
  applyTheme() {
    const c = (v) => css(v);
    this.up = c('--up');
    this.down = c('--down');
    this.chart.applyOptions({
      layout: {
        background: { color: c('--chart-bg') }, textColor: c('--ink'), fontFamily: c('--font-body'),
        fontSize: parseInt(c('--chart-size'), 10), attributionLogo: false, panes: { separatorColor: c('--accent2') },
      },
      grid: { vertLines: { color: c('--grid') }, horzLines: { color: c('--grid') } },
      crosshair: { vertLine: { color: c('--accent') }, horzLine: { color: c('--accent') } },
      timeScale: { borderColor: c('--accent') },
      rightPriceScale: { borderColor: c('--accent') },
    });
    this.candle.applyOptions({ upColor: this.up, downColor: this.down, wickUpColor: this.up, wickDownColor: this.down });
    this.line.applyOptions({ color: c('--accent') });
    this.setData(this.rows, this.ind);
    this.setTrades(this.trades);
  }

  setWindow(minutes) {
    this.minutes = minutes;
    store(WINDOW_KEY, minutes);
    this.follow();
  }

  follow() {
    const n = this.rows.length;
    const ahead = this.ind.band ? CONE : 3;
    this.chart.timeScale().setVisibleLogicalRange({ from: n - this.minutes * 60, to: n + ahead });
  }

  bar(r) { return { time: r[0], value: r[5], color: `${r[4] >= r[1] ? this.up : this.down}99` }; }

  setData(rows, ind) {
    this.rows = rows;
    this.ind = ind;
    this.candle.setData(rows.map(candle));
    this.line.setData(rows.map(point));
    this.volume.setData(rows.map((r) => this.bar(r)));
    this.drawIndicators();
    this.follow();
  }

  append(rows, ind) {
    const start = this.rows.length;
    this.rows.push(...rows);
    for (const r of rows) {
      this.candle.update(candle(r));
      this.line.update(point(r));
      this.volume.update(this.bar(r));
    }
    for (const [name, cols] of Object.entries(ind)) {
      if (!this.ind[name]) continue;
      cols.forEach((col, j) => {
        this.ind[name][j].push(...col);
        if (name === 'band') return; // the cone is redrawn from the latest value below
        col.forEach((v, k) => v != null && this.series[name]?.[j]?.update(this.point(name, j, rows[k][0], v)));
      });
    }
    if (this.ind.band) this.drawCone();
    if (rows.length && start === 0) this.setTrades(this.trades);
    this.follow();
  }

  point(name, j, time, value) {
    return look(name)?.[j]?.hist ? { time, value, color: value >= 0 ? this.up : this.down } : { time, value };
  }

  drawIndicators() {
    for (const list of Object.values(this.series)) list.forEach((s) => this.chart.removeSeries(s));
    this.series = {};
    for (const [name, cols] of Object.entries(this.ind)) {
      if (name === 'band') { this.series.band = this.coneSeries(); this.coneAt = null; continue; }
      const pane = PANES.has(name) ? this.chart.panes().length : 0;
      this.series[name] = look(name).map((col, j) => {
        const s = col.hist
          ? this.chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false }, pane)
          : this.chart.addSeries(LineSeries, {
            color: css(col.color), lineWidth: 1, lineStyle: col.style ?? 0, lineVisible: !col.dots,
            pointMarkersVisible: !!col.dots, pointMarkersRadius: 1, priceLineVisible: false,
            lastValueVisible: false, crosshairMarkerVisible: false,
          }, pane);
        s.setData(cols[j].flatMap((v, k) => (v == null ? [] : [this.point(name, j, this.rows[k][0], v)])));
        return s;
      });
    }
    requestAnimationFrame(() => this.layoutPanes()); // after the chart has created the new panes
    if (this.ind.band) this.drawCone();
    this.drawLegend();
  }

  // Which line is which: a swatch in the line's color and style next to each shown indicator.
  drawLegend() {
    const label = (n) => SINGLES.find(([k]) => k === n)?.[1] ?? n.toUpperCase();
    this.legend.innerHTML = INDICATOR_NAMES.filter((n) => this.ind[n]).map((n) => {
      const c = n === 'band' ? { color: '--warn', style: DASHED } : look(n)[0];
      const border = c.dots ? 'dotted' : c.style ? 'dashed' : 'solid';
      return `<span><i style="border-top: 3px ${border} ${css(c.color)}"></i>${label(n)}</span>`;
    }).join('');
  }

  // Volume / MACD / KDJ panes each take a share of the height, so price keeps most of a small window.
  layoutPanes() {
    const h = Math.max(40, Math.round(this.el.clientHeight * 0.17));
    this.chart.panes().slice(1).forEach((p) => p.setHeight(h));
  }

  coneSeries() {
    const opts = {
      color: css('--warn'), lineWidth: 1, lineStyle: 2, priceLineVisible: false,
      lastValueVisible: false, crosshairMarkerVisible: false,
    };
    return [this.chart.addSeries(LineSeries, opts), this.chart.addSeries(LineSeries, opts)];
  }

  // 95% random-walk band, fixed at the start of each 5-minute block (from the 1-second volatility of the
  // 15 minutes before it) and reaching the block's end, so the price can be watched moving through it.
  drawCone() {
    const n = this.rows.length;
    const k = n - 1 - ((n - 1) % CONE);  // one bar per second from the open: blocks start every 300 bars
    const sigma = this.ind.band[0][k];
    if (!n || sigma == null) { this.coneAt = null; return this.series.band.forEach((s) => s.setData([])); }
    if (this.coneAt === k) return;
    this.coneAt = k;
    const [t0, , , , c0] = this.rows[k];
    const side = (sign) => Array.from({ length: CONE + 1 }, (_, h) => (
      { time: t0 + h, value: c0 * Math.exp(sign * CONE_Z * sigma * Math.sqrt(h)) }));
    this.series.band[0].setData(side(1));
    this.series.band[1].setData(side(-1));
  }

  // Slot machine reveals: the highest and lowest price of the next 2 hours as dashed lines.
  setReveals(list) {
    (this.priceLines ?? []).forEach(([series, line]) => series.removePriceLine(line));
    this.priceLines = [];
    list.forEach((r) => [[r.high, '2H HIGH', this.up], [r.low, '2H LOW', this.down]].forEach(([price, title, color]) => {
      [this.candle, this.line].forEach((series) => this.priceLines.push([series, series.createPriceLine({
        price, color, title, lineWidth: 1, lineStyle: 2, axisLabelVisible: true,
      })]));
    }));
  }

  // Buy fills: green triangle below the bar; sell fills: red triangle above.
  setTrades(trades) {
    this.trades = trades;
    const known = new Set(this.rows.map((r) => r[0]));
    const marks = trades.filter((t) => known.has(t.t)).sort((a, b) => a.t - b.t).map((t) => ({
      time: t.t, position: t.qty > 0 ? 'belowBar' : 'aboveBar', shape: t.qty > 0 ? 'arrowUp' : 'arrowDown',
      color: t.qty > 0 ? this.up : this.down, size: 1.4,
    }));
    this.markers.forEach((m) => m.setMarkers(marks));
  }
}

export function equityChart(el, points) {
  const chart = createChart(el, {
    autoSize: true,
    layout: { background: { color: css('--chart-bg') }, textColor: css('--ink'), fontFamily: css('--font-body'), attributionLogo: false },
    grid: { vertLines: { visible: false }, horzLines: { color: css('--grid') } },
    localization: { timeFormatter: (t) => `Day ${Math.floor(t / 86400)} ${hms(t)}` },
    timeScale: { tickMarkFormatter: (t) => `D${Math.floor(t / 86400)} ${hms(t).slice(0, 5)}` },
  });
  chart.addSeries(LineSeries, { color: css('--accent'), lineWidth: 2 }).setData(points.map(([time, value]) => ({ time, value })));
  chart.timeScale().fitContent();
  return chart;
}
