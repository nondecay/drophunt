import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (Edge compatible)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Path Check: Only protect /admin routes
  if (!req.nextUrl.pathname.startsWith('/admin')) {
    return res;
  }

  // 2. Auth Check via Supabase Auth Cookie
  // Note: In a real Next.js app use @supabase/auth-helpers-nextjs or ssr package
  const { data: { session } } = await supabase.auth.getSession(); 
  
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 3. RBAC Check: Is user an admin?
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (userProfile?.role !== 'admin') {
    // 403 Forbidden
    return new NextResponse('Access Denied', { status: 403 });
  }

  // 4. Admin Session Check (Strict Password requirement)
  // Check for specialized admin cookie (HttpOnly, Secure)
  const adminSessionCookie = req.cookies.get('admin_session_token');
  
  // If navigating to sensible admin panels and NO admin session, redirect to "Admin Lock Screen"
  // Exception: Allow access to the lock screen api or page itself
  if (req.nextUrl.pathname !== '/admin/locked' && !adminSessionCookie) {
     return NextResponse.redirect(new URL('/admin/locked', req.url));
  }

  return res;
}

export const config = {
  matcher: '/admin/:path*',
};
