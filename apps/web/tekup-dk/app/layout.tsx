import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TekUp.dk - Din AI-partner i digital transformation",
  description:
    "TekUp hjælper danske virksomheder med at træffe bedre beslutninger gennem intelligent teknologi. AI-løsninger, integrationsløsninger og automatisering.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da">
      <body className="antialiased">{children}</body>
    </html>
  );
}
