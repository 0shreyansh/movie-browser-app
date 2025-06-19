import React, { useRef, useEffect } from 'react';
import {
  RefreshControl,
  RefreshControlProps,
  Animated,
  View,
  StyleSheet,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../contexts/ThemeContext';
import { haptic } from '../../services/hapticService';
import { Typography, Spacing, BorderRadius } from '../../constants/Layout';
import { Colors } from '../../constants/Colors';

interface PullToRefreshProps extends Omit<RefreshControlProps, 'refreshing' | 'onRefresh'> {
  refreshing: boolean;
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showProgress?: boolean;
  enableHaptic?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  refreshing,
  onRefresh,
  children,
  title = 'Pull to refresh',
  subtitle = 'Release to update',
  showProgress = true,
  enableHaptic = true,
  ...refreshControlProps
}) => {
  const { colors, isDarkMode } = useTheme();
  const rotateValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (refreshing) {
      // Start rotation animation
      Animated.loop(
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();

      // Scale animation
      Animated.timing(scaleValue, {
        toValue: 1.1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Opacity animation
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (enableHaptic) {
        haptic.refreshStart();
      }
    } else {
      // Reset animations
      rotateValue.setValue(0);
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      Animated.timing(opacityValue, {
        toValue: 0.7,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (enableHaptic) {
        haptic.refreshComplete();
      }
    }
  }, [refreshing, rotateValue, scaleValue, opacityValue, enableHaptic]);

  const handleRefresh = async () => {
    if (enableHaptic) {
      await haptic.pullToRefresh();
    }
    await onRefresh();
  };

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const refreshControlStyle = {
    backgroundColor: isDarkMode ? colors.surface : colors.background,
    tintColor: colors.primary,
  };

  const CustomRefreshControl = () => (
    <RefreshControl
      {...refreshControlProps}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={colors.primary}
      titleColor={colors.text}
      colors={[colors.primary, colors.secondary]} // Android
      progressBackgroundColor={colors.surface} // Android
      size={RefreshControl.SIZE.DEFAULT}
      style={refreshControlStyle}
      title={refreshing ? 'Updating...' : title}
    />
  );

  return (
    <Animated.ScrollView
      refreshControl={<CustomRefreshControl />}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      {showProgress && refreshing && (
        <View style={styles.customIndicatorContainer}>
          <LinearGradient
            colors={[
              `${colors.primary}20`,
              `${colors.primary}10`,
              'transparent'
            ]}
            style={styles.gradientBackground}
          />
          
          <Animated.View
            style={[
              styles.customIndicator,
              {
                backgroundColor: colors.surface,
                borderColor: `${colors.primary}30`,
                transform: [{ scale: scaleValue }],
                opacity: opacityValue,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ rotate }],
                },
              ]}
            >
              <Ionicons
                name="refresh"
                size={24}
                color={colors.primary}
              />
            </Animated.View>
            
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: colors.text }]}>
                {refreshing ? 'Updating...' : title}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {refreshing ? 'Getting latest movies' : subtitle}
              </Text>
            </View>
          </Animated.View>
        </View>
      )}
      
      {children}
    </Animated.ScrollView>
  );
};

export default PullToRefresh;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customIndicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    paddingTop: 60,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  customIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: -20,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  title: {
    fontSize: Typography.body.fontSize,
    fontWeight: Typography.body.fontWeight as any,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight as any,
  },
});

// Enhanced FlatList with Pull-to-Refresh
interface EnhancedFlatListProps {
  data: any[];
  renderItem: ({ item, index }: { item: any; index: number }) => React.ReactElement;
  refreshing: boolean;
  onRefresh: () => Promise<void> | void;
  keyExtractor?: (item: any, index: number) => string;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  numColumns?: number;
  horizontal?: boolean;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  contentContainerStyle?: any;
  style?: any;
  enableHaptic?: boolean;
}

export const EnhancedFlatList: React.FC<EnhancedFlatListProps> = ({
  data,
  renderItem,
  refreshing,
  onRefresh,
  keyExtractor,
  onEndReached,
  onEndReachedThreshold = 0.1,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  numColumns,
  horizontal = false,
  showsVerticalScrollIndicator = false,
  showsHorizontalScrollIndicator = false,
  contentContainerStyle,
  style,
  enableHaptic = true,
  ...props
}) => {
  const { colors } = useTheme();

  const handleEndReached = () => {
    if (onEndReached && enableHaptic) {
      haptic.loadMoreItems();
      onEndReached();
    }
  };

  const handleRefresh = async () => {
    if (enableHaptic) {
      await haptic.pullToRefresh();
    }
    await onRefresh();
  };

  return (
    <Animated.FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      numColumns={numColumns}
      horizontal={horizontal}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      contentContainerStyle={contentContainerStyle}
      style={style}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          titleColor={colors.text}
          colors={[colors.primary, colors.secondary]}
          progressBackgroundColor={colors.surface}
          title={refreshing ? 'Updating...' : 'Pull to refresh'}
        />
      }
      {...props}
    />
  );
}; 