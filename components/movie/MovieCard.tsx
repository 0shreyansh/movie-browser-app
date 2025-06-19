import React, { memo, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { Movie } from '../../types/movie';
import { tmdbService } from '../../services/api';
import { useFavoriteToggle } from '../../contexts/FavoritesContext';
import { MovieColors, Gradients } from '../../constants/Colors';
import { Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/Layout';
import { useColorScheme } from '../../hooks/useColorScheme';

const { width } = Dimensions.get('window');
// Dynamic width that fills screen better while maintaining book-like proportions
const CARD_WIDTH = (width - 48) / 2; // Use more screen space, with 24px margins on each side
const CARD_HEIGHT = CARD_WIDTH * 1.5;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface MovieCardProps {
  movie: Movie;
  onPress?: (movie: Movie) => void;
  style?: ViewStyle;
  showFavoriteButton?: boolean;
  cardWidth?: number;
  priority?: 'high' | 'normal' | 'low';
  variant?: 'grid' | 'list' | 'hero';
}

export const MovieCard = memo<MovieCardProps>(({
  movie,
  onPress,
  style,
  showFavoriteButton = true,
  cardWidth = CARD_WIDTH,
  priority = 'normal',
  variant = 'grid',
}) => {
  const { toggleFavorite, isFavorite } = useFavoriteToggle(movie);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = MovieColors[colorScheme];
  const gradients = Gradients[colorScheme];
  
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Animation values
  const scale = useSharedValue(1);
  const favoriteScale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const cardHeight = cardWidth * 1.5; // 2:3 aspect ratio for book-like proportions
  const posterURL = tmdbService.getPosterURL(movie.poster_path, 'w500');
  const isMovieFavorite = isFavorite;

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const favoriteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favoriteScale.value }],
  }));

  // Event handlers
  const handlePress = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    });
    
    if (onPress) {
      runOnJS(onPress)(movie);
    }
  }, [movie, onPress, scale]);

  const handleFavoritePress = useCallback(async (event: any) => {
    event.stopPropagation();
    
    favoriteScale.value = withSpring(1.2, { damping: 15, stiffness: 400 }, () => {
      favoriteScale.value = withSpring(1, { damping: 15, stiffness: 400 });
    });
    
    try {
      await toggleFavorite();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Optionally show user-friendly error message
    }
  }, [movie, toggleFavorite, favoriteScale]);

  const formatRating = (rating: number): string => {
    return rating.toFixed(1);
  };

  const formatReleaseYear = (dateString: string): string => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear().toString();
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 8) return '#4CAF50'; // Green
    if (rating >= 6) return '#FF9800'; // Orange  
    return '#F44336'; // Red
  };

  // Dynamic styles based on variant
  const dynamicStyles = StyleSheet.create({
    card: {
      width: variant === 'list' ? width - 32 : cardWidth,
      height: variant === 'list' ? 120 : cardHeight + 100,
    },
    poster: {
      width: variant === 'list' ? 80 : cardWidth,
      height: variant === 'list' ? 120 : cardHeight,
    },
  });

  if (variant === 'list') {
    return (
      <AnimatedTouchableOpacity
        style={[styles.listContainer, { backgroundColor: colors.surface }, style, cardAnimatedStyle]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.listPosterContainer}>
          {posterURL && !imageError ? (
            <Image
              source={{ uri: posterURL }}
              style={[styles.listPoster, { borderRadius: BorderRadius.md }]}
              contentFit="cover"
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
              priority={priority}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.listPoster, styles.placeholderPoster, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="image-outline" size={30} color={colors.textTertiary} />
            </View>
          )}
        </View>

        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <ThemedText style={[styles.listTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {movie.title}
            </ThemedText>
            
            {showFavoriteButton && (
              <Animated.View style={favoriteAnimatedStyle}>
                <TouchableOpacity
                  style={[styles.listFavoriteButton, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={handleFavoritePress}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isMovieFavorite ? "heart" : "heart-outline"}
                    size={18}
                    color={isMovieFavorite ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          <View style={styles.listMeta}>
            {movie.release_date && (
              <ThemedText style={[styles.listYear, { color: colors.textSecondary }]}>
                {formatReleaseYear(movie.release_date)}
              </ThemedText>
            )}
            
            {movie.vote_average > 0 && (
              <View style={styles.listRating}>
                <Ionicons name="star" size={14} color={colors.rating} />
                <ThemedText style={[styles.listRatingText, { color: colors.textSecondary }]}>
                  {formatRating(movie.vote_average)}
                </ThemedText>
              </View>
            )}
          </View>

          <ThemedText 
            style={[styles.listOverview, { color: colors.textTertiary }]} 
            numberOfLines={3}
          >
            {movie.overview}
          </ThemedText>
        </View>
      </AnimatedTouchableOpacity>
    );
  }

  // Grid variant (default)
  return (
    <AnimatedTouchableOpacity
      style={[styles.container, style, cardAnimatedStyle]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={[styles.posterContainer, Shadow.lg]}>
        {posterURL && !imageError ? (
          <Image
            source={{ uri: posterURL }}
            style={[styles.poster, { width: cardWidth, height: cardHeight }]}
            contentFit="cover"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            priority={priority}
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.poster, styles.placeholderPoster, { 
            width: cardWidth, 
            height: cardHeight,
            backgroundColor: colors.backgroundSecondary 
          }]}>
            <Ionicons name="image-outline" size={40} color={colors.textTertiary} />
            <ThemedText style={[styles.placeholderText, { color: colors.textTertiary }]}>
              No Image
            </ThemedText>
          </View>
        )}

        {/* Image Loading Shimmer */}
        {imageLoading && (
          <View style={[styles.loadingOverlay, { width: cardWidth, height: cardHeight }]}>
            <LinearGradient
              colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
              style={styles.shimmer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        )}

        {/* Rating Badge */}
        {movie.vote_average > 0 && (
          <View style={[styles.ratingBadge, { backgroundColor: colors.surfaceOverlay }]}>
            <Ionicons name="star" size={12} color={colors.rating} />
            <ThemedText style={[styles.ratingText, { color: colors.textInverse }]}>
              {formatRating(movie.vote_average)}
            </ThemedText>
          </View>
        )}

        {/* Favorite Button */}
        {showFavoriteButton && (
          <Animated.View style={[styles.favoriteButton, favoriteAnimatedStyle]}>
            <TouchableOpacity
              style={[styles.favoriteButtonInner, { backgroundColor: colors.surfaceOverlay }]}
              onPress={handleFavoritePress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isMovieFavorite ? "heart" : "heart-outline"}
                size={16}
                color={isMovieFavorite ? colors.primary : colors.textInverse}
              />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Compact Movie Info Below Poster */}
      <View style={styles.movieInfo}>
        <ThemedText 
          style={[styles.title, { color: colors.textPrimary }]} 
          numberOfLines={2}
        >
          {movie.title}
        </ThemedText>

        <View style={styles.movieMeta}>
          {movie.release_date && (
            <ThemedText style={[styles.year, { color: colors.textSecondary }]}>
              {formatReleaseYear(movie.release_date)}
            </ThemedText>
          )}
          
          {movie.vote_average > 0 && (
            <View style={styles.metaRating}>
              <Ionicons name="star" size={12} color={colors.rating} />
              <ThemedText style={[styles.ratingText, { color: colors.textSecondary }]}>
                {formatRating(movie.vote_average)}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );
});

MovieCard.displayName = 'MovieCard';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
    backgroundColor: 'transparent',
  },
  
  // Grid variant styles
  posterContainer: {
    position: 'relative',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  poster: {
    borderRadius: BorderRadius.lg,
  },
  placeholderPoster: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  placeholderText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.lg,
  },
  shimmer: {
    flex: 1,
    borderRadius: BorderRadius.lg,
  },
  ratingBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    gap: Spacing.xs,
  },
  ratingText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  favoriteButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movieInfo: {
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  movieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  year: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  metaRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  // List variant styles
  listContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    ...Shadow.sm,
  },
  listPosterContainer: {
    marginRight: Spacing.md,
  },
  listPoster: {
    width: 80,
    height: 120,
    borderRadius: BorderRadius.md,
  },
  listContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  listTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    lineHeight: 22,
    marginRight: Spacing.sm,
  },
  listFavoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  listYear: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  listRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  listRatingText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  listOverview: {
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
});

export default MovieCard; 