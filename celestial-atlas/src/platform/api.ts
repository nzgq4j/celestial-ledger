// Calls to the Celestial Atlas server (billing and account endpoints). The web
// app uses its own origin; the Android app calls the live site.
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

const configured: string | undefined = import.meta.env.VITE_API_BASE;
export const API_BASE = configured ?? (Capacitor.isNativePlatform() ? 'https://celestialatlas.app' : '');

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code; this.name = 'ApiError'; }
}

/** POST JSON as the signed-in member (bearer token) and return the JSON reply. */
export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  if (!session) throw new ApiError(401, 'SIGNED_OUT', 'Sign in first.');
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string } & T;
  if (!res.ok) throw new ApiError(res.status, data.code ?? 'REQUEST_FAILED', data.error ?? 'Request failed.');
  return data;
}
