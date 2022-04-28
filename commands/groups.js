const fs = require("fs");
const Discord = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports.info = {
    name: 'groups',
    description: 'Pour gerer les groupes',
    argument: false,
    group: 'modules',
    aliases: ["group", "g"],
    info: 'TO DO',
    slash: new SlashCommandBuilder()
        .setName("groups")
        .setDescription("Pour gerer les groupes")
        .addSubcommand(s =>
            s.setName('create')
                .setDescription('Pour créer un nouveau groupe')
                .addStringOption(o =>
                    o.setName('name')
                        .setDescription('J\'ai pas trouvé de citation classe parlant de donner un nom')
                        .setRequired(true)
                )
                .addBooleanOption(o =>
                    o.setName('private')
                        .setDescription('Par défaut : false')
                )
        )
        .addSubcommand(s =>
            s.setName('help')
                .setDescription('Ze sé pa commant ca marche...')
        )
        .addSubcommand(s =>
            s.setName('list')
                .setDescription('L\'addition s\'il vous plait')
        )
        .addSubcommand(s =>
            s.setName('config')
                .setDescription('Y\'aurai pas un symbole d\'engrenage pls ?')
        )
        .addSubcommand(s =>
            s.setName('admin')
                .setDescription('Je te veux dans mon équipe Pikachu')
                .addUserOption(o =>
                    o.setName('utilisateur')
                        .setDescription('Selectione l\'utilisateur a rajouter ou a enlever d\'un groupe')
                        .setRequired(true)
                )
                .addStringOption(o =>
                    o.setName('group')
                        .setDescription('Choisi le groupe ou rajouter/enlever l\'utilisateur')
                        .setRequired(true)
                )
        )
}

