import { Message, PermissionFlagsBits } from "discord.js";
import { recordBonus, getWeeklyStats } from "../db";
import { generateWeeklyReport } from "../utils/generateWeeklyReport";
import logger from "../utils/logger";

export default {
  name: "messageCreate",
  async execute(message: Message) {
    if (message.author.bot) return;

    // Handle weekly stats request
    if (
      message.mentions.has(message.client.user) &&
      !message.mentions.everyone
    ) {
      // Check if user has administrator permission
      const member = message.member;
      if (member?.permissions.has(PermissionFlagsBits.Administrator)) {
        const stats = getWeeklyStats();

        // Generate and send report as DM
        const reportMessage = await generateWeeklyReport(message.client, stats);
        await message.author.send(reportMessage);
        await message.reply("ウィークリーレポートをDMで送信しました！");
        return;
      }
    }

    if (message.content.includes(":nare_coin:")) {
      const userMentions = message.mentions.users;
      const roleMentions = message.mentions.roles;

      // Check for replies
      if (message.reference) {
        const repliedMessage = await message.fetchReference();
        if (
          repliedMessage.author.id !== message.author.id &&
          !repliedMessage.author.bot
        ) {
          try {
            recordBonus(
              message.author.id,
              repliedMessage.author.id,
              message.id
            );
            await message.reply(`<@${message.author.id}> さん記録しました！`);
            logger.info(
              message.author.id,
              `Recorded bonus from ${message.author.username} to ${repliedMessage.author.username} (via reply)`
            );
          } catch (error) {
            logger.error(message.author.id, `Failed to record bonus: ${error}`);
          }
          return;
        }
      }

      // Check for self-mention or no mentions
      if (
        (userMentions.size === 0 && roleMentions.size === 0) ||
        (userMentions.size === 1 &&
          roleMentions.size === 0 &&
          userMentions.has(message.author.id))
      ) {
        await message.reply("あれなんかおかしいぞ、もう一度試してみよう！");
        return;
      }

      // Process user mentions
      let validMentionsProcessed = false;

      // Process user mentions
      for (const mentionedUser of userMentions.values()) {
        if (mentionedUser.id !== message.author.id && !mentionedUser.bot) {
          try {
            recordBonus(message.author.id, mentionedUser.id, message.id);
            logger.info(
              message.author.id,
              `Recorded bonus from ${message.author.username} to ${mentionedUser.username}`
            );
            validMentionsProcessed = true;
          } catch (error) {
            logger.error(message.author.id, `Failed to record bonus: ${error}`);
          }
        }
      }

      // Process role mentions
      for (const role of roleMentions.values()) {
        const membersWithRole = message.guild?.members.cache.filter(
          (member) =>
            member.roles.cache.has(role.id) &&
            member.id !== message.author.id &&
            !member.user.bot
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
          validMentionsProcessed = true;
          await message.reply(
            `<@${message.author.id}> さんロール ${role.name} のメンバー全員を記録しました！`
          );
        }
      }

      if (validMentionsProcessed) {
        await message.reply(`<@${message.author.id}> さん記録しました！`);
      }
    }
  },
};
