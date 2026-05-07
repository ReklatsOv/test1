# MAX Bot

Telegram-style bot for MAX platform with OpenAI integration and weather forecasts.

## Project Structure

```
bot-project/
├── config/
│   ├── .env.example          # Environment variables template
│   └── config.js             # Configuration loader
├── src/
│   ├── index.js              # Application entry point
│   ├── handlers/
│   │   └── messageHandler.js # Message handling logic
│   ├── services/
│   │   ├── maxApiService.js  # MAX API interactions
│   │   ├── weatherService.js # Weather forecast service
│   │   └── notificationService.js # Cron notifications
│   └── utils/
│       └── logger.js         # Logging and user history utilities
├── logs/                     # User history logs (auto-created)
├── package.json
└── README.md
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp config/.env.example config/.env
   ```
   
   Edit `config/.env` and set your values:
   - `BOT_TOKEN` - Your MAX bot token
   - `WEATHER_API_KEY` - Yandex Weather API key (optional)
   - Other settings as needed

3. **Run the bot:**
   ```bash
   # Production mode
   npm start
   
   # Development mode (with auto-reload)
   npm run dev
   ```

## Features

- **Chat Integration**: Responds to direct messages and group chats
- **Smart Triggers**: Only responds when mentioned or replied to in groups
- **Session Management**: Maintains conversation context across restarts
- **Streaming Responses**: Real-time AI responses with typing indicators
- **Weather Forecasts**: Daily weather notifications via Yandex Weather API
- **Scheduled Notifications**: Morning weather updates at 7:00 AM Moscow time
- **User History**: Persistent conversation logs per user

## Configuration

All configuration is managed through environment variables in `config/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `BOT_TOKEN` | MAX bot authentication token | Required |
| `OPENAI_BASE_URL` | OpenAI proxy URL | `http://localhost:3264/api` |
| `OPENAI_API_KEY` | OpenAI API key | `dummy-key` |
| `WEATHER_API_KEY` | Yandex Weather API key | - |
| `WEATHER_LAT` | Latitude for weather | `55.5953` (Murom) |
| `WEATHER_LON` | Longitude for weather | `42.0553` (Murom) |
| `BOT_USERNAME` | Bot username | `clawdai_bot` |
| `MENTION_TRIGGER` | Mention trigger string | `@clawdai_bot` |
| `CRON_SCHEDULE` | Cron schedule for notifications | `0 7 * * *` |
| `TIMEZONE` | Timezone for cron | `Etc/GMT-3` |

## Development

The project uses a modular architecture:

- **handlers/**: Message and event handlers
- **services/**: External API integrations (MAX, Weather, OpenAI)
- **utils/**: Utility functions (logging, file operations)

## License

ISC
