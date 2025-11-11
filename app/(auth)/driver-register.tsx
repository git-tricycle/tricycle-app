import FormInput from '@/src/components/ui/FormInput';
import FormStep from '@/src/components/ui/FormStep';
import { useAuth } from '@/src/contexts/AuthContext';
import { DriverRegistrationData } from '@/src/types/auth';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

type RegistrationStep = 'personal' | 'account' | 'emergency';

export default function DriverRegisterScreen() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<DriverRegistrationData>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof DriverRegistrationData, string>>>({});

  const { register } = useAuth();

  const steps: RegistrationStep[] = ['personal', 'account', 'emergency'];
  const currentStepIndex = steps.indexOf(currentStep) + 1;
  const totalSteps = steps.length;

  const updateFormData = (field: keyof DriverRegistrationData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: RegistrationStep): boolean => {
    const newErrors: Partial<Record<keyof DriverRegistrationData, string>> = {};

    switch (step) {
      case 'personal':
        if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email?.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.age || formData.age < 18) newErrors.age = 'Must be at least 18 years old';
        if (!formData.address?.trim()) newErrors.address = 'Address is required';
        if (!formData.contactNumber?.trim()) newErrors.contactNumber = 'Contact number is required';
        break;
      case 'account':
        if (!formData.username?.trim()) newErrors.username = 'Username is required';
        if (!formData.password?.trim()) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (!formData.confirmPassword?.trim()) newErrors.confirmPassword = 'Please confirm your password';
        else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        break;
      case 'emergency':
        // Emergency contact and terms are optional/handled separately
        if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the terms and conditions';
        if (!formData.acceptPrivacy) newErrors.acceptPrivacy = 'You must accept the privacy policy';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    const nextStepIndex = currentStepIndex;
    if (nextStepIndex < totalSteps) {
      setCurrentStep(steps[nextStepIndex]);
    }
  };

  const handleBack = () => {
    const prevStepIndex = currentStepIndex - 2;
    if (prevStepIndex >= 0) {
      setCurrentStep(steps[prevStepIndex]);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setIsLoading(true);
      await register(formData as DriverRegistrationData, 'driver');
      router.replace('/(driver)/dashboard');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPersonalInfo = () => (
    <View>
      <FormInput
        label="First Name"
        value={formData.firstName || ''}
        onChangeText={(value) => updateFormData('firstName', value)}
        placeholder="Enter your first name"
        error={errors.firstName}
        required
        leftIcon="person"
      />
      
      <FormInput
        label="Last Name"
        value={formData.lastName || ''}
        onChangeText={(value) => updateFormData('lastName', value)}
        placeholder="Enter your last name"
        error={errors.lastName}
        required
        leftIcon="person"
      />
      
      <FormInput
        label="Middle Name"
        value={formData.middleName || ''}
        onChangeText={(value) => updateFormData('middleName', value)}
        placeholder="Enter your middle name (optional)"
        leftIcon="person"
      />
      
      <FormInput
        label="Email Address"
        value={formData.email || ''}
        onChangeText={(value) => updateFormData('email', value)}
        placeholder="Enter your email address"
        error={errors.email}
        required
        leftIcon="mail"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <FormInput
        label="Age"
        value={formData.age?.toString() || ''}
        onChangeText={(value) => updateFormData('age', parseInt(value) || 0)}
        placeholder="Enter your age"
        error={errors.age}
        required
        leftIcon="calendar"
        keyboardType="numeric"
      />
      
      <FormInput
        label="Address"
        value={formData.address || ''}
        onChangeText={(value) => updateFormData('address', value)}
        placeholder="Enter your complete address"
        error={errors.address}
        required
        leftIcon="home"
        multiline
      />
      
      <FormInput
        label="Contact Number"
        value={formData.contactNumber || ''}
        onChangeText={(value) => updateFormData('contactNumber', value)}
        placeholder="Enter your contact number"
        error={errors.contactNumber}
        required
        leftIcon="call"
        keyboardType="phone-pad"
      />
    </View>
  );

  const renderAccountInfo = () => (
    <View>
      <FormInput
        label="Username"
        value={formData.username || ''}
        onChangeText={(value) => updateFormData('username', value)}
        placeholder="Choose a username"
        error={errors.username}
        required
        leftIcon="at"
        autoCapitalize="none"
      />
      
      <FormInput
        label="Password"
        value={formData.password || ''}
        onChangeText={(value) => updateFormData('password', value)}
        placeholder="Create a strong password"
        error={errors.password}
        required
        isPassword
        leftIcon="lock-closed"
      />
      
      <FormInput
        label="Confirm Password"
        value={formData.confirmPassword || ''}
        onChangeText={(value) => updateFormData('confirmPassword', value)}
        placeholder="Confirm your password"
        error={errors.confirmPassword}
        required
        isPassword
        leftIcon="lock-closed"
      />
    </View>
  );

  const renderEmergencyContact = () => (
    <View>
      <Text className="text-lg font-semibold text-gray-800 mb-4">Optional Information</Text>
      
      <FormInput
        label="License Photo (Optional)"
        value={formData.licensePhoto || ''}
        onChangeText={(value) => updateFormData('licensePhoto', value)}
        placeholder="License photo URL (optional)"
        leftIcon="card"
      />
      
      <FormInput
        label="Valid ID Photo (Optional)"
        value={formData.validIdPhoto || ''}
        onChangeText={(value) => updateFormData('validIdPhoto', value)}
        placeholder="Valid ID photo URL (optional)"
        leftIcon="id-card"
      />

      {/* Terms and Conditions */}
      <View className="mt-6">
        <TouchableOpacity
          onPress={() => updateFormData('acceptTerms', !formData.acceptTerms)}
          className="flex-row items-start mb-4"
        >
            <View className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
              formData.acceptTerms ? 'bg-black border-black' : 'border-gray-300'
            }`}>
            {formData.acceptTerms && (
              <Ionicons name="checkmark" size={14} color="white" />
            )}
          </View>
          <Text className="text-black flex-1">
            I accept the <Text className="text-black font-semibold">Terms and Conditions</Text>
          </Text>
        </TouchableOpacity>
        {errors.acceptTerms && (
          <Text className="text-red-500 text-sm mb-4">{errors.acceptTerms}</Text>
        )}

        <TouchableOpacity
          onPress={() => updateFormData('acceptPrivacy', !formData.acceptPrivacy)}
          className="flex-row items-start"
        >
            <View className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
              formData.acceptPrivacy ? 'bg-black border-black' : 'border-gray-300'
            }`}>
            {formData.acceptPrivacy && (
              <Ionicons name="checkmark" size={14} color="white" />
            )}
          </View>
          <Text className="text-black flex-1">
            I accept the <Text className="text-black font-semibold">Privacy Policy</Text>
          </Text>
        </TouchableOpacity>
        {errors.acceptPrivacy && (
          <Text className="text-red-500 text-sm mt-1">{errors.acceptPrivacy}</Text>
        )}
      </View>

      <View className="mt-8 p-4 bg-green-50 rounded-xl">
        <View className="flex-row items-center mb-2">
          <Ionicons name="checkmark-circle" size={20} color="#000000" />
          <Text className="text-black font-semibold ml-2">Almost Done!</Text>
        </View>
        <Text className="text-gray-700 text-sm leading-5">
          You're about to complete your driver registration. After submission, you can start using the app immediately.
        </Text>
      </View>
    </View>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 'personal': return renderPersonalInfo();
      case 'account': return renderAccountInfo();
      case 'emergency': return renderEmergencyContact();
      default: return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'personal': return 'Personal Information';
      case 'account': return 'Account Information';
      case 'emergency': return 'Final Details';
      default: return '';
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 'personal': return 'Tell us about yourself';
      case 'account': return 'Create your account credentials';
      case 'emergency': return 'Optional documents and agreements';
      default: return '';
    }
  };

  const isLastStep = currentStep === 'emergency';

  return (
    <FormStep
      title={getStepTitle()}
      subtitle={getStepSubtitle()}
      currentStep={currentStepIndex}
      totalSteps={totalSteps}
      onBack={handleBack}
      onNext={isLastStep ? handleSubmit : handleNext}
      nextButtonText={isLastStep ? 'Complete Registration' : 'Next'}
      isLoading={isLoading}
    >
      {getStepContent()}
    </FormStep>
  );
}