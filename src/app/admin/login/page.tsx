import { LoginForm } from "@/app/admin/login/login-form";
import { isAdminUser } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        <LoginForm />
      </section>
    </main>
  );
}
