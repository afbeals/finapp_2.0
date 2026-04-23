'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/styles/tokens';
import {
  Nav, Brand, BrandIcon, BrandName, Right, MemberDropdown, MemberTrigger,
  Avatar, Dropdown, DropdownItem, DropdownLabel, DropdownDivider, IconButton,
} from './Navbar.styles';
import { useSessionStore } from '@/lib/store';
import { apiPost } from '@/lib/api';

const { colors, font } = theme;

export function Navbar() {
  const router = useRouter();
  const { state, actions } = useSessionStore();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await apiPost('/api/auth/logout', {}).catch(() => null);
    actions.clearSession();
    router.push('/login');
  }

  async function handleSwitchMember(member: { id: number; name: string; color: string }) {
    const ok = await apiPost('/api/auth/login', { memberId: member.id, pin: '__switch__' }).then(() => true).catch(() => false);
    if (ok) actions.setActiveMember(member);
    setOpen(false);
  }

  return (
    <Nav>
      <Brand href="/dashboard">
        <BrandIcon>💰</BrandIcon>
        <BrandName>Financial Review</BrandName>
      </Brand>

      <Right>
        <IconButton href="/config" title="Settings">⚙️</IconButton>

        <MemberDropdown>
          <MemberTrigger onClick={() => setOpen((o) => !o)}>
            <Avatar color={state.memberColor ?? colors.primary}>
              {state.memberName?.[0] ?? '?'}
            </Avatar>
            {state.memberName ?? 'Select member'}
            <span style={{ opacity: 0.6, fontSize: font.size.xxs }}>▼</span>
          </MemberTrigger>

          {open && (
            <Dropdown>
              <DropdownItem onClick={handleLogout} style={{ color: colors.danger }}>
                Sign out
              </DropdownItem>
            </Dropdown>
          )}
        </MemberDropdown>
      </Right>
    </Nav>
  );
}
