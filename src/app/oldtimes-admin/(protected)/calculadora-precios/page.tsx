import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { PriceCalculatorContainer } from "@/containers/price-calculator/PriceCalculatorContainer";
import Link from "next/link";

export default function AdminPriceCalculatorPage() {
  return (
    <AdminShell>
      <AdminHeader
        eyebrow="Costos"
        title="Calculadora de precios"
        description="Calcula precio de venta, costo total y margenes usando los valores estandar del negocio."
        actions={
          <Link className="button" href="/oldtimes-admin">
            Volver
          </Link>
        }
      />

      <PriceCalculatorContainer />
    </AdminShell>
  );
}
