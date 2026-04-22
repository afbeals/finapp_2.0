'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { Navbar } from '@/components/layout/Navbar';
import { useSessionStore } from '@/lib/store';
import { colors } from '@/styles/tokens';

const Main = styled.main`
  min-height: calc(100vh - 56px);
  background: ${colors.bg};
`;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { actions } = useSessionStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bg }}>
        <span style={{ color: colors.textMuted }}>Loading…</span>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Main>{children}</Main>
    </>
  );
}