module.exports.run = async (client, interaction) => {

    client.db.get(interaction.guild.id)
    const configGroup = client.db[interaction.guild.id].groups
    switch (interaction.options.getSubcommand()) {
        case "list":
            interaction.reply(getGroupListFormated(client, interaction));
            break;
        case "config":

            const possibleGroups = configGroup.list.filter(g => g.owner == interaction.member.id);

            if (possibleGroups.length == 0) return interaction.reply({ content: `Vous n'avez aucun groupe a configurer !`, ephemeral: true })


            const components = [];
            possibleGroups.forEach(g => {
                components.push(
                    new Discord.MessageButton()
                        .setCustomId(`groups.config.${g.name}.pannel`)
                        .setEmoji(`⚙️`)
                        .setLabel(`${g.name}`)
                        .setStyle('SECONDARY')
                )
            })

            const configGroupListEmbed = new Discord.MessageEmbed()
                .setTitle('Choissez le groupe a configurez :')
                .setDescription(possibleGroups.map(g => `• \`${g.name}\``).join('\n'))
                .setColor(client.config.color)
                .setTimestamp()
                .setAuthor({ name: interaction.member.user.tag, iconURL: interaction.member.user.avatarURL() })

            interaction.reply({ embeds: [configGroupListEmbed], components: [new Discord.MessageActionRow().setComponents(components)] });


            break;
        case "create":

            if(client.cooldownManager.has(interaction.member.user.id, 60*60, 'group.create')) return interaction.reply({content: 'Merci d\'attendre encore ' + client.cooldownManager.has(interaction.member.user.id, 60*60, 'group.create') + 's', ephemeral:true})
            client.cooldownManager.set(interaction.member.user.id, 60*60, 'group.create')


            const gName = interaction.options.getString('name');

            if (gName.split(" ").length > 1) return interaction.reply({ content: 'Merci de ne pas mettre d\'espace (` `) dans le nom du groupe.', ephemeral: true })
            if (gName.split(".").length > 1) return interaction.reply({ content: 'Merci de ne pas mettre de point (`.`) dans le nom du groupe.', ephemeral: true })

            const gPrivate = interaction.options.getBoolean('private') == 1;

            if (configGroup.list.find(g => g.name == gName)) return interaction.reply({ content: 'Ce nom est déjà utilisé, choisis en un autre.', ephemeral: true })

            const gRole = await interaction.guild.roles.create({ name: gName });

            const newGroup = {
                name: gName,
                id: {
                    channel: null,
                    role: gRole.id,
                },
                private: gPrivate,
                owner: interaction.member.id
            }

            client.db[interaction.guild.id].groups.list.push(newGroup);
            client.db.set(interaction.guild.id);

            interaction.member.roles.add(gRole.id);

            const embedCreate = new Discord.MessageEmbed()
                .setTitle(`Nouveau groupe ajouté :`)
                .setColor(client.config.color)
                .setFooter({ text: interaction.member.user.tag, iconURL: interaction.member.user.avatarURL() })
                .setDescription(`**Nom :** ${capitalize(gName)}\n\n**Owner :** ${interaction.member}\n\n**Role :** ${gRole}\n\n**Privé :** ${gPrivate ? `oui` : `non`}\n\n**Salon :** non`)
            interaction.reply({ embeds: [embedCreate] })
            break;
        case "admin":

            if(!interaction.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_MESSAGES) || !interaction.member.roles.cache.has(client.db[interaction.guild.id].staff)) return interaction.reply('Vous n\'avez pas les bonnes permissions');

            const user = interaction.options.getUser('utilisateur')
            const group = configGroup.list.find(g => g.name == interaction.options.getString('group'))

            if (!group) return interaction.reply({ content: 'Le groupe choisi n\'existe pas... faite `/group list` pour voir tous les groupes', ephemeral: true })

            const member = interaction.guild.members.resolve(user);

            let removed;
            if (member.roles.cache.has(group.id.role)) {
                member.roles.remove(group.id.role);
                removed = true;
            } else {
                member.roles.add(group.id.role);
                removed = false;
            }

            const embed = new Discord.MessageEmbed()
                .setTitle("Obligation")
                .setDescription(`Vous venez de forcer ${user} a ${removed ? "quitter" : "rejoindre"} le groupe \`${group.name}\``)
                .setColor(client.config.color)
                .setTimestamp()

            interaction.reply({ embeds: [embed] })

            break;
        default:
            interaction.reply("Pong !\n\nComment ça je me suis trompé de commande !?")
            break;
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports.button = async (client, interaction, args) => {

    if (interaction.message.embeds[0].author.name !== interaction.member.user.tag) return

    client.db.get(interaction.guild.id)
    const configGroup = client.db[interaction.guild.id].groups

    if (!configGroup.list.find(g => g.name == args[2])) return;

    if (args[1] == "join") {
        await interaction.member.roles.add(configGroup.list.find(g => g.name == args[2]).id.role)
        await interaction.message.edit(getGroupListFormated(client, interaction));
        await interaction.reply({ content: `Vous avez rejoind le groupe \`${args[2]}\``, ephemeral: true })

    } else if (args[1] == "leave") {
        await interaction.member.roles.remove(configGroup.list.find(g => g.name == args[2]).id.role)
        await interaction.message.edit(getGroupListFormated(client, interaction));
        await interaction.reply({ content: `Vous avez quitté le groupe \`${args[2]}\``, ephemeral: true })
    } else if (args[1] == "config") {
        //console.log(args)
        const oldConfig = configGroup.list.find(g => g.name === args[2]);

        if (args[3] == "pannel") {
            await interaction.message.edit(getConfigPannelFormated(client, interaction, args[2]));
            await interaction.reply({ content: `Vous pouvez configurez le groupe ${args[2]}`, ephemeral: true });
        } else if (args[3] == "private") {
            client.db[interaction.guild.id].groups.list[client.db[interaction.guild.id].groups.list.indexOf(oldConfig)].private = !oldConfig.private;
            client.db.set(interaction.guild.id);

            await interaction.message.edit(getConfigPannelFormated(client, interaction, args[2]));
            await interaction.reply({ content: `Le groupe ${args[2]} a été rendu ${!oldConfig.private ? 'privé' : 'publique'}`, ephemeral: true });
        } else if (args[3] == "name") {
            await interaction.deferReply();
            const msg = await interaction.channel.send('Envoyez le nouveau nom du groupe :')

            const filter = m => m.member.id == interaction.member.id;
            interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] })
                .then(async collected => {
                    try {
                        const message = collected.first();
                        const oldM = message;
                        message.delete()
                        msg.delete()

                        if (oldM.content.split(" ").length > 1) return interaction.editReply({ content: 'Merci de ne pas mettre d\'espace (` `) dans le nom du groupe.', ephemeral: true })
                        if (oldM.content.split(".").length > 1) return interaction.editReply({ content: 'Merci de ne pas mettre de point (`.`) dans le nom du groupe.', ephemeral: true })

                        if (configGroup.list.find(g => g.name == oldM.content)) return interaction.editReply({ content: 'Ce nom est déjà utilisé, choisis en un autre.', ephemeral: true })

                        client.db[interaction.guild.id].groups.list[client.db[interaction.guild.id].groups.list.indexOf(oldConfig)].name = oldM.content;
                        client.db.set(interaction.guild.id);

                        interaction.guild.roles.cache.find(r => r.id == oldConfig.id.role).edit({ name: oldM.content }, `${interaction.member.tag} request a name change for the group ${oldM.content}`);
                        if(oldConfig.id.channel) interaction.guild.channels.cache.find(c => c.id == oldConfig.id.channel).edit({ name: oldM.content }, `${interaction.member.tag} request a name change for the group ${oldM.content}`);

                        const replyMsg = await interaction.editReply({ content: `Le nom du groupe est maintenant : \`${oldM.content}\``, ephemeral: true })

                        setTimeout(() => replyMsg.delete(), 5000)

                        interaction.message.edit(getConfigPannelFormated(client, interaction, oldM.content));

                    } catch (e) {
                        oldLog(e)
                    }

                })
                .catch(collected => {
                    msg.delete();
                    interaction.editReply({ content: `Action annulé !`, ephemeral: true })
                });
        } else if (args[3] == "channel") {
            if (oldConfig.channel == null) {
                const chan = await client.guilds.cache.find(g => g.id == interaction.guild.id).channels.create(oldConfig.name, {
                    type: 'GUILD_TEXT',
                    topic: 'The channel for the group `' + oldConfig.name + '`',
                    reason: `${interaction.member.user.tag} asked for create a channel for the group ${oldConfig.name}`,
                    parent: client.db[interaction.guild.id].groups.parent,
                    permissionOverwrites: [
                        {
                            id: oldConfig.id.role,
                            allow: [Discord.Permissions.FLAGS.VIEW_CHANNEL],
                        },
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: [Discord.Permissions.FLAGS.VIEW_CHANNEL],
                        },
                    ],
                })

                client.db[interaction.guild.id].groups.list[client.db[interaction.guild.id].groups.list.indexOf(oldConfig)].id.channel = chan.id;
                client.db.set(interaction.guild.id);

                interaction.reply({ content: `Le salon <#${chan.id}> a bien été créé pour le role ${oldConfig.name}`, ephemeral: true });

                interaction.message.edit(getConfigPannelFormated(client, interaction, oldConfig.name));
            }
        } else if (args[3] == "delete") {
            const embed = new Discord.MessageEmbed()
                .setColor('RED')
                .setTimestamp()
                .setAuthor({ name: interaction.member.user.tag, iconURL: interaction.member.user.avatarURL() })
                .setTitle(`⚠️ ATTENTION ⚠️`)
                .setDescription(`Etes-vous sure de vouloir supprimer le groupe \`${oldConfig.name}\` ? \n(merci d'attendre 2s)\n\n*Toute suppression par inadvertance n'engage que vous 😁*`)

            const raw = new Discord.MessageActionRow()
                .addComponents(
                    new Discord.MessageButton()
                        .setCustomId(`groups.pannel.${oldConfig.name}`)
                        .setLabel(`non`)
                        .setStyle('DANGER')
                        .setEmoji('✖️')    //❌')
                        .setDisabled(true)
                ).addComponents(
                    new Discord.MessageButton()
                        .setCustomId(`groups.config.${oldConfig.name}.forcedelete`)
                        .setLabel(`oui`)
                        .setStyle('SUCCESS')
                        .setEmoji('✔️')      //✅')
                        .setDisabled(true)
                )
            interaction.update({ embeds: [embed], components: [raw] });
            setTimeout(() => {
                raw.components.map(c => c.disabled = false);
                //console.info(raw);
                interaction.message.edit({ embeds: [embed], components: [raw] });
            }, 2000);
        }else if(args[3]=="forcedelete"){

            client.db[interaction.guild.id].groups.list.splice(client.db[interaction.guild.id].groups.list.indexOf(oldConfig), 1)
            client.db.set(interaction.guild.id);

            if(oldConfig.id.channel) interaction.guild.channels.cache.find(c=>c.id==oldConfig.id.channel).delete();
            interaction.guild.roles.cache.find(c=>c.id==oldConfig.id.role).delete("The group have been deleted");

            interaction.message.edit({embes: [interaction.message.embeds[0]], components: [interaction.message.components[0].raw.components.map(c => c.disabled = false)]})

            interaction.reply({content: 'Le groupe a été supprimé !'});
        }

    }
}

