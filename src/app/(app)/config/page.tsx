'use client';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, FormGroup } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { colors, font, spacing, radius } from '@/styles/tokens';
import { LoadingState } from '@/components/shared/LoadingState';
import {
  getMembers, getExpenseCategories, getInvestmentCategories, getInvestmentAccounts,
  createMember, updateMember,
  createExpenseCategory, updateExpenseCategory, deleteExpenseCategory,
  createInvestmentCategory, updateInvestmentCategory, deleteInvestmentCategory,
  createInvestmentAccount, updateInvestmentAccount, deleteInvestmentAccount,
} from '@/lib/api';
import type { Member, ExpenseCategory, InvestmentCategory, InvestmentAccount } from '@/types/entities';

type InvCategory = InvestmentCategory;

interface MemberWithEmail extends Member { email: string | null }

const ACCOUNT_TYPES = [
  { value: 'TAXABLE', label: 'Taxable Brokerage' },
  { value: 'TRADITIONAL_401K', label: 'Traditional 401(k)' },
  { value: 'ROTH_401K', label: 'Roth 401(k)' },
  { value: 'TRADITIONAL_IRA', label: 'Traditional IRA' },
  { value: 'ROTH_IRA', label: 'Roth IRA' },
  { value: 'HSA', label: 'HSA' },
  { value: 'OTHER', label: 'Other' },
];

function accountTypeLabel(type: string) {
  return ACCOUNT_TYPES.find((t) => t.value === type)?.label ?? type;
}

// Derive badge colors from a hex color
function badgeColors(hex: string) {
  return { bg: hex + '22', fg: hex };
}

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

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing[4]};
`;

// Two-column investments layout
const InvColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing[4]};
  margin-top: ${spacing[4]};
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const InvColumn = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const InvColHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: ${spacing[3]};
  border-bottom: 2px solid ${colors.border};
  margin-bottom: ${spacing[2]};
`;

const InvColTitle = styled.h3`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
`;

const InvScrollList = styled.div`
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
  /* subtle scrollbar */
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 2px; }
`;

const MemberRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid ${colors.border};
  &:last-child { border-bottom: none; }
`;

const MemberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ColorDot = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'color',
})<{ color: string }>`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: ${({ color }) => color};
  flex-shrink: 0;
`;

const SmallDot = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'color',
})<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ color }) => color};
  flex-shrink: 0;
`;

const MemberName = styled.span`
  font-size: ${font.size.base};
  font-weight: 600;
  color: ${colors.textPrimary};
`;

const MemberEmail = styled.span`
  font-size: ${font.size.sm};
  color: ${colors.textMuted};
  margin-left: 8px;
`;

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid ${colors.border};
  &:last-child { border-bottom: none; }
`;

const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RowActions = styled.div`
  display: flex;
  gap: ${spacing[2]};
`;

const TypeBadge = styled.span`
  font-size: ${font.size.xs};
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  background: ${colors.primaryLight};
  color: ${colors.primaryHover};
  letter-spacing: 0.02em;
`;

const InvCatBadge = styled.span.withConfig({
  shouldForwardProp: (p) => p !== 'bg' && p !== 'fg',
})<{ bg: string; fg: string }>`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 99px;
  font-size: ${font.size.xs};
  font-weight: 600;
  background: ${({ bg }) => bg};
  color: ${({ fg }) => fg};
  border: 1px solid ${({ fg }) => fg}33;
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

const SelectInput = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  font-size: ${font.size.base};
  color: ${colors.textPrimary};
  background: ${colors.surface};
