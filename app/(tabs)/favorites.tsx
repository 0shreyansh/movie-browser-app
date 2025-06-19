import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MovieCard } from '@/components/movie/MovieCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

import { useFavorites } from '@/contexts/FavoritesContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Movie } from '@/types/movie';
import { MovieColors } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/Layout';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    state: { favorites, isLoading, error },
    clearFavorites,
    searchFavorites,
  } = useFavorites();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'alphabetical'>('recent');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isClearing, setIsClearing] = useState(false);

  // Filter and sort favorites
  const filteredAndSortedFavorites = useMemo(() => {
    let filtered = favorites;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchFavorites(searchQuery);
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        return [...filtered].sort((a, b) => b.vote_average - a.vote_average);
      case 'alphabetical':
        return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
      case 'recent':
      default:
        return filtered; // Already in recent order from context
    }
  }, [favorites, searchQuery, sortBy, searchFavorites]);

  const handleMoviePress = (movie: Movie) => {
    router.push(`/movie/${movie.id}`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Since favorites are cached locally, just reset the loading state
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleClearFavorites = () => {
    Alert.alert(
      'Clear All Favorites',
      'Are you sure you want to remove all movies from your favorites? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              await clearFavorites();
              // Clear search query to show empty state immediately
              setSearchQuery('');
            } catch (error) {
              console.error('Failed to clear favorites:', error);
              Alert.alert('Error', 'Failed to clear favorites. Please try again.');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <ThemedText style={[styles.title, { color: colors.textPrimary }]}>
          My Favorites
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {favorites.length} {favorites.length === 1 ? 'movie' : 'movies'}
        </ThemedText>
      </View>

      {favorites.length > 0 && (
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons
              name={viewMode === 'grid' ? 'list' : 'grid'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton, 
              { 
                backgroundColor: colors.surface,
                opacity: isClearing ? 0.6 : 1 
              }
            ]}
            onPress={handleClearFavorites}
            disabled={isClearing}
          >
            <Ionicons 
              name={isClearing ? "hourglass-outline" : "trash-outline"} 
              size={20} 
              color={colors.error} 
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.filtersContainer}>
      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search favorites..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersRow}
        contentContainerStyle={styles.filtersContent}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            { backgroundColor: sortBy === 'recent' ? colors.primary : colors.surface },
          ]}
          onPress={() => setSortBy('recent')}
        >
          <ThemedText
            style={[
              styles.filterChipText,
              { color: sortBy === 'recent' ? colors.textInverse : colors.textSecondary },
            ]}
          >
            Recent
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            { backgroundColor: sortBy === 'rating' ? colors.primary : colors.surface },
          ]}
          onPress={() => setSortBy('rating')}
        >
          <ThemedText
            style={[
              styles.filterChipText,
              { color: sortBy === 'rating' ? colors.textInverse : colors.textSecondary },
            ]}
          >
            Top Rated
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            { backgroundColor: sortBy === 'alphabetical' ? colors.primary : colors.surface },
          ]}
          onPress={() => setSortBy('alphabetical')}
        >
          <ThemedText
            style={[
              styles.filterChipText,
              { color: sortBy === 'alphabetical' ? colors.textInverse : colors.textSecondary },
            ]}
          >
            A-Z
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={80} color={colors.textTertiary} />
      <ThemedText style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        No Favorites Yet
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Tap the heart icon on any movie to add it to your favorites
      </ThemedText>
      <TouchableOpacity
        style={[styles.exploreButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/')}
      >
        <ThemedText style={[styles.exploreButtonText, { color: colors.textInverse }]}>
          Explore Movies
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderMovieGrid = () => (
    <View style={styles.moviesGrid}>
      {filteredAndSortedFavorites.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onPress={handleMoviePress}
          cardWidth={CARD_WIDTH}
          variant={viewMode}
          priority="normal"
        />
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorMessage message={error} onRetry={handleRefresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        
        {favorites.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {renderSearchAndFilters()}
            {filteredAndSortedFavorites.length === 0 ? (
              <View style={styles.noResults}>
                <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
                <ThemedText style={[styles.noResultsText, { color: colors.textSecondary }]}>
                  No movies match your search
                </ThemedText>
              </View>
            ) : (
              renderMovieGrid()
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    paddingVertical: Spacing.xs,
  },
  clearSearch: {
    marginLeft: Spacing.sm,
  },
  filtersRow: {
    flexGrow: 0,
  },
  filtersContent: {
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    marginRight: Spacing.sm,
  },
  filterChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  moviesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  exploreButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.round,
  },
  exploreButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  noResultsText: {
    fontSize: FontSize.md,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
}); 