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

export function createAdminClient(): SupabaseClient<Database> {
  return buildServiceClient();
}

export function createReadableClient(): {
  supabase: SupabaseClient<Database>;
  readOnly: boolean;
} {
  if (hasServiceRoleKey()) {
    return { supabase: buildServiceClient(), readOnly: false };
  }
  return { supabase: createAnonClient(), readOnly: true };
}