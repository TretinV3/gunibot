const Discord = require('discord.js');

module.exports.info = {
    name: 'help',
    description: 'pour avoir de l\'aide sur une commande',
    argument: false,
    group: 'bot',
    info: '',
    aliases: ['h', 'aide']
}

module.exports.run = (client, message, args) => {
    if (args.length > 1) return message.reply(`Pourquoi autant d'argument ? Vous pouvez soit ne pas en mettre pour avoir la liste de toutes les commandes ou rajouter le nom de la commande derière pour avoir ses information en particulier. \n Exemple: \`${client.config.prefix}help ping\``)

    const prefix = client.config.prefix;

    if (args) { // display all commands
        const commands = client.commands.filter(c => !c.info.hide);
        const grp = commands.map(c => c.info.group);
        const groups = [...new Set(grp)]

        const embed = new Discord.MessageEmbed()
            .setColor(client.config.color)
            .setTimestamp()
            .setFooter({ text: message.author.tag, iconURL: message.author.avatarURL() })
            .setDescription(
                `Pour lancer une commande, utilisez \`${prefix}command\` ou \`@${client.user.tag} command\`.
                Par exemple, \`${prefix}help\` ou \`@${client.user.tag} help\`.
                Utilisez \`${prefix}help <commande>\` pour voir les informations détaillées de la commande spécifiée.`
            )
        
        for(const group of groups){
            let cmdsgroup = [];
            commands.filter(c => c.info.group == group).forEach(command => {
                cmdsgroup.push(`\`${command.info.name}\` : ${command.info.description}`);
            });
            embed.addField(`• ${group}`, cmdsgroup.join("\n"))
        }

        message.channel.send({ embeds: [embed] })
    } else {

    }


    //message.channel.send("Pong !")
}