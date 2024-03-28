const Database = require("./Database.js")
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config.json')
const { Client, Collection, Events, GatewayIntentBits, time, ActivityType } = require('discord.js');
const { CronJob } = require('cron')

const db = new Database(config.db)
db.init()
const discordclient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
const persistents = {} // for saving discord related objects which will be repeatedly accessed
discordclient.commands = new Collection();



// START COMMAND HANDLER

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			discordclient.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

discordclient.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction, db, discordclient);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// END COMMAND HANDLER

// START EVENT HANDLER

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		discordclient.once(event.name, (...args) => event.execute(discordclient, db, ...args));
	} else {
		discordclient.on(event.name, (...args) => event.execute(discordclient, db, ...args));
	}
}

// END EVENT HANDLER

discordclient.once(Events.ClientReady, async readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	discordclient.user.setActivity('Hell Let Loose', {type: ActivityType.Playing})

    //populate database
    persistents.guild = await discordclient.guilds.fetch("1156351314998087750")
	persistents.logchannel = await persistents.guild.channels.fetch(config.discord.logchannel)

    let members = await persistents.guild.members.fetch()
    members.forEach(async member => {
        let roles = member.roles.cache.map(role => role.id)
        let type = 4
        if (roles.includes(config.discord.roles.conglomerate) && !member.user.bot) {
            type = 0
			await db.createUser(member.id, type, member.joinedTimestamp)
        } else if (member.roles.highest.id == config.discord.roles.comrep && !member.user.bot) {
            type = 1
			await db.createUser(member.id, type, member.joinedTimestamp)
        } else if (member.roles.highest.id == config.discord.roles.comp && !member.user.bot) {
            type = 2
			await db.createUser(member.id, type, member.joinedTimestamp)
        } else if (member.roles.highest.id == config.discord.roles.member && !member.user.bot) {
            type = 3
			await db.createUser(member.id, type, member.joinedTimestamp)
        } else if (member.roles.highest.id == config.discord.roles.recruit && !member.user.bot) {
            type = 4
			await db.createUser(member.id, type, member.joinedTimestamp)
        } 
    })
});

