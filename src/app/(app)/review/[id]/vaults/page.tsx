'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { StepShell } from '@/components/review/StepShell';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore } from '@/lib/store';
import { formatDollars, toCents, toDollars } from '@/lib/money';
import { theme } from '@/styles/tokens';

const { colors, semanticColors, font, spacing } = theme;
import { LoadingState } from '@/components/shared/LoadingState';
import {
  SectionTitle, SummaryBar, SummaryTotal, SummaryTotalLabel, SummaryTotalValue, SummaryDivider,
  CatChip, CatChipLabel, CatChipVal, AddRowBtn, TableWrap, FTable, FThead, FTh,
  RawNameCell, CellInput, DeleteBtn, TreasuryWrap, TrAmountBox, TrAmountLabel,
  TrAmountInput, TrAllocationBadge, TTr, TTd, PctInput,
} from './VaultsPage.styles';
import { getReviewVaults, getMembers, deleteVault, createVault, putReviewVaults } from '@/lib/api';
import type { Vault, VaultSnapshot, Member } from '@/types/entities';
import { EditCell } from './EditCell';
import { FixedSection } from './FixedSection';
import {
  CAT_ORDER,
  CAT_GROUPS,
  CAT_COLORS,
  monthlyAmount,
  patchApi,
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

  useEffect(() => {
    Promise.all([
      getReviewVaults(reviewId),
      getMembers(),
    ]).then(([{ vaults: vs }, { members: ms }]) => {
      setVaults(vs ?? []);
      setMembers(ms ?? []);
      const pcts: Record<number, number> = {};
      for (const v of vs ?? []) if (v.type === 'VARIABLE') pcts[v.id] = v.treasuryPct;
      setTreasuryPcts(pcts);
    }).finally(() => setLoading(false));
  }, [reviewId]);

  function patchVault(id: number, patch: Partial<Vault>, save = false) {
    setVaults((prev) => prev.map((v) => v.id === id ? { ...v, ...patch } : v));
    if (save) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { owner: _owner, ...saveData } = patch;
      patchApi(id, saveData);
    }
  }

  async function handleDeleteVault(id: number) {
    setVaults((prev) => prev.filter((v) => v.id !== id));
    await deleteVault(id);
  }

  async function handleAddVault(type: 'FIXED' | 'VARIABLE', category: string) {
    const siblings = vaults.filter((v) => v.type === type && v.category === category);
    const maxOrder = siblings.reduce((m, v) => Math.max(m, v.sortOrder), 0);
    const { vault } = await createVault({
      name: 'New Vault', type, category,
      ownerMemberId: null, target: 0,
      frequency: type === 'VARIABLE' ? 'GOAL' : 'MONTHLY',
      rateMonths: 1, currentBalance: 0, treasuryPct: 0,
      sortOrder: maxOrder + 1, description: '', dueMonths: '',
    });
    setVaults((prev) => [...prev, vault]);
    if (type === 'VARIABLE') setTreasuryPcts((prev) => ({ ...prev, [vault.id]: 0 }));
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
      title="Vault Distribution"
      subtitle="Allocate funds across your bank vaults for the month"
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
        Monthly amounts calculated from goals and timeframes. Raw name = <code style={{ fontSize: 11 }}>[GroupOrder]-[Category]-[Order]-[Who]-[Freq(months)]-[Description]-[Goal]</code>
      </p>

      {allCategories.map((cat) => {
        const groupOrder = CAT_GROUPS[cat] ?? 99;
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
          />
        );
      })}

      {!readOnly && (
        <AddRowBtn
          style={{ marginBottom: spacing[4], border: `1px dashed ${colors.primary}`, color: colors.primary }}
          onClick={() => handleAddVault('FIXED', CAT_ORDER[0])}
        >
          + Add fixed vault
        </AddRowBtn>
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
                      {v.target != null ? formatDollars(v.target) : <span style={{ fontStyle: 'italic' }}>Variable</span>}
                    </TTd>

                    {/* Current */}
                    <TTd right green={isFunded} muted={!isFunded}>{formatDollars(v.currentBalance)}</TTd>

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
                        <DeleteBtn onClick={() => handleDeleteVault(v.id)} title="Delete vault">×</DeleteBtn>
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
