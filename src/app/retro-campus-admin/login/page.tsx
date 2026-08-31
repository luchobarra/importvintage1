import { BrandLogo } from "@/components/layout/BrandLogo";
import { LoginFormContainer } from "@/containers/auth/LoginFormContainer";
import { isAdminUser } from "@/features/auth/admin";
import { getCurrentSupabaseUser } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    reason?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentSupabaseUser(supabase);
  const hasExpiredSession =
    resolvedSearchParams?.reason === "session-expired";

  if (isAdminUser(user)) {
    redirect("/retro-campus-admin");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="admin-login-title">
        <div className="auth-panel__header">
          <Link
            aria-label="Ir al inicio de Retro Campus"
            className="auth-panel__brand"
            href="/"
          >
            <BrandLogo
              className="auth-panel__brand-logo"
              preload
              sizes="160px"
            />
          </Link>
          <div className="auth-panel__title-block">
            <p className="auth-panel__eyebrow">Panel privado</p>
            <h1 id="admin-login-title">Acceso administrador</h1>
            <p className="auth-panel__copy">
              Ingresá para gestionar stock, publicaciones y configuración del catálogo.
            </p>
          </div>
        </div>
        {hasExpiredSession ? (
          <p className="auth-panel__message" role="status">
            Sesión vencida por inactividad. Volvé a ingresar para continuar.
          </p>
        ) : null}
        <LoginFormContainer />
        <Link className="auth-panel__secondary-link" href="/">
          Volver al catálogo
        </Link>
      </section>
    </main>
  );
}
