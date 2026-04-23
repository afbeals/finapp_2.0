import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, radius, shadow, spacing } = theme;

export const Page = styled.div`
  min-height: 100vh;
  background: ${colors.bg};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${spacing[4]};
`;

export const Card = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.xl};
  box-shadow: ${shadow.lg};
  width: 100%;
  max-width: 400px;
  padding: ${spacing[8]};
`;

export const Header = styled.div`
  text-align: center;
  margin-bottom: ${spacing[8]};
`;

export const Logo = styled.div`
  width: 56px;
  height: 56px;
  background: ${colors.navbar};
  border-radius: ${radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto ${spacing[4]};
`;

export const Title = styled.h1`
  font-size: ${font.size['3xl']};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing[1]};
`;

export const Subtitle = styled.p`
  font-size: ${font.size.base};
  color: ${colors.textMuted};
`;

export const SectionLabel = styled.p`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${colors.textSecondary};
  margin-bottom: ${spacing[3]};
`;

export const MemberGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing[3]};
  margin-bottom: ${spacing[6]};
`;

export const MemberButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['selected', 'memberColor'].includes(prop),
})<{ selected: boolean; memberColor: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${spacing[2]};
  padding: ${spacing[4]};
  border-radius: ${radius.lg};
  border: 2px solid ${({ selected, memberColor }) => selected ? memberColor : colors.border};
  background: ${({ selected, memberColor }) => selected ? `${memberColor}15` : colors.surface};
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease;

  &:hover {
    border-color: ${({ memberColor }) => memberColor};
    background: ${({ memberColor }) => `${memberColor}10`};
  }
`;

export const Avatar = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'color',
})<{ color: string }>`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${({ color }) => color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.surface};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.semibold};
`;

export const MemberName = styled.span`
  font-size: ${font.size.base};
  font-weight: ${font.weight.medium};
  color: ${colors.textPrimary};
`;

export const PinLabel = styled.label`
  display: block;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${colors.textSecondary};
  margin-bottom: ${spacing[2]};
`;

export const PinDots = styled.div`
  display: flex;
  gap: ${spacing[3]};
  justify-content: center;
  margin-bottom: ${spacing[6]};
`;

export const PinDot = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'filled',
})<{ filled: boolean }>`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid ${({ filled }) => filled ? colors.primary : colors.border};
  background: ${({ filled }) => filled ? colors.primary : 'transparent'};
  transition: background 100ms ease, border-color 100ms ease;
`;

export const Keypad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${spacing[2]};
  margin-bottom: ${spacing[6]};
`;

export const KeyButton = styled.button`
  height: 52px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.medium};
  color: ${colors.textPrimary};
  cursor: pointer;
  transition: background 100ms ease;

  &:hover {
    background: ${colors.bg};
  }

  &:active {
    background: ${colors.border};
  }
`;

export const ErrorMessage = styled.p`
  text-align: center;
  font-size: ${font.size.sm};
  color: ${colors.danger};
  margin-bottom: ${spacing[4]};
`;
