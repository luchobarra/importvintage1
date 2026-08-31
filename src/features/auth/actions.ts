"use server";

import { isAdminConfigured, isAdminUser } from "@/features/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthFormState = {
  fieldErrors?: {
    email?: string;
    password?: string;
  };
  message: string;
};

export async function login(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fieldErrors: AuthFormState["fieldErrors"] = {};

  if (!email) {
    fieldErrors.email = "Ingresá el email administrador.";
  }

  if (email && !email.includes("@")) {
    fieldErrors.email = "Ingresá un email válido.";
  }

  if (!password) {
    fieldErrors.password = "Ingresá la contraseña.";
  }

  if (fieldErrors.email || fieldErrors.password) {
    return {
      fieldErrors,
      message: "Revisá los campos marcados.",
    };
  }

  if (!isAdminConfigured()) {
    return {
      fieldErrors: {},
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
      fieldErrors: {},
      message: "Credenciales inválidas. Revisá los datos e intentá de nuevo.",
    };
  }

  if (!isAdminUser(data.user)) {
    await supabase.auth.signOut();

    return {
      fieldErrors: {},
      message: "Este usuario no está autorizado para acceder al panel.",
    };
  }

  redirect("/retro-campus-admin");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect("/retro-campus-admin/login");
}

export async function expireAdminSession() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect("/retro-campus-admin/login?reason=session-expired");
}
