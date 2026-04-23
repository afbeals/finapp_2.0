'use client';

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createReviewSlice } from './reviewSlice';
import { createSessionSlice } from './sessionSlice';
import type { GlobalStore } from './types';

export const useStore = create<GlobalStore>()(
  immer(
    devtools(
      subscribeWithSelector((...fns) => ({
        session: createSessionSlice(...fns),
        review: createReviewSlice(...fns),
      })),
      { name: 'financial-review-store' },
    ),
  ),
);

// Per-slice selector hooks — components import only what they need
export const useSessionStore = () => useStore((state) => state.session);
export const useReviewStore = () => useStore((state) => state.review);

// Re-export slice types for consumers
export type { GlobalStore } from './types';
export type { SessionSliceStore, SessionState, SessionActions, Member } from './sessionSlice';
export type { ReviewSliceStore, ReviewState, ReviewActions, ActiveReview, ReviewStep, ReviewType, ReviewStatus, StepStatus } from './reviewSlice';
