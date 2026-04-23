'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { StepShell } from '@/components/review/StepShell';
import { STEP_META } from '@/components/review/stepMetadata';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore } from '@/lib/store';
import { formatDollars, toCents, toDollars, currencyFormatter } from '@/lib/money';
import { theme } from '@/styles/tokens';

const { colors, semanticColors, font, spacing } = theme;
import { LoadingState } from '@/components/shared/LoadingState';
import { TrashBtn } from '@/components/shared/TrashBtn';
import { InlineEdit } from '@/components/shared/InlineEdit';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  SectionTitle, SummaryBar, SummaryTotal, SummaryTotalLabel, SummaryTotalValue, SummaryDivider,
  CatChip, CatChipLabel, CatChipVal, AddRowBtn, TableWrap, FTable, FThead, FTh,
  RawNameCell, CellInput, ClearBtn, TreasuryWrap, TrAmountBox, TrAmountLabel,
  TrAmountInput, TrAllocationBadge, TTr, TTd, PctInput,
} from './VaultsPage.styles';
import { getReviewVaults, getMembers, deleteVault, createVault, putReviewVaults, getVaultCategoryOrders, patchVaultCategoryOrder } from '@/lib/api';
import type { Vault, VaultSnapshot, Member } from '@/types/entities';
import { EditCell } from './EditCell';
import { FixedSection } from './FixedSection';
import {
  CAT_ORDER,
  CAT_COLORS,
  monthlyAmount,
  patchApi,
  resolveGroupOrder,
} from './vaultHelpers';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VaultsPage() {
  const params = useParams();
  const reviewId = params.id as string;
  const { state: reviewState } = useReviewStore();
  const { goNext, goBack, goSkip, saving } = useStepNav('vaults');
  const readOnly = reviewState.activeReview?.status === 'COMPLETE' && !reviewState.isEditMode;

  const [vaults, setVaults] = useState<Vault[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [treasuryAmount, setTreasuryAmount] = useState(0);
  const [treasuryPcts, setTreasuryPcts] = useState<Record<number, number>>({});
  const [groupOrderOverrides, setGroupOrderOverrides] = useState<Record<string, number>>({});
  const [newFixedCategory, setNewFixedCategory] = useState<string>('');
  const [deleteCategoryName, setDeleteCategoryName] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getReviewVaults(reviewId),
      getMembers(),
      getVaultCategoryOrders(),
    ]).then(([{ vaults: vs }, { members: ms }, { orders }]) => {
      setVaults(vs ?? []);
      setMembers(ms ?? []);
      const pcts: Record<number, number> = {};
      for (const v of vs ?? []) if (v.type === 'VARIABLE') pcts[v.id] = v.treasuryPct;
      setTreasuryPcts(pcts);
      const overrides: Record<string, number> = {};
      for (const o of orders ?? []) overrides[o.category] = o.groupOrder;
      setGroupOrderOverrides(overrides);
    }).finally(() => setLoading(false));
  }, [reviewId]);

  async function patchVault(id: number, patch: Partial<Vault>, save = false) {
    const prev = vaults.find((v) => v.id === id);
    setVaults((vs) => vs.map((v) => v.id === id ? { ...v, ...patch } : v));
    if (save) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { owner: _owner, ...saveData } = patch;
      try {
        await patchApi(id, saveData);
      } catch {
        if (prev) setVaults((vs) => vs.map((v) => v.id === id ? prev : v));
      }
    }
  }

  async function handleDeleteVault(id: number) {
    setVaults((prev) => prev.filter((v) => v.id !== id));
    await deleteVault(id);
  }

  async function handleDeleteCategory(category: string) {
    const toDelete = vaults.filter((v) => v.type === 'FIXED' && v.category === category);
    setVaults((prev) => prev.filter((v) => !(v.type === 'FIXED' && v.category === category)));
    setDeleteCategoryName(null);
    await Promise.all(toDelete.map((v) => deleteVault(v.id)));
  }

  async function handleAddVault(type: 'FIXED' | 'VARIABLE', category: string) {
    const targetCategory = category || CAT_ORDER[0];
    const siblings = vaults.filter((v) => v.type === type && v.category === targetCategory);
    const maxOrder = siblings.reduce((m, v) => Math.max(m, v.sortOrder), 0);
    try {
      const { vault } = await createVault({
        name: 'New Vault', type, category: targetCategory,
        ownerMemberId: null, target: 0,
        frequency: type === 'VARIABLE' ? 'GOAL' : 'MONTHLY',
        rateMonths: 1, currentBalance: 0, treasuryPct: 0,
        sortOrder: maxOrder + 1, description: '', dueMonths: '',
      });
      setVaults((prev) => [...prev, vault]);
      if (type === 'VARIABLE') setTreasuryPcts((prev) => ({ ...prev, [vault.id]: 0 }));
    } catch {
      // createVault failed — nothing to show yet, user will see no change
    }
  }

  const fixedVaults = useMemo(() => vaults.filter((v) => v.type === 'FIXED'), [vaults]);
  const variableVaults = useMemo(
    () => [...vaults.filter((v) => v.type === 'VARIABLE')].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [vaults]
  );

  const fixedByCategory = useMemo(() => {
    const map: Record<string, Vault[]> = {};
    for (const v of fixedVaults) {
      const k = v.category || 'Other';
      if (!map[k]) map[k] = [];
      map[k].push(v);
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    return map;
  }, [fixedVaults]);

  const totalFixed = useMemo(() => fixedVaults.reduce((s, v) => s + monthlyAmount(v), 0), [fixedVaults]);

  const catTotals = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [cat, vs] of Object.entries(fixedByCategory)) out[cat] = vs.reduce((s, v) => s + monthlyAmount(v), 0);
    return out;
  }, [fixedByCategory]);

  const totalTreasuryPct = useMemo(
    () => variableVaults.reduce((s, v) => s + (treasuryPcts[v.id] ?? 0), 0),
    [variableVaults, treasuryPcts]
  );

  const treasuryAmounts = useMemo(() => {
    const out: Record<number, number> = {};
    for (const v of variableVaults) out[v.id] = Math.round(treasuryAmount * ((treasuryPcts[v.id] ?? 0) / 100));
    return out;
  }, [variableVaults, treasuryPcts, treasuryAmount]);

  const totalTreasuryDistributed = useMemo(
    () => variableVaults.reduce((s, v) => s + (treasuryAmounts[v.id] ?? 0), 0),
    [variableVaults, treasuryAmounts]
  );

  function updateTreasuryPct(vaultId: number, pct: number) {
    setTreasuryPcts((prev) => ({ ...prev, [vaultId]: Math.max(0, Math.min(100, pct)) }));
  }

  async function handleGroupOrderChange(category: string, newOrder: number) {
    setGroupOrderOverrides((prev) => ({ ...prev, [category]: newOrder }));
    try {
      await patchVaultCategoryOrder(category, newOrder);
    } catch {
      setGroupOrderOverrides((prev) => {
        const next = { ...prev };
        delete next[category];
        return next;
      });
    }
  }

  function handleClearTreasury() {
    setTreasuryAmount(0);
    setTreasuryPcts((prev) => {
      const cleared: Record<number, number> = {};
      for (const k of Object.keys(prev)) cleared[Number(k)] = 0;
      return cleared;
    });
  }

  async function handleSave() {
    const snapshots: VaultSnapshot[] = [
      ...fixedVaults.map((v) => ({ vaultId: v.id, amount: monthlyAmount(v) })),
      ...variableVaults.map((v) => ({ vaultId: v.id, amount: treasuryAmounts[v.id] ?? 0 })),
    ];
    const pctUpdates = variableVaults.map((v) => ({ id: v.id, treasuryPct: treasuryPcts[v.id] ?? 0 }));
    await putReviewVaults(reviewId, { snapshots, pctUpdates });
    await goNext();
  }

  if (loading) return <LoadingState centered />;

  const allCategories = [
    ...CAT_ORDER.filter((c) => fixedByCategory[c]),
    ...Object.keys(fixedByCategory).filter((c) => !CAT_ORDER.includes(c)),
  ];

  return (
    <StepShell
      title={STEP_META.vaults.title}
      subtitle={STEP_META.vaults.subtitle}
      stepName="Vaults"
      onBack={goBack}
      onSkip={goSkip}
      onNext={handleSave}
      saving={saving}
      readOnly={readOnly}
    >
      {/* ── Summary ── */}
      <SummaryBar>
        <SummaryTotal>
          <SummaryTotalLabel>Total Monthly Allocation</SummaryTotalLabel>
          <SummaryTotalValue>{formatDollars(totalFixed + totalTreasuryDistributed)}</SummaryTotalValue>
        </SummaryTotal>
        <SummaryDivider />
        {CAT_ORDER.map((cat) => {
          const pal = CAT_COLORS[cat];
          const val = catTotals[cat] ?? 0;
          if (!val || !pal) return null;
          return (
            <React.Fragment key={cat}>
              <CatChip bg={pal.bg} border={pal.border} text={pal.text}>
                <CatChipLabel textColor={pal.subtext}>{cat}</CatChipLabel>
                <CatChipVal textColor={pal.text}>{formatDollars(val)}</CatChipVal>
              </CatChip>
            </React.Fragment>
          );
        })}
      </SummaryBar>

      {/* ── Fixed Allocations ── */}
      <SectionTitle>Fixed Allocations</SectionTitle>
      <p style={{ fontSize: font.size.sm, color: colors.textMuted, marginTop: `-${spacing[3]}`, marginBottom: spacing[4] }}>
        Monthly amounts calculated from goals and timeframes. Raw name = <code style={{ fontSize: 11 }}>[Order]-[Group]-[GroupOrder]-[Who]-[Freq(months)]-[Description]-[Goal]</code>
      </p>

      {allCategories.map((cat) => {
        const groupOrder = resolveGroupOrder(cat, groupOrderOverrides);
        return (
          <FixedSection
            key={cat}
            category={cat}
            groupOrder={groupOrder}
            vaults={fixedByCategory[cat] ?? []}
            members={members}
            readOnly={readOnly}
            onUpdate={patchVault}
            onDelete={handleDeleteVault}
            onAdd={(category) => handleAddVault('FIXED', category)}
            onDeleteCategory={(category) => setDeleteCategoryName(category)}
            onGroupOrderChange={handleGroupOrderChange}
          />
        );
      })}

      {!readOnly && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 18px' }}>
          <input
            type="text"
            placeholder="New vault name (e.g. Health)"
            value={newFixedCategory}
            onChange={(e) => setNewFixedCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newFixedCategory.trim()) {
                handleAddVault('FIXED', newFixedCategory.trim());
                setNewFixedCategory('');
              }
            }}
            style={{ height: 30, padding: '0 8px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 13, color: colors.textPrimary, background: colors.surface, width: 220 }}
          />
          <AddRowBtn
            style={{ margin: 0 }}
            onClick={() => {
              const name = newFixedCategory.trim() || `Vault ${allCategories.length + 1}`;
              handleAddVault('FIXED', name);
              setNewFixedCategory('');
            }}
          >
            + Add vault
          </AddRowBtn>
        </div>
      )}

      {/* ── Delete category confirmation modal ── */}
      {deleteCategoryName !== null && (
        <Modal
          isOpen
          onClose={() => setDeleteCategoryName(null)}
          title={`Delete "${deleteCategoryName}" vault?`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteCategoryName(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDeleteCategory(deleteCategoryName)}>
                Delete vault &amp; all rows
              </Button>
            </>
          }
        >
          <p style={{ fontSize: font.size.base, color: colors.textSecondary, lineHeight: 1.6 }}>
            This will permanently delete the <strong>{deleteCategoryName}</strong> vault and all{' '}
            <strong>{(fixedByCategory[deleteCategoryName] ?? []).length}</strong> row
            {(fixedByCategory[deleteCategoryName] ?? []).length !== 1 ? 's' : ''} inside it.
            This cannot be undone.
          </p>
        </Modal>
      )}

      {/* ── Treasury Distribution ── */}
      <SectionTitle style={{ marginTop: spacing[6] }}>Treasury Distribution</SectionTitle>
      <p style={{ fontSize: font.size.sm, color: colors.textMuted, marginTop: `-${spacing[3]}`, marginBottom: spacing[4] }}>
        Distribute remaining funds by percentage across savings goals
      </p>

      <TreasuryWrap>
        <TrAmountBox>
          <TrAmountLabel>Treasury Amount</TrAmountLabel>
          <TrAmountInput
            type="number" step="0.01"
            value={toDollars(treasuryAmount).toFixed(2)}
            onChange={(e) => setTreasuryAmount(toCents(parseFloat(e.target.value) || 0))}
            disabled={readOnly}
          />
          <span style={{ fontSize: font.size.sm, color: semanticColors.amberText }}>Enter amount to distribute</span>
          <TrAllocationBadge valid={Math.abs(totalTreasuryPct - 100) < 0.1 || totalTreasuryPct === 0}>
            Total: {totalTreasuryPct.toFixed(0)}%
          </TrAllocationBadge>
          {!readOnly && (
            <ClearBtn type="button" onClick={handleClearTreasury}>Clear</ClearBtn>
          )}
        </TrAmountBox>

        <TableWrap>
          <FTable>
            <FThead>
              <tr>
                <FTh w={130}>Name</FTh>
                <FTh w={180}>Raw Name</FTh>
                <FTh w={100} right>Goal</FTh>
                <FTh w={100} right>Current</FTh>
                <FTh w={100} right>Remaining</FTh>
                <FTh w={60} center>%</FTh>
                <FTh w={90} right>Amount</FTh>
                {!readOnly && <FTh w={28} />}
              </tr>
            </FThead>
            <tbody>
              {variableVaults.map((v) => {
                const remaining = v.target != null ? v.target - v.currentBalance : null;
                const isFunded = remaining != null && remaining <= 0;
                const pct = treasuryPcts[v.id] ?? 0;
                const amount = treasuryAmounts[v.id] ?? 0;

                return (
                  <TTr key={v.id} funded={isFunded}>
                    {/* Friendly Name */}
                    <TTd>
                      <EditCell value={v.name} readOnly={readOnly} width={118}
                        onCommit={(name) => patchVault(v.id, { name }, true)} />
                    </TTd>

                    {/* Raw Name — manually editable, stored in description */}
                    <TTd>
                      {readOnly ? (
                        <RawNameCell title={v.description || v.name}>{v.description || v.name}</RawNameCell>
                      ) : (
                        <CellInput
                          key={v.id}
                          defaultValue={v.description}
                          style={{ width: 168, fontFamily: 'ui-monospace, monospace', fontSize: 11 }}
                          onBlur={(e) => {
                            const description = e.target.value.trim();
                            if (description !== v.description) patchVault(v.id, { description }, true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            if (e.key === 'Escape') { (e.target as HTMLInputElement).value = v.description; (e.target as HTMLInputElement).blur(); }
                          }}
                        />
                      )}
                    </TTd>

                    {/* Goal */}
                    <TTd right muted>
                      {readOnly ? (
                        v.target != null ? formatDollars(v.target) : <span style={{ fontStyle: 'italic' }}>Variable</span>
                      ) : (
                        <InlineEdit
                          type="currency"
                          value={v.target != null ? toDollars(v.target).toFixed(2) : '0'}
                          formatter={currencyFormatter}
                          onSave={(val) => {
                            const target = toCents(parseFloat(val) || 0);
                            patchVault(v.id, { target }, true);
                          }}
                        />
                      )}
                    </TTd>

                    {/* Current */}
                    <TTd right green={isFunded} muted={!isFunded}>
                      {readOnly ? (
                        formatDollars(v.currentBalance)
                      ) : (
                        <InlineEdit
                          type="currency"
                          value={toDollars(v.currentBalance).toFixed(2)}
                          formatter={currencyFormatter}
                          onSave={(val) => {
                            const currentBalance = toCents(parseFloat(val) || 0);
                            patchVault(v.id, { currentBalance }, true);
                          }}
                        />
                      )}
                    </TTd>

                    {/* Remaining — computed */}
                    <TTd right bold green={isFunded}>
                      {remaining != null ? formatDollars(remaining) : '—'}
                    </TTd>

                    {/* % */}
                    <TTd center>
                      <PctInput
                        type="number" min="0" max="100" step="1"
                        value={pct}
                        onChange={(e) => updateTreasuryPct(v.id, parseFloat(e.target.value) || 0)}
                        disabled={readOnly || isFunded}
                        funded={isFunded}
                      />
                    </TTd>

                    {/* Amount — computed */}
                    <TTd right bold green={isFunded} style={{ color: amount > 0 ? colors.textPrimary : colors.textMuted }}>
                      {formatDollars(amount)}
                    </TTd>

                    {!readOnly && (
                      <TTd center>
                        <TrashBtn onClick={() => handleDeleteVault(v.id)} title="Delete vault">🗑</TrashBtn>
                      </TTd>
                    )}
                  </TTr>
                );
              })}
            </tbody>
          </FTable>
        </TableWrap>

        {!readOnly && (
          <AddRowBtn onClick={() => handleAddVault('VARIABLE', 'Treasury')}>+ Add row</AddRowBtn>
        )}
      </TreasuryWrap>
    </StepShell>
  );
}
