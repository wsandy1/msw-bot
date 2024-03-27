const { Events } = require('discord.js');
const config = require('../../config.json');



module.exports = {
	name: Events.GuildMemberRemove,
	once: false,
	async execute(discordclient, db, member) {
        let logchannel;
        await discordclient.channels.fetch(config.discord.logchannel).then(channel => {
            logchannel = channel
        });

        logchannel.send(`**Join:** Member left <@${member.id}>. Removing from database.`);

        await db.deleteUser(member.id)
	},
};