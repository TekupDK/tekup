import type { Metadata, Viewport } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/Analytics";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "TekUp - Din IT-partner i øjenhøjde | NIS2 & Copilot Ready",
    template: "%s | TekUp",
  },
  description: "TekUp hjælper danske SMV'er med NIS2-efterlevelse og sikker AI-brug i Microsoft 365. Bliv Copilot Ready med konkrete anbefalinger og dokumentérbar efterlevelse.",
  keywords: [
    "NIS2",
    "Copilot Ready",
    "Microsoft 365",
    "IT-sikkerhed",
    "Compliance",
    "AI-sikkerhed",
    "SMV",
    "Danmark",
    "IT-partner",
    "Governance",
    "GDPR",
    "Cybersikkerhed",
  ],
  authors: [{ name: "Jonas Abde", url: "https://linkedin.com/in/jonas-abde" }],
  creator: "TekUp",
  publisher: "TekUp",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://tekup.dk"),
  alternates: {
    canonical: "/",
    languages: {
      "da-DK": "/",
      "en-US": "/en",
    },
  },
  openGraph: {
    title: "TekUp - Din IT-partner i øjenhøjde",
    description: "Bliv NIS2-klar og Copilot Ready med TekUp. Vi leverer konkrete anbefalinger og dokumentérbar efterlevelse for danske SMV'er.",
    url: "https://tekup.dk",
    siteName: "TekUp",
    locale: "da_DK",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TekUp - NIS2 & Copilot Ready Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TekUp - Din IT-partner i øjenhøjde",
    description: "Bliv NIS2-klar og Copilot Ready med TekUp",
    images: ["/twitter-image.jpg"],
    creator: "@tekup_dk",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "oklch(55% 0.22 260)" },
    { media: "(prefers-color-scheme: dark)", color: "oklch(25% 0.12 260)" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: "light dark",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="da" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="oklch(55% 0.22 260)" />
        <meta name="msapplication-TileColor" content="oklch(55% 0.22 260)" />
      </head>
      <body
        className={`${inter.variable} ${orbitron.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <div className="relative min-h-screen bg-white">
          <div className="absolute inset-0 mesh-gradient opacity-5 pointer-events-none" />
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
