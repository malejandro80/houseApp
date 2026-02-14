# Project Constitution & Squad Protocols: [Nombre de tu App]

## 🎯 Global Mission
This project is a Fullstack application built with Next.js 15+ (App Router) and Supabase (Auth/Database/Storage), deployed on Vercel. Our goal is to maintain a professional-grade, type-safe, and highly scalable codebase.

## 🤖 The Squad System (Multi-Agent Orchestration)
This project uses a specialized agentic workflow coordinate from `.antigravity/agents/`:

### 📦 Product Squad (`/agents/product`)
- **CEO-Orchestrator:** Lead Coordination & Strategic Vision (Ex-Big Tech).
- **PM:** Product Strategy & Requirements.
- **Copywriter:** Content Strategy, Tone & Voice (Spanish).
- **UX/UI:** Design System & User Experience.
- **Sales Specialist:** Growth & Monetization.
- **Real Estate Expert:** Market Domain & Valuation.
- **Creative Visionary:** Innovation & Aesthetics.
- **Accountant:** Financial Stability & Pricing.
- **Lawyer:** Legal Compliance & Risk.

### 🛠 Tech Squad (`/agents/tech`)
- **Database Analyst:** Supabase Schema & ACID Security.
- **Backend Dev:** Server Actions & Supabase Logic.
- **Frontend Dev:** React & Leaflet Implementation.
- **Security Expert:** RLS Hardening & Auth Security.
- **QA:** Quality Assurance & Testing.
- **DevOps:** CI/CD & Build Verification.

## 🛠 Technical Standards (The Golden Rules)
1. **Architecture:** All application code MUST reside in the `/src` directory (`/src/app`, `/src/components`, `/src/actions`, etc.).
2. **Database First:** No code shall be written before the 'Database Analyst' confirms the schema. Designs MUST follow **ACID** properties and **Database Normalization** standards (3NF+) to ensure data integrity and minimize redundancy.
3. **Type Safety:** TypeScript is non-negotiable. Prefer `interfaces` over `types`. Use generated Supabase types for all DB operations.
4. **Performance:** Prioritize Server Components. Use `'use client'` strictly for interactivity or Web APIs. Wrap client components in `Suspense`.
5. **English Standard:** All code, file names, folder names, commit messages, and variable names MUST be in English. Spanish is ONLY allowed for user-facing strings (UI text).
6. **Security:** RLS must be enabled on all tables. Never use `service_role` in the frontend or standard server actions.
7. **Dependency Management:** ALWAYS run `pnpm install` (or equivalent) to update the lockfile (`pnpm-lock.yaml`) whenever `package.json` is modified. This prevents `ERR_PNPM_OUTDATED_LOCKFILE` during Vercel deployment.
8. **SQL Scripts:** All SQL files MUST reside in the `supabase` directory. Use `supabase/migrations` for schema changes and `supabase/scripts` for auxiliary scripts (seeds, setup, maintenance). Do NOT place SQL files in the project root.
9. **Documentation & Artifacts:** All files containing business descriptions, product requirements, team reviews, or architectural plans (e.g., `product_team_review.md`) MUST be stored in `.antigravity/artifacts/` to keep the root directory clean.

## 📁 Naming Conventions
- **Folders:** always-kebab-case (English), e.g., `/my-properties`, `/user-profile`.
- **Files:** PascalCase for Components (`UserProfile.tsx`), camelCase for utilities (`formatDate.ts`), kebab-case for assets (`hero-image.png`).
- **Variables/Functions:** camelCase (English), e.g., `calculateProfitability`, `isValid`.
- **Commits:** Conventional Commits (English), e.g., `feat(auth): add google provider`.

## 🔄 Execution Workflow
1. **Discovery:** The Orchestrator summons the PM and Copywriter to define the plan and copy.
2. **Design:** UX/UI and Database Analyst define the interface and data contract.
3. **Implementation:** Backend and Frontend agents build the feature using `/src` modular standards.
4. **Verification (QA + Copy):** Manual browser test for functionality and tone check.
5. **Release (Auto):** Commit executes WITHOUT asking. Build check runs afterward.

## 💬 Communication
- Agents must communicate through the Orchestrator.
- Use **Artifacts** to display complex plans, SQL migrations, or UI previews.
- Maintain a concise, technical, and objective tone.

"Follow the rules, build for scale, and never compromise on type safety."