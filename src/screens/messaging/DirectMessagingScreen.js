
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../config/theme';
import { messageService } from '../../services/messageService';
import { useAuth } from '../../contexts/AuthContext';
import { formatMessageTime, groupMessagesByDate } from '../../utils/dateUtils';
import LoadingScreen from '../../components/shared/LoadingScreen';


// Safely import socket service with error handling
let socketService = null;
try {
  socketService = require('../../services/socketService').default;
} catch (error) {
  // Create a mock socket service for fallback
  socketService = {
    connect: () => Promise.resolve(false),
    disconnect: () => {},
    joinChat: () => {},
    leaveChat: () => {},
    sendMessage: () => false,
    markAsRead: () => {},
    startTyping: () => {},
    stopTyping: () => {},
    onNewMessage: () => {},
    onNewMessageNotification: () => {},
    onMessagesRead: () => {},
    onUserTyping: () => {},
    onUserStopTyping: () => {},
    removeListener: () => {},
    removeAllListeners: () => {},
    getConnectionStatus: () => ({ isConnected: false })
  };
}

const DirectMessagingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { chatId, recipient } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection and setup
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        if (socketService && typeof socketService.connect === 'function') {
          const connected = await socketService.connect();
          setIsSocketConnected(connected);

          if (connected) {
            socketService.joinChat(chatId);
            setupSocketListeners();
          }
        } else {
          setIsSocketConnected(false);
        }
      } catch (error) {
        setIsSocketConnected(false);
      }
    };

    initializeSocket();

    return () => {
      try {
        if (socketService) {
          socketService.leaveChat(chatId);
          cleanupSocketListeners();
        }
      } catch (error) {
        // Silent cleanup
      }
    };
  }, [chatId]);

  // Navigate to user profile
  const handleProfilePress = () => {
    navigation.navigate('ViewProfile', { userId: recipient._id });
  };

  // Component mount and header setup
  useEffect(() => {

    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          style={styles.headerTitle}
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: recipient.avatar }}
            style={styles.avatar}
          />
          <View style={styles.headerTextContainer}>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerText}>{recipient.username}</Text>
              <MaterialIcons
                name="chevron-right"
                size={16}
                color="rgba(255, 255, 255, 0.6)"
                style={styles.chevronIcon}
              />
            </View>
            {otherUserTyping && (
              <Text style={styles.typingIndicator}>typing...</Text>
            )}
          </View>
        </TouchableOpacity>
      ),
    });

    fetchMessages();
    markMessagesAsRead();

    // Fallback polling for when socket is not connected
    const interval = setInterval(() => {
      if (!isSocketConnected) {
        fetchMessages();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [chatId, otherUserTyping, isSocketConnected]);

  // Mark messages as read when screen becomes focused
  useFocusEffect(
    useCallback(() => {
      if (messages.length > 0) {
        markMessagesAsRead();
      }
    }, [messages.length])
  );

  // Socket event listeners setup
  const setupSocketListeners = useCallback(() => {
    try {
      if (!socketService || !isSocketConnected) {
        return;
      }

      // Listen for new messages
      socketService.onNewMessage((data) => {
        if (data.success && data.data.chatId === chatId) {
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(msg => msg._id === data.data._id);
            if (!exists) {
              const newMessages = [...prev, data.data];
              return newMessages;
            }
            return prev;
          });

          // Mark as read if chat is active
          socketService.markAsRead(chatId);
        }
      });

      // Listen for read receipts
      socketService.onMessagesRead((data) => {
        if (data.chatId === chatId) {
          // Update read status for messages sent by current user
          setMessages(prev => prev.map(msg => {
            const senderId = typeof msg.sender === 'object'
              ? (msg.sender._id?.toString() || msg.sender.id?.toString())
              : msg.sender;
            const currentUserId = (user?._id || user?.id)?.toString();
            const isOwnMessage = senderId === currentUserId;

            return {
              ...msg,
              read: isOwnMessage ? true : msg.read,
              readAt: isOwnMessage && !msg.read ? new Date() : msg.readAt
            };
          }));
        }
      });

      // Listen for typing indicators
      socketService.onUserTyping((data) => {
        if (data.userId !== user?._id) {
          setOtherUserTyping(true);
          // Clear typing after 3 seconds
          setTimeout(() => setOtherUserTyping(false), 3000);
        }
      });

      socketService.onUserStopTyping((data) => {
        if (data.userId !== user?._id) {
          setOtherUserTyping(false);
        }
      });
    } catch (error) {
      // Silent error handling
    }
  }, [chatId, user?._id, isSocketConnected]);

  const cleanupSocketListeners = useCallback(() => {
    try {
      if (socketService && typeof socketService.removeAllListeners === 'function') {
        socketService.removeAllListeners('new_message');
        socketService.removeAllListeners('messages_read');
        socketService.removeAllListeners('user_typing');
        socketService.removeAllListeners('user_stop_typing');
      }
    } catch (error) {
      // Silent cleanup
    }
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await messageService.getMessages(chatId);
      if (response.success) {
        const newMessages = response.data || [];
        const previousLength = messages.length;



        setMessages(newMessages);

        if (isInitialLoad) {
          setIsInitialLoad(false);
        }

        // Mark messages as read if new messages arrived
        if (newMessages.length > previousLength) {
          markMessagesAsRead();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await messageService.markAsRead(chatId);

      // Update local state to reflect read status for received messages
      setMessages(prevMessages =>
        prevMessages.map(msg => {
          // Only update read status for messages sent by others (received messages)
          const senderId = typeof msg.sender === 'object'
            ? (msg.sender._id?.toString() || msg.sender.id?.toString())
            : msg.sender;
          const currentUserId = (user?._id || user?.id)?.toString();
          const isSentByOthers = senderId !== currentUserId;
          return {
            ...msg,
            read: isSentByOthers ? true : msg.read
          };
        })
      );
    } catch (error) {
      // Silent error handling
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const messageContent = inputText.trim();
    setInputText('');

    try {
      // Try socket first for real-time delivery
      if (isSocketConnected && socketService && typeof socketService.sendMessage === 'function') {
        try {
          const sent = socketService.sendMessage(chatId, messageContent);
          if (sent) {
            return;
          }
        } catch (socketError) {
          // Fall back to HTTP
        }
      }

      // Fallback to HTTP API
      const response = await messageService.sendMessage(chatId, messageContent);

      if (response.success) {
        setMessages(prev => {
          // Check if message already exists (from socket)
          const exists = prev.some(msg => msg._id === response.data._id);
          if (!exists) {
            return [...prev, response.data];
          }
          return prev;
        });

        // Scroll to bottom with animation for new messages
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
      // Restore the message text on error
      setInputText(messageContent);
    }
  };

  const handleTextChange = (text) => {
    setInputText(text);

    // Handle typing indicators
    if (isSocketConnected && socketService) {
      try {
        if (text.trim() && !isTyping) {
          setIsTyping(true);
          if (typeof socketService.startTyping === 'function') {
            socketService.startTyping(chatId);
          }
        } else if (!text.trim() && isTyping) {
          setIsTyping(false);
          if (typeof socketService.stopTyping === 'function') {
            socketService.stopTyping(chatId);
          }
        }

        // Clear typing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 2 seconds of inactivity
        if (text.trim()) {
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            if (typeof socketService.stopTyping === 'function') {
              socketService.stopTyping(chatId);
            }
          }, 2000);
        }
      } catch (error) {
        // Silent error handling
      }
    }
  };

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;
    setShowScrollToBottom(!isAtBottom);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollToBottom(false);
  };

  // Get messages with date separators using utility function
  const getMessagesWithDateSeparators = () => {
    return groupMessagesByDate(messages);
  };

  // Render date separator
  const renderDateSeparator = (dateText) => (
    <View style={styles.dateSeparatorContainer}>
      <View style={styles.dateSeparatorLine} />
      <Text style={styles.dateSeparatorText}>{dateText}</Text>
      <View style={styles.dateSeparatorLine} />
    </View>
  );

  const renderItem = ({ item }) => {
    // Render date separator
    if (item.type === 'date') {
      return renderDateSeparator(item.dateText);
    }

    // Render message
    // Enhanced message alignment logic to handle different response formats
    let senderId;

    if (typeof item.sender === 'object' && item.sender !== null) {
      // Populated sender object - handle both _id and id fields
      senderId = item.sender._id?.toString() || item.sender.id?.toString();
    } else if (typeof item.sender === 'string') {
      // Just sender ID string
      senderId = item.sender;
    } else {
      senderId = null;
    }

    // Handle current user ID - convert to string for comparison
    const currentUserId = (user?._id || user?.id)?.toString();
    const isOwnMessage = senderId === currentUserId;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {item.content}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>
            {formatMessageTime(item.createdAt)}
          </Text>
          {isOwnMessage && (
            <MaterialIcons
              name={item.read ? "done-all" : "done"}
              size={16}
              color={item.read ? theme.colors.primary : 'rgba(255, 255, 255, 0.7)'}
              style={styles.readIcon}
            />
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading messages..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >


      <FlatList
        ref={flatListRef}
        data={getMessagesWithDateSeparators()}
        renderItem={renderItem}
        keyExtractor={item => item.id || item._id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      />

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={scrollToBottom}
        >
          <MaterialIcons name="keyboard-arrow-down" size={24} color="white" />
        </TouchableOpacity>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <MaterialIcons
            name="send"
            size={24}
            color={inputText.trim() ? theme.colors.primary : theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.xs,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: theme.spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    fontWeight: 'bold',
  },
  chevronIcon: {
    marginLeft: 4,
  },
  typingIndicator: {
    color: theme.colors.primary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  messagesList: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: theme.spacing.xs,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    minWidth: 60, // Ensure minimum width for small messages
  },
  ownMessage: {
    alignSelf: 'flex-end',        // 👈 RIGHT SIDE for sent messages
    backgroundColor: theme.colors.primary,
    marginLeft: '20%', // Force right alignment
  },
  otherMessage: {
    alignSelf: 'flex-start',      // 👈 LEFT SIDE for received messages
    backgroundColor: theme.colors.primary,
    marginRight: '20%', // Force left alignment
  },
  messageText: {
    fontSize: theme.typography.body.fontSize,
  },
  ownMessageText: {
    color: 'white', // White text for sent messages
  },
  otherMessageText: {
    color: theme.colors.text, // Theme text color for received messages
  },

  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.xs,
  },
  messageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: theme.typography.caption.fontSize,
  },
  readIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    color: theme.colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  scrollToBottomButton: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dateSeparatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dateSeparatorText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '500',
    marginHorizontal: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingVertical: 4,
  },
});

export default DirectMessagingScreen;

