import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MovieColors } from '../constants/Colors';
import { storageService } from '../services/storage';

type ThemeMode = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  scheme: ColorScheme;
  colors: typeof MovieColors.light;
  isLoading: boolean;
}

type ThemeAction =
  | { type: 'SET_MODE'; payload: ThemeMode }
  | { type: 'SET_SCHEME'; payload: ColorScheme }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'INITIALIZE'; payload: { mode: ThemeMode; scheme: ColorScheme } };

interface ThemeContextType extends ThemeState {
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  isSystemMode: boolean;
}

const THEME_STORAGE_KEY = '@movie_browser_theme';

// Get system color scheme
const getSystemColorScheme = (): ColorScheme => {
  const systemScheme = Appearance.getColorScheme();
  return systemScheme === 'dark' ? 'dark' : 'light';
};

// Determine active color scheme based on mode
const getActiveColorScheme = (mode: ThemeMode): ColorScheme => {
  if (mode === 'system') {
    return getSystemColorScheme();
  }
  return mode as ColorScheme;
};

const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case 'SET_MODE':
      const newScheme = getActiveColorScheme(action.payload);
      return {
        ...state,
        mode: action.payload,
        scheme: newScheme,
        colors: MovieColors[newScheme],
      };
    
    case 'SET_SCHEME':
      return {
        ...state,
        scheme: action.payload,
        colors: MovieColors[action.payload],
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'INITIALIZE':
      return {
        ...state,
        mode: action.payload.mode,
        scheme: action.payload.scheme,
        colors: MovieColors[action.payload.scheme],
        isLoading: false,
      };
    
    default:
      return state;
  }
};

const initialState: ThemeState = {
  mode: 'system',
  scheme: getSystemColorScheme(),
  colors: MovieColors[getSystemColorScheme()],
  isLoading: true,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Load saved theme preference
  const loadThemePreference = useCallback(async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const themeMode: ThemeMode = savedTheme as ThemeMode || 'system';
      const activeScheme = getActiveColorScheme(themeMode);
      
      dispatch({
        type: 'INITIALIZE',
        payload: { mode: themeMode, scheme: activeScheme },
      });
    } catch (error) {
      console.error('Failed to load theme preference:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Save theme preference
  const saveThemePreference = useCallback(async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      
      // Also save to user preferences
      const preferences = await storageService.getUserPreferences();
      await storageService.saveUserPreferences({
        ...preferences,
        theme: mode,
      });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, []);

  // Set theme mode
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
    await saveThemePreference(mode);
  }, [saveThemePreference]);

  // Toggle between light and dark (ignoring system)
  const toggleTheme = useCallback(() => {
    const newMode: ThemeMode = state.scheme === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  }, [state.scheme, setThemeMode]);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (state.mode === 'system') {
        const systemScheme = colorScheme === 'dark' ? 'dark' : 'light';
        dispatch({ type: 'SET_SCHEME', payload: systemScheme });
      }
    });

    return () => subscription?.remove();
  }, [state.mode]);

  // Load theme on mount
  useEffect(() => {
    loadThemePreference();
  }, [loadThemePreference]);

  const contextValue: ThemeContextType = {
    ...state,
    setThemeMode,
    toggleTheme,
    isDarkMode: state.scheme === 'dark',
    isSystemMode: state.mode === 'system',
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hooks for specific theme values
export const useThemeColors = () => {
  const { colors } = useTheme();
  return colors;
};

export const useIsDarkMode = (): boolean => {
  const { isDarkMode } = useTheme();
  return isDarkMode;
};

export const useThemeMode = (): [ThemeMode, (mode: ThemeMode) => void] => {
  const { mode, setThemeMode } = useTheme();
  return [mode, setThemeMode];
};

export default ThemeProvider; 