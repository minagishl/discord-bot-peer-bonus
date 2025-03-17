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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export function recordBonus(
  senderId: string,
  receiverId: string,
  messageId: string
) {
  const stmt = db.prepare(
    "INSERT INTO peer_bonus (sender_id, receiver_id, message_id) VALUES (?, ?, ?)"
  );
  stmt.run(senderId, receiverId, messageId);
}

export interface StatRecord {
  receiver_id: string;
  sender_id: string;
  count: number;
}

export function getWeeklyStats(): {
  receiveStats: StatRecord[];
  giveStats: StatRecord[];
} {
  const receiveStats = db
    .prepare(
      `
      SELECT receiver_id, COUNT(*) as count
      FROM peer_bonus
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY receiver_id
      ORDER BY count DESC
    `
    )
    .all();

  const giveStats = db
    .prepare(
      `
      SELECT sender_id, COUNT(*) as count
      FROM peer_bonus
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY sender_id
      ORDER BY count DESC
    `
    )
    .all();

  return {
    receiveStats: receiveStats as StatRecord[],
    giveStats: giveStats as StatRecord[],
  };
}

export function resetDatabase() {
  try {
    db.exec("DELETE FROM peer_bonus");
    console.log("Database has been reset");
  } catch (error) {
    console.error(`Error resetting database: ${error}`);
  }
}
