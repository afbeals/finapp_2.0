import type { ImmerStateCreator } from './types';

export interface Member {
  id: number;
  name: string;
  color: string;
}

export interface SessionState {
  memberId: number | null;
  memberName: string | null;
  memberColor: string | null;
  householdId: number | null;
  householdName: string | null;
  members: Member[];
}

export interface SessionActions {
  setSession: (data: {
    memberId: number;
    memberName: string;
    memberColor: string;
    householdId: number;
    householdName: string;
  }) => void;
  setMembers: (members: Member[]) => void;
  setActiveMember: (member: Member) => void;
  clearSession: () => void;
}

export interface SessionSliceStore {
  state: SessionState;
  actions: SessionActions;
}

const defaultSessionState: SessionState = {
  memberId: null,
  memberName: null,
  memberColor: null,
  householdId: null,
  householdName: null,
  members: [],
};

export const createSessionSlice: ImmerStateCreator<SessionSliceStore> = (set) => ({
  state: defaultSessionState,

  actions: {
    setSession: (data) =>
      set((store) => {
        store.session.state.memberId = data.memberId;
        store.session.state.memberName = data.memberName;
        store.session.state.memberColor = data.memberColor;
        store.session.state.householdId = data.householdId;
        store.session.state.householdName = data.householdName;
      }),

    setMembers: (members) =>
      set((store) => {
        store.session.state.members = members;
      }),

    setActiveMember: (member) =>
      set((store) => {
        store.session.state.memberId = member.id;
        store.session.state.memberName = member.name;
        store.session.state.memberColor = member.color;
      }),

    clearSession: () =>
      set((store) => {
        store.session.state = { ...defaultSessionState };
      }),
  },
});
