# Deployment Guide - Rep Sales Practice Platform

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  USER'S BROWSER                                         │
│  (visits your-app.vercel.app)                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│  VERCEL (Frontend Hosting)                              │
│  • Hosts Next.js React app                              │
│  • Serves HTML, CSS, JavaScript                         │
│  • User interface and client-side logic                 │
│  URL: https://rep-sales.vercel.app                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ HTTP/HTTPS Requests
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│  RAILWAY (Backend Hosting)                              │
│  • Hosts Python/FastAPI backend                         │
│  • Processes AI requests, manages sessions              │
│  • Handles business logic and data processing           │
│  URL: https://rep-backend.railway.app                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─────────────┬──────────────┐
                 │             │              │
                 ↓             ↓              ↓
         ┌──────────┐   ┌──────────┐   ┌──────────┐
         │ Supabase │   │  Claude  │   │   Vapi   │
         │ Database │   │   API    │   │ Voice AI │
         └──────────┘   └──────────┘   └──────────┘
```

## How Services Connect

**Vercel ↔ Railway Connection:**
- **Type**: HTTP/HTTPS requests over the internet
- **Method**: Frontend makes API calls to backend URL
- **Configuration**: Environment variable `NEXT_PUBLIC_API_URL` points to Railway backend
- **No Special Integration**: They're independent services that communicate via standard HTTP

**Think of it like:**
- 🏠 **Vercel** = Storefront (what customers see)
- 🏭 **Railway** = Factory/Warehouse (where work happens)
- 📞 **HTTP Requests** = Phone calls between them

---

## Deployment Strategy

### Recommended Order:

1. **Deploy Frontend to Vercel** (15 min) - Get UI live quickly
2. **Deploy Backend to Railway** (30 min) - Get API running
3. **Connect Them** (2 min) - Update environment variables

### Why This Order?
✅ See progress fast - Frontend live in 15 minutes
✅ Test each piece independently
✅ Minimal risk - Deploy in stages
✅ Professional - Both services on proper hosting

---

## Step 1: Deploy Frontend to Vercel

### Prerequisites
- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Code pushed to GitHub repository

### Deployment Steps

#### Option A: Using Vercel Web Interface (Recommended for First Time)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Click "Add New Project"

2. **Import Repository**
   - Connect your GitHub account if not already connected
   - Select your `convo-ai` repository
   - Vercel will auto-detect it's a Next.js app

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

4. **Set Environment Variables**
   Click "Environment Variables" and add:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tmysbwpzpjbcyjwhxojy.supabase.co/
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteXNid3B6cGpiY3lqd2h4b2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNDY2MjQsImV4cCI6MjA3NjkyMjYyNH0.DDGvXKOyyAU42uDCsI5NeTzNu8Pf8USwQ5XLvjOsyUg
   NEXT_PUBLIC_VAPI_PUBLIC_KEY=e5ef62e6-0623-40a9-94e4-48ed1367655f
   NEXT_PUBLIC_API_URL=https://placeholder-backend.com
   ```

   **Note:** We'll update `NEXT_PUBLIC_API_URL` after deploying the backend.

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - You'll get a URL like `https://rep-sales.vercel.app`

6. **Test**
   - Visit your deployed URL
   - UI should load and look correct
   - Some features may show errors (expected until backend is deployed)

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd /path/to/convo-ai/frontend

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? rep-frontend
# - Directory? ./
# - Build settings? Yes (accept defaults)

# After successful deployment, add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_VAPI_PUBLIC_KEY
vercel env add NEXT_PUBLIC_API_URL

# Redeploy with environment variables
vercel --prod
```

### Post-Deployment: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `rep.yourdomain.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate to be issued (automatic)

---

## Step 2: Deploy Backend to Railway

