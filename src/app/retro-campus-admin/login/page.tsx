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
      <section className="auth-panel ui-panel ui-panel--narrow">
        <div className="auth-panel__header">
          <p className="auth-panel__eyebrow">Panel privado</p>
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
          <div className="auth-panel__ornament" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="auth-panel__copy">
            Acceso administrador para gestionar el catalogo.
          </p>
        </div>
        {hasExpiredSession ? (
          <p className="auth-panel__message" role="status">
            Sesion vencida por inactividad.
          </p>
        ) : null}
        <LoginFormContainer />
      </section>
    </main>
  );
}
