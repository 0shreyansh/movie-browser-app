import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Movie, MovieDetails, MovieCredits, Genre } from '../types/movie';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn?: number; // milliseconds
}

interface CacheConfig {
  defaultExpirationTime: number; // milliseconds
  maxCacheSize: number; // maximum number of items
  cleanupInterval: number; // milliseconds
}

interface NetworkInfo {
  isConnected: boolean;
  type: string | null;
  isInternetReachable: boolean | null;
}

class CacheService {
  private static instance: CacheService;
  private config: CacheConfig;
  private networkInfo: NetworkInfo = {
    isConnected: false,
    type: null,
    isInternetReachable: null,
  };
  private cleanupIntervalId: NodeJS.Timeout | null = null;

  // Cache keys
  private static readonly KEYS = {
    POPULAR_MOVIES: 'cache_popular_movies',
    TOP_RATED_MOVIES: 'cache_top_rated_movies',
    NOW_PLAYING_MOVIES: 'cache_now_playing_movies',
    UPCOMING_MOVIES: 'cache_upcoming_movies',
    MOVIE_DETAILS: 'cache_movie_details_',
    MOVIE_CREDITS: 'cache_movie_credits_',
    SEARCH_RESULTS: 'cache_search_results_',
    GENRES: 'cache_genres',
    FAVORITES: 'cache_favorites',
    RECENTLY_VIEWED: 'cache_recently_viewed',
    USER_PREFERENCES: 'cache_user_preferences',
    CACHE_METADATA: 'cache_metadata',
  };

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultExpirationTime: 30 * 60 * 1000, // 30 minutes
      maxCacheSize: 1000,
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      ...config,
    };

    this.initializeNetworkMonitoring();
    this.startCleanupInterval();
  }

  static getInstance(config?: Partial<CacheConfig>): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(config);
    }
    return CacheService.instance;
  }

  private async initializeNetworkMonitoring(): Promise<void> {
    try {
      // Get initial network state
      const state = await NetInfo.fetch();
      this.updateNetworkInfo(state);

      // Subscribe to network changes
      NetInfo.addEventListener(this.updateNetworkInfo.bind(this));
    } catch (error) {
      console.warn('Failed to initialize network monitoring:', error);
    }
  }

  private updateNetworkInfo(state: NetInfoState): void {
    this.networkInfo = {
      isConnected: state.isConnected ?? false,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
    };
  }

  private startCleanupInterval(): void {
    this.cleanupIntervalId = setInterval(
      () => this.cleanupExpiredItems(),
      this.config.cleanupInterval
    );
  }

  public stopCleanupInterval(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  public getNetworkInfo(): NetworkInfo {
    return { ...this.networkInfo };
  }

  public isOnline(): boolean {
    return this.networkInfo.isConnected && 
           (this.networkInfo.isInternetReachable !== false);
  }

  // Generic cache operations
  public async set<T>(
    key: string, 
    data: T, 
    expiresIn?: number
  ): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresIn: expiresIn || this.config.defaultExpirationTime,
      };

      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
      await this.updateCacheMetadata(key);
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      // Check if cache has expired
      if (this.isCacheExpired(cacheItem)) {
        await this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  }

  public async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      await this.removeCacheMetadata(key);
    } catch (error) {
      console.warn('Failed to remove cached data:', error);
    }
  }

  public async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
      await AsyncStorage.removeItem(CacheService.KEYS.CACHE_METADATA);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  private isCacheExpired<T>(cacheItem: CacheItem<T>): boolean {
    if (!cacheItem.expiresIn) return false;
    return Date.now() - cacheItem.timestamp > cacheItem.expiresIn;
  }

  private async updateCacheMetadata(key: string): Promise<void> {
    try {
      const metadata = await this.getCacheMetadata();
      metadata[key] = Date.now();
      await AsyncStorage.setItem(
        CacheService.KEYS.CACHE_METADATA,
        JSON.stringify(metadata)
      );
    } catch (error) {
      console.warn('Failed to update cache metadata:', error);
    }
  }

  private async removeCacheMetadata(key: string): Promise<void> {
    try {
      const metadata = await this.getCacheMetadata();
      delete metadata[key];
      await AsyncStorage.setItem(
        CacheService.KEYS.CACHE_METADATA,
        JSON.stringify(metadata)
      );
    } catch (error) {
      console.warn('Failed to remove cache metadata:', error);
    }
  }

  private async getCacheMetadata(): Promise<Record<string, number>> {
    try {
      const metadata = await AsyncStorage.getItem(CacheService.KEYS.CACHE_METADATA);
      return metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      console.warn('Failed to get cache metadata:', error);
      return {};
    }
  }

  private async cleanupExpiredItems(): Promise<void> {
    try {
      const metadata = await this.getCacheMetadata();
      const keys = Object.keys(metadata);

      // Check each cached item for expiration
      for (const key of keys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const cacheItem: CacheItem<any> = JSON.parse(cached);
          if (this.isCacheExpired(cacheItem)) {
            await this.remove(key);
          }
        }
      }

      // Enforce max cache size
      await this.enforceCacheSize();
    } catch (error) {
      console.warn('Failed to cleanup expired items:', error);
    }
  }

  private async enforceCacheSize(): Promise<void> {
    try {
      const metadata = await this.getCacheMetadata();
      const entries = Object.entries(metadata);

      if (entries.length > this.config.maxCacheSize) {
        // Sort by timestamp (oldest first)
        entries.sort(([, a], [, b]) => a - b);
        
        // Remove oldest entries
        const toRemove = entries.slice(0, entries.length - this.config.maxCacheSize);
        for (const [key] of toRemove) {
          await this.remove(key);
        }
      }
    } catch (error) {
      console.warn('Failed to enforce cache size:', error);
    }
  }

  // Movie-specific cache methods
  public async cacheMovieList(
    category: 'popular' | 'top_rated' | 'now_playing' | 'upcoming',
    movies: Movie[]
  ): Promise<void> {
    const keyMap = {
      popular: CacheService.KEYS.POPULAR_MOVIES,
      top_rated: CacheService.KEYS.TOP_RATED_MOVIES,
      now_playing: CacheService.KEYS.NOW_PLAYING_MOVIES,
      upcoming: CacheService.KEYS.UPCOMING_MOVIES,
    };

    await this.set(keyMap[category], movies, 15 * 60 * 1000); // 15 minutes
  }

  public async getCachedMovieList(
    category: 'popular' | 'top_rated' | 'now_playing' | 'upcoming'
  ): Promise<Movie[] | null> {
    const keyMap = {
      popular: CacheService.KEYS.POPULAR_MOVIES,
      top_rated: CacheService.KEYS.TOP_RATED_MOVIES,
      now_playing: CacheService.KEYS.NOW_PLAYING_MOVIES,
      upcoming: CacheService.KEYS.UPCOMING_MOVIES,
    };

    return await this.get<Movie[]>(keyMap[category]);
  }

  public async cacheMovieDetails(movieId: number, details: MovieDetails): Promise<void> {
    await this.set(
      `${CacheService.KEYS.MOVIE_DETAILS}${movieId}`,
      details,
      60 * 60 * 1000 // 1 hour
    );
  }

  public async getCachedMovieDetails(movieId: number): Promise<MovieDetails | null> {
    return await this.get<MovieDetails>(`${CacheService.KEYS.MOVIE_DETAILS}${movieId}`);
  }

  public async cacheMovieCredits(movieId: number, credits: MovieCredits): Promise<void> {
    await this.set(
      `${CacheService.KEYS.MOVIE_CREDITS}${movieId}`,
      credits,
      60 * 60 * 1000 // 1 hour
    );
  }

  public async getCachedMovieCredits(movieId: number): Promise<MovieCredits | null> {
    return await this.get<MovieCredits>(`${CacheService.KEYS.MOVIE_CREDITS}${movieId}`);
  }

  public async cacheSearchResults(query: string, results: Movie[]): Promise<void> {
    await this.set(
      `${CacheService.KEYS.SEARCH_RESULTS}${query.toLowerCase()}`,
      results,
      10 * 60 * 1000 // 10 minutes
    );
  }

  public async getCachedSearchResults(query: string): Promise<Movie[] | null> {
    return await this.get<Movie[]>(`${CacheService.KEYS.SEARCH_RESULTS}${query.toLowerCase()}`);
  }

  public async cacheGenres(genres: Genre[]): Promise<void> {
    await this.set(
      CacheService.KEYS.GENRES,
      genres,
      24 * 60 * 60 * 1000 // 24 hours
    );
  }

  public async getCachedGenres(): Promise<Genre[] | null> {
    return await this.get<Genre[]>(CacheService.KEYS.GENRES);
  }

  // User data cache methods
  public async cacheFavorites(favorites: Movie[]): Promise<void> {
    await this.set(CacheService.KEYS.FAVORITES, favorites); // No expiration
  }

  public async getCachedFavorites(): Promise<Movie[] | null> {
    return await this.get<Movie[]>(CacheService.KEYS.FAVORITES);
  }

  public async cacheRecentlyViewed(movies: Movie[]): Promise<void> {
    await this.set(CacheService.KEYS.RECENTLY_VIEWED, movies); // No expiration
  }

  public async getCachedRecentlyViewed(): Promise<Movie[] | null> {
    return await this.get<Movie[]>(CacheService.KEYS.RECENTLY_VIEWED);
  }

  public async cacheUserPreferences(preferences: any): Promise<void> {
    await this.set(CacheService.KEYS.USER_PREFERENCES, preferences); // No expiration
  }

  public async getCachedUserPreferences(): Promise<any | null> {
    return await this.get<any>(CacheService.KEYS.USER_PREFERENCES);
  }

  // Cache statistics
  public async getCacheStats(): Promise<{
    totalItems: number;
    totalSize: string;
    oldestItem: string | null;
    newestItem: string | null;
  }> {
    try {
      const metadata = await this.getCacheMetadata();
      const entries = Object.entries(metadata);
      
      if (entries.length === 0) {
        return {
          totalItems: 0,
          totalSize: '0 KB',
          oldestItem: null,
          newestItem: null,
        };
      }

      // Sort by timestamp
      entries.sort(([, a], [, b]) => a - b);
      
      // Calculate total size (approximate)
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith('cache_'));
      let totalSize = 0;
      
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      const sizeInKB = (totalSize / 1024).toFixed(2);

      return {
        totalItems: entries.length,
        totalSize: `${sizeInKB} KB`,
        oldestItem: entries[0]?.[0] || null,
        newestItem: entries[entries.length - 1]?.[0] || null,
      };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return {
        totalItems: 0,
        totalSize: '0 KB',
        oldestItem: null,
        newestItem: null,
      };
    }
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();
export default cacheService; 