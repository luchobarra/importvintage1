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
  applicationName: "Retro Campus",
  authors: [{ name: "Retro Campus" }],
  category: "fashion",
  metadataBase: getSiteUrl(),
  title: {
    default: "Retro Campus | Catalogo vintage seleccionado",
    template: "%s | Retro Campus",
  },
  description:
    "Retro Campus es un catalogo online de ropa vintage seleccionada: prendas unicas, buzos, camperas, pantalones y piezas exclusivas disponibles para compra directa.",
  icons: {
    apple: "/apple-icon.png",
    icon: "/icon.png",
  },
  keywords: [
    "Retro Campus",
    "Retro Campus vintage",
    "catalogo vintage",
    "ropa vintage",
    "prendas vintage",
    "buzos vintage",
    "camperas vintage",
    "pantalones vintage",
    "moda circular",
    "ropa seleccionada",
  ],
  openGraph: {
    description:
      "Catalogo online de ropa vintage seleccionada por Retro Campus. Explora prendas disponibles y piezas exclusivas.",
    images: [
      {
        url: "/brand/retro-campus-logo.png",
        alt: "Logo de Retro Campus",
        height: 816,
        width: 720,
      },
    ],
    siteName: "Retro Campus",
    title: "Retro Campus | Catalogo vintage seleccionado",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary",
    description:
      "Catalogo online de ropa vintage seleccionada por Retro Campus.",
    images: ["/brand/retro-campus-logo.png"],
    title: "Retro Campus",
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