function getConfigPannelFormated(client, interaction, name, isButton) {

    if (isButton !== false) isButton = true;

    client.db.get(interaction.guild.id)
    const configGroup = client.db[interaction.guild.id].groups
    const oldConfig = configGroup.list.find(g => g.name == name);

    const embed = new Discord.MessageEmbed()
        .setColor(client.config.color)
        .setTimestamp()
        .setAuthor({ name: interaction.member.user.tag, iconURL: interaction.member.user.avatarURL() })
        .setTitle(`Configuration du groupe \`${oldConfig.name}\` :`)
        .setDescription(`**Nom :** ${capitalize(oldConfig.name)}\n\n**Owner :** <@${oldConfig.owner}>\n\n**Role :** <@&${oldConfig.id.role}>\n\n**Privé :** ${oldConfig.private ? `oui 🔐` : `non`}\n\n**Salon :** ${oldConfig.id.channel ? `<#${oldConfig.id.channel}>` : `non`}`)

    const raw = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageButton()
                .setCustomId(`groups.config.${oldConfig.name}.name`)
                .setLabel(`Changer le nom`)
                .setStyle('SECONDARY')
                .setEmoji('📑')
        ).addComponents(
            new Discord.MessageButton()
                .setCustomId(`groups.config.${oldConfig.name}.private`)
                .setLabel(`Rendre ${oldConfig.private ? `publique` : `privé`}`)
                .setStyle(oldConfig.private ? 'SECONDARY' : 'SECONDARY')
                .setEmoji(oldConfig.private ? '🔓' : '🔒')
        )
    const raw2 = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageButton()
                .setCustomId(`groups.config.${oldConfig.name}.channel`)
                .setLabel(`Créer un salon`)
                .setStyle('SUCCESS')
                .setEmoji('🚪')
                .setDisabled(oldConfig.id.channel != null)
        ).addComponents(
            new Discord.MessageButton()
                .setCustomId(`groups.config.${oldConfig.name}.delete`)
                .setLabel(`Supprimer le groupe`)
                .setEmoji('🗑️')
                .setStyle('DANGER')
        )

    return ({ embeds: [embed], components: isButton ? [raw, raw2] : [] });
}

