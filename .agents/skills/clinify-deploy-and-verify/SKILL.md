---
name: clinify-deploy-and-verify
description: >-
  Procedure for verifying local build health, running static checks, committing and pushing changes
  for Clinify CRM to trigger Vercel production deployment safely.
---

# Clinify Deploy & Verification Skill

Use this skill whenever changes are made to Clinify (`clinical-crm`) before announcing completion to the user.

## Pre-Deployment Verification Checklist

1. **Test Production Build**:
   Run local Vite production build to ensure zero bundling or import errors:
   `npm run build`

2. **Check for Common White-Screen / Runtime Trap Risks**:
   - Ensure all `t(en, he)` translation function calls import `LanguageContext` (`const { t } = useContext(LanguageContext)`), NOT `ClinicContext`.
   - Ensure all array operations (`.filter()`, `.map()`, `.length`) guard against `null`/`undefined` states with fallback arrays (`(services || []).filter(...)`).
   - Ensure all custom/third-party package imports exist in `package.json`.

3. **Commit & Push to GitHub**:
   Execute standard deployment git push:
   `git add . && git commit -m "<descriptive message>" && git push origin main`

4. **Verify Deployment Status**:
   Confirm that the commit hash matches the latest GitHub push so Vercel auto-deploys cleanly.
