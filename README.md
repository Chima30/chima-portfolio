SETUP
1. Create a free project at supabase.com.
2. Supabase > SQL Editor: paste supabase/schema.sql, change YOUR_EMAIL@example.com to your email, run it.
3. Supabase > Authentication > Users > Add user: same email, a strong password. Then Authentication > Sign In / Providers > turn off "Allow new users to sign up".
4. Copy .env.example to .env.local. Fill in the project URL and anon key (Project Settings > API). Never use the service_role key here.
5. Run: npm install, then npm run dev, then open http://localhost:3000/admin.

DEPLOY (Vercel)
Push the folder to GitHub, import it in Vercel, add the four env vars from .env.example, deploy. Set NEXT_PUBLIC_SITE_URL to your live address.

FIRST ARTWORK
Log in at /admin, choose images to upload (they save as drafts), fill in title and details, tick categories, press Publish. It shows on the site immediately, no redeploy.

DEVELOPMENT PROJECTS
For now, add rows in Supabase > Table Editor > projects (set published = true). Cover images use a file path inside the "art" storage bucket.

SECURITY
Admin rights are enforced by Supabase row level security: only the email in the admins table can write. The anon key in the browser is public by design.
