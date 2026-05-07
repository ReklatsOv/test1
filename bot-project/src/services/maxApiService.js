const config = require('../config/config');

/**
 * Sends a chat action (e.g., "typing") to the chat
 * @param {string|number} chatId - Chat identifier
 * @param {string} action - Action type (typing_on, sending_photo, etc.)
 * @returns {Promise<Object>} - API response
 */
async function sendChatAction(chatId, action) {
  try {
    if (chatId === undefined || chatId === null) {
      throw new Error('chatId is not defined');
    }
    
    const chatIdStr = chatId.toString().trim();
    const url = `https://platform-api.max.ru/chats/${chatIdStr}/actions`;
    
    const token = process.env.BOT_TOKEN;
    if (!token) {
      throw new Error('BOT_TOKEN is not set in environment variables');
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token.trim(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: action })
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, body: ${errorBody}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending chat action:', error);
    throw error;
  }
}

/**
 * Checks if a message should trigger a bot response in group chat
 * @param {string} userMessageText - Message text
 * @param {Object} ctx - Bot context
 * @returns {boolean} - True if bot should respond
 */
function shouldRespondInGroup(userMessageText, ctx) {
  const mentionTrigger = config.bot.mentionTrigger;
  const containsMention = userMessageText && 
                          userMessageText.toLowerCase().includes(mentionTrigger.toLowerCase());

  const isReply = !!ctx.message.link && ctx.message.link.type === 'reply';
  
  let isReplyToBot = false;
  if (isReply) {
    const repliedToSenderUsername = ctx.message.link.sender.username;
    const repliedToSenderFirstName = ctx.message.link.sender.first_name;

    isReplyToBot = repliedToSenderUsername === config.bot.username || 
                   repliedToSenderFirstName === config.bot.firstName;
  }

  const shouldRespond = containsMention || isReplyToBot;
  
  console.log(`[DEBUG] Group chat. Contains mention: ${containsMention}, Is reply to bot: ${isReplyToBot}, Should respond: ${shouldRespond}`);
  
  return shouldRespond;
}

module.exports = {
  sendChatAction,
  shouldRespondInGroup,
};
