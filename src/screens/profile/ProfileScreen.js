import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  FlatList,
  useWindowDimensions,
  Modal
} from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { auth, videos as videoApi, userService } from '../../config/api';
import { theme } from '../../config/theme';
import { formatNumber } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  
  const THUMBNAIL_SIZE = Platform.select({
    web: Math.min(width / 4, 200),
    default: width / 3
  });
  
  const ITEMS_PER_PAGE = Platform.select({
    web: 20,
    default: 15
  });

  const [user, setUser] = useState(null);
  const [userVideos, setVideos] = useState([]);
  const [privateVideos, setPrivateVideos] = useState([]);
  const [draftVideos, setDraftVideos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    likes: 0,
    videos: 0,
    privateVideos: 0,
    draftVideos: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState({
    videos: 1,
    private: 1,
    drafts: 1
  });
  const [hasMore, setHasMore] = useState({
    videos: true,
    private: true,
    drafts: true
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Add refs to track loading states
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);
  const prevActiveTabRef = useRef('videos');
  const isInitialMount = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      console.log('[ProfileScreen] Starting initial data load, activeTab:', activeTab);
      await Promise.all([
        fetchUserProfile(),
        fetchUserVideos(true)
      ]);
      console.log('[ProfileScreen] Initial data load complete');
      isInitialMount.current = false;
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const refresh = navigation.getState()?.routes?.find(
        route => route.name === 'ProfileMain'
      )?.params?.refresh;
      
      if (refresh) {
        console.log('[ProfileScreen] Screen focused with refresh param, activeTab:', activeTab);
        const refreshData = async () => {
          await Promise.all([
            fetchUserProfile(),
            fetchUserVideos(true)
          ]);
        };
        refreshData();
        navigation.setParams({ refresh: false });
      }
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!isInitialMount.current && user?._id && !loading && !isLoadingRef.current) {
      if (activeTab !== prevActiveTabRef.current) {
        console.log(`[ProfileScreen] Tab change detected - Previous: ${prevActiveTabRef.current}, New: ${activeTab}, IsInitialMount: ${isInitialMount.current}, IsLoading: ${isLoadingRef.current}`);
        setPage(prev => ({
          ...prev,
          [activeTab]: 1
        }));
        setHasMore(prev => ({
          ...prev,
          [activeTab]: true
        }));
        setLoadingMore(false);
        fetchUserVideos(true);
        prevActiveTabRef.current = activeTab;
      }
    }
  }, [activeTab]);

  const fetchUserProfile = async () => {
    if (!isMountedRef.current) return;
    
    try {
      setError(null);
      setLoading(true);

      // Get profile data
      const response = await auth.getProfile();
      const { user: userData } = response.data;
      
      if (!userData) {
        throw new Error('Failed to load profile');
      }

      if (isMountedRef.current) {
        setUser(userData);
        setStats({
          following: userData.followingCount || 0,
          followers: userData.followersCount || 0,
          likes: userData.totalLikes || 0,
          videos: userData.totalVideos || 0,
          privateVideos: 0,
          draftVideos: 0
        });
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      if (error.response?.status === 401) {
        navigation.navigate('Login');
      } else {
        setError('Failed to load profile');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const fetchUserVideos = useCallback(async (refresh = false) => {
    if (!isMountedRef.current || !user?._id) {
      console.log(`[ProfileScreen] Fetch aborted - isMounted: ${isMountedRef.current}, userId: ${user?._id}`);
      return;
    }
    
    try {
      console.log(`[ProfileScreen] Fetch attempt - Tab: ${activeTab}, Page: ${page[activeTab]}, Refresh: ${refresh}, InitialMount: ${isInitialMount.current}, Loading: ${isLoadingRef.current}`);
      
      if (refresh) {
        console.log(`[ProfileScreen] Refreshing ${activeTab} tab - Current page: ${page[activeTab]}, HasMore: ${hasMore[activeTab]}`);
        setPage(prev => ({
          ...prev,
          [activeTab]: 1
        }));
        setHasMore(prev => ({
          ...prev,
          [activeTab]: true
        }));
        // Only clear the videos for the current tab
        if (activeTab === 'private') {
          setPrivateVideos([]);
        } else if (activeTab === 'drafts') {
          setDraftVideos([]);
        } else {
        setVideos([]);
        }
      }

      // Don't fetch if we're already loading or there are no more videos
      if (!hasMore[activeTab] || isLoadingRef.current) {
        console.log(`[ProfileScreen] Fetch skipped - HasMore: ${hasMore[activeTab]}, IsLoading: ${isLoadingRef.current}`);
        return;
      }

      isLoadingRef.current = true;
      setLoadingMore(true);
      
      const currentPage = refresh ? 1 : page[activeTab];
      console.log(`[ProfileScreen] Fetching page ${currentPage} for ${activeTab} tab`);
      
      // Set proper visibility and status filters based on active tab
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE
      };

      // Set visibility and status based on active tab
      if (activeTab === 'private') {
        params.visibility = 'private';
        params.status = 'ready';
      } else if (activeTab === 'drafts') {
        params.status = 'draft';
      } else {
        params.visibility = 'public';
        params.status = 'ready';
      }
      
      const response = await videoApi.getUserVideos(user._id, params);
      
      if (!isMountedRef.current) return;

      const { 
        videos: newVideos, 
        hasMore: moreAvailable, 
        total,
        publicCount,
        privateCount,
        draftCount 
      } = response.data;

      console.log(`Received ${newVideos?.length || 0} videos, hasMore: ${moreAvailable}`);
      
      if (newVideos?.length) {
        // Update videos based on active tab
        if (activeTab === 'private') {
          setPrivateVideos(prevVideos => {
            const updatedVideos = refresh ? newVideos : [...prevVideos, ...newVideos];
            return updatedVideos;
          });
        } else if (activeTab === 'drafts') {
          setDraftVideos(prevVideos => {
            const updatedVideos = refresh ? newVideos : [...prevVideos, ...newVideos];
            return updatedVideos;
          });
        } else {
        setVideos(prevVideos => {
          const updatedVideos = refresh ? newVideos : [...prevVideos, ...newVideos];
            return updatedVideos;
          });
        }

        // Update all stats at once when we get the counts
        if (refresh || currentPage === 1) {
            setStats(prev => ({
              ...prev,
            videos: publicCount || 0,
            privateVideos: privateCount || 0,
            draftVideos: draftCount || 0
            }));
          }

        setHasMore(prev => ({
          ...prev,
          [activeTab]: moreAvailable
        }));
        
        if (!refresh) {
          setPage(prev => ({
            ...prev,
            [activeTab]: currentPage + 1
          }));
        }
      } else {
        // If no videos returned, mark this tab as having no more content
        setHasMore(prev => ({
          ...prev,
          [activeTab]: false
        }));
      }
    } catch (error) {
      console.error('Videos fetch error:', error);
      if (error.response?.status === 401) {
        navigation.navigate('Login');
      } else {
        Alert.alert(
          'Error',
          'Failed to load videos. Please try again later.'
        );
      }
    } finally {
      isLoadingRef.current = false;
      if (isMountedRef.current) {
        setLoadingMore(false);
      }
    }
  }, [page, hasMore, user?._id, activeTab, ITEMS_PER_PAGE]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchUserProfile(),
        fetchUserVideos(true)
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchUserVideos]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore[activeTab] && !refreshing) {
      fetchUserVideos();
    }
  }, [loadingMore, hasMore, activeTab, refreshing, fetchUserVideos]);

  const handleTabChange = async (newTab) => {
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  };

  const handleVideoPress = async (video) => {
    navigation.navigate('VideoPlayer', {
      videoId: video._id,
      video: video,
      videos: activeTab === 'private' ? privateVideos : activeTab === 'drafts' ? draftVideos : userVideos,
      initialIndex: (activeTab === 'private' ? privateVideos : activeTab === 'drafts' ? draftVideos : userVideos).findIndex(v => v._id === video._id),
      fromTab: activeTab,
      userId: user?._id,
      commentsEnabled: true
    });
  };

  const renderVideoItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={[
        styles.videoThumbnail,
        {
          width: THUMBNAIL_SIZE,
          height: THUMBNAIL_SIZE * 1.5
        }
      ]}
      onPress={() => handleVideoPress(item)}
    >
      <Image
        source={{ uri: item.thumbnailUrl || item.videoUrl }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      {Platform.OS === 'ios' ? (
        <BlurView intensity={30} style={styles.videoStats}>
          <View style={styles.statRow}>
            <FontAwesome5 name="heart" size={12} color="white" />
            <Text style={styles.videoStatsText}>
              {item.likesCount > 1000 ? `${(item.likesCount / 1000).toFixed(1)}K` : item.likesCount || 0}
            </Text>
          </View>
        </BlurView>
      ) : (
        <View style={[styles.videoStats, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
          <View style={styles.statRow}>
            <FontAwesome5 name="heart" size={12} color="white" />
            <Text style={styles.videoStatsText}>
              {item.likesCount > 1000 ? `${(item.likesCount / 1000).toFixed(1)}K` : item.likesCount || 0}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  ), [THUMBNAIL_SIZE, handleVideoPress]);

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'videos' && styles.activeTab]}
        onPress={() => handleTabChange('videos')}
      >
        <MaterialIcons
          name="grid-on"
          size={24}
          color={activeTab === 'videos' ? theme.colors.primary : '#888'}
        />
        {stats.videos > 0 && (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{stats.videos}</Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'private' && styles.activeTab]}
        onPress={() => handleTabChange('private')}
      >
        <MaterialIcons
          name="lock"
          size={24}
          color={activeTab === 'private' ? theme.colors.primary : '#888'}
        />
        {stats.privateVideos > 0 && (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{stats.privateVideos}</Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'drafts' && styles.activeTab]}
        onPress={() => handleTabChange('drafts')}
      >
        <MaterialIcons
          name="edit"
          size={24}
          color={activeTab === 'drafts' ? theme.colors.primary : '#888'}
        />
        {stats.draftVideos > 0 && (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{stats.draftVideos}</Text>
          </View>
        )}
      </TouchableOpacity>
      </View>
    );

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        try {
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Auth', params: { screen: 'Login' } }],
          });
        } catch (error) {
          console.error('Logout error:', error);
          alert('Failed to logout. Please try again.');
        }
      }
    } else {
      setShowLogoutModal(true);
    }
  };

  if (loading && !userVideos.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.mainScrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#fe2c55']}
            tintColor="#fe2c55"
          />
        }
      >
        <LinearGradient
          colors={[theme.colors.primary + '20', 'transparent']}
          style={[
            styles.header,
            Platform.select({
              web: {
                maxWidth: 1200,
                alignSelf: 'center',
                width: '100%'
              }
            })
          ]}
        >
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <MaterialIcons name="settings" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Image
                source={user?.avatar ? { uri: user.avatar } : require('../../../assets/default-avatar.png')}
                style={styles.avatar}
              />
              <View style={styles.editAvatarBadge}>
                <MaterialIcons name="edit" size={16} color="white" />
              </View>
            </TouchableOpacity>
            
            <Text style={styles.username}>@{user?.username}</Text>
            <Text style={styles.displayName}>{user?.displayName}</Text>
            <Text style={styles.bio}>{user?.bio || 'No bio yet'}</Text>

            <View style={styles.statsContainer}>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => navigation.navigate('Following', {
                  userId: user?._id,
                  username: user?.username
                })}
              >
                <Text style={styles.statNumber}>{formatNumber(stats.following)}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => navigation.navigate('Followers', {
                  userId: user?._id,
                  username: user?.username
                })}
              >
                <Text style={styles.statNumber}>{formatNumber(stats.followers)}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{formatNumber(stats.likes)}</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{formatNumber(stats.videos)}</Text>
                <Text style={styles.statLabel}>Videos</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={[
          styles.contentContainer,
          Platform.select({
            web: {
              maxWidth: 1200,
              alignSelf: 'center',
              width: '100%'
            }
          })
        ]}>
          {renderTabs()}

            <FlatList
            data={activeTab === 'private' ? privateVideos : activeTab === 'drafts' ? draftVideos : userVideos}
              renderItem={renderVideoItem}
              keyExtractor={item => item._id}
              numColumns={Platform.select({
                web: 4,
                default: 3
              })}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
            ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {activeTab === 'private'
                    ? 'No private videos'
                    : activeTab === 'drafts'
                    ? 'No draft videos'
                    : 'No videos yet'}
                </Text>
                </View>
            )}
            ListFooterComponent={() => loadingMore && (
              <View style={styles.loadingFooter}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            )}
              columnWrapperStyle={Platform.select({
                web: {
                  justifyContent: 'flex-start'
                },
                default: undefined
              })}
              contentContainerStyle={styles.gridContainer}
              scrollEnabled={false}
              removeClippedSubviews={Platform.OS !== 'web'}
              initialNumToRender={Platform.select({
                web: 16,
                default: 12
              })}
              maxToRenderPerBatch={Platform.select({
                web: 8,
                default: 6
              })}
              windowSize={5}
            />
        </View>
      </ScrollView>
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoutModal}
          >
            <Text style={styles.logoutTitle}>Logout</Text>
            <Text style={styles.logoutMessage}>Are you sure you want to logout?</Text>
            <View style={styles.logoutButtons}>
              <TouchableOpacity
                style={[styles.logoutButton, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoutButton, styles.confirmButton]}
                onPress={async () => {
                  setShowLogoutModal(false);
                  try {
                    await logout();
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Auth', params: { screen: 'Login' } }],
                    });
                  } catch (error) {
                    console.error('Logout error:', error);
                    Alert.alert('Error', 'Failed to logout. Please try again.');
                  }
                }}
              >
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  header: {
    padding: Platform.select({
      web: 40,
      ios: 20,
      android: 16
    }),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      },
      default: {
        elevation: 1
      }
    })
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  settingsButton: {
    marginRight: 10,
    padding: 8,
  },
  logoutButton: {
    padding: 8,
  },
  profileInfo: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: Platform.select({
      web: 120,
      default: 100
    }),
    height: Platform.select({
      web: 120,
      default: 100
    }),
    borderRadius: Platform.select({
      web: 60,
      default: 50
    }),
    borderWidth: 3,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
  editAvatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
    ...Platform.select({
      web: {
        cursor: 'pointer'
      }
    })
  },
  username: {
    fontSize: Platform.select({
      web: 24,
      default: 20
    }),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  displayName: {
    fontSize: Platform.select({
      web: 18,
      default: 16
    }),
    color: theme.colors.textSecondary,
    marginBottom: 10,
  },
  bio: {
    fontSize: Platform.select({
      web: 16,
      default: 14
    }),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    minWidth: Platform.select({
      web: 100,
      default: 80
    }),
    ...Platform.select({
      web: {
        cursor: 'pointer',
        ':hover': {
          opacity: 0.8
        }
      }
    })
  },
  statNumber: {
    fontSize: Platform.select({
      web: 20,
      default: 18
    }),
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: Platform.select({
      web: 14,
      default: 12
    }),
    color: theme.colors.textSecondary,
    marginTop: 5,
  },
  editProfileButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'opacity 0.2s',
        ':hover': {
          opacity: 0.9
        }
      }
    })
  },
  editProfileButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
          backgroundColor: theme.colors.background + '80'
        }
      },
      ios: {},
      android: {}
    })
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  videoThumbnail: {
    padding: 1,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.2s',
        ':hover': {
          transform: 'scale(1.02)'
        }
      },
      default: {
        elevation: 1
      }
    })
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  videoStats: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  videoStatsText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 12,
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: 200,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: Platform.select({
      web: 18,
      default: 16
    }),
  },
  gridContainer: {
    paddingBottom: Platform.select({
      web: 40,
      default: 20
    }),
  },
  mainScrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch'
      },
      android: {
        scrollbarWidth: 0
      },
      ios: {
        scrollIndicatorInsets: { right: 1 }
      }
    })
  },
  '@media screen and (-webkit-min-device-pixel-ratio:0)': {
    mainScrollView: {
      '&::-webkit-scrollbar': {
        width: 0,
        height: 0
      }
    }
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingVertical: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s',
        ':hover': {
          backgroundColor: theme.colors.background + '80'
        }
      },
      ios: {},
      android: {}
    })
  },
  tabIcon: {
    marginBottom: 5,
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch'
      },
      android: {
        scrollbarWidth: 0
      },
      ios: {
        scrollIndicatorInsets: { right: 1 }
      }
    })
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModal: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  logoutTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logoutMessage: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  logoutButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerBanner: {
    marginVertical: 10,
  },
  footerBanner: {
    marginVertical: 10,
  },
});

export default ProfileScreen;
