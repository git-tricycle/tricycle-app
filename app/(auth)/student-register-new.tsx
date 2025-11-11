import FormInput from '@/src/components/ui/FormInput';
import FormStep from '@/src/components/ui/FormStep';
import { useAuth } from '@/src/contexts/AuthContext';
import { StudentRegistrationData } from '@/src/types/auth';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

type RegistrationStep = 'personal' | 'contact' | 'security' | 'verification';

export default function StudentRegisterScreen() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<StudentRegistrationData>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof StudentRegistrationData, string>>>({});

  const { register } = useAuth();

  const steps: RegistrationStep[] = ['personal', 'contact', 'security', 'verification'];
  const currentStepIndex = steps.indexOf(currentStep) + 1;
  const totalSteps = steps.length;

  const updateFormData = (field: keyof StudentRegistrationData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: RegistrationStep): boolean => {
    const newErrors: Partial<Record<keyof StudentRegistrationData, string>> = {};

    switch (step) {
      case 'personal':
        if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.studentId?.trim()) newErrors.studentId = 'Student ID is required';
        if (!formData.dateOfBirth?.trim()) newErrors.dateOfBirth = 'Date of birth is required';
        break;
      case 'contact':
        if (!formData.email?.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
        break;
      case 'security':
        if (!formData.password?.trim()) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (!formData.confirmPassword?.trim()) newErrors.confirmPassword = 'Please confirm your password';
        else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        break;
      case 'verification':
        // Emergency contact is optional in API
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
      await register(formData as StudentRegistrationData, 'passenger');
      router.replace('/(student)/dashboard');
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
        label="Student ID"
        value={formData.studentId || ''}
        onChangeText={(value) => updateFormData('studentId', value)}
        placeholder="Enter your student ID"
        error={errors.studentId}
        required
        leftIcon="school"
      />
      
      <FormInput
        label="Date of Birth"
        value={formData.dateOfBirth || ''}
        onChangeText={(value) => updateFormData('dateOfBirth', value)}
        placeholder="YYYY-MM-DD"
        error={errors.dateOfBirth}
        required
        leftIcon="calendar"
      />
    </View>
  );

  const renderContactInfo = () => (
    <View>
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
        label="Course"
        value={formData.course || ''}
        onChangeText={(value) => updateFormData('course', value)}
        placeholder="Enter your course (optional)"
        leftIcon="book"
      />
      
      <FormInput
        label="Year Level"
        value={formData.yearLevel || ''}
        onChangeText={(value) => updateFormData('yearLevel', value)}
        placeholder="Enter your year level (optional)"
        leftIcon="school"
      />
      
      <FormInput
        label="School Email"
        value={formData.schoolEmail || ''}
        onChangeText={(value) => updateFormData('schoolEmail', value)}
        placeholder="Enter your school email (optional)"
        leftIcon="mail"
        keyboardType="email-address"
        autoCapitalize="none"
      />
    </View>
  );

  const renderSecurity = () => (
    <View>
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

  const renderVerification = () => (
    <View>
      <FormInput
        label="Emergency Contact Name"
        value={formData.emergencyContactName || ''}
        onChangeText={(value) => updateFormData('emergencyContactName', value)}
        placeholder="Enter emergency contact name (optional)"
        leftIcon="person"
      />
      
      <FormInput
        label="Emergency Contact Number"
        value={formData.emergencyContactNumber || ''}
        onChangeText={(value) => updateFormData('emergencyContactNumber', value)}
        placeholder="Enter emergency contact number (optional)"
        leftIcon="call"
        keyboardType="phone-pad"
      />

      {/* Terms and Conditions */}
      <View className="mt-6">
        <TouchableOpacity
          onPress={() => updateFormData('acceptTerms', !formData.acceptTerms)}
          className="flex-row items-start mb-4"
        >
          <View className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
            formData.acceptTerms ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
          }`}>
            {formData.acceptTerms && (
              <Ionicons name="checkmark" size={12} color="white" />
            )}
          </View>
          <Text className="text-gray-700 flex-1">
            I accept the <Text className="text-indigo-600">Terms and Conditions</Text>
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
            formData.acceptPrivacy ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
          }`}>
            {formData.acceptPrivacy && (
              <Ionicons name="checkmark" size={12} color="white" />
            )}
          </View>
          <Text className="text-gray-700 flex-1">
            I accept the <Text className="text-indigo-600">Privacy Policy</Text>
          </Text>
        </TouchableOpacity>
        {errors.acceptPrivacy && (
          <Text className="text-red-500 text-sm mt-1">{errors.acceptPrivacy}</Text>
        )}
      </View>
    </View>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 'personal': return renderPersonalInfo();
      case 'contact': return renderContactInfo();
      case 'security': return renderSecurity();
      case 'verification': return renderVerification();
      default: return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'personal': return 'Personal Information';
      case 'contact': return 'Contact & Academic Info';
      case 'security': return 'Account Security';
      case 'verification': return 'Emergency Contact & Terms';
      default: return '';
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 'personal': return 'Tell us about yourself';
      case 'contact': return 'Your contact and academic details';
      case 'security': return 'Secure your account';
      case 'verification': return 'Emergency contact and agreements';
      default: return '';
    }
  };

  const isLastStep = currentStep === 'verification';

  return (
    <FormStep
      title={getStepTitle()}
      subtitle={getStepSubtitle()}
      currentStep={currentStepIndex}
      totalSteps={totalSteps}
      onBack={handleBack}
      onNext={isLastStep ? handleSubmit : handleNext}
      nextButtonText={isLastStep ? 'Create Account' : 'Next'}
      isLoading={isLoading}
    >
      {getStepContent()}
    </FormStep>
  );
}
