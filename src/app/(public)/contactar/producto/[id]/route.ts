import { createProductWhatsappUrl } from "@/features/products/contact";
import { getAvailableProductById } from "@/features/products/queries";
import { NextResponse, type NextRequest } from "next/server";

type ContactProductRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: ContactProductRouteContext,
) {
  const { id } = await params;
  const productDetailUrl = new URL(`/productos/${id}`, request.nextUrl.origin);
  const sellerPhoneNumber = process.env.SELLER_WHATSAPP_NUMBER;

  if (!sellerPhoneNumber) {
    return NextResponse.redirect(productDetailUrl);
  }

  try {
    const product = await getAvailableProductById(id);
    const whatsappUrl = createProductWhatsappUrl({
      product,
      sellerPhoneNumber,
    });

    return NextResponse.redirect(whatsappUrl);
  } catch {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }
}
