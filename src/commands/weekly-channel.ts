import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  SlashCommandBuilder,
} from "discord.js";
import { getWeeklyChannel, setWeeklyChannel } from "../db";

export default {
  data: new SlashCommandBuilder()
    .setName("weekly-channel")
    .setDescription("週次メッセージを送信するチャンネルを設定します")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("週次メッセージを送信するチャンネルを設定します")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("週次メッセージを送信するチャンネル")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("show").setDescription("現在の設定を表示します")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "このコマンドはサーバー内でのみ使用できます。",
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "set") {
      const channel = interaction.options.getChannel("channel", true);
      setWeeklyChannel(interaction.guild.id, channel.id);
      await interaction.reply({
        content: `週次メッセージを ${channel} に送信するように設定しました。`,
        ephemeral: true,
      });
    } else if (subcommand === "show") {
      const channelId = getWeeklyChannel(interaction.guild.id);
      if (!channelId) {
        await interaction.reply({
          content: "週次メッセージのチャンネルが設定されていません。",
          ephemeral: true,
        });
        return;
      }

      const channel = interaction.guild.channels.cache.get(channelId);
      if (!channel) {
        await interaction.reply({
          content: "設定されているチャンネルが見つかりませんでした。",
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        content: `週次メッセージは ${channel} に送信されます。`,
        ephemeral: true,
      });
    }
  },
};
