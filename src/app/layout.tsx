import type { Metadata } from "next";
import { Inter } from "next/font/google"; // 1. RESTORE IMPORT
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

// 2. INITIALIZE THE FONT
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GatherGo | Expedition Hub",
  description: "Advanced coordination for family expeditions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* CORRECTED: Raw script tag avoids data-nscript injection */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7325718702070526"
          crossOrigin="anonymous"
        ></script>
      </head>
      {/* 3. APPLY FONT TO BODY */}
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}