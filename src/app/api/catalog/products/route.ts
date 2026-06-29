import { parsePublicCatalogState } from "@/features/products/public-filters";
import { getAvailableProductsPage } from "@/features/products/queries";

export async function GET(request: Request) {
  const state = parsePublicCatalogState(
    Object.fromEntries(new URL(request.url).searchParams),
  );

  try {
    const result = await getAvailableProductsPage(state);

    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudieron cargar productos.";

    return Response.json({ message }, { status: 500 });
  }
}
