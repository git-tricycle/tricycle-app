export type RootStackParamList = {
  '(onboarding)': undefined;
  '(auth)': undefined;
  '(tabs)': undefined;
  '(student)': undefined;
  '(driver)': undefined;
  modal: undefined;
};

export type OnboardingStackParamList = {
  welcome: undefined;
  slide1: undefined;
  slide2: undefined;
  slide3: undefined;
  'role-selection': undefined;
};

export type AuthStackParamList = {
  'student-login': undefined;
  'student-register': undefined;
  'driver-login': undefined;
  'driver-register': undefined;
};

export type StudentStackParamList = {
  dashboard: undefined;
  'book-ride': undefined;
  'ride-history': undefined;
  profile: undefined;
  settings: undefined;
};

export type DriverStackParamList = {
  dashboard: undefined;
  'ride-requests': undefined;
  earnings: undefined;
  profile: undefined;
  settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {
      // This interface extends RootStackParamList for type safety
    }
  }
}
