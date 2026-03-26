import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RootLayoutClient } from "@/components/RootLayoutClient";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Game Master Hub",
  description: "Game content management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100">
        <AuthSessionProvider>
          <RootLayoutClient>{children}</RootLayoutClient>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
