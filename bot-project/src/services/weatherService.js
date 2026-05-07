const config = require('../config/config');

/**
 * Weather condition to emoji mapping
 */
const weatherEmoji = {
  'clear': '☀️',
  'partly-cloudy': '🌤️',
  'cloudy': '☁️',
  'overcast': '🌥️',
  'drizzle': '🌦️',
  'light-rain': '🌧️',
  'rain': '🌧️',
  'moderate-rain': '🌧️',
  'heavy-rain': '🌧️☔',
  'continuous-heavy-rain': '🌧️☔',
  'showers': '🌧️',
  'wet-snow': '🌨️',
  'light-snow': '🌨️',
  'snow': '❄️',
  'snow-showers': '❄️',
  'hail': '🌨️',
  'thunderstorm': '⛈️',
  'thunderstorm-with-rain': '⛈️🌧️',
  'thunderstorm-with-heavy-rain': '⛈️☔',
  'thunderstorm-with-hail': '⛈️🌨️'
};

/**
 * Wind direction to emoji mapping
 */
const windDirections = {
  'nw': '↖️',
  'n': '↑',
  'ne': '↗️',
  'e': '→',
  'se': '↘️',
  's': '↓',
  'sw': '↙️',
  'w': '←'
};

/**
 * Gets weather emoji for a condition
 * @param {string} condition - Weather condition
 * @returns {string} - Emoji
 */
function getWeatherEmoji(condition) {
  return weatherEmoji[condition] || '🌤️';
}

/**
 * Gets wind direction emoji
 * @param {string} windDir - Wind direction
 * @returns {string} - Emoji
 */
function getWindDirectionEmoji(windDir) {
  return windDirections[windDir] || '→';
}

/**
 * Formats time string (removes leading zero from hours)
 * @param {string} timeStr - Time string (HH:MM)
 * @returns {string} - Formatted time
 */
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  return `${parseInt(hours)}:${minutes}`;
}

/**
 * Formats a part of the forecast (morning, day, evening, night)
 * @param {Object} part - Part data from API
 * @param {string} partName - Name of the part (in Russian)
 * @returns {string} - Formatted text
 */
function formatPart(part, partName) {
  if (!part) return '';
  
  const emoji = getWeatherEmoji(part.condition);
  const windDirEmoji = getWindDirectionEmoji(part.wind_dir);
  
  const conditionText = part.condition === 'clear' ? 'Ясно' : 
                        part.condition === 'partly-cloudy' ? 'Малооблачно' :
                        part.condition === 'cloudy' ? 'Облачно' : 'Пасмурно';
  
  return `**${partName}** ${emoji}\n` +
         `🌡️ ${part.temp_avg}°C (ощущается как ${part.feels_like}°C)\n` +
         `💧 Влажность: ${part.humidity}%\n` +
         `🌬️ ${windDirEmoji} Ветер: ${part.wind_speed} м/с (порывы до ${part.wind_gust} м/с)\n` +
         `☁️ ${conditionText}\n\n`;
}

/**
 * Formats weather forecast data into a readable message
 * @param {Object} data - Weather data from Yandex API
 * @returns {string} - Formatted weather message
 */
