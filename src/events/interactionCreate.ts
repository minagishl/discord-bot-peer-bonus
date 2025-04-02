import { Events, Interaction } from "discord.js";
import logger from "../utils/logger";

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.error(
        interaction.user.id,
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(
        interaction.user.id,
        `Error executing ${interaction.commandName}`
      );
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "コマンドの実行中にエラーが発生しました。",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "コマンドの実行中にエラーが発生しました。",
          ephemeral: true,
        });
      }
    }
  },
};
