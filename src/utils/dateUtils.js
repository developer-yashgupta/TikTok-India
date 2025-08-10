/**
 * Date utility functions for consistent date formatting across the app
 */

/**
 * Format time for chat list (relative time)
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted time string
 */
export const formatChatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = (now - date) / (1000 * 60);
  const diffInHours = diffInMinutes / 60;
  const diffInDays = diffInHours / 24;

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${Math.floor(diffInMinutes)}m`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h`;
  } else if (diffInDays < 7) {
    return `${Math.floor(diffInDays)}d`;
  } else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

/**
 * Format date for message separators
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatMessageDate = (date) => {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if it's today
  if (messageDate.toDateString() === today.toDateString()) {
    return 'Today';
  }
  
  // Check if it's yesterday
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  // Check if it's within the current week
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (messageDate > weekAgo) {
    return messageDate.toLocaleDateString([], { weekday: 'long' });
  }
  
  // For older messages, show full date
  return messageDate.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric',
    year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });
};

/**
 * Format time for individual messages (just time)
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted time string (HH:MM)
 */
export const formatMessageTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Check if two dates are on the same day
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date
 * @returns {boolean} True if dates are on the same day
 */
export const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.toDateString() === d2.toDateString();
};

/**
 * Group messages by date
 * @param {Array} messages - Array of message objects
 * @returns {Array} Array of messages with date separators
 */
export const groupMessagesByDate = (messages) => {
  if (!messages || messages.length === 0) return [];

  const messagesWithDates = [];
  let currentDate = null;

  messages.forEach((message) => {
    const messageDate = new Date(message.createdAt).toDateString();
    
    // Add date separator if this is a new date
    if (messageDate !== currentDate) {
      messagesWithDates.push({
        id: `date-${messageDate}`,
        type: 'date',
        date: message.createdAt,
        dateText: formatMessageDate(message.createdAt)
      });
      currentDate = messageDate;
    }
    
    // Add the actual message
    messagesWithDates.push({
      ...message,
      type: 'message'
    });
  });

  return messagesWithDates;
};
