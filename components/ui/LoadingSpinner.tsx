import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export function LoadingSpinner({ 
  size = 'large', 
  color = '#007AFF', 
  text = 'Loading...', 
  fullScreen = false,
  style 
}: LoadingSpinnerProps) {
  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;

  return (
    <ThemedView style={[containerStyle, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <ThemedText style={styles.text}>
          {text}
        </ThemedText>
      )}
    </ThemedView>
  );
}

// Skeleton Loading Components
interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({ 
  width = 100, 
  height = 20, 
  borderRadius = 4,
  style 
}: SkeletonProps) {
  return (
    <View 
      style={[
        styles.skeleton,
        { 
          width, 
          height, 
          borderRadius 
        },
        style
      ]} 
    />
  );
}

// Movie Card Skeleton
export function MovieCardSkeleton() {
  return (
    <View style={styles.movieCardSkeleton}>
      <SkeletonLoader 
        width="100%" 
        height={200} 
        borderRadius={8} 
        style={styles.posterSkeleton} 
      />
      <View style={styles.movieInfoSkeleton}>
        <SkeletonLoader width="80%" height={16} style={styles.titleSkeleton} />
        <SkeletonLoader width="60%" height={14} style={styles.ratingSkeleton} />
        <SkeletonLoader width="40%" height={12} style={styles.dateSkeleton} />
      </View>
    </View>
  );
}

// Movie List Skeleton
interface MovieListSkeletonProps {
  count?: number;
  columns?: number;
}

export function MovieListSkeleton({ count = 6, columns = 2 }: MovieListSkeletonProps) {
  return (
    <View style={[styles.listSkeleton, { flexDirection: columns > 1 ? 'row' : 'column' }]}>
      {Array.from({ length: count }).map((_, index) => (
        <View 
          key={index} 
          style={[
            styles.skeletonItem,
            columns > 1 && { width: `${100 / columns}%` }
          ]}
        >
          <MovieCardSkeleton />
        </View>
      ))}
    </View>
  );
}

// Search Result Skeleton
export function SearchResultSkeleton() {
  return (
    <View style={styles.searchResultSkeleton}>
      <SkeletonLoader width={80} height={120} borderRadius={8} />
      <View style={styles.searchInfoSkeleton}>
        <SkeletonLoader width="90%" height={16} style={styles.searchTitleSkeleton} />
        <SkeletonLoader width="100%" height={12} style={styles.searchDescSkeleton} />
        <SkeletonLoader width="100%" height={12} style={styles.searchDescSkeleton} />
        <SkeletonLoader width="50%" height={12} style={styles.searchDateSkeleton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  skeleton: {
    backgroundColor: '#E1E9EE',
    overflow: 'hidden',
  },
  movieCardSkeleton: {
    width: '100%',
    marginBottom: 16,
  },
  posterSkeleton: {
    marginBottom: 8,
  },
  movieInfoSkeleton: {
    paddingHorizontal: 4,
  },
  titleSkeleton: {
    marginBottom: 6,
  },
  ratingSkeleton: {
    marginBottom: 4,
  },
  dateSkeleton: {
    marginBottom: 4,
  },
  listSkeleton: {
    padding: 16,
    flexWrap: 'wrap',
  },
  skeletonItem: {
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  searchResultSkeleton: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
  },
  searchInfoSkeleton: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  searchTitleSkeleton: {
    marginBottom: 8,
  },
  searchDescSkeleton: {
    marginBottom: 4,
  },
  searchDateSkeleton: {
    marginTop: 4,
  },
});

export default LoadingSpinner; 