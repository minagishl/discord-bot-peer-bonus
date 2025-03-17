import { Message } from "discord.js";
import { recordBonus } from "../db";
import logger from "../utils/logger";

export default {
  name: "messageCreate",
  async execute(message: Message) {
    if (message.author.bot) return;

    if (message.content.includes(":nare_coin:")) {
      const mentions = message.mentions.users;

      if (mentions.size === 0) {
        await message.reply("あれなんかおかしいぞ、もう一度試してみよう！");
        return;
      }

      mentions.forEach(async (mentionedUser) => {
        if (mentionedUser.id !== message.author.id) {
          try {
            recordBonus(message.author.id, mentionedUser.id, message.id);
            await message.reply(`<@${message.author.id}> さん記録しました！`);
            logger.info(
              message.author.id,
              `Recorded bonus from ${message.author.username} to ${mentionedUser.username}`
            );
          } catch (error) {
            logger.error(message.author.id, `Failed to record bonus: ${error}`);
          }
        }
      });
    }
  },
};
