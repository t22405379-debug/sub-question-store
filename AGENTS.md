# Project Instructions & Deployment Guidelines

## 1. Deployment Workflow (CRITICAL)
- **Zero Manual Wrangler Deployments**: NEVER run manual `wrangler pages deploy` commands.
- **Git as Single Source of Truth**: All updates must be committed and pushed to GitHub (`git push origin main`).
- **Automated Cloudflare CI/CD**: Cloudflare Pages is connected to GitHub and automatically builds and deploys on every commit to `main`.

## 2. Authentication & Database
- **No Hardcoded Credentials**: Admin credentials must NEVER be hardcoded in frontend source files. Authentication queries `/api/admin/login` against Cloudflare D1 SQL database (`admin_users` table).
- **Password Hashing**: PBKDF2 with 100,000 iterations, unique 16-byte salt, and constant-time XOR comparison.
- **Dynamic Hierarchy & Exam Types**: All exam types and subjects are 100% database-driven from D1 with no hardcoded fallback filters.

## 3. Storage & AI Architecture
- **Object Storage**: Cloudflare R2 (`sub-question-r2`) with zero-egress fee bandwidth.
- **AI Engine**: Cloudflare Workers AI (`env.AI`) with 10,000 free neurons/day.
