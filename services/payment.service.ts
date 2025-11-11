import { apiClient, ApiResponse, SearchParams } from './api.client';

// Payment Types matching API schema
export interface Payment {
  id: string;
  rideId: string;
  amount: number;
  type: 'cash' | 'gcash';
  isPaid: boolean;
  createdAt: string;
  isDeleted: boolean;
  ride?: {
    id: string;
    pickup: string;
    dropoff: string;
    status: string;
  };
}

export interface CreatePaymentRequest {
  rideId: string;
  amount: number;
  type: 'cash' | 'gcash';
}

export interface UpdatePaymentRequest {
  amount?: number;
  type?: 'cash' | 'gcash';
  isPaid?: boolean;
}

export interface PaymentFilters extends SearchParams {
  rideId?: string;
  type?: 'cash' | 'gcash';
  isPaid?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

class PaymentService {
  /**
   * Get all payments
   */
  async getPayments(filters?: PaymentFilters): Promise<ApiResponse<Payment[]>> {
    return apiClient.get<Payment[]>('/payment', filters);
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<ApiResponse<Payment>> {
    return apiClient.get<Payment>(`/payment/${id}`);
  }

  /**
   * Create payment
   */
  async createPayment(paymentData: CreatePaymentRequest): Promise<ApiResponse<Payment>> {
    return apiClient.post<Payment>('/payment', paymentData);
  }

  /**
   * Update payment
   */
  async updatePayment(id: string, updates: UpdatePaymentRequest): Promise<ApiResponse<Payment>> {
    return apiClient.patch<Payment>(`/payment/${id}`, updates);
  }

  /**
   * Delete payment (soft delete)
   */
  async deletePayment(id: string): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`/payment/${id}`);
  }

  /**
   * Get payment by ride ID
   */
  async getPaymentByRideId(rideId: string): Promise<ApiResponse<Payment>> {
    return apiClient.get<Payment>(`/payment/ride/${rideId}`);
  }

  /**
   * Process payment
   */
  async processPayment(paymentId: string, paymentDetails?: any): Promise<ApiResponse<Payment>> {
    return apiClient.patch<Payment>(`/payment/${paymentId}/process`, paymentDetails);
  }
}

export const paymentService = new PaymentService();