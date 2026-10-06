import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { createAnonClient } from './anon';
import type { Database } from '@/types/database';

export class ServiceRoleMissingError extends Error {
  constructor() {
    super(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. Add a real service role key to .env.local to enable admin writes.'
    );
    this.name = 'ServiceRoleMissingError';
  }
}

/**
 * True only when a real service role key is present. Placeholder values are
 * treated as missing so a half-configured deploy fails loudly instead of
 * silently sending garbage as an Authorization header.
 */
export function hasServiceRoleKey(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(key && !key.startsWith('PENDING'));
}

function buildServiceClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !hasServiceRoleKey()) {
    throw new ServiceRoleMissingError();
  }

  return createSupabaseClient<Database>(url, serviceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Service-role client: bypasses RLS for writes. Server routes only — never
 * import from client components or expose SUPABASE_SERVICE_ROLE_KEY to the
 * browser. Throws when the key is missing, so callers must handle it.
 */
export function createAdminClient(): SupabaseClient<Database> {
  return buildServiceClient();
}

/**
 * Read path for the admin dashboard.
 *
 * RLS already allows public SELECT on events, students, and registrations, so
 * when no service role key is configured we transparently fall back to the
 * anon client. This keeps the dashboard readable in local/dev setups while
 * writes still hard-fail via createAdminClient.
 */
export function createReadableClient(): {
  supabase: SupabaseClient<Database>;
  readOnly: boolean;
} {
  if (hasServiceRoleKey()) {
    return { supabase: buildServiceClient(), readOnly: false };
  }
  return { supabase: createAnonClient(), readOnly: true };
}