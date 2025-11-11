# Black & White Color Palette Guide

This document outlines the consistent color usage across the Tricycle App using a black and white theme.

## Color Palette

### Primary Colors
- **Pure Black**: `#000000` - Primary actions, main text, active states
- **Pure White**: `#ffffff` - Backgrounds, button text on dark backgrounds
- **Gray Scale**: Various shades for secondary elements

### Gray Scale Hierarchy
```
Gray 50:  #f9fafb  - Very light backgrounds
Gray 100: #f3f4f6  - Light backgrounds, disabled states
Gray 200: #e5e7eb  - Borders, dividers
Gray 300: #d1d5db  - Input borders, inactive elements
Gray 400: #9ca3af  - Placeholder text, icons
Gray 500: #6b7280  - Secondary text, medium icons
Gray 600: #4b5563  - Secondary text (darker)
Gray 700: #374151  - Dark secondary text, errors
Gray 800: #1f2937  - Very dark elements
Gray 900: #111827  - Almost black
```

## Usage Guidelines

### Text Colors
- **Primary Text**: `text-black` - Main headings, important content
- **Secondary Text**: `text-gray-700` - Subheadings, descriptions
- **Tertiary Text**: `text-gray-600` - Less important text
- **Muted Text**: `text-gray-500` - Placeholder text, hints

### Background Colors
- **Primary Background**: `bg-white` - Main app background
- **Secondary Background**: `bg-gray-50` - Card backgrounds
- **Tertiary Background**: `bg-gray-100` - Subtle sections

### Interactive Elements

#### Buttons
- **Primary Button**: `bg-black border-black text-white`
- **Secondary Button**: `bg-white border-gray-300 text-black`
- **Disabled Button**: `bg-gray-200 border-gray-300 text-gray-500`

#### Form Elements
- **Input Fields**: `bg-white border-gray-300 text-black`
- **Input Focus**: `border-black`
- **Input Error**: `border-gray-700`
- **Labels**: `text-black`

#### Icons
- **Primary Icons**: `#000000` - Active, important icons
- **Secondary Icons**: `#6b7280` - General purpose icons
- **Muted Icons**: `#9ca3af` - Inactive, decorative icons

### States and Feedback

#### Success States
- **Success Color**: `#000000` (black)
- **Success Background**: `bg-gray-100`

#### Error States
- **Error Color**: `#374151` (dark gray)
- **Error Background**: `bg-gray-100`

#### Warning States
- **Warning Color**: `#6b7280` (medium gray)
- **Warning Background**: `bg-gray-50`

#### Info States
- **Info Color**: `#9ca3af` (light gray)
- **Info Background**: `bg-gray-50`

## Component-Specific Guidelines

### Navigation
- **Active Tab**: `text-black` with `bg-black` indicator
- **Inactive Tab**: `text-gray-500`
- **Back Button**: `#000000` icon

### Forms
- **Required Fields**: `text-gray-700` asterisk
- **Form Steps Progress**: `bg-black` for completed, `bg-gray-200` for remaining
- **Checkboxes**: `bg-black border-black` when checked, `border-gray-300` when unchecked

### Cards and Containers
- **Card Background**: `bg-white`
- **Card Border**: `border-gray-200`
- **Section Dividers**: `bg-gray-200`

## Tailwind CSS Classes Reference

### Most Common Classes
```css
/* Text */
.text-black
.text-gray-700
.text-gray-600
.text-gray-500

/* Backgrounds */
.bg-white
.bg-black
.bg-gray-50
.bg-gray-100
.bg-gray-200

/* Borders */
.border-black
.border-gray-300
.border-gray-200

/* Interactive States */
.bg-black.border-black.text-white  /* Primary button */
.bg-white.border-gray-300.text-black  /* Secondary button */
.bg-gray-200.border-gray-300.text-gray-500  /* Disabled button */
```

## Best Practices

1. **Consistency**: Always use the defined color palette
2. **Contrast**: Ensure sufficient contrast for accessibility
3. **Hierarchy**: Use darker colors for more important elements
4. **Simplicity**: Stick to the black/white/gray theme
5. **Testing**: Test on both light and dark system themes

## Accessibility Notes

- Black text on white background provides maximum contrast (21:1)
- Gray text should maintain at least 4.5:1 contrast ratio
- Interactive elements should have clear visual states
- Focus indicators should be clearly visible

## Migration Notes

When updating existing components:
1. Replace colored backgrounds with appropriate gray shades
2. Change colored text to black or appropriate gray
3. Update button styles to use black/white theme
4. Ensure icons use the defined color palette
5. Test component in both light and dark contexts
