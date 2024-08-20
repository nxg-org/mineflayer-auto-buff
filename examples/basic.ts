import {Bot, createBot} from "mineflayer";
import loader, {Results} from "../src/index"



const bot = createBot({
    host: process.argv[2],
    port: Number(process.argv[3]),
    username: "autobuff_test",
    version: process.argv[4]
    
})


bot.loadPlugin(loader);


bot.on("chat", async (user, message) => {

    const [cmd, ...args] = message.trim().split(' ');

    switch (cmd) {
        case "buff":
            const res = await bot.autoBuff.applyEffectsToSelf(...args)
            bot.chat(`Result of autobuff is: ${Results[res]}`);
            break;

        case "buffme":
            const target = bot.nearestEntity(e => e.type === "player" && e.username === user);
            if (!target) {
                bot.chat("No player found");
                return;
            }

            const res2 = await bot.autoBuff.applyEffectsToEntity(target, ...args)
    }
})


bot.once("spawn", async () => {

    await bot.waitForTicks(20);


    // bot.chat("/register rocky1928 rocky1928")

})