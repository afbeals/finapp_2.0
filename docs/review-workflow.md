# Review Workflow

A "review" is a monthly or quarterly financial check-in. Users walk through a multi-step wizard, filling in data at each step, then finalize.

---

## Review Types & Steps

### Monthly Review (6 steps)

```
expense → monthly → savings → investments → vaults → finalize
```

### Quarterly Review (8 steps)

```
expense → monthly → savings → loans → investments → portfolio → vaults → finalize
```

---

## Step Descriptions

| Step key | Page | What the user does |
|----------|------|--------------------|
| `expense` | `/review/[id]/expense` | Log all expense line items for the month |
| `monthly` | `/review/[id]/monthly` | Log income; see expense summary by category |
| `savings` | `/review/[id]/savings` | Update savings account balances |
| `loans` | `/review/[id]/loans` | Record loan payment progress (quarterly only) |
| `investments` | `/review/[id]/investments` | Add purchase lots; update retirement balances |
| `portfolio` | `/review/[id]/portfolio` | View FIRE projections and wealth charts |
| `vaults` | `/review/[id]/vaults` | Allocate money to budget vaults |
| `finalize` | `/review/[id]/finalize` | Review summary; mark complete |

---

## Step Lifecycle

Each step has a status stored in the `ReviewStep` table:

```
PENDING → COMPLETE
        → SKIPPED
```

Steps are marked complete or skipped via:

```
PATCH /api/reviews/[id]/steps/[stepKey]
{ status: "COMPLETE" }
```

The `currentStep` field on the `Review` record always points to the user's current position in the wizard.

---

## Navigation Hook (useStepNav)

```typescript
// src/lib/useStepNav.ts
const { goNext, goPrev, goTo, steps, currentStepIndex } = useStepNav(review);

// Advance to the next step (marks current as COMPLETE, updates currentStep)
goNext();

// Skip this step
goSkip();

// Go back (does not change step status)
goPrev();
```

The hook reads `review.type` to determine whether to include the quarterly-only steps (`loans`, `portfolio`).

---

## Review Status

```
IN_PROGRESS   ← active wizard session
COMPLETE      ← user clicked "Finalize" in the finalize step
SKIPPED       ← user skipped (rare, manual)
```

Once `COMPLETE`, the review appears in the History table and the `/history/[id]` page. Completed reviews are read-only by default, but can be unlocked for editing via the "Enable Editing" button on the history page.

---

## Edit Mode

Completed reviews can be re-opened for editing:

1. User navigates to `/history/[id]`
2. Clicks "Enable Editing"
3. `EnableEditModal` confirms the action
4. `actions.setIsEditMode(true)` is called
5. User is redirected to `/review/[id]/expense`
6. All step pages check `isEditMode` from the store — if true, they render editable fields instead of read-only displays

The `ReviewModeBanner` component (mounted in the review layout) always shows the current mode:
- Read-only: "👁️ Viewing completed review (read-only)."
- Edit mode: "✏️ You are editing a completed review."

---

## Creating a New Review

From the dashboard:
1. Click **+ New Review** or **+ Start New Review**
2. `NewReviewModal` opens — select month, year, and type
3. `POST /api/reviews` is called
4. On success, the user is redirected to `/review/[id]/expense`
5. The review is set as `activeReview` in the Zustand store

The API rejects duplicate reviews for the same month/year (`409` conflict).

---

## Step Indicator Component

`StepIndicator` (in the review layout) shows progress through the wizard steps.

```
● expense → ● monthly → ○ savings → ○ vaults → ○ finalize
```

- Filled circle (●) = complete or current
- Empty circle (○) = pending
- X = skipped

It reads step statuses from `activeReview.steps` in the Zustand store.

---

## Data Persistence per Step

Each step's data is persisted as it's entered — not just on "Next". For example:
- Expenses are saved immediately when an entry is added (POST)
- Savings balances are saved on blur/submit of each field
- Vault amounts are saved on each change

Users can close the browser and return — their progress is saved.

---

## Starting From a Specific Step

Users can navigate directly to any step URL: `/review/[id]/savings`. The page will load its own data regardless of `currentStep`. The `StepIndicator` still reflects the actual step completion status.
