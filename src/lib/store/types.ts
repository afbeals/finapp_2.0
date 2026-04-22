import type { StateCreator } from 'zustand';

import type { ReviewSliceStore } from './reviewSlice';
import type { SessionSliceStore } from './sessionSlice';

export interface GlobalStore {
  session: SessionSliceStore;
  review: ReviewSliceStore;
}

export type ImmerStateCreator<T> = StateCreator<
  GlobalStore,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [['zustand/devtools', never], ['zustand/immer', never]],
  T
>;
