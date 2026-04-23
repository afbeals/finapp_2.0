'use client';

import React, { useState } from 'react';
import { CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, FormGroup } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { theme } from '@/styles/tokens';
import {
  ColHeader, ColTitle, ScrollList, ItemInfo, InvCatBadge, SelectInput,
} from './InvestmentsConfigSection.styles';

const { colors, font, spacing } = theme;
import {
  createInvestmentCategory,
  updateInvestmentCategory,
  deleteInvestmentCategory,
} from '@/lib/api';
import type { InvestmentCategory } from '@/types/entities';
import { badgeColors } from './configHelpers';
import { Section, SectionHeader } from './components/SectionCard';
import { ItemRowContainer, RowActions } from './components/ItemRow';
import { useCrudModal } from './hooks/useCrudModal';

type InvCategory = InvestmentCategory;

interface InvestmentsConfigSectionProps {
  invCategories: InvCategory[];
  setInvCategories: React.Dispatch<React.SetStateAction<InvCategory[]>>;
}

// ─── Local useSafeDelete hook ─────────────────────────────────────────────────

function useSafeDelete() {
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [transferTarget, setTransferTarget] = useState<number | ''>('');
  const [deleting, setDeleting] = useState(false);
  return { deleteTarget, setDeleteTarget, transferTarget, setTransferTarget, deleting, setDeleting };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InvestmentsConfigSection({
  invCategories,
  setInvCategories,
}: InvestmentsConfigSectionProps) {
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

  const catDelete = useSafeDelete();
  const [deleteInvCatCount, setDeleteInvCatCount] = useState(0);
  const [transferCatName, setTransferCatName] = useState('');
  const deletingInvCat = catDelete.deleting;

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

  const transferCatOptions = invCategories.filter((c) => c.id !== catDelete.deleteTarget?.id);

  return (
    <>
      <Section padding="md">
        <SectionHeader>
          <CardTitle>Investments</CardTitle>
        </SectionHeader>

        <ColHeader style={{ marginTop: spacing[4] }}>
          <ColTitle>Holdings Categories</ColTitle>
          <Button size="sm" onClick={() => setShowAddInvCat(true)}>+ Add</Button>
        </ColHeader>
        <ScrollList>
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
          {invCategories.length === 0 && (
            <p style={{ color: colors.textMuted, fontSize: font.size.sm, padding: `${spacing[3]} 0` }}>
              No categories yet.
            </p>
          )}
        </ScrollList>
      </Section>

      {/* Add Holdings Category */}
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

      {/* Edit Holdings Category */}
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

      {/* Safe delete: Holdings Category */}
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
    </>
  );
}
