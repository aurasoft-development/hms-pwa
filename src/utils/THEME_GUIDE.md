# Theme Configuration Guide

## Overview
This project uses a centralized theme system for easy color management. All colors are defined in `src/utils/theme.js` and can be easily updated to change the entire application's color scheme.

## Theme Structure

### Primary Colors
- **Navy Blue**: `#1A1A40` - Main dark color
- **Sky Blue**: `#00A8E8` - Accent color
- **White**: `#FFFFFF` - Background

### Usage

#### Import Theme
```javascript
import { theme } from '../utils/theme';
```

#### Access Colors
```javascript
// Primary colors
theme.colors.primary.main      // #1A1A40
theme.colors.primary.dark       // #0F0F28
theme.colors.primary.light      // #2A2A5A

// Accent colors
theme.colors.accent.main        // #00A8E8
theme.colors.accent.light       // #33B9EB
theme.colors.accent.dark        // #0087B8

// Background colors
theme.colors.background.primary   // #FFFFFF
theme.colors.background.secondary // #F8F9FA
theme.colors.background.tertiary  // #F0F9FF

// Text colors
theme.colors.text.primary    // #2D2D2D
theme.colors.text.secondary  // #6B7280
theme.colors.text.white      // #FFFFFF

// Gradients
theme.colors.gradients.primary           // Sidebar gradient
theme.colors.gradients.primaryHorizontal // Header gradient
theme.colors.gradients.accent           // Button gradient
theme.colors.gradients.card             // Card gradient
```

#### Example Usage in Components

```javascript
// Inline styles
<div style={{ backgroundColor: theme.colors.primary.main }}>
  Content
</div>

// With gradients
<div style={{ background: theme.colors.gradients.accent }}>
  Button
</div>
```

## Changing Theme Colors

To change the entire application theme:

1. Open `src/utils/theme.js`
2. Update the color values in the `theme` object
3. All components using the theme will automatically update

### Example: Change to Green Theme

```javascript
export const theme = {
  colors: {
    primary: {
      main: '#2D5016',      // Dark Green
      dark: '#1A3009',
      light: '#3D7020',
    },
    accent: {
      main: '#4CAF50',      // Light Green
      // ... rest of colors
    },
    // ... update other colors
  },
};
```

## Components Using Theme

The following components are already using the theme system:
- ✅ Button (`src/atoms/Button.jsx`)
- ✅ Card (`src/atoms/Card.jsx`)
- ✅ InputField (`src/atoms/InputField.jsx`)
- ✅ StatCard (`src/molecules/StatCard.jsx`)
- ✅ AppLayout (`src/templates/AppLayout.jsx`)

## Backward Compatibility

The theme system maintains backward compatibility:
- `burgundy` color maps to `primary.main` (#1A1A40)
- `gold` color maps to `accent.main` (#00A8E8)
- `beige` maps to white background
- Tailwind classes like `text-burgundy`, `bg-burgundy` still work

## Best Practices

1. **Always use theme colors** instead of hardcoded hex values
2. **Import theme** at the top of components that need colors
3. **Use gradients** from theme for consistent styling
4. **Update theme.js** for global color changes

## Migration Guide

To migrate existing components:

1. Import theme: `import { theme } from '../utils/theme';`
2. Replace hardcoded colors:
   - `#800020` → `theme.colors.primary.main`
   - `#00A8E8` → `theme.colors.accent.main`
   - `#F5E6D3` → `theme.colors.background.primary`
3. Update gradients to use `theme.colors.gradients.*`

