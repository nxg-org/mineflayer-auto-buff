import { Effect as mfEffect } from "mineflayer";

import md, { Effect as mdEffect } from "minecraft-data";

export type mixedEffect = { id: number; name: string; displayName: string; amplifier: number; duration: number; type: "good" | "bad" };
export type mfEffects = { [id: string]: mfEffect };
export type mdEffects = { [id: string]: mdEffect };
export type mixedEffects = { [name: string]: mixedEffect };

export type SortedEffects = { good: mixedEffects; bad: mixedEffects; unknown: mixedEffects };
export interface AutoBuffOptions {
    prioritizeSplash: boolean;
    timeout: number;
    useOffHand: boolean;
    dropBottle: boolean;
    returnToLastItem: boolean;
    effectsToListenFor: string[];
}
