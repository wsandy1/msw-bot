const { Events } = require('discord.js');
const config = require('../../config.json');



module.exports = {
	name: Events.GuildMemberAdd,
	once: false,
	async execute(discordclient, db, member) {
        let logchannel;
        await discordclient.channels.fetch(config.discord.logchannel).then(channel => {
            logchannel = channel
        });

        logchannel.send(`**Join:** Member joined <@${member.id}>. Waiting for role choice...`);


        await new Promise(r => setTimeout(r, 180000));

        let roles = member.roles.cache.map(role => role.id)
        let type = 4
        if (roles.includes(config.discord.roles.comrep)) {
            type = 1
            logchannel.send(`**Join:** Adding <@${member.id}> to DB as comp rep`);
        } else {
            type = 4
            logchannel.send(`**Join:** Adding <@${member.id}> to DB as recruit`);
        }

        await db.createUser(member.id, type, Date.now())
	},
};