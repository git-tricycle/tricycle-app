# Tricycle Booking App

A React Native Expo application for booking tricycle rides, designed for both students and drivers.

## 🚀 Features

### For Students
- **Onboarding Flow**: Welcome slides introducing the app
- **Registration**: Multi-step form with personal, contact, address, security, and verification steps
- **Login**: Secure authentication with Student ID and password
- **Dashboard**: Quick access to booking, history, and profile
- **Ride Booking**: Find and book available tricycles
- **Ride History**: View past trips and details
- **Safety Features**: SOS button, trip sharing, emergency contacts

### For Drivers
- **Registration**: Comprehensive driver verification with document uploads
- **Login**: Authentication with username/email/phone and password
- **Dashboard**: Earnings summary, availability toggle, ride statistics
- **Ride Management**: Accept/decline ride requests
- **Earnings Tracking**: View daily/weekly income and payment history
- **Profile Management**: Update vehicle and personal information

## 📁 Project Structure

```
tricycle-app/
├── app/                          # Expo Router screens
│   ├── (onboarding)/            # Welcome slides and role selection
│   │   ├── welcome.tsx          # App introduction
│   │   ├── slide1.tsx           # Feature showcase 1
│   │   ├── slide2.tsx           # Feature showcase 2
│   │   ├── slide3.tsx           # Feature showcase 3
│   │   └── role-selection.tsx   # Student/Driver selection
│   ├── (auth)/                  # Authentication screens
│   │   ├── student-login.tsx    # Student login form
│   │   ├── student-register.tsx # Multi-step student registration
│   │   ├── driver-login.tsx     # Driver login form
│   │   └── driver-register.tsx  # Multi-step driver registration
│   ├── (student)/               # Student app screens
│   │   ├── dashboard.tsx        # Student home screen
│   │   ├── book-ride.tsx        # Ride booking interface
│   │   ├── ride-history.tsx     # Past rides
│   │   └── profile.tsx          # Student profile
│   ├── (driver)/                # Driver app screens
│   │   ├── dashboard.tsx        # Driver home screen
│   │   ├── ride-requests.tsx    # Incoming ride requests
│   │   ├── earnings.tsx         # Financial reports
│   │   └── profile.tsx          # Driver profile
│   ├── (tabs)/                  # Legacy tab structure (can be removed)
│   ├── _layout.tsx              # Root layout with auth provider
│   └── index.tsx                # App entry point
├── src/                         # Source code organization
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # Base UI components
│   │   │   ├── FormStep.tsx     # Multi-step form wrapper
│   │   │   ├── FormInput.tsx    # Styled input component
│   │   │   └── ...              # Other UI components
│   │   └── ...                  # Feature-specific components
│   ├── contexts/                # React contexts
│   │   └── AuthContext.tsx      # Authentication state management
│   ├── hooks/                   # Custom React hooks
│   ├── types/                   # TypeScript type definitions
│   │   ├── auth.ts              # Authentication types
│   │   ├── navigation.ts        # Navigation types
│   │   └── index.ts             # Type exports
│   ├── constants/               # App constants and themes
│   └── utils/                   # Utility functions
├── services/                    # API service layer
│   ├── auth.service.ts          # Authentication API
│   ├── student.service.ts       # Student-specific API
│   ├── driver.service.ts        # Driver-specific API
│   ├── ride.service.ts          # Ride management API
│   └── ...                      # Other services
└── assets/                      # Static assets (images, fonts)
```

## 🛠 Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: React Context API
- **Type Safety**: TypeScript
- **Authentication**: Custom auth service with JWT tokens
- **Image Handling**: Expo Image Picker
- **Document Handling**: Expo Document Picker

## 🚦 App Flow

### 1. Onboarding
- Welcome screen with app introduction
- Three feature showcase slides
- Role selection (Student or Driver)

### 2. Authentication
**Student Path:**
- Login with Student ID and password
- Multi-step registration:
  1. Personal Information (name, student ID, DOB)
  2. Contact Information (phone, email)
  3. Address Information (province, municipality, barangay, street)
  4. Account Security (username, password, profile picture)
  5. Verification & Safety (student ID upload, emergency contact, terms)

**Driver Path:**
- Login with username/email/phone and password
- Multi-step registration:
  1. Personal Information (name, age, address, contact)
  2. Account Information (username, password)
  3. Tricycle Information (plate number, body number, vehicle photo, OR/CR)
  4. Verification Documents (driver's license, valid ID)
  5. Emergency Contact (optional)

### 3. Main App
**Student Features:**
- Dashboard with quick ride booking
- Map-based ride booking interface
- Real-time ride tracking
- Ride history and receipts
- Profile management
- Safety features (SOS, trip sharing)

**Driver Features:**
- Dashboard with availability toggle
- Earnings summary and statistics
- Ride request management
- Navigation and route optimization
- Profile and vehicle management
- Performance tracking

## 🔧 Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Run on Device/Simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## 📱 Key Features Implementation

### Authentication Flow
- JWT token-based authentication
- Persistent login state with AsyncStorage
- Role-based navigation (Student/Driver)
- Secure password handling

### Multi-Step Forms
- Progress indicators
- Form validation
- Step navigation
- Data persistence across steps

### File Uploads
- Image picker for photos
- Document picker for verification files
- File validation and compression

### Responsive Design
- Mobile-first approach
- Consistent spacing and typography
- Dark/light theme support
- Accessibility considerations

## 🔐 Security Features

- Input validation and sanitization
- Secure token storage
- Document verification workflow
- Emergency contact system
- Real-time location sharing
- Driver background verification

## 🚧 Future Enhancements

- Real-time chat between students and drivers
- Push notifications for ride updates
- Payment integration (GCash, cash)
- Advanced map features and route optimization
- Rating and review system
- Admin dashboard for management
- Analytics and reporting

## 📄 License

This project is licensed under the MIT License.