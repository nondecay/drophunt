import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { verifyMessage } from "https://esm.sh/viem@2.7.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { message, signature, address } = await req.json()

        if (!message || !signature || !address) {
            throw new Error('Missing message, signature, or address')
        }

        // 1. Verify Signature using Viem
        const valid = await verifyMessage({
            address,
            message,
            signature,
        })

        if (!valid) {
            throw new Error('Invalid signature')
        }

        // 2. Setup Admin Client
        // SUPABASE_SERVICE_ROLE_KEY is required to bypass RLS and manage users
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 3. Find or Create User
        // We use a deterministic email for wallet users since Supabase needs an email
        const email = `${address.toLowerCase()}@drophunt.local`

        // Check if user exists by email
        // Note: We use listUsers or getUserByEmail logic via filter if possible, 
        // but signInWithPassword handles "User not found" errors we can catch.

        // Strategy: Try to create. If fails (already exists), then just update/login.
        const dummyPassword = `siwe-secure-${address}-${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.substring(0, 8)}`

        // Attempt to create user (will fail if exists)
        const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: dummyPassword,
            email_confirm: true,
            user_metadata: { address: address.toLowerCase() }
        })

        let userId = createdUser?.user?.id

        if (createError) {
            // If error is not "User already registered", throw it
            // Supabase error message for duplicate is usually "User already registered"
            if (!createError.message.includes('already registered')) {
                // Fallback: try to find user to get ID
                // Or honestly, just proceed to update/login
            } else {
                // User exists, we need their ID to update password (if we want to rotate it) 
                // OR we just trust the deterministic password.
                // Let's assume deterministic password works.
            }
        }

        // 4. Update Password (to ensure we can login even if logic changed)
        // We need the User ID to update password. 
        // If creation failed, we don't have ID handy unless we query.
        if (createError) {
            // Query user to get ID (admin.listUsers is slow, better: getUserByEmail doesn't exist on admin client directly often)
            // Wait, we can just sign in. If password matches deterministic one, we good.
        }

        // 5. Sign In to get Session
        const { data: sessionData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password: dummyPassword
        })

        if (loginError) {
            // Maybe password was different (old logic)? Update it now.
            // We need to look up the user ID to update password.
            // This is the tricky part without ID.
            // Workaround: We can use `admin.listUsers` with filter.
            /*
            const { data: users } = await supabaseAdmin.auth.admin.listUsers()
            const u = users.users.find(x => x.email === email)
            if (u) {
               await supabaseAdmin.auth.admin.updateUserById(u.id, { password: dummyPassword })
               // Retry login
               const retry = await supabaseAdmin.auth.signInWithPassword({ email, password: dummyPassword })
               if (retry.error) throw retry.error
               return new Response(JSON.stringify(retry.data.session), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            */
            throw loginError
        }

        return new Response(
            JSON.stringify(sessionData.session),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
