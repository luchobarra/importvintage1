import { getSiteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { EB_Garamond, Public_Sans } from "next/font/google";
import "./globals.css";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Retro Campus",
    template: "%s | Retro Campus",
  },
  description: "Prendas vintage seleccionadas, disponibles para compra directa.",
  openGraph: {
    siteName: "Retro Campus",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${ebGaramond.variable} ${publicSans.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
