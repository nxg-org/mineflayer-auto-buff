<h2 align="center">mineflayer-auto-buff</h2>
<h4 align="center">A Mineflayer plugin for automatically drinking and throwing potion buffs with minimal setup.</h4>

<p align="center">
  <a href="https://github.com/nxg-org/mineflayer-auto-buff">
    <img src="https://img.shields.io/badge/github-181717?style=for-the-badge&logo=github" alt="GitHub">
  </a>
  <a href="https://www.npmjs.com/package/@nxg-org/mineflayer-auto-buff">
    <img src="https://img.shields.io/npm/v/%40nxg-org%2Fmineflayer-auto-buff?style=for-the-badge&logo=npm" alt="NPM">
  </a>
  <img src="https://img.shields.io/badge/license-GPL--3.0-black?style=for-the-badge" alt="License">
</p>


<h3 align="center">Why use this plugin?</h3>

-----

`mineflayer-auto-buff` gives a bot a small, focused API for managing potion effects without having to manually scan inventory, equip potions, drink them, or throw splash potions.

It is built around Mineflayer and `minecraft-data`, so effect lookup is version-aware and works well for common buff automation flows like:

- Auto-applying strength, speed, regeneration, invisibility, and similar effects
- Re-applying selected buffs when they expire
- Using splash or drinkable potions from inventory
- Restoring the previously held item after buffing

<h3 align="center">Features</h3>

-----

- [X] Buff the bot with one or many named effects
- [X] Apply a specific potion item directly
- [X] Detect available potion items in inventory
- [X] Auto-listen for effect expiry and re-apply configured buffs
- [X] Optional empty bottle dropping
- [X] Optional item restore after buffing
- [ ] Buff other entities
- [ ] Broader potion-name normalization for every edge case

<h3 align="center">Installation</h3>

-----

```bash
npm install @nxg-org/mineflayer-auto-buff
```

`@nxg-org/mineflayer-util-plugin` is used internally and is loaded automatically if your bot does not already have it.

<h3 align="center">Quick Start</h3>

-----

```ts
import { createBot } from "mineflayer";
import autoBuffPlugin, { Results } from "@nxg-org/mineflayer-auto-buff";

const bot = createBot({
  host: "localhost",
  port: 25565,
  username: "buff-bot"
});

bot.loadPlugin(autoBuffPlugin);

bot.once("spawn", async () => {
  const result = await bot.autoBuff.applyEffectsToSelf("strength", "speed");
  console.log("Auto buff result:", Results[result]);
});
```

You can also respond to chat commands like the example in [`examples/basic.ts`](./examples/basic.ts).

<h3 align="center">Usage Notes</h3>

-----

- Effect names should match the plugin's supported effect mapping, such as `strength`, `speed`, `regeneration`, `resistance`, `invisibility`, and `instant health`.
- Splash potions are thrown at the bot's feet; drinkable potions are consumed normally.
- If `alwaysDrink` is `false`, the plugin skips effects the bot already has.
- `applyEffectsToEntity()` currently exists as a placeholder and returns `FAIL`.

<h3 align="center">API and Examples</h3>

-----

| Link | Description |
| --- | --- |
| [API](./docs/API.md) | Full API reference for the plugin, class methods, options, and result codes. |
| [Example](./examples/basic.ts) | A simple example showing chat-driven self-buff usage. |

<h3 align="center">License</h3>

-----

This package is published as `GPL-3.0` in [`package.json`](./package.json).
