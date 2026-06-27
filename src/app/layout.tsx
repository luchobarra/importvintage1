import { getSiteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Old Times Vintage",
    template: "%s | Old Times Vintage",
  },
  description: "Prendas vintage seleccionadas, disponibles para compra directa.",
  openGraph: {
    siteName: "Old Times Vintage",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
