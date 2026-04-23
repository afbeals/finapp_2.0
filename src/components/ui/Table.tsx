'use client';

import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font } = theme;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${font.size.base};
`;

export const Thead = styled.thead`
  background: ${colors.bg};
`;

export const Th = styled.th`
  text-align: left;
  padding: 10px 16px;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${colors.textMuted};
  border-bottom: 1px solid ${colors.border};
  white-space: nowrap;

  &:last-child {
    text-align: right;
  }
`;

export const Td = styled.td`
  padding: 12px 16px;
  color: ${colors.textPrimary};
  border-bottom: 1px solid ${colors.border};

  &:last-child {
    text-align: right;
  }
`;

export const Tr = styled.tr`
  &:last-child td {
    border-bottom: none;
  }

  &:hover td {
    background: ${colors.bg};
  }
`;
