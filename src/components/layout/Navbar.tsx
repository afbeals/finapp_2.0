'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled from 'styled-components';
import { colors, font, radius, semanticColors, shadow, spacing } from '@/styles/tokens';
import { useSessionStore } from '@/lib/store';
import { apiPost } from '@/lib/api';

const Nav = styled.nav`
  height: 56px;
  background: ${colors.navbar};
  display: flex;
  align-items: center;
  padding: 0 ${spacing[6]};
  gap: ${spacing[4]};
  position: sticky;
  top: 0;
  z-index: 40;
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${spacing[2]};
  text-decoration: none;
  margin-right: auto;
`;

const BrandIcon = styled.span`
  font-size: ${font.size.xl};
`;

const BrandName = styled.span`
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  color: ${colors.navbarText};
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[3]};
`;

const MemberDropdown = styled.div`
  position: relative;
`;

const MemberTrigger = styled.button`
  display: flex;
  align-items: center;
  gap: ${spacing[2]};
  padding: 6px 10px;
  border: 1px solid ${semanticColors.navbarOverlayMid};
  border-radius: ${radius.md};
  background: transparent;
  color: ${colors.navbarText};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  cursor: pointer;
  transition: background 150ms ease;

  &:hover {
    background: ${semanticColors.navbarOverlayLight};
  }
`;

const Avatar = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'color',
})<{ color: string }>`
  width: 24px;
  height: 24px;
  border-radius: ${radius.full};
  background: ${({ color }) => color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.surface};
  flex-shrink: 0;
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.lg};
  overflow: hidden;
  z-index: 50;
`;

const DropdownItem = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${spacing[2]};
  padding: 10px 14px;
  border: none;
  background: ${({ active }) => active ? colors.bg : 'transparent'};
  color: ${colors.textPrimary};
  font-size: ${font.size.base};
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${colors.bg};
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background: ${colors.border};
  margin: 4px 0;
`;

const DropdownLabel = styled.div`
  padding: 8px 14px 4px;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const IconButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${radius.md};
  color: ${colors.navbarText};
  font-size: ${font.size.xl};
  text-decoration: none;
  transition: background 150ms ease;
  opacity: 0.8;

  &:hover {
    background: ${semanticColors.navbarOverlayLight};
    opacity: 1;
  }
`;

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
