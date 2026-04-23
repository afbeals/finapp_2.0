import type {
  Purchase,
  InvestmentAccount,
  InvestmentCategory,
  Member,
  HistoricalRetirementSnapshot,
  RetirementSnapshot,
} from '@/types/entities';

export interface InvestmentsState {
  // server data
  accounts: InvestmentAccount[];
  invCategories: InvestmentCategory[];
  members: Member[];
  allRetirementHistory: HistoricalRetirementSnapshot[];
  retirementSnapshots: RetirementSnapshot[];
  allReviews: { id: number; periodYear: number; periodMonth: number }[];
  livePrices: Record<string, number>;
  marketIndices: Record<string, number>;
  // loading flags
  loading: boolean;
  loadError: boolean;
  pricesLoading: boolean;
  // add-purchase modal
  showAddModal: boolean;
  addDefaultAccountId: number | undefined;
  // retirement UI
  expandedRetirementIds: Set<number>;
  retirementModalMode: 'add' | 'edit' | null;
  retirementModalAccountId: number | null;
  deleteAccountId: number | null;
  deleting: boolean;
  // taxable UI
  taxableModalMode: 'add' | 'edit' | null;
  taxableModalAccountId: number | null;
  taxableAccForm: { name: string; institution: string; ownerMemberId: number | null };
  savingTaxable: boolean;
  deleteTaxableId: number | null;
  deletingTaxable: boolean;
  taxableDeletePurchaseCount: number;
  taxableTransferToId: number | null;
}

export type InvestmentsAction =
  | {
      type: 'LOAD_SUCCESS';
      accounts: InvestmentAccount[];
      invCategories: InvestmentCategory[];
      members: Member[];
      retirementSnapshots: RetirementSnapshot[];
      allRetirementHistory: HistoricalRetirementSnapshot[];
      allReviews: { id: number; periodYear: number; periodMonth: number }[];
    }
  | { type: 'LOAD_ERROR' }
  | { type: 'PRICES_LOADING' }
  | { type: 'PRICES_SUCCESS'; livePrices: Record<string, number>; marketIndices: Record<string, number> }
  | { type: 'ADD_ACCOUNT'; account: InvestmentAccount }
  | { type: 'UPDATE_ACCOUNT'; account: InvestmentAccount }
  | { type: 'REMOVE_ACCOUNT'; id: number }
  | { type: 'ADD_PURCHASE'; purchase: Purchase }
  | { type: 'SET_LIVE_PRICE'; ticker: string; price: number }
  | { type: 'UPSERT_RETIREMENT_HISTORY'; snapshot: HistoricalRetirementSnapshot; reviewIdNum: number; cents: number }
  | { type: 'REMOVE_RETIREMENT_DATA'; accountId: number }
  // add-purchase modal
  | { type: 'OPEN_ADD_PURCHASE'; accountId: number | undefined }
  | { type: 'CLOSE_ADD_PURCHASE' }
  // retirement modal
  | { type: 'OPEN_RETIREMENT_MODAL'; mode: 'add' | 'edit'; accountId: number | null }
  | { type: 'CLOSE_RETIREMENT_MODAL' }
  | { type: 'OPEN_DELETE_RETIREMENT'; accountId: number }
  | { type: 'CLOSE_DELETE_RETIREMENT' }
  | { type: 'SET_DELETING'; value: boolean }
  | { type: 'TOGGLE_RETIREMENT_EXPAND'; id: number }
  // taxable modal
  | { type: 'OPEN_TAXABLE_MODAL'; mode: 'add' | 'edit'; accountId: number | null; form: InvestmentsState['taxableAccForm'] }
  | { type: 'CLOSE_TAXABLE_MODAL' }
  | { type: 'SET_TAXABLE_FORM'; form: Partial<InvestmentsState['taxableAccForm']> }
  | { type: 'SET_SAVING_TAXABLE'; value: boolean }
  | { type: 'OPEN_DELETE_TAXABLE'; id: number; purchaseCount: number }
  | { type: 'CLOSE_DELETE_TAXABLE' }
  | { type: 'SET_DELETING_TAXABLE'; value: boolean }
  | { type: 'SET_TAXABLE_TRANSFER_TO'; id: number | null };

export const initialInvestmentsState: InvestmentsState = {
  accounts: [],
  invCategories: [],
  members: [],
  allRetirementHistory: [],
  retirementSnapshots: [],
  allReviews: [],
  livePrices: {},
  marketIndices: {},
  loading: true,
  loadError: false,
  pricesLoading: false,
  showAddModal: false,
  addDefaultAccountId: undefined,
  expandedRetirementIds: new Set(),
  retirementModalMode: null,
  retirementModalAccountId: null,
  deleteAccountId: null,
  deleting: false,
  taxableModalMode: null,
  taxableModalAccountId: null,
  taxableAccForm: { name: '', institution: '', ownerMemberId: null },
  savingTaxable: false,
  deleteTaxableId: null,
  deletingTaxable: false,
  taxableDeletePurchaseCount: 0,
  taxableTransferToId: null,
};

