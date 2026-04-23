import styled, { keyframes } from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, radius, shadow, font, spacing } = theme;

export const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
export const slideUp = keyframes`from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; }`;

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
  animation: ${fadeIn} 150ms ease;
`;

export const Dialog = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'width',
})<{ width?: string }>`
  background: ${colors.surface};
  border-radius: ${radius.xl};
  box-shadow: ${shadow.xl};
  width: 100%;
  max-width: ${({ width }) => width ?? '520px'};
  max-height: 90vh;
  overflow-y: auto;
  animation: ${slideUp} 200ms ease;
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${spacing[6]} ${spacing[6]} 0;
`;

export const ModalTitle = styled.h2`
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.semibold};
  color: ${colors.textPrimary};
`;

export const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: ${colors.textMuted};
  border-radius: ${radius.md};
  font-size: ${font.size.xl};
  cursor: pointer;

  &:hover {
    background: ${colors.bg};
    color: ${colors.textPrimary};
  }
`;

export const ModalBody = styled.div`
  padding: ${spacing[5]} ${spacing[6]};
`;

export const ModalFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${spacing[2]};
  padding: 0 ${spacing[6]} ${spacing[6]};
`;
