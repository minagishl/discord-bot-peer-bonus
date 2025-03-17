import { Client } from "discord.js";
import { StatRecord } from "../db";

export async function generateWeeklyReport(
  client: Client,
  stats: {
    receiveStats: StatRecord[];
    giveStats: StatRecord[];
  }
): Promise<string> {
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

  const emojiId = process.env.EMOJI_ID;
  if (!emojiId) {
    throw new Error("Emoji ID is not set");
  }

  // Format receive stats
  const receiveRanking = await Promise.all(
    stats.receiveStats.map(async (stat, index) => {
      const username = await getUsername(stat.receiver_id);
      return `${index + 1}位: ${username} さん（ <:nare_coin:${emojiId}> ✕ ${
        stat.count
      }）`;
    })
  );

  // Format give stats
  const giveRanking = await Promise.all(
    stats.giveStats.map(async (stat, index) => {
      const username = await getUsername(stat.sender_id);
      return `${index + 1}位: ${username} さん（ <:nare_coin:${emojiId}> ✕ ${
        stat.count
      }）`;
    })
  );

  return `==今週のreceiveAward==\n${receiveRanking.join(
    "\n"
  )}\n\n==今週のgiveAward==\n${giveRanking.join("\n")}`;
}
