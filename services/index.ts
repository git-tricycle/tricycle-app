// Export all services and types for easy importing
export { apiClient, type ApiResponse, type PaginationParams, type SearchParams } from './api.client';

export { authService, type LoginCredentials, type RegisterData, type AuthUser, type AuthResponse, type StudentProfileData, type DriverProfileData } from './auth.service';

export { userService, type User, type CreateUserRequest, type UpdateUserRequest, type UserFilters } from './user.service';

export { studentService, type Student, type CreateStudentRequest, type UpdateStudentRequest, type StudentFilters } from './student.service';

export { driverService, type Driver, type CreateDriverRequest, type UpdateDriverRequest, type DriverFilters } from './driver.service';

export { rideService, type Ride, type CreateRideRequest, type UpdateRideRequest, type RideFilters } from './ride.service';

export { locationService, type Location, type CreateLocationRequest, type UpdateLocationRequest, type LocationFilters } from './location.service';

export { paymentService, type Payment, type CreatePaymentRequest, type UpdatePaymentRequest, type PaymentFilters } from './payment.service';

export { ratingService, type Rating, type CreateRatingRequest, type UpdateRatingRequest, type RatingFilters } from './rating.service';

export { vehicleService, type Vehicle, type CreateVehicleRequest, type UpdateVehicleRequest, type VehicleFilters } from './vehicle.service';

// Import services to create services object
import { authService } from './auth.service';
import { userService } from './user.service';
import { studentService } from './student.service';
import { driverService } from './driver.service';
import { rideService } from './ride.service';
import { locationService } from './location.service';
import { paymentService } from './payment.service';
import { ratingService } from './rating.service';
import { vehicleService } from './vehicle.service';

// Create a services object for easier access
export const services = {
  auth: authService,
  user: userService,
  student: studentService,
  driver: driverService,
  ride: rideService,
  location: locationService,
  payment: paymentService,
  rating: ratingService,
  vehicle: vehicleService,
};

export default services;