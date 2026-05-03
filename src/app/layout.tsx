import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";

import { AppShell } from "@/components/app-shell";

import { ConvexClientProvider } from "./ConvexClientProvider";
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
  title: "Lume",
  description: "Social media distribution for creators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ClerkProvider>
          <ConvexClientProvider>
            <AppShell>{children}</AppShell>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
