import { createClient } from '@supabase/supabase-js';
import type { NextFunction, Request, Response } from 'express';

export type AuthenticatedRequest = Request & {
  authUser: { id: string; email?: string };
};

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!supabase) {
    return res.status(503).json({ error: 'Authentication is not configured on the server' });
  }

  const authorization = req.header('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(match[1]);
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired access token' });
    }

    (req as AuthenticatedRequest).authUser = {
      id: data.user.id,
      email: data.user.email,
    };
    return next();
  } catch {
    return res.status(503).json({ error: 'Authentication service is unavailable' });
  }
}

export function getAuthenticatedUserId(req: Request): string {
  return (req as AuthenticatedRequest).authUser.id;
}
