import { Client, TextChannel } from "discord.js";
import cron from "node-cron";
import { getWeeklyStats, resetDatabase } from "../db";

async function postWeeklyStats(client: Client) {
  // Cache for usernames to avoid duplicate fetches
  const userCache = new Map<string, string>();

  // Helper function to get username with caching
  async function getUsername(userId: string): Promise<string> {
    if (userCache.has(userId)) {
      return userCache.get(userId)!;
    }

    try {
      const user = await client.users.fetch(userId);
      const username = user ? user.username : "不明なユーザー";
      userCache.set(userId, username);
      return username;
    } catch (error) {
      console.error(`Failed to fetch user ${userId}: ${error}`);
      return "不明なユーザー";
    }
  }

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
        const username = await getUsername(stat.receiver_id);
        return `${index + 1}位: ${username} さん（ <:nare_coin:${emojiId}> ✕ ${
          stat.count
        }）`;
      })
    );

    // Format give stats
    const giveRanking = await Promise.all(
      giveStats.map(async (stat, index) => {
        const username = await getUsername(stat.sender_id);
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

    // Reset the database and clear username cache
    resetDatabase();
    userCache.clear();
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
