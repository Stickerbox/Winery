import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers";
import { detectServerLang } from "@/lib/i18n";
import { LanguageProvider } from "@/components/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VinoVault",
  description: "Your personal wine collection",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = detectServerLang((await headers()).get("accept-language"));

  return (
    <html lang={lang}>
      <head>
        <meta name="theme-color" content="#ede0f0" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#2d0a1e" media="(prefers-color-scheme: dark)" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
