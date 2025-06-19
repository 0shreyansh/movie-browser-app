import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const Layout = {
  window: {
    width: screenWidth,
    height: screenHeight,
  },
  isSmallDevice: screenWidth < 375,
  isTablet: screenWidth >= 768,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 50,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  giant: 32,
  hero: 40,
};

export const FontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Typography = {
  body: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
  },
  caption: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
  },
  subtitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
  },
  small: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
  },
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const MoviePoster = {
  aspectRatio: 2 / 3, // Standard movie poster ratio
  sizes: {
    xs: { width: 80, height: 120 },
    sm: { width: 100, height: 150 },
    md: { width: (screenWidth - 48) / 2, height: ((screenWidth - 48) / 2) * 1.5 }, // Responsive proportions
    lg: { width: 160, height: 240 },
    xl: { width: 200, height: 300 },
  },
  card: {
    width: (screenWidth - 48) / 2, // Dynamic width that fills screen better
    get height() { return this.width * 1.5; }
  },
  hero: {
    width: screenWidth * 0.35, // Slightly larger hero cards for better visibility
    get height() { return this.width * 1.5; }
  }
};

export const Backdrop = {
  aspectRatio: 16 / 9,
  hero: {
    width: screenWidth,
    height: screenHeight * 0.4,
  },
  card: {
    width: screenWidth - 32,
    height: 200,
  }
};

export const Opacity = {
  disabled: 0.5,
  overlay: 0.6,
  backdrop: 0.8,
  subtle: 0.1,
  medium: 0.3,
  strong: 0.7,
};

export const AnimationDuration = {
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
};

export const ZIndex = {
  background: 0,
  content: 1,
  overlay: 10,
  modal: 100,
  popover: 200,
  toast: 300,
  loading: 400,
}; 