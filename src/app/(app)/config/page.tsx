'use client';

import React from 'react';
import { CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { theme } from '@/styles/tokens';
import { Page, PageTitle, Section, ExportBox, SubText } from './ConfigPage.styles';
import { LoadingState } from '@/components/shared/LoadingState';
import { useConfigData } from './useConfigData';
import { MembersSection } from './MembersSection';
import { ExpenseCategoriesSection } from './ExpenseCategoriesSection';
import { InvestmentsConfigSection } from './InvestmentsConfigSection';

const { colors, spacing } = theme;

export default function ConfigPage() {
  const {
    members,
    expenseCategories,
    invCategories,
    loading,
    setMembers,
    setExpenseCategories,
    setInvCategories,
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
