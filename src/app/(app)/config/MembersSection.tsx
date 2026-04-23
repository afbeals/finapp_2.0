'use client';

import React, { useState } from 'react';
import { CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, FormGroup } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { theme } from '@/styles/tokens';
import { MemberRow, MemberInfo, ColorDot, MemberName, MemberEmail } from './MembersSection.styles';
import { createMember } from '@/lib/api';

const { colors, font } = theme;
import type { Member } from '@/types/entities';
import { SectionCard } from './components/SectionCard';
import { ColorPickerField } from './components/ColorPickerField';

interface MemberWithEmail extends Member { email: string | null }

interface MembersSectionProps {
  members: MemberWithEmail[];
  setMembers: React.Dispatch<React.SetStateAction<MemberWithEmail[]>>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MembersSection({ members, setMembers }: MembersSectionProps) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberColor, setNewMemberColor] = useState('#6B7280');
  const [addingMember, setAddingMember] = useState(false);

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

  return (
    <>
      <SectionCard title="Household Members" addLabel="+ Add Member" onAdd={() => setShowAddMember(true)}>
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
      </SectionCard>

      {/* Add Member */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member"
        footer={<><Button variant="secondary" onClick={() => setShowAddMember(false)}>Cancel</Button><Button onClick={handleAddMember} disabled={addingMember || !newMemberName.trim()}>{addingMember ? 'Adding…' : 'Add Member'}</Button></>}>
        <FormGroup><Label>Name *</Label><Input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="e.g. Alex" /></FormGroup>
        <FormGroup><Label>Email (optional)</Label><Input type="email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} placeholder="alex@example.com" /></FormGroup>
        <ColorPickerField value={newMemberColor} onChange={setNewMemberColor} />
      </Modal>
    </>
  );
}
