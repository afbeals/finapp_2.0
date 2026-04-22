'use client';

import React from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/styles/tokens';

export const ItemRowContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid ${colors.border};
  &:last-child { border-bottom: none; }
`;

export const ColorDot = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'color',
})<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ color }) => color};
  flex-shrink: 0;
`;

export const RowActions = styled.div`
  display: flex;
  gap: ${spacing[2]};
`;

interface ItemRowProps {
  color: string;
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}

export function ItemRow({ color, children, onEdit, onDelete }: ItemRowProps) {
  return (
    <ItemRowContainer>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ColorDot color={color} />
        {children}
      </div>
      <RowActions>
        <Button size="sm" variant="secondary" onClick={onEdit}>Edit</Button>
        <Button size="sm" variant="danger" onClick={onDelete}>Delete</Button>
      </RowActions>
    </ItemRowContainer>
  );
}
