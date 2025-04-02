# Discord Bot Peer Bonus

The Peer Bonus Discord Bot implemented by the Knowledge Base Executive Committee. This bot manages a peer bonus system where users can give each other coins as recognition for their contributions.

## Features

- Peer bonus coin management
- Weekly report generation
- Custom emoji support
- Server management utilities

## Prerequisites

- Node.js (see `.nvmrc` for version)
- pnpm (version 10 or higher)
- Discord Bot Token and Client ID

## Installation

1. Clone the repository:

```bash
git clone https://github.com/minagishl/discord-bot-peer-bonus.git
cd discord-bot-peer-bonus
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your Discord bot credentials:

```env
TOKEN='YOUR_DISCORD_BOT_TOKEN'
CLIENT_ID='YOUR_DISCORD_CLIENT_ID'

EMOJI_ID='YOUR_NARE_COIN_EMOJI_ID'
```

4. Register slash commands:

```bash
pnpm register
```

5. Build and start the bot:

```bash
pnpm build
pnpm start
```

For development:

```bash
pnpm dev
```

## Available Commands

- `/coins` - Check coin balance
- `/add-emoji` - Add custom emoji to server
- `/reset-coins` - Reset coin balance
- `/servers` - Display server information
- `/weekly-channel` - Configure weekly report channel

## Development Scripts

- `pnpm start` - Start the bot
- `pnpm build` - Build the project
- `pnpm dev` - Run in development mode
- `pnpm format` - Format code

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
