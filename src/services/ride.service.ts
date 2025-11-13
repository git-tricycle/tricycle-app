import { apiClient, ApiResponse, SearchParams } from "./api.client";

// Ride Types matching API schema
export interface Ride {
  id: string;
  passengerId: string;
  driverId?: string;
  locationId?: string;
  pickup: string;
  dropoff: string;
  fare: number;
  paymentMode: string;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  eta?: number;
  createdAt: string;
  isDeleted: boolean;
  passenger?: {
    id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    email: string;
  };
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    email: string;
  };
  location?: {
    id: string;
    latitude: number;
    longitude: number;
  };
  payment?: {
    id: string;
    amount: number;
    type: "cash" | "gcash";
    isPaid: boolean;
  };
  rating?: {
    id: string;
    rating: number;
    comment?: string;
  };
}

export interface CreateRideRequest {
  pickup: string;
  dropoff: string;
  fare: number;
  paymentMode: string;
  eta?: number;
}

export interface UpdateRideRequest {
  pickup?: string;
  dropoff?: string;
  fare?: number;
  paymentMode?: string;
  status?: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  eta?: number;
  driverId?: string;
}

export interface RideFilters extends SearchParams {
  passengerId?: string;
  driverId?: string;
  status?: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  paymentMode?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AvailableDriver {
  id: string;
  name: string;
  email: string;
  username?: string;
  contactNumber?: string;
  vehicleNumber: string;
  location?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  };
  rating: number;
  estimatedArrival: number;
}

class RideService {
  /**
   * Get all rides
   */
  async getRides(filters?: RideFilters): Promise<ApiResponse<Ride[]>> {
    return apiClient.get<Ride[]>("/ride", filters);
  }

  /**
   * Get ride by ID
   */
  async getRideById(id: string): Promise<ApiResponse<Ride>> {
    return apiClient.get<Ride>(`/ride/${id}`);
  }

  /**
   * Create a new ride request
   */
  async createRide(rideData: CreateRideRequest): Promise<ApiResponse<Ride>> {
    return apiClient.post<Ride>("/ride", rideData);
  }

  /**
   * Update ride
   */
  async updateRide(id: string, updates: UpdateRideRequest): Promise<ApiResponse<Ride>> {
    return apiClient.patch<Ride>(`/ride/${id}`, updates);
  }

  /**
   * Delete ride (soft delete)
   */
  async deleteRide(id: string): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`/ride/${id}`);
  }

  /**
   * Accept a ride (driver)
   */
  async acceptRide(rideId: string): Promise<ApiResponse<Ride>> {
    return apiClient.patch<Ride>(`/ride/${rideId}/accept`);
  }

  /**
   * Start a ride (driver)
   */
  async startRide(rideId: string): Promise<ApiResponse<Ride>> {
    return apiClient.patch<Ride>(`/ride/${rideId}/start`);
  }

  /**
   * Complete a ride (driver)
   */
  async completeRide(rideId: string): Promise<ApiResponse<Ride>> {
    return apiClient.patch<Ride>(`/ride/${rideId}/complete`);
  }

  /**
   * Cancel a ride
   */
  async cancelRide(rideId: string): Promise<ApiResponse<Ride>> {
    return apiClient.patch<Ride>(`/ride/${rideId}/cancel`);
  }

  /**
   * Get rides by passenger
   */
  async getRidesByPassenger(
    passengerId: string,
    filters?: RideFilters
  ): Promise<ApiResponse<Ride[]>> {
    return apiClient.get<Ride[]>(`/ride/passenger/${passengerId}`, filters);
  }

  /**
   * Get rides by driver
   */
  async getRidesByDriver(driverId: string, filters?: RideFilters): Promise<ApiResponse<Ride[]>> {
    return apiClient.get<Ride[]>(`/ride/driver/${driverId}`, filters);
  }

  /**
   * Get available drivers near a location
   */
  async getAvailableDrivers(params?: {
    latitude?: number;
    longitude?: number;
    limit?: number;
  }): Promise<ApiResponse<AvailableDriver[]>> {
    return apiClient.get<AvailableDriver[]>("/ride/available-drivers", params);
  }
}

export const rideService = new RideService();
