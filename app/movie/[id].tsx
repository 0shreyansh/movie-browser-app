import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    Extrapolate,
    FadeInDown,
    FadeInUp,
    interpolate,
    SlideInRight,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Gradients } from '@/constants/Colors';
import { BorderRadius, FontSize, FontWeight, Shadow, Spacing } from '@/constants/Layout';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useTheme } from '@/contexts/ThemeContext';
import { tmdbService } from '@/services/api';
import { MovieDetails } from '@/types/movie';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDarkMode } = useTheme();
  const gradients = Gradients[isDarkMode ? 'dark' : 'light'];
  
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the FavoritesContext for managing favorites
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      headerOpacity.value = interpolate(
        scrollY.value,
        [0, 200],
        [0, 1],
        Extrapolate.CLAMP
      );
    },
  });

  const backdropStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 300],
          [0, -100],
          Extrapolate.CLAMP
        ),
      },
      {
        scale: interpolate(
          scrollY.value,
          [0, 300],
          [1, 1.2],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  useEffect(() => {
    loadMovieDetails();
  }, [id]);

  const loadMovieDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const movieData = await tmdbService.getMovieDetails(parseInt(id));
      setMovie(movieData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load movie details');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoritePress = useCallback(async () => {
    if (!movie) return;
    try {
      const isCurrentlyFavorite = isFavorite(movie.id);
      if (isCurrentlyFavorite) {
        await removeFromFavorites(movie.id);
      } else {
        await addToFavorites(movie);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [movie, isFavorite, addToFavorites, removeFromFavorites]);

  const handleShare = useCallback(async () => {
    if (!movie) return;
    
    try {
      await Share.share({
        message: `Check out "${movie.title}" - ${movie.overview}`,
        url: movie.homepage || `https://www.themoviedb.org/movie/${movie.id}`,
      });
    } catch (error) {
      console.error('Error sharing movie:', error);
    }
  }, [movie]);

  const formatRuntime = (minutes: number | null): string => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatReleaseYear = (dateString: string): string => {
    return new Date(dateString).getFullYear().toString();
  };

  const formatBudget = (amount: number): string => {
    if (amount === 0) return '';
    return `$${(amount / 1000000).toFixed(1)}M`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner fullScreen text="Loading movie details..." />
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorMessage
          message={error || 'Movie not found'}
          onRetry={loadMovieDetails}
          fullScreen
        />
      </View>
    );
  }

  const backdropURL = tmdbService.getBackdropURL(movie.backdrop_path, 'w1280');
  const posterURL = tmdbService.getPosterURL(movie.poster_path, 'w500');
  const isMovieFavorite = movie ? isFavorite(movie.id) : false;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, headerStyle, { backgroundColor: colors.surface }]}>
        <BlurView intensity={80} style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <ThemedText style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {movie.title}
            </ThemedText>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleFavoritePress} style={styles.headerButton}>
                <Ionicons
                  name={isMovieFavorite ? "heart" : "heart-outline"}
                  size={22}
                  color={isMovieFavorite ? colors.primary : colors.textPrimary}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      <AnimatedScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Backdrop Image */}
          {backdropURL && (
            <Animated.View style={[styles.backdropContainer, backdropStyle]}>
              <Image
                source={{ uri: backdropURL }}
                style={styles.backdrop}
                contentFit="cover"
                placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
              />
              <LinearGradient
                colors={gradients.hero}
                style={styles.backdropGradient}
              />
            </Animated.View>
          )}

          {/* Floating Action Buttons */}
          <View style={styles.floatingActions}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.floatingButton, { backgroundColor: colors.surfaceOverlay }]}>
              <BlurView intensity={50} style={styles.buttonBlur}>
                <Ionicons name="chevron-back" size={24} color={colors.textInverse} />
              </BlurView>
            </TouchableOpacity>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={handleFavoritePress} style={[styles.floatingButton, { backgroundColor: colors.surfaceOverlay }]}>
                <BlurView intensity={50} style={styles.buttonBlur}>
                  <Ionicons
                    name={isMovieFavorite ? "heart" : "heart-outline"}
                    size={22}
                    color={isMovieFavorite ? colors.primary : colors.textInverse}
                  />
                </BlurView>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleShare} style={[styles.floatingButton, { backgroundColor: colors.surfaceOverlay }]}>
                <BlurView intensity={50} style={styles.buttonBlur}>
                  <Ionicons name="share-outline" size={22} color={colors.textInverse} />
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>

          {/* Movie Info */}
          <Animated.View entering={FadeInUp.delay(300)} style={styles.movieInfo}>
            {/* Poster */}
            <View style={styles.posterSection}>
              {posterURL ? (
                <Animated.View entering={SlideInRight.delay(400)} style={styles.posterContainer}>
                  <Image
                    source={{ uri: posterURL }}
                    style={styles.poster}
                    contentFit="cover"
                    placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                  />
                  <View style={[styles.posterShadow, Shadow.xl]} />
                </Animated.View>
              ) : (
                <View style={[styles.poster, styles.posterPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="image-outline" size={40} color={colors.textTertiary} />
                </View>
              )}
            </View>

            {/* Title and Details */}
            <Animated.View entering={FadeInDown.delay(500)} style={styles.titleSection}>
              <ThemedText style={[styles.title, { color: '#FFFFFF' }]}>
                {movie.title}
              </ThemedText>
              
              {movie.tagline && (
                <ThemedText style={[styles.tagline, { color: '#FFFFFF' }]}>
                  "{movie.tagline}"
                </ThemedText>
              )}

              <View style={styles.metadata}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                  <ThemedText style={[styles.metaText, { color: '#FFFFFF' }]}>
                    {formatReleaseYear(movie.release_date)}
                  </ThemedText>
                </View>
                
                {movie.runtime && (
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color="#FFFFFF" />
                    <ThemedText style={[styles.metaText, { color: '#FFFFFF' }]}>
                      {formatRuntime(movie.runtime)}
                    </ThemedText>
                  </View>
                )}
                
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={16} color={colors.rating} />
                  <ThemedText style={[styles.metaText, { color: '#FFFFFF' }]}>
                    {movie.vote_average.toFixed(1)}
                  </ThemedText>
                </View>
              </View>

              {/* Genres */}
              <View style={styles.genresContainer}>
                {movie.genres.slice(0, 3).map((genre) => (
                  <View key={genre.id} style={[styles.genreChip, { backgroundColor: colors.surfaceOverlay }]}>
                    <ThemedText style={[styles.genreText, { color: '#FFFFFF' }]}>
                      {genre.name}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Content Section */}
        <View style={[styles.contentSection, { backgroundColor: colors.background }]}>
          {/* Overview */}
          <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Overview
            </ThemedText>
            <ThemedText style={[styles.overview, { color: colors.textSecondary }]}>
              {movie.overview}
            </ThemedText>
          </Animated.View>

          {/* Movie Details */}
          <Animated.View entering={FadeInDown.delay(700)} style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Details
            </ThemedText>
            <View style={styles.detailsGrid}>
              {movie.budget > 0 && (
                <View style={styles.detailItem}>
                  <ThemedText style={[styles.detailLabel, { color: colors.textTertiary }]}>
                    Budget
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {formatBudget(movie.budget)}
                  </ThemedText>
                </View>
              )}
              
              {movie.revenue > 0 && (
                <View style={styles.detailItem}>
                  <ThemedText style={[styles.detailLabel, { color: colors.textTertiary }]}>
                    Revenue
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {formatBudget(movie.revenue)}
                  </ThemedText>
                </View>
              )}
              
              <View style={styles.detailItem}>
                <ThemedText style={[styles.detailLabel, { color: colors.textTertiary }]}>
                  Status
                </ThemedText>
                <ThemedText style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {movie.status}
                </ThemedText>
              </View>
              
              <View style={styles.detailItem}>
                <ThemedText style={[styles.detailLabel, { color: colors.textTertiary }]}>
                  Language
                </ThemedText>
                <ThemedText style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {movie.original_language.toUpperCase()}
                </ThemedText>
              </View>
            </View>
          </Animated.View>

          {/* Cast */}
          {movie.credits?.cast && movie.credits.cast.length > 0 && (
            <Animated.View entering={FadeInDown.delay(800)} style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Cast
              </ThemedText>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.castContainer}
                contentContainerStyle={styles.castContent}
              >
                {movie.credits.cast.slice(0, 10).map((actor, index) => (
                  <Animated.View 
                    key={actor.id} 
                    entering={SlideInRight.delay(900 + index * 100)}
                    style={styles.castItem}
                  >
                    <View style={styles.castImageContainer}>
                      {actor.profile_path ? (
                        <Image
                          source={{ uri: tmdbService.getProfileURL(actor.profile_path, 'w185') }}
                          style={styles.castImage}
                          contentFit="cover"
                          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                        />
                      ) : (
                        <View style={[styles.castImage, styles.castPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                          <Ionicons name="person-outline" size={30} color={colors.textTertiary} />
                        </View>
                      )}
                    </View>
                    <ThemedText style={[styles.castName, { color: colors.textPrimary }]} numberOfLines={2}>
                      {actor.name}
                    </ThemedText>
                    <ThemedText style={[styles.castCharacter, { color: colors.textSecondary }]} numberOfLines={1}>
                      {actor.character}
                    </ThemedText>
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>
          )}
        </View>
      </AnimatedScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 100,
  },
  headerBlur: {
    flex: 1,
    paddingTop: 44,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginLeft: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    height: screenHeight * 0.6,
    position: 'relative',
  },
  backdropContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  backdropGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  floatingActions: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    zIndex: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  buttonBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movieInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  posterSection: {
    marginRight: Spacing.md,
  },
  posterContainer: {
    position: 'relative',
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: BorderRadius.md,
  },
  posterShadow: {
    position: 'absolute',
    top: 8,
    left: 4,
    right: -4,
    bottom: -8,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: -1,
  },
  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: FontSize.giant,
    fontWeight: FontWeight.bold,
    lineHeight: 36,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: FontSize.md,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
    opacity: 0.9,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  genreChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  genreText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  contentSection: {
    flex: 1,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingTop: Spacing.xl,
    marginTop: -24,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  overview: {
    fontSize: FontSize.md,
    lineHeight: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
  },
  detailLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  detailValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  castContainer: {
    marginHorizontal: -Spacing.md,
  },
  castContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  castItem: {
    width: 80,
    alignItems: 'center',
  },
  castImageContainer: {
    marginBottom: Spacing.sm,
  },
  castImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  castPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  castName: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  castCharacter: {
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
}); 