export function investmentsReducer(state: InvestmentsState, action: InvestmentsAction): InvestmentsState {
  switch (action.type) {
    case 'LOAD_SUCCESS':
      return {
        ...state,
        loading: false,
        accounts: action.accounts,
        invCategories: action.invCategories,
        members: action.members,
        retirementSnapshots: action.retirementSnapshots,
        allRetirementHistory: action.allRetirementHistory,
        allReviews: action.allReviews,
      };
    case 'LOAD_ERROR':
      return { ...state, loading: false, loadError: true };

    case 'PRICES_LOADING':
      return { ...state, pricesLoading: true };
    case 'PRICES_SUCCESS':
      return { ...state, pricesLoading: false, livePrices: action.livePrices, marketIndices: action.marketIndices };

    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, { ...action.account, purchases: [] }] };
    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.account.id ? { ...action.account, purchases: a.purchases } : a
        ),
      };
    case 'REMOVE_ACCOUNT':
      return { ...state, accounts: state.accounts.filter((a) => a.id !== action.id) };

    case 'ADD_PURCHASE':
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.purchase.accountId ? { ...a, purchases: [...a.purchases, action.purchase] } : a
        ),
      };
    case 'SET_LIVE_PRICE':
      return { ...state, livePrices: { ...state.livePrices, [action.ticker]: action.price } };

    case 'UPSERT_RETIREMENT_HISTORY': {
      const { snapshot, reviewIdNum, cents } = action;
      const i = state.allRetirementHistory.findIndex(
        (r) => r.accountId === snapshot.accountId && r.reviewId === snapshot.reviewId
      );
      const updatedHistory =
        i === -1
          ? [...state.allRetirementHistory, snapshot]
          : state.allRetirementHistory.map((r, idx) => (idx === i ? snapshot : r));

      let updatedSnapshots = state.retirementSnapshots;
      if (snapshot.reviewId === reviewIdNum) {
        const si = state.retirementSnapshots.findIndex((r) => r.accountId === snapshot.accountId);
        const row = { id: snapshot.id, accountId: snapshot.accountId, reviewId: reviewIdNum, balance: cents };
        updatedSnapshots =
          si === -1
            ? [...state.retirementSnapshots, row]
            : state.retirementSnapshots.map((r, idx) => (idx === si ? row : r));
      }
      return { ...state, allRetirementHistory: updatedHistory, retirementSnapshots: updatedSnapshots };
    }

    case 'REMOVE_RETIREMENT_DATA':
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.accountId),
        retirementSnapshots: state.retirementSnapshots.filter((s) => s.accountId !== action.accountId),
        allRetirementHistory: state.allRetirementHistory.filter((s) => s.accountId !== action.accountId),
      };

    case 'OPEN_ADD_PURCHASE':
      return { ...state, showAddModal: true, addDefaultAccountId: action.accountId };
    case 'CLOSE_ADD_PURCHASE':
      return { ...state, showAddModal: false, addDefaultAccountId: undefined };

    case 'OPEN_RETIREMENT_MODAL':
      return { ...state, retirementModalMode: action.mode, retirementModalAccountId: action.accountId };
    case 'CLOSE_RETIREMENT_MODAL':
      return { ...state, retirementModalMode: null, retirementModalAccountId: null };

    case 'OPEN_DELETE_RETIREMENT':
      return { ...state, deleteAccountId: action.accountId };
    case 'CLOSE_DELETE_RETIREMENT':
      return { ...state, deleteAccountId: null };
    case 'SET_DELETING':
      return { ...state, deleting: action.value };
    case 'TOGGLE_RETIREMENT_EXPAND': {
      const next = new Set(state.expandedRetirementIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, expandedRetirementIds: next };
    }

    case 'OPEN_TAXABLE_MODAL':
      return { ...state, taxableModalMode: action.mode, taxableModalAccountId: action.accountId, taxableAccForm: action.form };
    case 'CLOSE_TAXABLE_MODAL':
      return { ...state, taxableModalMode: null };
    case 'SET_TAXABLE_FORM':
      return { ...state, taxableAccForm: { ...state.taxableAccForm, ...action.form } };
    case 'SET_SAVING_TAXABLE':
      return { ...state, savingTaxable: action.value };

    case 'OPEN_DELETE_TAXABLE':
      return { ...state, deleteTaxableId: action.id, taxableDeletePurchaseCount: action.purchaseCount, taxableTransferToId: null };
    case 'CLOSE_DELETE_TAXABLE':
      return { ...state, deleteTaxableId: null };
    case 'SET_DELETING_TAXABLE':
      return { ...state, deletingTaxable: action.value };
    case 'SET_TAXABLE_TRANSFER_TO':
      return { ...state, taxableTransferToId: action.id };

    default:
      return state;
  }
}
