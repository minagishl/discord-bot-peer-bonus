import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getCoins } from "../db";

export default {
  data: new SlashCommandBuilder().setName("coins").setDescription("現在のコイン残高を表示します"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "このコマンドはサーバー内でのみ使用できます。",
        ephemeral: true,
      });
      return;
    }

    const coins = getCoins(interaction.user.id, interaction.guild.id);

    const response = [
      `💰 **${interaction.user.username}** さんのコイン残高`,
      ``,
      `現在の残高：${coins} コイン`,
    ].join("\n");

    await interaction.reply({
      content: response,
      ephemeral: true, // Only visible to the user
    });
  },
};
