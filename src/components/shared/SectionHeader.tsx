'use client';

import React from 'react';
import { Wrap, Title, Line, Actions } from './SectionHeader.styles';

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
