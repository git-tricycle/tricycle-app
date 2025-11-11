# Poppins Font Setup Guide

This guide explains how to set up Poppins fonts in your Tricycle app.

## Option 1: Local Font Files (Recommended)

### Step 1: Download Poppins Fonts
1. Go to [Google Fonts - Poppins](https://fonts.google.com/specimen/Poppins)
2. Click "Download family" to get the font files
3. Extract the ZIP file and locate these font files:
   - `Poppins-Light.ttf`
   - `Poppins-Regular.ttf`
   - `Poppins-Medium.ttf`
   - `Poppins-SemiBold.ttf`
   - `Poppins-Bold.ttf`

### Step 2: Add Font Files to Your Project
1. Copy the font files to: `tricycle-app/assets/fonts/`
2. Make sure the file names match exactly what's in the code

### Step 3: Font Files Structure
```
tricycle-app/
├── assets/
│   └── fonts/
│       ├── Poppins-Light.ttf
│       ├── Poppins-Regular.ttf
│       ├── Poppins-Medium.ttf
│       ├── Poppins-SemiBold.ttf
│       └── Poppins-Bold.ttf
```

## Option 2: Google Fonts (Alternative)

If you prefer to use Google Fonts directly, install the package:

```bash
npm install @expo-google-fonts/poppins
```

Then update `app/_layout.tsx`:

```typescript
import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts
} from '@expo-google-fonts/poppins';

// In your component:
const [fontsLoaded] = useFonts({
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
});
```

## Using Poppins in Your Components

### With Tailwind Classes
```jsx
// Default (Poppins Regular)
<Text className="font-sans">Regular text</Text>

// Specific weights
<Text className="font-poppins-light">Light text</Text>
<Text className="font-poppins">Regular text</Text>
<Text className="font-poppins-medium">Medium text</Text>
<Text className="font-poppins-semibold">Semi-bold text</Text>
<Text className="font-poppins-bold">Bold text</Text>
```

### With Style Objects
```jsx
import { FontFamily } from '@/src/constants/theme';

<Text style={{ fontFamily: FontFamily.regular }}>Regular text</Text>
<Text style={{ fontFamily: FontFamily.medium }}>Medium text</Text>
<Text style={{ fontFamily: FontFamily.semiBold }}>Semi-bold text</Text>
<Text style={{ fontFamily: FontFamily.bold }}>Bold text</Text>
```

## Available Font Weights

| Weight | Font File | Tailwind Class | Constant |
|--------|-----------|----------------|----------|
| Light (300) | Poppins-Light.ttf | `font-poppins-light` | `FontFamily.light` |
| Regular (400) | Poppins-Regular.ttf | `font-poppins` | `FontFamily.regular` |
| Medium (500) | Poppins-Medium.ttf | `font-poppins-medium` | `FontFamily.medium` |
| Semi-Bold (600) | Poppins-SemiBold.ttf | `font-poppins-semibold` | `FontFamily.semiBold` |
| Bold (700) | Poppins-Bold.ttf | `font-poppins-bold` | `FontFamily.bold` |

## Typography Hierarchy

### Recommended Usage
- **Headers**: `font-poppins-bold` or `font-poppins-semibold`
- **Body Text**: `font-poppins` (regular)
- **Captions**: `font-poppins-light` or `font-poppins`
- **Buttons**: `font-poppins-medium` or `font-poppins-semibold`
- **Labels**: `font-poppins-medium`

### Example Component
```jsx
export default function ExampleComponent() {
  return (
    <View>
      <Text className="text-2xl font-poppins-bold text-black mb-2">
        Main Heading
      </Text>
      <Text className="text-lg font-poppins-semibold text-gray-700 mb-4">
        Subheading
      </Text>
      <Text className="text-base font-poppins text-gray-600 mb-6">
        This is body text using Poppins Regular. It's clean and readable.
      </Text>
      <TouchableOpacity className="bg-black px-6 py-3 rounded-xl">
        <Text className="text-white font-poppins-medium text-center">
          Button Text
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Troubleshooting

### Fonts Not Loading
1. Check file paths are correct
2. Ensure font files are in `assets/fonts/` directory
3. Verify file names match exactly (case-sensitive)
4. Clear Metro cache: `npx expo start --clear`

### Font Not Applying
1. Make sure fonts are loaded before rendering
2. Check Tailwind config includes font families
3. Restart development server after font changes

## Performance Tips

1. **Preload fonts** in `_layout.tsx` to avoid loading delays
2. **Use font-display: swap** for web builds
3. **Limit font weights** to only what you need
4. **Consider font subsetting** for production builds
