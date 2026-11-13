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

XENON CINEMA (DEVELOPMENT PAGE)
The Development page opens with "Cinema, powered by XENON": the real XENON player skin on the official Video.js v10 player, playing Sintel (Blender Foundation, CC BY 3.0) from Mux. Direct link: /development#cinema.
Files: components/XenonPlayer.js (the player), components/CinemaShowcase.js (loads it in the browser), vendor/xenon (a build of the skin from github.com/Chima30/Xenon, see vendor/xenon/README.md), scripts/sync-xenon.mjs (rebuilds vendor/xenon from a XENON checkout).
Packages: @videojs/react and @videojs/mux-video 10.3.0, @fontsource-variable/space-grotesk. No Supabase setup is needed for it.
