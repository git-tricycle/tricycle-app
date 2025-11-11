/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Black and White Palette
        primary: {
          50: '#f9fafb',   // Very light gray (almost white)
          100: '#f3f4f6',  // Light gray
          200: '#e5e7eb',  // Light gray
          300: '#d1d5db',  // Medium light gray
          400: '#9ca3af',  // Medium gray
          500: '#6b7280',  // Medium dark gray
          600: '#4b5563',  // Dark gray
          700: '#374151',  // Darker gray
          800: '#1f2937',  // Very dark gray
          900: '#111827',  // Almost black
          950: '#030712',  // Pure black
        },
        // Semantic colors using black/white/gray
        success: '#000000',    // Black for success
        error: '#374151',      // Dark gray for errors
        warning: '#6b7280',    // Medium gray for warnings
        info: '#9ca3af',       // Light gray for info
        
        // Background variations
        background: {
          primary: '#ffffff',   // White
          secondary: '#f9fafb', // Very light gray
          tertiary: '#f3f4f6',  // Light gray
        },
        
        // Text variations
        text: {
          primary: '#000000',   // Black
          secondary: '#374151', // Dark gray
          tertiary: '#6b7280',  // Medium gray
          muted: '#9ca3af',     // Light gray
        },
        
        // Border variations
        border: {
          primary: '#e5e7eb',   // Light gray
          secondary: '#d1d5db', // Medium light gray
          accent: '#000000',    // Black
        }
      }
    },
  },
  plugins: [],
}