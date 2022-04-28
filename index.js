const Discord = require("discord.js")
const fs = require("fs")

const client = new Discord.Client({ intents: 32767 });

require('dotenv').config()
require('./util/log.js')();
require('./util/db.js')(client);
client.config = require('./config.json')



client.once('ready', () => {
	console.log(`Bot connecté en tant que ${client.user.tag} (${client.user.id})`);

    require('./util/loadModules.js')(client);

    require('./util/cooldown.js')(client);
});

client.login(process.env.TOKEN_BOT);
