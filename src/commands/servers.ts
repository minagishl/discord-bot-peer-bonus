import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("servers")
    .setDescription("BOTが参加しているサーバーの数を表示します"),

  async execute(interaction: ChatInputCommandInteraction) {
    const serverCount = interaction.client.guilds.cache.size;

    const response = [`📊 **サーバー参加状況**`, ``, `🏠 参加サーバー数：${serverCount}`].join(
      "\n",
    );

    await interaction.reply({
      content: response,
      ephemeral: false,
    });
  },
};
