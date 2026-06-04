import { ProductForm } from "@/app/admin/(protected)/productos/nuevo/product-form";
import Link from "next/link";

export default function NewProductPage() {
  return (
    <main className="admin-page">
      <section className="admin-shell">
        <header className="admin-header">
          <div>
            <p className="admin-header__eyebrow">Productos</p>
            <h1>Nuevo producto</h1>
            <p className="admin-header__session">
              Carga la informacion de la prenda y entre 1 y 5 fotos. La primera
              imagen se usa como foto principal.
            </p>
          </div>

          <Link className="button" href="/admin">
            Volver
          </Link>
        </header>

        <section className="admin-form-panel">
          <ProductForm />
        </section>
      </section>
    </main>
  );
}
