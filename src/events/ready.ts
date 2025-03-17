import { Client, TextChannel } from "discord.js";
import cron from "node-cron";
import { getWeeklyStats, resetDatabase } from "../db";
import { generateWeeklyReport } from "../utils/generateWeeklyReport";

async function postWeeklyStats(client: Client) {
  try {
    // Get the channel ID from environment variable
    const channelId = process.env.WEEKLY_STATS_CHANNEL_ID;
    if (!channelId) {
      console.error("Weekly stats channel ID is not set");
      return;
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      console.error("Invalid channel or channel type");
      return;
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

    // Get statistics and generate report
    const stats = getWeeklyStats();
    const reportMessage = await generateWeeklyReport(client, stats);

    // Post stats in thread
    await thread.send(reportMessage);

    // Lock the thread
    await thread.setLocked(true);

    // Reset the database
    resetDatabase();
    console.log(
      "Weekly stats posted, database reset, and username cache cleared"
    );
  } catch (error) {
    console.error(`Error posting weekly stats: ${error}`);
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
