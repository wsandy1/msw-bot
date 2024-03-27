const { SlashCommandBuilder, ChannelType, time, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require("../../../config.json")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Register leave if you will be away from the game for an extended period of time.')
        .addIntegerOption(option => 
            option.setName('duration')
                .setDescription('Duration of leave IN WEEKS')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(52)
        )
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for absence.')
                .setRequired(true)
                .setMaxLength(255)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	async execute(interaction, db, discordclient) {
        let logchannel
        await discordclient.channels.fetch(config.discord.logchannel).then(channel => {
            logchannel = channel
        });

        let until = Date.now() + interaction.options.getInteger('duration')*7*24*60*60*1000
        db.createLeave(interaction.options.getString('reason'), until, interaction.user.id)
        interaction.reply({content: `Logged leave until ${time(new Date(until), 'd')}`, ephemeral: true})

        const embed = new EmbedBuilder()
            .setColor(0xa2a663)
            .setTitle("Leave Registered")
            .setDescription('Please click reject if this leave is unsatisfactory. If you do so, please contact the member explaining why.')
            .addFields(
                { name: 'User', value: `<@${interaction.user.id}>`},
                { name: 'Expires', value: (new Date(until)).toDateString()},
                { name: 'Reason', value: interaction.options.getString('reason')}
            )

        const button = new ButtonBuilder()
            .setCustomId("reject")
            .setLabel("Reject")
            .setStyle(ButtonStyle.Danger)

        const row = new ActionRowBuilder()
                .addComponents(button);

        logchannel.send({content: `<@&1156352828143566958>`,embeds: [embed], components: [row]})
	},
};
