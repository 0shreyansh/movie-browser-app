import React, { useState, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated, Dimensions } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { useTheme } from '../../contexts/ThemeContext';
import { Skeleton } from './SkeletonLoader';
import { BorderRadius, Spacing } from '../../constants/Layout';

interface OptimizedImageProps {
  source: ImageSource | string;
  style?: ViewStyle;
  width?: number;
  height?: number;
  borderRadius?: number;
  placeholder?: string;
  blurhash?: string;
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'memory' | 'disk' | 'memory-disk';
  transition?: number; // milliseconds
  contentFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  contentPosition?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
  onLoadStart?: () => void;
  enableLiveTextInteraction?: boolean;
  allowDownscaling?: boolean;
  autoplay?: boolean;
  showLoadingIndicator?: boolean;
  showErrorIndicator?: boolean;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  quality?: number; // 0-100
}

const screenWidth = Dimensions.get('window').width;

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  width,
  height,
  borderRadius = 0,
  placeholder,
  blurhash,
  priority = 'normal',
  cachePolicy = 'memory-disk',
  transition = 300,
  contentFit = 'cover',
  contentPosition = 'center',
  onLoad,
  onError,
  onLoadStart,
  enableLiveTextInteraction = false,
  allowDownscaling = true,
  autoplay = true,
  showLoadingIndicator = true,
  showErrorIndicator = true,
  quality = 85,
  ...props
}) => {
  const { colors, isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadStarted, setLoadStarted] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1.05)).current;

  const handleLoadStart = () => {
    setLoadStarted(true);
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: transition,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: transition,
        useNativeDriver: true,
      }),
    ]).start();
    
    onLoad?.();
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(error.message || 'Failed to load image');
  };

  // Generate optimized source with quality and sizing
  const getOptimizedSource = (): ImageSource => {
    if (typeof source === 'string') {
      // For TMDB images, add size parameter for optimization
      if (source.includes('image.tmdb.org')) {
        const isBackdrop = source.includes('/original/');
        const isPoster = source.includes('/w') || source.includes('/poster');
        
        let optimizedUrl = source;
        
        if (isBackdrop) {
          // Use appropriate backdrop size based on screen width
          const backdropSize = screenWidth > 400 ? 'w780' : 'w500';
          optimizedUrl = source.replace('/original/', `/${backdropSize}/`);
        } else if (isPoster) {
          // Use appropriate poster size
          const posterSize = width && width > 200 ? 'w500' : 'w342';
          optimizedUrl = source.replace(/\/w\d+\//, `/${posterSize}/`);
        }
        
        return {
          uri: optimizedUrl,
          headers: {
            'Cache-Control': 'max-age=31536000', // 1 year
          },
        };
      }
      
      return { uri: source };
    }
    
    return source;
  };

  const imageStyle = [
    {
      width: width || '100%',
      height: height || '100%',
      borderRadius,
    },
    style,
  ];

  const loadingIndicatorStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: isDarkMode ? colors.surface : colors.background,
    borderRadius,
  };

  const errorIndicatorStyle = {
    ...loadingIndicatorStyle,
    backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5',
  };

  return (
    <View style={[styles.container, { width, height }, style]}>
      {/* Main Image */}
      <Animated.View
        style={[
          styles.imageContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={getOptimizedSource()}
          style={imageStyle}
          contentFit={contentFit}
          contentPosition={contentPosition}
          placeholder={placeholder ? { uri: placeholder } : blurhash ? { blurhash } : undefined}
          placeholderContentFit="cover"
          transition={transition}
          priority={priority}
          cachePolicy={cachePolicy}
          onLoadStart={handleLoadStart}
          onLoad={handleLoad}
          onError={handleError}
          enableLiveTextInteraction={enableLiveTextInteraction}
          allowDownscaling={allowDownscaling}
          autoplay={autoplay}
          {...props}
        />
      </Animated.View>

      {/* Loading Indicator */}
      {showLoadingIndicator && isLoading && loadStarted && (
        <View style={loadingIndicatorStyle}>
          <Skeleton
            width="100%"
            height="100%"
            borderRadius={borderRadius}
            style={styles.loadingSkeleton}
          />
        </View>
      )}

      {/* Error Indicator */}
      {showErrorIndicator && hasError && (
        <View style={errorIndicatorStyle}>
          <View style={styles.errorContent}>
            <View style={[styles.errorIcon, { backgroundColor: colors.textSecondary }]} />
            <Animated.Text style={[styles.errorText, { color: colors.textSecondary }]}>
              Failed to load image
            </Animated.Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Poster-specific optimized image
export const OptimizedPoster: React.FC<
  Omit<OptimizedImageProps, 'contentFit' | 'width' | 'height'> & {
    posterWidth?: number;
    aspectRatio?: number;
  }
> = ({ posterWidth = 140, aspectRatio = 1.5, ...props }) => (
  <OptimizedImage
    {...props}
    width={posterWidth}
    height={posterWidth * aspectRatio}
    contentFit="cover"
    borderRadius={BorderRadius.lg}
    priority="high"
  />
);

// Backdrop-specific optimized image
export const OptimizedBackdrop: React.FC<
  Omit<OptimizedImageProps, 'contentFit' | 'height'> & {
    aspectRatio?: number;
  }
> = ({ aspectRatio = 0.5625, ...props }) => (
  <OptimizedImage
    {...props}
    height={(props.width || screenWidth) * aspectRatio}
    contentFit="cover"
    borderRadius={BorderRadius.lg}
    priority="high"
  />
);

// Avatar-specific optimized image
export const OptimizedAvatar: React.FC<
  Omit<OptimizedImageProps, 'contentFit' | 'width' | 'height' | 'borderRadius'> & {
    size?: number;
  }
> = ({ size = 60, ...props }) => (
  <OptimizedImage
    {...props}
    width={size}
    height={size}
    borderRadius={size / 2}
    contentFit="cover"
    priority="normal"
  />
);

// Hero image with gradient overlay
export const OptimizedHeroImage: React.FC<
  OptimizedImageProps & {
    gradientColors?: string[];
    gradientDirection?: [number, number, number, number];
    overlayOpacity?: number;
  }
> = ({
  gradientColors,
  gradientDirection = [0, 0, 0, 1],
  overlayOpacity = 0.6,
  children,
  ...props
}) => {
  const { colors } = useTheme();
  
  const defaultGradientColors = [
    'transparent',
    'rgba(0,0,0,0.3)',
    'rgba(0,0,0,0.8)',
  ];

  return (
    <View style={styles.heroContainer}>
      <OptimizedImage
        {...props}
        contentFit="cover"
        priority="high"
        style={[styles.heroImage, props.style]}
      />
      
      {/* Gradient Overlay */}
      <LinearGradient
        colors={gradientColors || defaultGradientColors}
        start={{ x: gradientDirection[0], y: gradientDirection[1] }}
        end={{ x: gradientDirection[2], y: gradientDirection[3] }}
        style={[
          styles.gradientOverlay,
          { opacity: overlayOpacity }
        ]}
      />
      
      {children && (
        <View style={styles.heroContent}>
          {children}
        </View>
      )}
    </View>
  );
};

// Image gallery component
export const OptimizedImageGallery: React.FC<{
  images: (ImageSource | string)[];
  onImagePress?: (index: number) => void;
  itemWidth?: number;
  itemHeight?: number;
  spacing?: number;
}> = ({
  images,
  onImagePress,
  itemWidth = 120,
  itemHeight = 180,
  spacing = Spacing.sm,
}) => (
  <View style={styles.gallery}>
    {images.map((image, index) => (
      <View
        key={index}
        style={[
          styles.galleryItem,
          { 
            width: itemWidth,
            height: itemHeight,
            marginRight: index < images.length - 1 ? spacing : 0,
          }
        ]}
      >
        <OptimizedImage
          source={image}
          width={itemWidth}
          height={itemHeight}
          contentFit="cover"
          borderRadius={BorderRadius.md}
          onLoad={() => onImagePress?.(index)}
          priority={index < 3 ? 'high' : 'normal'}
        />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  loadingSkeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  errorContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: Spacing.xs,
    opacity: 0.5,
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  heroContainer: {
    position: 'relative',
    width: '100%',
  },
  heroImage: {
    width: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
  },
  gallery: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
  },
  galleryItem: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
});

export default OptimizedImage; 