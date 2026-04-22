'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, FormGroup } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { colors, font, spacing, radius } from '@/styles/tokens';
import {
  createInvestmentCategory,
  updateInvestmentCategory,
  deleteInvestmentCategory,
  createInvestmentAccount,
  updateInvestmentAccount,
  deleteInvestmentAccount,
} from '@/lib/api';
import type { InvestmentCategory, InvestmentAccount, Member } from '@/types/entities';
import { accountTypeLabel, badgeColors, ACCOUNT_TYPES } from './configHelpers';
import { Section, SectionHeader } from './components/SectionCard';
import { ColorPickerField } from './components/ColorPickerField';
import { ItemRowContainer, ColorDot, RowActions } from './components/ItemRow';
import { useCrudModal } from './hooks/useCrudModal';

interface MemberWithEmail extends Member { email: string | null }

type InvCategory = InvestmentCategory;

interface InvestmentsConfigSectionProps {
  invCategories: InvCategory[];
  setInvCategories: React.Dispatch<React.SetStateAction<InvCategory[]>>;
  accounts: InvestmentAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<InvestmentAccount[]>>;
  members: MemberWithEmail[];
}

// ─── Local useSafeDelete hook ─────────────────────────────────────────────────

function useSafeDelete() {
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [transferTarget, setTransferTarget] = useState<number | ''>('');
  const [deleting, setDeleting] = useState(false);
  return { deleteTarget, setDeleteTarget, transferTarget, setTransferTarget, deleting, setDeleting };
}

// ─── Styled components ────────────────────────────────────────────────────────

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

const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
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

const SelectInput = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  font-size: ${font.size.base};
  color: ${colors.textPrimary};
  background: ${colors.surface};
