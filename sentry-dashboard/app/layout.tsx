import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./components/ClientLayout";

/*
 * Metadata SEO dashboard
 */
export const metadata: Metadata = {
  title: "Sentry - Server Monitoring",
  description: "Platform monitoring keamanan multi-server secara realtime",
};

/*
 * Layout utama aplikasi
 * Menggunakan ClientLayout untuk auth dan sidebar
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