function formatWeatherForecast(data) {
  if (!data.forecasts || data.forecasts.length === 0) {
    return "⚠️ Не удалось получить данные о прогнозе погоды.";
  }

  let weatherMessage = `🌤️ **Прогноз погоды в Муроме**\n\n`;

  // Current conditions
  if (data.fact) {
    const fact = data.fact;
    const emoji = getWeatherEmoji(fact.condition);
    const windDirEmoji = getWindDirectionEmoji(fact.wind_dir);
    
    const conditionText = fact.condition === 'clear' ? 'Ясно' : 
                          fact.condition === 'partly-cloudy' ? 'Малооблачно' :
                          fact.condition === 'cloudy' ? 'Облачно' : 'Пасмурно';
    
    weatherMessage += `**Сейчас** ${emoji}\n` +
                      `🌡️ ${fact.temp}°C (ощущается как ${fact.feels_like}°C)\n` +
                      `💧 Влажность: ${fact.humidity}%\n` +
                      `🌬️ ${windDirEmoji} Ветер: ${fact.wind_speed} м/с (порывы до ${fact.wind_gust} м/с)\n` +
                      `☁️ ${conditionText}\n\n`;
  }

  // Today's forecast
  const today = data.forecasts[0];
  if (today) {
    const dateObj = new Date(today.date);
    const dayName = dateObj.toLocaleDateString('ru-RU', { weekday: 'long' });
    
    weatherMessage += `**Сегодня, ${dayName}**\n` +
                      `🌅 Восход: ${formatTime(today.sunrise)} | 🌇 Закат: ${formatTime(today.sunset)}\n\n`;
    
    weatherMessage += formatPart(today.parts.morning, 'Утро');
    weatherMessage += formatPart(today.parts.day, 'День');
    weatherMessage += formatPart(today.parts.evening, 'Вечер');
    weatherMessage += formatPart(today.parts.night, 'Ночь');
  }

  // Tomorrow's forecast
  if (data.forecasts.length > 1) {
    const tomorrow = data.forecasts[1];
    const dateObj = new Date(tomorrow.date);
    const dayName = dateObj.toLocaleDateString('ru-RU', { weekday: 'long' });
    
    const tempRange = `${tomorrow.parts.night_short.temp_min}...${tomorrow.parts.day_short.temp_max}°C`;
    const condition = tomorrow.parts.day_short.condition === 'clear' ? 'ясно' :
                      tomorrow.parts.day_short.condition === 'partly-cloudy' ? 'малооблачно' :
                      tomorrow.parts.day_short.condition === 'cloudy' ? 'облачно' : 'пасмурно';
    
    weatherMessage += `**Завтра, ${dayName}**\n` +
                      `🌡️ ${tempRange} | ☁️ ${condition}\n` +
                      `🌬️ Ветер: ${tomorrow.parts.day_short.wind_speed} м/с\n\n`;
  }

  // Weekly forecast
  if (data.forecasts.length > 2) {
    weatherMessage += `**Прогноз на неделю**\n`;
    
    const days = data.forecasts.slice(2, 7);
    days.forEach(day => {
      const date = new Date(day.date);
      const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
      const tempRange = `${day.parts.night_short.temp_min}...${day.parts.day_short.temp_max}°C`;
      
      const condition = day.parts.day_short.condition === 'clear' ? '☀️' :
                        day.parts.day_short.condition === 'partly-cloudy' ? '🌤️' :
                        day.parts.day_short.condition === 'cloudy' ? '☁️' : '🌥️';
      
      weatherMessage += `• ${dayName}, ${date.getDate()} ${date.toLocaleString('ru-RU', { month: 'short' })}: ${condition} ${tempRange}\n`;
    });
    
    weatherMessage += `\n_Детальный прогноз доступен по запросу_`;
  }

  weatherMessage += `\n*Источник: Яндекс.Погода*`;

  return weatherMessage;
}

/**
 * Gets weather forecast from Yandex Weather API
 * @returns {Promise<string>} - Formatted weather message
 */
async function getWeatherForecast() {
  if (!config.weather.apiKey || config.weather.apiKey === 'your_yandex_weather_api_key_here') {
    console.warn('Warning: Yandex Weather API key is not set. Returning test message.');
    return "⚠️ Прогноз погоды недоступен: API ключ не настроен.";
  }

  const url = `${config.weather.url}?lat=${config.weather.lat}&lon=${config.weather.lon}`;
  const headers = {
    'X-Yandex-Weather-Key': config.weather.apiKey
  };

  try {
    console.log('Requesting weather forecast...');
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Weather data received.');

    return formatWeatherForecast(data);
  } catch (error) {
    console.error('Error getting weather forecast:', error);
    return `❌ Не удалось получить прогноз погоды: ${error.message}`;
  }
}

module.exports = {
  getWeatherForecast,
  formatWeatherForecast,
};
