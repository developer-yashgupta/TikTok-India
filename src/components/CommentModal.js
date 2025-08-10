import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Dimensions,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@react-navigation/native';
import axios from 'axios';
import { API_URL } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './shared/Avatar';
import { formatDistanceToNow } from 'date-fns';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const CommentModal = ({ visible, videoId, onClose, onCommentAdded }) => {
  const { colors } = useTheme();
  const { user, token } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible && videoId) {
      fetchComments();
    } else {
      setComments([]);
      setNewComment('');
      setError(null);
      setReplyTo(null);
      setLoading(false);
      setSubmitting(false);
    }
  }, [visible, videoId]);

  const fetchComments = async (showLoader = true) => {
    if (!videoId) return;
    
    try {
      if (showLoader) setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/api/videos/${videoId}/comments`, {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data && response.data.comments) {
        setComments(response.data.comments);
        if (onCommentAdded) {
          onCommentAdded(response.data.commentsCount);
        }
      } else {
        setError('No comments available');
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !videoId) return;
    
    Keyboard.dismiss();

    try {
      setSubmitting(true);
      setError(null);

      const endpoint = replyTo 
        ? `${API_URL}/api/comments/${replyTo._id}/reply`
        : `${API_URL}/api/comments/${videoId}`;

      const response = await axios.post(
        endpoint,
        { content: newComment.trim() },
        { headers: { 'x-auth-token': token } }
      );

      if (response.data && (response.data.comment || response.data.reply)) {
        if (replyTo) {
          setComments(prevComments => 
            prevComments.map(comment => 
              comment._id === replyTo._id
                ? { 
                    ...comment, 
                    replies: [...(comment.replies || []), response.data.reply]
                  }
                : comment
            )
          );
        } else {
          setComments(prevComments => [response.data.comment, ...prevComments]);
        }

        setNewComment('');
        setReplyTo(null);
        
        if (onCommentAdded && response.data.commentsCount) {
          onCommentAdded(response.data.commentsCount);
        }
        
        // Scroll to top only for new comments, not replies
        if (!replyTo && scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (comment) => {
    setReplyTo(comment);
    setNewComment(`@${comment.user.username} `);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
    setNewComment('');
  };

  const renderComment = (item) => (
    <View key={item._id} style={styles.commentContainer}>
      <Avatar
        uri={item.user.avatar}
        size={40}
        style={styles.avatar}
      />
      <View style={styles.commentContent}>
        <Text style={[styles.username, { color: colors.text }]}>
          {item.user.username}
        </Text>
        <Text style={[styles.commentText, { color: colors.text }]}>
          {item.content}
        </Text>
        <View style={styles.commentFooter}>
          <Text style={[styles.timestamp, { color: colors.text + '80' }]}>
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </Text>
          <TouchableOpacity 
            style={styles.replyButton}
            onPress={() => handleReply(item)}
          >
            <Text style={[styles.replyText, { color: colors.text + '80' }]}>Reply</Text>
          </TouchableOpacity>
        </View>

        {/* Render replies */}
        {item.replies?.map((reply, index) => (
          <View key={reply._id || index} style={styles.replyContainer}>
            <Avatar
              uri={reply.user?.avatar}
              size={30}
              style={styles.replyAvatar}
            />
            <View style={styles.replyContent}>
              <Text style={[styles.username, { color: colors.text, fontSize: 13 }]}>
                {reply.user?.username}
              </Text>
              <Text style={[styles.commentText, { color: colors.text, fontSize: 13 }]}>
                {reply.content}
              </Text>
              <View style={styles.commentFooter}>
                <Text style={[styles.timestamp, { color: colors.text + '80', fontSize: 11 }]}>
                  {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const modalHeight = SCREEN_HEIGHT * 0.8;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background + 'F0' }]}>
        <View 
          style={[
            styles.contentContainer, 
            { 
              backgroundColor: colors.card,
              maxHeight: modalHeight,
              minHeight: Platform.OS === 'android' ? '60%' : 'auto'
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Comments ({comments.length})
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {loading ? (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          ) : error ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {comments.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.text }]}>
                    No comments yet. Be the first to comment!
                  </Text>
                </View>
              ) : (
                comments.map(comment => renderComment(comment))
              )}
            </ScrollView>
          )}

          {/* Reply To Banner */}
          {replyTo && (
            <View style={[styles.replyBanner, { backgroundColor: colors.border + '30' }]}>
              <Text style={[styles.replyingTo, { color: colors.text }]}>
                Replying to @{replyTo.user.username}
              </Text>
              <TouchableOpacity onPress={cancelReply}>
                <Icon name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}

          {/* Comment Input */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
          >
            <View style={[styles.inputContainer, { backgroundColor: colors.border + '20' }]}>
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.text }]}
                placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
                placeholderTextColor={colors.text + '80'}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={1000}
                returnKeyType="send"
                onSubmitEditing={handleSubmitComment}
                blurOnSubmit={true}
              />
              <TouchableOpacity
                onPress={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                style={[
                  styles.submitButton,
                  { opacity: submitting || !newComment.trim() ? 0.5 : 1 }
                ]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Icon name="send" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  contentContainer: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    maxHeight: '80%',
    minHeight: Platform.OS === 'android' ? '60%' : 'auto',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    zIndex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    padding: 15,
    flexGrow: 1,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatar: {
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  username: {
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    lineHeight: 20,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    marginRight: 15,
  },
  replyButton: {
    padding: 5,
  },
  replyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginLeft: 20,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.1)',
  },
  replyAvatar: {
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  replyingTo: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 5,
    borderRadius: 20,
  },
  submitButton: {
    padding: 8,
    marginLeft: 10,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 200,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
});

export default CommentModal;
