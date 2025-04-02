import Database from "better-sqlite3";

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

  CREATE TABLE IF NOT EXISTS coins (
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    amount INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, guild_id)
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

interface CoinBalance {
  amount: number;
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
  const row = db
    .prepare("SELECT amount FROM coins WHERE user_id = ? AND guild_id = ?")
    .get(userId, guildId) as CoinBalance | undefined;
  return row ? row.amount : 0;
}

export function setCoins(
  userId: string,
  guildId: string,
  amount: number
): void {
  const stmt = db.prepare(`
    INSERT INTO coins (user_id, guild_id, amount)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, guild_id)
    DO UPDATE SET amount = ?, updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(userId, guildId, amount, amount);
}

export function addCoins(
  userId: string,
  guildId: string,
  amount: number
): void {
  const currentAmount = getCoins(userId, guildId);
  setCoins(userId, guildId, currentAmount + amount);
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
      UPDATE coins SET amount = 0, updated_at = CURRENT_TIMESTAMP;
    `);
    console.log("Weekly stats and coins have been reset");
  } catch (error) {
    console.error(`Error resetting weekly stats and coins: ${error}`);
  }
}

export function resetGuildCoins(guildId: string) {
  try {
    db.prepare(
      "UPDATE coins SET amount = 0, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?"
    ).run(guildId);
    console.log(`Coins reset for guild ${guildId}`);
  } catch (error) {
    console.error(`Error resetting coins for guild ${guildId}: ${error}`);
    throw error;
  }
}
