import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("add-emoji")
    .setDescription("環境変数で指定した絵文字をサーバーに追加します")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "このコマンドはサーバー内でのみ使用できます。",
        ephemeral: true,
      });
      return;
    }

    const emojiId = process.env.EMOJI_ID;
    if (!emojiId) {
      await interaction.reply({
        content: "環境変数 EMOJI_ID が設定されていません。",
        ephemeral: true,
      });
      return;
    }

    const name = "nare_coin";

    try {
      // Check if the emoji already exists
      const existingEmoji = interaction.guild.emojis.cache.find(
        (emoji) => emoji.name === name
      );

      if (existingEmoji) {
        await interaction.reply({
          content: `絵文字 ${name} はすでに存在します。`,
          ephemeral: true,
        });
        return;
      }

      // Construct the emoji URL
      const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.png`;

      // Create the emoji
      const emoji = await interaction.guild.emojis.create({
        attachment: emojiUrl,
        name: name,
      });

      await interaction.reply({
        content: `絵文字 ${emoji} (${name}) を追加しました！`,
        ephemeral: true,
      });
    } catch (error) {
      await interaction.reply({
        content: `絵文字の追加に失敗しました：${
          error instanceof Error ? error.message : "不明なエラー"
        }`,
        ephemeral: true,
      });
    }
  },
};
