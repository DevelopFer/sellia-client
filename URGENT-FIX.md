# URGENT: Fix Digital Ocean Client Deployment

## Current Issue
Your client is running Vite's development server on Digital Ocean instead of serving built static files.

## Solution Steps

### Step 1: Redeploy as Static Site

1. **Go to Digital Ocean Apps Dashboard**:
   - Navigate to your `sellia-client` app
   - Go to Settings → App Spec

2. **Update App Spec** to use static site instead of web service:
   ```yaml
   name: sellia-client
   static_sites:
   - name: frontend
     source_dir: /
     github:
       repo: DevelopFer/sellia-client
       branch: main
     build_command: npm run build:prod
     output_dir: /dist
     environment_slug: node-js
     envs:
     - key: VITE_API_URL
       value: https://sellia-api-9ck6l.ondigitalocean.app/api
     - key: VITE_SOCKET_URL
       value: https://sellia-api-9ck6l.ondigitalocean.app
     - key: VITE_APP_TITLE
       value: Sellia Chat
     - key: VITE_NODE_ENV
       value: production
   ```

3. **Save and Deploy**

### Step 2: Alternative - Fix Current Web Service

If you want to keep it as a web service, update your Digital Ocean app settings:

1. **Change the run command** from `npm run dev` to `npm run preview`
2. **Or better**: Use the static site approach above

### Step 3: Verify Environment Variables

Make sure these are set in Digital Ocean:
- `VITE_API_URL`: https://sellia-api-9ck6l.ondigitalocean.app/api
- `VITE_SOCKET_URL`: https://sellia-api-9ck6l.ondigitalocean.app
- `VITE_NODE_ENV`: production

## Why This Happened

The Vite development server has host restrictions for security. In production, you should:
1. Build the app (`npm run build`)
2. Serve static files (not run dev server)

## Quick Test

To verify the build works locally:
```bash
npm run build:prod
npm run preview:prod
```

The preview should work without host restrictions.