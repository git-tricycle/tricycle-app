import { apiClient, ApiResponse, SearchParams } from './api.client';

// Vehicle Types matching API schema
export interface Vehicle {
  id: string;
  driverId: string;
  plateNumber: string;
  bodyNumber: string;
  vehiclePhoto?: string;
  orCrPhoto?: string;
  isApproved: boolean;
  isDeleted: boolean;
  driver?: {
    id: string;
    username: string;
    address: string;
    age: number;
    contactNumber: string;
  };
}

export interface CreateVehicleRequest {
  plateNumber: string;
  bodyNumber: string;
  vehiclePhoto?: string;
  orCrPhoto?: string;
}

export interface UpdateVehicleRequest {
  plateNumber?: string;
  bodyNumber?: string;
  vehiclePhoto?: string;
  orCrPhoto?: string;
  isApproved?: boolean;
}

export interface VehicleFilters extends SearchParams {
  driverId?: string;
  plateNumber?: string;
  bodyNumber?: string;
  isApproved?: boolean;
  isDeleted?: boolean;
}

class VehicleService {
  /**
   * Get all vehicles
   */
  async getVehicles(filters?: VehicleFilters): Promise<ApiResponse<Vehicle[]>> {
    return apiClient.get<Vehicle[]>('/vehicle', filters);
  }

  /**
   * Get vehicle by ID
   */
  async getVehicleById(id: string): Promise<ApiResponse<Vehicle>> {
    return apiClient.get<Vehicle>(`/vehicle/${id}`);
  }

  /**
   * Create vehicle
   */
  async createVehicle(vehicleData: CreateVehicleRequest): Promise<ApiResponse<Vehicle>> {
    return apiClient.post<Vehicle>('/vehicle', vehicleData);
  }

  /**
   * Update vehicle
   */
  async updateVehicle(id: string, updates: UpdateVehicleRequest): Promise<ApiResponse<Vehicle>> {
    return apiClient.patch<Vehicle>(`/vehicle/${id}`, updates);
  }

  /**
   * Delete vehicle
   */
  async deleteVehicle(id: string): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`/vehicle/${id}`);
  }

  /**
   * Get vehicle by driver ID
   */
  async getVehicleByDriverId(driverId: string): Promise<ApiResponse<Vehicle>> {
    return apiClient.get<Vehicle>(`/vehicle/driver/${driverId}`);
  }

  /**
   * Get current driver's vehicle
   */
  async getCurrentDriverVehicle(): Promise<ApiResponse<Vehicle>> {
    return apiClient.get<Vehicle>('/vehicle/my-vehicle');
  }

  /**
   * Update current driver's vehicle
   */
  async updateCurrentDriverVehicle(updates: UpdateVehicleRequest): Promise<ApiResponse<Vehicle>> {
    return apiClient.patch<Vehicle>('/vehicle/my-vehicle', updates);
  }

  /**
   * Get vehicle by plate number
   */
  async getVehicleByPlateNumber(plateNumber: string): Promise<ApiResponse<Vehicle>> {
    return apiClient.get<Vehicle>(`/vehicle/plate/${plateNumber}`);
  }

  /**
   * Approve vehicle (admin only)
   */
  async approveVehicle(id: string, isApproved: boolean): Promise<ApiResponse<Vehicle>> {
    return apiClient.patch<Vehicle>(`/vehicle/${id}/approve`, { isApproved });
  }

  /**
   * Upload vehicle photo
   */
  async uploadVehiclePhoto(imageUri: string): Promise<ApiResponse<{ vehiclePhotoUrl: string }>> {
    const formData = new FormData();
    formData.append('vehiclePhoto', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'vehicle.jpg',
    } as any);

    return apiClient.post<{ vehiclePhotoUrl: string }>('/vehicle/upload-photo', formData);
  }

  /**
   * Upload OR/CR photo
   */
  async uploadOrCrPhoto(imageUri: string): Promise<ApiResponse<{ orCrPhotoUrl: string }>> {
    const formData = new FormData();
    formData.append('orCrPhoto', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'or_cr.jpg',
    } as any);

    return apiClient.post<{ orCrPhotoUrl: string }>('/vehicle/upload-or-cr', formData);
  }

  /**
   * Search vehicles
   */
  async searchVehicles(query: string, filters?: VehicleFilters): Promise<ApiResponse<Vehicle[]>> {
    return apiClient.get<Vehicle[]>('/vehicle/search', { ...filters, query });
  }
}

export const vehicleService = new VehicleService();
