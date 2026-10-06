import { createClient } from '@/lib/supabase/server';

/**
 * The single account allowed into /admin. Override with ADMIN_EMAIL in
 * .env.local so the address isn't hardcoded in the repo.
 */
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@college.edu').toLowerCase();

export function isAdminEmail(email?: string | null): boolean {
  return Boolean(email) && email!.toLowerCase() === ADMIN_EMAIL;
}

export async function getAdminSession() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !isAdminEmail(session.user.email)) {
    return null;
  }
  return session;
}
