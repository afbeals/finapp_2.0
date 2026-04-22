import type { ImmerStateCreator } from './types';

export type ReviewType = 'MONTHLY' | 'QUARTERLY';
export type ReviewStatus = 'IN_PROGRESS' | 'COMPLETE' | 'SKIPPED';
export type StepStatus = 'PENDING' | 'COMPLETE' | 'SKIPPED';

export interface ReviewStep {
  id: number;
  stepKey: string;
  status: StepStatus;
  data: string;
}

export interface ActiveReview {
  id: number;
  periodYear: number;
  periodMonth: number;
  type: ReviewType;
  status: ReviewStatus;
  currentStep: string;
  lockedForEdit: boolean;
  steps: ReviewStep[];
}

export interface ReviewState {
  activeReview: ActiveReview | null;
  isEditMode: boolean;
}

export interface ReviewActions {
  setActiveReview: (review: ActiveReview | null) => void;
  setIsEditMode: (value: boolean) => void;
  setCurrentStep: (stepKey: string) => void;
  updateStepStatus: (stepKey: string, status: StepStatus) => void;
  lockForEdit: (locked: boolean) => void;
}

export interface ReviewSliceStore {
  state: ReviewState;
  actions: ReviewActions;
}

const defaultReviewState: ReviewState = {
  activeReview: null,
  isEditMode: false,
};

export const createReviewSlice: ImmerStateCreator<ReviewSliceStore> = (set) => ({
  state: defaultReviewState,

  actions: {
    setActiveReview: (review) =>
      set((store) => {
        store.review.state.activeReview = review;
        // When setting a completed review, default to edit mode off
        if (review?.status === 'COMPLETE') {
          store.review.state.isEditMode = false;
        }
      }),

    setIsEditMode: (value) =>
      set((store) => {
        store.review.state.isEditMode = value;
      }),

    setCurrentStep: (stepKey) =>
      set((store) => {
        if (store.review.state.activeReview) {
          store.review.state.activeReview.currentStep = stepKey;
        }
      }),

    updateStepStatus: (stepKey, status) =>
      set((store) => {
        const step = store.review.state.activeReview?.steps.find((s) => s.stepKey === stepKey);
        if (step) step.status = status;
      }),

    lockForEdit: (locked) =>
      set((store) => {
        if (store.review.state.activeReview) {
          store.review.state.activeReview.lockedForEdit = locked;
        }
      }),
  },
});
