# ADR-0001: Theme-aware scarlet variants for WCAG AA text contrast

- **Status:** Accepted
- **Date:** 2026-07-10
- **Decision maker:** Drix
- **Amends:** CLAUDE.md §11 color tokens (locked decision, changed via this ADR)

## Context

CLAUDE.md §11 defines `--scarlet: #E23140` as the single scarlet token and
simultaneously mandates WCAG 2.1 AA contrast on all text (§3.8, §11 rules).
These two requirements conflict for small text:

- `#E23140` on paper `#F6F7F5` → **4.13:1** (AA requires 4.5:1)
- `#E23140` on ink `#16130E` → **4.18:1**
- Paper-colored text on an `#E23140` fill → **4.11:1**

No single color can pass 4.5:1 against both paper and ink: their mutual
contrast is ~15.8:1, and passing both would require ≥ 4.5 × 4.5 = 20.25:1.
Lighthouse flagged the breaking ticker links and category labels on the home
page (2026-07-10 audit).

## Decision

Split scarlet into three role tokens (defined in `globals.css`):

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--scarlet-brand` | `#E23140` | `#E23140` | Logo, large display text (≥24px, or ≥19px bold), non-text accents. The true brand hex, unchanged. |
| `--scarlet` | `#CC2130` | `#F2606B` | Text accent (links, labels, category names). Theme-aware. |
| `--scarlet-fill` | `#CC2130` | `#CC2130` | Background fills carrying paper text (breaking ticker, breaking badge). Constant. |

Measured contrast of the new values:

- `#CC2130` text on paper 5.11:1, on surface `#ECEEEA` ~4.7:1 ✓
- `#F2606B` text on ink 5.88:1, on dark card `#221E17` 5.26:1 ✓
- Paper text on `#CC2130` fill 5.11:1 ✓

`--destructive` now aliases `--scarlet-fill` in both themes so destructive
buttons (paper text on scarlet) stay compliant.

## Consequences

- All existing `text-scarlet` usages become AA-compliant with no component
  changes; fills were migrated to `bg-scarlet-fill` (ticker, breaking badge).
- The marketing/brand hex `#E23140` remains canonical for logos and any large
  display usage via `scarlet-brand`.
- The §12 token-compliance review now also checks: small text never uses
  `scarlet-brand`, and paper-on-scarlet surfaces always use `scarlet-fill`.

## Alternatives considered

- **Accept 4.1:1 and log an exception** — rejected; contradicts the
  non-negotiable AA rule in CLAUDE.md §3.
- **Remove scarlet from small text entirely** — rejected; larger visual
  redesign than the problem warrants, weakens the Voice design language.
