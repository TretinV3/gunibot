const Discord = require("discord.js")

module.exports = (client) => {
    client.cooldownManager = {};
    const { cooldowns } = client;

    client.cooldownManager.has = (user, amount, cmd) => {
        if (!cooldowns.has(cmd)) {
            cooldowns.set(cmd, new Discord.Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(cmd);
        const cooldownAmount = amount * 1000;

        if (timestamps.has(user)) {
            const expirationTime = timestamps.get(user) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return timeLeft;
            }
        }

        return false;
    }

    client.cooldownManager.set = (user, amount, cmd) => {
        const now = Date.now();
        const timestamps = cooldowns.get(cmd);
        const cooldownAmount = amount * 1000;

        timestamps.set(user, now);
        setTimeout(() => timestamps.delete(user), cooldownAmount);
    }

}