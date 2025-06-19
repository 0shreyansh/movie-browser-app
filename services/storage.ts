import AsyncStorage from '@react-native-async-storage/async-storage';
import { Movie, UserPreferences } from '../types/movie';

class StorageService {
  private static readonly KEYS = {
    FAVORITES: '@MovieBrowserApp:favorites',
    SEARCH_HISTORY: '@MovieBrowserApp:searchHistory',
    USER_PREFERENCES: '@MovieBrowserApp:userPreferences',
    GENRE_CACHE: '@MovieBrowserApp:genres',
    MOVIE_CACHE: '@MovieBrowserApp:movieCache',
  } as const;

  private static readonly MAX_SEARCH_HISTORY = 10;
  private static readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Favorites Management
   */
  async saveFavorites(favorites: Movie[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(favorites);
      await AsyncStorage.setItem(StorageService.KEYS.FAVORITES, jsonValue);
    } catch (error) {
      console.error('Error saving favorites:', error);
      throw new Error('Failed to save favorites');
    }
  }

  async getFavorites(): Promise<Movie[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(StorageService.KEYS.FAVORITES);
      return jsonValue ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }

  async addToFavorites(movie: Movie): Promise<Movie[]> {
    try {
      const currentFavorites = await this.getFavorites();
      const isAlreadyFavorite = currentFavorites.some(fav => fav.id === movie.id);
      
      if (!isAlreadyFavorite) {
        const updatedFavorites = [movie, ...currentFavorites];
        await this.saveFavorites(updatedFavorites);
        return updatedFavorites;
      }
      
      return currentFavorites;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw new Error('Failed to add to favorites');
    }
  }

  async removeFromFavorites(movieId: number): Promise<Movie[]> {
    try {
      const currentFavorites = await this.getFavorites();
      const updatedFavorites = currentFavorites.filter(movie => movie.id !== movieId);
      await this.saveFavorites(updatedFavorites);
      return updatedFavorites;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw new Error('Failed to remove from favorites');
    }
  }

  async isFavorite(movieId: number): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some(movie => movie.id === movieId);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  /**
   * Search History Management
   */
  async saveSearchHistory(searches: string[]): Promise<void> {
    try {
      const limitedSearches = searches.slice(0, StorageService.MAX_SEARCH_HISTORY);
      const jsonValue = JSON.stringify(limitedSearches);
      await AsyncStorage.setItem(StorageService.KEYS.SEARCH_HISTORY, jsonValue);
    } catch (error) {
      console.error('Error saving search history:', error);
      throw new Error('Failed to save search history');
    }
  }

  async getSearchHistory(): Promise<string[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(StorageService.KEYS.SEARCH_HISTORY);
      return jsonValue ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error loading search history:', error);
      return [];
    }
  }

  async addToSearchHistory(query: string): Promise<string[]> {
    try {
      if (!query.trim()) return await this.getSearchHistory();
      
      const currentHistory = await this.getSearchHistory();
      // Remove query if it already exists
      const filteredHistory = currentHistory.filter(item => 
        item.toLowerCase() !== query.toLowerCase()
      );
      
      // Add to beginning and limit size
      const updatedHistory = [query, ...filteredHistory]
        .slice(0, StorageService.MAX_SEARCH_HISTORY);
      
      await this.saveSearchHistory(updatedHistory);
      return updatedHistory;
    } catch (error) {
      console.error('Error adding to search history:', error);
      throw new Error('Failed to add to search history');
    }
  }

  async clearSearchHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(StorageService.KEYS.SEARCH_HISTORY);
    } catch (error) {
      console.error('Error clearing search history:', error);
      throw new Error('Failed to clear search history');
    }
  }

  /**
   * User Preferences Management
   */
  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      const jsonValue = JSON.stringify(preferences);
      await AsyncStorage.setItem(StorageService.KEYS.USER_PREFERENCES, jsonValue);
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw new Error('Failed to save user preferences');
    }
  }

  async getUserPreferences(): Promise<UserPreferences> {
    try {
      const jsonValue = await AsyncStorage.getItem(StorageService.KEYS.USER_PREFERENCES);
      if (jsonValue) {
        return JSON.parse(jsonValue);
      }
      
      // Return default preferences
      const defaultPreferences: UserPreferences = {
        theme: 'system',
        favoriteGenres: [],
        language: 'en-US',
      };
      
      await this.saveUserPreferences(defaultPreferences);
      return defaultPreferences;
    } catch (error) {
      console.error('Error loading user preferences:', error);
      // Return default preferences on error
      return {
        theme: 'system',
        favoriteGenres: [],
        language: 'en-US',
      };
    }
  }

  /**
   * Cache Management
   */
  async cacheData<T>(key: string, data: T, customKey?: string): Promise<void> {
    try {
      const cacheKey = customKey || key;
      const cacheItem = {
        data,
        timestamp: Date.now(),
      };
      
      const jsonValue = JSON.stringify(cacheItem);
      await AsyncStorage.setItem(cacheKey, jsonValue);
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  async getCachedData<T>(key: string, customKey?: string): Promise<T | null> {
    try {
      const cacheKey = customKey || key;
      const jsonValue = await AsyncStorage.getItem(cacheKey);
      
      if (!jsonValue) return null;
      
      const cacheItem = JSON.parse(jsonValue);
      const isExpired = Date.now() - cacheItem.timestamp > StorageService.CACHE_EXPIRY;
      
      if (isExpired) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.error('Error loading cached data:', error);
      return null;
    }
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.includes('@MovieBrowserApp:movieCache'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Clear all data
   */
  async clearAllData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith('@MovieBrowserApp:'));
      await AsyncStorage.multiRemove(appKeys);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw new Error('Failed to clear all data');
    }
  }

  /**
   * Get storage size
   */
  async getStorageSize(): Promise<{ favorites: number; history: number; preferences: number }> {
    try {
      const [favorites, history, preferences] = await Promise.all([
        AsyncStorage.getItem(StorageService.KEYS.FAVORITES),
        AsyncStorage.getItem(StorageService.KEYS.SEARCH_HISTORY),
        AsyncStorage.getItem(StorageService.KEYS.USER_PREFERENCES),
      ]);

      return {
        favorites: favorites ? JSON.stringify(favorites).length : 0,
        history: history ? JSON.stringify(history).length : 0,
        preferences: preferences ? JSON.stringify(preferences).length : 0,
      };
    } catch (error) {
      console.error('Error getting storage size:', error);
      return { favorites: 0, history: 0, preferences: 0 };
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService; 