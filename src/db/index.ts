import Database from "better-sqlite3";
import fs from "node:fs";

// Ensure data directory exists
const dbDir = "data";
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// Initialize database
const db = new Database("data/peer-bonus.db");

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS peer_bonus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS server_settings (
    guild_id TEXT PRIMARY KEY,
    weekly_channel_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export function recordBonus(
  senderId: string,
  receiverId: string,
  messageId: string,
  guildId: string
) {
  const stmt = db.prepare(
    "INSERT INTO peer_bonus (sender_id, receiver_id, message_id, guild_id) VALUES (?, ?, ?, ?)"
  );
  stmt.run(senderId, receiverId, messageId, guildId);
}

// Server settings functions
interface ServerSettings {
  weekly_channel_id: string;
}

export function getWeeklyChannel(guildId: string): string | null {
  const row = db
    .prepare("SELECT weekly_channel_id FROM server_settings WHERE guild_id = ?")
    .get(guildId) as ServerSettings | undefined;
  return row ? row.weekly_channel_id : null;
}

export function setWeeklyChannel(guildId: string, channelId: string): void {
  const stmt = db.prepare(`
    INSERT INTO server_settings (guild_id, weekly_channel_id)
    VALUES (?, ?)
    ON CONFLICT(guild_id)
    DO UPDATE SET weekly_channel_id = ?, updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(guildId, channelId, channelId);
}

// Coin management functions
export function getCoins(userId: string, guildId: string): number {
  const receivedCount = db
    .prepare(
      "SELECT COUNT(*) as count FROM peer_bonus WHERE receiver_id = ? AND guild_id = ?"
    )
    .get(userId, guildId) as { count: number };
  return receivedCount.count;
}

export interface StatRecord {
  receiver_id: string;
  sender_id: string;
  count: number;
}

export function getWeeklyStats(guildId: string): {
  receiveStats: StatRecord[];
  giveStats: StatRecord[];
} {
  const receiveStats = db
    .prepare(
      `
      SELECT receiver_id, COUNT(*) as count
      FROM peer_bonus
      WHERE created_at >= datetime('now', '-7 days')
      AND guild_id = ?
      GROUP BY receiver_id
      ORDER BY count DESC
    `
    )
    .all(guildId);

  const giveStats = db
    .prepare(
      `
      SELECT sender_id, COUNT(*) as count
      FROM peer_bonus
      WHERE created_at >= datetime('now', '-7 days')
      AND guild_id = ?
      GROUP BY sender_id
      ORDER BY count DESC
    `
    )
    .all(guildId);

  return {
    receiveStats: receiveStats as StatRecord[],
    giveStats: giveStats as StatRecord[],
  };
}

// Get all guilds that have weekly channel set
interface GuildWeeklyChannel {
  guild_id: string;
  weekly_channel_id: string;
}

// Get all guilds from peer_bonus table
export function getAllGuilds(): string[] {
  const rows = db
    .prepare("SELECT DISTINCT guild_id FROM peer_bonus")
    .all() as Array<{ guild_id: string }>;
  return rows.map((row) => row.guild_id);
}

export function getGuildsWithWeeklyChannel(): GuildWeeklyChannel[] {
  return db
    .prepare(
      "SELECT guild_id, weekly_channel_id FROM server_settings WHERE weekly_channel_id IS NOT NULL"
    )
    .all() as GuildWeeklyChannel[];
}

export function resetWeeklyStats() {
  try {
    db.exec(`
      DELETE FROM peer_bonus;
    `);
    console.log("Weekly stats and coins have been reset");
  } catch (error) {
    console.error(`Error resetting weekly stats and coins: ${error}`);
  }
}

export function resetGuildCoins(guildId: string) {
  try {
    db.prepare("DELETE FROM peer_bonus WHERE guild_id = ?").run(guildId);
    console.log(`Peer bonus records reset for guild ${guildId}`);
  } catch (error) {
    console.error(
      `Error resetting peer bonus records for guild ${guildId}: ${error}`
    );
    throw error;
  }
}
