import { Bot } from "mineflayer";
import { AutoBuff } from "./AutoBuff";
import utilPlugin from "@nxg-org/mineflayer-util-plugin"

declare module "mineflayer" {
    interface Bot {
        autoBuff: AutoBuff,
    }
}


// declare module "prismarine-entity" {
//     interface Entity {
//         // effects: {[id: string]: {id: number, amplifier: number, duration: number}}
//     }
// }

export default function plugin(bot: Bot) {
    if (!bot.util) bot.loadPlugin(utilPlugin)
    bot.autoBuff = new AutoBuff(bot)

}