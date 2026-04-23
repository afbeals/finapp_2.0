'use client';

import React from 'react';
import styled from 'styled-components';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { theme } from '@/styles/tokens';

const { spacing } = theme;

export const Section = styled(Card)`
  margin-bottom: ${spacing[6]};
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing[4]};
`;

interface SectionCardProps {
  title: string;
  addLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
}

export function SectionCard({ title, addLabel, onAdd, children }: SectionCardProps) {
  return (
    <Section padding="md">
      <SectionHeader>
        <CardTitle>{title}</CardTitle>
        <Button size="sm" onClick={onAdd}>{addLabel}</Button>
      </SectionHeader>
      {children}
    </Section>
  );
}
