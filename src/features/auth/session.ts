import type { User } from "@supabase/supabase-js";

type SupabaseAuthReader = {
  auth: {
    getUser: () => Promise<{
      data: {
        user: User | null;
      };
    }>;
  };
};

export async function getCurrentSupabaseUser(
  supabase: SupabaseAuthReader,
): Promise<User | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch {
    return null;
  }
}
