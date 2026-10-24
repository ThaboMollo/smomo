/**
 * Test harness for talking to the live-ish Supabase project three ways:
 *   api()      — through the NestJS API, as a user
 *   rest()     — straight at PostgREST with the anon key + a user JWT, which is exactly
 *                what a malicious client can do. The security specs use this: going
 *                through the API would only prove the API is well-behaved.
 *   asAdmin()  — service role, for fixtures and for restoring state. Optional: specs
 *                that need it skip when SUPABASE_SERVICE_ROLE_KEY is absent.
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(__dirname, '../../.env') });
config({ path: resolve(__dirname, '../../../web/.env.local') });

export const SB =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const ANON =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1').replace(/\/$/, '');
export const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const TEST_PASSWORD = process.env.DIAG_PASSWORD ?? 'Diag-Test-123456';
export const ACCOUNTS = {
  client: 'smomo.diag.client2@example.com',
  pro: 'smomo.diag.pro1@example.com',
  pro2: 'smomo.diag.browser1@example.com',
} as const;

type Json = Record<string, unknown> | unknown[] | null;

async function send(url: string, init: RequestInit): Promise<{ status: number; body: any }> {
  const res = await fetch(url, init);
  const text = await res.text();
  let body: Json = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text as unknown as Json;
  }
  return { status: res.status, body };
}

export async function login(email: string, password = TEST_PASSWORD): Promise<string> {
  const { status, body } = await send(`${SB}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (status !== 200 || !body?.access_token) {
    throw new Error(`login failed for ${email}: ${status} ${JSON.stringify(body).slice(0, 200)}`);
  }
  return body.access_token as string;
}

export function api(token: string, path: string, method = 'GET', body?: unknown) {
  return send(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Direct PostgREST — the attacker's path. */
export function rest(token: string, path: string, method = 'GET', body?: unknown) {
  return send(`${SB}/rest/v1${path}`, {
    method,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function asAdmin(path: string, method = 'GET', body?: unknown) {
  if (!SERVICE_ROLE) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  return send(`${SB}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Read a single column off a row as the given user. */
export async function readColumn(token: string, table: string, id: string, column: string) {
  const { body } = await rest(token, `/${table}?id=eq.${id}&select=${column}`);
  return Array.isArray(body) && body.length ? (body[0] as any)[column] : undefined;
}
