# TapeTrainer

A single-player, retro pixel-style day-trading practice game that replays real US stock trades,
second by second, from a random day between 2020 and 2025. Educational only, not financial advice.

> Work in progress. The full README (Alpaca signup guide, screenshots) comes with the last milestone.

## Run

```
pip install -r requirements.txt
python -m app
```

This opens TapeTrainer in its own desktop window (resize it by dragging any edge or corner; the app
always fills the window). To play in a browser instead, run `uvicorn app.main:app` and open
http://127.0.0.1:8000. The first screen walks you through getting a free Alpaca paper-trading
key. Market data is fetched by your own machine with your own key and is never redistributed.
Developers can put the key in `.env` instead (see `.env.example`).

Tests: `python -m pytest`

## How it plays

- **Hidden identity.** Stocks appear as STOCK A, STOCK B, ...; no date is shown; prices are rescaled so
  each stock opens at $100.00 on the day it joins the game (volume is scaled the other way, so dollar
  volume and % moves are real). Real tickers and dates never leave the backend.
- **Liquid stocks only** (at least 250,000 trades a day on average over the previous 20 trading days), so
  the 1-second chart has a trade in almost every second.
- **Chart.** Price and volume are always shown; volume is always bars, price is candles or a line. A
  slider sets how much time is visible (30 seconds to 120 minutes); the view follows the clock. Buys are
  marked with green triangles, sells with red ones.
- **Indicators** (toggle each): SMA 5/10/20/60, EMA 12/26, Bollinger (20, 2σ), Parabolic SAR, MACD,
  KDJ, and a random-walk 95% band: from the last 10 minutes of 1-second volatility σ, the band
  `P·exp(±1.96·σ·√h)` is drawn as a cone over the next 5 minutes.
- **Speeds:** pause, ▶ (real time), 1.5x, 2x, 3x, 5x, 10x, 60x, 300x.
- **Orders:** MKT, LMT, and conditional "MKT if ≥ / ≤ price"; a fixed dollar size; BUY, SELL, CLOSE,
  Close all. No spread or slippage: market orders fill at the current 1-second close. Waiting orders
  and positions are closed at the end of each day.
- **Account:** starting capital up to $10,000, leverage 1x–100x, fees $0.005/share ($1 minimum),
  all editable. No target and no win screen; the game ends only if equity reaches $0.
- **Stats:** end-of-day card and a Stats screen (return, max drawdown, Sharpe, Sortino, trades, win rate,
  fees, equity curve).
- **Settings** (the game pauses while open): 5 UI styles, trading settings, Clear PnL, save / load
  games, AI operation, exit. The game also autosaves to `data/state.json`.
- **AI operation:** enter your own AI API key (Anthropic, or any OpenAI-compatible endpoint), tick
  which data the AI receives (price, volume, indicators), and edit its role-play prompt. Every N game
  seconds the clock waits while the AI decides; it can place MKT, LMT and conditional orders with a
  price and size. The key stays on your computer (memory only unless you tick "Remember").
- Keyboard: B buy, S sell, C close, Space pause / resume, 1–5 switch stock.

## Universe

`app/universe.json` is the seed list of stocks the game picks from. It is maintainer-editable.

Charts: [TradingView Lightweight Charts™](https://www.tradingview.com/lightweight-charts/) (Apache 2.0).
