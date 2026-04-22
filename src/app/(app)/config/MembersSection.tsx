'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, FormGroup } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { colors, font, spacing } from '@/styles/tokens';
import { createMember } from '@/lib/api';
import type { Member } from '@/types/entities';

interface MemberWithEmail extends Member { email: string | null }

interface MembersSectionProps {
  members: MemberWithEmail[];
  setMembers: React.Dispatch<React.SetStateAction<MemberWithEmail[]>>;
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
    </>
  );
}
