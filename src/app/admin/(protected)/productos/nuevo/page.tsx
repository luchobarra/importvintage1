import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductFormContainer } from "@/containers/products/ProductFormContainer";
import Link from "next/link";

export default function NewProductPage() {
  return (
    <AdminShell>
      <AdminHeader
        eyebrow="Productos"
        title="Nuevo producto"
        description="Carga la informacion de la prenda y entre 1 y 5 fotos. La primera imagen se usa como foto principal."
        actions={
          <Link className="button" href="/admin">
            Volver
          </Link>
        }
      />

      <section className="admin-form-panel">
        <ProductFormContainer />
      </section>
    </AdminShell>
  );
}
