import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { logout } from "@/features/auth/actions";
import { getCurrentSupabaseUser } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentSupabaseUser(supabase);

  return (
    <AdminShell>
      <AdminHeader
        eyebrow="Admin"
        title="Panel del catalogo"
        description={`Sesion activa: ${user?.email ?? "administrador"}`}
        actions={
          <form action={logout}>
            <button className="button button--ghost" type="submit">
              Salir
            </button>
          </form>
        }
      />

      <div className="admin-actions">
        <Link className="admin-action ui-card ui-card--interactive" href="/oldtimes-admin/productos">
          <span className="text-h3">Productos</span>
          <strong className="text-body">
            Ver y buscar prendas cargadas
          </strong>
        </Link>
        <Link className="admin-action ui-card ui-card--interactive" href="/oldtimes-admin/productos/nuevo">
          <span className="text-h3">Nuevo producto</span>
          <strong className="text-body">Cargar una prenda al catalogo</strong>
        </Link>
        <Link className="admin-action ui-card ui-card--interactive" href="/oldtimes-admin/catalogo">
          <span className="text-h3">Configuracion</span>
          <strong className="text-body">
            Administrar categorias, marcas y talles
          </strong>
        </Link>
      </div>
    </AdminShell>
  );
}
