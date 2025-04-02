declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TOKEN: string;
      KEEP_ALIVE?: string;
      EMOJI_ID: string;
    }
  }
}

export {};