`;

// ─── Page component ───────────────────────────────────────────────────────────

export default function ConfigPage() {
  const [members, setMembers] = useState<MemberWithEmail[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [invCategories, setInvCategories] = useState<InvCategory[]>([]);
  const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberColor, setNewMemberColor] = useState('#6B7280');
  const [addingMember, setAddingMember] = useState(false);

  // Add/edit expense category modal
  const [showAddExpCat, setShowAddExpCat] = useState(false);
  const [newExpCatName, setNewExpCatName] = useState('');
  const [newExpCatIcon, setNewExpCatIcon] = useState('📦');
  const [newExpCatColor, setNewExpCatColor] = useState('#6B7280');
  const [addingExpCat, setAddingExpCat] = useState(false);
  const [editExpCat, setEditExpCat] = useState<ExpenseCategory | null>(null);
  const [editExpCatName, setEditExpCatName] = useState('');
  const [editExpCatIcon, setEditExpCatIcon] = useState('');
  const [editExpCatColor, setEditExpCatColor] = useState('');
  const [savingExpCat, setSavingExpCat] = useState(false);

  // Add/edit investment category modal
  const [showAddInvCat, setShowAddInvCat] = useState(false);
  const [newInvCatName, setNewInvCatName] = useState('');
  const [newInvCatColor, setNewInvCatColor] = useState('#6B7280');
  const [addingInvCat, setAddingInvCat] = useState(false);
  const [editInvCat, setEditInvCat] = useState<InvCategory | null>(null);
  const [editInvCatName, setEditInvCatName] = useState('');
  const [editInvCatColor, setEditInvCatColor] = useState('');
  const [savingInvCat, setSavingInvCat] = useState(false);

  // Safe delete for investment category
  const [deleteInvCat, setDeleteInvCat] = useState<InvCategory | null>(null);
  const [deleteInvCatCount, setDeleteInvCatCount] = useState(0);
  const [transferCatName, setTransferCatName] = useState('');
  const [deletingInvCat, setDeletingInvCat] = useState(false);

  // Add/edit investment account modal
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState('TAXABLE');
  const [newAccInstitution, setNewAccInstitution] = useState('');
  const [newAccOwner, setNewAccOwner] = useState<number | null>(null);
  const [addingAccount, setAddingAccount] = useState(false);
  const [editAccount, setEditAccount] = useState<InvestmentAccount | null>(null);
  const [editAccName, setEditAccName] = useState('');
  const [editAccType, setEditAccType] = useState('TAXABLE');
  const [editAccInstitution, setEditAccInstitution] = useState('');
  const [editAccOwner, setEditAccOwner] = useState<number | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);

  // Safe delete for investment account
  const [deleteAccount, setDeleteAccount] = useState<InvestmentAccount | null>(null);
  const [deleteAccountPurchaseCount, setDeleteAccountPurchaseCount] = useState(0);
  const [transferToId, setTransferToId] = useState<number | ''>('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    Promise.all([
      getMembers(),
      getExpenseCategories(),
      getInvestmentCategories(),
      getInvestmentAccounts(),
    ]).then(([m, c, ic, a]) => {
      setMembers((m.members ?? []) as MemberWithEmail[]);
      setExpenseCategories(c.categories ?? []);
      setInvCategories(ic.categories ?? []);
      setAccounts(a.accounts ?? []);
    }).finally(() => setLoading(false));
  }, []);

  // ── Members ────────────────────────────────────────────────────────────────

  async function handleAddMember() {
    if (!newMemberName.trim()) return;
    setAddingMember(true);
    const data = await createMember({ name: newMemberName.trim(), color: newMemberColor }).catch(() => null);
    if (data) {
      setMembers((prev) => [...prev, data.member as MemberWithEmail]);
      setNewMemberName(''); setNewMemberEmail(''); setNewMemberColor('#6B7280');
      setShowAddMember(false);
    }
    setAddingMember(false);
  }

  // ── Expense Categories ────────────────────────────────────────────────────

  async function handleAddExpCat() {
    if (!newExpCatName.trim()) return;
    setAddingExpCat(true);
    const data = await createExpenseCategory({ name: newExpCatName.trim(), icon: newExpCatIcon.trim() || '📦', color: newExpCatColor }).catch(() => null);
    if (data) {
      setExpenseCategories((prev) => [...prev, data.category]);
      setNewExpCatName(''); setNewExpCatIcon('📦'); setNewExpCatColor('#6B7280');
      setShowAddExpCat(false);
    }
    setAddingExpCat(false);
  }

  function openEditExpCat(cat: ExpenseCategory) {
    setEditExpCat(cat);
    setEditExpCatName(cat.name);
    setEditExpCatIcon(cat.icon);
    setEditExpCatColor(cat.color);
  }

  async function handleSaveExpCat() {
    if (!editExpCat) return;
    setSavingExpCat(true);
    const data = await updateExpenseCategory(editExpCat.id, { name: editExpCatName.trim(), icon: editExpCatIcon.trim(), color: editExpCatColor }).catch(() => null);
    if (data) {
      setExpenseCategories((prev) => prev.map((c) => c.id === editExpCat.id ? data.category : c));
      setEditExpCat(null);
    }
    setSavingExpCat(false);
  }

  async function handleDeleteExpCat(id: number) {
    if (!confirm('Delete this category? Expenses using it will be unaffected.')) return;
    const data = await deleteExpenseCategory(id).catch(() => null);
    if (data?.ok) setExpenseCategories((prev) => prev.filter((c) => c.id !== id));
  }

  // ── Investment Categories ─────────────────────────────────────────────────

  async function handleAddInvCat() {
    if (!newInvCatName.trim()) return;
    setAddingInvCat(true);
    const data = await createInvestmentCategory({ name: newInvCatName.trim(), color: newInvCatColor }).catch(() => null);
    if (data) {
      setInvCategories((prev) => [...prev, data.category]);
      setNewInvCatName(''); setNewInvCatColor('#6B7280');
      setShowAddInvCat(false);
    }
    setAddingInvCat(false);
  }

  function openEditInvCat(cat: InvCategory) {
    setEditInvCat(cat);
    setEditInvCatName(cat.name);
    setEditInvCatColor(cat.color);
  }

  async function handleSaveInvCat() {
    if (!editInvCat) return;
    setSavingInvCat(true);
    const data = await updateInvestmentCategory(editInvCat.id, { name: editInvCatName.trim(), color: editInvCatColor }).catch(() => null);
    if (data) {
      setInvCategories((prev) => prev.map((c) => c.id === editInvCat.id ? data.category : c));
      setEditInvCat(null);
    }
    setSavingInvCat(false);
  }

  async function initiateDeleteInvCat(cat: InvCategory) {
    const result = await deleteInvestmentCategory(cat.id).catch((e) => e);
    if (result?.inUse) {
      setDeleteInvCat(cat);
      setDeleteInvCatCount(result.purchaseCount ?? 0);
      setTransferCatName('');
    } else if (result?.ok) {
      setInvCategories((prev) => prev.filter((c) => c.id !== cat.id));
    }
  }

  async function handleConfirmDeleteInvCat() {
    if (!deleteInvCat) return;
    setDeletingInvCat(true);
    const data = await deleteInvestmentCategory(deleteInvCat.id, transferCatName || undefined).catch(() => null);
    if (data?.ok) {
      setInvCategories((prev) => prev.filter((c) => c.id !== deleteInvCat.id));
      setDeleteInvCat(null);
    }
    setDeletingInvCat(false);
  }

  // ── Investment Accounts ───────────────────────────────────────────────────

  async function handleAddAccount() {
    if (!newAccName.trim()) return;
    setAddingAccount(true);
    const data = await createInvestmentAccount({ name: newAccName.trim(), type: newAccType, institution: newAccInstitution.trim(), ownerMemberId: newAccOwner }).catch(() => null);
    if (data) {
      setAccounts((prev) => [...prev, data.account]);
      setNewAccName(''); setNewAccType('TAXABLE'); setNewAccInstitution(''); setNewAccOwner(null);
      setShowAddAccount(false);
    }
    setAddingAccount(false);
  }

  function openEditAccount(acc: InvestmentAccount) {
    setEditAccount(acc);
    setEditAccName(acc.name);
    setEditAccType(acc.type);
    setEditAccInstitution(acc.institution);
    setEditAccOwner(acc.ownerMemberId);
  }

  async function handleSaveAccount() {
    if (!editAccount) return;
    setSavingAccount(true);
    const data = await updateInvestmentAccount(editAccount.id, { name: editAccName.trim(), type: editAccType, institution: editAccInstitution.trim(), ownerMemberId: editAccOwner }).catch(() => null);
    if (data) {
      setAccounts((prev) => prev.map((a) => a.id === editAccount.id ? data.account : a));
      setEditAccount(null);
    }
    setSavingAccount(false);
  }

  async function initiateDeleteAccount(acc: InvestmentAccount) {
    const result = await deleteInvestmentAccount(acc.id).catch((e) => e);
    if (result?.inUse) {
      setDeleteAccount(acc);
      setDeleteAccountPurchaseCount(result.purchaseCount ?? 0);
      setTransferToId('');
    } else if (result?.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== acc.id));
    }
  }

  async function handleConfirmDeleteAccount() {
    if (!deleteAccount) return;
    setDeletingAccount(true);
    const data = await deleteInvestmentAccount(deleteAccount.id, transferToId === '' ? undefined : Number(transferToId)).catch(() => null);
    if (data?.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== deleteAccount.id));
      setDeleteAccount(null);
    }
    setDeletingAccount(false);
  }

  function handleExport() {
    window.open('/api/config/export', '_blank');
  }

  if (loading) return <LoadingState centered />;

  const transferAccOptions = accounts.filter((a) => a.id !== deleteAccount?.id);
  const transferCatOptions = invCategories.filter((c) => c.id !== deleteInvCat?.id);

  return (
    <Page>
      <PageTitle>Settings</PageTitle>

      {/* Members */}
      <Section padding="md">
        <SectionHeader>
          <CardTitle>Household Members</CardTitle>
          <Button size="sm" onClick={() => setShowAddMember(true)}>+ Add Member</Button>
        </SectionHeader>
        {members.map((m) => (
          <MemberRow key={m.id}>
            <MemberInfo>
              <ColorDot color={m.color} />
              <MemberName>{m.name}</MemberName>
              {m.email && <MemberEmail>{m.email}</MemberEmail>}
            </MemberInfo>
          </MemberRow>
        ))}
        {members.length === 0 && <p style={{ color: colors.textMuted, fontSize: font.size.sm }}>No members yet.</p>}
      </Section>

      {/* Expense Categories */}
      <Section padding="md">
        <SectionHeader>
          <CardTitle>Expense Categories</CardTitle>
          <Button size="sm" onClick={() => setShowAddExpCat(true)}>+ Add Category</Button>
        </SectionHeader>
        {expenseCategories.map((cat) => (
          <ItemRow key={cat.id}>
            <ItemInfo>
              <SmallDot color={cat.color} />
              <span style={{ fontSize: font.size.lg }}>{cat.icon}</span>
              <span style={{ fontSize: font.size.base, color: colors.textPrimary }}>{cat.name}</span>
            </ItemInfo>
            <RowActions>
              <Button size="sm" variant="secondary" onClick={() => openEditExpCat(cat)}>Edit</Button>
              <Button size="sm" variant="danger" onClick={() => handleDeleteExpCat(cat.id)}>Delete</Button>
            </RowActions>
          </ItemRow>
        ))}
        {expenseCategories.length === 0 && <p style={{ color: colors.textMuted, fontSize: font.size.sm }}>No categories yet.</p>}
      </Section>

      {/* Investments */}
      <Section padding="md">
        <SectionHeader>
          <CardTitle>Investments</CardTitle>
        </SectionHeader>

        <InvColumns>
          {/* Accounts column */}
          <InvColumn>
            <InvColHeader>
              <InvColTitle>Accounts</InvColTitle>
              <Button size="sm" onClick={() => setShowAddAccount(true)}>+ Add</Button>
            </InvColHeader>
            <InvScrollList>
              {accounts.map((acc) => (
                <ItemRow key={acc.id}>
                  <ItemInfo style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: font.size.sm, fontWeight: 600, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{acc.name}</span>
                        <TypeBadge>{accountTypeLabel(acc.type)}</TypeBadge>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        {acc.institution && <span style={{ fontSize: font.size.xs, color: colors.textMuted }}>{acc.institution}</span>}
                        {acc.owner && (
                          <>
                            {acc.institution && <span style={{ fontSize: font.size.xs, color: colors.border }}>·</span>}
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <SmallDot color={acc.owner.color} />
                              <span style={{ fontSize: font.size.xs, color: colors.textMuted }}>{acc.owner.name}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </ItemInfo>
                  <RowActions>
                    <Button size="sm" variant="secondary" onClick={() => openEditAccount(acc)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => initiateDeleteAccount(acc)}>Delete</Button>
                  </RowActions>
                </ItemRow>
              ))}
              {accounts.length === 0 && <p style={{ color: colors.textMuted, fontSize: font.size.sm, padding: `${spacing[3]} 0` }}>No accounts yet.</p>}
            </InvScrollList>
          </InvColumn>

          {/* Holdings Categories column */}
          <InvColumn>
            <InvColHeader>
              <InvColTitle>Holdings Categories</InvColTitle>
              <Button size="sm" onClick={() => setShowAddInvCat(true)}>+ Add</Button>
            </InvColHeader>
            <InvScrollList>
              {invCategories.map((cat) => {
                const { bg, fg } = badgeColors(cat.color);
                return (
                  <ItemRow key={cat.id}>
                    <ItemInfo>
                      <InvCatBadge bg={bg} fg={fg}>{cat.name}</InvCatBadge>
                    </ItemInfo>
                    <RowActions>
                      <Button size="sm" variant="secondary" onClick={() => openEditInvCat(cat)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => initiateDeleteInvCat(cat)}>Delete</Button>
                    </RowActions>
                  </ItemRow>
                );
              })}
              {invCategories.length === 0 && <p style={{ color: colors.textMuted, fontSize: font.size.sm, padding: `${spacing[3]} 0` }}>No categories yet.</p>}
            </InvScrollList>
          </InvColumn>
        </InvColumns>
      </Section>

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

      {/* ── Modals ── */}

      {/* Add Member */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member"
        footer={<><Button variant="secondary" onClick={() => setShowAddMember(false)}>Cancel</Button><Button onClick={handleAddMember} disabled={addingMember || !newMemberName.trim()}>{addingMember ? 'Adding…' : 'Add Member'}</Button></>}>
        <FormGroup><Label>Name *</Label><Input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="e.g. Alex" /></FormGroup>
        <FormGroup><Label>Email (optional)</Label><Input type="email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} placeholder="alex@example.com" /></FormGroup>
        <FormGroup>
          <Label>Color</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <input type="color" value={newMemberColor} onChange={(e) => setNewMemberColor(e.target.value)} style={{ width: 48, height: 38, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
            <span style={{ fontSize: font.size.sm, color: colors.textMuted }}>{newMemberColor}</span>
          </div>
        </FormGroup>
      </Modal>

      {/* Add Expense Category */}
      <Modal isOpen={showAddExpCat} onClose={() => setShowAddExpCat(false)} title="Add Expense Category"
        footer={<><Button variant="secondary" onClick={() => setShowAddExpCat(false)}>Cancel</Button><Button onClick={handleAddExpCat} disabled={addingExpCat || !newExpCatName.trim()}>{addingExpCat ? 'Adding…' : 'Add Category'}</Button></>}>
        <FormGroup><Label>Name *</Label><Input value={newExpCatName} onChange={(e) => setNewExpCatName(e.target.value)} placeholder="e.g. Entertainment" /></FormGroup>
        <FormGroup><Label>Icon (emoji)</Label><Input value={newExpCatIcon} onChange={(e) => setNewExpCatIcon(e.target.value)} placeholder="📦" maxLength={4} /></FormGroup>
        <FormGroup>
          <Label>Color</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <input type="color" value={newExpCatColor} onChange={(e) => setNewExpCatColor(e.target.value)} style={{ width: 48, height: 38, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
            <span style={{ fontSize: font.size.sm, color: colors.textMuted }}>{newExpCatColor}</span>
          </div>
        </FormGroup>
      </Modal>

      {/* Edit Expense Category */}
      {editExpCat && (
        <Modal isOpen onClose={() => setEditExpCat(null)} title="Edit Expense Category"
          footer={<><Button variant="secondary" onClick={() => setEditExpCat(null)}>Cancel</Button><Button onClick={handleSaveExpCat} disabled={savingExpCat || !editExpCatName.trim()}>{savingExpCat ? 'Saving…' : 'Save Changes'}</Button></>}>
          <FormGroup><Label>Name</Label><Input value={editExpCatName} onChange={(e) => setEditExpCatName(e.target.value)} /></FormGroup>
          <FormGroup><Label>Icon (emoji)</Label><Input value={editExpCatIcon} onChange={(e) => setEditExpCatIcon(e.target.value)} maxLength={4} /></FormGroup>
          <FormGroup>
            <Label>Color</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
              <input type="color" value={editExpCatColor} onChange={(e) => setEditExpCatColor(e.target.value)} style={{ width: 48, height: 38, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
              <span style={{ fontSize: font.size.sm, color: colors.textMuted }}>{editExpCatColor}</span>
            </div>
          </FormGroup>
        </Modal>
      )}

      {/* Add Investment Category */}
      <Modal isOpen={showAddInvCat} onClose={() => setShowAddInvCat(false)} title="Add Holdings Category"
        footer={<><Button variant="secondary" onClick={() => setShowAddInvCat(false)}>Cancel</Button><Button onClick={handleAddInvCat} disabled={addingInvCat || !newInvCatName.trim()}>{addingInvCat ? 'Adding…' : 'Add Category'}</Button></>}>
        <FormGroup><Label>Name *</Label><Input value={newInvCatName} onChange={(e) => setNewInvCatName(e.target.value)} placeholder="e.g. Technology" /></FormGroup>
        <FormGroup>
          <Label>Badge Color</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <input type="color" value={newInvCatColor} onChange={(e) => setNewInvCatColor(e.target.value)} style={{ width: 48, height: 38, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
            <InvCatBadge bg={newInvCatColor + '22'} fg={newInvCatColor}>Preview</InvCatBadge>
          </div>
        </FormGroup>
      </Modal>

      {/* Edit Investment Category */}
      {editInvCat && (
        <Modal isOpen onClose={() => setEditInvCat(null)} title="Edit Holdings Category"
          footer={<><Button variant="secondary" onClick={() => setEditInvCat(null)}>Cancel</Button><Button onClick={handleSaveInvCat} disabled={savingInvCat || !editInvCatName.trim()}>{savingInvCat ? 'Saving…' : 'Save Changes'}</Button></>}>
          <FormGroup><Label>Name</Label><Input value={editInvCatName} onChange={(e) => setEditInvCatName(e.target.value)} /></FormGroup>
          <FormGroup>
            <Label>Badge Color</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
              <input type="color" value={editInvCatColor} onChange={(e) => setEditInvCatColor(e.target.value)} style={{ width: 48, height: 38, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
              <InvCatBadge bg={editInvCatColor + '22'} fg={editInvCatColor}>Preview</InvCatBadge>
            </div>
          </FormGroup>
        </Modal>
      )}

      {/* Safe delete: Investment Category */}
      {deleteInvCat && (
        <Modal isOpen onClose={() => setDeleteInvCat(null)} title="Delete Holdings Category"
          footer={<>
            <Button variant="secondary" onClick={() => setDeleteInvCat(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDeleteInvCat} disabled={deletingInvCat || (deleteInvCatCount > 0 && !transferCatName)}>
              {deletingInvCat ? 'Deleting…' : 'Delete Category'}
            </Button>
          </>}>
          <p style={{ color: colors.textPrimary, marginBottom: spacing[4] }}>
            <strong>{deleteInvCat.name}</strong> is used by{' '}
            <strong>{deleteInvCatCount} holding{deleteInvCatCount !== 1 ? 's' : ''}</strong>.
            Transfer them to another category before deleting.
          </p>
          <FormGroup>
            <Label>Transfer holdings to *</Label>
            <SelectInput value={transferCatName} onChange={(e) => setTransferCatName(e.target.value)}>
              <option value="">— select a category —</option>
              {transferCatOptions.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </SelectInput>
          </FormGroup>
          {transferCatOptions.length === 0 && (
            <p style={{ fontSize: font.size.sm, color: colors.danger, marginTop: spacing[2] }}>
              No other categories available. Add another category first.
            </p>
          )}
        </Modal>
      )}

      {/* Add Investment Account */}
      <Modal isOpen={showAddAccount} onClose={() => setShowAddAccount(false)} title="Add Investment Account"
        footer={<><Button variant="secondary" onClick={() => setShowAddAccount(false)}>Cancel</Button><Button onClick={handleAddAccount} disabled={addingAccount || !newAccName.trim()}>{addingAccount ? 'Adding…' : 'Add Account'}</Button></>}>
        <FormGroup><Label>Account Name *</Label><Input value={newAccName} onChange={(e) => setNewAccName(e.target.value)} placeholder="e.g. Fidelity Roth IRA" /></FormGroup>
        <FormGroup>
          <Label>Account Type</Label>
          <SelectInput value={newAccType} onChange={(e) => setNewAccType(e.target.value)}>
            {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </SelectInput>
        </FormGroup>
        <FormGroup><Label>Institution (optional)</Label><Input value={newAccInstitution} onChange={(e) => setNewAccInstitution(e.target.value)} placeholder="e.g. Fidelity" /></FormGroup>
        <FormGroup>
          <Label>Owner (optional)</Label>
          <SelectInput value={newAccOwner ?? ''} onChange={(e) => setNewAccOwner(e.target.value === '' ? null : Number(e.target.value))}>
            <option value="">Shared / Household</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </SelectInput>
        </FormGroup>
      </Modal>

      {/* Edit Investment Account */}
      {editAccount && (
        <Modal isOpen onClose={() => setEditAccount(null)} title="Edit Investment Account"
          footer={<><Button variant="secondary" onClick={() => setEditAccount(null)}>Cancel</Button><Button onClick={handleSaveAccount} disabled={savingAccount || !editAccName.trim()}>{savingAccount ? 'Saving…' : 'Save Changes'}</Button></>}>
          <FormGroup><Label>Account Name *</Label><Input value={editAccName} onChange={(e) => setEditAccName(e.target.value)} /></FormGroup>
          <FormGroup>
            <Label>Account Type</Label>
            <SelectInput value={editAccType} onChange={(e) => setEditAccType(e.target.value)}>
              {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </SelectInput>
          </FormGroup>
          <FormGroup><Label>Institution</Label><Input value={editAccInstitution} onChange={(e) => setEditAccInstitution(e.target.value)} /></FormGroup>
          <FormGroup>
            <Label>Owner</Label>
            <SelectInput value={editAccOwner ?? ''} onChange={(e) => setEditAccOwner(e.target.value === '' ? null : Number(e.target.value))}>
              <option value="">Shared / Household</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </SelectInput>
          </FormGroup>
        </Modal>
      )}

      {/* Safe delete: Investment Account */}
      {deleteAccount && (
        <Modal isOpen onClose={() => setDeleteAccount(null)} title="Delete Investment Account"
          footer={<>
            <Button variant="secondary" onClick={() => setDeleteAccount(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDeleteAccount} disabled={deletingAccount || (deleteAccountPurchaseCount > 0 && transferToId === '')}>
              {deletingAccount ? 'Deleting…' : 'Delete Account'}
            </Button>
          </>}>
          <p style={{ color: colors.textPrimary, marginBottom: spacing[4] }}>
            <strong>{deleteAccount.name}</strong> has{' '}
            <strong>{deleteAccountPurchaseCount} purchase{deleteAccountPurchaseCount !== 1 ? 's' : ''}</strong> linked to it.
            Transfer them to another account before deleting.
          </p>
          <FormGroup>
            <Label>Transfer purchases to *</Label>
            <SelectInput value={transferToId} onChange={(e) => setTransferToId(e.target.value === '' ? '' : Number(e.target.value))}>
              <option value="">— select an account —</option>
              {transferAccOptions.map((a) => <option key={a.id} value={a.id}>{a.name} ({accountTypeLabel(a.type)})</option>)}
            </SelectInput>
          </FormGroup>
          {transferAccOptions.length === 0 && (
            <p style={{ fontSize: font.size.sm, color: colors.danger, marginTop: spacing[2] }}>
              No other accounts available. Add another account first.
            </p>
          )}
        </Modal>
      )}
    </Page>
  );
}
