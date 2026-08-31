import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductListContainer } from "@/containers/products/ProductListContainer";
import Link from "next/link";

export default function ProductsPage() {
  return (
    <AdminShell>
      <AdminHeader
        eyebrow="Principal / Productos"
        title="Productos"
        description="Busca y revisa las prendas cargadas en el catálogo."
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
