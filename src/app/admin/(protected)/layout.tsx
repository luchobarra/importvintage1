import { AdminSessionTimeoutContainer } from "@/containers/auth/AdminSessionTimeoutContainer";
import { isAdminUser } from "@/features/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    redirect("/admin/login");
  }

  return <AdminSessionTimeoutContainer>{children}</AdminSessionTimeoutContainer>;
}
