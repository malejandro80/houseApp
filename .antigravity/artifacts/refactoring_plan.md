# 🏗️ Refactoring Plan: Project "HouseAppWeb" Structure Alignmemt

## 🎯 Objective
Migrate the current Next.js application to the standard `/src` directory structure defined in the `agents.md` constitution, ensuring strict separation of concerns and type safety without altering the existing functionality.

## 👥 Squad Assignments

### 1. **Project Manager (PM)**
- **Scope Definition**: Define the new directory structure.
- **DoD (Definition of Done)**: The application builds successfully from `/src`, all imports are resolved, and the user experience remains 100% identical.

### 2. **Database Analyst**
- **Task**: Review `supabase_policies.sql`.
- **Action**: Move SQL policies to `/supabase/migrations/` as a proper migration file.
- **Verification**: Ensure types effectively represent the schema.

### 3. **DevOps Engineer**
- **Task**: Infrastructure Setup.
- **Actions**:
  - Create `/src` directory.
  - configure `tsconfig.json` for `@/*` alias pointing to `./src/*`.
  - Update `tailwind.config.ts` to scan `/src`.
  - Move `middleware.ts` to `/src`.

### 4. **Backend/Frontend Engineers (Joint Task)**
- **Task**: Code Migration & Cleanup.
- **Actions**:
  - Move `/app` -> `/src/app`.
  - Move `/utils/supabase` -> `/src/lib/supabase`.
  - Extract `/app/components` -> `/src/components`.
  - Extract `/app/hooks` -> `/src/hooks` (or `/src/lib/hooks`).
  - **Crucial**: Update all import paths (e.g., `../../utils/supabase` to `@/lib/supabase`).

### 5. **QA Engineer**
- **Task**: Verification.
- **Actions**: Run `npm run build` and verify `/mapa` and `/login` functionality in the browser.

## 📅 Execution Steps

1.  **Setup**: Prepare folders and configs.
2.  **Migration**: Move files (File System Operations).
3.  **Refactor**: Update imports (Search & Replace).
4.  **Verify**: Build & Test.
