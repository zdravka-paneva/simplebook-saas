# SimpleBook SaaS - Deployment Guide

This guide provides step-by-step instructions for deploying SimpleBook SaaS to production.

## Prerequisites

✅ Node.js 18+ installed and npm  
✅ GitHub account with repository initialized  
✅ Supabase project created  
✅ Production build tested locally (`npm run build` succeeds)  

## 1. Prepare Environment for Production

### Create Supabase Storage Bucket

The application requires a Storage bucket for profile pictures and document uploads.

**Steps:**
1. Login to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **Create a new bucket**
5. Configure:
   - **Bucket name:** `user-uploads`
   - **Public bucket:** Toggle ON (for direct download access)
   - **File size limit:** 5 MB recommended
6. Click **Create bucket**

### Set RLS Policies for Storage

In the `user-uploads` bucket, set these policies:

**For authenticated users (upload permission):**
```sql
-- Allow authenticated users to upload to their own folder
create policy "Allow authenticated upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'user-uploads' AND
  auth.uid()::text || '/' IN (SELECT auth.uid()::text)
);
```

**For public read access:**
```sql
-- Allow public read access to all files
create policy "Allow public read"
on storage.objects
for select
to public
using (bucket_id = 'user-uploads');
```

### Verify Environment Variables

Ensure your `.env.local` has these variables:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

**Note:** These are PUBLIC keys. The `ANON_KEY` is safe to expose in the frontend (it's restricted by RLS policies).

## 2. Deploy to Netlify

### Option A: Automatic Git Deployment (Recommended)

**Setup:**
1. Push your repository to GitHub
2. Visit [Netlify](https://app.netlify.com)
3. Click **Add new site** → **Import an existing project**
4. Select GitHub, authorize, and choose your repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Click **Deploy site**

**Add Environment Variables:**
1. In Netlify dashboard, go to **Site settings** → **Build & deploy** → **Environment**
2. Click **Edit variables**
3. Add:
   - Key: `VITE_SUPABASE_URL` | Value: `https://xxxxx.supabase.co`
   - Key: `VITE_SUPABASE_ANON_KEY` | Value: `eyJhbGciOi...`
4. Save and redeploy

**Deploy again:**
- Go to **Deploys** → **Trigger deploy** → **Deploy site**
- Wait for deployment to complete (usually 2-5 minutes)

### Option B: Manual Deployment

```bash
# Build locally
npm run build

# Install Netlify CLI (optional)
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

## 3. Deploy to Vercel

### Option A: Git-Based Deployment

1. Visit [Vercel New Project](https://vercel.com/new)
2. Import your GitHub repository
3. Select the project as scope
4. Configure project:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **Deploy**

### Option B: CLI Deployment

```bash
npm install -g vercel

npm run build

vercel --prod
```

## 4. Post-Deployment Configuration

### A. Test the Application

1. Visit your deployed URL
2. Test these workflows:
   - **Landing page:** Loads without errors
   - **Register:** Create a business account
   - **Login:** Login with created account
   - **Dashboard:** All stats load correctly
   - **Profile picture:** Upload and display works
   - **Services:** Create a test service
   - **Booking page:** View services from public link

### B. Verify Supabase Connection

Open browser DevTools (F12) and check:

**Console tab:**
- No errors about missing API keys
- No "Cannot read property of undefined" errors

**Network tab:**
- API calls to `supabase.co` succeed (200-201 status)
- Storage URLs load correctly

### C. Test Edge Cases

1. **Logout/Login flow:** Session persists correctly
2. **Multiple browser tabs:** User state syncs
3. **Mobile responsiveness:** Use device emulation in DevTools
4. **File upload:** Test profile picture upload
5. **Appointments:** Create and update appointments

## 5. Monitoring & Maintenance

### Set Up Error Tracking (Optional)

```javascript
// Add to main.js for Sentry/Rollbar error tracking
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
});
```

### Monitor Supabase Metrics

In Supabase dashboard:
- **Database:** Check query performance
- **Auth:** Monitor login/signup events
- **Storage:** Track file uploads/downloads
- **Edge Functions:** Monitor function executions (if used)

### Set Up Alerts

Example Netlify alert:
1. Go to **Site settings** → **Notifications**
2. Enable **Failed deploys** notifications
3. Add your email

Example Supabase alert:
1. Go to **Project settings** → **Integrations**
2. Connect to Slack (optional)

## 6. Troubleshooting Deployment Issues

### Issue: "Cannot find VITE_SUPABASE_URL"

**Solution:**
- Ensure environment variables are set in your deployment platform
- Rebuild/redeploy after adding variables
- Verify variable names exactly match (case-sensitive)

### Issue: "RLS policy violation on profiles table"

**Solution:**
- Check RLS policies are correctly configured
- Ensure `profile_image_url` column exists and is nullable
- Test with raw API call in Supabase SQL editor

### Issue: "Great! You've signed up. An email has been sent"

**Solution:**
- Email confirmation is optional in Supabase
- You can disable email confirmation:
  1. Go to **Auth** → **Providers** → **Email**
  2. Toggle **Confirm email** OFF
  3. Click **Save**

### Issue: Storage uploads return 403 Forbidden

**Solution:**
- Check Storage bucket is public
- Verify RLS policies allow inserts for authenticated users
- Test with Supabase Storage browser in dashboard

### Issue: Blank page or "Cannot get /"

**Solution:**
- Verify build completed successfully: `npm run build`
- Check Netlify/Vercel build logs for errors
- Ensure `dist/index.html` exists
- Check deployment points to correct directory

## 7. Rollback Procedure

### Netlify

1. Go to **Deploys**
2. Find previous successful deployment
3. Click **...** → **Redeploy**
4. Confirmation: "Deployment redeploy triggered"

### Vercel

1. Go to **Deployments**
2. Find previous successful deployment
3. Click **Promote to Production**

## 8. Scaling & Performance

### Optimize Bundle Size

```bash
npm run build

# Check bundle size
npm install -g source-map-explorer
source-map-explorer 'dist/**/*.js'
```

### Enable CDN Caching

In Netlify/Vercel, configure cache headers:

```
Headers {
  /assets/*
    Cache-Control: public, max-age=31536000, immutable
  /
    Cache-Control: public, max-age=3600
}
```

### Monitor Performance

- Use Chrome DevTools → Lighthouse for performance audit
- Check Netlify/Vercel analytics
- Monitor Supabase database query performance

## 9. Additional Resources

📚 [Supabase Deployment Guide](https://supabase.com/docs/guides/hosting/storage)  
📚 [Netlify Deployment Docs](https://docs.netlify.com/)  
📚 [Vercel Documentation](https://vercel.com/docs)  
📚 [Vite Build Config](https://vitejs.dev/config/)  

## 10. Quick Reference

| Task | Command |
|------|---------|
| Build locally | `npm run build` |
| Preview build | `npm run preview` |
| Deploy to Netlify | Via GitHub push + auto-deploy |
| Deploy to Vercel | Via GitHub push + auto-deploy |
| Rollback deployment | Use platform dashboard |
| View build logs | Netlify/Vercel dashboard |
| Update env variables | Platform dashboard settings |

---

**Last Updated:** March 2, 2026  
**Status:** Ready for Production
