// Safely import socket.io-client
let io = null;
try {
  io = require('socket.io-client').io;
} catch (error) {
  // Socket.io-client not available - will use HTTP fallback
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, TOKEN_KEY } from '../config/api';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    try {
      console.log('🔌 SocketService: Starting connection attempt...');
      
      // Check if socket.io-client is available
      if (!io) {
        console.log('❌ SocketService: socket.io-client not available');
        return false;
      }

      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        console.log('❌ SocketService: No auth token found');
        return false;
      }

      if (this.socket && this.isConnected) {
        console.log('✅ SocketService: Already connected, reusing connection');
        return true;
      }

      console.log('🚀 SocketService: Creating new socket connection to:', API_URL);
      console.log('🔑 SocketService: Using auth token:', token ? 'Available' : 'Missing');

      this.socket = io(API_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        forceNew: true, // Force new connection
      });

      this.setupEventListeners();

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('⏰ SocketService: Connection timeout after 20 seconds');
          this.isConnected = false;
          resolve(false);
        }, 20000);

        this.socket.on('connect', () => {
          console.log('✅ SocketService: Connected successfully! Socket ID:', this.socket.id);
          clearTimeout(timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.log('❌ SocketService: Connection error:', error.message);
          console.log('🔍 SocketService: Error details:', {
            type: error.type,
            description: error.description,
            context: error.context,
            transport: error.transport
          });
          clearTimeout(timeout);
          this.isConnected = false;
          resolve(false);
        });
      });

    } catch (error) {
      console.log('❌ SocketService: Connect method error:', error);
      return false;
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_error', (error) => {
      this.reconnectAttempts++;
    });

    this.socket.on('error', (error) => {
      // Silent error handling
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.messageListeners.clear();
    }
  }

  // Chat room management
  joinChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_chat', chatId);
    }
  }

  leaveChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_chat', chatId);
    }
  }

  // Message handling
  sendMessage(chatId, content) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', { chatId, content });
      return true;
    }
    return false;
  }

  markAsRead(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_read', chatId);
    }
  }

  // Typing indicators
  startTyping(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', chatId);
    }
  }

  stopTyping(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', chatId);
    }
  }

  // Event listeners
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onNewMessageNotification(callback) {
    if (this.socket) {
      this.socket.on('new_message_notification', callback);
    }
  }

  onMessagesRead(callback) {
    if (this.socket) {
      this.socket.on('messages_read', callback);
    }
  }

  // Global chat system events
  onChatListUpdate(callback) {
    if (this.socket) {
      this.socket.on('chat_list_update', callback);
    }
  }

  onUnreadCountUpdate(callback) {
    if (this.socket) {
      this.socket.on('unread_count_update', callback);
    }
  }

  // Global message events for all chats
  onGlobalNewMessage(callback) {
    if (this.socket) {
      this.socket.on('global_new_message', callback);
    }
  }

  onGlobalMessagesRead(callback) {
    if (this.socket) {
      this.socket.on('global_messages_read', callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onUserStopTyping(callback) {
    if (this.socket) {
      this.socket.on('user_stop_typing', callback);
    }
  }

  onUserStatusChange(callback) {
    if (this.socket) {
      this.socket.on('user_status_change', callback);
    }
  }

  // Remove specific listeners
  removeListener(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
    }
  }

  // Status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
