import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import { authService } from '../../services/auth.service';
import { AuthContextType, AuthState, DriverRegistrationData, LoginCredentials, StudentRegistrationData, UserRole } from '../types/auth';

// Initial state
const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  token: null,
};

// Action types
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: any; token: string } }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_TOKEN'; payload: string };

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'CLEAR_USER':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on app start
  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        const token = await authService.getToken();
        if (token) {
          dispatch({ type: 'SET_TOKEN', payload: token });
          // You might want to fetch user data here
          // const userData = await authService.getCurrentUser();
          // dispatch({ type: 'SET_USER', payload: { user: userData, token } });
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      dispatch({ type: 'CLEAR_USER' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Login function
  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        dispatch({
          type: 'SET_USER',
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  // Register function
  const register = async (data: StudentRegistrationData | DriverRegistrationData, role: UserRole) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Transform data to match API structure
      let registerData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        email: data.email,
        password: data.password,
        role: role, // Use role directly
      };

      // Add profile data based on role
      if (role === 'passenger') {
        const studentData = data as StudentRegistrationData;
        registerData.studentProfile = {
          studentId: studentData.studentId,
          dateOfBirth: studentData.dateOfBirth,
          course: studentData.course,
          yearLevel: studentData.yearLevel,
          schoolEmail: studentData.schoolEmail,
          emergencyContactName: studentData.emergencyContactName,
          emergencyContactNumber: studentData.emergencyContactNumber,
          studentIdPhoto: studentData.studentIdPhoto,
        };
      } else if (role === 'driver') {
        const driverData = data as DriverRegistrationData;
        registerData.driverProfile = {
          username: driverData.username,
          address: driverData.address,
          age: driverData.age,
          contactNumber: driverData.contactNumber,
          licensePhoto: driverData.licensePhoto,
          validIdPhoto: driverData.validIdPhoto,
        };
      }

      const response = await authService.register(registerData);
      
      if (response.success && response.data) {
        dispatch({
          type: 'SET_USER',
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: 'CLEAR_USER' });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user data even if logout request fails
      dispatch({ type: 'CLEAR_USER' });
    }
  };

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
