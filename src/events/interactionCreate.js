const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(discordclient, db, interaction) {
		if (interaction.isButton()) {
			if (interaction.customId.startsWith('reject-')) {
                let button = new ButtonBuilder()
                    .setCustomId("none")
                    .setLabel("Rejected")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)

                let row = new ActionRowBuilder()
                .addComponents(button);

                db.deleteLeave(Number(interaction.customId.slice(7)))
                interaction.message.edit({components: [row]})
                interaction.reply(`Leave rejected by <@${interaction.user.id}>`)
            }
		}
	},
};
