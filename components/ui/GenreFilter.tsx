import React, { memo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../ThemedText';
import { Genre } from '../../types/movie';
import { MovieColors, Gradients, GenreColors } from '../../constants/Colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/Layout';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface GenreFilterProps {
  genres: Genre[];
  selectedGenres: number[];
  onGenreToggle: (genreId: number) => void;
  onClear: () => void;
  style?: ViewStyle;
  showAll?: boolean;
}

interface GenreChipProps {
  genre: Genre;
  isSelected: boolean;
  onPress: (genreId: number) => void;
  colorScheme: 'light' | 'dark';
}

const GenreChip = memo<GenreChipProps>(({ genre, isSelected, onPress, colorScheme }) => {
  const colors = MovieColors[colorScheme];
  const animatedValue = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    animatedValue.value = withSpring(isSelected ? 1 : 0, {
      damping: 20,
      stiffness: 200,
    });
  }, [isSelected, animatedValue]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animatedValue.value,
      [0, 1],
      [colors.surface, colors.primary]
    );

    const borderColor = interpolateColor(
      animatedValue.value,
      [0, 1],
      [colors.border, colors.primary]
    );

    return {
      backgroundColor,
      borderColor,
      transform: [
        {
          scale: withSpring(isSelected ? 1.05 : 1, {
            damping: 20,
            stiffness: 200,
          })
        }
      ],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      animatedValue.value,
      [0, 1],
      [colors.textSecondary, colors.textInverse]
    );

    return { color };
  });

  const handlePress = useCallback(() => {
    onPress(genre.id);
  }, [genre.id, onPress]);

  // Get genre-specific color or default
  const genreColor = GenreColors[genre.name as keyof typeof GenreColors] || GenreColors.default;

  return (
    <AnimatedTouchableOpacity
      style={[styles.genreChip, animatedStyle]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {isSelected && (
        <LinearGradient
          colors={[genreColor, `${genreColor}CC`]}
          style={styles.genreGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      
      <View style={styles.genreContent}>
        <View style={[styles.genreIndicator, { backgroundColor: genreColor }]} />
        <Animated.Text style={[styles.genreText, textStyle]}>
          {genre.name}
        </Animated.Text>
        
        {isSelected && (
          <Ionicons 
            name="checkmark-circle" 
            size={16} 
            color={colors.textInverse}
            style={styles.checkIcon}
          />
        )}
      </View>
    </AnimatedTouchableOpacity>
  );
});

GenreChip.displayName = 'GenreChip';

export const GenreFilter = memo<GenreFilterProps>(({
  genres,
  selectedGenres,
  onGenreToggle,
  onClear,
  style,
  showAll = true,
}) => {
  const { colors, isDarkMode } = useTheme();
  const gradients = Gradients[isDarkMode ? 'dark' : 'light'];

  const handleGenrePress = useCallback((genreId: number) => {
    onGenreToggle(genreId);
  }, [onGenreToggle]);

  const handleClearAll = useCallback(() => {
    onClear();
  }, [onClear]);

  // Add "All" option at the beginning
  const allGenres = showAll 
    ? [{ id: 0, name: 'All' }, ...genres]
    : genres;

  const hasSelectedGenres = selectedGenres.length > 0;

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: colors.textPrimary }]}>
          Genres
        </ThemedText>
        
        {hasSelectedGenres && (
          <TouchableOpacity
            onPress={handleClearAll}
            style={[styles.clearButton, { backgroundColor: colors.backgroundSecondary }]}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            <ThemedText style={[styles.clearText, { color: colors.textSecondary }]}>
              Clear
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Genre Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        decelerationRate="fast"
      >
        {allGenres.map((genre, index) => {
          const isSelected = genre.id === 0 
            ? selectedGenres.length === 0 
            : selectedGenres.includes(genre.id);

          return (
            <GenreChip
              key={genre.id}
              genre={genre}
              isSelected={isSelected}
              onPress={handleGenrePress}
              colorScheme={isDarkMode ? 'dark' : 'light'}
            />
          );
        })}
      </ScrollView>

      {/* Selected Count Indicator */}
      {hasSelectedGenres && (
        <View style={styles.selectedIndicator}>
          <LinearGradient
            colors={gradients.primary}
            style={styles.indicatorGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <ThemedText style={[styles.selectedText, { color: colors.textInverse }]}>
              {selectedGenres.length} genre{selectedGenres.length !== 1 ? 's' : ''} selected
            </ThemedText>
          </LinearGradient>
        </View>
      )}
    </View>
  );
});

GenreFilter.displayName = 'GenreFilter';

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  clearText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.md,
  },
  scrollContent: {
    paddingRight: Spacing.md,
    gap: Spacing.sm,
  },
  genreChip: {
    position: 'relative',
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    overflow: 'hidden',
    marginRight: Spacing.sm,
  },
  genreGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  genreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  genreIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  genreText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    minWidth: 0, // Allow text to shrink
  },
  checkIcon: {
    marginLeft: Spacing.xs,
  },
  selectedIndicator: {
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  indicatorGradient: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  selectedText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default GenreFilter; 