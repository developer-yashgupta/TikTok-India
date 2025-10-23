import AsyncStorage from '@react-native-async-storage/async-storage';

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.sessionStartTime = Date.now();
    this.maxMetrics = 10; // Limit number of active sessions
    this.maxStoredMetrics = 20; // Limit stored metrics
  }

  // Start tracking a video session
  startVideoSession(videoId, videoUri) {
    // Clean up old sessions if we're at the limit
    if (this.metrics.size >= this.maxMetrics) {
      this.cleanupOldSessions();
    }

    const sessionId = `${videoId}_${Date.now()}`;
    this.metrics.set(sessionId, {
      videoId,
      videoUri,
      startTime: Date.now(),
      loadStartTime: null,
      loadEndTime: null,
      bufferingEvents: [],
      playbackEvents: [],
      errors: [],
      quality: null,
      networkType: null,
      deviceInfo: null
    });

    return sessionId;
  }

  // Record video load start
  recordLoadStart(sessionId) {
    const metric = this.metrics.get(sessionId);
    if (metric) {
      metric.loadStartTime = Date.now();
    }
  }

  // Record video load completion
  recordLoadEnd(sessionId, loadData) {
    const metric = this.metrics.get(sessionId);
    if (metric) {
      metric.loadEndTime = Date.now();
      metric.loadDuration = metric.loadEndTime - metric.loadStartTime;
      metric.videoData = loadData;
    }
  }

  // Record buffering event
  recordBufferingEvent(sessionId, eventType, duration = null) {
    const metric = this.metrics.get(sessionId);
    if (metric) {
      // Limit buffering events to prevent memory issues
      if (metric.bufferingEvents.length >= 5) {
        metric.bufferingEvents.shift(); // Remove oldest
      }
      metric.bufferingEvents.push({
        type: eventType,
        timestamp: Date.now(),
        duration: duration
      });
    }
  }

  // Record playback event
  recordPlaybackEvent(sessionId, eventType, data = {}) {
    const metric = this.metrics.get(sessionId);
    if (metric) {
      // Limit playback events to prevent memory issues
      if (metric.playbackEvents.length >= 3) {
        metric.playbackEvents.shift(); // Remove oldest
      }
      metric.playbackEvents.push({
        type: eventType,
        timestamp: Date.now(),
        ...data
      });
    }
  }

  // Record error
  recordError(sessionId, error) {
    const metric = this.metrics.get(sessionId);
    if (metric) {
      // Limit errors to prevent memory issues
      if (metric.errors.length >= 2) {
        metric.errors.shift(); // Remove oldest
      }
      metric.errors.push({
        error: error.message || error,
        timestamp: Date.now(),
        stack: error.stack
      });
    }
  }

  // Set quality information
  setQuality(sessionId, quality) {
    const metric = this.metrics.get(sessionId);
    if (metric) {
      metric.quality = quality;
    }
  }

  // Set network information
  setNetworkInfo(sessionId, networkType) {
    const metric = this.metrics.get(sessionId);
    if (metric) {
      metric.networkType = networkType;
    }
  }

  // End video session and get metrics
  endVideoSession(sessionId) {
    const metric = this.metrics.get(sessionId);
    if (metric) {
      metric.endTime = Date.now();
      metric.totalDuration = metric.endTime - metric.startTime;

      // Calculate performance scores
      metric.performanceScore = this.calculatePerformanceScore(metric);

      // Store metrics
      this.storeMetrics(metric);

      // Clean up
      this.metrics.delete(sessionId);

      return metric;
    }
    return null;
  }

  // Calculate performance score (0-100)
  calculatePerformanceScore(metric) {
    let score = 100;

    // Penalize for long load times
    if (metric.loadDuration > 5000) {
      score -= Math.min(30, (metric.loadDuration - 5000) / 1000);
    }

    // Penalize for buffering events
    const bufferingPenalty = metric.bufferingEvents.length * 5;
    score -= Math.min(30, bufferingPenalty);

    // Penalize for errors
    const errorPenalty = metric.errors.length * 10;
    score -= Math.min(20, errorPenalty);

    // Bonus for good quality on fast networks
    if (metric.quality && metric.quality.bitrate > 2000000 && metric.networkType === 'wifi') {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  // Store metrics for analytics
  async storeMetrics(metric) {
    try {
      const key = `video_metrics_${Date.now()}`;
      await AsyncStorage.setItem(key, JSON.stringify(metric));
      
      // Cleanup old metrics if we have too many
      await this.cleanupOldStoredMetrics();
    } catch (error) {
      console.error('Error storing metrics:', error);
    }
  }
  
  // Clean up old stored metrics if we exceed the limit
  async cleanupOldStoredMetrics() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const metricKeys = keys
        .filter(key => key.startsWith('video_metrics_'))
        .sort()
        .reverse(); // Most recent first
      
      // If we have more than maxStoredMetrics, remove the oldest ones
      if (metricKeys.length > this.maxStoredMetrics) {
        const keysToRemove = metricKeys.slice(this.maxStoredMetrics);
        for (const key of keysToRemove) {
          await AsyncStorage.removeItem(key);
        }
        console.log(`Cleaned up ${keysToRemove.length} old performance metrics`);
      }
    } catch (error) {
      console.error('Error cleaning up old stored metrics:', error);
    }
  }

  // Get stored metrics for analysis
  async getStoredMetrics(limit = 50) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const metricKeys = keys
        .filter(key => key.startsWith('video_metrics_'))
        .sort()
        .reverse()
        .slice(0, limit);

      const metrics = [];
      for (const key of metricKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          metrics.push(JSON.parse(data));
        }
      }

      return metrics;
    } catch (error) {
      console.error('Error getting stored metrics:', error);
      return [];
    }
  }

  // Get performance statistics
  async getPerformanceStats() {
    const metrics = await this.getStoredMetrics(100);

    if (metrics.length === 0) return null;

    const stats = {
      totalSessions: metrics.length,
      averageLoadTime: 0,
      averageBufferingEvents: 0,
      averagePerformanceScore: 0,
      errorRate: 0,
      qualityDistribution: {},
      networkDistribution: {}
    };

    let totalLoadTime = 0;
    let totalBufferingEvents = 0;
    let totalScore = 0;
    let sessionsWithErrors = 0;

    metrics.forEach(metric => {
      if (metric.loadDuration) {
        totalLoadTime += metric.loadDuration;
      }
      totalBufferingEvents += metric.bufferingEvents.length;
      if (metric.performanceScore) {
        totalScore += metric.performanceScore;
      }
      if (metric.errors.length > 0) {
        sessionsWithErrors++;
      }

      // Track quality distribution
      if (metric.quality) {
        const quality = metric.quality.resolution;
        stats.qualityDistribution[quality] = (stats.qualityDistribution[quality] || 0) + 1;
      }

      // Track network distribution
      if (metric.networkType) {
        stats.networkDistribution[metric.networkType] = (stats.networkDistribution[metric.networkType] || 0) + 1;
      }
    });

    stats.averageLoadTime = totalLoadTime / metrics.length;
    stats.averageBufferingEvents = totalBufferingEvents / metrics.length;
    stats.averagePerformanceScore = totalScore / metrics.length;
    stats.errorRate = (sessionsWithErrors / metrics.length) * 100;

    return stats;
  }

  // Clean up old sessions when at capacity limit
  cleanupOldSessions() {
    const entries = Array.from(this.metrics.entries());
    // Sort by start time (oldest first)
    entries.sort(([,a], [,b]) => a.startTime - b.startTime);

    // Remove oldest 50% of sessions
    const toRemove = Math.ceil(entries.length * 0.5);
    for (let i = 0; i < toRemove; i++) {
      const [sessionId] = entries[i];
      this.metrics.delete(sessionId);
    }
  }

  // Clear old metrics (keep last 7 days)
  async clearOldMetrics() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const metricKeys = keys.filter(key => key.startsWith('video_metrics_'));

      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

      for (const key of metricKeys) {
        const timestamp = parseInt(key.replace('video_metrics_', ''));
        if (timestamp < sevenDaysAgo) {
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error clearing old metrics:', error);
    }
  }
}

// Singleton instance
class PerformanceMonitorSingleton extends PerformanceMonitor {
  constructor() {
    super();
    this.cleanupInterval = null;
    this.isActive = false;
  }

  // Initialize the performance monitor with cleanup interval
  initialize() {
    if (!this.isActive) {
      this.isActive = true;
      // Clear old metrics daily
      this.cleanupInterval = setInterval(() => {
        this.clearOldMetrics();
      }, 24 * 60 * 60 * 1000);
      
      // Clear old metrics immediately on first run
      this.clearOldMetrics();
    }
  }

  // Cleanup interval and resources
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isActive = false;
    this.metrics.clear();
  }

  // Override startVideoSession to ensure initialization
  startVideoSession(videoId, videoUri) {
    if (!this.isActive) {
      this.initialize();
    }
    return super.startVideoSession(videoId, videoUri);
  }
}

const performanceMonitor = new PerformanceMonitorSingleton();

export default performanceMonitor;
export { PerformanceMonitor, PerformanceMonitorSingleton };
