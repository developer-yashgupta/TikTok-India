import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { theme } from '../../config/theme';
import api from '../../config/api';
import LoadingScreen from '../../components/shared/LoadingScreen';
import { formatNumber } from '../../utils/format';

const { width } = Dimensions.get('window');

const TIME_RANGES = {
  WEEK: '7d',
  MONTH: '30d',
  ALL: 'all',
};

const AnalyticsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(TIME_RANGES.WEEK);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/api/analytics', {
        params: { timeRange },
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, change }) => (
    <View style={styles.statCard}>
      <MaterialIcons name={icon} size={24} color={theme.colors.primary} />
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{formatNumber(value)}</Text>
      {change != null && (
        <Text
          style={[
            styles.statChange,
            { color: change >= 0 ? theme.colors.success : theme.colors.error },
          ]}
        >
          {change >= 0 ? '+' : ''}{change}%
        </Text>
      )}
    </View>
  );

  if (loading) {
    return <LoadingScreen message="Loading analytics..." />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.timeRangeContainer}>
          {Object.entries(TIME_RANGES).map(([key, value]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.timeRangeButton,
                timeRange === value && styles.activeTimeRange,
              ]}
              onPress={() => setTimeRange(value)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === value && styles.activeTimeRangeText,
                ]}
              >
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Views"
          value={analytics.totalViews}
          icon="visibility"
          change={analytics.viewsChange}
        />
        <StatCard
          title="Likes"
          value={analytics.totalLikes}
          icon="favorite"
          change={analytics.likesChange}
        />
        <StatCard
          title="Comments"
          value={analytics.totalComments}
          icon="chat"
          change={analytics.commentsChange}
        />
        <StatCard
          title="Shares"
          value={analytics.totalShares}
          icon="share"
          change={analytics.sharesChange}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Views Over Time</Text>
        <LineChart
          data={analytics.viewsChart}
          width={width - theme.spacing.md * 2}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 77, 77, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Engagement Rate</Text>
        <BarChart
          data={analytics.engagementChart}
          width={width - theme.spacing.md * 2}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(255, 77, 77, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={styles.chart}
        />
      </View>

      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Key Insights</Text>
        {analytics.insights.map((insight, index) => (
          <View key={index} style={styles.insightCard}>
            <MaterialIcons
              name={insight.icon}
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightDescription}>
                {insight.description}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  timeRangeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  activeTimeRange: {
    backgroundColor: theme.colors.primary,
  },
  timeRangeText: {
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
  },
  activeTimeRangeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.sm,
  },
  statCard: {
    width: (width - theme.spacing.md * 3) / 2,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing.xs,
    alignItems: 'center',
  },
  statTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
    marginTop: theme.spacing.sm,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: theme.typography.h2.fontSize,
    fontWeight: 'bold',
    marginTop: theme.spacing.xs,
  },
  statChange: {
    fontSize: theme.typography.caption.fontSize,
    marginTop: theme.spacing.xs,
  },
  chartContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    marginVertical: theme.spacing.md,
  },
  chartTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3.fontSize,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  chart: {
    borderRadius: theme.borderRadius.md,
  },
  insightsContainer: {
    padding: theme.spacing.md,
  },
  insightsTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3.fontSize,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  insightContent: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  insightTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  insightDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
  },
});

export default AnalyticsScreen;
