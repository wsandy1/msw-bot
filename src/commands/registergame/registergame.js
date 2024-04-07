const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('registergame')
		.setDescription('Update last played date for all players currently in a VC.')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Specify which channel people are in.')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),
	async execute(interaction, db, discordclient) {
        let optchannel = interaction.options.getChannel("channel", true)
        let channel = await interaction.guild.channels.fetch(optchannel.id, { force: true })
        let members = []

        channel.members.forEach(member => {
            members.push(member.id)
        })
        


        members.forEach(m => {
            db.updateLastPlayed(m, Date.now())
            db.clearWarn(m)
        })

        await interaction.reply({content: `Registered game with <@${members.join(">, <@")}>`, ephemeral: false})
	},
};
