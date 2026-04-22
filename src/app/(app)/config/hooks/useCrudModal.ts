import { useState } from 'react';

export function useCrudModal<T extends { id: number; name: string; color: string }>(
  defaultColor: string = '#6B7280',
): {
  showAdd: boolean;
  setShowAdd: (v: boolean) => void;
  newName: string;
  setNewName: (v: string) => void;
  newColor: string;
  setNewColor: (v: string) => void;
  adding: boolean;
  editItem: T | null;
  editName: string;
  setEditName: (v: string) => void;
  editColor: string;
  setEditColor: (v: string) => void;
  saving: boolean;
  openEdit: (item: T) => void;
  handleAdd: (createFn: () => Promise<T | null>, onSuccess: (item: T) => void) => Promise<void>;
  handleSave: (updateFn: () => Promise<T | null>, onSuccess: (item: T) => void) => Promise<void>;
} {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(defaultColor);
  const [adding, setAdding] = useState(false);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [saving, setSaving] = useState(false);

  function openEdit(item: T) {
    setEditItem(item);
    setEditName(item.name);
    setEditColor(item.color);
  }

  async function handleAdd(createFn: () => Promise<T | null>, onSuccess: (item: T) => void) {
    if (!newName.trim()) return;
    setAdding(true);
    const data = await createFn().catch(() => null);
    if (data) {
      onSuccess(data);
      setNewName('');
      setNewColor(defaultColor);
      setShowAdd(false);
    }
    setAdding(false);
  }

  async function handleSave(updateFn: () => Promise<T | null>, onSuccess: (item: T) => void) {
    if (!editItem) return;
    setSaving(true);
    const data = await updateFn().catch(() => null);
    if (data) {
      onSuccess(data);
      setEditItem(null);
    }
    setSaving(false);
  }

  return {
    showAdd,
    setShowAdd,
    newName,
    setNewName,
    newColor,
    setNewColor,
    adding,
    editItem,
    editName,
    setEditName,
    editColor,
    setEditColor,
    saving,
    openEdit,
    handleAdd,
    handleSave,
  };
}
