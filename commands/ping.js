module.exports.info = {
    name: 'ping',
    description: 'juste reply pong',
    argument: false,
    group: 'bot',
    info: 'Juste une commande de test mais est-elle indispenssable a la fin ? mais surtout pourquoi juste ping et pas la latence du bot ???'
}

module.exports.run = (client, message) => {
    message.channel.send("Pong !")
}