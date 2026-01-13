import { apiClient, ApiResponse } from "./api.client";

// TripShare Types
export interface TripShareResponse {
  shareToken: string;
  shareUrl: string;
  expiresAt: string;
}

export interface SharedTripData {
  tripInfo: {
    pickup: string;
    dropoff: string;
    status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
    eta?: number;
    createdAt: string;
  };
  passenger: {
    name: string;
    contact?: string;
  };
  driver?: {
    name: string;
    vehicle?: {
      plateNumber?: string;
      bodyNumber?: string;
    };
  } | null;
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  } | null;
  shareInfo: {
    expiresAt: string;
    viewCount: number;
  };
}

export interface ActiveShare {
  id: string;
  shareToken: string;
  shareUrl: string;
  expiresAt: string;
  viewCount: number;
  createdAt: string;
}

export interface GenerateShareLinkRequest {
  rideId: string;
  expirationHours?: number; // Default 24 hours, max 72
}

class TripShareService {
  /**
   * Generate a shareable link for a trip
   */
  async generateShareLink(
    data: GenerateShareLinkRequest,
  ): Promise<ApiResponse<TripShareResponse>> {
    return apiClient.post<TripShareResponse>("/tripshare/generate", data);
  }

  /**
   * Get shared trip data by share token (Public - no auth required)
   */
  async getSharedTripData(
    shareToken: string,
  ): Promise<ApiResponse<SharedTripData>> {
    return apiClient.get<SharedTripData>(`/tripshare/${shareToken}`);
  }

  /**
   * Deactivate a share link
   */
  async deactivateShareLink(shareToken: string): Promise<ApiResponse<void>> {
    return apiClient.patch<void>(`/tripshare/${shareToken}/deactivate`);
  }

  /**
   * Get all active shares for a specific ride
   */
  async getActiveSharesByRide(
    rideId: string,
  ): Promise<ApiResponse<ActiveShare[]>> {
    return apiClient.get<ActiveShare[]>(`/tripshare/ride/${rideId}/shares`);
  }

  /**
   * Cleanup expired shares (Admin/Cron)
   */
  async cleanupExpiredShares(): Promise<ApiResponse<{ count: number }>> {
    return apiClient.post<{ count: number }>("/tripshare/cleanup");
  }
}

export const tripShareService = new TripShareService();
