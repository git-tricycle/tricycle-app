export type UserRole = "passenger" | "driver" | "admin";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
}

export interface StudentRegistrationData {
  // Personal Information (for User model)
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  password: string;
  confirmPassword: string; // UI only, not sent to API

  // Student Profile Information
  studentId: string;
  dateOfBirth: string;
  course?: string;
  yearLevel?: string;
  schoolEmail?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  studentIdPhoto?: string;

  // UI/Validation only
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export interface DriverRegistrationData {
  // Personal Information (for User model)
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  password: string;
  confirmPassword: string; // UI only, not sent to API

  // Driver Profile Information
  username: string;
  address: string;
  age: number;
  contactNumber: string;
  licensePhoto?: string;
  validIdPhoto?: string;

  // Vehicle Information
  plateNumber: string;
  bodyNumber: string;
  vehiclePhoto?: string;
  orCrPhoto?: string;

  // UI/Validation only
  acceptTerms?: boolean;
  acceptPrivacy?: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (
    data: StudentRegistrationData | DriverRegistrationData,
    role: UserRole
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}
