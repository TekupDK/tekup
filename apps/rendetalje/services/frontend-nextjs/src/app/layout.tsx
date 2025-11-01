import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { FridayChatWidget } from "@/components/chat/FridayChatWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RenOS - Operations Management System",
  description: "Complete operations management system for Rendetalje.dk",
  keywords: ["rendetalje", "cleaning", "operations", "management"],
  authors: [{ name: "Rendetalje.dk Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "noindex, nofollow", // Production: remove this
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        <AuthProvider>
          <ToastProvider>
            {children}
            <FridayChatWidget />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