function getGroupListFormated(client, interaction) {

    client.db.get(interaction.guild.id)
    const configGroup = client.db[interaction.guild.id].groups
    let data = [];

    let components = []
    let rowButtonJoin = []

    //console.info(configGroup.list)

    for (let i = 0; i < configGroup.list.length; i++) {
        const g = configGroup.list[i];

        data.push(`• \`${g.name}\` ${g.private ? "🔐" : ""}`);
        const isInGroup = interaction.member.roles.cache.has(g.id.role);
        components.push(
            new Discord.MessageButton()
                .setCustomId(`groups.${isInGroup ? `leave` : `join`}.${g.name}`)
                .setEmoji(`${isInGroup ? `📤` : `${g.private ? `🔒` : `📥`}`}`)
                .setDisabled(!isInGroup && g.private)
                .setLabel(`${g.name}`)
                .setStyle('SECONDARY')
        )

        if ((i + 1 % 5) == 0) {
            rowButtonJoin.push(
                new Discord.MessageActionRow()
                    .setComponents(components)
            )
            components = []
        }
    }

    if (components.length !== 0) rowButtonJoin.push(
        new Discord.MessageActionRow()
            .setComponents(components)
    );

    const embedList = new Discord.MessageEmbed()
        .setTitle("Liste des differents groupes :")
        .setAuthor({ name: interaction.member.user.tag, iconURL: interaction.member.user.avatarURL() })
        .setColor(client.config.color)
        .setTimestamp()
        .setDescription(
            `${data.join('\n')}`
        )
    rowButtonJoin.reverse()
    rowButtonJoin.slice(0, 5);
    //console.info(rowButtonJoin);
    return ({ embeds: [embedList], components: rowButtonJoin });
}