import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OSA — One Step Ahead",
  description: "A personalised global intelligence platform for markets, startups, technology, careers and learning.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
