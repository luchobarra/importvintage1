import { CONTACT_INSTAGRAM } from "@/features/contact/constants";
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

const brandDescription =
  "Retro Campus es una marca de ropa vintage seleccionada, enfocada en prendas únicas con identidad, calidad y presencia. Cada pieza se elige por su estado, estilo y valor estético, y se publica a través del catálogo online, Instagram y grupo de WhatsApp.";
const siteUrl = getSiteUrl();
const brandLogoUrl = new URL("/brand/retro-campus-logo.png", siteUrl).toString();
const instagramUrl = `https://www.instagram.com/${CONTACT_INSTAGRAM}/`;

export const metadata: Metadata = {
  applicationName: "Retro Campus",
  authors: [{ name: "Retro Campus" }],
  category: "fashion",
  metadataBase: siteUrl,
  title: {
    default: "Retro Campus | Ropa vintage seleccionada",
    template: "%s | Retro Campus",
  },
  description: brandDescription,
  icons: {
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  keywords: [
    "Retro Campus",
    "Retro Campus vintage",
    "marca de ropa vintage",
    "ropa vintage",
    "ropa vintage seleccionada",
    "prendas únicas",
    "buzos vintage",
    "camperas vintage",
    "pantalones vintage",
    "moda circular",
    "ropa seleccionada",
  ],
  openGraph: {
    description: brandDescription,
    images: [
      {
        url: brandLogoUrl,
        alt: "Logo de Retro Campus",
        height: 816,
        width: 720,
      },
    ],
    siteName: "Retro Campus",
    title: "Retro Campus | Ropa vintage seleccionada",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary",
    description: brandDescription,
    images: [brandLogoUrl],
    title: "Retro Campus | Ropa vintage seleccionada",
  },
};

const brandJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "Store"],
  name: "Retro Campus",
  url: siteUrl.toString(),
  logo: brandLogoUrl,
  image: brandLogoUrl,
  description: brandDescription,
  sameAs: [instagramUrl],
  brand: {
    "@type": "Brand",
    name: "Retro Campus",
  },
  knowsAbout: [
    "ropa vintage seleccionada",
    "prendas únicas",
    "moda vintage",
    "buzos vintage",
    "camperas vintage",
    "pantalones vintage",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${ebGaramond.variable} ${publicSans.variable}`}>
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(brandJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
