<<<<<<< HEAD

import React, { useState, useEffect, useRef, useCallback } from 'react';
=======
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
>>>>>>> master
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
<<<<<<< HEAD
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
=======
  Pressable,
  Animated,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { Clipboard } from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
>>>>>>> master
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../config/theme';
import { messageService } from '../../services/messageService';
import { useAuth } from '../../contexts/AuthContext';
import { formatMessageTime, groupMessagesByDate } from '../../utils/dateUtils';
<<<<<<< HEAD
import LoadingScreen from '../../components/shared/LoadingScreen';

=======

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
>>>>>>> master

// Safely import socket service with error handling
let socketService = null;
try {
  socketService = require('../../services/socketService').default;
} catch (error) {
<<<<<<< HEAD
  // Create a mock socket service for fallback
=======
  console.warn('SocketService not available, using fallback');
>>>>>>> master
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
<<<<<<< HEAD
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
=======

  // Core state
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);

  // UI state
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Socket & typing state
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // Pagination state
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState(null);
  const [hasReachedTop, setHasReachedTop] = useState(false);

  // Animation refs
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const messageEntranceAnim = useRef(new Animated.Value(0)).current;
  const typingDotsAnim = useRef(new Animated.Value(0)).current;

  // Initialize screen with animations
  useEffect(() => {
    initializeScreen();
    return cleanup;
  }, []);

  const initializeScreen = async () => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Setup navigation header
    setupNavigationHeader();

    // Initialize socket and load messages
    await initializeSocket();
    await loadInitialMessages();
    markMessagesAsRead();
  };

  const cleanup = () => {
    try {
      if (socketService) {
        socketService.leaveChat(chatId);
        cleanupSocketListeners();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  const setupNavigationHeader = () => {
    navigation.setOptions({
      headerTitle: () => (
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity
            style={styles.headerContainer}
            onPress={handleProfilePress}
            activeOpacity={0.8}
          >
            <View style={styles.avatarContainer}>
              <Image
                source={{ 
                  uri: recipient?.avatar || 'https://via.placeholder.com/40'
                }}
                style={styles.headerAvatar}
              />
              {isOnline && <View style={styles.onlineIndicator} />}
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerName} numberOfLines={1}>
                {recipient?.displayName || recipient?.username || 'User'}
              </Text>
              {otherUserTyping ? (
                <Animated.View style={[styles.typingContainer, { opacity: typingDotsAnim }]}>
                  <Text style={styles.typingText}>typing</Text>
                  <TypingIndicator />
                </Animated.View>
              ) : (
                <Text style={styles.headerStatus}>
                  {isSocketConnected ? 'Online' : 'Last seen recently'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      ),
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton} onPress={handleVideoCall}>
            <Ionicons name="videocam-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton} onPress={handleVoiceCall}>
            <Ionicons name="call-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      ),
    });
  };

  // Socket initialization and management
  const initializeSocket = async () => {
    try {
      if (socketService && typeof socketService.connect === 'function') {
        const connected = await socketService.connect();
        setIsSocketConnected(connected);
        
        if (connected) {
          socketService.joinChat(chatId);
          setupSocketListeners();
        }
      }
    } catch (error) {
      console.error('Socket initialization error:', error);
      setIsSocketConnected(false);
    }
  };

  // Remove the useCallback wrapper and dependencies that cause listener recreation
  const setupSocketListeners = () => {
    if (!socketService || !isSocketConnected) return;

    try {
      // Clean up existing listeners first
      socketService.removeAllListeners('new_message');
      socketService.removeAllListeners('messages_read');
      socketService.removeAllListeners('user_typing');
      socketService.removeAllListeners('user_stop_typing');

      // New message listener - use functional updates to avoid stale closure issues
      socketService.onNewMessage((data) => {
        // Handle different possible data structures
        let messageData = null;
        let targetChatId = null;
        
        if (data && data.success && data.data) {
          // Structure: { success: true, data: { message data } }
          messageData = data.data;
          targetChatId = data.data.chatId;
        } else if (data && data.chatId) {
          // Direct message structure: { chatId, content, sender, ... }
          messageData = data;
          targetChatId = data.chatId;
        } else if (data && data.message) {
          // Nested message structure: { message: { actual message } }
          messageData = data.message;
          targetChatId = data.message.chatId;
        }
        
        if (messageData && targetChatId === chatId) {
          setMessages(prevMessages => {
            const exists = prevMessages.some(msg => msg._id === messageData._id);
            
            if (!exists && !messageData.isDeleted) {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              const newMessages = [...prevMessages, messageData];
              
              // Auto scroll to bottom for new messages
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
              
              return newMessages;
            }
            return prevMessages;
          });
          
          // Automatically mark as read since user is in the chat
          if (socketService && socketService.markAsRead) {
            socketService.markAsRead(chatId);
          }
        }
      });

      // Read receipts listener - this is crucial for real-time read receipts
      socketService.onMessagesRead((data) => {
        if (data.chatId === chatId) {
          // Use functional update to avoid stale closure
          setMessages(prev => prev.map(msg => {
            const senderId = typeof msg.sender === 'object' 
              ? msg.sender._id?.toString() 
              : msg.sender;
            const currentUserId = user?._id?.toString();
            const isOwnMessage = senderId === currentUserId;

            if (isOwnMessage && !msg.read) {
              return {
                ...msg,
                read: true,
                readAt: new Date()
              };
            }
            return msg;
>>>>>>> master
          }));
        }
      });

<<<<<<< HEAD
      // Listen for typing indicators
      socketService.onUserTyping((data) => {
        if (data.userId !== user?._id) {
          setOtherUserTyping(true);
          // Clear typing after 3 seconds
          setTimeout(() => setOtherUserTyping(false), 3000);
=======
      // Typing indicators
      socketService.onUserTyping((data) => {
        if (data.userId !== user?._id) {
          setOtherUserTyping(true);
          startTypingAnimation();
          
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setOtherUserTyping(false);
            stopTypingAnimation();
          }, 3000);
>>>>>>> master
        }
      });

      socketService.onUserStopTyping((data) => {
        if (data.userId !== user?._id) {
          setOtherUserTyping(false);
<<<<<<< HEAD
        }
      });
    } catch (error) {
      // Silent error handling
    }
  }, [chatId, user?._id, isSocketConnected]);
=======
          stopTypingAnimation();
        }
      });


    } catch (error) {
      // Socket listeners error
    }
  };
