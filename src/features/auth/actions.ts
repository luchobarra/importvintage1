"use server";

import { isAdminConfigured, isAdminUser } from "@/features/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthFormState = {
  message: string;
};

export async function login(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      message: "Completa email y contrasena.",
    };
  }

  if (!isAdminConfigured()) {
    return {
      message: "Falta configurar ADMIN_EMAIL en el entorno del proyecto.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      message: "Credenciales invalidas. Revisa los datos e intenta de nuevo.",
    };
  }

  if (!isAdminUser(data.user)) {
    await supabase.auth.signOut();

    return {
      message: "Este usuario no esta autorizado para acceder al panel.",
    };
  }

  redirect("/admin");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect("/admin/login");
}

export async function expireAdminSession() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect("/admin/login?reason=session-expired");
}
