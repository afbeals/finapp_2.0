'use client';

import React from 'react';
import styled from 'styled-components';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors, font, spacing } from '@/styles/tokens';
import { LoadingState } from '@/components/shared/LoadingState';
import { useConfigData } from './useConfigData';
import { MembersSection } from './MembersSection';
import { ExpenseCategoriesSection } from './ExpenseCategoriesSection';
import { InvestmentsConfigSection } from './InvestmentsConfigSection';

// ─── Styled components ────────────────────────────────────────────────────────

const Page = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: ${spacing[8]} ${spacing[6]};
`;

const PageTitle = styled.h1`
  font-size: ${font.size['3xl']};
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: ${spacing[8]};
`;

const Section = styled(Card)`
  margin-bottom: ${spacing[6]};
`;

const ExportBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing[4]};
`;

const SubText = styled.p`
  font-size: ${font.size.sm};
  color: ${colors.textMuted};
  margin-top: 2px;
`;

// ─── Page component ───────────────────────────────────────────────────────────

export default function ConfigPage() {
  const {
    members,
    expenseCategories,
    invCategories,
    accounts,
    loading,
    setMembers,
    setExpenseCategories,
    setInvCategories,
    setAccounts,
  } = useConfigData();

  function handleExport() {
    window.open('/api/config/export', '_blank');
  }

  if (loading) return <LoadingState centered />;

  return (
    <Page>
      <PageTitle>Settings</PageTitle>

      <MembersSection members={members} setMembers={setMembers} />

      <ExpenseCategoriesSection
        expenseCategories={expenseCategories}
        setExpenseCategories={setExpenseCategories}
      />

      <InvestmentsConfigSection
        invCategories={invCategories}
        setInvCategories={setInvCategories}
        accounts={accounts}
        setAccounts={setAccounts}
        members={members}
      />

      {/* Data */}
      <Section padding="md">
        <CardTitle style={{ marginBottom: spacing[4] }}>Data</CardTitle>
        <ExportBox>
          <div>
            <p style={{ fontWeight: 600, color: colors.textPrimary }}>Export All Data</p>
            <SubText>Download all reviews, entries, and settings as JSON.</SubText>
          </div>
          <Button variant="secondary" onClick={handleExport}>Export JSON</Button>
        </ExportBox>
      </Section>
    </Page>
  );
}
