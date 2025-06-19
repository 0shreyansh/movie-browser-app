import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    Extrapolate,
    FadeInDown,
    FadeInUp,
    interpolate,
    Layout,
    SlideInRight,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MovieCard } from '@/components/movie/MovieCard';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { NetworkIndicator } from '@/components/ui/NetworkIndicator';
import { BorderRadius, FontSize, FontWeight, Shadow, Spacing } from '@/constants/Layout';
import { useMovies } from '@/contexts/MovieContext';
import { useTheme } from '@/contexts/ThemeContext';
import { tmdbService } from '@/services/api';
import { Movie } from '@/types/movie';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

interface HeroMovieProps {
  movie: Movie;
  onPress: (movie: Movie) => void;
}

const HeroMovie: React.FC<HeroMovieProps> = ({ movie, onPress }) => {
  const { colors, isDarkMode } = useTheme();
  const { toggleFavorite, isFavorite } = useMovies();
  
  const backdropURL = tmdbService.getBackdropURL(movie.backdrop_path, 'w1280');
  const isMovieFavorite = isFavorite(movie.id);

  const handleFavoritePress = useCallback(async () => {
    try {
      await toggleFavorite(movie);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [movie, toggleFavorite]);

  return (
    <TouchableOpacity
      style={styles.heroContainer}
      onPress={() => onPress(movie)}
      activeOpacity={0.95}
    >
      {/* Background Image */}
      {backdropURL && (
        <Image
          source={{ uri: backdropURL }}
          style={styles.heroImage}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          priority="high"
        />
      )}

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
        style={styles.heroGradient}
      />

      {/* Content */}
      <View style={styles.heroContent}>
        <View style={styles.heroInfo}>
          <ThemedText style={[styles.heroTitle, { color: '#FFFFFF' }]}>
            {movie.title}
          </ThemedText>
          
          <View style={styles.heroMeta}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={colors.rating} />
              <ThemedText style={[styles.ratingText, { color: '#FFFFFF' }]}>
                {movie.vote_average.toFixed(1)}
              </ThemedText>
            </View>
            
            <View style={styles.metaDivider} />
            
            <ThemedText style={[styles.yearText, { color: '#FFFFFF' }]}>
              {new Date(movie.release_date).getFullYear()}
            </ThemedText>
          </View>

          <ThemedText 
            style={[styles.heroOverview, { color: '#FFFFFF' }]}
            numberOfLines={3}
          >
            {movie.overview}
          </ThemedText>
        </View>

        <View style={styles.heroActions}>
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: colors.textInverse }]}
            onPress={() => onPress(movie)}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={20} color={colors.textPrimary} />
            <ThemedText style={[styles.playButtonText, { color: colors.textPrimary }]}>
              Details
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.favoriteHeroButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
            onPress={handleFavoritePress}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isMovieFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isMovieFavorite ? colors.primary : colors.textInverse}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface MovieSectionProps {
  title: string;
  movies: Movie[];
  loading?: boolean;
  onMoviePress: (movie: Movie) => void;
  onSeeAllPress?: () => void;
}

