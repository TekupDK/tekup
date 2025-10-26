# TekUp Futuristic Design System 🚀

Ett komplett design system för TekUp-ekosystemet med futuristisk glassmorphism-tema, neon-blå accenter och P3 wide gamut färgstöd.

## 🎨 Design-filosofi

Detta design system är skapat för att ge en konsekvent, futuristisk upplevelse genom hela TekUp-ekosystemet med:

- **Glassmorphism-effekter** med backdrop-blur och transparens
- **Neon-blå färgpalett** (hsl(195 100% 50%))
- **Orbitron-typografi** för rubriker (sci-fi känsla)
- **Inter-typografi** för brödtext (ren läsbarhet)
- **3D-transformationer** och hover-effekter
- **Container queries** och responsiv design

## 🛠 Installation

Lägg till design systemet i ditt projekt:

```bash
pnpm add @tekup/design-system
```

## 📦 Användning

### CSS Styles

Importera basformatet i din `globals.css` eller huvudsakliga CSS-fil:

```css
@import '@tekup/design-system/styles';
```

### Tailwind Configuration

Extendera din Tailwind-config med design systemet:

```javascript
// tailwind.config.js
const designSystemConfig = require('@tekup/design-system/tailwind');

module.exports = {
  darkMode: designSystemConfig.darkMode,
  content: [
    // dina content paths
  ],
  theme: {
    ...designSystemConfig.theme,
    extend: {
      ...designSystemConfig.theme.extend,
      // dina custom extensions
    }
  },
  plugins: [...(designSystemConfig.plugins || [])]
};
```

### Utility Functions

```typescript
import { cn, neonGlow, glassmorphism } from '@tekup/design-system';

// Merge classes
const className = cn('glass-card', 'neon-glow', customClass);

// Generate neon glow
const glowStyle = neonGlow('195 100% 50%', 0.4);

// Generate glassmorphism effect
const glassStyle = glassmorphism(0.15);
```

## 🎨 Färger

### Primära färger
- `--neon-blue`: 195 100% 50% - Huvudsaklig neon-blå
- `--neon-cyan`: 180 100% 50% - Kompletterande cyan
- `--ecosystem-dark`: 220 25% 6% - Mörk bakgrund

### Glassmorphism
- `--glass-border`: 220 20% 25% - Glassborder med alpha
- `--card-glass`: 220 20% 15% - Glaskort bakgrund

### Gradienter
- `--gradient-ecosystem`: Mörk ekosystem-gradient
- `--gradient-neon`: Neon blå till cyan gradient
- `--gradient-glass`: Glassmorphism gradient

## 🧩 Komponenter

### Glasskort
```html
<div class="glass-card p-6">
  <h2 class="font-orbitron font-bold text-neon-blue">Titel</h2>
  <p class="text-muted-foreground">Innehåll</p>
</div>
```

### Knappar
```html
<!-- Primär knapp -->
<button class="btn-futuristic">
  Primär åtgärd
</button>

<!-- Sekundär knapp -->
<button class="btn-ghost-futuristic">
  Sekundär åtgärd
</button>
```

### Navigation
```html
<nav class="nav-futuristic">
  <!-- Navigation innehåll -->
</nav>
```

### Formulärelement
```html
<input class="input-futuristic" placeholder="Ange text..." />
```

### Dashboard-komponenter
```html
<!-- Statistik kort -->
<div class="dashboard-card">
  <div class="dashboard-stat">
    <div class="dashboard-stat-value">1.2K+</div>
    <div class="dashboard-stat-label">Leads</div>
  </div>
</div>
```

## ✨ Animationer

Inkluderade animationer:
- `animate-float` - Flytande rörelse
- `animate-pulse-neon` - Neon-pulserande effekt
- `animate-data-flow` - Dataflödesanimation
- `animate-glow-pulse` - Glöd-puls effekt
- `animate-gradient-x` - Horisontell gradient-rörelse
- `animate-fade-in-up` - Fade in uppifrån

## 📱 Responsivitet

Design systemet stöder:
- Container queries för komponent-baserad responsivitet
- Adaptiva glassmorphism-effekter
- Optimerade animationer för prestanda

## ♿ Tillgänglighet

- Respekterar `prefers-reduced-motion`
- Stödjer `prefers-contrast: high`
- Optimerade färgkontraster
- Semantisk markup

## 🔧 Anpassning

Alla färger och effekter kan anpassas genom CSS custom properties:

```css
:root {
  --neon-blue: 195 100% 60%; /* Ljusare blå */
  --glass-border: 220 20% 30%; /* Starkare glasborder */
}
```

## 📄 Licens

Detta design system är privat och utvecklat för TekUp-ekosystemet.

## 🤝 Bidrag

För bidrag och förfrågningar, kontakta TekUp utvecklingsteamet.