### Prerequisites
- Railway account (sign up at [railway.app](https://railway.app))
- GitHub repository with backend code
- Supabase database already set up

### Deployment Steps

#### 1. Create New Project on Railway

1. **Go to Railway Dashboard**
   - Visit [railway.app/new](https://railway.app/new)
   - Click "New Project"

2. **Deploy from GitHub**
   - Select "Deploy from GitHub repo"
   - Connect GitHub account if not already connected
   - Select your `convo-ai` repository
   - Railway will scan for services

3. **Configure Service**
   - Railway should auto-detect Python/FastAPI
   - **Root Directory**: `backend` (if prompted)
   - **Start Command**: Railway usually auto-detects, but if needed: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### 2. Set Environment Variables

In Railway project settings, add these environment variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://tmysbwpzpjbcyjwhxojy.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Vapi Voice AI
VAPI_API_KEY=your_vapi_private_api_key
VAPI_WEBHOOK_SECRET=your_vapi_webhook_secret

# Backend Configuration
PORT=8000
ENVIRONMENT=production

# CORS Origins (update after getting Vercel URL)
ALLOWED_ORIGINS=https://rep-sales.vercel.app,https://your-custom-domain.com

# Database (if using PostgreSQL directly)
DATABASE_URL=your_postgres_connection_string
```

**Important:** Get `SUPABASE_SERVICE_KEY` from:
- Supabase Dashboard → Settings → API → service_role key (secret)

#### 3. Deploy

- Railway will automatically deploy after configuration
- Wait 3-5 minutes for deployment
- You'll get a URL like `https://rep-backend-production.up.railway.app`

#### 4. Test Backend

```bash
# Test health endpoint
curl https://your-backend.railway.app/health

# Should return: {"status": "healthy"}
```

---

## Step 3: Connect Frontend and Backend

### Update Frontend Environment Variables

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Go to Settings → Environment Variables

2. **Update API URL**
   - Find `NEXT_PUBLIC_API_URL`
   - Update value to your Railway backend URL:
   ```
   NEXT_PUBLIC_API_URL=https://rep-backend-production.up.railway.app
   ```

3. **Redeploy Frontend**
   - Vercel will automatically redeploy when you change environment variables
   - Or manually trigger: Go to Deployments → Click "..." → Redeploy

### Update Backend CORS Settings

1. **Go to Railway Dashboard**
   - Navigate to your backend project
   - Go to Variables

2. **Update ALLOWED_ORIGINS**
   ```
   ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-custom-domain.com
   ```

3. **Railway Auto-Redeploys**
   - Changes trigger automatic redeployment

---

## Step 4: Verify End-to-End Connection

### Test Checklist

- [ ] Frontend loads at Vercel URL
- [ ] No console errors related to API calls
- [ ] Can register/login (tests Supabase connection)
- [ ] Dashboard loads user data (tests backend connection)
- [ ] Can create practice session (tests full stack)
- [ ] Voice AI works (tests Vapi integration)

### Debugging Connection Issues

**Frontend can't reach backend:**
1. Check browser console for CORS errors
2. Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
3. Check Railway logs for incoming requests
4. Verify `ALLOWED_ORIGINS` includes your Vercel URL

**Backend errors:**
1. Check Railway logs: Railway Dashboard → Deployments → View Logs
2. Verify all environment variables are set
3. Test backend endpoints directly with curl
4. Check Supabase connection string

---

## Environment Variables Reference

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public) | `eyJhbGc...` |
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | Vapi public API key | `e5ef62e6-...` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://xxx.railway.app` |

### Backend (Railway)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (secret) | Supabase Dashboard → Settings → API |
| `ANTHROPIC_API_KEY` | Claude API key | [Anthropic Console](https://console.anthropic.com) |
| `VAPI_API_KEY` | Vapi private API key | [Vapi Dashboard](https://vapi.ai) |
| `VAPI_WEBHOOK_SECRET` | Vapi webhook secret | Vapi Dashboard → Settings |
| `PORT` | Server port | `8000` (Railway auto-sets `$PORT`) |
| `ALLOWED_ORIGINS` | CORS allowed origins | Your Vercel URL |

---

## Ongoing Maintenance

### Automatic Deployments

Both Vercel and Railway support automatic deployments:

- **Vercel**: Deploys automatically on every push to `main` branch
- **Railway**: Deploys automatically on every push to `main` branch

### Manual Deployments

**Vercel:**
```bash
cd frontend
vercel --prod
```

**Railway:**
- Push to GitHub (auto-deploys)
- Or use Railway CLI: `railway up`

### Viewing Logs

**Vercel:**
- Dashboard → Project → Deployments → Click deployment → View Function Logs
- Or CLI: `vercel logs`

**Railway:**
- Dashboard → Project → Deployments → View Logs
- Real-time logs available in dashboard

### Rollback

**Vercel:**
- Dashboard → Deployments → Select previous deployment → Promote to Production

**Railway:**
- Dashboard → Deployments → Select previous deployment → Redeploy

---

## Cost Estimates

### Free Tier Limits

**Vercel (Hobby):**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Custom domains
- ⚠️ No team collaboration

**Railway (Free):**
- ✅ $5 credit/month (usually covers small apps)
- ✅ Automatic deployments
- ✅ Environment variables
- ⚠️ Sleep after inactivity (can disable with credit)

**Supabase (Free):**
- ✅ 500 MB database
- ✅ 2 GB bandwidth
- ✅ Automatic backups
- ⚠️ Project pauses after 7 days inactivity

### Expected Costs for Production

**Monthly estimates for moderate usage (~100-500 users):**

- **Vercel Pro**: $20/month (if you need team features)
- **Railway**: $5-20/month (depends on usage)
- **Supabase Pro**: $25/month (if you exceed free tier)
- **Claude API**: $10-50/month (based on usage)
- **Vapi**: $0.90-1.65 per 15-min session

**Total: ~$60-115/month** for a production app with moderate traffic

---

## Troubleshooting

### Common Issues

**Build fails on Vercel:**
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Try building locally: `npm run build`
- Check Node.js version compatibility

**Backend won't start on Railway:**
- Check Railway logs for error messages
- Verify Python version in `runtime.txt` or `Dockerfile`
- Ensure all required dependencies in `requirements.txt`
- Check environment variables are set correctly

**CORS errors:**
- Verify `ALLOWED_ORIGINS` includes your Vercel URL (with https://)
- Check for typos in URLs
- Ensure no trailing slashes in URLs
- Check Railway logs to see if requests are reaching backend

**Database connection issues:**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
- Check Supabase project is not paused
- Test connection with Supabase client library
- Check Railway logs for connection errors

---

## Security Checklist

Before going to production:

- [ ] All API keys stored in environment variables (not in code)
- [ ] CORS configured to allow only your domains
- [ ] Supabase Row Level Security (RLS) enabled
- [ ] Rate limiting implemented on backend
- [ ] HTTPS enforced (automatic on Vercel/Railway)
- [ ] Sensitive data encrypted in database
- [ ] Regular security updates for dependencies
- [ ] Error messages don't expose sensitive information

---

## Next Steps

After successful deployment:

1. **Set up monitoring**
   - Vercel Analytics (built-in)
   - Railway metrics dashboard
   - Sentry for error tracking

2. **Configure custom domain**
   - Purchase domain from Namecheap, Google Domains, etc.
   - Add to Vercel project
   - Update CORS settings

3. **Set up CI/CD enhancements**
   - Add automated tests
   - Preview deployments for pull requests
   - Staging environment

4. **Performance optimization**
   - Enable Vercel Edge Functions if needed
   - Optimize images
   - Add caching strategies

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **FastAPI Deployment**: https://fastapi.tiangolo.com/deployment/

---

## Questions or Issues?

If you encounter problems during deployment:

1. Check the troubleshooting section above
2. Review deployment logs in Vercel/Railway dashboards
3. Test components independently (frontend, backend, database)
4. Verify all environment variables are set correctly

---

**Last Updated**: 2025-10-26
**Status**: Ready for deployment
