import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Movie } from '../types/movie';
import { cacheService } from '../services/cacheService';
import { haptic } from '../services/hapticService';

interface FavoritesState {
  favorites: Movie[];
  recentlyViewed: Movie[];
  isLoading: boolean;
  error: string | null;
}

type FavoritesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FAVORITES'; payload: Movie[] }
  | { type: 'ADD_FAVORITE'; payload: Movie }
  | { type: 'REMOVE_FAVORITE'; payload: number }
  | { type: 'SET_RECENTLY_VIEWED'; payload: Movie[] }
  | { type: 'ADD_RECENTLY_VIEWED'; payload: Movie }
  | { type: 'CLEAR_RECENTLY_VIEWED' }
  | { type: 'CLEAR_FAVORITES' };

interface FavoritesContextType {
  state: FavoritesState;
  addToFavorites: (movie: Movie) => Promise<void>;
  removeFromFavorites: (movieId: number) => Promise<void>;
  isFavorite: (movieId: number) => boolean;
  addToRecentlyViewed: (movie: Movie) => Promise<void>;
  clearRecentlyViewed: () => Promise<void>;
  clearFavorites: () => Promise<void>;
  getFavoritesByGenre: (genreId: number) => Movie[];
  getFavoritesByYear: (year: number) => Movie[];
  getTopRatedFavorites: () => Movie[];
  searchFavorites: (query: string) => Movie[];
  exportFavorites: () => Movie[];
  importFavorites: (movies: Movie[]) => Promise<void>;
}

const initialState: FavoritesState = {
  favorites: [],
  recentlyViewed: [],
  isLoading: false,
  error: null,
};

function favoritesReducer(state: FavoritesState, action: FavoritesAction): FavoritesState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_FAVORITES':
      return { ...state, favorites: action.payload };
    
    case 'ADD_FAVORITE':
      const isAlreadyFavorite = state.favorites.some(movie => movie.id === action.payload.id);
      if (isAlreadyFavorite) return state;
      
      return {
        ...state,
        favorites: [action.payload, ...state.favorites],
      };
    
    case 'REMOVE_FAVORITE':
      return {
        ...state,
        favorites: state.favorites.filter(movie => movie.id !== action.payload),
      };
    
    case 'SET_RECENTLY_VIEWED':
      return { ...state, recentlyViewed: action.payload };
    
    case 'ADD_RECENTLY_VIEWED':
      const filteredRecent = state.recentlyViewed.filter(movie => movie.id !== action.payload.id);
      const newRecentlyViewed = [action.payload, ...filteredRecent].slice(0, 50); // Keep only last 50
      
      return {
        ...state,
        recentlyViewed: newRecentlyViewed,
      };
    
    case 'CLEAR_RECENTLY_VIEWED':
      return { ...state, recentlyViewed: [] };
    
    case 'CLEAR_FAVORITES':
      return { ...state, favorites: [] };
    
    default:
      return state;
  }
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(favoritesReducer, initialState);

  // Load cached data on mount
  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const [cachedFavorites, cachedRecentlyViewed] = await Promise.all([
        cacheService.getCachedFavorites(),
        cacheService.getCachedRecentlyViewed(),
      ]);

      if (cachedFavorites) {
        dispatch({ type: 'SET_FAVORITES', payload: cachedFavorites });
      }

      if (cachedRecentlyViewed) {
        dispatch({ type: 'SET_RECENTLY_VIEWED', payload: cachedRecentlyViewed });
      }
    } catch (error) {
      console.warn('Failed to load cached favorites/recently viewed:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load saved data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addToFavorites = async (movie: Movie) => {
    try {
      dispatch({ type: 'ADD_FAVORITE', payload: movie });
      await cacheService.cacheFavorites([movie, ...state.favorites]);
      
      // Haptic feedback for successful addition
      await haptic.favoriteToggle(true);
    } catch (error) {
      console.warn('Failed to add to favorites:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add to favorites' });
      await haptic.errorOccurred();
    }
  };

  const removeFromFavorites = async (movieId: number) => {
    try {
      const updatedFavorites = state.favorites.filter(movie => movie.id !== movieId);
      dispatch({ type: 'REMOVE_FAVORITE', payload: movieId });
      await cacheService.cacheFavorites(updatedFavorites);
      
      // Haptic feedback for removal
      await haptic.favoriteToggle(false);
    } catch (error) {
      console.warn('Failed to remove from favorites:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove from favorites' });
      await haptic.errorOccurred();
    }
  };

  const isFavorite = (movieId: number): boolean => {
    return state.favorites.some(movie => movie.id === movieId);
  };

  const addToRecentlyViewed = async (movie: Movie) => {
    try {
      const filteredRecent = state.recentlyViewed.filter(m => m.id !== movie.id);
      const newRecentlyViewed = [movie, ...filteredRecent].slice(0, 50);
      
      dispatch({ type: 'ADD_RECENTLY_VIEWED', payload: movie });
      await cacheService.cacheRecentlyViewed(newRecentlyViewed);
    } catch (error) {
      console.warn('Failed to add to recently viewed:', error);
    }
  };

  const clearRecentlyViewed = async () => {
    try {
      dispatch({ type: 'CLEAR_RECENTLY_VIEWED' });
      await cacheService.cacheRecentlyViewed([]);
      await haptic.actionCompleted();
    } catch (error) {
      console.warn('Failed to clear recently viewed:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear recently viewed' });
      await haptic.errorOccurred();
    }
  };

  const clearFavorites = async () => {
    try {
      dispatch({ type: 'CLEAR_FAVORITES' });
      await cacheService.cacheFavorites([]);
      await haptic.actionCompleted();
    } catch (error) {
      console.warn('Failed to clear favorites:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear favorites' });
      await haptic.errorOccurred();
    }
  };

  // Utility functions for filtering and searching
  const getFavoritesByGenre = (genreId: number): Movie[] => {
    return state.favorites.filter(movie => 
      movie.genre_ids?.includes(genreId)
    );
  };

  const getFavoritesByYear = (year: number): Movie[] => {
    return state.favorites.filter(movie => {
      const movieYear = new Date(movie.release_date || '').getFullYear();
      return movieYear === year;
    });
  };

  const getTopRatedFavorites = (): Movie[] => {
    return [...state.favorites].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  };

  const searchFavorites = (query: string): Movie[] => {
    const lowercaseQuery = query.toLowerCase();
    return state.favorites.filter(movie =>
      movie.title?.toLowerCase().includes(lowercaseQuery) ||
      movie.overview?.toLowerCase().includes(lowercaseQuery)
    );
  };

  const exportFavorites = (): Movie[] => {
    return state.favorites;
  };

  const importFavorites = async (movies: Movie[]): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Merge with existing favorites, avoiding duplicates
      const existingIds = new Set(state.favorites.map(movie => movie.id));
      const newMovies = movies.filter(movie => !existingIds.has(movie.id));
      const allFavorites = [...state.favorites, ...newMovies];
      
      dispatch({ type: 'SET_FAVORITES', payload: allFavorites });
      await cacheService.cacheFavorites(allFavorites);
      await haptic.actionCompleted();
    } catch (error) {
      console.warn('Failed to import favorites:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to import favorites' });
      await haptic.errorOccurred();
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const contextValue: FavoritesContextType = {
    state,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    addToRecentlyViewed,
    clearRecentlyViewed,
    clearFavorites,
    getFavoritesByGenre,
    getFavoritesByYear,
    getTopRatedFavorites,
    searchFavorites,
    exportFavorites,
    importFavorites,
  };

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

