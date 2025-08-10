import api from '../config/api';

export const messageService = {
  // Get chat list
  getChats: async () => {
    const response = await api.get('/messages/chats');
    return response.data;
  },

  // Get messages for a specific chat
  getMessages: async (chatId, page = 1, limit = 50) => {
    const response = await api.get(`/messages/${chatId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Send a message
  sendMessage: async (chatId, content) => {
    const response = await api.post(`/messages/${chatId}`, {
      content
    });
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
