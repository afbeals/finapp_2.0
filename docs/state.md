# State Management

The app uses **Zustand** with **Immer** for global state. There are two small slices — session and review. Most page-level data (expenses, savings balances, etc.) lives in local `useState` within each page component, not in the global store.

---

## When to use the store vs. local state

| Use Zustand store for | Use local `useState` for |
|----------------------|--------------------------|
| Current logged-in member | Page-specific data (expenses list, form values) |
| Active review object | Component UI state (modal open/closed, loading flags) |
| Edit mode flag | Fetched data that doesn't need to persist across routes |
| Household info | |

---

## Store Structure

```
GlobalStore
  ├── session      (SessionSlice)
  └── review       (ReviewSlice)
```

### Session Slice

Populated on login and on every page load (via `GET /api/auth/session`).

```typescript
interface SessionState {
  memberId: number | null;
  memberName: string | null;
  memberColor: string | null;
  householdId: number | null;
  householdName: string | null;
  members: Member[];
}
```

**Actions:**
```typescript
actions.setSession({ memberId, memberName, memberColor, householdId, householdName })
actions.setMembers(members[])
actions.setActiveMember(member)   // switch which member is "active"
actions.clearSession()            // called on logout
```

### Review Slice

Tracks the currently active review and whether the user is in edit mode.

```typescript
interface ReviewState {
  activeReview: ActiveReview | null;  // the in-progress review (or null)
  isEditMode: boolean;                // true when editing a completed review
}

interface ActiveReview {
  id: number;
  periodYear: number;
  periodMonth: number;
  type: 'MONTHLY' | 'QUARTERLY';
  status: string;
  currentStep: string;
  lockedForEdit: boolean;
  steps: ReviewStep[];
}
```

**Actions:**
```typescript
actions.setActiveReview(review | null)
actions.setIsEditMode(boolean)
actions.setCurrentStep(stepKey)
actions.updateStepStatus(stepKey, status)
actions.lockForEdit()
```

---

## Usage in Components

Import the hook for the slice you need:

```typescript
import { useSessionStore, useReviewStore } from '@/lib/store';

// In a component:
function MyComponent() {
  // Read state + get actions
  const { memberName, members, actions: sessionActions } = useSessionStore();
  const { activeReview, isEditMode, actions: reviewActions } = useReviewStore();

  // Use state
  console.log(`Hello, ${memberName}`);
  console.log(`Review: ${activeReview?.id}`);

  // Update state
  function handleEditMode() {
    reviewActions.setIsEditMode(true);
  }
}
```

You can also use the raw selector pattern if you only need one field (avoids unnecessary re-renders):

```typescript
const memberId = useSessionStore((s) => s.memberId);
```

---

## Store + DevTools

The store uses Zustand DevTools middleware. You can inspect state in the **Redux DevTools** browser extension:

1. Install [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
2. Open Chrome DevTools → Redux tab
3. You will see `GlobalStore` with both slices

---

## Store File Locations

```
src/lib/store/
  ├── index.ts          ← creates the store, exports useStore / useSessionStore / useReviewStore
  ├── sessionSlice.ts   ← session state + actions
  ├── reviewSlice.ts    ← review state + actions
  └── types.ts          ← shared types (ActiveReview, ReviewStep, etc.)
```

---

## Adding a New Slice

If you need new global state, create a new slice file:

```typescript
// src/lib/store/mySlice.ts
import type { StateCreator } from 'zustand';
import type { GlobalStore } from './index';

export interface MySlice {
  myValue: string;
  actions: {
    setMyValue: (v: string) => void;
  };
}

export const createMySlice: StateCreator<GlobalStore, [['zustand/immer', never]], [], MySlice> = (set) => ({
  myValue: '',
  actions: {
    setMyValue: (v) => set((state) => { state.myValue = v; }),
  },
});
```

Then add it to `src/lib/store/index.ts`:

```typescript
export type GlobalStore = SessionSlice & ReviewSlice & MySlice;

const useStore = create<GlobalStore>()(
  devtools(
    immer((...a) => ({
      ...createSessionSlice(...a),
      ...createReviewSlice(...a),
      ...createMySlice(...a),
    }))
  )
);
```

---

## Immer Update Pattern

Actions use Immer's draft mutation syntax — you modify the draft directly, no need to spread:

```typescript
// ✅ Correct — Immer handles immutability
actions.setMyValue: (v) => set((state) => {
  state.myValue = v;  // direct mutation on draft
})

// ❌ Wrong — do not return a new object in Immer slice actions
actions.setMyValue: (v) => set(() => ({ myValue: v }))
```
