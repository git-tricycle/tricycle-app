import FormInput from "@/src/components/ui/FormInput";
import FormStep from "@/src/components/ui/FormStep";
import { useAuth } from "@/src/contexts/AuthContext";
import { DriverRegistrationData } from "@/src/types/auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

type RegistrationStep = "personal" | "account" | "vehicle" | "emergency";

export default function DriverRegisterScreen() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("personal");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<DriverRegistrationData>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof DriverRegistrationData, string>>>({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"terms" | "privacy" | "data">("terms");

  const { register } = useAuth();

  const steps: RegistrationStep[] = ["personal", "account", "vehicle", "emergency"];
  const currentStepIndex = steps.indexOf(currentStep) + 1;
  const totalSteps = steps.length;

  const updateFormData = (
    field: keyof DriverRegistrationData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: RegistrationStep): boolean => {
    const newErrors: Partial<Record<keyof DriverRegistrationData, string>> = {};

    switch (step) {
      case "personal":
        if (!formData.firstName?.trim()) newErrors.firstName = "First name is required";
        if (!formData.lastName?.trim()) newErrors.lastName = "Last name is required";
        if (!formData.email?.trim()) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
        if (!formData.age || formData.age < 18) newErrors.age = "Must be at least 18 years old";
        if (!formData.address?.trim()) newErrors.address = "Address is required";
        if (!formData.contactNumber?.trim()) newErrors.contactNumber = "Contact number is required";
        break;
      case "account":
        if (!formData.username?.trim()) newErrors.username = "Username is required";
        if (!formData.password?.trim()) newErrors.password = "Password is required";
        else if (formData.password.length < 8)
          newErrors.password = "Password must be at least 8 characters";
        if (!formData.confirmPassword?.trim())
          newErrors.confirmPassword = "Please confirm your password";
        else if (formData.password !== formData.confirmPassword)
          newErrors.confirmPassword = "Passwords do not match";
        break;
      case "vehicle":
        if (!formData.plateNumber?.trim()) newErrors.plateNumber = "Plate number is required";
        if (!formData.bodyNumber?.trim()) newErrors.bodyNumber = "Body number is required";
        break;
      case "emergency":
        // Terms are required
        if (!formData.acceptTerms)
          newErrors.acceptTerms = "You must accept the terms and conditions";
        if (!formData.acceptPrivacy) newErrors.acceptPrivacy = "You must accept the privacy policy";
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

      // Create registration data
      const registrationData: DriverRegistrationData = {
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        middleName: formData.middleName,
        email: formData.email || "",
        password: formData.password || "",
        confirmPassword: formData.confirmPassword || "",
        username: formData.username || "",
        address: formData.address || "",
        age: formData.age || 0,
        contactNumber: formData.contactNumber || "",
        plateNumber: formData.plateNumber || "",
        bodyNumber: formData.bodyNumber || "",
        acceptTerms: formData.acceptTerms,
        acceptPrivacy: formData.acceptPrivacy,
      };

      // Register user and driver profile
      await register(registrationData, "driver");

      // Show success message and navigate to dashboard
      Alert.alert("Registration Successful", "Your account was created successfully!", [
        { text: "OK", onPress: () => router.replace("/(driver)/dashboard") },
      ]);
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const renderPersonalInfo = () => (
    <View>
      <FormInput
        label="First Name"
        value={formData.firstName || ""}
        onChangeText={(value) => updateFormData("firstName", value)}
        placeholder="Enter your first name"
        error={errors.firstName}
        required
        leftIcon="person"
      />

      <FormInput
        label="Last Name"
        value={formData.lastName || ""}
        onChangeText={(value) => updateFormData("lastName", value)}
        placeholder="Enter your last name"
        error={errors.lastName}
        required
        leftIcon="person"
      />

      <FormInput
        label="Middle Name"
        value={formData.middleName || ""}
        onChangeText={(value) => updateFormData("middleName", value)}
        placeholder="Enter your middle name (optional)"
        leftIcon="person"
      />

      <FormInput
        label="Email Address"
        value={formData.email || ""}
        onChangeText={(value) => updateFormData("email", value)}
        placeholder="Enter your email address"
        error={errors.email}
        required
        leftIcon="mail"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <FormInput
        label="Age"
        value={formData.age?.toString() || ""}
        onChangeText={(value) => updateFormData("age", parseInt(value) || 0)}
        placeholder="Enter your age"
        error={errors.age}
        required
        leftIcon="calendar"
        keyboardType="numeric"
      />

      <FormInput
        label="Address"
        value={formData.address || ""}
        onChangeText={(value) => updateFormData("address", value)}
        placeholder="Enter your complete address"
        error={errors.address}
        required
        leftIcon="home"
        multiline
      />

      <FormInput
        label="Contact Number"
        value={formData.contactNumber || ""}
        onChangeText={(value) => updateFormData("contactNumber", value)}
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
        value={formData.username || ""}
        onChangeText={(value) => updateFormData("username", value)}
        placeholder="Choose a username"
        error={errors.username}
        required
        leftIcon="at"
        autoCapitalize="none"
      />

      <FormInput
        label="Password"
        value={formData.password || ""}
        onChangeText={(value) => updateFormData("password", value)}
        placeholder="Create a strong password"
        error={errors.password}
        required
        isPassword
        leftIcon="lock-closed"
      />

      <FormInput
        label="Confirm Password"
        value={formData.confirmPassword || ""}
        onChangeText={(value) => updateFormData("confirmPassword", value)}
        placeholder="Confirm your password"
        error={errors.confirmPassword}
        required
        isPassword
        leftIcon="lock-closed"
      />
    </View>
  );

  const renderVehicleInfo = () => (
    <View>
      <FormInput
        label="Plate Number"
        value={formData.plateNumber || ""}
        onChangeText={(value) => updateFormData("plateNumber", value)}
        placeholder="Enter your tricycle's plate number"
        error={errors.plateNumber}
        required
        leftIcon="car"
        autoCapitalize="characters"
      />

      <FormInput
        label="Body Number"
        value={formData.bodyNumber || ""}
        onChangeText={(value) => updateFormData("bodyNumber", value)}
        placeholder="Enter your tricycle's body number"
        error={errors.bodyNumber}
        required
        leftIcon="receipt"
        autoCapitalize="characters"
      />

      <View className="mt-6 p-4 bg-blue-50 rounded-xl">
        <View className="flex-row items-center mb-2">
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text className="text-blue-700 font-semibold ml-2">Vehicle Information</Text>
        </View>
        <Text className="text-blue-600 text-sm leading-5">
          Please provide accurate vehicle information. This will be used for ride identification and
          verification purposes.
        </Text>
      </View>
    </View>
  );

  const renderEmergencyContact = () => (
    <View>
      {/* Terms and Conditions */}
      <View className="mt-0">
        <TouchableOpacity
          onPress={() => {
            setShowTermsModal(true);
            setActiveTab("terms");
          }}
          className="flex-row items-start mb-4"
        >
          <View
            className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
              formData.acceptTerms ? "bg-black border-black" : "border-gray-300"
            }`}
          >
            {formData.acceptTerms && <Ionicons name="checkmark" size={14} color="white" />}
          </View>
          <Text className="text-black flex-1">
            I accept the <Text className="text-black font-semibold">Terms and Conditions</Text>
          </Text>
        </TouchableOpacity>
        {errors.acceptTerms && (
          <Text className="text-red-500 text-sm mb-4">{errors.acceptTerms}</Text>
        )}

        <TouchableOpacity
          onPress={() => {
            setShowTermsModal(true);
            setActiveTab("privacy");
          }}
          className="flex-row items-start"
        >
          <View
            className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
              formData.acceptPrivacy ? "bg-black border-black" : "border-gray-300"
            }`}
          >
            {formData.acceptPrivacy && <Ionicons name="checkmark" size={14} color="white" />}
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
          <Text className="text-black font-semibold ml-2">Ready to Start!</Text>
        </View>
        <Text className="text-gray-700 text-sm leading-5">
          You&apos;re about to complete your driver registration. After submission, you can start
          using the app immediately.
        </Text>
      </View>
    </View>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case "personal":
        return renderPersonalInfo();
      case "account":
        return renderAccountInfo();
      case "vehicle":
        return renderVehicleInfo();
      case "emergency":
        return renderEmergencyContact();
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "personal":
        return "Personal Information";
      case "account":
        return "Account Information";
      case "vehicle":
        return "Vehicle Information";
      case "emergency":
        return "Review & Agree";
      default:
        return "";
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case "personal":
        return "Tell us about yourself";
      case "account":
        return "Create your account credentials";
      case "vehicle":
        return "Register your tricycle";
      case "emergency":
        return "Accept terms and conditions";
      default:
        return "";
    }
  };

  const isLastStep = currentStep === "emergency";
  const isRegisterDisabled = isLastStep && (!formData.acceptTerms || !formData.acceptPrivacy);

  const renderTermsContent = () => (
    <View>
      <Text className="text-lg font-bold text-black mb-4">Tricycle App Terms and Conditions</Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        Welcome to Tricycle App. By using our service, you agree to comply with these terms and
        conditions.
      </Text>

      <Text className="text-black font-semibold text-base mb-2">1. User Responsibilities</Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        As a driver, you are responsible for maintaining your vehicle in safe operating condition,
        following all traffic laws, and treating passengers with respect and professionalism.
      </Text>

      <Text className="text-black font-semibold text-base mb-2">2. Service Usage</Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        You agree to use Tricycle App only for lawful purposes and in a way that does not infringe
        upon the rights of others or restrict their use and enjoyment of the app.
      </Text>

      <Text className="text-black font-semibold text-base mb-2">3. Account Security</Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        You are responsible for keeping your password confidential. You agree not to disclose your
        password to any third party and to take sole responsibility for any activities that occur
        under your account.
      </Text>

      <Text className="text-black font-semibold text-base mb-2">4. Limitation of Liability</Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        Tricycle App is provided on an &quot;as is&quot; basis. We are not liable for any damages or
        losses arising from your use of the app or the services provided through it.
      </Text>

      <Text className="text-black font-semibold text-base mb-2">5. Modifications</Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        We reserve the right to modify these terms and conditions at any time. Continued use of the
        app following any changes constitutes your acceptance of those changes.
      </Text>

      <TouchableOpacity
        onPress={() => {
          updateFormData("acceptTerms", true);
          setShowTermsModal(false);
        }}
        className="bg-black rounded-lg py-3 mt-6 flex-row items-center justify-center"
      >
        <Ionicons name="checkmark" size={20} color="white" />
        <Text className="text-white font-semibold ml-2">I Accept Terms</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPrivacyContent = () => (
    <View>
      <Text className="text-lg font-bold text-black mb-4">Privacy Policy</Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        Tricycle App is committed to protecting your privacy and ensuring you have a positive
        experience on our platform.
      </Text>

      <Text className="text-black font-semibold text-base mb-2">1. Information We Collect</Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        We collect information necessary to provide our service, including your name, email, phone
        number, vehicle information, and location data during rides.
      </Text>

      <Text className="text-black font-semibold text-base mb-2">
        2. How We Use Your Information
      </Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        Your information is used to facilitate rides, process payments, improve our service, ensure
        safety and security, and comply with legal obligations.
      </Text>

      <Text className="text-black font-semibold text-base mb-2">3. Data Security</Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        We implement industry-standard security measures to protect your personal information from
        unauthorized access, alteration, disclosure, or destruction.
      </Text>

      <Text className="text-black font-semibold text-base mb-2">4. Third-Party Sharing</Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        We do not sell or share your personal information with third parties without your consent,
        except as required by law or to provide essential services.
      </Text>

      <Text className="text-black font-semibold text-base mb-2">5. Your Rights</Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        You have the right to access, modify, or request deletion of your personal data by
        contacting our support team.
      </Text>

      <TouchableOpacity
        onPress={() => {
          updateFormData("acceptPrivacy", true);
          setShowTermsModal(false);
        }}
        className="bg-black rounded-lg py-3 mt-6 flex-row items-center justify-center"
      >
        <Ionicons name="checkmark" size={20} color="white" />
        <Text className="text-white font-semibold ml-2">I Accept Privacy Policy</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDataInfoContent = () => (
    <View>
      <Text className="text-lg font-bold text-black mb-4">Data Information & Safety</Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        Understanding how your data is used and protected is important to us. Here&apos;s detailed
        information about our practices.
      </Text>

      <Text className="text-black font-semibold text-base mb-2">Personal Data Collected</Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        • Full name and contact information{"\n"}• Email address{"\n"}• Phone number{"\n"}• Address
        and location data{"\n"}• Vehicle information (plate number, body number){"\n"}• Driving
        license details{"\n"}• Payment information (securely stored)
      </Text>

      <Text className="text-black font-semibold text-base mb-2">Location Data</Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        We collect your location data during rides to track routes, provide navigation, ensure
        safety, and enable the service. You can control location permissions through your device
        settings.
      </Text>

      <Text className="text-black font-semibold text-base mb-2">Data Retention</Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        We retain your data for as long as needed to provide our services and comply with legal
        obligations. You can request data deletion at any time, subject to legal requirements.
      </Text>

      <Text className="text-black font-semibold text-base mb-2">Data Protection Measures</Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        • End-to-end encryption for sensitive data{"\n"}• Secure HTTPS connections{"\n"}• Regular
        security audits{"\n"}• Limited employee access to personal data{"\n"}• Compliance with data
        protection regulations
      </Text>

      <Text className="text-black font-semibold text-base mb-2">Contact Us</Text>
      <Text className="text-gray-700 text-sm leading-6 mb-4">
        For questions about your data or privacy concerns, contact our support team at
        support@tricycleapp.com
      </Text>

      <TouchableOpacity
        onPress={() => setShowTermsModal(false)}
        className="bg-gray-300 rounded-lg py-3 mt-6"
      >
        <Text className="text-black font-semibold text-center">Close</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <FormStep
        title={getStepTitle()}
        subtitle={getStepSubtitle()}
        currentStep={currentStepIndex}
        totalSteps={totalSteps}
        onBack={handleBack}
        onNext={isLastStep ? handleSubmit : handleNext}
        nextButtonText={isLastStep ? "Register" : "Next"}
        isLoading={isLoading}
        isNextDisabled={isRegisterDisabled}
      >
        {getStepContent()}
      </FormStep>

      {/* Terms and Conditions Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View className="flex-1 bg-white">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200 bg-white">
            <Text className="text-lg font-bold text-black">Information</Text>
            <TouchableOpacity onPress={() => setShowTermsModal(false)}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row border-b border-gray-200">
            <TouchableOpacity
              onPress={() => setActiveTab("terms")}
              className={`flex-1 py-3 px-4 border-b-2 ${
                activeTab === "terms" ? "border-black" : "border-transparent"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "terms" ? "text-black" : "text-gray-500"
                }`}
              >
                Terms
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("privacy")}
              className={`flex-1 py-3 px-4 border-b-2 ${
                activeTab === "privacy" ? "border-black" : "border-transparent"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "privacy" ? "text-black" : "text-gray-500"
                }`}
              >
                Privacy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("data")}
              className={`flex-1 py-3 px-4 border-b-2 ${
                activeTab === "data" ? "border-black" : "border-transparent"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "data" ? "text-black" : "text-gray-500"
                }`}
              >
                Data Info
              </Text>
            </TouchableOpacity>
          </View>

          {/* Modal Content */}
          <ScrollView className="flex-1 px-4 py-6">
            {activeTab === "terms" && renderTermsContent()}
            {activeTab === "privacy" && renderPrivacyContent()}
            {activeTab === "data" && renderDataInfoContent()}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
