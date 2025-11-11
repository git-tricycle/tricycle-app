import { useAuth } from '@/src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DriverLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      
      await login({
        email: email.trim(),
        password: password.trim(),
        role: 'driver'
      });
      
      // Navigation will be handled by the auth context
      router.replace('/(driver)/dashboard');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please check your credentials and try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('/(auth)/driver-register');
  };

  const handleBack = () => {
    router.back();
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password
    Alert.alert('Coming Soon', 'Password reset will be available soon');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center px-6 py-4">
            <TouchableOpacity onPress={handleBack} className="p-2">
              <Ionicons name="arrow-back" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="flex-1 px-6 pt-8">
            {/* Logo */}
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-black rounded-2xl items-center justify-center mb-6">
                <Ionicons name="car" size={40} color="white" />
              </View>
              
              <Text className="text-2xl font-bold text-black mb-2">
                Welcome Back 👋
              </Text>
              <Text className="text-gray-600 text-center">
                Please enter your details.
              </Text>
            </View>

            {/* Form */}
            <View className="space-y-4">
              {/* Login Field (Username/Email/Phone) */}
              <View>
                <Text className="text-black font-medium mb-2">Email Address</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email address"
                  className="bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-black"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password */}
              <View>
                <Text className="text-black font-medium mb-2">Password</Text>
                <View className="relative">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    className="bg-white border-2 border-gray-300 rounded-xl px-4 py-3 pr-12 text-black"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3"
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#6b7280" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember Me & Forgot Password */}
              <View className="flex-row items-center justify-between mt-5">
                <TouchableOpacity
                  onPress={() => setRememberMe(!rememberMe)}
                  className="flex-row items-center"
                >
                  <View className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
                    rememberMe ? 'bg-black border-black' : 'border-gray-300'
                  }`}>
                    {rememberMe && (
                      <Ionicons name="checkmark" size={12} color="white" />
                    )}
                  </View>
                  <Text className="text-black">Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text className="text-black font-medium">
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                className={`rounded-xl py-4 items-center mt-6 border-2 ${
                  isLoading ? 'bg-gray-400 border-gray-400' : 'bg-black border-black'
                }`}
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-lg">
                  {isLoading ? 'Logging in...' : 'Login'}
                </Text>
              </TouchableOpacity>

              {/* Register Link */}
              <View className="flex-row justify-center mt-6">
                <Text className="text-gray-600">Don't have an account? </Text>
                <TouchableOpacity onPress={handleRegister}>
                  <Text className="text-black font-semibold">Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Driver Info */}
            <View className="mt-12 p-4 bg-gray-100 rounded-xl">
              <View className="flex-row items-center mb-2">
                <Ionicons name="information-circle" size={20} color="#000000" />
                <Text className="text-black font-semibold ml-2">Driver Requirements</Text>
              </View>
              <Text className="text-gray-700 text-sm leading-5">
                • Valid driver's license{'\n'}
                • Tricycle registration documents{'\n'}
                • Valid government ID{'\n'}
                • Account verification required
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
