/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Enhanced Movie App Color Palette
export const MovieColors = {
  light: {
    // Primary Colors
    primary: '#FF6B6B',
    primaryDark: '#E55555',
    primaryLight: '#FF8E8E',
    
    // Secondary Colors  
    secondary: '#4ECDC4',
    secondaryDark: '#45B7AA',
    secondaryLight: '#6FD4CC',
    
    // Accent Colors
    accent: '#FFE66D',
    accentDark: '#F4D03F',
    accentLight: '#FFF0A0',
    
    // Neutral Colors
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    backgroundTertiary: '#F1F3F4',
    
    // Text Colors
    textPrimary: '#1A1A1A',
    textSecondary: '#6C757D',
    textTertiary: '#ADB5BD',
    textInverse: '#FFFFFF',
    
    // Surface Colors
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceOverlay: 'rgba(0, 0, 0, 0.05)',
    
    // Border Colors
    border: '#E9ECEF',
    borderLight: '#F8F9FA',
    borderDark: '#DEE2E6',
    
    // Status Colors
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    info: '#17A2B8',
    
    // Rating Colors
    rating: '#FFD700',
    ratingBackground: '#E9ECEF',
    
    // Shadows
    shadowColor: '#000000',
    shadowLight: 'rgba(0, 0, 0, 0.1)',
    shadowMedium: 'rgba(0, 0, 0, 0.15)',
    shadowStrong: 'rgba(0, 0, 0, 0.25)',
  },
  
  dark: {
    // Primary Colors
    primary: '#FF6B6B',
    primaryDark: '#E55555',
    primaryLight: '#FF8E8E',
    
    // Secondary Colors
    secondary: '#4ECDC4',
    secondaryDark: '#45B7AA',
    secondaryLight: '#6FD4CC',
    
    // Accent Colors
    accent: '#FFE66D',
    accentDark: '#F4D03F',
    accentLight: '#FFF0A0',
    
    // Neutral Colors
    background: '#0D1117',
    backgroundSecondary: '#161B22',
    backgroundTertiary: '#21262D',
    
    // Text Colors
    textPrimary: '#F0F6FC',
    textSecondary: '#8B949E',
    textTertiary: '#6E7681',
    textInverse: '#0D1117',
    
    // Surface Colors
    surface: '#161B22',
    surfaceElevated: '#21262D',
    surfaceOverlay: 'rgba(255, 255, 255, 0.05)',
    
    // Border Colors
    border: '#30363D',
    borderLight: '#21262D',
    borderDark: '#484F58',
    
    // Status Colors
    success: '#238636',
    warning: '#D29922',
    error: '#DA3633',
    info: '#1F6FEB',
    
    // Rating Colors
    rating: '#FFD700',
    ratingBackground: '#30363D',
    
    // Shadows
    shadowColor: '#000000',
    shadowLight: 'rgba(0, 0, 0, 0.3)',
    shadowMedium: 'rgba(0, 0, 0, 0.4)',
    shadowStrong: 'rgba(0, 0, 0, 0.6)',
  },
};

// Gradient Colors
export const Gradients = {
  light: {
    primary: ['#FF6B6B', '#4ECDC4'],
    secondary: ['#4ECDC4', '#45B7AA'],
    accent: ['#FFE66D', '#FF6B6B'],
    backdrop: ['transparent', 'rgba(0, 0, 0, 0.7)'],
    overlay: ['transparent', 'rgba(255, 255, 255, 0.9)'],
    card: ['#FFFFFF', '#F8F9FA'],
    hero: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.8)'],
  },
  dark: {
    primary: ['#FF6B6B', '#4ECDC4'],
    secondary: ['#4ECDC4', '#45B7AA'],
    accent: ['#FFE66D', '#FF6B6B'],
    backdrop: ['transparent', 'rgba(0, 0, 0, 0.9)'],
    overlay: ['transparent', 'rgba(13, 17, 23, 0.9)'],
    card: ['#161B22', '#21262D'],
    hero: ['rgba(0, 0, 0, 0)', 'rgba(13, 17, 23, 0.9)'],
  },
};

// Genre Colors (for genre chips and categories)
export const GenreColors = {
  Action: '#FF6B6B',
  Adventure: '#4ECDC4',
  Animation: '#95E1D3',
  Comedy: '#FFE66D',
  Crime: '#686DE0',
  Documentary: '#30336B',
  Drama: '#130F40',
  Family: '#FF9FF3',
  Fantasy: '#7D5BA6',
  History: '#B33771',
  Horror: '#2C2C54',
  Music: '#40E0D0',
  Mystery: '#5A5A5A',
  Romance: '#FDA7DF',
  ScienceFiction: '#3C6382',
  Thriller: '#2F3542',
  War: '#57606F',
  Western: '#A0522D',
  default: '#6C757D',
};