`;

// ─── Component ────────────────────────────────────────────────────────────────

export function InvestmentsConfigSection({
  invCategories,
  setInvCategories,
  accounts,
  setAccounts,
  members,
}: InvestmentsConfigSectionProps) {
  // Investment category CRUD via shared hook
  const {
    showAdd: showAddInvCat,
    setShowAdd: setShowAddInvCat,
    newName: newInvCatName,
    setNewName: setNewInvCatName,
    newColor: newInvCatColor,
    setNewColor: setNewInvCatColor,
    adding: addingInvCat,
    editItem: editInvCat,
    editName: editInvCatName,
    setEditName: setEditInvCatName,
    editColor: editInvCatColor,
    setEditColor: setEditInvCatColor,
    saving: savingInvCat,
    openEdit: openEditInvCat,
    closeEdit: closeEditInvCat,
    handleAdd: handleAddInvCatCrud,
    handleSave: handleSaveInvCatCrud,
  } = useCrudModal<InvCategory>('#6B7280');

  // Safe delete for investment category
  const catDelete = useSafeDelete();
  const [deleteInvCatCount, setDeleteInvCatCount] = useState(0);
  const [transferCatName, setTransferCatName] = useState('');
  const deletingInvCat = catDelete.deleting;

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
  const acctDelete = useSafeDelete();
  const [deleteAccountPurchaseCount, setDeleteAccountPurchaseCount] = useState(0);
  const deletingAccount = acctDelete.deleting;

  // ── Investment Categories ─────────────────────────────────────────────────

  async function handleAddInvCat() {
    await handleAddInvCatCrud(
      () => createInvestmentCategory({ name: newInvCatName.trim(), color: newInvCatColor }).then((d) => d?.category ?? null).catch(() => null),
      (item) => setInvCategories((prev) => [...prev, item]),
    );
  }

  async function handleSaveInvCat() {
    await handleSaveInvCatCrud(
      () => {
        if (!editInvCat) return Promise.resolve(null);
        return updateInvestmentCategory(editInvCat.id, { name: editInvCatName.trim(), color: editInvCatColor }).then((d) => d?.category ?? null).catch(() => null);
      },
      (item) => setInvCategories((prev) => prev.map((c) => c.id === editInvCat!.id ? item : c)),
    );
  }

  async function initiateDeleteInvCat(cat: InvCategory) {
    const result = await deleteInvestmentCategory(cat.id).catch((e) => e);
    if (result?.inUse) {
      catDelete.setDeleteTarget(cat);
      setDeleteInvCatCount(result.purchaseCount ?? 0);
      setTransferCatName('');
    } else if (result?.ok) {
      setInvCategories((prev) => prev.filter((c) => c.id !== cat.id));
    }
  }

  async function handleConfirmDeleteInvCat() {
    if (!catDelete.deleteTarget) return;
    catDelete.setDeleting(true);
    const data = await deleteInvestmentCategory(catDelete.deleteTarget.id, transferCatName || undefined).catch(() => null);
    if (data?.ok) {
      setInvCategories((prev) => prev.filter((c) => c.id !== catDelete.deleteTarget!.id));
      catDelete.setDeleteTarget(null);
    }
    catDelete.setDeleting(false);
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
      acctDelete.setDeleteTarget(acc);
      setDeleteAccountPurchaseCount(result.purchaseCount ?? 0);
      acctDelete.setTransferTarget('');
    } else if (result?.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== acc.id));
    }
  }

  async function handleConfirmDeleteAccount() {
    if (!acctDelete.deleteTarget) return;
    acctDelete.setDeleting(true);
    const data = await deleteInvestmentAccount(acctDelete.deleteTarget.id, acctDelete.transferTarget === '' ? undefined : Number(acctDelete.transferTarget)).catch(() => null);
    if (data?.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== acctDelete.deleteTarget!.id));
      acctDelete.setDeleteTarget(null);
    }
    acctDelete.setDeleting(false);
  }

  const transferAccOptions = accounts.filter((a) => a.id !== acctDelete.deleteTarget?.id);
  const transferCatOptions = invCategories.filter((c) => c.id !== catDelete.deleteTarget?.id);

  return (
    <>
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
                <ItemRowContainer key={acc.id}>
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
                              <ColorDot color={acc.owner.color} />
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
                </ItemRowContainer>
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
                  <ItemRowContainer key={cat.id}>
                    <ItemInfo>
                      <InvCatBadge bg={bg} fg={fg}>{cat.name}</InvCatBadge>
                    </ItemInfo>
                    <RowActions>
                      <Button size="sm" variant="secondary" onClick={() => openEditInvCat(cat)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => initiateDeleteInvCat(cat)}>Delete</Button>
                    </RowActions>
                  </ItemRowContainer>
                );
              })}
              {invCategories.length === 0 && <p style={{ color: colors.textMuted, fontSize: font.size.sm, padding: `${spacing[3]} 0` }}>No categories yet.</p>}
            </InvScrollList>
          </InvColumn>
        </InvColumns>
      </Section>

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
        <Modal isOpen onClose={closeEditInvCat} title="Edit Holdings Category"
          footer={<><Button variant="secondary" onClick={closeEditInvCat}>Cancel</Button><Button onClick={handleSaveInvCat} disabled={savingInvCat || !editInvCatName.trim()}>{savingInvCat ? 'Saving…' : 'Save Changes'}</Button></>}>
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
      {catDelete.deleteTarget && (
        <Modal isOpen onClose={() => catDelete.setDeleteTarget(null)} title="Delete Holdings Category"
          footer={<>
            <Button variant="secondary" onClick={() => catDelete.setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDeleteInvCat} disabled={deletingInvCat || (deleteInvCatCount > 0 && !transferCatName)}>
              {deletingInvCat ? 'Deleting…' : 'Delete Category'}
            </Button>
          </>}>
          <p style={{ color: colors.textPrimary, marginBottom: spacing[4] }}>
            <strong>{catDelete.deleteTarget.name}</strong> is used by{' '}
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
      {acctDelete.deleteTarget && (
        <Modal isOpen onClose={() => acctDelete.setDeleteTarget(null)} title="Delete Investment Account"
          footer={<>
            <Button variant="secondary" onClick={() => acctDelete.setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDeleteAccount} disabled={deletingAccount || (deleteAccountPurchaseCount > 0 && acctDelete.transferTarget === '')}>
              {deletingAccount ? 'Deleting…' : 'Delete Account'}
            </Button>
          </>}>
          <p style={{ color: colors.textPrimary, marginBottom: spacing[4] }}>
            <strong>{acctDelete.deleteTarget.name}</strong> has{' '}
            <strong>{deleteAccountPurchaseCount} purchase{deleteAccountPurchaseCount !== 1 ? 's' : ''}</strong> linked to it.
            Transfer them to another account before deleting.
          </p>
          <FormGroup>
            <Label>Transfer purchases to *</Label>
            <SelectInput value={acctDelete.transferTarget} onChange={(e) => acctDelete.setTransferTarget(e.target.value === '' ? '' : Number(e.target.value))}>
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
    </>
  );
}
