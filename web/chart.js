// Main chart: price (candle or line, player's choice) on top, volume bars always below.
import {
  createChart, CandlestickSeries, LineSeries, HistogramSeries,
} from 'https://unpkg.com/lightweight-charts@5.0.0/dist/lightweight-charts.standalone.production.mjs';

const STYLE_KEY = 'tt.priceStyle';
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function stored(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function store(key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable: choice lasts this visit */ }
}

// Rows arrive as [time, open, high, low, close, volume].
const candle = ([time, open, high, low, close]) => ({ time, open, high, low, close });
const point = ([time, , , , value]) => ({ time, value });

export class PriceChart {
  constructor(el) {
    this.up = css('--up');
    this.down = css('--down');
    this.chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: css('--panel') }, textColor: css('--ink'),
        fontFamily: 'VT323, monospace', fontSize: 16,
      },
      grid: { vertLines: { color: css('--grid') }, horzLines: { color: css('--grid') } },
      timeScale: { timeVisible: true, secondsVisible: true, borderColor: css('--ink') },
      rightPriceScale: { borderColor: css('--ink') },
    });
    const up = this.up, down = this.down;
    this.candle = this.chart.addSeries(CandlestickSeries, {
      upColor: up, downColor: down, wickUpColor: up, wickDownColor: down, borderVisible: false,
    });
    this.line = this.chart.addSeries(LineSeries, { color: css('--accent'), lineWidth: 2 });
    this.volume = this.chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' }, lastValueVisible: false, priceLineVisible: false,
    }, 1);
    this.chart.panes()[1].setHeight(110);
    this.setStyle(stored(STYLE_KEY) === 'line' ? 'line' : 'candle');
  }

  get style() { return this.line.options().visible ? 'line' : 'candle'; }

  setStyle(style) {
    this.candle.applyOptions({ visible: style === 'candle' });
    this.line.applyOptions({ visible: style === 'line' });
    store(STYLE_KEY, style);
  }

  bar(r) { return { time: r[0], value: r[5], color: r[4] >= r[1] ? this.up : this.down }; }

  setBars(rows) {
    this.candle.setData(rows.map(candle));
    this.line.setData(rows.map(point));
    this.volume.setData(rows.map((r) => this.bar(r)));
  }

  append(rows) {
    for (const r of rows) {
      this.candle.update(candle(r));
      this.line.update(point(r));
      this.volume.update(this.bar(r));
    }
  }
}
