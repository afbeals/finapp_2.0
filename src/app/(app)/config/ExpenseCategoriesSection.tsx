'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Label, FormGroup } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { colors, font } from '@/styles/tokens';
import {
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from '@/lib/api';
import type { ExpenseCategory } from '@/types/entities';
import { SectionCard } from './components/SectionCard';
import { ColorPickerField } from './components/ColorPickerField';
import { ItemRow } from './components/ItemRow';
import { useCrudModal } from './hooks/useCrudModal';

interface ExpenseCategoriesSectionProps {
  expenseCategories: ExpenseCategory[];
  setExpenseCategories: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExpenseCategoriesSection({ expenseCategories, setExpenseCategories }: ExpenseCategoriesSectionProps) {
  const {
    showAdd: showAddExpCat,
    setShowAdd: setShowAddExpCat,
    newName: newExpCatName,
    setNewName: setNewExpCatName,
    newColor: newExpCatColor,
    setNewColor: setNewExpCatColor,
    adding: addingExpCat,
    editItem: editExpCat,
    editName: editExpCatName,
    setEditName: setEditExpCatName,
    editColor: editExpCatColor,
    setEditColor: setEditExpCatColor,
    saving: savingExpCat,
    openEdit: openEditExpCat,
    closeEdit: closeEditExpCat,
    handleAdd,
    handleSave,
  } = useCrudModal<ExpenseCategory>('#6B7280');

  const [newExpCatIcon, setNewExpCatIcon] = React.useState('📦');
  const [editExpCatIcon, setEditExpCatIcon] = React.useState('');

  async function handleAddExpCat() {
    await handleAdd(
      () => createExpenseCategory({ name: newExpCatName.trim(), icon: newExpCatIcon.trim() || '📦', color: newExpCatColor }).then((d) => d?.category ?? null).catch(() => null),
      (item) => {
        setExpenseCategories((prev) => [...prev, item]);
        setNewExpCatIcon('📦');
      },
    );
  }

  function openEditExpCatWithIcon(cat: ExpenseCategory) {
    openEditExpCat(cat);
    setEditExpCatIcon(cat.icon);
  }

  async function handleSaveExpCat() {
    await handleSave(
      () => {
        if (!editExpCat) return Promise.resolve(null);
        return updateExpenseCategory(editExpCat.id, { name: editExpCatName.trim(), icon: editExpCatIcon.trim(), color: editExpCatColor }).then((d) => d?.category ?? null).catch(() => null);
      },
      (item) => setExpenseCategories((prev) => prev.map((c) => c.id === editExpCat!.id ? item : c)),
    );
  }

  async function handleDeleteExpCat(id: number) {
    if (!confirm('Delete this category? Expenses using it will be unaffected.')) return;
    const data = await deleteExpenseCategory(id).catch(() => null);
    if (data?.ok) setExpenseCategories((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <>
      <SectionCard title="Expense Categories" addLabel="+ Add Category" onAdd={() => setShowAddExpCat(true)}>
        {expenseCategories.map((cat) => (
          <ItemRow key={cat.id} color={cat.color} onEdit={() => openEditExpCatWithIcon(cat)} onDelete={() => handleDeleteExpCat(cat.id)}>
            <span style={{ fontSize: font.size.lg }}>{cat.icon}</span>
            <span style={{ fontSize: font.size.base, color: colors.textPrimary }}>{cat.name}</span>
          </ItemRow>
        ))}
        {expenseCategories.length === 0 && <p style={{ color: colors.textMuted, fontSize: font.size.sm }}>No categories yet.</p>}
      </SectionCard>

      {/* Add Expense Category */}
      <Modal isOpen={showAddExpCat} onClose={() => setShowAddExpCat(false)} title="Add Expense Category"
        footer={<><Button variant="secondary" onClick={() => setShowAddExpCat(false)}>Cancel</Button><Button onClick={handleAddExpCat} disabled={addingExpCat || !newExpCatName.trim()}>{addingExpCat ? 'Adding…' : 'Add Category'}</Button></>}>
        <FormGroup><Label>Name *</Label><Input value={newExpCatName} onChange={(e) => setNewExpCatName(e.target.value)} placeholder="e.g. Entertainment" /></FormGroup>
        <FormGroup><Label>Icon (emoji)</Label><Input value={newExpCatIcon} onChange={(e) => setNewExpCatIcon(e.target.value)} placeholder="📦" maxLength={4} /></FormGroup>
        <ColorPickerField value={newExpCatColor} onChange={setNewExpCatColor} />
      </Modal>

      {/* Edit Expense Category */}
      {editExpCat && (
        <Modal isOpen onClose={closeEditExpCat} title="Edit Expense Category"
          footer={<><Button variant="secondary" onClick={closeEditExpCat}>Cancel</Button><Button onClick={handleSaveExpCat} disabled={savingExpCat || !editExpCatName.trim()}>{savingExpCat ? 'Saving…' : 'Save Changes'}</Button></>}>
          <FormGroup><Label>Name</Label><Input value={editExpCatName} onChange={(e) => setEditExpCatName(e.target.value)} /></FormGroup>
          <FormGroup><Label>Icon (emoji)</Label><Input value={editExpCatIcon} onChange={(e) => setEditExpCatIcon(e.target.value)} maxLength={4} /></FormGroup>
          <ColorPickerField value={editExpCatColor} onChange={setEditExpCatColor} />
        </Modal>
      )}
    </>
  );
}
