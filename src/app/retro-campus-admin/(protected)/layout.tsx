import { AdminSessionTimeoutContainer } from "@/containers/auth/AdminSessionTimeoutContainer";
import { AdminLayoutFrame } from "@/components/admin/AdminLayoutFrame";
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
    redirect("/retro-campus-admin/login");
  }

  return (
    <AdminSessionTimeoutContainer>
      <AdminLayoutFrame
        todayIso={getTodayIsoDate()}
        todayLabel={getTodayLabel()}
        userEmail={user?.email ?? "administrador"}
      >
        {children}
      </AdminLayoutFrame>
    </AdminSessionTimeoutContainer>
  );
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "long",
  }).format(new Date());
}

function getTodayIsoDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
  }).formatToParts(new Date());
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}
