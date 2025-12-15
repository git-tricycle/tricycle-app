import { Platform } from "react-native";
import { apiClient, ApiResponse, SearchParams } from "./api.client";

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
    return apiClient.get<Vehicle[]>("/vehicle", filters);
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
    return apiClient.post<Vehicle>("/vehicle", vehicleData);
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
    return apiClient.get<Vehicle>("/vehicle/my-vehicle");
  }

  /**
   * Update current driver's vehicle
   */
  async updateCurrentDriverVehicle(updates: UpdateVehicleRequest): Promise<ApiResponse<Vehicle>> {
    return apiClient.patch<Vehicle>("/vehicle/my-vehicle", updates);
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
    formData.append("vehiclePhoto", {
      uri: imageUri,
      type: "image/jpeg",
      name: "vehicle.jpg",
    } as any);

    return apiClient.post<{ vehiclePhotoUrl: string }>("/vehicle/upload-photo", formData);
  }

  /**
   * Upload OR/CR photo
   */
  async uploadOrCrPhoto(imageUri: string): Promise<ApiResponse<{ orCrPhotoUrl: string }>> {
    const formData = new FormData();
    formData.append("orCrPhoto", {
      uri: imageUri,
      type: "image/jpeg",
      name: "or_cr.jpg",
    } as any);

    return apiClient.post<{ orCrPhotoUrl: string }>("/vehicle/upload-or-cr", formData);
  }

  /**
   * Search vehicles
   */
  async searchVehicles(query: string, filters?: VehicleFilters): Promise<ApiResponse<Vehicle[]>> {
    return apiClient.get<Vehicle[]>("/vehicle/search", { ...filters, query });
  }

  /**
   * Upload vehicle documents (vehicle photo and OR/CR photo)
   */
  async uploadVehicleDocuments(
    vehicleId: string,
    files: {
      vehiclePhoto?: File | { uri: string; name: string; type: string };
      orCrPhoto?: File | { uri: string; name: string; type: string };
    }
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();

    if (files.vehiclePhoto) {
      if ("uri" in files.vehiclePhoto) {
        // React Native format
        formData.append("vehiclePhoto", {
          uri: files.vehiclePhoto.uri,
          name: files.vehiclePhoto.name,
          type: files.vehiclePhoto.type,
        } as any);
      } else {
        // Web File format
        formData.append("vehiclePhoto", files.vehiclePhoto);
      }
    }

    if (files.orCrPhoto) {
      if ("uri" in files.orCrPhoto) {
        // React Native format
        formData.append("orCrPhoto", {
          uri: files.orCrPhoto.uri,
          name: files.orCrPhoto.name,
          type: files.orCrPhoto.type,
        } as any);
      } else {
        // Web File format
        formData.append("orCrPhoto", files.orCrPhoto);
      }
    }

    // Set Content-Type conditionally based on platform
    const headers: Record<string, string> = {};
    if (Platform.OS !== "web") {
      headers["Content-Type"] = "multipart/form-data";
    }
    // On web, let browser set Content-Type automatically for proper boundary

    return apiClient.request<any>(`/vehicle/${vehicleId}/upload-documents`, {
      method: "POST",
      body: formData,
      headers,
    });
  }

  /**
   * Delete vehicle documents from Cloudinary
   */
  async deleteVehicleDocuments(
    vehicleId: string,
    documentType?: "vehiclePhoto" | "orCrPhoto" | "all"
  ): Promise<ApiResponse<any>> {
    const params = documentType ? { documentType } : undefined;
    return apiClient.request<any>(`/vehicle/${vehicleId}/delete-documents`, {
      method: "DELETE",
      params,
    });
  }
}

export const vehicleService = new VehicleService();