const MovieSection: React.FC<MovieSectionProps> = ({
  title,
  movies,
  loading,
  onMoviePress,
  onSeeAllPress,
}) => {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {title}
          </ThemedText>
        </View>
        <LoadingSpinner style={styles.sectionLoading} />
      </View>
    );
  }

  if (!movies || movies.length === 0) return null;

  return (
    <Animated.View 
      entering={FadeInUp.delay(300)} 
      layout={Layout.springify()}
      style={styles.sectionContainer}
    >
      <View style={styles.sectionHeader}>
        <ThemedText style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {title}
        </ThemedText>
        
        {onSeeAllPress && (
          <TouchableOpacity onPress={onSeeAllPress} activeOpacity={0.7}>
            <ThemedText style={[styles.seeAllText, { color: colors.primary }]}>
              See All
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.movieScroll}
        contentContainerStyle={styles.movieScrollContent}
        decelerationRate="fast"
        snapToInterval={(screenWidth * 0.4) + Spacing.sm}
        snapToAlignment="start"
      >
        {movies.slice(0, 10).map((movie, index) => (
          <Animated.View
            key={movie.id}
            entering={SlideInRight.delay(100 + index * 50)}
            style={styles.movieCardWrapper}
          >
            <MovieCard
              movie={movie}
              onPress={onMoviePress}
              cardWidth={screenWidth * 0.4}
              priority={index < 3 ? 'high' : 'normal'}
              variant="grid"
            />
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const { state, fetchPopularMovies, refreshData } = useMovies();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  
  const [refreshing, setRefreshing] = useState(false);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  
  // Animation values
  const scrollY = useSharedValue(0);

  // Load data on mount
  useEffect(() => {
    if (state.popularMovies.length === 0) {
      fetchPopularMovies();
    }
  }, [fetchPopularMovies, state.popularMovies.length]);

  // Set featured movie from popular movies
  useEffect(() => {
    if (state.popularMovies.length > 0 && !featuredMovie) {
      // Use the second movie if available, otherwise the first
      const newFeatured = state.popularMovies[1] || state.popularMovies[0];
      setFeaturedMovie(newFeatured);
    }
  }, [state.popularMovies, featuredMovie]);

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Animated header style
  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 200],
      [0, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      backgroundColor: colors.background,
    };
  });

  // Event handlers
  const handleMoviePress = useCallback((movie: Movie) => {
    router.push(`/movie/${movie.id}`);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const handleSeeAllPress = useCallback(() => {
    router.push('/(tabs)/search');
  }, []);

  const handleRetry = useCallback(() => {
    fetchPopularMovies();
  }, [fetchPopularMovies]);

  // Filter movies by categories
  const trendingMovies = state.popularMovies.slice(0, 10);
  const topRatedMovies = state.popularMovies
    .filter(movie => movie.vote_average >= 7.5)
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 10);
  const recentMovies = state.popularMovies
    .filter(movie => {
      const releaseYear = new Date(movie.release_date).getFullYear();
      return releaseYear >= new Date().getFullYear() - 1;
    })
    .slice(0, 10);

  if (state.error && state.popularMovies.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <ErrorMessage
            message={state.error}
            debugInfo={typeof state.error === 'string' ? undefined : JSON.stringify(state.error)}
            onRetry={handleRetry}
            fullScreen
          />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Network Indicator */}
      <NetworkIndicator onRetry={handleRetry} />
      
      {/* Floating Header */}
      <Animated.View style={[styles.floatingHeader, headerStyle]}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <ThemedText style={[styles.headerTitle, { color: colors.textPrimary }]}>
              CinemaScope
            </ThemedText>
            
            <TouchableOpacity
              style={[styles.themeButton, { backgroundColor: colors.surface }]}
              onPress={toggleTheme}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isDarkMode ? "sunny" : "moon"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      <AnimatedScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Hero Section */}
        {featuredMovie && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <HeroMovie
              movie={featuredMovie}
              onPress={handleMoviePress}
            />
          </Animated.View>
        )}

        {/* Movie Sections */}
        <View style={styles.sectionsContainer}>
          <MovieSection
            title="Trending Now"
            movies={trendingMovies}
            loading={state.loading && state.popularMovies.length === 0}
            onMoviePress={handleMoviePress}
            onSeeAllPress={handleSeeAllPress}
          />

          <MovieSection
            title="Top Rated"
            movies={topRatedMovies}
            onMoviePress={handleMoviePress}
            onSeeAllPress={handleSeeAllPress}
          />

          <MovieSection
            title="Recent Releases"
            movies={recentMovies}
            onMoviePress={handleMoviePress}
            onSeeAllPress={handleSeeAllPress}
          />

          {/* Space for tab bar */}
          <View style={styles.bottomSpacer} />
        </View>
      </AnimatedScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  
  // Floating Header
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    ...Shadow.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  themeButton: {
    width: 44,
    height: 36,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Hero Section
  heroContainer: {
    height: screenHeight * 0.6,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  heroInfo: {
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    fontSize: FontSize.giant,
    fontWeight: FontWeight.bold,
    lineHeight: 44,
    marginBottom: Spacing.sm,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: Spacing.sm,
  },
  yearText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  heroOverview: {
    fontSize: FontSize.md,
    lineHeight: 22,
    opacity: 0.9,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    flex: 1,
    justifyContent: 'center',
    ...Shadow.lg,
  },
  playButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  favoriteHeroButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },

  // Sections
  sectionsContainer: {
    paddingTop: Spacing.lg,
  },
  sectionContainer: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  seeAllText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  sectionLoading: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Movie List
  movieScroll: {
    paddingLeft: Spacing.md,
  },
  movieScrollContent: {
    paddingRight: Spacing.md,
  },
  movieCardWrapper: {
    marginRight: Spacing.sm,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 100,
  },
});
