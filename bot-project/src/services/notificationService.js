const cron = require('node-cron');
const config = require('../config/config');
const logger = require('../utils/logger');
const weatherService = require('../services/weatherService');

let cronTask = null;

/**
 * Sends morning weather notification to all known users
 * @param {Object} botInstance - Bot instance for sending messages
 */
async function sendMorningWeatherNotification(botInstance) {
  console.log('--- STARTING MORNING WEATHER NOTIFICATION TASK ---');
  console.log('Launch time:', new Date().toISOString());
  
  // Load users from logs
  const usersToSend = logger.loadKnownUsersFromLogs();
  
  console.log(`Sending to ${usersToSend.size} unique users.`);
  
  const forecastText = await weatherService.getWeatherForecast();

  // Send message to each user
  for (const userId of usersToSend) {
    try {
      console.log(`[${new Date().toISOString()}] Sending weather to user ${userId}...`);
      
      // Check if already sent today
      if (logger.wasWeatherSentToday(userId)) {
        console.log(`[${new Date().toISOString()}] Weather already sent to user ${userId} today. Skipping.`);
        continue;
      }
      
      // Send message
      await botInstance.api.sendMessageToUser(userId, forecastText, { format: 'markdown' });
      console.log(`[${new Date().toISOString()}] Message successfully sent to user ${userId}`);
      
      // Mark as sent
      logger.markWeatherAsSent(userId);
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error sending weather to user ${userId}:`, error);
    }
  }
  
  console.log('--- MORNING WEATHER NOTIFICATION TASK COMPLETED ---');
}

/**
 * Sets up the cron job for morning notifications
 * @param {Object} botInstance - Bot instance
 */
function setupCronJob(botInstance) {
  // Stop previous task if exists
  if (cronTask) {
    cronTask.destroy();
    console.log("Previous Cron task stopped.");
  }
  
  // Create new task
  cronTask = cron.schedule(config.cron.schedule, () => {
    console.log("Running scheduled cron task...");
    sendMorningWeatherNotification(botInstance);
  }, {
    timezone: config.cron.timezone
  });

  console.log(`Cron task scheduled for ${config.cron.schedule} (${config.cron.timezone}).`);
}

/**
 * Stops the cron job
 */
function stopCronJob() {
  if (cronTask) {
    cronTask.destroy();
    console.log("Cron task stopped.");
    cronTask = null;
  }
}

module.exports = {
  sendMorningWeatherNotification,
  setupCronJob,
  stopCronJob,
};
