import {Bot, createBot} from "mineflayer";
import loader from "../src/index"



const bot = createBot({
    host: process.argv[2],
    port: Number(process.argv[3]),
    username: "autobuff-test",
    
})


bot.loadPlugin(loader);

bot.once("spawn", () => {




    bot.on("chat", async (user, message) => {


        const [cmd, ...args] = message.trim().split(' ');


        switch (cmd) {



            case "buff":
                bot.chat(`Result of autobuff is: ${await bot.autoBuff.applyEffectsToSelf("strength", "speed", "regeneration")}`);
                break;
        }
    })
})