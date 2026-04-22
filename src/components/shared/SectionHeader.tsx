'use client';

import React from 'react';
import styled from 'styled-components';
import { colors, font, spacing } from '@/styles/tokens';

const Wrap = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[3]};
  margin: ${spacing[6]} 0 ${spacing[3]};
`;

const Title = styled.h2`
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
  white-space: nowrap;
`;

const Line = styled.div`
  flex: 1;
  height: 1px;
  background: ${colors.border};
`;

const Actions = styled.div`display: flex; align-items: center; gap: ${spacing[2]};`;

interface SectionHeaderProps {
  title: React.ReactNode;
  actions?: React.ReactNode;
  /** Remove top margin (e.g. when it's the first element on the page) */
  noTopMargin?: boolean;
  className?: string;
}

export function SectionHeader({ title, actions, noTopMargin, className }: SectionHeaderProps) {
  return (
    <Wrap style={noTopMargin ? { marginTop: 0 } : undefined} className={className}>
      <Title>{title}</Title>
      <Line />
      {actions && <Actions>{actions}</Actions>}
    </Wrap>
  );
}
