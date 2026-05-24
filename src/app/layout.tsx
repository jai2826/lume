import type { Metadata } from "next";

import { MainProvider } from "@/provider/MainProvider";
import "./globals.css";

import {
  Noto_Serif_Georgian as Georgia,
  Inter,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Georgia({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} dark h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <MainProvider>
          <div className="relative flex min-h-full flex-col">
            <main className="flex flex-1 flex-col">
              {children}
            </main>
          </div>
        </MainProvider>
      </body>
    </html>
  );
}
