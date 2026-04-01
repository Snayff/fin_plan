---
feature: achievement-notifications
creation_date: 2026-03-27
status: future
---

# Achievement Notifications — Future Feature

## What exists

`apps/frontend/src/components/ui/achievement.tsx` is a fully implemented celebratory notification component with documented trigger examples:

- "First transaction added"
- "Goal reached"
- "Waterfall balanced"
- Etc.

It has 0 usages in the app. It was scaffolded but never wired up.

## Decision needed

Before implementing this feature, decide:

1. **Is this consistent with the brand?** FinPlan's emotional tone is calm and empowering — not gamified. Celebratory popups risk crossing into "badges/streaks/confetti" territory (explicitly listed as an anti-reference). Any achievement UI must feel like a quiet acknowledgement, not a reward system.

2. **What are the right triggers?** Candidates:
   - First income source added (onboarding milestone)
   - Waterfall fully built (setup complete)
   - All stale items reviewed (review wizard completion)
   - Surplus benchmark hit for the first time
   - Goal funded

3. **Where does state live?** Has the backend tracked whether a trigger has fired for this household? If not, this needs a `HouseholdMilestone` model or similar.

4. **Delete vs. build?** If the feature doesn't fit the brand after this review, delete `achievement.tsx` and close this doc.

## Next steps

Run `/write-design achievement-notifications` when ready to design the feature properly.
