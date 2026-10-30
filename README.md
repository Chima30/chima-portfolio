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

WHAT CHANGED IN THIS VERSION (design pass)
- Homepage: one large featured piece with the intro beside it. The splash screen, floating shapes, stat tiles and duplicate "Get in touch" buttons are gone. Contact lives on the Contact page and in the footer.
- Gallery: pieces keep their own proportions and get more or less room by orientation, in the order you set in /admin. Click a piece to open the viewer: arrow keys on desktop, swipe on phones, Escape or Close to leave.
- Titles: if a title is just a camera filename (for example 1000196593), the public site shows no caption for it. Add a real title in /admin and it appears. New uploads no longer get the filename as a title.
- Medium: optional new field. To use it, run supabase/add-medium.sql once in Supabase > SQL Editor. The site works without it.
- Development page: plainer, more structured layout, separate in feel from the art.
- No new dependencies. Supabase, the admin, environment variable names and Vercel setup are unchanged.
