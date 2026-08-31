import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { PriceCalculatorContainer } from "@/containers/price-calculator/PriceCalculatorContainer";

export default function AdminPriceCalculatorPage() {
  return (
    <AdminShell>
      <AdminHeader
        eyebrow="Operación / Calculadora"
        title="Calculadora de precios"
        description="Calcula precio de venta, costo total y margenes usando los valores estandar del negocio."
      />

      <PriceCalculatorContainer />
    </AdminShell>
  );
}
