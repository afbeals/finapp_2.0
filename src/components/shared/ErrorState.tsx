'use client';

import React from 'react';
import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, spacing } = theme;

const Wrap = styled.div<{ centered?: boolean }>`
  padding: ${spacing[8]} ${spacing[4]};
  text-align: center;
  ${({ centered }) => centered ? 'display: flex; flex-direction: column; align-items: center; justify-content: center;' : ''}
`;

const Icon = styled.div`
  font-size: 2rem;
  margin-bottom: ${spacing[2]};
`;

const Message = styled.p`
  color: ${colors.danger};
  font-size: ${font.size.base};
  margin: 0;
`;

interface ErrorStateProps {
  message?: string;
  centered?: boolean;
  className?: string;
}

export function ErrorState({ message = 'Something went wrong. Please try again.', centered, className }: ErrorStateProps) {
  return (
    <Wrap centered={centered} className={className}>
      <Icon>⚠</Icon>
      <Message>{message}</Message>
    </Wrap>
  );
}
