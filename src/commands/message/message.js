const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('message')
		.setDescription('Send a fun little message as the bot')
        .addStringOption(option => 
            option.setName('content')
                .setDescription('What to say')
                .setRequired(true)
        )
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Channel to send message in')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	async execute(interaction, db, discordclient) {
        let channel = interaction.options.getChannel("channel", true)

        channel.send(interaction.options.getString("content"))
        await interaction.reply({content: `:white_check_mark: Success`, ephemeral: true})
	},
};
