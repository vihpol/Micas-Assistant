import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MICAS Google + Gemini Search",
  description: "Google Programmable Search with Gemini answer support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
