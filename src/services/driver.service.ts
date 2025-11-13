import { apiClient, ApiResponse, SearchParams } from "./api.client";

// Driver Types matching API schema
export interface Driver {
  id: string;
  userId: string;
  username: string;
  address: string;
  age: number;
  contactNumber: string;
  licensePhoto?: string;
  validIdPhoto?: string;
  isVerified: boolean;
  isDeleted: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    email: string;
    role: string;
    status: string;
  };
  vehicle?: {
    id: string;
    plateNumber: string;
    bodyNumber: string;
    vehiclePhoto?: string;
    orCrUpload?: string;
  };
}

export interface CreateDriverRequest {
  username: string;
  address: string;
  age: number;
  contactNumber: string;
  licensePhoto?: string;
  validIdPhoto?: string;
  user: {
    connect: { id: string };
  };
}

export interface UpdateDriverRequest {
  username?: string;
  address?: string;
  age?: number;
  contactNumber?: string;
  licensePhoto?: string;
  validIdPhoto?: string;
}

export interface DriverFilters extends SearchParams {
  username?: string;
  isVerified?: boolean;
  isDeleted?: boolean;
  search?: string;
}

export interface DriverLocationUpdate {
  latitude: number;
  longitude: number;
}

class DriverService {
  /**
   * Get all drivers
   */
  async getDrivers(filters?: DriverFilters): Promise<ApiResponse<Driver[]>> {
    return apiClient.get<Driver[]>("/driver", filters);
  }

  /**
   * Get driver by ID
   */
  async getDriverById(id: string, fields?: string): Promise<ApiResponse<Driver>> {
    const params = fields ? { fields } : undefined;
    return apiClient.get<Driver>(`/driver/${id}`, params);
  }

  /**
   * Create driver profile (used internally by auth service)
   */
  async createDriver(driverData: CreateDriverRequest): Promise<ApiResponse<Driver>> {
    return apiClient.post<Driver>("/driver", driverData);
  }

  /**
   * Update driver profile
   */
  async updateDriver(id: string, updates: UpdateDriverRequest): Promise<ApiResponse<Driver>> {
    return apiClient.patch<Driver>(`/driver/${id}`, updates);
  }

  /**
   * Delete driver profile (soft delete)
   */
  async deleteDriver(id: string): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`/driver/${id}`);
  }

  /**
   * Update driver online/offline status
   */
  async updateDriverStatus(isOnline: boolean): Promise<ApiResponse<any>> {
    return apiClient.patch<any>("/driver/status", { isOnline });
  }

  /**
   * Update driver current location
   */
  async updateDriverLocation(location: DriverLocationUpdate): Promise<ApiResponse<any>> {
    return apiClient.patch<any>("/driver/location", location);
  }
}

export const driverService = new DriverService();