// Custom hooks for specific use cases
export const useFavoriteToggle = (movie: Movie) => {
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const isMovieFavorite = isFavorite(movie.id);

  const toggleFavorite = async () => {
    if (isMovieFavorite) {
      await removeFromFavorites(movie.id);
    } else {
      await addToFavorites(movie);
    }
  };

  return {
    isFavorite: isMovieFavorite,
    toggleFavorite,
  };
};

export const useRecentlyViewed = () => {
  const { state, addToRecentlyViewed, clearRecentlyViewed } = useFavorites();
  
  return {
    recentlyViewed: state.recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    hasRecentlyViewed: state.recentlyViewed.length > 0,
  };
};

export const useFavoritesStats = () => {
  const { state, getFavoritesByGenre, getTopRatedFavorites } = useFavorites();
  
  const getStats = () => {
    const favorites = state.favorites;
    const totalFavorites = favorites.length;
    const averageRating = totalFavorites > 0 
      ? favorites.reduce((sum, movie) => sum + (movie.vote_average || 0), 0) / totalFavorites
      : 0;
    
    // Get genre distribution
    const genreCount: Record<number, number> = {};
    favorites.forEach(movie => {
      movie.genre_ids?.forEach(genreId => {
        genreCount[genreId] = (genreCount[genreId] || 0) + 1;
      });
    });
    
    // Get year distribution
    const yearCount: Record<number, number> = {};
    favorites.forEach(movie => {
      const year = new Date(movie.release_date || '').getFullYear();
      if (year > 1900) { // Valid year
        yearCount[year] = (yearCount[year] || 0) + 1;
      }
    });
    
    const topGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    const topYears = Object.entries(yearCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    return {
      totalFavorites,
      averageRating: Math.round(averageRating * 10) / 10,
      topGenres,
      topYears,
      topRatedFavorites: getTopRatedFavorites().slice(0, 5),
    };
  };
  
  return getStats();
};

export default FavoritesContext; 