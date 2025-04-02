import { Client, TextChannel } from "discord.js";
import cron from "node-cron";
import {
  getWeeklyStats,
  resetWeeklyStats,
  getAllGuilds,
  getWeeklyChannel,
} from "../db";
import { generateWeeklyReport } from "../utils/generateWeeklyReport";

async function postWeeklyStats(client: Client) {
  try {
    // Get all guilds that have peer bonus records
    const allGuilds = getAllGuilds();

    for (const guildId of allGuilds) {
      try {
        const guild = await client.guilds.fetch(guildId);
        const weeklyChannelId = getWeeklyChannel(guildId);

        let targetChannel: TextChannel | null = null;

        // Try to get weekly channel if set
        if (weeklyChannelId) {
          const channel = await client.channels.fetch(weeklyChannelId);
          if (channel instanceof TextChannel) {
            targetChannel = channel;
          } else {
            console.warn(
              `Weekly channel ${weeklyChannelId} for guild ${guildId} is not a text channel`
            );
          }
        }

        // If no valid weekly channel, find system channel
        if (!targetChannel) {
          if (!guild.systemChannel) {
            console.error(`No system channel found for guild ${guildId}`);
            continue;
          }
          targetChannel = guild.systemChannel;
        }

        try {
          // Create main message and thread
          const mainMessage = await targetChannel.send(
            "こんにちは！\n今週も皆さんお疲れ様でした :tada:\n\n今週のピアボーナスの結果をスレッドに投稿しました！\nご覧ください！"
          );

          const thread = await mainMessage.startThread({
            name: `週間ピアボーナスレポート ${new Date().toLocaleDateString(
              "ja-JP"
            )}`,
          });

          // Get statistics and generate report for this guild
          const stats = getWeeklyStats(guildId);
          const reportMessage = await generateWeeklyReport(client, stats);

          // Post stats in thread
          await thread.send(reportMessage);

          // Lock the thread
          await thread.setLocked(true);

          console.log(
            `Weekly stats posted for guild ${guildId} in channel ${targetChannel.name}`
          );
        } catch (error) {
          console.error(
            `Error posting weekly stats for guild ${guildId} in channel ${targetChannel.name}: ${error}`
          );
        }
      } catch (error) {
        console.error(`Error handling guild ${guildId}: ${error}`);
      }
    }

    // Reset weekly stats and coins after processing all guilds
    resetWeeklyStats();
    console.log("Weekly stats and coins have been reset");
  } catch (error) {
    console.error(`Error in weekly stats routine: ${error}`);
  }
}

export default {
  name: "ready",
  once: true,
  execute(client: Client) {
    console.log(`Logged in as ${client.user?.username}!`);

    // Schedule weekly stats post for Monday 9:00 AM JST
    cron.schedule(
      "0 9 * * 1",
      () => {
        void postWeeklyStats(client);
      },
      {
        timezone: "Asia/Tokyo",
      }
    );
  },
};
