import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Movie, MovieResponse, Genre } from '../types/movie';
import { tmdbService } from '../services/api';
import { storageService } from '../services/storage';

// Types
interface MovieState {
  // Movie data
  popularMovies: Movie[];
  topRatedMovies: Movie[];
  upcomingMovies: Movie[];
  nowPlayingMovies: Movie[];
  searchResults: Movie[];
  genres: Genre[];
  
  // UI state
  loading: boolean;
  error: string | null;
  searchLoading: boolean;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  hasMorePages: boolean;
  
  // Favorites
  favorites: Movie[];
  
  // Search
  searchQuery: string;
  searchHistory: string[];
  
  // Current category
  selectedCategory: string;
}

type MovieAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SEARCH_LOADING'; payload: boolean }
  | { type: 'SET_POPULAR_MOVIES'; payload: { movies: Movie[]; page: number; totalPages: number } }
  | { type: 'SET_TOP_RATED_MOVIES'; payload: { movies: Movie[]; page: number; totalPages: number } }
  | { type: 'SET_UPCOMING_MOVIES'; payload: { movies: Movie[]; page: number; totalPages: number } }
  | { type: 'SET_NOW_PLAYING_MOVIES'; payload: { movies: Movie[]; page: number; totalPages: number } }
  | { type: 'APPEND_POPULAR_MOVIES'; payload: Movie[] }
  | { type: 'APPEND_TOP_RATED_MOVIES'; payload: Movie[] }
  | { type: 'APPEND_UPCOMING_MOVIES'; payload: Movie[] }
  | { type: 'APPEND_NOW_PLAYING_MOVIES'; payload: Movie[] }
  | { type: 'SET_SEARCH_RESULTS'; payload: { results: Movie[]; page: number; totalPages: number } }
  | { type: 'APPEND_SEARCH_RESULTS'; payload: Movie[] }
  | { type: 'CLEAR_SEARCH_RESULTS' }
  | { type: 'SET_GENRES'; payload: Genre[] }
  | { type: 'SET_FAVORITES'; payload: Movie[] }
  | { type: 'ADD_TO_FAVORITES'; payload: Movie }
  | { type: 'REMOVE_FROM_FAVORITES'; payload: number }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_HISTORY'; payload: string[] }
  | { type: 'ADD_TO_SEARCH_HISTORY'; payload: string }
  | { type: 'CLEAR_SEARCH_HISTORY' }
  | { type: 'SET_SELECTED_CATEGORY'; payload: string }
  | { type: 'RESET_PAGINATION' };

interface MovieContextType {
  state: MovieState;
  
  // Movie actions
  fetchPopularMovies: (page?: number) => Promise<void>;
  fetchTopRatedMovies: (page?: number) => Promise<void>;
  fetchUpcomingMovies: (page?: number) => Promise<void>;
  fetchNowPlayingMovies: (page?: number) => Promise<void>;
  loadMoreMovies: () => Promise<void>;
  
  // Search actions
  searchMovies: (query: string, page?: number) => Promise<void>;
  clearSearch: () => void;
  addToSearchHistory: (query: string) => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  
  // Favorites actions
  toggleFavorite: (movie: Movie) => Promise<void>;
  isFavorite: (movieId: number) => boolean;
  loadFavorites: () => Promise<void>;
  
  // Genre actions
  fetchGenres: () => Promise<void>;
  
  // Category actions
  setSelectedCategory: (category: string) => void;
  
  // Utility actions
  clearError: () => void;
  refreshData: () => Promise<void>;
}

// Initial state
const initialState: MovieState = {
  popularMovies: [],
  topRatedMovies: [],
  upcomingMovies: [],
  nowPlayingMovies: [],
  searchResults: [],
  genres: [],
  loading: false,
  error: null,
  searchLoading: false,
  currentPage: 1,
  totalPages: 1,
  hasMorePages: false,
  favorites: [],
  searchQuery: '',
  searchHistory: [],
  selectedCategory: 'popular',
};

