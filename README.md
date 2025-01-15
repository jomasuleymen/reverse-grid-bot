# ReverseGridBot

**ReverseGridBot** is a trading bot for exchanges that operates with the opposite logic of traditional grid bots. Instead of buying when the price falls and selling when it rises, this bot performs the opposite actions: it buys when the price rises and sells when the price falls.

## Algorithm

1. **Long Position:**
   - When the price rises, the bot buys at each price level (grid).
   - When the price falls, the bot sells at each price level.
   - The position is closed when the specified profit is reached.

2. **Short Position:**
   - When the price falls, the bot sells at each price level (grid).
   - When the price rises, the bot buys at each price level.
   - The position is closed when the specified profit is reached.
