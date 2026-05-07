# Cloudflare Pages Deployment Configuration

## Project: `phosphorus31-org`
- **Build Command:** `pnpm build --filter phosphorus31-org`
- **Output Directory:** `packages/phosphorus31-org/dist`
- **Node.js Version:** 22.x
- **Environment Variables:**
    - `NODE_VERSION`: 22.12.0

## Project: `p31ca-org`
- **Build Command:** `pnpm build --filter p31ca-org`
- **Output Directory:** `packages/p31ca-org/dist`
- **Node.js Version:** 22.x
- **Environment Variables:**
    - `NODE_VERSION`: 22.12.0

## Deployment Instructions
1. **GitHub/GitLab Integration:** Connect both repositories to Cloudflare Pages.
2. **Settings:** Apply the build configurations listed above.
3. **Verify:** Ensure `npm run build` succeeds in the Cloudflare build environment.
4. **Deploy:** Final production launch occurs upon successful build.
