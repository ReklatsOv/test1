require('dotenv').config({ path: './config/.env' });

const config = require('./config/config');
const { createBotInstance } = require('./handlers/messageHandler');
const { setupCronJob, stopCronJob } = require('./services/notificationService');

/**
 * Starts the bot with retry logic
 * @param {string} token - Bot token
 * @param {number} retryDelayMs - Delay between retries in milliseconds
 */
async function startBotWithRetry(token, retryDelayMs = 10000) {
  let botInstance;

  while (true) {
    try {
      console.log("Creating new MAX bot instance...");
      botInstance = createBotInstance(token);

      // Setup Cron job
      setupCronJob(botInstance);

      console.log("Attempting to start MAX bot...");
      await botInstance.start();
      
      console.log("Bot cycle completed (unexpectedly, but without error).");

    } catch (error) {
      console.error('Error in bot loop:', error);

      // Check if error is connection timeout or other network error
      if (error.cause && (
           error.cause.code === 'UND_ERR_CONNECT_TIMEOUT' ||
           error.cause.code === 'UND_ERR_SOCKET' ||
           error.cause.name === 'ConnectTimeoutError' ||
           error.message.includes('fetch failed')
         )) {
        console.log(`Network error detected. Retrying in ${retryDelayMs / 1000} seconds...`);
        
        // Stop cron job
        stopCronJob();
        
        // Clear bot reference for garbage collection
        botInstance = null;
        
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        continue;
      } else {
        console.error('Unknown error occurred. Bot shutting down.', error);
        
        // Stop cron job
        stopCronJob();
        
        // Clear bot reference
        botInstance = null;
        break;
      }
    }
  }
}

// Start the bot with retry logic
console.log("MAX Bot starting. Attempting to connect and listen for new messages...");
startBotWithRetry(config.bot.token);
