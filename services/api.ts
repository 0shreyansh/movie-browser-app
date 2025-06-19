import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Movie, MovieDetails, MovieResponse, Genre, SearchParams } from '../types/movie';

class TMDBService {
  private api: AxiosInstance;
  private readonly baseURL = 'https://api.themoviedb.org/3';
  private readonly imageBaseURL = 'https://image.tmdb.org/t/p/';
  private readonly apiKey: string;

  constructor() {
    // You'll need to add your TMDB API key here
    this.apiKey = process.env.EXPO_PUBLIC_TMDB_API_KEY || 'YOUR_API_KEY_HERE';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      params: {
        api_key: this.apiKey,
        language: 'en-US',
      },
    });

    // Request interceptor for debugging
    this.api.interceptors.request.use(
      (config) => {
        console.log(`Making API request to: ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please check your TMDB API key.');
        }
        if (error.response?.status === 404) {
          throw new Error('Resource not found.');
        }
        if (error.response?.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        throw error;
      }
    );
  }

  /**
   * Get popular movies
   */
  async getPopularMovies(page: number = 1): Promise<MovieResponse> {
    try {
      const response = await this.api.get<MovieResponse>('/movie/popular', {
        params: { page },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      throw error;
    }
  }

  /**
   * Get top rated movies
   */
  async getTopRatedMovies(page: number = 1): Promise<MovieResponse> {
    try {
      const response = await this.api.get<MovieResponse>('/movie/top_rated', {
        params: { page },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      throw error;
    }
  }

  /**
   * Get upcoming movies
   */
  async getUpcomingMovies(page: number = 1): Promise<MovieResponse> {
    try {
      const response = await this.api.get<MovieResponse>('/movie/upcoming', {
        params: { page },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming movies:', error);
      throw error;
    }
  }

  /**
   * Get now playing movies
   */
  async getNowPlayingMovies(page: number = 1): Promise<MovieResponse> {
    try {
      const response = await this.api.get<MovieResponse>('/movie/now_playing', {
        params: { page },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching now playing movies:', error);
      throw error;
    }
  }

  /**
   * Search movies by query
   */
  async searchMovies(query: string, page: number = 1): Promise<MovieResponse> {
    try {
      if (!query.trim()) {
        return { page: 1, results: [], total_pages: 0, total_results: 0 };
      }

      const response = await this.api.get<MovieResponse>('/search/movie', {
        params: {
          query: query.trim(),
          page,
          include_adult: false,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  }

  /**
   * Get movie details by ID
   */
  async getMovieDetails(id: number): Promise<MovieDetails> {
    try {
      const response = await this.api.get<MovieDetails>(`/movie/${id}`, {
        params: {
          append_to_response: 'credits,videos,similar,recommendations',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw error;
    }
  }

  /**
   * Get all movie genres
   */
  async getGenres(): Promise<Genre[]> {
    try {
      const response = await this.api.get<{ genres: Genre[] }>('/genre/movie/list');
      return response.data.genres;
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  }

  /**
   * Discover movies with filters
   */
  async discoverMovies(params: SearchParams): Promise<MovieResponse> {
    try {
      const response = await this.api.get<MovieResponse>('/discover/movie', {
        params: {
          page: params.page || 1,
          with_genres: params.genre,
          primary_release_year: params.year,
          sort_by: params.sortBy || 'popularity.desc',
          include_adult: false,
          include_video: false,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error discovering movies:', error);
      throw error;
    }
  }

  /**
   * Get movie recommendations
   */
  async getMovieRecommendations(id: number, page: number = 1): Promise<MovieResponse> {
    try {
      const response = await this.api.get<MovieResponse>(`/movie/${id}/recommendations`, {
        params: { page },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching movie recommendations:', error);
      throw error;
    }
  }

  /**
   * Get similar movies
   */
  async getSimilarMovies(id: number, page: number = 1): Promise<MovieResponse> {
    try {
      const response = await this.api.get<MovieResponse>(`/movie/${id}/similar`, {
        params: { page },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching similar movies:', error);
      throw error;
    }
  }

  /**
   * Get full image URL
   */
  getImageURL(path: string | null, size: string = 'w500'): string | null {
    if (!path) return null;
    return `${this.imageBaseURL}${size}${path}`;
  }

  /**
   * Get backdrop image URL
   */
  getBackdropURL(path: string | null, size: string = 'w1280'): string | null {
    if (!path) return null;
    return `${this.imageBaseURL}${size}${path}`;
  }

  /**
   * Get poster image URL
   */
  getPosterURL(path: string | null, size: string = 'w500'): string | null {
    if (!path) return null;
    return `${this.imageBaseURL}${size}${path}`;
  }

  /**
   * Get profile image URL for cast/crew
   */
  getProfileURL(path: string | null, size: string = 'w185'): string | null {
    if (!path) return null;
    return `${this.imageBaseURL}${size}${path}`;
  }
}

// Export singleton instance
export const tmdbService = new TMDBService();
export default tmdbService; 