import { logout } from "@/app/admin/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="admin-page">
      <section className="admin-shell">
        <header className="admin-header">
          <div>
            <p className="admin-header__eyebrow">Admin</p>
            <h1>Panel del catalogo</h1>
            <p className="admin-header__session">
              Sesion activa: {user?.email ?? "administrador"}
            </p>
          </div>

          <form action={logout}>
            <button className="button" type="submit">
              Salir
            </button>
          </form>
        </header>

        <div className="admin-actions">
          <Link className="admin-action" href="/admin/productos">
            <span>Productos</span>
            <strong>Ver y buscar prendas cargadas</strong>
          </Link>
          <Link className="admin-action" href="/admin/productos/nuevo">
            <span>Nuevo producto</span>
            <strong>Cargar una prenda al catalogo</strong>
          </Link>
        </div>
      </section>
    </main>
  );
}