const prune = CronJob.from({
	cronTime: '0 0 0 * * *',
	onTick: async function () {
		let members
		await db.getAll().then(m => {
			members = m
		})

		members.forEach(async m => {
			if (!await db.checkLeave(m.id)) {
				if (m.userType == 4) {
					if ((Date.now() - m.joined) >= 5*7*24*60*60*1000 && (Date.now() - m.joined) < 6*24*60*60*1000) {
						if (!await db.isFirstWarned(m.id)) {
							// discordclient.users.send(m.discordId, `
							// **__Ministry of Silly Warfare Activity Notice__**
							// \n
							// \n
							// Dear <@${m.id}>,
							// \n
							// \n
							// We have noticed that you hold "Recruit" status in MsW. Please be aware that **you will be removed from the server on** ${time(m.lastPlayed + 7*24*60*60*1000, 'd')}** unless you obtain "Member" status by then. To do so you need to join us for a game and speak to a Moderator.
							// \n
							// \n
							// We hope you understand.
							// \n\n
							// *If you notice an issue with this message, please message <@744626724641177630>* 
							// `)
							// persistents.logchannel.send(`**Activity:** Recruit <@<@${m.discordId}>> has been on the server for 5 weeks, and has been automatically messaged with a 1 week warning.`)
							db.firstWarn(m.id)
							persistents.logchannel.send(`**Activity:** Recruit <@<@${m.discordId}>> has been on the server for 5 weeks, message them with 1 week warning`)
						}
					} else if ((Date.now() - m.joined) >= 6*7*24*60*60*1000) {
						// discordclient.users.send(m.discordId, `
						// **__Ministry of Silly Warfare Activity Notice__**
						// \n
						// \n
						// Dear <@${m.id}>,
						// \n
						// \n
						// As per the above message, you have been removed from MsW. Feel free to rejoin should you wish to play with us again! https://discord.gg/4ftzNafB8M
						// \n
						// \n
						// Good luck out there, soldier.
						// \n\n
						// *If you notice an issue with this message, please message <@744626724641177630>*
						// `)
						// persistents.logchannel.send(`**Activity:** Recruit <@<@${m.discordId}>> has been kicked for inactivity.`)
						// await persistents.guild.members.fetch(m.discordId).then(memb => {
						// 	memb.kick();
						// })
						persistents.logchannel.send(`**Activity:** Recruit <@<@${m.discordId}>> needs to be kicked for inactivity.`)
					}
				} else if (m.userType == 3) {
					if ((Date.now() - m.lastPlayed) >= 8*7*24*60*60*1000 && (Date.now() - m.lastPlayed) < 11*24*60*60*1000) {
						if (!await db.isFirstWarned(m.id)) {
							// discordclient.users.send(m.discordId, `
							// **__Ministry of Silly Warfare Activity Notice__**
							// \n
							// \n
							// Dear <@${m.id}>,
							// \n
							// \n
							// We have noticed that you have been inactive for a while in MsW. We operate an activity policy in order to keep the server well-pruned, so please be aware that **you will be removed from the server on** ${time(m.lastPlayed + 4*7*24*60*60*1000, 'd')}** unless we see you in-game by then. Note that you can register leave by using the **/leave** command in the server, should you be away for an extended period of time.
							// \n
							// \n
							// We hope you understand.
							// \n
							// \n
							// *If you notice an issue with this message, please message <@744626724641177630>*
							// `)
							// persistents.logchannel.send(`**Activity:** Member <@<@${m.discordId}>> has been inactive for 8 weeks, and has been automatically messaged with a 1 month warning.`)
							db.firstWarn(m.id)
							persistents.logchannel.send(`**Activity:** Member <@<@${m.discordId}>> has been inactive for 8 weeks, and has been automaticallythey need to be messaged with a 1 month warning.`)
						}	
					} else if ((Date.now() - m.lastPlayed) >= 11*7*24*60*60*1000 && (Date.now() - m.lastPlayed) < 12*24*60*60*1000) {
						if (!await db.isSecondWarned(m.id)) {
							// discordclient.users.send(m.discordId, `
							// **__Ministry of Silly Warfare Activity Notice__**
							// \n
							// \n
							// Dear <@${m.id}>,
							// \n
							// \n
							// We have noticed that you have been inactive for a while in MsW. We operate an activity policy in order to keep the server well-pruned, so please be aware that **you will be removed from the server on** ${time(m.lastPlayed + 7*24*60*60*1000, 'd')}** unless we see you in-game by then. Note that you can register leave by using the **/leave** command in the server, should you be away for an extended period of time.
							// \n
							// \n
							// We hope you understand.
							// \n
							// \n
							// *If you notice an issue with this message, please message <@744626724641177630>*
							// `)
							// persistents.logchannel.send(`**Activity:** Member <@<@${m.discordId}>> has been inactive for 11 weeks, and has been automatically messaged with a 1 week warning.`)
							db.secondWarn(m.id)
							persistents.logchannel.send(`**Activity:** Member <@<@${m.discordId}>> has been inactive for 11 weeks, needs to be messaged with a 1 week warning.`)
						}
					} else if ((Date.now() - m.lastPlayed) >= 6*7*24*60*60*1000) {
						// discordclient.users.send(m.discordId, `
						// **__Ministry of Silly Warfare Activity Notice__**
						// \n
						// \n
						// Dear <@${m.id}>,
						// \n
						// \n
						// As per the above message, you have been removed from MsW. Feel free to rejoin should you wish to play with us again! https://discord.gg/4ftzNafB8M
						// \n
						// \n
						// Good luck out there, soldier.
						// \n\n
						// *If you notice an issue with this message, please message <@744626724641177630>*
						// `)
						// persistents.logchannel.send(`**Activity:** Member <@<@${m.discordId}>> has been kicked for inactivity.`)
						// await persistents.guild.members.fetch(m.discordId).then(memb => {
						// 	memb.kick();
						// })
						persistents.logchannel.send(`**Activity:** Member <@<@${m.discordId}>> needs to be kicked for inactivity.`)
						
					}
				} else if (m.userType == 2) {
					if ((Date.now() - m.lastPlayed) >= 12*7*24*60*60*1000) {
						persistents.logchannel.send(`**Activity**: <@&${config.discord.roles.conglomerate}>: Competitive player <@<@${m.discordId}>> has not played in over 3 months. Please message them accordingly.`)
					}
				}
			} else {
				db.updateLastPlayed(m.id, m.lastPlayed + 24*60*60*1000)
			}
		})
	},
	start: true,
	timeZone: 'utc',
})

discordclient.login(config.discord.token)