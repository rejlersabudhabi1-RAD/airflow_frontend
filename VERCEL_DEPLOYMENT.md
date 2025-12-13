# Vercel Deployment Guide

## Quick Deployment Steps

### 1. Prerequisites
- GitHub repository connected to Vercel
- Vercel account setup

### 2. Automatic Deployment
Vercel will auto-deploy from your GitHub repository with these configurations:

**Framework Preset**: Vite
**Build Command**: `npm run build`
**Output Directory**: `dist`
**Install Command**: `npm install`

### 3. Environment Variables (Required)
Set in Vercel Dashboard → Settings → Environment Variables:

```bash
VITE_API_URL=https://your-railway-backend.railway.app
```

### 4. Domain Configuration
- Production: `https://your-project.vercel.app`
- Custom domain: Configure in Vercel dashboard

---

## Fixes Applied

### ✅ Problem 1: Output Directory Mismatch
**Error**: "No Output Directory named 'dist' found"

**Solution**: Changed `vite.config.js`:
```javascript
build: {
  outDir: 'dist',  // Changed from 'build'
  sourcemap: true,
}
```

### ✅ Problem 2: MODULE_TYPELESS_PACKAGE_JSON Warning
**Error**: "Module type of postcss.config.js is not specified"

**Solution**: Added to `package.json`:
```json
{
  "type": "module"
}
```

### ✅ Problem 3: Vite CJS API Deprecation
**Warning**: "The CJS build of Vite's Node API is deprecated"

**Solution**: Using ES modules with `"type": "module"` resolves this automatically.

---

## Deployment Workflow

### First Time Setup
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository: `rejlersabudhabi1-RAD/airflow_frontend`
4. Configure:
   - Framework Preset: **Vite**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add environment variable:
   - `VITE_API_URL` = Your Railway backend URL
6. Click "Deploy"

### Subsequent Deployments
- Automatic on every push to `main` branch
- Preview deployments for pull requests

---

## Verify Deployment

### 1. Build Locally
```bash
cd frontend
npm install
npm run build
```

Should create `dist/` directory with:
```
dist/
  ├── index.html
  ├── assets/
  │   ├── index-[hash].css
  │   └── index-[hash].js
```

### 2. Preview Locally
```bash
npm run preview
```
Opens at `http://localhost:4173`

### 3. Check Vercel Logs
- Dashboard → Your Project → Deployments
- Click latest deployment → View Function Logs

---

## Common Issues & Solutions

### Issue: API Requests Failing
**Cause**: CORS or incorrect API URL

**Solution**:
1. Verify `VITE_API_URL` environment variable in Vercel
2. Update Railway backend CORS settings:
   ```python
   # settings.py
   CORS_ALLOWED_ORIGINS = [
       'https://your-frontend.vercel.app',
   ]
   ```

### Issue: 404 on Page Refresh
**Cause**: SPA routing not configured

**Solution**: `vercel.json` already includes rewrites:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Issue: Environment Variables Not Working
**Cause**: Variables must start with `VITE_`

**Solution**: All frontend env vars must be prefixed:
- ✅ `VITE_API_URL`
- ❌ `API_URL`

---

## Performance Optimization

### 1. Caching Strategy
`vercel.json` configures aggressive caching for assets:
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### 2. Build Optimization
Already configured in `vite.config.js`:
- Code splitting
- Tree shaking
- Minification
- Source maps for debugging

---

## CI/CD Pipeline

### GitHub → Vercel Flow
1. Push code to GitHub
2. Vercel detects changes
3. Runs `npm install`
4. Runs `npm run build`
5. Deploys `dist/` directory
6. Sends deployment notification

### Deployment Status
- ✅ Success: Green checkmark in GitHub PR
- ❌ Failed: Red X with error logs
- 🟡 Building: Yellow dot

---

## Rollback Strategy

### Option 1: Vercel Dashboard
1. Dashboard → Deployments
2. Find previous successful deployment
3. Click three dots → Promote to Production

### Option 2: Git Revert
```bash
git revert HEAD
git push origin main
```
Vercel auto-deploys the reverted version.

---

## Production Checklist

- [x] `vite.config.js` outputs to `dist/`
- [x] `package.json` has `"type": "module"`
- [x] `vercel.json` created with proper config
- [ ] Set `VITE_API_URL` in Vercel environment variables
- [ ] Update Railway backend CORS with Vercel domain
- [ ] Test deployment with `npm run build` locally
- [ ] Verify all routes work after deployment
- [ ] Check API connectivity from deployed frontend

---

## Monitoring

### Vercel Analytics
Enable in Dashboard → Settings → Analytics for:
- Page views
- User locations
- Performance metrics
- Core Web Vitals

### Error Tracking
Consider integrating:
- Sentry
- LogRocket
- Datadog RUM

---

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Railway CORS Setup](https://docs.railway.app/guides/cors)
