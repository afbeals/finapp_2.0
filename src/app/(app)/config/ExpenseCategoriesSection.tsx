'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, FormGroup } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { colors, font, spacing } from '@/styles/tokens';
import {
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from '@/lib/api';
import type { ExpenseCategory } from '@/types/entities';

interface ExpenseCategoriesSectionProps {
  expenseCategories: ExpenseCategory[];
  setExpenseCategories: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
}

// ─── Styled components ────────────────────────────────────────────────────────

const Section = styled(Card)`
  margin-bottom: ${spacing[6]};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing[4]};
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

const SmallDot = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'color',
})<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ color }) => color};
  flex-shrink: 0;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export function ExpenseCategoriesSection({ expenseCategories, setExpenseCategories }: ExpenseCategoriesSectionProps) {
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

  return (
    <>
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
    </>
  );
}
