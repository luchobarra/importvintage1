import type { User } from "@supabase/supabase-js";

export function isAdminUser(user: User | null) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = user?.email?.trim().toLowerCase();

  return Boolean(adminEmail && userEmail && adminEmail === userEmail);
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_EMAIL?.trim());
}

