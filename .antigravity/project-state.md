# Project Context & State

## 📊 Current Status
**Version:** 0.2.2-beta
**Last Updated:** 2026-02-10

## 🚀 Implemented Features
- **UI Fix**: Refactored `FinancialDashboard` cards to prevent tooltip clipping (removed `overflow-hidden` from parent).
- **Bug Fix**: Fixed Hydration Error in `FinancialDashboard.tsx` (`<div>` inside `<p>`).
- **Project Structure**: FULL REFACTOR to `/src` directory architecture.
- **Database**: SQL Policies migrated to `/supabase/migrations`.
- **Imports**: Standardized imports using `@/lib` alias.
- **Authentication**: Basic Auth flow (`/auth`, `/login`) integrated with Supabase.
- **Maps**: Interactive Property Map (`/mapa`) using Leaflet.
- **Data**: `datahouse` table for property listings.

## 🛠 Active Technical Stack
- **Frontend**: React 19, Lucide React, Leaflet.
- **Backend**: Next.js Server Actions, Supabase Client.
- **DevOps**: Vercel Deployment, GitHub Actions (CI/CD pending).

## 📝 Known Issues / TODOs
- [ ] Add comprehensive E2E tests.
- [ ] Implement user profile management.
- [ ] Optimize map loading for large datasets.
