export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return {
    isValid: password.length >= 8,
    message: password.length < 8 ? 'Password must be at least 8 characters' : '',
  };
};

export const validateUsername = (username) => {
  const re = /^[a-zA-Z0-9_]{3,20}$/;
  return {
    isValid: re.test(username),
    message: !re.test(username)
      ? 'Username must be 3-20 characters and can only contain letters, numbers, and underscores'
      : '',
  };
};

export const validateVideoUpload = (file) => {
  const validTypes = ['video/mp4', 'video/quicktime'];
  const maxSize = 100 * 1024 * 1024; // 100MB

  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      message: 'Please upload an MP4 or MOV file',
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      message: 'Video must be less than 100MB',
    };
  }

  return {
    isValid: true,
    message: '',
  };
};

export const validateDescription = (text) => {
  return {
    isValid: text.length <= 500,
    message: text.length > 500 ? 'Description must be less than 500 characters' : '',
  };
};

export const validateHashtags = (hashtags) => {
  const maxHashtags = 20;
  const hashtagRegex = /^[a-zA-Z0-9_]+$/;

  if (hashtags.length > maxHashtags) {
    return {
      isValid: false,
      message: `You can only add up to ${maxHashtags} hashtags`,
    };
  }

  const invalidHashtags = hashtags.filter(tag => !hashtagRegex.test(tag));
  if (invalidHashtags.length > 0) {
    return {
      isValid: false,
      message: 'Hashtags can only contain letters, numbers, and underscores',
    };
  }

  return {
    isValid: true,
    message: '',
  };
};
