import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { messageService } from '../../services/messageService';
import { formatChatTime } from '../../utils/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socketService';

const ChatListScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadChats = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const response = await messageService.getChats();

      if (response.success) {
        const chatData = response.data || [];
        setChats(chatData);
        setFilteredChats(chatData);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      Alert.alert('Error', `Failed to load chats: ${error.response?.data?.msg || error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadChats();

      // Setup socket listeners for real-time updates
      const handleNewMessageNotification = (data) => {
        // Refresh chat list to update last message and unread count
        loadChats(false);
      };

      socketService.onNewMessageNotification(handleNewMessageNotification);

      return () => {
        socketService.removeListener('new_message_notification', handleNewMessageNotification);
      };
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadChats(false);
  }, []);

  // Search functionality
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter(chat =>
        chat.otherUser.username.toLowerCase().includes(query.toLowerCase()) ||
        chat.otherUser.displayName?.toLowerCase().includes(query.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [chats]);

  const handleChatPress = async (chat) => {
    // Mark messages as read when opening chat
    try {
      if (chat.unreadCount > 0) {
        await messageService.markAsRead(chat.chatId);
        // Update local state to reflect read status
        const updatedChats = chats.map(c =>
          c.chatId === chat.chatId ? { ...c, unreadCount: 0 } : c
        );
        setChats(updatedChats);
        setFilteredChats(updatedChats);
      }
    } catch (error) {
      // Silent error handling
    }

    navigation.navigate('DirectMessage', {
      chatId: chat.chatId,
      recipient: {
        _id: chat.otherUser._id,
        username: chat.otherUser.username,
        displayName: chat.otherUser.displayName,
        avatar: chat.otherUser.avatar,
      },
    });
  };

  // Use utility function for consistent time formatting

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item)}
    >
      <Image
        source={{ uri: item.otherUser.avatar || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.username}>
            {item.otherUser.displayName || item.otherUser.username}
          </Text>
          <Text style={styles.timestamp}>
            {formatChatTime(item.timestamp)}
          </Text>
        </View>
        <View style={styles.messageRow}>
          <View style={styles.messageContent}>
            {item.lastMessage?.isFromCurrentUser && (
              <MaterialIcons
                name={item.lastMessage.read ? "done-all" : "done"}
                size={16}
                color={item.lastMessage.read ? theme.colors.primary : theme.colors.textSecondary}
                style={styles.readIcon}
              />
            )}
            <Text
              style={[
                styles.lastMessage,
                item.unreadCount > 0 && !item.lastMessage?.isFromCurrentUser && styles.unreadMessage
              ]}
              numberOfLines={1}
            >
              {item.lastMessage?.content || item.lastMessage}
            </Text>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color={theme.colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => handleSearch('')}
            style={styles.clearButton}
          >
            <MaterialIcons
              name="clear"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.chatId}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="chat-bubble-outline"
              size={48}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation by messaging someone!
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  readIcon: {
    marginRight: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ChatListScreen;
