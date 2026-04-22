'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { Navbar } from '@/components/layout/Navbar';
import { apiGet } from '@/lib/api';
import { useSessionStore } from '@/lib/store';
import type { Member } from '@/lib/store/sessionSlice';
import { colors } from '@/styles/tokens';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

const Main = styled.main`
  min-height: calc(100vh - 56px);
  background: ${colors.bg};
`;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { actions } = useSessionStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    apiGet<{ session: { memberId: number; memberName: string; memberColor: string; householdId: number; householdName: string } | null; members: Member[] }>('/api/auth/session')
      .then(({ session, members }) => {
        if (!session) {
          router.replace('/login');
          return;
        }
        actions.setSession(session);
        actions.setMembers(members ?? []);
        setReady(true);
      })
      .catch(() => router.replace('/login'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bg }}>
        <LoadingState centered />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Main><ErrorBoundary>{children}</ErrorBoundary></Main>
    </>
  );
}
