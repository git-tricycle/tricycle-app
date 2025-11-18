import { apiClient, ApiResponse } from "./api.client";

export interface FareSettings {
  id: string;
  baseFare: number;
  ratePerKm: number;
  minimumFare?: number;
  maximumFare?: number;
  timeBasedRate?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FareCalculation {
  distance: number;
  baseFare: number;
  ratePerKm: number;
  calculatedFare: number;
  estimatedTime?: number;
  minimumFare?: number;
  maximumFare?: number;
  timeBasedRate?: number;
  surgeMultiplier?: number;
}

export interface FareCalculationOptions {
  estimatedTime?: number;
  surgeMultiplier?: number;
}

export interface CreateFareSettingsRequest {
  baseFare: number;
  ratePerKm: number;
  minimumFare?: number;
  maximumFare?: number;
  timeBasedRate?: number;
}

export interface UpdateFareSettingsRequest {
  baseFare?: number;
  ratePerKm?: number;
  minimumFare?: number;
  maximumFare?: number;
  timeBasedRate?: number;
  isActive?: boolean;
}

class FareService {
  /**
   * Get current active fare settings (public)
   */
  async getCurrentFareSettings(): Promise<ApiResponse<FareSettings>> {
    return apiClient.get<FareSettings>("/fare/current");
  }

  /**
   * Calculate fare based on distance (public)
   */
  async calculateFare(
    distance: number,
    options?: FareCalculationOptions
  ): Promise<ApiResponse<FareCalculation>> {
    let url = `/fare/calculate?distance=${distance}`;

    if (options?.estimatedTime) {
      url += `&estimatedTime=${options.estimatedTime}`;
    }

    if (options?.surgeMultiplier) {
      url += `&surgeMultiplier=${options.surgeMultiplier}`;
    }

    return apiClient.get<FareCalculation>(url);
  }

  /**
   * Get all fare settings (admin only)
   */
  async getAllFareSettings(): Promise<ApiResponse<FareSettings[]>> {
    return apiClient.get<FareSettings[]>("/fare");
  }

  /**
   * Create new fare settings (admin only)
   */
  async createFareSettings(
    fareData: CreateFareSettingsRequest
  ): Promise<ApiResponse<FareSettings>> {
    return apiClient.post<FareSettings>("/fare", fareData);
  }

  /**
   * Update fare settings (admin only)
   */
  async updateFareSettings(
    id: string,
    fareData: UpdateFareSettingsRequest
  ): Promise<ApiResponse<FareSettings>> {
    return apiClient.patch<FareSettings>(`/fare/${id}`, fareData);
  }

  /**
   * Delete fare settings (admin only)
   */
  async deleteFareSettings(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/fare/${id}`);
  }

  /**
   * Local fare calculation function
   */
  calculateFareLocal(distance: number, baseFare: number, ratePerKm: number): number {
    if (distance <= 0) return baseFare;
    return baseFare + distance * ratePerKm;
  }
}

export const fareService = new FareService();