>>>>>>> master

  const cleanupSocketListeners = useCallback(() => {
    try {
      if (socketService && typeof socketService.removeAllListeners === 'function') {
        socketService.removeAllListeners('new_message');
        socketService.removeAllListeners('messages_read');
        socketService.removeAllListeners('user_typing');
        socketService.removeAllListeners('user_stop_typing');
      }
    } catch (error) {
<<<<<<< HEAD
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
=======
      // Socket cleanup error
    }
  }, []);

  // Message handling
  const loadInitialMessages = async () => {
    try {
      setLoading(true);
      const response = await messageService.getRecentMessages(chatId, 30);
      
      if (response.success) {
        const recentMessages = response.data.messages || [];
        const filteredMessages = recentMessages.filter(msg => !msg.isDeleted);
        
        // Backend returns messages in chronological order (oldest to newest)
        // This is perfect for FlatList - newest messages appear at bottom
        setMessages(filteredMessages);
        
        if (filteredMessages.length > 0) {
          // Set the OLDEST message ID for "Load More" functionality
          setOldestMessageId(filteredMessages[0]._id);
          setCanLoadMore(response.data.hasMore || filteredMessages.length === 30);
        }
        
        // Animate messages entrance
        Animated.stagger(50, 
          filteredMessages.map((_, index) => 
            Animated.timing(messageEntranceAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            })
          )
        ).start();
>>>>>>> master
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
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
=======
  const loadOlderMessages = async () => {
    if (!canLoadMore || loadingOlder || !oldestMessageId || hasReachedTop) return;

    try {
      setLoadingOlder(true);
      const response = await messageService.getOlderMessages(chatId, oldestMessageId, 20);
      
      if (response.success) {
        const olderMessages = response.data.messages || [];
        const filteredOlderMessages = olderMessages.filter(msg => !msg.isDeleted);

        if (filteredOlderMessages.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(msg => msg._id));
            const newMessages = filteredOlderMessages.filter(msg => !existingIds.has(msg._id));
            return [...newMessages, ...prev]; // Prepend older messages
          });

          // Update oldestMessageId to the FIRST (oldest) message from the new batch
          setOldestMessageId(filteredOlderMessages[0]._id);
          setCanLoadMore(filteredOlderMessages.length === 20);
        } else {
          setCanLoadMore(false);
          setHasReachedTop(true);
        }
      }
    } catch (error) {
      // Error loading older messages
    } finally {
      setLoadingOlder(false);
    }
  };

  // Helper function for adding messages (used for optimistic updates)
  const addOptimisticMessage = (message) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    setMessages(prev => {
      const exists = prev.some(msg => msg._id === message._id);
      if (!exists && !message.isDeleted) {
        return [...prev, message];
      }
      return prev;
    });

    // Auto scroll to bottom for new messages
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const messageContent = inputText.trim();
    const tempId = Date.now().toString();
    
    // Optimistic update
    const tempMessage = {
      _id: tempId,
      content: messageContent,
      sender: user._id,
      chatId,
      createdAt: new Date().toISOString(),
      read: false,
      isTemp: true,
    };

    setInputText('');
    setIsSending(true);
    addOptimisticMessage(tempMessage);

    try {
      // Try socket first
      if (isSocketConnected && socketService?.sendMessage) {
        const sent = socketService.sendMessage(chatId, messageContent, replyTo?._id);
        if (sent) {
          // Remove temp message and add real one
          setMessages(prev => prev.filter(msg => msg._id !== tempId));
          if (replyTo) setReplyTo(null);
          return;
        }
      }

      // Fallback to HTTP
      const response = await messageService.sendMessage(chatId, messageContent, replyTo?._id);
      
      if (response.success) {
        // Replace temp message with real one
        setMessages(prev => prev.map(msg => 
          msg._id === tempId ? response.data : msg
        ));
        if (replyTo) setReplyTo(null);
      } else {
        // Remove temp message on failure
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
        throw new Error(response.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      // Remove temp message and restore input
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      setInputText(messageContent);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
>>>>>>> master
    }
  };

  const handleTextChange = (text) => {
    setInputText(text);
<<<<<<< HEAD

=======
    
>>>>>>> master
    // Handle typing indicators
    if (isSocketConnected && socketService) {
      try {
        if (text.trim() && !isTyping) {
          setIsTyping(true);
<<<<<<< HEAD
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
=======
          socketService.startTyping?.(chatId);
        } else if (!text.trim() && isTyping) {
          setIsTyping(false);
          socketService.stopTyping?.(chatId);
        }

        // Auto-stop typing after 2 seconds of no activity
>>>>>>> master
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

<<<<<<< HEAD
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
=======
        if (text.trim()) {
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socketService.stopTyping?.(chatId);
          }, 2000);
        }
      } catch (error) {
        console.error('Typing indicator error:', error);
>>>>>>> master
      }
    }
  };

