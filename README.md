# TapeTrainer

A single-player, retro pixel-style day-trading practice game that replays real US stock trades,
second by second, on a random day since 2024. Educational only, not financial advice.

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

## Game rules

- Price and volume are always shown on the main chart. Volume is always a bar chart; price can be
  switched between candles and a line. A slider sets how much time the chart shows (30 seconds to
  120 minutes); the view follows the clock.
- Stock names are hidden: stocks appear as STOCK A, STOCK B, ... and the real ticker never leaves the
  backend.
- Only liquid stocks are picked (at least 250,000 trades a day on average over the previous 20 trading
  days), so the 1-second chart has a trade in almost every second.
- Leverage from 1x up to 100x.
- No target and no win screen: play as long as you like. The game ends only if equity reaches 0.

## Universe

`app/universe.json` is the seed list of stocks the game picks from. It is maintainer-editable.
