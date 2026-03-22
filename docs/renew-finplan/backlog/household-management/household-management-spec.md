---
feature: household-management
status: backlog
priority: high
deferred: false
phase: 2
implemented_date:
---

# Household Management

## Intention
FinPlan supports shared household finances. Members of the same household need a way to access and manage their shared plan, with clear roles controlling who can invite others and who can make changes.

## Description
Role-based access (Owner / Member) with a household switcher in the top nav for users who belong to multiple households. Owners can invite new members via a single-use 24-hour link (QR + URL, no email sent), remove members, and rename the household. Members can view and edit all data, and can leave a household at any time.

## User Stories
- As a household owner, I want to invite my partner via a link so that they can join without me managing their account setup.
- As a new user following an invite link, I want to create an account and join the household in one flow so that onboarding is seamless.
- As a member, I want to leave a household so that I stop seeing someone else's data if circumstances change.
- As a user with multiple households, I want to switch between them in the top nav so that I can access each plan independently.

## Acceptance Criteria
- [ ] Roles: Owner (view/edit all + manage members) / Member (view/edit all only)
- [ ] Household switcher dropdown in top nav
- [ ] Invite flow: single-use 24-hour link (QR code + URL), no email sent by the app
- [ ] Rate limit: 5 invites per hour per household
- [ ] New users following invite: create account and join in one flow
- [ ] Existing users following invite: confirmation step before joining
- [ ] Removing a member: immediate loss of access
- [ ] Renaming a household: owner only
- [ ] A member can leave at any time
- [ ] An owner cannot leave if they are the sole owner

## Open Questions
- [ ] Can a user be an owner of one household and a member of another simultaneously?
- [ ] What happens to a household if all owners leave or are removed?
- [ ] Can ownership be transferred to another member?
