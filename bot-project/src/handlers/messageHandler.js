const { Bot } = require('@maxhub/max-bot-api');
const OpenAI = require('openai');
const config = require('../config/config');
const logger = require('../utils/logger');
const weatherService = require('../services/weatherService');
const maxApiService = require('../services/maxApiService');

// Initialize OpenAI client
const openai = new OpenAI({
  baseURL: config.openai.baseURL,
  apiKey: config.openai.apiKey,
});

/**
 * Creates a bot instance with message handlers
 * @param {string} token - Bot token
 * @returns {Bot} - Bot instance
 */
function createBotInstance(token) {
  const bot = new Bot(token);

  bot.on('message_created', async (ctx) => {
    try {
      const chatInfo = await ctx.getChat();
      const ci = chatInfo.chat_id;
      const isGroupChat = chatInfo.type === 'chat';

      const userMessageText = ctx.message.body.text;
      const userId = ctx.user.user_id;
      const userName = ctx.user.display_name || `User${userId}`;

      // Show "typing" indicator before responding
      try {
        await maxApiService.sendChatAction(ci, "typing_on");
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Failed to send typing indicator:', error);
      }

      // Check if we should respond to this message
      let shouldRespond = true;

      if (isGroupChat) {
        shouldRespond = maxApiService.shouldRespondInGroup(userMessageText, ctx);
      }

      // Check if there's text and if we should respond
      if (!userMessageText || !shouldRespond) {
        if (!userMessageText) {
          console.log(`Received message without text from user ${userName}, ignoring.`);
        } else if (isGroupChat && !shouldRespond) {
          console.log(`Bot not mentioned and not reply target in group chat. Ignoring message from ${userName}.`);
        }
        return;
      }

      console.log(`Received message from user ${userName} (ID: ${userId}): ${userMessageText}`);

      // Get chatId and parentId from memory or file
      let parentId = global.userParentIds?.get(userId);
      let chatId = global.userChatIds?.get(userId);

      let isFirstMessageOfSession = false;
      
      if (parentId === undefined || chatId === undefined) {
        console.log(`chatId/parentId for user ${userId} not found in memory. Reading from file...`);
        const meta = logger.readUserMetaFromFile(userId);
        
        if (meta) {
          chatId = meta.chatId;
          parentId = meta.parentId;
          
          if (!global.userChatIds) global.userChatIds = new Map();
          if (!global.userParentIds) global.userParentIds = new Map();
          
          global.userChatIds.set(userId, chatId);
          global.userParentIds.set(userId, parentId);
          
          console.log(`Loaded from file for ${userId}: chatId=${chatId}, parentId=${parentId}`);
        } else {
          chatId = undefined;
          parentId = undefined;
          isFirstMessageOfSession = true;
          console.log(`No session found for user ${userId}. Initializing new session via proxy.`);
        }
      }

      // Prepare messages array
      let messages = [];
      
      if (isFirstMessageOfSession) {
        messages.push({
          role: "system",
          content: "Ты дружелюбный помощник и собеседник! Тебе написали первый раз - спроси вежливо как пользователя зовут и как к нему обращаться?"
        });
      }
      
      messages.push({ role: 'user', content: userMessageText });

      const requestOptions = {
        messages: messages,
        model: config.openai.model,
      };

      if (chatId !== undefined) {
        requestOptions.chatId = chatId;
        console.log(`Adding chatId to request: ${chatId}`);
      }
      
      if (parentId !== undefined) {
        requestOptions.parentId = parentId;
        console.log(`Adding parentId to request: ${parentId}`);
      } else {
        console.log(`Sending request without chatId and parentId. Initializing new session via proxy.`);
      }

      console.log(`Sending request to proxy in streaming mode...`);
      
      const streamOptions = {
        ...requestOptions,
        stream: true,
      };

      const stream = await openai.chat.completions.create(streamOptions);

      // Accumulators for response and metadata
      let aiResponse = '';
      let responseChatId = null;
      let responseParentId = null;
      let chunkCount = 0;
      
      // Buffer for chunk accumulation (send in ~1000 char portions)
      const CHUNK_BUFFER_SIZE = 1000;
      let sendBuffer = '';

      console.log(`Receiving AI response in streaming mode...`);

      // Show "typing" indicator before starting streaming
      try {
        await maxApiService.sendChatAction(ci, "typing_on");
      } catch (error) {
        console.error('Failed to send typing indicator:', error);
      }

      // Helper function to flush buffer
      const flushBuffer = async () => {
        if (sendBuffer.trim().length > 0) {
          try {
            await ctx.reply(sendBuffer, { format: 'markdown' });
            sendBuffer = '';
          } catch (error) {
            console.error(`Error sending buffer to user ${userId}:`, error);
          }
        }
      };

      // Process streaming response
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        
        // Extract chatId and parentId from first chunk (if present)
        if (chunk.chatId && !responseChatId) {
          responseChatId = chunk.chatId;
        }
        if (chunk.parentId && !responseParentId) {
          responseParentId = chunk.parentId;
        }
        
        if (content) {
          aiResponse += content;
          chunkCount++;
          sendBuffer += content;
          
          // Send if buffer has enough characters
          if (sendBuffer.length >= CHUNK_BUFFER_SIZE) {
            await flushBuffer();
          }
        }
      }

      // Send remaining buffer
      await flushBuffer();

      aiResponse = aiResponse.trim();

      // Check if AI returned a response
      if (!aiResponse || aiResponse.length === 0) {
        console.error(`AI did not return response for user ${userId}. Chat ID: ${responseChatId}, Parent ID: ${responseParentId}`);

        // Reset session - may have expired on MAX side
        if (global.userChatIds) global.userChatIds.delete(userId);
        if (global.userParentIds) global.userParentIds.delete(userId);

        // Mark history file as requiring new session
        logger.updateMetaInFile(userId, responseChatId || 'null', 'null');

        throw new Error('AI did not return response. Session reset, please try again.');
      }

      if (!responseChatId || !responseParentId) {
        throw new Error(`Proxy did not return required chatId or parentId for session continuation. Chat ID: ${responseChatId}, Parent ID: ${responseParentId}`);
      }

      console.log(`Received AI response (${chunkCount} chunks): ${aiResponse.substring(0, 100)}...`);
      console.log(`Proxy returned new Chat ID: ${responseChatId}, Parent ID: ${responseParentId}`);

      // Update global maps
      if (!global.userChatIds) global.userChatIds = new Map();
      if (!global.userParentIds) global.userParentIds = new Map();
      
      global.userChatIds.set(userId, responseChatId);
      global.userParentIds.set(userId, responseParentId);

      logger.updateMetaInFile(userId, responseChatId, responseParentId);

      // Log messages to history
      if (isFirstMessageOfSession) {
        logger.appendToUserHistory(userId, 'system', "Ты дружелюбный помощник и собеседник! Тебе написали первый раз - спроси вежливо как пользователя зовут и как к нему обращаться?");
      }
      logger.appendToUserHistory(userId, 'user', userMessageText);
      logger.appendToUserHistory(userId, 'assistant', aiResponse);

    } catch (error) {
      console.error('Error processing message:', error);
      try {
        await ctx.reply('Произошла ошибка при обработке вашего запроса.');
      } catch (replyError) {
        console.error('Error sending error message to user:', replyError);
      }
    }
  });

  return bot;
}

module.exports = {
  createBotInstance,
};
