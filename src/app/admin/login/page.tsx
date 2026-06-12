import { LoginFormContainer } from "@/containers/auth/LoginFormContainer";
import { isAdminUser } from "@/features/auth/admin";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hasExpiredSession =
    resolvedSearchParams?.reason === "session-expired";

  if (isAdminUser(user)) {
    redirect("/admin");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="auth-panel__eyebrow">Panel privado</p>
        <h1>Acceso administrador</h1>
        <p className="auth-panel__copy">
          Ingresa con el usuario administrador para gestionar el catalogo.
        </p>
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
