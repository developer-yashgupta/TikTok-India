import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../config/theme';
import { messageService } from '../../services/messageService';
import { userService } from '../../services/userService';

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { recipientId, recipientName } = route.params;
  const [loading, setLoading] = useState(true);
  const [recipient, setRecipient] = useState(null);

  useEffect(() => {
    initializeChat();
  }, [recipientId]);

  const initializeChat = async () => {
    try {
      setLoading(true);

      // First, get recipient details if we only have ID
      let recipientData = null;
      if (recipientId) {
        try {
          recipientData = await userService.getUserProfile(recipientId);
        } catch (error) {
          console.error('Error fetching recipient details:', error);
        }
      }

      if (!recipientData) {
        Alert.alert('Error', 'User not found');
        navigation.goBack();
        return;
      }

      setRecipient(recipientData);

      // Check if user is trying to message themselves
      if (recipientId === user?._id) {
        Alert.alert('Error', 'You cannot send a message to yourself');
        navigation.goBack();
        return;
      }

      // Create or get existing chat
      const chatResponse = await messageService.createChat(recipientId);

      if (chatResponse.success) {
        // Navigate to DirectMessagingScreen with chat details
        navigation.replace('DirectMessage', {
          chatId: chatResponse.data.chatId,
          recipient: {
            _id: recipientData._id,
            username: recipientData.username,
            displayName: recipientData.displayName,
            avatar: recipientData.avatar,
          },
        });
      } else {
        throw new Error(chatResponse.message || 'Failed to create chat');
      }
    } catch (error) {
      console.error('Error initializing chat:', error);

      let errorMessage = 'Failed to start conversation. Please try again.';
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(e => e.msg).join(', ');
      }

      Alert.alert(
        'Error',
        errorMessage,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>
        {recipient 
          ? `Starting conversation with ${recipient.displayName || recipient.username}...`
          : 'Loading...'
        }
      </Text>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
};

export default ChatScreen;
