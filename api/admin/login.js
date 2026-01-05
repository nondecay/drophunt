
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'Password required' });
    }

    try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        // Vercel Serverless Environment Variables
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Env Vars');
            return res.status(500).json({ error: 'Server Configuration Error' });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch the admin secret (assuming single admin for now or checking against all)
        // Actually, we usually want to check a specific admin?
        // The previous implementation was a global admin password or checking `admin_secrets` table.
        // Let's assume there is ONE active admin secret or we match against any?
        // bootstrap_admin.sql creates one entry for the specific user.
        // The login UI only provides Password. It implies a single "Admin Code" or we need User ID.
        // Wait, the AdminPanel logic checks `isAuthenticated`.
        // The USER is already connected via Wallet (Context).
        // So we should verify the password for *that* connected user?
        // BUT the Login UI doesn't send the address.

        // Let's UPDATE the Login UI to send the address from context?
        // OR, we just check if the password matches ANY hash in `admin_secrets`.
        // Since it's a "Command Code", likely a shared password or single admin.
        // Given the user said "Cüzdan adresiyle direkt admin oldum", they want to be admin via wallet, but PROVE it with password.

        // Let's fetch ALL secrets (should be few) and check.
        const { data: secrets, error } = await supabase.from('admin_secrets').select('secret');

        if (error || !secrets) {
            return res.status(500).json({ error: 'Database Error' });
        }

        let isValid = false;
        for (const s of secrets) {
            if (bcrypt.compareSync(password, s.secret)) {
                isValid = true;
                break;
            }
        }

        if (isValid) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(401).json({ error: 'Invalid Password' });
        }

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal Error' });
    }
}
