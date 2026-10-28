# TapeTrainer

A single-player, retro pixel-style day-trading practice game that replays real US stock trades,
second by second, on a random day since 2024. Educational only, not financial advice.

> Work in progress. The full README (Alpaca signup guide, screenshots) comes with the last milestone.

## Run

```
pip install -r requirements.txt
uvicorn app.main:app
```

Open http://127.0.0.1:8000. The first screen walks you through getting a free Alpaca paper-trading
key. Market data is fetched by your own machine with your own key and is never redistributed.
Developers can put the key in `.env` instead (see `.env.example`).

Tests: `python -m pytest`

## Game rules

- Price and volume are always shown on the main chart. Volume is always a bar chart; price can be
  switched between candles and a line.
- Leverage from 1x up to 100x.
- No target and no win screen: play as long as you like. The game ends only if equity reaches 0.

## Universe

`app/universe.json` is the seed list of stocks the game picks from. It is maintainer-editable.
