import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

import { useTheme } from '../../contexts/ThemeContext';
import { cacheService } from '../../services/cacheService';
import { haptic } from '../../services/hapticService';
import { Typography, Spacing, BorderRadius } from '../../constants/Layout';

interface NetworkState {
  isConnected: boolean;
  type: string | null;
  isInternetReachable: boolean | null;
  strength?: number;
}

interface NetworkIndicatorProps {
  showDetails?: boolean;
  onRetry?: () => void;
  style?: any;
}

export const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({
  showDetails = false,
  onRetry,
  style,
}) => {
  const { colors, isDarkMode } = useTheme();
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    type: null,
    isInternetReachable: null,
  });
  const [showNetworkInfo, setShowNetworkInfo] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);
  
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Get initial network state
    NetInfo.fetch().then(handleNetworkChange);

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    // Load cache stats
    loadCacheStats();

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!networkState.isConnected) {
      // Show offline indicator
      showIndicator();
      haptic.errorOccurred();
    } else {
      // Hide offline indicator
      hideIndicator();
      if (networkState.isConnected) {
        haptic.actionCompleted();
      }
    }
  }, [networkState.isConnected]);

  const handleNetworkChange = (state: NetInfoState) => {
    setNetworkState({
      isConnected: state.isConnected ?? false,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
    });
  };

  const loadCacheStats = async () => {
    try {
      const stats = await cacheService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.warn('Failed to load cache stats:', error);
    }
  };

  const showIndicator = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideIndicator = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRetry = async () => {
    await haptic.buttonPress();
    
    // Check network again
    const state = await NetInfo.fetch();
    handleNetworkChange(state);
    
    if (onRetry) {
      onRetry();
    }
  };

  const handleShowDetails = () => {
    setShowNetworkInfo(!showNetworkInfo);
    haptic.selection();
  };

  const showNetworkDetails = () => {
    Alert.alert(
      'Network Status',
      `Connection: ${networkState.isConnected ? 'Connected' : 'Disconnected'}
Type: ${networkState.type || 'Unknown'}
Internet: ${networkState.isInternetReachable ? 'Available' : 'Not Available'}

Cache Status:
Items cached: ${cacheStats?.totalItems || 0}
Cache size: ${cacheStats?.totalSize || '0 KB'}`,
      [
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            await cacheService.clear();
            await loadCacheStats();
            haptic.actionCompleted();
          },
        },
        { text: 'OK', style: 'default' },
      ]
    );
  };

  const getConnectionIcon = () => {
    if (!networkState.isConnected) {
      return 'cloud-offline-outline';
    }
    
    switch (networkState.type) {
      case 'wifi':
        return 'wifi';
      case 'cellular':
        return 'cellular';
      case 'bluetooth':
        return 'bluetooth';
      case 'ethernet':
        return 'globe-outline';
      default:
        return 'cloud-done-outline';
    }
  };

  const getConnectionText = () => {
    if (!networkState.isConnected) {
      return 'No connection';
    }
    
    if (networkState.isInternetReachable === false) {
      return 'Connected but no internet';
    }
    
    return `Connected via ${networkState.type || 'unknown'}`;
  };

  const getStatusColor = () => {
    if (!networkState.isConnected) {
      return '#FF6B6B'; // Red
    }
    
    if (networkState.isInternetReachable === false) {
      return '#FFD93D'; // Yellow
    }
    
    return '#6BCF7F'; // Green
  };

  // Don't render if connected and not showing details
  if (networkState.isConnected && !showDetails) {
    return null;
  }

  return (
    <>
      {/* Offline Indicator */}
      {!networkState.isConnected && (
        <Animated.View
          style={[
            styles.offlineIndicator,
            {
              backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5',
              borderBottomColor: getStatusColor(),
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
            },
            style,
          ]}
        >
          <View style={styles.offlineContent}>
            <View style={styles.offlineIcon}>
              <Ionicons
                name={getConnectionIcon()}
                size={20}
                color={getStatusColor()}
              />
            </View>
            
            <View style={styles.offlineTextContainer}>
              <Text style={[styles.offlineTitle, { color: colors.text }]}>
                You're offline
              </Text>
              <Text style={[styles.offlineSubtitle, { color: colors.textSecondary }]}>
                Showing cached content
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: getStatusColor() }]}
              onPress={handleRetry}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Network Status Details */}
      {showDetails && (
        <TouchableOpacity
          style={[
            styles.networkDetails,
            {
              backgroundColor: isDarkMode ? colors.surface : colors.background,
              borderColor: `${getStatusColor()}30`,
            },
          ]}
          onPress={showNetworkDetails}
          activeOpacity={0.7}
        >
          <View style={styles.networkDetailsContent}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
            
            <View style={styles.networkInfo}>
              <Text style={[styles.connectionText, { color: colors.text }]}>
                {getConnectionText()}
              </Text>
              
              {cacheStats && (
                <Text style={[styles.cacheText, { color: colors.textSecondary }]}>
                  {cacheStats.totalItems} items cached • {cacheStats.totalSize}
                </Text>
              )}
            </View>
            
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>
      )}
    </>
  );
};

// Connection status badge
export const ConnectionBadge: React.FC<{
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}> = ({ size = 'medium', showText = false }) => {
  const { colors } = useTheme();
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    type: null,
    isInternetReachable: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      });
    });

    return unsubscribe;
  }, []);

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { iconSize: 12, badgeSize: 20, fontSize: 10 };
      case 'large':
        return { iconSize: 20, badgeSize: 32, fontSize: 14 };
      default:
        return { iconSize: 16, badgeSize: 24, fontSize: 12 };
    }
  };

  const config = getSizeConfig();
  const statusColor = networkState.isConnected ? '#6BCF7F' : '#FF6B6B';

  return (
    <View style={styles.connectionBadgeContainer}>
      <View
        style={[
          styles.connectionBadge,
          {
            width: config.badgeSize,
            height: config.badgeSize,
            backgroundColor: statusColor,
          },
        ]}
      >
        <Ionicons
          name={networkState.isConnected ? 'checkmark' : 'close'}
          size={config.iconSize}
          color="white"
        />
      </View>
      
      {showText && (
        <Text
          style={[
            styles.connectionBadgeText,
            {
              color: colors.textSecondary,
              fontSize: config.fontSize,
            },
          ]}
        >
          {networkState.isConnected ? 'Online' : 'Offline'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  offlineIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: 2,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  offlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingTop: 50, // Account for status bar
  },
  offlineIcon: {
    marginRight: Spacing.sm,
  },
  offlineTextContainer: {
    flex: 1,
  },
  offlineTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: Typography.body.fontWeight as any,
    marginBottom: 2,
  },
  offlineSubtitle: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight as any,
  },
  retryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  retryButtonText: {
    color: 'white',
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
  },
  networkDetails: {
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  networkDetailsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  networkInfo: {
    flex: 1,
  },
  connectionText: {
    fontSize: Typography.body.fontSize,
    fontWeight: Typography.body.fontWeight as any,
    marginBottom: 2,
  },
  cacheText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight as any,
  },
  connectionBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionBadge: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  connectionBadgeText: {
    fontWeight: '500',
  },
});

export default NetworkIndicator; 