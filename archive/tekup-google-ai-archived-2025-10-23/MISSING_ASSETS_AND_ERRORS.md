# Manglende Assets og Potentielle Fejl

## Potentielle Deployment Fejl

### 1. **CORS Fejl**
- **Problem**: Frontend kan ikke kommunikere med backend pga. CORS restrictions
- **Løsning**: Sørg for at `https://tekup-renos-1.onrender.com` er i CORS whitelist
- **Check**: Backend CORS configuration inkluderer allerede denne URL

### 2. **Environment Variable Fejl**
- **Problem**: Manglende miljøvariabler i Render
- **Kritiske variabler**:
  - Frontend: `VITE_API_URL`
  - Backend: `DATABASE_URL`, `CLERK_SECRET_KEY`, `FRONTEND_URL`
- **Løsning**: Verificer alle variabler er sat i Render dashboard

### 3. **Build Performance**
- **Problem**: Store JavaScript chunks (>1MB)
- **Symptomer**: Langsom initial load, især på mobile
- **Løsning**: Implementer code splitting og lazy loading

### 4. **Service Worker Cache**
- **Problem**: Gammel cache kan forhindre opdateringer
- **Løsning**: Opdater CACHE_NAME version i sw.js ved hver deployment

### 5. **Database Connection**
- **Problem**: Connection pool timeout eller SSL fejl
- **Løsning**: Check DATABASE_URL har ?sslmode=require

## Manglende Billeder og Ikoner

### Påkrævet:
1. **Favicons**
   - favicon-32.png (32x32)
   - icon-192.png (192x192)
   - icon-512.png (512x512)
   - apple-touch-icon-180.png (180x180)

2. **Logo varianter**
   - Logo for dark mode
   - Logo for light mode
   - SVG version for skalering

3. **PWA Assets**
   - Splash screens for forskellige devices
   - App launcher ikoner

## AI Prompt Beskrivelser

### Hovedlogo - RenOS
```
Create a modern, minimalist logo for "RenOS" - a professional cleaning service management system. 
The logo should:
- Feature clean, geometric shapes suggesting cleanliness and efficiency
- Use a color palette of deep blue (#0b1320) as primary with accents of bright blue (#3b82f6)
- Include either abstract representation of cleaning (sparkle, water drop, or clean surface) integrated with tech elements
- Be scalable and work well on both dark and light backgrounds
- Have a professional, trustworthy appearance suitable for B2B software
- Optional: incorporate subtle "OS" styling to hint at "Operating System"
Style: Modern, minimal, professional, tech-forward
Format: SVG with transparent background
```

### App Icon
```
Create a square app icon based on the RenOS logo for mobile and PWA use.
Requirements:
- Simple, bold design that's recognizable at small sizes
- Use the same color scheme (deep blue #0b1320 with bright blue #3b82f6 accents)
- Include a subtle gradient or depth for modern app store appearance
- Center the icon with appropriate padding (about 20% margin)
- Should work well on various background colors
Sizes needed: 32x32, 192x192, 512x512 pixels
Format: PNG with transparent background
```

### Favicon
```
Create a simplified favicon version of the RenOS logo.
Requirements:
- Ultra-minimal design that works at 32x32 pixels
- Single color or maximum 2 colors
- Clear and distinctive shape
- High contrast for visibility in browser tabs
- Could be just the "R" from RenOS or an abstract cleaning/tech symbol
Format: PNG transparent background, 32x32 pixels
```

## Midlertidige Løsninger

Indtil rigtige assets er genereret:
1. Bruger `vite.svg` som placeholder
2. Manifest.json konfigureret til at acceptere SVG ikoner
3. Service worker cacher kun eksisterende filer

## Anbefalet Værktøj til Generering

1. **AI Billede Generatorer**:
   - DALL-E 3
   - Midjourney
   - Stable Diffusion

2. **Logo Design Tools**:
   - Canva AI
   - Looka
   - Designs.ai

3. **Ikon Konvertering**:
   - CloudConvert (SVG til PNG)
   - RealFaviconGenerator.net
   - PWA Asset Generator

## Implementation

Når assets er genereret:
1. Placer filer i `/client/public/icons/`
2. Opdater `manifest.json` med korrekte filnavne
3. Opdater `index.html` med rigtige ikon referencer
4. Test på forskellige enheder og browsere