import { apiClient, ApiResponse, SearchParams } from "./api.client";

// Student Types matching API schema
export interface Student {
  id: string;
  userId: string;
  studentId: string;
  dateOfBirth: string;
  course?: string;
  yearLevel?: string;
  schoolEmail?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  studentIdPhoto?: string;
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
}

export interface CreateStudentRequest {
  studentId: string;
  dateOfBirth: Date | string;
  course?: string;
  yearLevel?: string;
  schoolEmail?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  studentIdPhoto?: string;
  user: {
    connect: { id: string };
  };
}

export interface UpdateStudentRequest {
  studentId?: string;
  dateOfBirth?: Date | string;
  course?: string;
  yearLevel?: string;
  schoolEmail?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  studentIdPhoto?: string;
}

export interface StudentFilters extends SearchParams {
  course?: string;
  yearLevel?: string;
  isVerified?: boolean;
  isDeleted?: boolean;
  search?: string;
}

class StudentService {
  /**
   * Get all students
   */
  async getStudents(filters?: StudentFilters): Promise<ApiResponse<Student[]>> {
    return apiClient.get<Student[]>("/student", filters);
  }

  /**
   * Get student by ID
   */
  async getStudentById(id: string): Promise<ApiResponse<Student>> {
    return apiClient.get<Student>(`/student/${id}`);
  }

  /**
   * Create student profile (used internally by auth service)
   */
  async createStudent(studentData: CreateStudentRequest): Promise<ApiResponse<Student>> {
    return apiClient.post<Student>("/student", studentData);
  }

  /**
   * Update student profile
   */
  async updateStudent(id: string, updates: UpdateStudentRequest): Promise<ApiResponse<Student>> {
    return apiClient.patch<Student>(`/student/${id}`, updates);
  }

  /**
   * Delete student profile (soft delete)
   */
  async deleteStudent(id: string): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`/student/${id}`);
  }

  /**
   * Upload student ID photo
   */
  async uploadStudentIDPhoto(studentId: string, file: FormData): Promise<ApiResponse<any>> {
    return apiClient.postFormData<any>(`/student/${studentId}/upload-student-id`, file);
  }

  /**
   * Delete student ID photo
   */
  async deleteStudentIDPhoto(studentId: string): Promise<ApiResponse<Student>> {
    return apiClient.delete<Student>(`/student/${studentId}/delete-student-id`);
  }
}

export const studentService = new StudentService();
