import { LoginFormContainer } from "@/containers/auth/LoginFormContainer";
import { isAdminUser } from "@/features/auth/admin";
import { getCurrentSupabaseUser } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
    redirect("/oldtimes-admin");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel ui-panel ui-panel--narrow">
        <div className="auth-panel__header">
          <p className="auth-panel__eyebrow">Panel privado</p>
          <h1>Old Times</h1>
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
