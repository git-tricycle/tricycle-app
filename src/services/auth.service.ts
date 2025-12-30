import { apiClient, ApiResponse } from "./api.client";

// Auth Types matching API schema
export interface LoginCredentials {
  email: string;
  password: string;
  role: "driver" | "passenger" | "admin";
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  password: string;
  role?: "driver" | "passenger" | "admin";
  status?: "active" | "inactive" | "banned";
  metadata?: {
    address?: string;
    phone?: string;
    age?: number;
    gender?: "male" | "female" | "other";
  } | null;
  studentProfile?: StudentProfileData;
  driverProfile?: DriverProfileData;
  vehicleData?: VehicleData;
}

export interface VehicleData {
  plateNumber: string;
  bodyNumber: string;
  vehiclePhoto?: string;
  orCrPhoto?: string;
}

export interface StudentProfileData {
  studentId: string;
  dateOfBirth: Date | string;
  course?: string;
  yearLevel?: string;
  schoolEmail?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  studentIdPhoto?: string;
}

export interface DriverProfileData {
  username: string;
  address: string;
  age: number;
  contactNumber: string;
  licensePhoto?: string;
  validIdPhoto?: string;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  role: "driver" | "passenger" | "admin";
  status: "active" | "inactive" | "banned";
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

class AuthService {
  /**
   * Register a new user (student or driver)
   */
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/register", data);

      if (response.success && response.data?.token) {
        // Store token and user data for future requests
        await apiClient.setToken(response.data.token);
        await apiClient.setUserData(response.data.user);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/login", credentials);

      if (response.success && response.data?.token) {
        // Store token and user data for future requests
        await apiClient.setToken(response.data.token);
        await apiClient.setUserData(response.data.user);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Remove stored token and user data
      await apiClient.removeToken();
      await apiClient.removeUserData();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await apiClient.getToken();
      return !!token;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current user token
   */
  async getToken(): Promise<string | null> {
    try {
      return await apiClient.getToken();
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current user data from storage
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      return await apiClient.getUserData();
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();
