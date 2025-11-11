import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
  required?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
}

export default function FormInput({
  label,
  error,
  isPassword = false,
  required = false,
  leftIcon,
  ...props
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="mb-4">
      <Text className="text-black font-medium mb-2">
        {label}
        {required && <Text className="text-gray-700"> *</Text>}
      </Text>
      
      <View className="relative">
        {leftIcon && (
          <View className="absolute left-4 top-3 z-10">
            <Ionicons name={leftIcon} size={20} color="#6b7280" />
          </View>
        )}
        
        <TextInput
          {...props}
          secureTextEntry={isPassword && !showPassword}
          className={`bg-white border-2 rounded-xl px-4 py-3 text-black ${
            leftIcon ? 'pl-12' : ''
          } ${isPassword ? 'pr-12' : ''} ${
            error ? 'border-gray-700' : 'border-gray-300'
          }`}
          placeholderTextColor="#9ca3af"
        />
        
        {isPassword && (
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
        )}
      </View>
      
      {error && (
        <Text className="text-gray-700 text-sm mt-1">{error}</Text>
      )}
    </View>
  );
}
