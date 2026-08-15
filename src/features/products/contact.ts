import {
  formatProductPrice,
  getProductBrandName,
  getProductSizeLabel,
} from "@/features/products/formatters";
import { formatMeasurementValue } from "@/features/measurements/formatters";
import type { Product } from "@/features/products/types";
import { createSiteUrl } from "@/lib/site-url";

const WHATSAPP_BASE_URL = "https://wa.me";

export function createProductContactHref(productId: string) {
  return `/contactar/producto/${productId}`;
}

export function createProductDetailUrl(productId: string) {
  return createSiteUrl(`/productos/${productId}`);
}

export function createProductWhatsappUrl({
  product,
  sellerPhoneNumber,
}: {
  product: Product;
  sellerPhoneNumber: string;
}) {
  const normalizedPhoneNumber = normalizeWhatsappPhoneNumber(sellerPhoneNumber);

  if (!normalizedPhoneNumber) {
    throw new Error("El número de WhatsApp no está configurado.");
  }

  const detailUrl = createProductDetailUrl(product.id);
  const message = createProductContactMessage(product, detailUrl);
  const url = new URL(`/${normalizedPhoneNumber}`, WHATSAPP_BASE_URL);

  url.searchParams.set("text", message);

  return url;
}

function createProductContactMessage(product: Product, detailUrl: string) {
  const lines = [
    detailUrl,
    "",
    "Hola, me interesa este producto de Retro Campus:",
    "",
    product.title,
    `Marca: ${getProductBrandName(product)}`,
    `Talle: ${getProductSizeLabel(product)}`,
    `Medidas: alto ${formatMeasurementValue(product.height_cm)}, ancho ${formatMeasurementValue(product.width_cm)}`,
    `Precio: ${formatProductPrice(product.price)}`,
    "",
    "Sigue disponible?",
  ];

  return lines.join("\n");
}

function normalizeWhatsappPhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/\D/g, "");
}
