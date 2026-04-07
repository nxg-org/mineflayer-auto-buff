# API

This page documents the public surface currently exposed by `@nxg-org/mineflayer-auto-buff`.

## Installation

```bash
npm install @nxg-org/mineflayer-auto-buff
```

## Plugin Setup

```ts
import { createBot } from "mineflayer";
import autoBuffPlugin from "@nxg-org/mineflayer-auto-buff";

const bot = createBot({
  host: "localhost",
  username: "buff-bot"
});

bot.loadPlugin(autoBuffPlugin);

bot.autoBuff.applyEffectsToSelf("strength");
```

When the plugin loads, it augments the Mineflayer `Bot` type with:

```ts
bot.autoBuff: AutoBuff
```

If `bot.util` is missing, the plugin automatically loads `@nxg-org/mineflayer-util-plugin`.

## Exports

### Default Export

```ts
import autoBuffPlugin from "@nxg-org/mineflayer-auto-buff";
```

Mineflayer plugin loader function that attaches `bot.autoBuff`.

### Named Exports

```ts
import { AutoBuff, Results } from "@nxg-org/mineflayer-auto-buff";
```

- `AutoBuff`: main class instance attached to the bot
- `Results`: enum-like result codes returned by action methods

## `Results`

```ts
enum Results {
  SUCCESS = 0,
  PARTIAL = 1,
  FAIL = 2,
  BUSY = 3,
  CANCELLED = 4,
  ALREADY_BUFFED = 5
}
```

### Meanings

- `SUCCESS`: every requested effect was applied
- `PARTIAL`: at least one effect was applied, but not all requested effects were found or used
- `FAIL`: nothing could be applied
- `BUSY`: the bot is already drinking or otherwise mid-application
- `CANCELLED`: the buff action was cancelled
- `ALREADY_BUFFED`: returned by `applyEffectToSelf()` when the bot already has that effect and `alwaysDrink` is `false`

## `AutoBuffOptions`

You can construct the class manually with partial options, although most users will access it through `bot.autoBuff`.

```ts
interface AutoBuffOptions {
  prioritizeSplash: boolean;
  timeout: number;
  useOffHand: boolean;
  dropBottle: boolean;
  alwaysDrink: boolean;
  returnToLastItem: boolean;
  effectsToListenFor: string[];
}
```

### Defaults

```ts
{
  prioritizeSplash: false,
  timeout: 3000,
  useOffHand: false,
  dropBottle: true,
  alwaysDrink: false,
  returnToLastItem: false,
  effectsToListenFor: []
}
```

### Option Notes

- `prioritizeSplash`: present on the class, but not currently used in item-selection logic
- `timeout`: max time in milliseconds to wait for potion drinking to finish
- `useOffHand`: whether the plugin should use the off-hand when activating potions
- `dropBottle`: toss empty bottles after drinking normal potions
- `alwaysDrink`: re-apply effects even if the bot already has them
- `returnToLastItem`: try to re-equip the item held before buffing started
- `effectsToListenFor`: effect names that should be automatically re-applied when they end

## `AutoBuff` Class

## Properties

### `canceled: boolean`

Set to `true` when buffing has been cancelled.

### `botEffects`

Cached reference to the bot's active Mineflayer effects after spawn.

### `prioritizeSplash: boolean`

Stored option value.

### `timeout: number`

Stored option value in milliseconds.

### `isDrinking: boolean`

Whether the plugin is currently applying a potion.

## Methods

### `setEffectsToListenFor(...effects: string[]): void`

Replaces the internal auto-listen list used by the `entityEffectEnd` hook.

```ts
bot.autoBuff.setEffectsToListenFor("strength", "speed");
```

### `setHand(offHand = false): void`

Switches potion usage between main hand and off-hand.

```ts
bot.autoBuff.setHand(true);
```

### `getHand(offHand?: boolean): "hand" | "off-hand"`

Returns the effective hand string used for equipping.

### `getHandWithItem(): Item | null | undefined`

Returns the current item in the active equipment slot.

### `display(): void`

Debug helper that logs sorted effects to the console.

### `sortBuffs(buffs: mfEffect[]): SortedEffects | null`

