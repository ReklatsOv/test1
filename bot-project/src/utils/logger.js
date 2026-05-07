const fs = require('fs');
const path = require('path');
const config = require('../config/config');

/**
 * Ensures the logs directory exists
 */
function ensureLogsDir() {
  if (!fs.existsSync(config.logs.dir)) {
    fs.mkdirSync(config.logs.dir, { recursive: true });
  }
}

/**
 * Gets the history file name for a user
 * @param {string} userId - User ID
 * @returns {string} - Path to the history file
 */
function getUserHistoryFileName(userId) {
  return path.join(config.logs.dir, `${userId}_history.txt`);
}

/**
 * Loads known users from log files
 * @returns {Set<string>} - Set of user IDs
 */
function loadKnownUsersFromLogs() {
  const users = new Set();
  const historyFileRegex = /^(\d+)_history\.txt$/;
  
  if (fs.existsSync(config.logs.dir)) {
    const files = fs.readdirSync(config.logs.dir);
    for (const file of files) {
      const match = file.match(historyFileRegex);
      if (match) {
        const userId = match[1];
        users.add(userId);
      }
    }
  }
  
  return users;
}

/**
 * Reads user metadata (chatId, parentId) from history file
 * @param {string} userId - User ID
 * @returns {{chatId: string, parentId: string}|null} - User metadata or null
 */
function readUserMetaFromFile(userId) {
  const fileName = getUserHistoryFileName(userId);
  
  if (!fs.existsSync(fileName)) {
    return null;
  }

  try {
    const content = fs.readFileSync(fileName, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('META:')) {
        const match = line.match(/chatId=(.+?),\s*parentId=(.+)/);
        if (match) {
          const chatId = match[1];
          const parentId = match[2];
          
          if (parentId === 'null') {
            return null;
          }
          
          return { chatId, parentId };
        }
      }
    }
    
    return null;
  } catch (err) {
    console.error(`Error reading history file for user ${userId}:`, err);
    return null;
  }
}

/**
 * Updates or adds META line in user history file
 * @param {string} userId - User ID
 * @param {string} chatId - Chat ID
 * @param {string} parentId - Parent ID
 */
function updateMetaInFile(userId, chatId, parentId) {
  const fileName = getUserHistoryFileName(userId);
  let existingContent = '';
  let needsWrite = true;

  if (fs.existsSync(fileName)) {
    try {
      existingContent = fs.readFileSync(fileName, 'utf8');
      
      if (existingContent.startsWith('META:')) {
        const updatedContent = `META: chatId=${chatId}, parentId=${parentId}\n` + 
                               existingContent.substring(existingContent.indexOf('\n') + 1);
        fs.writeFileSync(fileName, updatedContent, 'utf8');
        needsWrite = false;
      }
    } catch (err) {
      console.error(`Error updating META in file ${fileName}:`, err);
    }
  }

  if (needsWrite) {
    const metaLine = `META: chatId=${chatId}, parentId=${parentId}\n`;
    const finalContent = metaLine + existingContent;
    fs.writeFileSync(fileName, finalContent, 'utf8');
  }
}

/**
 * Appends a message to user history file
 * @param {string} userId - User ID
 * @param {string} role - Message role (user, assistant, system)
 * @param {string} content - Message content
 */
function appendToUserHistory(userId, role, content) {
  const fileName = getUserHistoryFileName(userId);
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${role.toUpperCase()}: ${content}\n`;
  
  fs.appendFileSync(fileName, logEntry, 'utf8');
}

/**
 * Checks if weather was already sent to user today
 * @param {string} userId - User ID
 * @returns {boolean} - True if already sent today
 */
function wasWeatherSentToday(userId) {
  const todayDate = new Date().toISOString().split('T')[0];
  const lastSentFile = path.join(config.logs.dir, `${userId}_weather_sent.txt`);
  
  if (!fs.existsSync(lastSentFile)) {
    return false;
  }
  
  const lastSentDate = fs.readFileSync(lastSentFile, 'utf8').trim();
  return lastSentDate === todayDate;
}

/**
 * Marks weather as sent to user for today
 * @param {string} userId - User ID
 */
function markWeatherAsSent(userId) {
  const todayDate = new Date().toISOString().split('T')[0];
  const lastSentFile = path.join(config.logs.dir, `${userId}_weather_sent.txt`);
  fs.writeFileSync(lastSentFile, todayDate);
}

// Initialize logs directory on module load
ensureLogsDir();

module.exports = {
  getUserHistoryFileName,
  loadKnownUsersFromLogs,
  readUserMetaFromFile,
  updateMetaInFile,
  appendToUserHistory,
  wasWeatherSentToday,
  markWeatherAsSent,
};
