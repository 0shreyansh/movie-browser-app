import React, { memo, useMemo, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  Dimensions,
  ListRenderItem,
  ViewStyle,
} from 'react-native';
import { Movie } from '../../types/movie';
import MovieCard from './MovieCard';
import { LoadingSpinner, MovieListSkeleton } from '../ui/LoadingSpinner';
import { ErrorMessage, NoResults } from '../ui/ErrorMessage';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 2 * 1.5 + 80; // Dynamic card height + text space

interface MovieListProps {
  movies: Movie[];
  loading?: boolean;
  error?: string | null;
  refreshing?: boolean;
  hasMorePages?: boolean;
  searchQuery?: string;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  onMoviePress?: (movie: Movie) => void;
  onRetry?: () => void;
  onClearSearch?: () => void;
  numColumns?: number;
  style?: ViewStyle;
  headerComponent?: React.ComponentType<any> | React.ReactElement | null;
  footerComponent?: React.ComponentType<any> | React.ReactElement | null;
  emptyTitle?: string;
  emptyMessage?: string;
  testID?: string;
}

export const MovieList = memo<MovieListProps>(({
  movies,
  loading = false,
  error = null,
  refreshing = false,
  hasMorePages = false,
  searchQuery,
  onRefresh,
  onLoadMore,
  onMoviePress,
  onRetry,
  onClearSearch,
  numColumns = 2,
  style,
  headerComponent,
  footerComponent,
  emptyTitle = "No Movies Found",
  emptyMessage = "There are no movies to display at the moment.",
  testID,
}) => {
  const { colors } = useTheme();
  // Memoized render item for performance
  const renderMovieItem: ListRenderItem<Movie> = useCallback(({ item, index }) => {
    // Dynamic card width that better utilizes screen space
    const cardWidth = numColumns === 1 ? width - 32 : (width - 48) / numColumns;
    const priority = index < 6 ? 'high' : 'normal'; // High priority for first 6 items
    const variant = numColumns === 1 ? 'list' : 'grid';

    return (
      <View style={[
        styles.movieItem,
        numColumns > 1 && { width: `${100 / numColumns}%` },
        numColumns > 1 && { paddingHorizontal: 4 } // Reduced padding for more card space
      ]}>
        <MovieCard
          movie={item}
          onPress={onMoviePress}
          cardWidth={cardWidth}
          priority={priority}
          variant={variant}
        />
      </View>
    );
  }, [numColumns, onMoviePress, width]);

  // Memoized key extractor
  const keyExtractor = useCallback((item: Movie) => item.id.toString(), []);

  // Memoized get item layout for performance
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: ITEM_SIZE,
    offset: ITEM_SIZE * Math.floor(index / numColumns),
    index,
  }), [numColumns]);

  // Footer component for loading more
  const renderFooter = useCallback(() => {
    if (!hasMorePages && !loading) return null;
    
    if (loading && movies.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <LoadingSpinner size="small" text="Loading more..." />
        </View>
      );
    }
    
    return footerComponent || null;
  }, [loading, hasMorePages, movies.length, footerComponent]);

  // Header component
  const renderHeader = useCallback(() => {
    return headerComponent || null;
  }, [headerComponent]);

  // Empty component
  const renderEmpty = useCallback(() => {
    if (loading && movies.length === 0) {
      return <MovieListSkeleton count={6} columns={numColumns} />;
    }

    if (error) {
      return (
        <ErrorMessage
          message={error}
          onRetry={onRetry}
          style={styles.errorContainer}
        />
      );
    }

    if (searchQuery) {
      return (
        <NoResults
          searchQuery={searchQuery}
          onClear={onClearSearch}
          style={styles.noResultsContainer}
        />
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <ErrorMessage
          title={emptyTitle}
          message={emptyMessage}
          showIcon={false}
          style={styles.emptyMessageContainer}
        />
      </View>
    );
  }, [
    loading,
    movies.length,
    error,
    searchQuery,
    onRetry,
    onClearSearch,
    emptyTitle,
    emptyMessage,
    numColumns,
  ]);

  // Handle end reached for infinite scroll
  const handleEndReached = useCallback(() => {
    if (hasMorePages && !loading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMorePages, loading, onLoadMore]);

  // Refresh control
  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;
    
    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={['#007AFF']}
        tintColor="#007AFF"
        title="Pull to refresh"
        titleColor="#666666"
      />
    );
  }, [refreshing, onRefresh]);

  // Content container style
  const contentContainerStyle = useMemo(() => [
    styles.contentContainer,
    movies.length === 0 && styles.emptyContentContainer,
  ], [movies.length]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]} testID={testID}>
      <FlatList
        data={movies}
        renderItem={renderMovieItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        key={numColumns} // Force re-render when columns change
        contentContainerStyle={contentContainerStyle}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        
        // Performance optimizations
        getItemLayout={getItemLayout}
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        
        // Infinite scroll
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        
        // Components
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        
        // Refresh control
        refreshControl={refreshControl}
        
        // Accessibility
        accessibilityRole="list"
        accessibilityLabel="Movies list"
        
        // Styling
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
      />
    </View>
  );
});

MovieList.displayName = 'MovieList';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  movieItem: {
    marginBottom: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorContainer: {
    marginVertical: 40,
  },
  noResultsContainer: {
    marginVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyMessageContainer: {
    minHeight: 200,
  },
});

export default MovieList; 