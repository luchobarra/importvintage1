import { CONTACT_WHATSAPP_NUMBER } from "@/features/contact/constants";
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

  try {
    const product = await getAvailableProductById(id);
    const whatsappUrl = createProductWhatsappUrl({
      product,
      sellerPhoneNumber: CONTACT_WHATSAPP_NUMBER,
    });

    return NextResponse.redirect(whatsappUrl);
  } catch {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }
}
