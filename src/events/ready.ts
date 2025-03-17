import { Client, TextChannel } from "discord.js";
import cron from "node-cron";
import { getWeeklyStats, resetDatabase } from "../db";

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

    const emojiId = process.env.EMOJI_ID;
    if (!emojiId) {
      console.error("Emoji ID is not set");
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

    // Get and format statistics
    const { receiveStats, giveStats } = getWeeklyStats();

    // Format receive stats
    const receiveRanking = await Promise.all(
      receiveStats.map(async (stat, index) => {
        let username = "不明なユーザー";
        try {
          const user = await client.users.fetch(stat.receiver_id);
          if (user) {
            username = user.username;
          }
        } catch (error) {
          console.error(`Failed to fetch user ${stat.receiver_id}: ${error}`);
        }
        return `${index + 1}位: ${username} さん（ <:nare_coin:${emojiId}> ✕ ${
          stat.count
        }）`;
      })
    );

    // Format give stats
    const giveRanking = await Promise.all(
      giveStats.map(async (stat, index) => {
        let username = "不明なユーザー";
        try {
          const user = await client.users.fetch(stat.sender_id);
          if (user) {
            username = user.username;
          }
        } catch (error) {
          console.error(`Failed to fetch user ${stat.sender_id}: ${error}`);
        }
        return `${index + 1}位: ${username} さん（ <:nare_coin:${emojiId}> ✕ ${
          stat.count
        }）`;
      })
    );

    // Post stats in thread
    await thread.send(
      `==今週のreceiveAward==\n${receiveRanking.join(
        "\n"
      )}\n\n==今週のgiveAward==\n${giveRanking.join("\n")}`
    );

    // Lock the thread
    await thread.setLocked(true);

    // Reset the database
    resetDatabase();
    console.log("Weekly stats posted and database reset");
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
      "* * * * *",
      () => {
        void postWeeklyStats(client);
      },
      {
        timezone: "Asia/Tokyo",
      }
    );
  },
};
