import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminShell } from "@/components/admin/AdminShell";
import { logout } from "@/features/auth/actions";
import { getCurrentSupabaseUser } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  Calculator,
  Home,
  LogOut,
  Package,
  PackageSearch,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
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
          <div className="admin-header__actions">
            <Link className="button" href="/">
              <Home aria-hidden="true" size={16} />
              Home
            </Link>
            <form action={logout}>
              <button className="button button--ghost" type="submit">
                <LogOut aria-hidden="true" size={16} />
                Salir
              </button>
            </form>
          </div>
        }
      />

      <div className="admin-actions">
        <Link className="admin-action ui-card ui-card--interactive" href="/oldtimes-admin/productos">
          <span className="admin-action__icon" aria-hidden="true">
            <Package size={20} />
          </span>
          <span className="admin-action__title text-h3">Productos</span>
          <strong className="text-body">
            Ver y buscar prendas cargadas
          </strong>
        </Link>
        <Link className="admin-action ui-card ui-card--interactive" href="/oldtimes-admin/stock">
          <span className="admin-action__icon" aria-hidden="true">
            <PackageSearch size={20} />
          </span>
          <span className="admin-action__title text-h3">Stock</span>
          <strong className="text-body">
            Controlar ingresos, ventas e inventario
          </strong>
        </Link>
        <Link className="admin-action ui-card ui-card--interactive" href="/oldtimes-admin/productos/nuevo">
          <span className="admin-action__icon" aria-hidden="true">
            <Plus size={20} />
          </span>
          <span className="admin-action__title text-h3">Nuevo producto</span>
          <strong className="text-body">Cargar una prenda al catalogo</strong>
        </Link>
        <Link className="admin-action ui-card ui-card--interactive" href="/oldtimes-admin/calculadora-precios">
          <span className="admin-action__icon" aria-hidden="true">
            <Calculator size={20} />
          </span>
          <span className="admin-action__title text-h3">Calculadora de precios</span>
          <strong className="text-body">
            Calcular costos, precios y margenes
          </strong>
        </Link>
        <Link className="admin-action ui-card ui-card--interactive" href="/oldtimes-admin/catalogo">
          <span className="admin-action__icon" aria-hidden="true">
            <SlidersHorizontal size={20} />
          </span>
          <span className="admin-action__title text-h3">Configuracion</span>
          <strong className="text-body">
            Administrar categorias, marcas y talles
          </strong>
        </Link>
      </div>
    </AdminShell>
  );
}
