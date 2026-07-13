import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "micas-assistops",
  description: "Minimal internal assistant operations dashboard",
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
