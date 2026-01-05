import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs'; // Changed to bcryptjs to match pgcrypto (Supabase standard)
import { cookies } from 'next/headers';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
    const { password } = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const cookieStore = cookies();

    // 1. Get current Authenticated User (from supabase auth cookie)
    // In a real app, use getUser() from @supabase/auth-helpers-nextjs pattern
    const authCookie = cookieStore.get('sb-access-token');
    // ... verify authCookie ...
    // For demo, assume we have the ID:
    const userId = "extracted-user-id-from-session";

    // 2. Fetch Admin Secret & Lock Status
    const { data: secret, error } = await supabase
        .from('admin_secrets')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !secret) {
        return NextResponse.json({ error: 'Access Denied or Not Setup' }, { status: 403 });
    }

    // 3. Check Lockout
    if (secret.failed_attempts >= 3) {
        return NextResponse.json({ error: 'Account Locked. Contact Support.' }, { status: 403 });
    }

    // 4. Verify Password (using BCrypt)
    // This matches the `crypt(password, gen_salt('bf'))` from our SQL script
    const valid = await bcrypt.compare(password, secret.password_hash);

    if (!valid) {
        // Increment failures
        await supabase.from('admin_secrets').update({
            failed_attempts: secret.failed_attempts + 1,
            last_attempt_at: new Date().toISOString()
        }).eq('user_id', userId);

        return NextResponse.json({ error: 'Invalid Password' }, { status: 401 });
    }

    // 5. Success
    await supabase.from('admin_secrets').update({ failed_attempts: 0 }).eq('user_id', userId);

    // Issue Admin Session Cookie (15 mins)
    cookieStore.set('admin_session_token', 'valid-session-token-hash', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 15 * 60
    });

    return NextResponse.json({ success: true });
}
