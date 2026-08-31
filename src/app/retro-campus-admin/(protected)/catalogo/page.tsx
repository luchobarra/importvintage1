import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { CatalogOptionsManagerContainer } from "@/containers/catalog-options/CatalogOptionsManagerContainer";

export default function AdminCatalogOptionsPage() {
  return (
    <AdminShell>
      <AdminHeader
        eyebrow="Gestión / Configuración"
        title="Configuración general"
        description="Gestiona categorías, marcas, estados y talles usados por el catálogo y el inventario."
      />

      <section className="catalog-config-workspace">
        <CatalogOptionsManagerContainer />
      </section>
    </AdminShell>
  );
}
