# Digital Ocean Client Deployment Guide

This guide explains how to deploy the Sellia Vue.js client to Digital Ocean App Platform.

## Deployment Options

### Option 1: Static Site (Recommended - Lower Cost)
Digital Ocean can serve your Vue.js app as a static site, which is more cost-effective for frontend applications.

**Advantages:**
- Lower cost ($0-$3/month)
- Automatic SSL certificate
- Global CDN
- Automatic scaling

### Option 2: Dockerized Service (More Control)
Deploy using the production Dockerfile with nginx serving the built assets.

**Advantages:**
- More control over server configuration
- Custom nginx settings
- Easier to add server-side features later

## Setup Instructions

### Prerequisites
1. **Digital Ocean Account**: Sign up at [digitalocean.com](https://digitalocean.com)
2. **GitHub Repository**: Client code should be in a separate repository
3. **API Deployment**: Your API should already be deployed and accessible

### Step 1: Prepare Your Environment Variables

Update `.env.production` with your actual API URLs:

```bash
VITE_API_URL=https://your-api-app-name.ondigitalocean.app/api
VITE_SOCKET_URL=https://your-api-app-name.ondigitalocean.app
VITE_APP_TITLE=Sellia Chat
VITE_NODE_ENV=production
```

### Step 2: Deploy via Digital Ocean UI

#### For Static Site (Recommended):
1. Go to [Digital Ocean Apps](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Choose "GitHub" as source
4. Select your client repository and main branch
5. **Important**: Select "Static Site" (not "Web Service")
6. Configure build settings:
   - **Build Command**: `npm run build:prod`
   - **Output Directory**: `dist`
7. Set environment variables (see Step 1)
8. Deploy!

#### For Dockerized Service:
1. Follow steps 1-4 above
2. Select "Web Service"
3. Configure build settings:
   - **Dockerfile Path**: `Dockerfile.production`
   - **HTTP Port**: `80`
4. Set environment variables
5. Deploy!

### Step 3: Configure Custom Domain (Optional)

1. In your app dashboard, go to "Settings" → "Domains"
2. Add your custom domain
3. Update DNS records as instructed
4. SSL certificate will be automatically provisioned

## Environment Variables

Set these in the Digital Ocean Apps dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Your API endpoint | `https://sellia-api.ondigitalocean.app/api` |
| `VITE_SOCKET_URL` | WebSocket endpoint | `https://sellia-api.ondigitalocean.app` |
| `VITE_APP_TITLE` | Application title | `Sellia Chat` |
| `VITE_NODE_ENV` | Environment | `production` |

## Build Configuration

The production build includes:
- ✅ TypeScript compilation
- ✅ Vue.js optimization
- ✅ Asset bundling and minification
- ✅ Tree shaking for smaller bundle size
- ✅ Static asset optimization

## CORS Configuration

Make sure your API allows requests from your client domain. Update your API's CORS configuration:

```typescript
// In your API configuration
cors: {
  origin: [
    'https://your-client-app.ondigitalocean.app',
    'https://your-custom-domain.com'
  ]
}
```

## Troubleshooting

### Build Failures
- Check that all dependencies are in `package.json`
- Verify TypeScript compilation succeeds locally
- Ensure environment variables are set correctly

### API Connection Issues
- Verify API URL is correct and accessible
- Check CORS configuration in your API
- Ensure API is deployed and running

### Routing Issues (404 on refresh)
- For static sites: Digital Ocean handles SPA routing automatically
- For dockerized: The nginx.conf includes SPA routing configuration

## Cost Optimization

### Static Site (Recommended):
- **Free tier**: Up to 3 static sites
- **Paid**: $3/month for additional sites
- Includes: 100GB bandwidth, global CDN, SSL

### Web Service:
- **Basic**: $5/month (512MB RAM, 1 vCPU)
- **Professional**: $12/month (1GB RAM, 1 vCPU)

## Monitoring and Logs

1. **Access Logs**: Available in the Digital Ocean dashboard
2. **Build Logs**: Monitor deployment process
3. **Runtime Logs**: For dockerized deployments
4. **Analytics**: Use tools like Google Analytics for user tracking

## Security Best Practices

- ✅ HTTPS enforced automatically
- ✅ Security headers configured in nginx
- ✅ Environment variables for sensitive configuration
- ✅ No API keys in client-side code
- ✅ CORS properly configured

## Deployment Commands

For automated deployment using doctl CLI:

```bash
# Install doctl
brew install doctl  # macOS

# Authenticate
doctl auth init

# Deploy using app spec
doctl apps create --spec .do/app.yaml

# Update existing app
doctl apps update YOUR_APP_ID --spec .do/app.yaml
```

## Local Testing

Test your production build locally:

```bash
# Build for production
npm run build:prod

# Preview production build
npm run preview:prod

# Test with production environment
cp .env.production.example .env.local
# Edit .env.local with your API URLs
npm run build:prod
npm run preview:prod
```