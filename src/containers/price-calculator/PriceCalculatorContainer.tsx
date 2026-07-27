import { PriceCalculator } from "@/components/price-calculator/PriceCalculator";
import { EmptyProductList } from "@/components/products/EmptyProductList";
import { getAdminPriceCalculatorSettings } from "@/features/price-calculator/queries";

export async function PriceCalculatorContainer() {
  let settings = null;
  let errorMessage = "";

  try {
    settings = await getAdminPriceCalculatorSettings();
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo cargar la calculadora.";
  }

  if (!settings) {
    return (
      <EmptyProductList
        title="No se pudo cargar la calculadora"
        message={errorMessage}
      />
    );
  }

  return <PriceCalculator initialSettings={settings} />;
}
