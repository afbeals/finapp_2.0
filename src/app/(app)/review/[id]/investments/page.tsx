'use client';

import { useParams } from 'next/navigation';
import { StepShell } from '@/components/review/StepShell';
import { STEP_META } from '@/components/review/stepMetadata';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore } from '@/lib/store';
import { useInvestmentsData } from '@/lib/hooks/useInvestmentsData';
import { toDollars } from '@/lib/money';
import { theme } from '@/styles/tokens';

const { colors, semanticColors, font, spacing } = theme;

import {
  SplitBarWrap, SplitBar, SplitSegment, SplitLegend, LegendDot,
  MarketStrip, MarketItemGroup, MarketTag, MarketItem, MarketName, MarketVal,
} from './InvestmentsPage.styles';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { KpiGrid, KpiCard } from '@/components/shared/KpiGrid';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Label, Select, FormGroup } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { formatDollars } from '@/lib/money';
import { InvestmentSection } from './InvestmentSection';
import { AddPurchaseModal } from './AddPurchaseModal';
import { RetirementAccountCard } from './RetirementAccountCard';
import { EditRetirementAccountModal } from './EditRetirementAccountModal';
import { fmtGain, fmtPct } from './investmentHelpers';

export default function InvestmentsPage() {
  const params = useParams();
  const reviewId = params.id as string;
  const { state: reviewState } = useReviewStore();
  const { goNext, saving } = useStepNav('investments');
  const readOnly = reviewState.activeReview?.status === 'COMPLETE' && !reviewState.isEditMode;

  const d = useInvestmentsData(reviewId);

  async function handleSave() {
    await d.buildSavePayload();
    await goNext();
  }

  if (d.loading) return <LoadingState centered />;
  if (d.loadError) return <ErrorState centered message="Couldn't load investments — please refresh." />;

  return (
    <StepShell
      title={STEP_META.investments.title}
      subtitle={STEP_META.investments.subtitle}
      onNext={handleSave}
      saving={saving}
      readOnly={readOnly}
    >
      {/* ── Combined Portfolio Summary ── */}
      <SectionHeader title="Combined Portfolio Summary" />

      <KpiGrid cols={4}>
        <KpiCard label="Total Value" value={d.pricesLoading ? '…' : formatDollars(d.totalValue)} sub={`${d.accounts.length} account${d.accounts.length !== 1 ? 's' : ''}`} />
        <KpiCard
          tone={d.totalGainLoss >= 0 ? 'success' : 'danger'}
          label="Taxable Gain / Loss"
          value={d.pricesLoading ? '…' : fmtGain(d.totalGainLoss)}
          sub="unrealized"
        />
        <KpiCard
          tone={d.totalGainLoss >= 0 ? 'success' : 'danger'}
          label="Taxable Growth %"
          value={d.pricesLoading ? '…' : fmtPct(d.totalGrowthPct)}
          sub="vs taxable cost basis"
        />
        <KpiCard label="Taxable Cost Basis" value={formatDollars(d.totalCostBasis)} sub="total invested" />
      </KpiGrid>

      <SplitBarWrap>
        <p style={{ fontSize: 10, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0' }}>Portfolio Split</p>
        <SplitBar>
          <SplitSegment pct={d.taxablePct} bg={colors.primary} />
          <SplitSegment pct={d.retirementPct} bg={semanticColors.successTextMedium} />
        </SplitBar>
        <SplitLegend>
          <LegendDot bg={colors.primary}>
            Investments: {formatDollars(d.taxableValue)} ({d.taxablePct.toFixed(0)}%)
          </LegendDot>
          <LegendDot bg={semanticColors.successTextMedium}>
            Retirement: {formatDollars(d.retirementValue)} ({d.retirementPct.toFixed(0)}%)
          </LegendDot>
        </SplitLegend>
      </SplitBarWrap>

      {/* ── Market Reference ── */}
      <MarketStrip>
        <MarketItemGroup>
          <MarketTag>Market</MarketTag>
          <MarketItem>
            <MarketName>S&amp;P 500 (SPY)</MarketName>
            <MarketVal up={d.sp500 !== undefined ? true : undefined}>
              {d.sp500 ? `$${toDollars(d.sp500).toFixed(2)}` : d.pricesLoading ? '…' : '—'}
            </MarketVal>
          </MarketItem>
          <MarketItem>
            <MarketName>NASDAQ (QQQ)</MarketName>
            <MarketVal up={d.nasdaq !== undefined ? true : undefined}>
              {d.nasdaq ? `$${toDollars(d.nasdaq).toFixed(2)}` : d.pricesLoading ? '…' : '—'}
            </MarketVal>
          </MarketItem>
          <MarketItem>
            <MarketName>DJIA (DIA)</MarketName>
            <MarketVal up={d.djia !== undefined ? true : undefined}>
              {d.djia ? `$${toDollars(d.djia).toFixed(2)}` : d.pricesLoading ? '…' : '—'}
            </MarketVal>
          </MarketItem>
        </MarketItemGroup>
        <span style={{ fontSize: 10, color: d.pricesLoading ? colors.textDisabled : semanticColors.neutralText, fontStyle: d.pricesLoading ? 'italic' : 'normal' }}>
          {d.pricesLoading ? 'Fetching live prices…' : 'Live prices via Yahoo Finance'}
        </span>
      </MarketStrip>

      {/* ── Investment Accounts (Taxable) ── */}
      <SectionHeader
        title="Investment Accounts (Taxable)"
        actions={
          !readOnly && (
            <Button size="sm" onClick={() => d.openTaxableModal('add')}>+ Add Account</Button>
          )
        }
      />
      {d.taxableAccounts.length === 0 && (
        <p style={{ color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing[3] }}>
          No taxable investment accounts yet.
        </p>
      )}
      {d.taxableAccounts.length > 0 && (
        <InvestmentSection
          title={d.taxableAccounts.length === 1 ? d.taxableAccounts[0].name : 'Taxable Portfolio'}
          isRetirement={false}
          accounts={d.taxableAccounts}
          positions={d.taxablePositions}
          livePrices={d.livePrices}
          pricesLoading={d.pricesLoading}
          readOnly={readOnly}
          categoryColorMap={d.categoryColorMap}
          onAddPurchase={(id) => { d.setAddDefaultAccountId(id); d.setShowAddModal(true); }}
          onEditAccount={!readOnly ? (id) => d.openTaxableModal('edit', id) : undefined}
          onDeleteAccount={!readOnly ? (id) => d.initiateTaxableDelete(id) : undefined}
        />
      )}

      {/* ── Retirement Accounts ── */}
      <SectionHeader title="Retirement Accounts" />
      {d.retirementAccounts.map((account) => (
        <RetirementAccountCard
          key={account.id}
          account={account}
          currentBalance={d.retirementBalanceByAccount[account.id] ?? 0}
          history={d.retirementHistoryByAccount[account.id] ?? []}
          allReviews={d.allReviews}
          currentReviewId={d.reviewIdNum}
          readOnly={readOnly}
          isExpanded={d.expandedRetirementIds.has(account.id)}
          onToggleExpand={d.toggleRetirementExpand}
          onSaveBalance={d.saveRetirementBalance}
          onAddHistoryRow={d.addRetirementHistoryRow}
          onEdit={(id) => { d.setRetirementModalAccountId(id); d.setRetirementModalMode('edit'); }}
          onDelete={(id) => d.setDeleteAccountId(id)}
        />
      ))}

      {d.retirementAccounts.length === 0 && (
        <p style={{ color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing[3] }}>
          No retirement accounts yet. Add one below.
        </p>
      )}

      {!readOnly && (
        <Button
          onClick={() => { d.setRetirementModalAccountId(null); d.setRetirementModalMode('add'); }}
          style={{ marginTop: spacing[3] }}
        >
          + Add Retirement Account
        </Button>
      )}

      {d.showAddModal && (
        <AddPurchaseModal
          accounts={d.accounts}
          categories={d.invCategories}
          defaultAccountId={d.addDefaultAccountId}
          onClose={() => d.setShowAddModal(false)}
          onAdded={d.handlePurchaseAdded}
        />
      )}

      <EditRetirementAccountModal
        isOpen={d.retirementModalMode !== null}
        onClose={() => { d.setRetirementModalMode(null); d.setRetirementModalAccountId(null); }}
        onSubmit={d.handleSubmitRetirementAccount}
        members={d.members}
        initialValues={d.editingAccount}
        mode={d.retirementModalMode ?? 'add'}
      />

      <ConfirmModal
        isOpen={d.deleteAccountId !== null}
        onClose={() => d.setDeleteAccountId(null)}
        onConfirm={d.confirmDelete}
        title="Delete Retirement Account"
        message="This will remove the account and all of its snapshots. This cannot be undone."
        confirmLabel={d.deleting ? 'Deleting…' : 'Delete'}
        confirmVariant="danger"
        loading={d.deleting}
      />

      {/* Add / Edit Taxable Account Modal */}
      <Modal
        isOpen={d.taxableModalMode !== null}
        onClose={() => d.setTaxableModalMode(null)}
        title={d.taxableModalMode === 'add' ? 'Add Investment Account' : 'Edit Investment Account'}
        footer={
          <>
            <Button variant="secondary" onClick={() => d.setTaxableModalMode(null)}>Cancel</Button>
            <Button onClick={d.handleSubmitTaxableAccount} disabled={d.savingTaxable || !d.taxableAccForm.name.trim()}>
              {d.savingTaxable ? 'Saving…' : d.taxableModalMode === 'add' ? 'Add Account' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <FormGroup>
          <Label>Name *</Label>
          <Input
            value={d.taxableAccForm.name}
            onChange={(e) => d.setTaxableAccForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Fidelity Brokerage"
          />
        </FormGroup>
        <FormGroup>
          <Label>Institution</Label>
          <Input
            value={d.taxableAccForm.institution}
            onChange={(e) => d.setTaxableAccForm((f) => ({ ...f, institution: e.target.value }))}
            placeholder="e.g. Fidelity"
          />
        </FormGroup>
        <FormGroup>
          <Label>Owner</Label>
          <Select
            value={d.taxableAccForm.ownerMemberId ?? ''}
            onChange={(e) => d.setTaxableAccForm((f) => ({ ...f, ownerMemberId: e.target.value ? Number(e.target.value) : null }))}
          >
            <option value="">— unassigned —</option>
            {d.members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </FormGroup>
      </Modal>

      {/* Delete Taxable Account Confirm */}
      {d.deleteTaxableId !== null && (
        <Modal
          isOpen
          onClose={() => d.setDeleteTaxableId(null)}
          title="Delete Investment Account"
          footer={
            <>
              <Button variant="secondary" onClick={() => d.setDeleteTaxableId(null)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={d.confirmTaxableDelete}
                disabled={d.deletingTaxable || (d.taxableDeletePurchaseCount > 0 && d.taxableTransferToId == null)}
              >
                {d.deletingTaxable ? 'Deleting…' : 'Delete Account'}
              </Button>
            </>
          }
        >
          {d.taxableDeletePurchaseCount > 0 ? (
            <>
              <p style={{ marginBottom: spacing[4] }}>
                This account has <strong>{d.taxableDeletePurchaseCount} purchase lot{d.taxableDeletePurchaseCount !== 1 ? 's' : ''}</strong>.
                Transfer them to another account before deleting.
              </p>
              <FormGroup>
                <Label>Transfer purchases to *</Label>
                <Select
                  value={d.taxableTransferToId ?? ''}
                  onChange={(e) => d.setTaxableTransferToId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">— select an account —</option>
                  {d.taxableTransferOptions.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              </FormGroup>
              {d.taxableTransferOptions.length === 0 && (
                <p style={{ fontSize: font.size.sm, color: colors.danger, marginTop: spacing[2] }}>
                  No other accounts available. Add another account first.
                </p>
              )}
            </>
          ) : (
            <p>This will permanently delete the account. This cannot be undone.</p>
          )}
        </Modal>
      )}
    </StepShell>
  );
}
