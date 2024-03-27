const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require("../../../config.json")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('role')
		.setDescription('Change the membership status of a member')
        .addUserOption(option => 
            option.setName('member')
                .setDescription('User to change')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('status')
                .setDescription('Which membership level to move them to')
                .addChoices(
                    {name: 'Recruit', value: 'recruit' },
                    {name: 'Member', value: 'member' },
                    {name: 'Competitive', value: 'comp'}
                )
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
	async execute(interaction, db, discordclient) {
        let user = interaction.options.getUser("member", true)
        let member = await discordclient.guilds.fetch("1156351314998087750").then(async guild => {
            return await guild.members.fetch(user.id)
        })
        let roles = member.roles.cache.map(role => role.id)

        if (interaction.options.getString("status") == "recruit") {
            if (roles.includes(config.discord.roles.comp)) {
                member.roles.remove(config.discord.roles.comp)
            }
            if (roles.includes(config.discord.roles.member)) {
                member.roles.remove(config.discord.roles.member)
            }
            if (!roles.includes(config.discord.roles.recruit)) {
                member.roles.add(config.discord.roles.recruit)
            }
            db.updateUserType(member.id, 4)
        } else if (interaction.options.getString("status") == "member") {
            if (roles.includes(config.discord.roles.recruit)) {
                member.roles.remove(config.discord.roles.recruit)
            }
            if (roles.includes(config.discord.roles.comp)) {
                member.roles.remove(config.discord.roles.comp)
            }
            if (!roles.includes(config.discord.roles.member)) {
                member.roles.add(config.discord.roles.member)
            }
            db.updateUserType(member.id, 3)
        } else if (interaction.options.getString("status") == "comp") {
            if (roles.includes(config.discord.roles.recruit)) {
                member.roles.remove(config.discord.roles.recruit)
            }
            if (!roles.includes(config.discord.roles.comp)) {
                member.roles.add(config.discord.roles.comp)
            }
            if (!roles.includes(config.discord.roles.member)) {
                member.roles.add(config.discord.roles.member)
            }
            db.updateUserType(member.id, 2)
        }
        interaction.reply(":white_check_mark: Success")
	},
};
