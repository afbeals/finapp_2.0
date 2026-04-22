'use client';

import React from 'react';
import styled from 'styled-components';
import { colors, radius } from '@/styles/tokens';
import { TableScroll, DTable, DThead, DTh, DTr, DTd } from './parts';

export { TableScroll, DTable, DThead, DTh, DTr, DTd } from './parts';

// ─── Bordered scroll container (with rounded corners) ─────────────────────────

const BorderedScroll = styled(TableScroll)`
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  margin-bottom: 0;
`;

interface DataTableProps {
  children: React.ReactNode;
  /** Wrap in a bordered+rounded scroll container */
  bordered?: boolean;
  /** Table content grows wider than container */
  scrollX?: boolean;
  className?: string;
}

export function DataTable({ children, bordered, scrollX, className }: DataTableProps) {
  const table = <DTable maxContent={scrollX}>{children}</DTable>;
  if (bordered) return <BorderedScroll className={className}>{table}</BorderedScroll>;
  if (scrollX) return <TableScroll className={className}>{table}</TableScroll>;
  return table;
}
