import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { CatalogOptionsManagerContainer } from "@/containers/catalog-options/CatalogOptionsManagerContainer";
import Link from "next/link";

export default function AdminCatalogOptionsPage() {
  return (
    <AdminShell>
      <AdminHeader
        eyebrow="Catálogo"
        title="Configuración de catálogo"
        description="Gestiona categorias, marcas y talles disponibles para productos y filtros publicos."
        actions={
          <Link className="button" href="/retro-campus-admin">
            Volver
          </Link>
        }
      />

      <section className="admin-form-panel ui-panel">
        <CatalogOptionsManagerContainer />
      </section>
    </AdminShell>
  );
}
