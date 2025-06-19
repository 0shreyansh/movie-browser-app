import React from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../../constants/Layout';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}) => {
  const { colors, isDarkMode } = useTheme();
  const shimmerPosition = useSharedValue(-1);

  React.useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
      }),
      -1,
      false
    );
  }, [shimmerPosition]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [-1, 1],
      [-200, 200]
    );

    return {
      transform: [{ translateX }],
    };
  });

  const baseColor = isDarkMode ? '#2A2A2A' : '#F5F5F5';
  const highlightColor = isDarkMode ? '#3A3A3A' : '#FFFFFF';

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmerContainer, animatedStyle]}>
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmer}
        />
      </Animated.View>
    </View>
  );
};

export const MovieCardSkeleton: React.FC<{ cardWidth?: number }> = ({ cardWidth }) => {
  // Use responsive width if not provided
  const { width } = Dimensions.get('window');
  const defaultWidth = (width - 48) / 2;
  const finalCardWidth = cardWidth || defaultWidth;
  const cardHeight = finalCardWidth * 1.5;
  
  return (
    <View style={[styles.movieCardSkeleton, { width: finalCardWidth }]}>
      <Skeleton 
        width={finalCardWidth} 
        height={cardHeight} 
        borderRadius={BorderRadius.lg}
        style={styles.posterSkeleton}
      />
      <View style={styles.movieInfoSkeleton}>
        <Skeleton width="90%" height={14} style={{ marginBottom: Spacing.xs }} />
        <Skeleton width="60%" height={12} />
      </View>
    </View>
  );
};

export const MovieListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <View style={styles.movieListSkeleton}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listItemSkeleton}>
          <Skeleton 
            width={80} 
            height={120} 
            borderRadius={BorderRadius.md}
            style={styles.listPosterSkeleton}
          />
          <View style={styles.listContentSkeleton}>
            <Skeleton width="80%" height={18} style={{ marginBottom: Spacing.sm }} />
            <Skeleton width="40%" height={14} style={{ marginBottom: Spacing.sm }} />
            <Skeleton width="100%" height={12} style={{ marginBottom: Spacing.xs }} />
            <Skeleton width="90%" height={12} style={{ marginBottom: Spacing.xs }} />
            <Skeleton width="70%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

export const HeroSkeleton: React.FC = () => {
  const screenWidth = 375; // Default width, will be responsive
  const heroHeight = 400;

  return (
    <View style={[styles.heroSkeleton, { height: heroHeight }]}>
      <Skeleton 
        width="100%" 
        height="100%" 
        borderRadius={0}
        style={styles.heroBackdropSkeleton}
      />
      
      <View style={styles.heroContentSkeleton}>
        <View style={styles.heroInfoSkeleton}>
          <Skeleton width="70%" height={32} style={{ marginBottom: Spacing.md }} />
          <View style={styles.heroMetaSkeleton}>
            <Skeleton width={60} height={16} />
            <Skeleton width={50} height={16} />
          </View>
          <View style={styles.heroOverviewSkeleton}>
            <Skeleton width="100%" height={14} style={{ marginBottom: Spacing.xs }} />
            <Skeleton width="90%" height={14} style={{ marginBottom: Spacing.xs }} />
            <Skeleton width="75%" height={14} />
          </View>
        </View>
        
        <View style={styles.heroActionsSkeleton}>
          <Skeleton width={180} height={50} borderRadius={BorderRadius.xl} />
          <Skeleton width={50} height={50} borderRadius={25} />
        </View>
      </View>
    </View>
  );
};

export const DetailsSkeleton: React.FC = () => {
  return (
    <View style={styles.detailsSkeleton}>
      {/* Hero Section */}
      <HeroSkeleton />
      
      {/* Content Section */}
      <View style={styles.detailsContentSkeleton}>
        {/* Overview Section */}
        <View style={styles.detailsSection}>
          <Skeleton width={100} height={24} style={{ marginBottom: Spacing.md }} />
          <Skeleton width="100%" height={16} style={{ marginBottom: Spacing.sm }} />
          <Skeleton width="95%" height={16} style={{ marginBottom: Spacing.sm }} />
          <Skeleton width="85%" height={16} style={{ marginBottom: Spacing.sm }} />
          <Skeleton width="70%" height={16} />
        </View>
        
        {/* Details Section */}
        <View style={styles.detailsSection}>
          <Skeleton width={80} height={24} style={{ marginBottom: Spacing.md }} />
          {Array.from({ length: 4 }).map((_, index) => (
            <View key={index} style={styles.detailItemSkeleton}>
              <Skeleton width={80} height={16} />
              <Skeleton width={60} height={16} />
            </View>
          ))}
        </View>
        
        {/* Cast Section */}
        <View style={styles.detailsSection}>
          <Skeleton width={60} height={24} style={{ marginBottom: Spacing.md }} />
          <View style={styles.castSkeletonContainer}>
            {Array.from({ length: 5 }).map((_, index) => (
              <View key={index} style={styles.castItemSkeleton}>
                <Skeleton width={60} height={60} borderRadius={30} />
                <Skeleton width={70} height={12} style={{ marginTop: Spacing.sm }} />
                <Skeleton width={50} height={10} style={{ marginTop: Spacing.xs }} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 200,
  },
  shimmer: {
    flex: 1,
  },
  
  // Movie Card Skeleton
  movieCardSkeleton: {
    marginRight: Spacing.sm,
  },
  posterSkeleton: {
    marginBottom: Spacing.sm,
  },
  movieInfoSkeleton: {
    paddingHorizontal: Spacing.xs,
  },
  
  // Movie List Skeleton
  movieListSkeleton: {
    padding: Spacing.md,
  },
  listItemSkeleton: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  listPosterSkeleton: {
    marginRight: Spacing.md,
  },
  listContentSkeleton: {
    flex: 1,
  },
  
  // Hero Skeleton
  heroSkeleton: {
    position: 'relative',
  },
  heroBackdropSkeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContentSkeleton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  heroInfoSkeleton: {
    marginBottom: Spacing.lg,
  },
  heroMetaSkeleton: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  heroOverviewSkeleton: {
    marginTop: Spacing.sm,
  },
  heroActionsSkeleton: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  
  // Details Skeleton
  detailsSkeleton: {
    flex: 1,
  },
  detailsContentSkeleton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingTop: Spacing.xl,
    marginTop: -24,
  },
  detailsSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  detailItemSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  castSkeletonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  castItemSkeleton: {
    alignItems: 'center',
    width: 80,
  },
}); 