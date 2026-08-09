import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { SalesChannelsManager } from "@/components/inventory/SalesChannelsManager";
import { EmptyProductList } from "@/components/products/EmptyProductList";
import { getSalesChannels } from "@/features/inventory/queries";
import type { SalesChannel } from "@/features/inventory/types";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Canales de venta",
};

export default async function SalesChannelsPage() {
  let channels: SalesChannel[] = [];
  let errorMessage = "";

  try {
    channels = await getSalesChannels();
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudieron cargar los medios de venta.";
  }

  return (
    <AdminShell>
      <AdminHeader
        actions={
          <Link className="button button--secondary" href="/oldtimes-admin/stock">
            Volver
          </Link>
        }
        description="Administra los medios que se usan al registrar ventas y futuras metricas."
        eyebrow="Stock"
        title="Canales de venta"
      />

      <section className="admin-form-panel">
        {errorMessage ? (
          <EmptyProductList
            message={errorMessage}
            title="No se pudieron cargar los canales"
          />
        ) : (
          <SalesChannelsManager channels={channels} />
        )}
      </section>
    </AdminShell>
  );
}
