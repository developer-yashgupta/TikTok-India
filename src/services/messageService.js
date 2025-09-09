import api from '../config/api';

export const messageService = {
  // Get chat list with pagination support
  getChats: async (options = {}) => {
    const {
      page = 1,
      limit = 50, // Show more chats by default
      search = ''
    } = options;

    const params = {
      page,
      limit
    };

    if (search) {
      params.search = search;
    }

    const response = await api.get('/messages/chats', { params });
    return response.data;
  },

  // Get recent chats only (for initial load)
  getRecentChats: async (limit = 20) => {
    const response = await api.get('/messages/chats/recent', {
      params: { limit }
    });
    return response.data;
  },

  // Get messages for a specific chat with pagination
  getMessages: async (chatId, options = {}) => {
    const {
      page = 1,
      limit = 30, // Reduced default limit for better performance
      before, // Cursor for loading older messages
      after,  // Cursor for loading newer messages
      sort = 'desc' // 'desc' for recent first, 'asc' for chronological
    } = options;

    const params = {
      page,
      limit,
      sort
    };

    // Add cursor parameters if provided
    if (before) params.before = before;
    if (after) params.after = after;

    const response = await api.get(`/messages/${chatId}`, { params });
    return response.data;
  },

  // Get recent messages only (for initial load)
  getRecentMessages: async (chatId, limit = 20) => {
    const response = await api.get(`/messages/${chatId}/recent`, {
      params: { limit }
    });
    return response.data;
  },

  // Get older messages (for pagination)
  getOlderMessages: async (chatId, beforeMessageId, limit = 20) => {
    const response = await api.get(`/messages/${chatId}`, {
      params: {
        before: beforeMessageId,
        limit,
        sort: 'desc'
      }
    });
    return response.data;
  },

  // Send a message
  sendMessage: async (chatId, content, replyTo) => {
    const body = { content };
    if (replyTo) body.replyTo = replyTo;
    const response = await api.post(`/messages/${chatId}`, body);
    return response.data;
  },

  // Create a new chat
  createChat: async (recipientId) => {
    const response = await api.post('/messages/chat', {
      recipientId
    });
    return response.data;
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  // Mark messages as read
  markAsRead: async (chatId) => {
    const response = await api.put(`/messages/${chatId}/read`);
    return response.data;
  },

  // Get unread message count
  getUnreadCount: async () => {
    const response = await api.get('/messages/unread/count');
    return response.data;
  }
};
