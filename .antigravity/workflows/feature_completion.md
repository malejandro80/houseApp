---
description: "Workflow to execute after every successful feature implementation or bug fix."
---

# Feature Completion Workflow (Orchestrator Protocol)

## 0. Prerequisite Check (QA Gate)
Before running this workflow, ensure the following steps are complete:
- [ ] `npm run build` passes without errors.
- [ ] Database migrations are applied in Supabase (`supabase db push` check).
- [ ] RLS policies are verified (`view_file supabase_policies.sql`).
- [ ] Manual QA in browser (`open_url`) confirms the feature works as expected.

## 1. Project State Update (`.antigravity/project-state.md`)
You MUST analyze the changes made and update `.antigravity/project-state.md`:

### A. Update Version & Date
- Increment the *Version* (bump minor for features, patch for fixes).
- Update *Last Updated* to the current date.

### B. Append to Implemented Features
- Add a concise bullet point describing the new feature or fix under `## 🚀 Implemented Features`.
- Example: `- **User Settings**: Added ability to change profile picture (Supabase Storage).`

### C. Update Technical Debt / TODOs
- Remove any completed items from `## 📝 Known Issues / TODOs`.
- Add new items if the feature introduced technical debt or future improvements are identified.

## 2. Generate Commit Message (DevOps)
This step acts as the TRIGGER for updating `project-state.md`. 
**Rule:** You CANNOT generate the final commit message until `project-state.md` has been updated with the changes from this commit.

- Update `project-state.md` FIRST (Step 1).
- Then, generate the commit message using Conventional Commits: `feat:`, `fix:`, `chore:`.
- Include the updated `project-state.md` file in the commit.
- Commit Message Footer: `State-Update: .antigravity/project-state.md`

## 3. Final Orchestrator Confirmation
- Ask the user: "Feature X committed and state updated. Ready for next task?"
