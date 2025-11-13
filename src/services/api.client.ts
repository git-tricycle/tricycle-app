import { getApiBaseUrl } from './config';

// API Base Configuration
const API_BASE_URL = getApiBaseUrl();

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, any>;
}

// Token Storage
export const TokenStorage = {
  async getToken(): Promise<string | null> {
    try {
      // For now we'll use AsyncStorage, but you can implement SecureStore later
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  },

  async removeToken(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },
};

// Base API Client
export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Token management methods
  async setToken(token: string): Promise<void> {
    return TokenStorage.setToken(token);
  }

  async getToken(): Promise<string | null> {
    return TokenStorage.getToken();
  }

  async removeToken(): Promise<void> {
    return TokenStorage.removeToken();
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await TokenStorage.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit & { params?: Record<string, any> } = {}
  ): Promise<ApiResponse<T>> {
    try {
      const { params, ...fetchOptions } = options;
      let url = `${this.baseURL}${endpoint}`;

      // Add query parameters
      if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        if (searchParams.toString()) {
          url += `?${searchParams.toString()}`;
        }
      }

      const headers = await this.getHeaders();
      
      console.log('Making API request to:', url);
      console.log('Request headers:', headers);
      console.log('Request body:', fetchOptions.body);
      
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...headers,
          ...fetchOptions.headers,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Network request failed`);
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      console.error('Request URL:', `${this.baseURL}${endpoint}`);
      console.error('Request options:', options);
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }
}

// Singleton instance
export const apiClient = new ApiClient();