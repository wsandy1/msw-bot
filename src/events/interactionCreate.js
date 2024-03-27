const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(discordclient, db, interaction) {
		if (interaction.isButton()) {
			if (interaction.customId == "reject") {
                let button = new ButtonBuilder()
                    .setCustomId("none")
                    .setLabel("Rejected")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)

                let row = new ActionRowBuilder()
                .addComponents(button);
                interaction.message.edit({components: [row]})
                interaction.reply(`Leave rejected by <@${interaction.user.id}>`)
            }
		}
	},
};
