import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FormStepProps {
  title: string;
  subtitle?: string;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  nextButtonText?: string;
  isNextDisabled?: boolean;
  isLoading?: boolean;
  showSkip?: boolean;
  children: ReactNode;
}

export default function FormStep({
  title,
  subtitle,
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSkip,
  nextButtonText = 'Next',
  isNextDisabled = false,
  isLoading = false,
  showSkip = false,
  children,
}: FormStepProps) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        {onBack ? (
          <TouchableOpacity onPress={onBack} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
        
        {showSkip && onSkip && (
          <TouchableOpacity onPress={onSkip}>
            <Text className="text-gray-600 font-medium">Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Indicator */}
      <View className="px-6 mb-6">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm text-gray-600">
            Step {currentStep} of {totalSteps}
          </Text>
          <Text className="text-sm text-gray-600">
            {Math.round((currentStep / totalSteps) * 100)}%
          </Text>
        </View>
        <View className="w-full h-2 bg-gray-200 rounded-full">
          <View 
            className="h-2 bg-black rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-black mb-2">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-gray-600 leading-6">
              {subtitle}
            </Text>
          )}
        </View>

        {/* Content */}
        {children}
      </ScrollView>

      {/* Navigation */}
      {onNext && (
        <View className="px-6 pb-8 pt-4">
          <TouchableOpacity
            onPress={onNext}
            disabled={isNextDisabled || isLoading}
            className={`rounded-xl py-4 items-center border-2 ${
              isNextDisabled || isLoading 
                ? 'bg-gray-200 border-gray-300' 
                : 'bg-black border-black'
            }`}
            activeOpacity={0.8}
          >
            <Text className={`font-semibold text-lg ${
              isNextDisabled || isLoading ? 'text-gray-500' : 'text-white'
            }`}>
              {isLoading ? 'Processing...' : nextButtonText}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
