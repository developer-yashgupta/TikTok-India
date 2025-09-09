import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NotificationBadge = ({ 
  count = 0, 
  showDot = false, 
  maxCount = 99,
  style,
  textStyle 
}) => {
  // Don't render anything if no notification
  if (!showDot && count <= 0) {
    return null;
  }

  // Show dot for inbox unread indicator
  if (showDot) {
    return <View style={[styles.dot, style]} />;
  }

  // Show count for chat notifications
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <View style={[styles.badge, style]}>
      <Text style={[styles.badgeText, textStyle]}>
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3040',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    zIndex: 1,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3040',
    zIndex: 1,
  },
});

export default NotificationBadge;
