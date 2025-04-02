import { Client, TextChannel } from "discord.js";
import cron from "node-cron";
import {
  getWeeklyStats,
  resetWeeklyStats,
  getGuildsWithWeeklyChannel,
} from "../db";
import { generateWeeklyReport } from "../utils/generateWeeklyReport";

async function postWeeklyStats(client: Client) {
  try {
    // Get all guilds that have weekly channel set
    const guildsWithChannel = getGuildsWithWeeklyChannel();

    for (const { guild_id, weekly_channel_id } of guildsWithChannel) {
      try {
        const channel = await client.channels.fetch(weekly_channel_id);
        if (!channel || !(channel instanceof TextChannel)) {
          console.error(
            `Invalid channel or channel type for guild ${guild_id}`
          );
          continue;
        }

        // Create main message and thread
        const mainMessage = await channel.send(
          "こんにちは！\n今週も皆さんお疲れ様でした :tada:\n\n今週のピアボーナスの結果をスレッドに投稿しました！\nご覧ください！"
        );

        const thread = await mainMessage.startThread({
          name: `週間ピアボーナスレポート ${new Date().toLocaleDateString(
            "ja-JP"
          )}`,
        });

        // Get statistics and generate report for this guild
        const stats = getWeeklyStats(guild_id);
        const reportMessage = await generateWeeklyReport(client, stats);

        // Post stats in thread
        await thread.send(reportMessage);

        // Lock the thread
        await thread.setLocked(true);

        console.log(`Weekly stats posted for guild ${guild_id}`);
      } catch (error) {
        console.error(
          `Error posting weekly stats for guild ${guild_id}: ${error}`
        );
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
