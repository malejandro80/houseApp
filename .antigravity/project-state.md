# Project Context & State

## 📊 Current Status
**Version:** 0.2.7-beta
**Last Updated:** 2026-02-10

## 🚀 Implemented Features
- **Refactor**: Renamed folders `mapa` -> `map` and `mis-propiedades` -> `my-properties` to comply with English conventions.
- **New Feature**: "My Properties" view (`/my-properties`) listing saved properties.
- **Form Upgrade**: Added optional `Title` and `Contact Phone` fields.
- **Agent Protocol**: Enforced **ENGLISH ONLY** for code, files, and variables.
- **Map UX**: Added automatic User Geolocation and centering (`flyTo`) in `LocationPicker`.
- **Database Mod**: Added 1:N relation (`datahouse` -> `users`) and updated RLS Policies.
- **Backend Logic**: Updated `PropertyForm` to save `user_id` on new entries.
- **UI/Copy Refresh**: Updated `PropertyForm` with cleaner texts and inputs.
- **Bug Fix**: Fixed Hydration Error in `FinancialDashboard.tsx`.
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