<<<<<<< HEAD
=======
  const updateMessageReadStatus = () => {
    setMessages(prev => prev.map(msg => {
      const senderId = typeof msg.sender === 'object' 
        ? msg.sender._id?.toString() 
        : msg.sender;
      const currentUserId = user?._id?.toString();
      const isOwnMessage = senderId === currentUserId;

      // For read receipt events, we want to mark OUR sent messages as read by recipient
      // This function is called when we receive a 'messages_read' socket event
      // which means the other user has read our messages
      if (isOwnMessage && !msg.read) {
        return {
          ...msg,
          read: true,
          readAt: new Date()
        };
      }

      return msg;
    }));
  };

  const markMessagesAsRead = async () => {
    try {
      await messageService.markAsRead(chatId);
      updateMessageReadStatus();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Animation helpers
  const startTypingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingDotsAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(typingDotsAnim, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopTypingAnimation = () => {
    typingDotsAnim.stopAnimation();
    typingDotsAnim.setValue(0);
  };

  // Event handlers
  const handleProfilePress = () => {
    navigation.navigate('ViewProfile', { userId: recipient._id });
  };

  const handleVideoCall = () => {
    Alert.alert('Video Call', 'Video call feature coming soon!');
  };

  const handleVoiceCall = () => {
    Alert.alert('Voice Call', 'Voice call feature coming soon!');
  };

>>>>>>> master
  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;
    setShowScrollToBottom(!isAtBottom);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollToBottom(false);
  };

<<<<<<< HEAD
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
=======
  const handleMessageLongPress = (message) => {
    const isOwnMessage = (typeof message.sender === 'object' 
      ? message.sender._id?.toString() 
      : message.sender) === user?._id?.toString();

    const actions = [
      { text: 'Reply', onPress: () => startReply(message) },
      { text: 'Copy', onPress: () => copyMessage(message.content) },
    ];

    if (isOwnMessage) {
      actions.push({ text: 'Delete', onPress: () => deleteMessage(message._id) });
    }

    actions.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Message Options', '', actions);
  };

  const startReply = (message) => {
    setReplyTo({
      _id: message._id,
      content: message.content,
      sender: typeof message.sender === 'object' ? message.sender.username : 'User'
    });
  };

  const clearReply = () => {
    setReplyTo(null);
  };

  const copyMessage = async (text) => {
    try {
      await Clipboard.setString(text);
      Alert.alert('Copied', 'Message copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy message');
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const response = await messageService.deleteMessage(messageId);
      if (response.success) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  // Focus effect for marking messages as read and setting up real-time updates
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const setupRealTimeUpdates = async () => {
        // Mark messages as read when screen comes into focus
        if (isMounted) {
          try {
            await markMessagesAsRead();
          } catch (error) {
            console.error('Error marking messages as read on focus:', error);
          }
        }

        // Ensure socket connection is active
        if (!isSocketConnected && isMounted) {
          try {
            await initializeSocket();
          } catch (error) {
            console.error('Error reconnecting socket:', error);
          }
        } else if (isSocketConnected) {
          // Re-setup listeners to ensure they're active
          setupSocketListeners();
        }
      };

      setupRealTimeUpdates();

      // Message polling fallback if socket fails
      const pollForNewMessages = async () => {
        if (!isMounted || isSocketConnected) return; // Skip if socket is working
        
        try {
          const response = await messageService.getRecentMessages(chatId, 10);
          
          if (response.success && response.data.messages) {
            const latestMessages = response.data.messages.filter(msg => !msg.isDeleted);
            
            setMessages(prevMessages => {
              // Find truly new messages
              const existingIds = new Set(prevMessages.map(msg => msg._id));
              const newMessages = latestMessages.filter(msg => !existingIds.has(msg._id));
              
              if (newMessages.length > 0) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                
                // Auto scroll to bottom for new messages
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
                
                return [...prevMessages, ...newMessages];
              }
              
              return prevMessages;
            });
          }
        } catch (error) {
          console.error('Error polling for messages:', error);
        }
      };

      // Periodic refresh to ensure we have latest messages and read receipts
      const refreshInterval = setInterval(() => {
        if (isMounted) {
          // Poll for new messages if socket is not connected
          if (!isSocketConnected) {
            pollForNewMessages();
          } else {
            // Just update read status if socket is working
            try {
              updateMessageReadStatus();
            } catch (error) {
              console.error('Error in periodic refresh:', error);
            }
          }
        }
      }, 3000); // Every 3 seconds

      return () => {
        isMounted = false;
        clearInterval(refreshInterval);
      };
    }, [isSocketConnected]) // Removed messages.length to prevent constant re-creation
  );

  // Render functions
  const renderMessage = useCallback(({ item, index }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateSeparator}>
          <View style={styles.dateLine} />
          <Text style={styles.dateText}>{item.dateText}</Text>
          <View style={styles.dateLine} />
        </View>
      );
    }

    const isOwnMessage = (typeof item.sender === 'object' 
      ? item.sender._id?.toString() 
      : item.sender) === user?._id?.toString();

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        onLongPress={() => handleMessageLongPress(item)}
        onReply={() => startReply(item)}
      />
    );
  }, [user?._id]);

  const messagesWithDates = useMemo(() => {
    return groupMessagesByDate(messages);
  }, [messages]);

  // Loading screen
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
      >
        <Animated.View 
          style={[
            styles.messagesContainer,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }]
            }
          ]}
        >
          <FlatList
            ref={flatListRef}
            data={messagesWithDates}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id || item.id}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.messagesList}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
            }}
            initialScrollIndex={messagesWithDates.length > 0 ? messagesWithDates.length - 1 : 0}
            getItemLayout={(data, index) => ({
              length: 80, // Approximate height per message
              offset: 80 * index,
              index,
            })}
            ListHeaderComponent={() => {
              // Show at the beginning of the list (top when scrolled up)
              if (hasReachedTop && messages.length > 0) {
                return (
                  <View style={styles.reachedTopContainer}>
                    <Text style={styles.reachedTopText}>
                      🎉 You've reached the beginning of this conversation
                    </Text>
                  </View>
                );
              }
              
              if (canLoadMore && messages.length > 0 && !loading) {
                return (
                  <View style={styles.loadMoreContainer}>
                    <TouchableOpacity 
                      style={styles.loadMoreButton} 
                      onPress={loadOlderMessages}
                      disabled={loadingOlder}
                    >
                      {loadingOlder ? (
                        <>
                          <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loadMoreSpinner} />
                          <Text style={styles.loadMoreText}>Loading...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="chevron-up" size={16} color={theme.colors.primary} style={styles.loadMoreIcon} />
                          <Text style={styles.loadMoreText}>Load More Messages</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              }
              
              return null;
            }}
          />

          {/* Scroll to bottom button */}
          {showScrollToBottom && (
            <Animated.View 
              style={[styles.scrollToBottomButton, { opacity: fadeAnim }]}
            >
              <TouchableOpacity onPress={scrollToBottom}>
                <Ionicons name="chevron-down" size={24} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        {/* Reply banner */}
        {replyTo && (
          <Animated.View 
            style={[styles.replyBanner, { opacity: fadeAnim }]}
          >
            <View style={styles.replyIndicator} />
            <View style={styles.replyContent}>
              <Text style={styles.replyToText}>Reply to {replyTo.sender}</Text>
              <Text style={styles.replyMessageText} numberOfLines={1}>
                {replyTo.content}
              </Text>
            </View>
            <TouchableOpacity onPress={clearReply} style={styles.clearReplyButton}>
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Input container */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TouchableOpacity 
              style={styles.emojiButton}
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Ionicons 
                name={showEmojiPicker ? "keypad" : "happy-outline"} 
                size={24} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>

            <View style={styles.textInputContainer}>
              <TextInput
                style={[styles.textInput, { height: Math.max(40, inputHeight) }]}
                value={inputText}
                onChangeText={handleTextChange}
                placeholder="Type a message..."
                placeholderTextColor={theme.colors.placeholder}
                multiline
                maxLength={1000}
                onContentSizeChange={(event) => {
                  setInputHeight(event.nativeEvent.contentSize.height);
                }}
                returnKeyType="default"
                blurOnSubmit={false}
              />
            </View>

            <TouchableOpacity 
              style={[
                styles.sendButton,
                { backgroundColor: inputText.trim() ? theme.colors.primary : theme.colors.border }
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons 
                  name="send" 
                  size={20} 
                  color="#fff" 
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
};

// Message Bubble Component
const MessageBubble = React.memo(({ message, isOwnMessage, onLongPress, onReply }) => {
  const bubbleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(bubbleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, []);

  return (
    <Swipeable
      renderRightActions={() => (
        <TouchableOpacity style={styles.replySwipeAction} onPress={onReply}>
          <Ionicons name="arrow-undo" size={24} color="#fff" />
        </TouchableOpacity>
      )}
      enabled={!isOwnMessage}
    >
      <Animated.View
        style={[
          styles.messageRow,
          { 
            opacity: bubbleAnim,
            transform: [{ scale: bubbleAnim }]
          }
        ]}
      >
        <Pressable
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble
          ]}
          onLongPress={onLongPress}
        >
          <Text style={[
            styles.messageText,
            { color: isOwnMessage ? '#fff' : theme.colors.text }
          ]}>
            {message.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.timestamp,
              { color: isOwnMessage ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary }
            ]}>
              {formatMessageTime(message.createdAt)}
            </Text>
            {isOwnMessage && (
              <Ionicons
                name={message.read ? "checkmark-done" : "checkmark"}
                size={14}
                color={message.read ? "#4FC3F7" : "rgba(255,255,255,0.8)"}
                style={styles.readIcon}
              />
            )}
          </View>
        </Pressable>
      </Animated.View>
    </Swipeable>
  );
});

// Typing Indicator Component
const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createDotAnimation = (dot, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createDotAnimation(dot1, 0),
      createDotAnimation(dot2, 150),
      createDotAnimation(dot3, 300),
    ]).start();
  }, []);

  return (
    <View style={styles.typingDots}>
      <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
    </View>
>>>>>>> master
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
<<<<<<< HEAD
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

=======
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: theme.colors.text,
    marginTop: 16,
    fontSize: 16,
  },
  // Header styles
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  avatarContainer: {
    position: 'relative',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#000',
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerStatus: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    color: theme.colors.primary,
    fontSize: 13,
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    marginHorizontal: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  
  // Messages container
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  
  // Date separator
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dateText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 12,
  },
  
  // Message bubbles
  messageRow: {
    marginVertical: 2,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  ownBubble: {
    backgroundColor: theme.colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: '#1e1e1e',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
>>>>>>> master
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
<<<<<<< HEAD
    marginTop: theme.spacing.xs,
  },
  messageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: theme.typography.caption.fontSize,
=======
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
>>>>>>> master
  },
  readIcon: {
    marginLeft: 4,
  },
<<<<<<< HEAD
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
=======
  
  // Reply swipe action
  replySwipeAction: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 2,
    borderRadius: 20,
  },
  
  // Scroll to bottom button
  scrollToBottomButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
>>>>>>> master
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
<<<<<<< HEAD
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
=======
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  
  // Load More button and reached top styles
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  loadMoreText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loadMoreIcon: {
    marginRight: 8,
  },
  loadMoreSpinner: {
    marginRight: 8,
  },
  reachedTopContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  reachedTopText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Reply banner
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  replyIndicator: {
    width: 4,
    height: 40,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
    marginRight: 12,
  },
  replyContent: {
    flex: 1,
  },
  replyToText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  replyMessageText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  clearReplyButton: {
    padding: 8,
  },
  
  // Input container
  inputContainer: {
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
  },
  emojiButton: {
    padding: 8,
    marginRight: 8,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textInput: {
    color: theme.colors.text,
    fontSize: 16,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
>>>>>>> master
  },
});

export default DirectMessagingScreen;
<<<<<<< HEAD

=======
>>>>>>> master
