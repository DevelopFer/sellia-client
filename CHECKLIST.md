# Digital Ocean Client Deployment Checklist

## Pre-Deployment ✅

- [x] **Production Dockerfile created** (`Dockerfile.production`)
- [x] **Nginx configuration optimized** (`nginx.conf`) 
- [x] **Environment variables configured** (`.env.production.example`)
- [x] **Build scripts updated** (`npm run build:prod`)
- [x] **Digital Ocean app spec created** (`.do/app.yaml`)
- [x] **Production build tested locally** ✅

## Deployment Steps

### Option 1: Static Site Deployment (Recommended - $0-3/month)

1. **Create GitHub Repository** (if not already done):
   ```bash
   # Create new repo for client only
   gh repo create sellia-client --public
   ```

2. **Update Environment Variables**:
   - Copy `.env.production.example` to `.env.production`
   - Update `VITE_API_URL` with your API app URL
   - Update `VITE_SOCKET_URL` with your API app URL

3. **Deploy via Digital Ocean UI**:
   - Go to https://cloud.digitalocean.com/apps
   - Create App → GitHub → Select client repository
   - **Important**: Choose "Static Site" (not Web Service)
   - Build Command: `npm run build:prod`
   - Output Directory: `dist`
   - Set environment variables from step 2

### Option 2: Dockerized Deployment ($5+/month)

1. Follow steps 1-2 above
2. Deploy via Digital Ocean UI:
   - Choose "Web Service" 
   - Dockerfile Path: `Dockerfile.production`
   - HTTP Port: `80`
   - Set environment variables

## Post-Deployment

- [ ] **Test deployment URL**
- [ ] **Verify API connections work**
- [ ] **Test WebSocket connections**
- [ ] **Check all routes work correctly**
- [ ] **Verify mobile responsiveness**
- [ ] **Set up custom domain** (optional)
- [ ] **Configure CORS** in API for new client URL

## Required Environment Variables

Set these in Digital Ocean Apps dashboard:

```
VITE_API_URL=https://your-api-app.ondigitalocean.app/api
VITE_SOCKET_URL=https://your-api-app.ondigitalocean.app
VITE_APP_TITLE=Sellia Chat
VITE_NODE_ENV=production
```

## Testing Commands

```bash
# Test production build locally
npm run build:prod

# Preview production build
npm run preview:prod

# Test with actual API URLs (update .env.local first)
cp .env.production.example .env.local
# Edit .env.local with real API URLs
npm run build:prod
npm run preview:prod
```

## Troubleshooting

### Build Issues
- ✅ Build works locally
- Check environment variables are set
- Verify all dependencies in package.json

### API Connection Issues  
- Update CORS in API to allow client domain
- Check API URL is accessible from internet
- Verify WebSocket endpoint is correct

### Routing Issues
- Static sites: Handled automatically by Digital Ocean
- Docker: nginx.conf includes SPA routing

## Cost Comparison

| Option | Cost | Features |
|--------|------|----------|
| Static Site | $0-3/month | CDN, SSL, 100GB bandwidth |
| Docker Service | $5+/month | Custom nginx, more control |

**Recommendation**: Use Static Site for frontend applications.