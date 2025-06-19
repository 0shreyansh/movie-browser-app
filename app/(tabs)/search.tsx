import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  SlideInRight,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { SearchInput } from '@/components/ui/SearchInput';
import { MovieList } from '@/components/movie/MovieList';
import { GenreFilter } from '@/components/ui/GenreFilter';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useMovies } from '@/contexts/MovieContext';
import { useTheme } from '@/contexts/ThemeContext';
import { tmdbService } from '@/services/api';
import { Movie, Genre } from '@/types/movie';
import { MovieColors, Gradients } from '@/constants/Colors';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/Layout';

type SortOption = 'popularity' | 'rating' | 'release_date' | 'title';
type ViewMode = 'grid' | 'list';

interface FilterOptions {
  genres: number[];
  sortBy: SortOption;
  minRating: number;
  yearRange: [number, number];
}

export default function SearchScreen() {
  const { 
    state, 
    searchMovies, 
    clearSearch, 
    addToSearchHistory, 
    clearSearchHistory 
  } = useMovies();
  
  const { colors, isDarkMode } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    genres: [],
    sortBy: 'popularity',
    minRating: 0,
    yearRange: [1980, new Date().getFullYear()],
  });

  // Animation values
  const filterButtonScale = useSharedValue(1);
  const sortButtonScale = useSharedValue(1);

  // Load genres on mount
  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      setGenresLoading(true);
      const genreList = await tmdbService.getGenres();
      setGenres(genreList);
    } catch (error) {
      console.error('Failed to load genres:', error);
    } finally {
      setGenresLoading(false);
    }
  };

  // Filter and sort movies
  const filteredAndSortedMovies = useMemo(() => {
    const movies = searchQuery && state.searchResults.length > 0 
      ? state.searchResults 
      : state.popularMovies;

    let filtered = movies;

    // Filter by genres
    if (filters.genres.length > 0) {
      filtered = filtered.filter(movie => 
        movie.genre_ids.some(genreId => filters.genres.includes(genreId))
      );
    }

    // Filter by rating
    if (filters.minRating > 0) {
      filtered = filtered.filter(movie => movie.vote_average >= filters.minRating);
    }

    // Filter by year range
    filtered = filtered.filter(movie => {
      if (!movie.release_date) return true;
      const year = new Date(movie.release_date).getFullYear();
      return year >= filters.yearRange[0] && year <= filters.yearRange[1];
    });

    // Sort movies
    const sortedMovies = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'popularity':
          return b.popularity - a.popularity;
        case 'rating':
          return b.vote_average - a.vote_average;
        case 'release_date':
          return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return sortedMovies;
  }, [state.searchResults, state.popularMovies, searchQuery, filters]);

  // Event handlers
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchMovies(query.trim());
    } else {
      clearSearch();
    }
  }, [searchMovies, clearSearch]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    setFilters(prev => ({ ...prev, genres: [] }));
    clearSearch();
  }, [clearSearch]);

  const handleHistorySelect = useCallback(async (query: string) => {
    setSearchQuery(query);
    await searchMovies(query);
  }, [searchMovies]);

  const handleMoviePress = useCallback((movie: Movie) => {
    router.push(`/movie/${movie.id}`);
  }, []);

  const handleGenreToggle = useCallback((genreId: number) => {
    setFilters(prev => ({
      ...prev,
      genres: genreId === 0 
        ? [] // Clear all if "All" is selected
        : prev.genres.includes(genreId)
          ? prev.genres.filter(id => id !== genreId)
          : [...prev.genres, genreId]
    }));
  }, []);

  const handleGenreClear = useCallback(() => {
    setFilters(prev => ({ ...prev, genres: [] }));
  }, []);

  const handleSortChange = useCallback((sortBy: SortOption) => {
    setFilters(prev => ({ ...prev, sortBy }));
    sortButtonScale.value = withSpring(1.1, {}, () => {
      sortButtonScale.value = withSpring(1);
    });
  }, [sortButtonScale]);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
    filterButtonScale.value = withSpring(1.1, {}, () => {
      filterButtonScale.value = withSpring(1);
    });
  }, [filterButtonScale]);

  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  }, []);

  // Animated styles
  const filterButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: filterButtonScale.value }],
  }));

  const sortButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sortButtonScale.value }],
  }));

  // Helper functions
  const getEmptyTitle = () => {
    if (searchQuery) return "No Results Found";
    if (filters.genres.length > 0) return "No Movies Match Filters";
    return "Discover Movies";
  };

  const getEmptyMessage = () => {
    if (searchQuery) {
      return `No movies found for "${searchQuery}". Try different keywords or adjust your filters.`;
    }
    if (filters.genres.length > 0) {
      return "No movies found with the selected filters. Try adjusting your criteria.";
    }
    return "Search for movies or browse by genre to discover your next favorite film.";
  };

  const getSortLabel = (sortBy: SortOption): string => {
    switch (sortBy) {
      case 'popularity': return 'Popular';
      case 'rating': return 'Top Rated';
      case 'release_date': return 'Latest';
      case 'title': return 'A-Z';
      default: return 'Popular';
    }
  };

  const hasActiveFilters = filters.genres.length > 0 || filters.minRating > 0 || 
    (filters.yearRange[0] > 1980 || filters.yearRange[1] < new Date().getFullYear());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={[colors.background, colors.backgroundSecondary]}
          style={styles.header}
        >
          <Animated.View entering={FadeInDown.delay(100)} style={styles.headerContent}>
            <ThemedText style={[styles.title, { color: colors.textPrimary }]}>
              Discover Movies
            </ThemedText>
            
            {/* Search Input */}
            <SearchInput
              value={searchQuery}
              placeholder="Search movies, actors, directors..."
              onSearch={handleSearch}
              onClear={handleClear}
              searchHistory={state.searchHistory}
              onHistorySelect={handleHistorySelect}
              onClearHistory={clearSearchHistory}
              style={styles.searchInput}
            />

            {/* Filter Controls */}
            <Animated.View entering={SlideInRight.delay(200)} style={styles.controlsRow}>
              {/* Filter Button */}
              <Animated.View style={filterButtonAnimatedStyle}>
                <TouchableOpacity
                  style={[
                    styles.filterButton, 
                    { 
                      backgroundColor: hasActiveFilters ? colors.primary : colors.surface,
                      borderColor: hasActiveFilters ? colors.primary : colors.border 
                    },
                    Shadow.sm
                  ]}
                  onPress={toggleFilters}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name="options-outline" 
                    size={18} 
                    color={hasActiveFilters ? colors.textInverse : colors.textSecondary} 
                  />
                  <ThemedText style={[
                    styles.filterButtonText, 
                    { color: hasActiveFilters ? colors.textInverse : colors.textSecondary }
                  ]}>
                    Filters
                  </ThemedText>
                  {hasActiveFilters && (
                    <View style={[styles.filterBadge, { backgroundColor: colors.textInverse }]}>
                      <ThemedText style={[styles.filterBadgeText, { color: colors.primary }]}>
                        {filters.genres.length}
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Sort Button */}
              <Animated.View style={sortButtonAnimatedStyle}>
                <TouchableOpacity
                  style={[styles.sortButton, { backgroundColor: colors.surface, borderColor: colors.border }, Shadow.sm]}
                  onPress={() => {
                    const sortOptions: SortOption[] = ['popularity', 'rating', 'release_date', 'title'];
                    const currentIndex = sortOptions.indexOf(filters.sortBy);
                    const nextIndex = (currentIndex + 1) % sortOptions.length;
                    handleSortChange(sortOptions[nextIndex]);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="swap-vertical-outline" size={18} color={colors.textSecondary} />
                  <ThemedText style={[styles.sortButtonText, { color: colors.textSecondary }]}>
                    {getSortLabel(filters.sortBy)}
                  </ThemedText>
                </TouchableOpacity>
              </Animated.View>

              {/* View Mode Toggle */}
              <TouchableOpacity
                style={[styles.viewModeButton, { backgroundColor: colors.surface, borderColor: colors.border }, Shadow.sm]}
                onPress={toggleViewMode}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={viewMode === 'grid' ? "list-outline" : "grid-outline"} 
                  size={18} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </LinearGradient>

        {/* Genre Filter */}
        {!genresLoading && (
          <Animated.View entering={FadeInUp.delay(300)} layout={Layout.springify()}>
            <GenreFilter
              genres={genres}
              selectedGenres={filters.genres}
              onGenreToggle={handleGenreToggle}
              onClear={handleGenreClear}
              style={[styles.genreFilter, { backgroundColor: colors.background }]}
            />
          </Animated.View>
        )}

        {/* Movie Results */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.resultsContainer}>
          <MovieList
            movies={filteredAndSortedMovies}
            loading={state.searchLoading || (state.loading && !searchQuery) || genresLoading}
            error={state.error}
            searchQuery={searchQuery}
            onMoviePress={handleMoviePress}
            onClearSearch={handleClear}
            emptyTitle={getEmptyTitle()}
            emptyMessage={getEmptyMessage()}
            style={styles.movieList}
            numColumns={viewMode === 'list' ? 1 : 2}
          />
        </Animated.View>

        {/* Filter Modal */}
        <Modal
          visible={showFilters}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowFilters(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <ThemedText style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Filter Movies
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Rating Filter */}
              <View style={styles.filterSection}>
                <ThemedText style={[styles.filterSectionTitle, { color: colors.textPrimary }]}>
                  Minimum Rating
                </ThemedText>
                <View style={styles.ratingOptions}>
                  {[0, 5, 6, 7, 8, 9].map(rating => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingOption,
                        {
                          backgroundColor: filters.minRating === rating ? colors.primary : colors.surface,
                          borderColor: colors.border
                        }
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                    >
                      <Ionicons 
                        name="star" 
                        size={16} 
                        color={filters.minRating === rating ? colors.textInverse : colors.rating} 
                      />
                      <ThemedText style={[
                        styles.ratingOptionText,
                        { color: filters.minRating === rating ? colors.textInverse : colors.textSecondary }
                      ]}>
                        {rating === 0 ? 'Any' : `${rating}+`}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sort Options */}
              <View style={styles.filterSection}>
                <ThemedText style={[styles.filterSectionTitle, { color: colors.textPrimary }]}>
                  Sort By
                </ThemedText>
                <View style={styles.sortOptions}>
                  {(['popularity', 'rating', 'release_date', 'title'] as SortOption[]).map(sortOption => (
                    <TouchableOpacity
                      key={sortOption}
                      style={[
                        styles.sortOption,
                        {
                          backgroundColor: filters.sortBy === sortOption ? colors.primary : colors.surface,
                          borderColor: colors.border
                        }
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, sortBy: sortOption }))}
                    >
                      <ThemedText style={[
                        styles.sortOptionText,
                        { color: filters.sortBy === sortOption ? colors.textInverse : colors.textSecondary }
                      ]}>
                        {getSortLabel(sortOption)}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingBottom: Spacing.md,
  },
  headerContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  title: {
    fontSize: FontSize.giant,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  searchInput: {
    marginBottom: Spacing.md,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  filterButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  filterBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  sortButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  viewModeButton: {
    width: 44,
    height: 36,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genreFilter: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  resultsContainer: {
    flex: 1,
  },
  movieList: {
    flex: 1,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  filterSection: {
    marginVertical: Spacing.lg,
  },
  filterSectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  ratingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  ratingOptionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  sortOptions: {
    gap: Spacing.sm,
  },
  sortOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  sortOptionText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
}); 