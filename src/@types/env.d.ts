declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TOKEN: string;
      KEEP_ALIVE?: string;
      WEEKLY_STATS_CHANNEL_ID: string;
      EMOJI_ID: string;
    }
  }
}

export {};
