const fs = require("fs")

module.exports.info = {
    name: 'reload',
    description: '',
    argument: true,
    usage: '<command>',
    group: 'bot',
    hide: true,
    info: '',
    aliases: []
}

module.exports.run = (client, message, args) => {
    if(args.length > 1) return message.reply('Merci de ne mettre qu\'un seul argument !')

    
    const command = client.commands.get(args[0])
            || client.commands.find(cmd => cmd.info.aliases && cmd.info.aliases.includes(args[0]));
    
    if(!command) return message.reply("La commande est introuvable !")

    try {
        delete require.cache[require.resolve(`./${command.info.file}`)]
        const cmd = require(`./${command.info.file}`);
        cmd.info.file = command.info.file;
        client.commands.set(cmd.info.name, cmd);
        
        message.channel.send(`La commande ${cmd.info.name} a été rechargé !`)
    } catch (e) {
        message.channel.send(`Erreur en rechargeant ${command.info.name} : ${e}`);
    }


}