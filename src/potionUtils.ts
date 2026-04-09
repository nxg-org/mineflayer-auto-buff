import { Bot } from "mineflayer";
import { Item } from "prismarine-item";

import { effectConversions } from "./AutoBuffTypes";

type PotionDataSource = "component" | "nbt" | "metadata";

export interface StandardizedPotionData {
  potionKey: string | null;
  effectKey: string | null;
  source: PotionDataSource | null;
  isSplash: boolean;
  isLingering: boolean;
}

const legacyPotionEffectNamesByMetadata: Record<number, string> = {
  1: "Regeneration",
  2: "Speed",
  3: "FireResistance",
  4: "Poison",
  5: "InstantHealth",
  6: "NightVision",
  8: "Weakness",
  9: "Strength",
  10: "Slowness",
  11: "JumpBoost",
  12: "InstantDamage",
  13: "WaterBreathing",
  14: "Invisibility",
};

const potionEffectNamesByPotionKey: Record<string, string> = {
  healing: "instant health",
  harming: "instant damage",
  leaping: "jump boost",
  swiftness: "speed",
  turtle_master: "resistance",
};

const legacySplashBit = 0x4000;

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/^minecraft:/, "").replace(/\s+/g, "_");
}

function getLegacyPotionKey(bot: Bot, metadata: number): string | null {
  const effectRegistryName = legacyPotionEffectNamesByMetadata[metadata & 0x0f];
  if (effectRegistryName) {
    const effect = (bot.registry.effectsByName as Record<string, { name?: string; displayName?: string }>)[effectRegistryName];
    const effectName = effect?.displayName ?? effect?.name;
    if (effectName) return getPotionKeyForEffect(effectName);
  }

  const potionNameBits = metadata & 0x3f;
  if (potionNameBits === 0) return metadata === 0 ? "water" : "mundane";
  if (potionNameBits === 16) return "awkward";
  if (potionNameBits === 32) return "thick";

  return null;
}

function getPotionKeyFromNbt(item: Item): string | null {
  const potionValue = (item.nbt?.value as any)?.Potion?.value;
  if (typeof potionValue !== "string") return null;
  return normalizeKey(potionValue);
}

function getPotionKeyFromComponents(item: Item): string | null {
  const componentMap = (item as any).componentMap as Map<string, any> | undefined;
  const potionContents =
    componentMap?.get("potion_contents") ??
    componentMap?.get("minecraft:potion_contents") ??
    null;

  if (!potionContents) return null;

  const data = potionContents.data ?? potionContents.value ?? potionContents;
  if (typeof data?.potion === "string") return normalizeKey(data.potion);
  if (typeof data?.potionId === "string") return normalizeKey(data.potionId);

  return null;
}

export function getPotionKeyForEffect(effect: string): string {
  const normalizedEffect = normalizeKey(effect);
  return effectConversions[normalizedEffect] ?? normalizedEffect;
}

export function getEffectKeyForPotionKey(potionKey: string | null): string | null {
  if (!potionKey) return null;
  return potionEffectNamesByPotionKey[potionKey] ?? potionKey.replace(/_/g, " ");
}

export function getStandardizedPotionData(bot: Bot, item: Item): StandardizedPotionData {
  const isLegacyPotion = !bot.registry.isNewerOrEqualTo("1.9");
  const isSplash = isLegacyPotion ? (item.metadata & legacySplashBit) !== 0 : item.name.includes("splash");
  const isLingering = item.name.includes("lingering");

  const componentPotionKey = getPotionKeyFromComponents(item);
  if (componentPotionKey) {
    return {
      potionKey: componentPotionKey,
      effectKey: getEffectKeyForPotionKey(componentPotionKey),
      source: "component",
      isSplash,
      isLingering,
    };
  }

  const nbtPotionKey = getPotionKeyFromNbt(item);
  if (nbtPotionKey) {
    return {
      potionKey: nbtPotionKey,
      effectKey: getEffectKeyForPotionKey(nbtPotionKey),
      source: "nbt",
      isSplash,
      isLingering,
    };
  }

  if (!bot.registry.isNewerOrEqualTo("1.9")) {
    const metadataPotionKey = getLegacyPotionKey(bot, item.metadata);
    if (metadataPotionKey) {
      return {
        potionKey: metadataPotionKey,
        effectKey: getEffectKeyForPotionKey(metadataPotionKey),
        source: "metadata",
        isSplash,
        isLingering,
      };
    }
  }

  return {
    potionKey: null,
    effectKey: null,
    source: null,
    isSplash,
    isLingering,
  };
}

export function itemMatchesPotionEffect(bot: Bot, item: Item, effect: string): boolean {
  const potionKey = getStandardizedPotionData(bot, item).potionKey;
  return potionKey === getPotionKeyForEffect(effect);
}
