import { Message } from "discord.js";
import { recordBonus } from "../db";
import logger from "../utils/logger";

export default {
  name: "messageCreate",
  async execute(message: Message) {
    if (message.author.bot) return;

    if (message.content.includes(":nare_coin:")) {
      const userMentions = message.mentions.users;
      const roleMentions = message.mentions.roles;

      if (userMentions.size === 0 && roleMentions.size === 0) {
        await message.reply("あれなんかおかしいぞ、もう一度試してみよう！");
        return;
      }

      // Process user mentions
      userMentions.forEach(async (mentionedUser) => {
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

      // Process role mentions
      roleMentions.forEach(async (role) => {
        const membersWithRole = message.guild?.members.cache.filter(
          (member) =>
            member.roles.cache.has(role.id) && member.id !== message.author.id
        );

        membersWithRole?.forEach(async (member) => {
          try {
            recordBonus(message.author.id, member.id, message.id);
            logger.info(
              message.author.id,
              `Recorded bonus from ${message.author.username} to ${member.user.username} (role: ${role.name})`
            );
          } catch (error) {
            logger.error(
              message.author.id,
              `Failed to record bonus for role member: ${error}`
            );
          }
        });

        if (membersWithRole && membersWithRole.size > 0) {
          await message.reply(
            `<@${message.author.id}> さんロール ${role.name} のメンバー全員を記録しました！`
          );
        }
      });
    }
  },
};
