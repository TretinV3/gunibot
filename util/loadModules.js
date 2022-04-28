const Discord = require("discord.js");
const fs = require("fs")

module.exports = async (client) => {
    console.log()
    console.log("=== charging modules ===");

    client.modules = new Discord.Collection();

    const files = fs.readdirSync('./modules').filter(file => file.endsWith('.js'));

    let nbFile = 0;
    for (const file of files) {

        console.log(`- charge ${file}`);
        try {
            const module = require(`../modules/${file}`);
            client.modules.set(file, module)
            console.log(`   succes`);
            nbFile++;
        } catch (e) {
            console.log(`   error at ${e.stack.split('\n')[0]}: ${e}`);
        }
    }

    console.log(`charged ${nbFile}/${files.length} modules`)
    console.log()

    //console.log("=== loading modules ===");
    client.modules.forEach((func, name) => {
        try {
            //console.log(`loading ${name}`)
            func(client);
        } catch (e) {
            console.log(`erro while loading ${name}`)
            console.log(`${e.stack.split('\n')[0]}: ${e}`)
        }
    })


    //await module(client);
}