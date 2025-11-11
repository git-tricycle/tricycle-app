import { apiClient, ApiResponse, SearchParams } from './api.client';

// Rating Types matching API schema
export interface Rating {
  id: string;
  rideId: string;
  passengerId: string;
  driverId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  isDeleted: boolean;
  ride?: {
    id: string;
    pickup: string;
    dropoff: string;
    status: string;
  };
}

export interface CreateRatingRequest {
  rideId: string;
  rating: number;
  comment?: string;
}

export interface UpdateRatingRequest {
  rating?: number;
  comment?: string;
}

export interface RatingFilters extends SearchParams {
  rideId?: string;
  passengerId?: string;
  driverId?: string;
  rating?: number;
  dateFrom?: string;
  dateTo?: string;
}

class RatingService {
  /**
   * Get all ratings
   */
  async getRatings(filters?: RatingFilters): Promise<ApiResponse<Rating[]>> {
    return apiClient.get<Rating[]>('/rating', filters);
  }

  /**
   * Get rating by ID
   */
  async getRatingById(id: string): Promise<ApiResponse<Rating>> {
    return apiClient.get<Rating>(`/rating/${id}`);
  }

  /**
   * Create rating
   */
  async createRating(ratingData: CreateRatingRequest): Promise<ApiResponse<Rating>> {
    return apiClient.post<Rating>('/rating', ratingData);
  }

  /**
   * Update rating
   */
  async updateRating(id: string, updates: UpdateRatingRequest): Promise<ApiResponse<Rating>> {
    return apiClient.patch<Rating>(`/rating/${id}`, updates);
  }

  /**
   * Delete rating
   */
  async deleteRating(id: string): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`/rating/${id}`);
  }

  /**
   * Get rating by ride ID
   */
  async getRatingByRideId(rideId: string): Promise<ApiResponse<Rating>> {
    return apiClient.get<Rating>(`/rating/ride/${rideId}`);
  }

  /**
   * Get ratings by passenger
   */
  async getRatingsByPassenger(passengerId: string, filters?: RatingFilters): Promise<ApiResponse<Rating[]>> {
    return apiClient.get<Rating[]>(`/rating/passenger/${passengerId}`, filters);
  }

  /**
   * Get ratings by driver
   */
  async getRatingsByDriver(driverId: string, filters?: RatingFilters): Promise<ApiResponse<Rating[]>> {
    return apiClient.get<Rating[]>(`/rating/driver/${driverId}`, filters);
  }

  /**
   * Get driver average rating
   */
  async getDriverAverageRating(driverId: string): Promise<ApiResponse<{ averageRating: number; totalRatings: number }>> {
    return apiClient.get(`/rating/driver/${driverId}/average`);
  }

  /**
   * Get passenger rating history
   */
  async getPassengerRatingHistory(passengerId: string, filters?: RatingFilters): Promise<ApiResponse<Rating[]>> {
    return apiClient.get<Rating[]>(`/rating/passenger/${passengerId}/history`, filters);
  }

  /**
   * Get rating statistics
   */
  async getRatingStats(dateFrom?: string, dateTo?: string): Promise<ApiResponse<any>> {
    return apiClient.get('/rating/stats', { dateFrom, dateTo });
  }
}

export const ratingService = new RatingService();