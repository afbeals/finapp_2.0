import styled from 'styled-components';
import Link from 'next/link';
import { theme } from '@/styles/tokens';

const { colors, font, radius, semanticColors, shadow, spacing } = theme;

export const Nav = styled.nav`
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

export const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${spacing[2]};
  text-decoration: none;
  margin-right: auto;
`;

export const BrandIcon = styled.span`
  font-size: ${font.size.xl};
`;

export const BrandName = styled.span`
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  color: ${colors.navbarText};
`;

export const Right = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[3]};
`;

export const MemberDropdown = styled.div`
  position: relative;
`;

export const MemberTrigger = styled.button`
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

export const Avatar = styled.div.withConfig({
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

export const Dropdown = styled.div`
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

export const DropdownItem = styled.button.withConfig({
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

export const DropdownDivider = styled.div`
  height: 1px;
  background: ${colors.border};
  margin: 4px 0;
`;

export const DropdownLabel = styled.div`
  padding: 8px 14px 4px;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const IconButton = styled(Link)`
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
