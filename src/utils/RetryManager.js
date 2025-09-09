class RetryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialDelay = options.initialDelay || 1000;
    this.maxDelay = options.maxDelay || 10000;
    this.factor = options.factor || 2;
  }

  async retry(operation, options = {}) {
    const {
      maxRetries = this.maxRetries,
      initialDelay = this.initialDelay,
      maxDelay = this.maxDelay,
      factor = this.factor,
      onRetry,
      retryCondition,
    } = options;

    let lastError;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Check if we should retry based on the error
        if (retryCondition && !retryCondition(error)) {
          throw error;
        }

        if (attempt === maxRetries) {
          throw error;
        }

        // Calculate next delay with exponential backoff
        delay = Math.min(delay * factor, maxDelay);

        // Notify about retry
        if (onRetry) {
          onRetry({
            error,
            attempt,
            maxRetries,
            delay,
          });
        }

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // Helper method for retrying uploads
  async retryUpload(uploadFn, options = {}) {
    const {
      onProgress,
      onRetry,
      ...retryOptions
    } = options;

    return this.retry(
      async () => {
        try {
          return await uploadFn(onProgress);
        } catch (error) {
          // Check if error is retryable
          if (error.response?.status >= 500 || error.code === 'NETWORK_ERROR') {
            throw error; // Will be caught and retried
          }
          throw error; // Non-retryable error
        }
      },
      {
        ...retryOptions,
        onRetry: (retryInfo) => {
          console.log(`Retrying upload. Attempt ${retryInfo.attempt} of ${retryInfo.maxRetries}`);
          if (onRetry) {
            onRetry(retryInfo);
          }
        },
        retryCondition: (error) => {
          // Only retry on server errors or network issues
          return error.response?.status >= 500 || error.code === 'NETWORK_ERROR';
        },
      }
    );
  }

  // Helper method for retrying API calls
  async retryApiCall(apiFn, options = {}) {
    return this.retry(apiFn, {
      ...options,
      retryCondition: (error) => {
        // Don't retry on client errors (4xx)
        return error.response?.status >= 500 || error.code === 'NETWORK_ERROR';
      },
    });
  }
}

export default new RetryManager();
