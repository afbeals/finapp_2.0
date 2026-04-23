'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, FormGroup } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { theme } from '@/styles/tokens';

const { colors, font, spacing } = theme;
import { createMember } from '@/lib/api';
import type { Member } from '@/types/entities';
import { SectionCard } from './components/SectionCard';
import { ColorPickerField } from './components/ColorPickerField';

interface MemberWithEmail extends Member { email: string | null }

interface MembersSectionProps {
  members: MemberWithEmail[];
  setMembers: React.Dispatch<React.SetStateAction<MemberWithEmail[]>>;
}

// ─── Styled components ────────────────────────────────────────────────────────

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
