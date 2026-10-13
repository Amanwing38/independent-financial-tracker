import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Independent Financial Tracker [DEMO DATA]",
  description: "Standalone financial management system with independent cash and bank registers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