// Reducer
function movieReducer(state: MovieState, action: MovieAction): MovieState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false, searchLoading: false };
    
    case 'SET_SEARCH_LOADING':
      return { ...state, searchLoading: action.payload };
    
    case 'SET_POPULAR_MOVIES':
      return {
        ...state,
        popularMovies: action.payload.movies,
        currentPage: action.payload.page,
        totalPages: action.payload.totalPages,
        hasMorePages: action.payload.page < action.payload.totalPages,
        loading: false,
        error: null,
      };
    
    case 'SET_TOP_RATED_MOVIES':
      return {
        ...state,
        topRatedMovies: action.payload.movies,
        currentPage: action.payload.page,
        totalPages: action.payload.totalPages,
        hasMorePages: action.payload.page < action.payload.totalPages,
        loading: false,
        error: null,
      };
    
    case 'SET_UPCOMING_MOVIES':
      return {
        ...state,
        upcomingMovies: action.payload.movies,
        currentPage: action.payload.page,
        totalPages: action.payload.totalPages,
        hasMorePages: action.payload.page < action.payload.totalPages,
        loading: false,
        error: null,
      };
    
    case 'SET_NOW_PLAYING_MOVIES':
      return {
        ...state,
        nowPlayingMovies: action.payload.movies,
        currentPage: action.payload.page,
        totalPages: action.payload.totalPages,
        hasMorePages: action.payload.page < action.payload.totalPages,
        loading: false,
        error: null,
      };
    
    case 'APPEND_POPULAR_MOVIES':
      return {
        ...state,
        popularMovies: [...state.popularMovies, ...action.payload],
        loading: false,
      };
    
    case 'APPEND_TOP_RATED_MOVIES':
      return {
        ...state,
        topRatedMovies: [...state.topRatedMovies, ...action.payload],
        loading: false,
      };
    
    case 'APPEND_UPCOMING_MOVIES':
      return {
        ...state,
        upcomingMovies: [...state.upcomingMovies, ...action.payload],
        loading: false,
      };
    
    case 'APPEND_NOW_PLAYING_MOVIES':
      return {
        ...state,
        nowPlayingMovies: [...state.nowPlayingMovies, ...action.payload],
        loading: false,
      };
    
    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        searchResults: action.payload.results,
        currentPage: action.payload.page,
        totalPages: action.payload.totalPages,
        hasMorePages: action.payload.page < action.payload.totalPages,
        searchLoading: false,
        error: null,
      };
    
    case 'APPEND_SEARCH_RESULTS':
      return {
        ...state,
        searchResults: [...state.searchResults, ...action.payload],
        searchLoading: false,
      };
    
    case 'CLEAR_SEARCH_RESULTS':
      return {
        ...state,
        searchResults: [],
        searchQuery: '',
        currentPage: 1,
        totalPages: 1,
        hasMorePages: false,
      };
    
    case 'SET_GENRES':
      return { ...state, genres: action.payload };
    
    case 'SET_FAVORITES':
      return { ...state, favorites: action.payload };
    
    case 'ADD_TO_FAVORITES':
      return {
        ...state,
        favorites: [action.payload, ...state.favorites.filter(fav => fav.id !== action.payload.id)],
      };
    
    case 'REMOVE_FROM_FAVORITES':
      return {
        ...state,
        favorites: state.favorites.filter(fav => fav.id !== action.payload),
      };
    
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    
    case 'SET_SEARCH_HISTORY':
      return { ...state, searchHistory: action.payload };
    
    case 'ADD_TO_SEARCH_HISTORY':
      const newHistory = [action.payload, ...state.searchHistory.filter(item => item !== action.payload)].slice(0, 10);
      return { ...state, searchHistory: newHistory };
    
    case 'CLEAR_SEARCH_HISTORY':
      return { ...state, searchHistory: [] };
    
    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.payload };
    
    case 'RESET_PAGINATION':
      return {
        ...state,
        currentPage: 1,
        totalPages: 1,
        hasMorePages: false,
      };
    
    default:
      return state;
  }
}

// Context
const MovieContext = createContext<MovieContextType | undefined>(undefined);

// Provider component
interface MovieProviderProps {
  children: ReactNode;
}

