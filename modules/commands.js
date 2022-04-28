const fs = require("fs")
const Discord = require("discord.js")
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = async (client) => {
    client.commands = new Discord.Collection();
    client.cooldowns = new Discord.Collection();

    console.log("===  loading commands ===")

    const slashCommandsList = []

    const files = fs.readdirSync("./commands").filter(file => file.endsWith('.js'));
    for (const file of files) {
        console.log(`- load ${file}`);

        try {
            const command = require(`../commands/${file}`);
            command.info.file = file;
            if (command.info.slash) {
                slashCommandsList.push(command.info.slash.toJSON());
                command.info.isSlash = true
            }
            if(command.button){
                client.on('interactionCreate', i => {
                    if(!i.isButton()) return;
                    if(!i.customId.startsWith(command.info.name)) return;
                    command.button(client, i, i.customId.split('.'))
                })
            }
            client.commands.set(command.info.name, command)
            console.log('   succes')

        } catch (e) {
            console.log(`   error at ${e.stack.split('\n')[0]}: ${e}`);
        }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN_BOT);

    client.guilds.cache.forEach(guild => {
        rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id), { body: slashCommandsList })
            .then(() => console.log('Successfully registered application commands.'))
            .catch(console.error);
    });


    client.on("messageCreate", message => {
        if (message.author.bot) return;

        const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(client.config.prefix)})\\s*`);
        if (!prefixRegex.test(message.content)) return;

        const [, matchedPrefix] = message.content.match(prefixRegex);
        const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName)
            || client.commands.find(cmd => cmd.info.aliases && cmd.info.aliases.includes(commandName));

        if (!command) return;

        if (command.info.isSlash) return message.reply(`Merci d'utiliser cette commande en slash commande ! (\`/${command.info.name}\`)`)

        if (command.info.args && !args.length) {
            return message.reply(`Merci de mettre des argument a la commande : \`${client.config.prefix}${command.info.name} ${command.info.usage}\``);
        }



        const { cooldowns } = client;

        if (!cooldowns.has(command.info.name)) {
            cooldowns.set(command.info.name, new Discord.Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.info.name);
        const cooldownAmount = (command.info.cooldown || 3) * 1000;

        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.info.name}\` command.`);
            }
        }
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        try {
            command.run(client, message, args)
        } catch (e) {
            message.channel.send(`Erreur en executant cette commande : ${e}`);
        }
    });

    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;

        const { commandName } = interaction;

        const command = client.commands.get(commandName);

        if(!command) return interaction.reply('Je ne connais pas cette commande... c\'est une diablerie ! au buché !')

        const { cooldowns } = client;

        if (!cooldowns.has(command.info.name)) {
            cooldowns.set(command.info.name, new Discord.Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.info.name);
        const cooldownAmount = (command.info.cooldown || 3) * 1000;

        if (timestamps.has(interaction.member.id)) {
            const expirationTime = timestamps.get(interaction.member.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return interaction.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.info.name}\` command.`);
            }
        }
        timestamps.set(interaction.member.id, now);
        setTimeout(() => timestamps.delete(interaction.member.id), cooldownAmount);

        try {
            command.run(client, interaction)
        } catch (e) {
            interaction.reply(`Erreur en executant cette commande : ${e}`);
        }
    });
}