# TekUp.dk - Landing Page

Moderne, professionel landing page for TekUp.dk - Din AI-partner i digital transformation.

## 🚀 Features

- ✅ **Hero Section** - Fremragende første indtryk med gradient design
- ✅ **Services Section** - Viser alle TekUp's services
- ✅ **Integration Section** - Highlight Gmail, Google Calendar og GitHub integrationer
- ✅ **Portfolio Section** - Showcase af aktive projekter
- ✅ **Contact Form** - Klar til Gmail API integration
- ✅ **Responsive Design** - Fungerer på alle enheder
- ✅ **Animations** - Smooth scroll animations med Framer Motion
- ✅ **Modern Stack** - Next.js 15, TypeScript, Tailwind CSS

## 📦 Tech Stack

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React

## 🛠️ Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Åbn [http://localhost:3000](http://localhost:3000) i din browser.

## 📁 Projektstruktur

```
tekup-dk/
├── app/
│   ├── layout.tsx       # Root layout med metadata
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/
│   ├── Navigation.tsx   # Top navigation
│   ├── HeroSection.tsx  # Hero/landing section
│   ├── ServicesSection.tsx  # Services showcase
│   ├── IntegrationSection.tsx  # Gmail, Calendar, GitHub
│   ├── PortfolioSection.tsx   # Projects showcase
│   ├── ContactSection.tsx     # Contact form
│   └── Footer.tsx       # Footer
└── package.json
```

## 🔗 Integrationer

Landing page er designet til at integrere med:

- **Gmail API** - Contact form kan sendes til Gmail
- **Google Calendar** - Booking integration (fremtidig)
- **GitHub** - Portfolio section viser repositories

## 🎨 Styling

Designet følger TekUp's design system med:

- Gradient farver (indigo → purple → pink)
- Moderne, minimalistisk design
- Smooth animations og transitions
- Responsive grid layouts

## 📝 Next Steps

1. **Gmail Integration** - Connect contact form til Gmail API
2. **Analytics** - Add tracking (Google Analytics, etc.)
3. **SEO** - Optimize metadata og content
4. **Performance** - Add image optimization
5. **Testing** - Add unit tests

## 🚢 Deployment

Siden er klar til deployment på:

- Vercel (recommended for Next.js)
- Render
- Netlify
- Din egen server
