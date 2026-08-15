import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductListContainer } from "@/containers/products/ProductListContainer";
import Link from "next/link";

export default function ProductsPage() {
  return (
    <AdminShell>
      <AdminHeader
        eyebrow="Productos"
        title="Productos"
        description="Busca y revisa las prendas cargadas en el catálogo."
        actions={
          <Link className="button button--ghost" href="/retro-campus-admin">
            Volver
          </Link>
        }
      />

      <section className="admin-products-panel">
        <div className="admin-products-panel__toolbar">
          <Link
            className="button button--primary button--compact"
            href="/retro-campus-admin/productos/nuevo"
          >
            Nuevo producto
          </Link>
        </div>
        <ProductListContainer />
      </section>
    </AdminShell>
  );
}
