---
name: clinify-catalog-and-billing
description: >-
  Guidelines and workflows for extending Clinify's Unified Offerings Catalog (Services, Packages,
  Products, Subscriptions) and Universal Payment & Punch-Card Redemption engine.
---

# Clinify Unified Catalog & Billing Engine Skill

Use this skill when modifying offerings, adding item types, or altering payment and punch-card package logic.

## Architecture Guidelines

1. **Catalog Types**:
   All catalog items belong to one of 4 types defined in `ServicesCatalog.jsx`:
   - `service`: Single Treatment ( טיפול בודד )
   - `package`: Punch Card / Package ( כרטיסייה / חבילה ) -> requires `session_count`
   - `product`: Physical Product ( מוצר פיזי ) -> duration is 0
   - `subscription`: Mentorship / Subscription ( מנוי חודשי )

2. **Universal Payment Logging**:
   Inside `FinancialManager.jsx`, selecting any item from `services` automatically populates the price and description. If the item is of type `package`, `addPayment` in `ClinicContext.jsx` must automatically trigger `issuePackageToPatient`.

3. **Session Redemption**:
   In `ClientDetailDrawer.jsx`, patient packages allow single-click session deduction via `redeemPackageSession(packageId)` in `ClinicContext.jsx`.
