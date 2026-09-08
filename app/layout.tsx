import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marakale Serviced Apartments",
  description: "Premium Property Management Architecture",
};

/**
 * Marakale Root Application Wrapper Shell
 * Houses the global styling parameters and injects children nodes.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
