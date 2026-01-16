# Deployment Instructions: Secure Auth (SIWE)

Since I cannot run commands on your Supabase server directly, you need to deploy the "Edge Function" we created.

## Step 1: Install Supabase CLI (if not installed)
If you haven't installed it, run:
```bash
npm install -g supabase
```

## Step 2: Login to Supabase
```bash
supabase login
```
(This will open your browser to authorize).

## Step 3: Link Your Project
Find your "Reference ID" from your Supabase Dashboard Settings (it looks like `bxklsejtopzevituoaxk`).
Run:
```bash
supabase link --project-ref bxklsejtopzevituoaxk
```
(Enter your database password if prompted).

## Step 4: Deploy the Function
Run this command in your project folder:
```bash
supabase functions deploy siwe-login
```

## Step 5: Set Environment Variables
The function needs your secret key to sign tokens. Run this:
```bash
supabase secrets set --env-file .env
```
*Make sure your `.env` file contains `SUPABASE_SERVICE_ROLE_KEY`.*

If you don't have it in .env, run this command manually (replace valid key):
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 6: Verify
Once deployed, refresh your site and try connecting your wallet. It should now verify through the server!
