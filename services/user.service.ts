import { apiClient, ApiResponse, SearchParams } from './api.client';

// User Types matching API schema
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  role: 'driver' | 'passenger' | 'admin';
  status: 'active' | 'inactive' | 'banned';
  avatar?: string;
  metadata?: {
    address?: string;
    phone?: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
  };
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  password: string;
  role: 'driver' | 'passenger' | 'admin';
  status?: 'active' | 'inactive' | 'banned';
  metadata?: {
    address?: string;
    phone?: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
  };
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  status?: 'active' | 'inactive' | 'banned';
  avatar?: string;
  metadata?: {
    address?: string;
    phone?: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
  };
}

export interface UserFilters extends SearchParams {
  role?: 'driver' | 'passenger' | 'admin';
  status?: 'active' | 'inactive' | 'banned';
  search?: string;
}

class UserService {
  /**
   * Get all users (Admin only)
   */
  async getUsers(filters?: UserFilters): Promise<ApiResponse<User[]>> {
    return apiClient.get<User[]>('/user', filters);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`/user/${id}`);
  }

  /**
   * Create user (Admin only)
   */
  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.post<User>('/user/admin', userData);
  }

  /**
   * Update user
   */
  async updateUser(id: string, updates: UpdateUserRequest): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`/user/${id}`, updates);
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`/user/${id}`);
  }
}

export const userService = new UserService();