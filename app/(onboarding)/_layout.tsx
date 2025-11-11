import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="slide1" />
      <Stack.Screen name="slide2" />
      <Stack.Screen name="slide3" />
      <Stack.Screen name="role-selection" />
    </Stack>
  );
}
