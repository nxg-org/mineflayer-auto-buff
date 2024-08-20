import { Bot, Effect as mfEffect } from "mineflayer";
import md, { Effect as mdEffect } from "minecraft-data";
import { Item } from "prismarine-item";
import { Entity } from "prismarine-entity";
import { performance } from "perf_hooks";
import { timeStamp } from "console";
import { promisify } from "util";

import { AutoBuffOptions, SortedEffects, mdEffects, mixedEffect, mixedEffects, mfEffects } from "./AutoBuffOptions";
import { Results, effectConversions } from "./AutoBuffTypes";

const sleep = promisify(setTimeout);

//{id: number, amplifier: number, duration: number}

//for now, this will rely on minecrafthawkeye

export class AutoBuff {
  public canceled: boolean = false;
  private lastEnabled: number = performance.now();

  private effects;
  private effectsByName;
  public botEffects: mfEffects;
  public prioritizeSplash: boolean;
  public timeout: number = 3000;
  private useOffHand: boolean = true;
  private dropBottle: boolean = true;
  private alwaysDrink: boolean = false;
  public isDrinking: boolean = false;
  private _packetDrinking: boolean = false;
  private returnToLastItem: boolean;
  private lastItem: Item | null = null;
  private effectsToListenFor: string[];

  constructor(public bot: Bot, options: Partial<AutoBuffOptions> = {}) {
    this.prioritizeSplash = options.prioritizeSplash ?? false;
    this.timeout = options.timeout ?? 3000;
    this.useOffHand = options.useOffHand ?? false;
    this.returnToLastItem = options.returnToLastItem ?? false;
    this.dropBottle = options.dropBottle ?? true;
    this.alwaysDrink = options.alwaysDrink ?? false;
    this.effectsToListenFor = options.effectsToListenFor ?? [];

    this.effects = md(bot.version).effects;
    this.effectsByName = md(bot.version).effectsByName;
    this.botEffects = {};
    this.bot.once("spawn", () => {
      this.botEffects = this.bot.entity.effects as any;
    });

    this.bot._client.on("entity_status", (packet: any) => {
      if (packet.entityId === this.bot.entity.id && packet.entityStatus === 9 && this._packetDrinking) {
        this._packetDrinking = false;
      }
    });
    this.bot.on("entityEffectEnd", async (entity: Entity, effect: mfEffect) => {
      if (entity !== this.bot.entity || !this.effectsToListenFor.includes(this.effects[effect.id].name.toLowerCase()))
        return;
      await this.applyEffectsToSelf(this.effects[effect.id].name);
    });
  }

  setEffectsToListenFor(...effects: string[]) {
    this.effectsToListenFor = effects;
  }

  setHand(offHand: boolean = false) {
    this.useOffHand = offHand;
  }

  getHand(offHand?: boolean) {
    return offHand ? (offHand ? "off-hand" : "hand") : this.useOffHand ? "off-hand" : "hand";
  }

  getHandWithItem() {
    return this.bot.inventory.slots[this.bot.getEquipmentDestSlot(this.getHand())];
  }

  display(): void {
    // console.log(this.findEffectItems("strength"));
    console.log(this.sortBuffs(this.bot.entity.effects));
  }

  /**
   * For the time being, Effect[] != Effects. I cannot overwrite this.
   * Mineflayer screwed up the typings here.
   * @param buffs
   * @returns
   */
  sortBuffs(buffs: mfEffect[]): SortedEffects | null {
    if (Object.keys(buffs).length !== 0) {
      const goodBuffs: mixedEffects = {};
      const badBuffs: mixedEffects = {};
      const unknown: mixedEffects = {};
      Object.values(buffs).forEach((buff) => {
        const newBuff = this.effects[buff.id];
        switch (newBuff.type) {
          case "good":
            goodBuffs[buff.id] = { ...newBuff, ...buff };
            break;
          case "bad":
            badBuffs[buff.id] = { ...newBuff, ...buff };
            break;
          default:
            unknown[buff.id] = { ...newBuff, ...buff };
            break;
        }
      });

      return { good: goodBuffs, bad: badBuffs, unknown: unknown };
    }
    return null;
  }

  getCurrentBuffs(): mixedEffects | null {
    return this.sortBuffs(this.bot.entity.effects)?.good ?? null;
  }

  getCurrentDebuffs(): mixedEffects | null {
    return this.sortBuffs(this.bot.entity.effects)?.bad ?? null;
  }

  getAllEffects(): mixedEffects | null {
    const allEffects = this.sortBuffs(this.bot.entity.effects);
    if (allEffects) return { ...allEffects.good, ...allEffects.bad, ...allEffects.unknown };
    return null;
  }

  getCurrentBuffsAsStrings(): string[] | null {
    const effects = this.getCurrentBuffs();
    if (effects === null) {
      return effects;
    }

    return Object.values(effects).map((val) => val.name.toLowerCase());
  }

  hasBuff(name: string): boolean {
    return !!this.getCurrentBuffsAsStrings()?.find((n) => n.includes(name.toLowerCase()));
  }

  hasItemForBuff(effect: string, splash = true): boolean {
    return (this.findEffectItems(effect, splash)?.length ?? 0) > 0;
  }

  findEffectApplyingItems(type: "good" | "bad" | "all", splash: boolean = true) {
    let effects: mdEffect[];
    if (type !== "all") {
      effects = Object.values(this.effectsByName).filter((val) => val.type === type);
    } else {
      effects = Object.values(this.effectsByName);
    }
    let items: Item[];
    if (splash) {
      items = this.bot.inventory.items().filter((item) => item.name.includes("potion")); //.filter(item => buffs.some(buff => item.name.toLowerCase().includes("potion")))
    } else {
      items = this.bot.inventory
        .items()
        .filter((item) => !item.name.includes("splash") && item.name.toLowerCase().includes("potion"));
    }

    let binded: { [effectName: string]: Item[] } = {};

    for (const effect of effects) {
      binded[effect.name.toLowerCase()] = items.filter((item) =>
        (item.nbt?.value as any).Potion.value.includes(effectConversions[effect.name.toLowerCase()])
      );
    }

    return binded;
  }

