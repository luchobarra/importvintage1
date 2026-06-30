import { AdminSessionTimeoutContainer } from "@/containers/auth/AdminSessionTimeoutContainer";
import { isAdminUser } from "@/features/auth/admin";
import { getCurrentSupabaseUser } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentSupabaseUser(supabase);

  if (!isAdminUser(user)) {
    redirect("/oldtimes-admin/login");
  }

  return <AdminSessionTimeoutContainer>{children}</AdminSessionTimeoutContainer>;
}
