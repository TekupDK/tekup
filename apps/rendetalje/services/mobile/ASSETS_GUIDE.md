# 📱 RendetaljeOS Mobile App - Assets Guide

## Required Assets

This app requires the following assets to be created and placed in the `assets/` directory:

### 1. **App Icon** (`icon.png`)

- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Usage**: Main app icon for both iOS and Android
- **Design**: Should be a clean, recognizable icon representing RendetaljeOS
- **Recommended**: Use your company logo or a cleaning-related icon

### 2. **Splash Screen** (`splash.png`)

- **Size**: 1284x2778 pixels (iPhone 14 Pro Max resolution)
- **Format**: PNG
- **Background**: White (#FFFFFF)
- **Usage**: Displayed when app launches
- **Design**: Should include app logo/icon centered

### 3. **Adaptive Icon** (`adaptive-icon.png`)

- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Usage**: Android adaptive icon (foreground layer)
- **Design**: Same as app icon but optimized for Android's adaptive icon system
- **Note**: Background color is set to white in app.json

### 4. **Favicon** (`favicon.png`)

- **Size**: 48x48 pixels
- **Format**: PNG
- **Usage**: Web version favicon
- **Design**: Simplified version of app icon

### 5. **Notification Icon** (`notification-icon.png`)

- **Size**: 96x96 pixels
- **Format**: PNG with transparency
- **Usage**: Android push notification icon
- **Design**: Simplified, monochrome version of app icon
- **Note**: Should be white/transparent for best results

---

## Quick Creation Guide

### Option 1: Using Figma (Recommended)

1. Create a 1024x1024 canvas
2. Design your icon with:
   - Company logo or "R" letter for RendetaljeOS
   - Brand color: `#3B82F6` (primary blue)
   - Clean, modern design
3. Export at different sizes:
   - `icon.png`: 1024x1024
   - `adaptive-icon.png`: 1024x1024
   - `favicon.png`: 48x48
   - `notification-icon.png`: 96x96 (monochrome)
4. Create splash screen (1284x2778) with centered icon

### Option 2: Using Online Tools

**Recommended tools:**

- [AppIcon.co](https://appicon.co/) - Generate all icon sizes
- [MakeAppIcon.com](https://makeappicon.com/) - Free icon generator
- [Canva](https://www.canva.com/) - Design splash screen

### Option 3: Using Placeholder/Default Assets

For quick testing, create simple placeholder assets:

```bash
# Create assets directory if it doesn't exist
mkdir -p assets

# You can use any image editor or online tool to create:
# - A simple square with "R" letter for icon
# - A white background with centered icon for splash
# - Same for other assets
```

---

## Design Recommendations

### Color Palette (from app theme)

- **Primary**: `#3B82F6` (blue)
- **Success**: `#10B981` (green)
- **Warning**: `#F59E0B` (orange)
- **Error**: `#EF4444` (red)
- **Neutral**: `#6B7280` (gray)

### Icon Style

- Modern, flat design
- High contrast
- Recognizable at small sizes
- Represents cleaning/service industry

### Suggested Icon Concepts

1. Stylized "R" letter
2. Cleaning tool (broom, mop) in modern style
3. House/building with sparkle
4. Combination of letter + cleaning element

---

## Example Icon Design (Simple Placeholder)

If you need a quick placeholder, here's a simple description you can give to any designer or AI image generator:

> "Create a 1024x1024 app icon with a white rounded square background, featuring a large blue letter 'R' in a modern sans-serif font (color: #3B82F6), with a small green sparkle or star in the top-right corner (color: #10B981)"

---

## Asset Checklist

- [ ] `icon.png` (1024x1024)
- [ ] `splash.png` (1284x2778)
- [ ] `adaptive-icon.png` (1024x1024)
- [ ] `favicon.png` (48x48)
- [ ] `notification-icon.png` (96x96)

---

## After Creating Assets

1. Place all assets in `apps/rendetalje/services/mobile/assets/`
2. Verify paths in `app.json` match your asset names
3. Run `expo prebuild` to regenerate native projects with new assets
4. Test on iOS and Android simulators/devices

---

## Testing Your Assets

```bash
# Clear cache and restart
expo start -c

# Test on iOS
expo start --ios

# Test on Android
expo start --android

# Build preview
eas build --profile development --platform ios
```

---

## Need Help?

If you need professional assets created:

- Hire a designer on Fiverr or Upwork
- Use AI tools like Midjourney or DALL-E
- Contact your company's design team
- Use template icon generators online

---

**Note**: Current `app.json` references these asset paths. If they don't exist, Expo will use default placeholders, but the app will build successfully.
