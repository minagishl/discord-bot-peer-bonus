import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { resetGuildCoins } from "../db";

export default {
  data: new SlashCommandBuilder()
    .setName("reset-coins")
    .setDescription("サーバー内の全メンバーのコインをリセットします")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "このコマンドはサーバー内でのみ使用できます。",
        ephemeral: true,
      });
      return;
    }

    try {
      resetGuildCoins(interaction.guild.id);

      await interaction.reply({
        content: "🔄 サーバー内の全メンバーのコインをリセットしました。",
        ephemeral: true,
      });
    } catch (error) {
      console.error(
        `Failed to reset coins for guild ${interaction.guild.id}:`,
        error
      );
      await interaction.reply({
        content: "コインのリセット中にエラーが発生しました。",
        ephemeral: true,
      });
    }
  },
};
