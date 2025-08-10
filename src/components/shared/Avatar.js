import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

const Avatar = ({ uri, size = 40, style }) => {
  const { colors } = useTheme();

  return (
    <View 
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: colors.border,
        },
        style
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: size - 2,
              height: size - 2,
              borderRadius: (size - 2) / 2,
            }
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size - 2,
              height: size - 2,
              borderRadius: (size - 2) / 2,
              backgroundColor: colors.card,
            }
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Avatar;
