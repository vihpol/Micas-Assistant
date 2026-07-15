import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MICAS Internal Resource Hub",
  description: "Internal search hub for MICAS department resources",
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
