import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ABL - AI Learning Builder",
  description: "Create structured learning activities with AI.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
