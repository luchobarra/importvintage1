import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { logout } from "@/features/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AdminShell>
      <AdminHeader
        eyebrow="Admin"
        title="Panel del catalogo"
        description={`Sesion activa: ${user?.email ?? "administrador"}`}
        actions={
          <form action={logout}>
            <button className="button" type="submit">
              Salir
            </button>
          </form>
        }
      />

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
    </AdminShell>
  );
}
