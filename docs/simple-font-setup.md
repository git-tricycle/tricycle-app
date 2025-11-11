# Simple Font Setup Guide

## Current Setup: System Fonts

Your app now uses clean, modern system fonts that provide excellent readability:

- **iOS**: San Francisco (System font)
- **Android**: Roboto
- **Web**: System UI fonts

## Font Classes Available

### Tailwind Classes
```jsx
// Default system font (clean and modern)
<Text className="font-sans">Default text</Text>

// Explicit system font
<Text className="font-system">System font</Text>

// Roboto (Android-style)
<Text className="font-roboto">Roboto font</Text>
```

### Font Weights
```jsx
// Light
<Text className="font-light">Light text</Text>

// Normal/Regular
<Text className="font-normal">Normal text</Text>

// Medium
<Text className="font-medium">Medium text</Text>

// Semi-bold
<Text className="font-semibold">Semi-bold text</Text>

// Bold
<Text className="font-bold">Bold text</Text>
```

## Typography Hierarchy

### Recommended Usage
```jsx
// Headers
<Text className="text-2xl font-bold text-black">Main Heading</Text>

// Subheadings
<Text className="text-lg font-semibold text-gray-700">Subheading</Text>

// Body text
<Text className="text-base font-normal text-gray-600">Body text</Text>

// Buttons
<Text className="font-medium text-white">Button Text</Text>

// Captions
<Text className="text-sm font-light text-gray-500">Caption</Text>
```

## Adding Custom Fonts Later (Optional)

If you want to add Poppins or other custom fonts later:

### Step 1: Add Font Files
1. Download font files (e.g., Poppins-Regular.ttf)
2. Place in `assets/fonts/` directory

### Step 2: Load Fonts
```typescript
// In app/_layout.tsx
import { useFonts } from 'expo-font';

const [fontsLoaded] = useFonts({
  'Poppins-Regular': require('@/assets/fonts/Poppins-Regular.ttf'),
  'Poppins-Bold': require('@/assets/fonts/Poppins-Bold.ttf'),
});
```

### Step 3: Update Theme
```typescript
// In src/constants/theme.ts
export const FontFamily = {
  regular: 'Poppins-Regular',
  bold: 'Poppins-Bold',
} as const;
```

### Step 4: Update Tailwind
```javascript
// In tailwind.config.js
fontFamily: {
  'sans': ['Poppins-Regular', 'system-ui', 'sans-serif'],
  'poppins': ['Poppins-Regular'],
}
```

## Benefits of Current System Font Setup

✅ **No Loading Time**: Fonts are instantly available  
✅ **Platform Native**: Looks natural on each platform  
✅ **Excellent Readability**: Optimized for each device  
✅ **No Bundle Size**: Doesn't increase app size  
✅ **Consistent**: Works reliably across all devices  
✅ **Accessible**: Respects user's accessibility settings  

## Font Comparison

| Aspect | System Fonts | Custom Fonts (Poppins) |
|--------|--------------|-------------------------|
| Loading | Instant | Requires loading |
| Bundle Size | No impact | Increases size |
| Platform Feel | Native | Consistent brand |
| Reliability | 100% | Depends on loading |
| Customization | Limited | Full control |

Your current setup provides excellent typography that's clean, modern, and reliable! 🎉