  findBuffingItems(splash: boolean = true): Item[] | null {
    return Object.values(this.findEffectApplyingItems("good", splash)).flat(1);
  }

  findDebuffingItems(splash: boolean = true): Item[] | null {
    return Object.values(this.findEffectApplyingItems("bad", splash)).flat(1);
  }

  findAllEffectItems(splash: boolean = true): Item[] {
    return Object.values(this.findEffectApplyingItems("all", splash)).flat(1);
  }

  findEffectItems(effect: string, splash = true): Item[] {
    const effectItems = this.findEffectApplyingItems("all", splash)[effect.toLowerCase()];
    return (
      effectItems?.filter((item) =>
        (item.nbt?.value as any).Potion.value.includes(effectConversions[effect.toLowerCase()])
      ) ?? []
    );
  }

  /**
   * Blocks until we have finished drinking the potion, or have been interrupted.
   */
  async waitUntilFinishedDrinking() {
    const time = performance.now();
    while (performance.now() - time < this.timeout) {
      if (!this._packetDrinking) break;
      await sleep(50);
    }
  }

  /**
   *
   * @deprecated No point in using this, just use applyEffectsToSelf.
   * 
   * @param effects
   * @returns {Results}
   */
  async applyEffectToSelf(effect: string): Promise<Results> {
    if (this._packetDrinking) {
      return Results.BUSY;
    }
    if (this.canceled) {
      return Results.CANCELLED;
    }
    if (!this.alwaysDrink && this.getCurrentBuffsAsStrings()?.includes(effect)) {
      return Results.ALREADY_BUFFED;
    }

    const orgItem = this.getHandWithItem();

    if (!["bottle", "potion"].some((name) => orgItem?.name.includes(name))) this.lastItem = orgItem;

    const hand = this.getHand();

    const items = this.findEffectItems(effect);
    if (items && items.length !== 0) {
      this.isDrinking = true;
      this._packetDrinking = true;
      await this.bot.util.inv.customEquip(items[0], hand);
      if (items[0].name.includes("splash")) {
        await this.bot.lookAt(this.bot.entity.position, true);
        await sleep(50);
        this.bot.activateItem(this.useOffHand);
        this._packetDrinking = false;
      } else {
        this.bot.deactivateItem();
        this.bot.activateItem(this.useOffHand);
        await this.waitUntilFinishedDrinking();
      }
    } else {
      return Results.FAIL;
    }

    if (this.dropBottle) {
        const item = this.getHandWithItem()
        if (item?.name.includes("bottle")) {
            await this.bot.tossStack(item)
        }
    }

    if (this.returnToLastItem) {
      const copyItem = this.bot.inventory.items().find((item) => item?.name === this.lastItem?.name);
      if (copyItem) {
        await this.bot.equip(copyItem, hand);
      }
    }
    this.isDrinking = false;
    return Results.SUCCESS;
  }

  async applyEffectsToSelf(...effects: string[]): Promise<Results> {
    if (this._packetDrinking) {
      return Results.BUSY;
    }
    if (this.canceled) {
      return Results.CANCELLED;
    }
    const orgItem = this.getHandWithItem();

    if (effects.length === 0) {
      const foundEffects = this.sortBuffs(this.effectsByName as any)?.good;
      if (foundEffects) {
        effects = Object.values(foundEffects).map((effect) => effect.name);
      } else {
        return Results.SUCCESS;
      }
    }

    

    if (!["bottle", "potion"].some((name) => orgItem?.name.includes(name))) this.lastItem = orgItem;

    const hand = this.getHand();
    let completed = 0;
    this.isDrinking = true;
    for (const effect of effects) {

      // check if we already have effect
      if (!this.alwaysDrink && this.getCurrentBuffsAsStrings()?.includes(effect)) {
        completed++;
        continue;
      }

      const items = this.findEffectItems(effect);
      if (items && items.length !== 0) {
        this._packetDrinking = true;
        await this.bot.util.inv.customEquip(items[0], hand);
        if (items[0].name.includes("splash")) {
          await this.bot.lookAt(this.bot.entity.position, true);
          await sleep(50);
          this.bot.activateItem(this.useOffHand);
          this._packetDrinking = false;
        } else {
          this.bot.deactivateItem();
          this.bot.activateItem(this.useOffHand);
          await this.waitUntilFinishedDrinking();

          if (this.dropBottle) {
            const item = this.getHandWithItem()
            if (item?.name.includes("bottle")) {
                await this.bot.tossStack(item)
            }
        }

        }
        completed++;
      }
    }

    if (this.returnToLastItem) {
      const copyItem = this.bot.inventory.items().find((item) => item?.name === this.lastItem?.name);
      if (copyItem) {
        await this.bot.equip(copyItem, hand);
      }
    }
    this.isDrinking = false;
    if (completed === 0) return Results.FAIL;
    else if (completed < effects.length) return Results.PARTIAL;
    else return Results.SUCCESS;
  }

  applyEffectsToEntity(entity: Entity, ...effects: string[]): Results {
    // TODO: implement staticShot to calculate a trajectory to hit the other entity.
    return Results.FAIL;
  }

  async cancelDrinking(): Promise<boolean> {
    if (!this.isDrinking) return false;
    this.canceled = true;
    this.isDrinking = false;
    this._packetDrinking = false;

    return true;
  }
}
