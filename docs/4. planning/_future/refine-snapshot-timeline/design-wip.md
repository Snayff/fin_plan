# Refine Snapshot Timeline — WIP Design

> **Status: Parked — to be picked up after `overview-financial-summary` ships**
> This captures the design thinking and open questions for the snapshot timeline strip at the top of the Overview left panel, which needs updating now that two distinct snapshot types exist.

---

## Context

The snapshot timeline currently shows user-created and Review-wizard snapshots as selectable dots. With the introduction of daily auto-snapshots (`auto:YYYY-MM-DD`) to power sparklines, the timeline needs to handle two visually distinct types:

| Type       | Created by                                    | Purpose                                    | Named                                  |
| ---------- | --------------------------------------------- | ------------------------------------------ | -------------------------------------- |
| **Auto**   | System — daily upsert on any waterfall change | Sparkline data source; silent accumulation | `auto:YYYY-MM-DD`                      |
| **Review** | Review wizard at session end                  | Named historical comparison points         | User-facing name (e.g. "March Review") |

---

## Design direction (early thinking)

Auto dots should be visually lighter — smaller, lower opacity, no label on hover beyond the date. They signal "something changed on this day" without demanding attention.

Review dots should be more prominent — full size, labelled, selectable for snapshot comparison (existing behaviour). These are the meaningful milestones the user intentionally created.

The two types can coexist on the same timeline track. Collision handling (two events on the same day) should stack or merge — TBD at design time.

**Not anticipated to be dense:** users don't change their waterfall every day, so auto dots will be sparse in practice.

---

## Open questions

1. Should auto dots be selectable (load that day's snapshot for comparison), or strictly decorative (display-only)?
2. If auto and review fall on the same day, which takes visual precedence?
3. Does the timeline need a zoom or scroll mechanic if history accumulates over years?
4. Should the timeline show a date label on hover for auto dots?
5. Should there be a way to "promote" an auto snapshot to a named Review snapshot?

---

## What needs to be decided at design time

- Exact size, opacity, and shape differentiation between auto and review dots
- Hover/tooltip behaviour for auto dots
- Selectable vs. display-only for auto dots
- Long-term density management
