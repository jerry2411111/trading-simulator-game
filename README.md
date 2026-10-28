# TapeTrainer

A single-player, retro pixel-style day-trading practice game that replays real US stock trades,
second by second, from a random day between 2020 and 2025. Educational only, not financial advice.

> Work in progress. The full README (Alpaca signup guide, screenshots) comes with the last milestone.

## Run

On Windows, double-click `start.bat` (the first run installs everything into a local `.venv`).
Or by hand:

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
  slider sets how much time is visible (15 seconds to 90 minutes); the view follows the clock. Buys are
  marked with green triangles, sells with red ones.
- **Indicators:** MA (5/10/20/30/60/120) and EMA (5/9/12/20/26/50/100/200), each period ticked
  separately and labeled in a legend; Bollinger (20, 2σ), Parabolic SAR, MACD, KDJ, and a random-walk
  95% band: from the last 10 minutes of 1-second volatility σ, the band
  `P·exp(±1.96·σ·√h)` is drawn as a cone over the next 5 minutes.
- **Speeds:** pause, ▶ (real time), 1.5x, 2x, 3x, 5x, 10x, 60x. Chart window: 15 seconds to 90 minutes.
- **Orders:** MKT, LMT, and conditional "MKT if ≥ / ≤ price"; a fixed dollar size; BUY, SELL, CLOSE,
  Close all. No spread or slippage: market orders fill at the current 1-second close. Waiting orders
  and positions are closed at the end of each day.
- **Account:** $10,000 to start, leverage 1x–100x, fees $0.005/share ($1 minimum per order). Fees can
  be lowered but never below $0.001/share and $1 per order; the market-order spread can be 0. Money can't
  be added: mortgage your home (Store → Mortgage) instead, or start a new game / load a save. No target
  and no win screen; the game ends only if equity reaches $0.
- **Slot machine:** every 5 trades the reels spin. 30% shows the next 2 hours' highest and lowest price
  on the chart, 20% pays double the profit of your next closing trade, 10% makes your next closing trade
  unable to lose, 10% shows whether the stock closes up or down the next trading day, 10% gives 10
  trades without fee or spread, 10% gives 30 of them, 5% pays five times the profit of your next closing
  trade, and 5% gives a piece for your collection. Multipliers never apply to losses.
- **Collection:** 100 rare pieces (great artworks, tanks, dresses, crowns, jewels, classic cars, watches,
  instruments, relics, legends), rare to mythic, won as slot machine gifts and shown in lit glass
  cabinets in a museum showcase (Collection button). They can't be sold.
- **Stats:** end-of-day card and a Stats screen (return, max drawdown, Sharpe, Sortino, trades, win rate,
  fees, equity curve).
- **Settings** (the game pauses while open): 5 UI styles, trading settings (spread, fees), Clear PnL,
  save / load games, AI operation, exit. The game also autosaves to `data/state.json`.
- **AI operation:** enter your own AI API key (Anthropic, or any OpenAI-compatible endpoint), tick
  which data the AI receives (price, volume, indicators), and edit its role-play prompt. Every N game
  seconds the clock waits while the AI decides; it can place MKT, LMT and conditional orders with a
  price and size. The key stays on your computer (memory only unless you tick "Remember").
- **Your pet:** the head of your companion pet next to the chart. Focused when you're flat, expecting
  when your open position is winning, anxious when it's losing, happy (+$) or sad (−$) when a trade
  closes. Hover it to pat it. Pick the companion in the garden; hide it in Settings → UI style.
- Keyboard: B buy, S sell, C close, Space pause / resume, 1–5 switch stock.

## Home and Store

Every game has its own home, saved with the game. Coins = this game's trading profit + income from the
home − what you spend. The game pauses while you're in Home, Store or Collection.

- **Garden:** starts as a wasteland of rubble, tires and trash. Pay to clean up each of its six parts,
  then lay a floor (lawn, clover & moss, zen gravel, red brick, stone paving, wood deck, neon tiles).
  The flower bed sits in the middle (8 flowers that grow as full piles, bloom in 8 hours and sell for
  twice the seed price); four tree spots (pine, maple, apple, sakura: grow in 1–3 days, then give a
  harvest every day or two; bees build a hive in the grown trees, sakura petals fall); a pool; a play
  corner. Birds fly over and land in the trees.
- **Pets:** turtle, lizard, cat, dog, parrot, lion, each with its own habits in the garden; inside the
  house they use the furniture (nap on the bed, watch the fish, beg at the fridge, walk on the piano...).
  Each eats at a different price; hungry after 2 days without food, dead after 7 (real days).
- **House:** a concrete shack to start; modern or European house (level 2); modern tower, Chinese
  palace or European palace (level 3). Better houses are bigger in the garden and inside; the European
  palace fills the whole garden. Rooms are divided by walls; 37 kinds of furniture to place and rotate.
- **Fish and the aquarium:** a fish tank unlocks 12 kinds of fish (they swim in the tank). Upgrade it to
  the aquarium for sea life (starfish, seahorse, jellyfish, lionfish, moray eel, octopus, sea turtle,
  manta ray, shark, whale), then build the ice land in it for penguins, seals and sea dogs. Water animals
  get hungry after 2 days but never die.
- **Store:** buy everything; sell unused furniture, seeds and saplings back at half price.
- **Mortgage:** one house, building or piece of furniture for 70% of its price, or the whole home for
  $20,000 + 70% of everything in it (that locks the home until it's paid back). The dollars go into the
  trading account and are not profit; paying back takes them out again.

## Universe

`app/universe.json` is the seed list of stocks the game picks from. It is maintainer-editable.

Charts: [TradingView Lightweight Charts™](https://www.tradingview.com/lightweight-charts/) (Apache 2.0).