Converts raw Mineflayer effects into grouped `good`, `bad`, and `unknown` maps.

### `getCurrentBuffs(): mixedEffects | null`

Returns only positive effects currently active on the bot.

### `getCurrentDebuffs(): mixedEffects | null`

Returns only negative effects currently active on the bot.

### `getAllEffects(): mixedEffects | null`

Returns all active effects merged into one object.

### `getCurrentBuffsAsStrings(): string[] | null`

Returns current positive effect names in lowercase.

### `hasBuff(name: string): boolean`

Checks whether the bot currently has a matching positive effect.

```ts
if (!bot.autoBuff.hasBuff("strength")) {
  await bot.autoBuff.applyEffectsToSelf("strength");
}
```

### `hasItemForBuff(effect: string, splash = true): boolean`

Returns whether the inventory contains a potion for the named effect.

### `findEffectApplyingItems(type: "good" | "bad" | "all", splash = true): Record<string, Item[]>`

Builds an effect-to-items map from the bot inventory.

### `findBuffingItems(splash = true): Item[] | null`

Returns all positive-effect potion items found in inventory.

### `findDebuffingItems(splash = true): Item[] | null`

Returns all negative-effect potion items found in inventory.

### `findAllEffectItems(splash = true): Item[]`

Returns all potion items recognized by the plugin.

### `findEffectItems(effect: string, splash = true): Item[]`

Returns matching potion items for a specific effect name.

Supported mappings currently include:

- `strength`
- `speed`
- `regeneration`
- `resistance`
- `invisibility`
- `instant health`
- `instant_health`
- `instanthealth`

### `waitUntilFinishedDrinking(): Promise<void>`

Blocks until the drinking packet flow finishes or the configured timeout is reached.

### `applyEffectToSelf(effect: string): Promise<Results>`

Deprecated single-effect helper. Prefer `applyEffectsToSelf()`.

Behavior:

- returns `BUSY` if another potion action is running
- returns `CANCELLED` if the class has been cancelled
- returns `ALREADY_BUFFED` if the effect is already active and `alwaysDrink` is `false`
- returns `FAIL` if no matching potion item is found

### `applyItemToSelf(item: Item): Promise<Results>`

Applies a specific potion item directly instead of looking it up by effect name.

This is useful when you already selected the exact inventory item you want to consume or throw.

```ts
const potion = bot.inventory.items().find((item) => item.name.includes("swiftness"));
if (potion) {
  await bot.autoBuff.applyItemToSelf(potion);
}
```

### `applyEffectsToSelf(...effects: string[]): Promise<Results>`

Primary method for self-buffing.

```ts
await bot.autoBuff.applyEffectsToSelf("strength", "speed", "regeneration");
```

Behavior:

- skips already-active buffs unless `alwaysDrink` is `true`
- equips the first matching potion item per effect
- throws splash potions at the bot's feet
- drinks regular potions and optionally drops the empty bottle
- optionally restores the previously held item

If called without arguments, it attempts to iterate over all known positive effects, then applies whichever matching potion items are available in inventory.

Return values:

- `SUCCESS` if all requested effects were applied
- `PARTIAL` if some were applied
- `FAIL` if none were applied
- `BUSY` or `CANCELLED` when those states apply before execution starts

### `applyEffectsToEntity(entity: Entity, ...effects: string[]): Results`

Placeholder method. It currently returns `FAIL` and does not buff other entities yet.

### `cancelDrinking(): Promise<boolean>`

Cancels the current potion action if one is active.

Returns `true` when something was cancelled and `false` otherwise.

## Auto Re-Apply on Effect End

The class listens to Mineflayer's `entityEffectEnd` event for the bot entity. If the ended effect name matches one of `effectsToListenFor`, it automatically calls:

```ts
bot.autoBuff.applyEffectsToSelf(effectName);
```

Example:

```ts
bot.autoBuff.setEffectsToListenFor("strength", "speed");
```

## Caveats

- Effect-to-potion matching depends on the plugin's internal conversion map, not every possible potion naming edge case
- `prioritizeSplash` exists in options, but is not currently used during item selection
- Entity-target buffing is not implemented yet
- Successful item restore depends on finding another inventory item with the same name as the previously held item
