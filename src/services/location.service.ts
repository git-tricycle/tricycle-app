import { apiClient, ApiResponse, SearchParams } from './api.client';

// Location Types matching API schema
export interface Location {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    email: string;
  };
}

export interface CreateLocationRequest {
  latitude: number;
  longitude: number;
}

export interface UpdateLocationRequest {
  latitude?: number;
  longitude?: number;
}

export interface LocationFilters extends SearchParams {
  userId?: string;
  nearLatitude?: number;
  nearLongitude?: number;
  radiusKm?: number;
}

class LocationService {
  /**
   * Get all locations
   */
  async getLocations(filters?: LocationFilters): Promise<ApiResponse<Location[]>> {
    return apiClient.get<Location[]>('/location', filters);
  }

  /**
   * Get location by ID
   */
  async getLocationById(id: string): Promise<ApiResponse<Location>> {
    return apiClient.get<Location>(`/location/${id}`);
  }

  /**
   * Create or update user location
   */
  async createLocation(locationData: CreateLocationRequest): Promise<ApiResponse<Location>> {
    return apiClient.post<Location>('/location', locationData);
  }

  /**
   * Update location
   */
  async updateLocation(id: string, updates: UpdateLocationRequest): Promise<ApiResponse<Location>> {
    return apiClient.patch<Location>(`/location/${id}`, updates);
  }

  /**
   * Delete location
   */
  async deleteLocation(id: string): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`/location/${id}`);
  }

  /**
   * Get location by user ID
   */
  async getLocationByUserId(userId: string): Promise<ApiResponse<Location>> {
    return apiClient.get<Location>(`/location/user/${userId}`);
  }
}

export const locationService = new LocationService();