export function MovieProvider({ children }: MovieProviderProps) {
  const [state, dispatch] = useReducer(movieReducer, initialState);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          fetchGenres(),
          loadFavorites(),
          loadSearchHistory(),
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Movie actions
  const fetchPopularMovies = async (page: number = 1) => {
    try {
      if (page === 1) {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'RESET_PAGINATION' });
      }

      const response = await tmdbService.getPopularMovies(page);
      
      if (page === 1) {
        dispatch({
          type: 'SET_POPULAR_MOVIES',
          payload: {
            movies: response.results,
            page: response.page,
            totalPages: response.total_pages,
          },
        });
      } else {
        dispatch({ type: 'APPEND_POPULAR_MOVIES', payload: response.results });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch popular movies' });
    }
  };

  const fetchTopRatedMovies = async (page: number = 1) => {
    try {
      if (page === 1) {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'RESET_PAGINATION' });
      }

      const response = await tmdbService.getTopRatedMovies(page);
      
      if (page === 1) {
        dispatch({
          type: 'SET_TOP_RATED_MOVIES',
          payload: {
            movies: response.results,
            page: response.page,
            totalPages: response.total_pages,
          },
        });
      } else {
        dispatch({ type: 'APPEND_TOP_RATED_MOVIES', payload: response.results });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch top rated movies' });
    }
  };

  const fetchUpcomingMovies = async (page: number = 1) => {
    try {
      if (page === 1) {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'RESET_PAGINATION' });
      }

      const response = await tmdbService.getUpcomingMovies(page);
      
      if (page === 1) {
        dispatch({
          type: 'SET_UPCOMING_MOVIES',
          payload: {
            movies: response.results,
            page: response.page,
            totalPages: response.total_pages,
          },
        });
      } else {
        dispatch({ type: 'APPEND_UPCOMING_MOVIES', payload: response.results });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch upcoming movies' });
    }
  };

  const fetchNowPlayingMovies = async (page: number = 1) => {
    try {
      if (page === 1) {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'RESET_PAGINATION' });
      }

      const response = await tmdbService.getNowPlayingMovies(page);
      
      if (page === 1) {
        dispatch({
          type: 'SET_NOW_PLAYING_MOVIES',
          payload: {
            movies: response.results,
            page: response.page,
            totalPages: response.total_pages,
          },
        });
      } else {
        dispatch({ type: 'APPEND_NOW_PLAYING_MOVIES', payload: response.results });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch now playing movies' });
    }
  };

  const loadMoreMovies = async () => {
    if (!state.hasMorePages || state.loading) return;

    const nextPage = state.currentPage + 1;

    switch (state.selectedCategory) {
      case 'popular':
        await fetchPopularMovies(nextPage);
        break;
      case 'top_rated':
        await fetchTopRatedMovies(nextPage);
        break;
      case 'upcoming':
        await fetchUpcomingMovies(nextPage);
        break;
      case 'now_playing':
        await fetchNowPlayingMovies(nextPage);
        break;
      default:
        if (state.searchQuery) {
          await searchMovies(state.searchQuery, nextPage);
        }
    }
  };

  // Search actions
  const searchMovies = async (query: string, page: number = 1) => {
    try {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
      
      if (page === 1) {
        dispatch({ type: 'SET_SEARCH_LOADING', payload: true });
        dispatch({ type: 'RESET_PAGINATION' });
      }

      const response = await tmdbService.searchMovies(query, page);
      
      if (page === 1) {
        dispatch({
          type: 'SET_SEARCH_RESULTS',
          payload: {
            results: response.results,
            page: response.page,
            totalPages: response.total_pages,
          },
        });
      } else {
        dispatch({ type: 'APPEND_SEARCH_RESULTS', payload: response.results });
      }

      if (query.trim()) {
        await addToSearchHistory(query);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to search movies' });
    }
  };

  const clearSearch = () => {
    dispatch({ type: 'CLEAR_SEARCH_RESULTS' });
  };

  const addToSearchHistory = async (query: string) => {
    try {
      const updatedHistory = await storageService.addToSearchHistory(query);
      dispatch({ type: 'SET_SEARCH_HISTORY', payload: updatedHistory });
    } catch (error) {
      console.error('Error adding to search history:', error);
    }
  };

  const clearSearchHistory = async () => {
    try {
      await storageService.clearSearchHistory();
      dispatch({ type: 'CLEAR_SEARCH_HISTORY' });
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const history = await storageService.getSearchHistory();
      dispatch({ type: 'SET_SEARCH_HISTORY', payload: history });
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  // Favorites actions
  const toggleFavorite = async (movie: Movie) => {
    try {
      if (!movie || !movie.id) {
        throw new Error('Invalid movie data');
      }
      
      const isCurrentlyFavorite = isFavorite(movie.id);
      
      if (isCurrentlyFavorite) {
        const updatedFavorites = await storageService.removeFromFavorites(movie.id);
        dispatch({ type: 'SET_FAVORITES', payload: updatedFavorites });
      } else {
        const updatedFavorites = await storageService.addToFavorites(movie);
        dispatch({ type: 'SET_FAVORITES', payload: updatedFavorites });
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update favorites' });
      throw error; // Re-throw for component handling
    }
  };

  const isFavorite = (movieId: number): boolean => {
    return state.favorites.some(movie => movie.id === movieId);
  };

  const loadFavorites = async () => {
    try {
      const favorites = await storageService.getFavorites();
      dispatch({ type: 'SET_FAVORITES', payload: favorites });
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // Genre actions
  const fetchGenres = async () => {
    try {
      const genres = await tmdbService.getGenres();
      dispatch({ type: 'SET_GENRES', payload: genres });
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  // Category actions
  const setSelectedCategory = (category: string) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category });
    dispatch({ type: 'RESET_PAGINATION' });
  };

  // Utility actions
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const refreshData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      switch (state.selectedCategory) {
        case 'popular':
          await fetchPopularMovies();
          break;
        case 'top_rated':
          await fetchTopRatedMovies();
          break;
        case 'upcoming':
          await fetchUpcomingMovies();
          break;
        case 'now_playing':
          await fetchNowPlayingMovies();
          break;
        default:
          if (state.searchQuery) {
            await searchMovies(state.searchQuery);
          } else {
            await fetchPopularMovies();
          }
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to refresh data' });
    }
  };

  const contextValue: MovieContextType = {
    state,
    fetchPopularMovies,
    fetchTopRatedMovies,
    fetchUpcomingMovies,
    fetchNowPlayingMovies,
    loadMoreMovies,
    searchMovies,
    clearSearch,
    addToSearchHistory,
    clearSearchHistory,
    toggleFavorite,
    isFavorite,
    loadFavorites,
    fetchGenres,
    setSelectedCategory,
    clearError,
    refreshData,
  };

  return (
    <MovieContext.Provider value={contextValue}>
      {children}
    </MovieContext.Provider>
  );
}

// Hook to use the context
export function useMovies() {
  const context = useContext(MovieContext);
  if (context === undefined) {
    throw new Error('useMovies must be used within a MovieProvider');
  }
  return context;
}

export default MovieContext; 