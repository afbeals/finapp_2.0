// Re-export and extend the review types defined in the Zustand slice.
// Pages should import from here rather than directly from the store slice.

export type {
  ReviewType,
  ReviewStatus,
  StepStatus,
  ReviewStep,
  ActiveReview,
} from '@/lib/store/reviewSlice';

export interface ReviewPeriod {
  id: number;
  periodYear: number;
  periodMonth: number;
  type: 'MONTHLY' | 'QUARTERLY';
  status: 'IN_PROGRESS' | 'COMPLETE' | 'SKIPPED';
}
