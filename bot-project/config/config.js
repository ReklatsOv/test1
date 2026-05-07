require('dotenv').config({ path: './config/.env' });

module.exports = {
  bot: {
    token: process.env.BOT_TOKEN,
    username: process.env.BOT_USERNAME || 'clawdai_bot',
    firstName: process.env.BOT_FIRST_NAME || 'clawdbot',
    mentionTrigger: process.env.MENTION_TRIGGER || '@clawdai_bot',
  },
  openai: {
    baseURL: process.env.OPENAI_BASE_URL || 'http://localhost:3264/api',
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
    model: 'qwen3.5-plus',
  },
  weather: {
    apiKey: process.env.WEATHER_API_KEY,
    lat: process.env.WEATHER_LAT || '55.5953',
    lon: process.env.WEATHER_LON || '42.0553',
    url: 'https://api.weather.yandex.ru/v2/forecast',
  },
  cron: {
    schedule: process.env.CRON_SCHEDULE || '0 7 * * *',
    timezone: process.env.TIMEZONE || 'Etc/GMT-3',
  },
  logs: {
    dir: './logs',
  },
};
