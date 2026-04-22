'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { colors, font, radius, shadow, spacing } from '@/styles/tokens';
import { Button } from '@/components/ui/Button';

interface Member {
  id: number;
  name: string;
  color: string;
}

const Page = styled.div`
  min-height: 100vh;
  background: ${colors.bg};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${spacing[4]};
`;

const Card = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.xl};
  box-shadow: ${shadow.lg};
  width: 100%;
  max-width: 400px;
  padding: ${spacing[8]};
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${spacing[8]};
`;

const Logo = styled.div`
  width: 56px;
  height: 56px;
  background: ${colors.navbar};
  border-radius: ${radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto ${spacing[4]};
`;

const Title = styled.h1`
  font-size: ${font.size['3xl']};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing[1]};
`;

const Subtitle = styled.p`
  font-size: ${font.size.base};
  color: ${colors.textMuted};
`;

const SectionLabel = styled.p`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${colors.textSecondary};
  margin-bottom: ${spacing[3]};
`;

const MemberGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing[3]};
  margin-bottom: ${spacing[6]};
`;

const MemberButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['selected', 'memberColor'].includes(prop),
})<{ selected: boolean; memberColor: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${spacing[2]};
  padding: ${spacing[4]};
  border-radius: ${radius.lg};
  border: 2px solid ${({ selected, memberColor }) => selected ? memberColor : colors.border};
  background: ${({ selected, memberColor }) => selected ? `${memberColor}15` : colors.surface};
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease;

  &:hover {
    border-color: ${({ memberColor }) => memberColor};
    background: ${({ memberColor }) => `${memberColor}10`};
  }
`;

const Avatar = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'color',
})<{ color: string }>`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${({ color }) => color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.surface};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.semibold};
`;

const MemberName = styled.span`
  font-size: ${font.size.base};
  font-weight: ${font.weight.medium};
  color: ${colors.textPrimary};
`;

const PinLabel = styled.label`
  display: block;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${colors.textSecondary};
  margin-bottom: ${spacing[2]};
`;

const PinDots = styled.div`
  display: flex;
  gap: ${spacing[3]};
  justify-content: center;
  margin-bottom: ${spacing[6]};
`;

const PinDot = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'filled',
})<{ filled: boolean }>`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid ${({ filled }) => filled ? colors.primary : colors.border};
  background: ${({ filled }) => filled ? colors.primary : 'transparent'};
  transition: background 100ms ease, border-color 100ms ease;
`;

const Keypad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${spacing[2]};
  margin-bottom: ${spacing[6]};
`;

const KeyButton = styled.button`
  height: 52px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.medium};
  color: ${colors.textPrimary};
  cursor: pointer;
  transition: background 100ms ease;

  &:hover {
    background: ${colors.bg};
  }

  &:active {
    background: ${colors.border};
  }
`;

const ErrorMessage = styled.p`
  text-align: center;
  font-size: ${font.size.sm};
  color: ${colors.danger};
  margin-bottom: ${spacing[4]};
`;

const PIN_LENGTH = 4;

export default function LoginPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/households/members')
      .then((r) => r.json())
      .then((data) => {
        setMembers(data.members ?? []);
        if (data.members?.length > 0) setSelectedMemberId(data.members[0].id);
      })
      .catch(() => setError('Could not load members'));
  }, []);

  function handleKey(key: string) {
    if (pin.length >= PIN_LENGTH) return;
    setError('');
    setPin((p) => p + key);
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1));
    setError('');
  }

  async function handleSubmit() {
    if (pin.length < PIN_LENGTH || selectedMemberId === null) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, memberId: selectedMemberId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Login failed');
        setPin('');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong');
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === PIN_LENGTH) handleSubmit();
  }, [pin]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <Page>
      <Card>
        <Header>
          <Logo>💰</Logo>
          <Title>Financial Review</Title>
          <Subtitle>Beals-Gibson Household</Subtitle>
        </Header>

        <SectionLabel>Who are you?</SectionLabel>
        <MemberGrid>
          {members.map((member) => (
            <MemberButton
              key={member.id}
              selected={member.id === selectedMemberId}
              memberColor={member.color}
              onClick={() => { setSelectedMemberId(member.id); setPin(''); setError(''); }}
            >
              <Avatar color={member.color}>{member.name[0]}</Avatar>
              <MemberName>{member.name}</MemberName>
            </MemberButton>
          ))}
        </MemberGrid>

        <PinLabel>
          Enter PIN{selectedMember ? ` for ${selectedMember.name}` : ''}
        </PinLabel>
        <PinDots>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <PinDot key={i} filled={i < pin.length} />
          ))}
        </PinDots>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Keypad>
          {['1','2','3','4','5','6','7','8','9'].map((k) => (
            <KeyButton key={k} onClick={() => handleKey(k)}>{k}</KeyButton>
          ))}
          <KeyButton onClick={handleBackspace}>⌫</KeyButton>
          <KeyButton onClick={() => handleKey('0')}>0</KeyButton>
          <KeyButton
            onClick={handleSubmit}
            style={{ background: pin.length === PIN_LENGTH ? colors.primary : undefined, color: pin.length === PIN_LENGTH ? colors.surface : undefined }}
          >
            {loading ? '...' : '→'}
          </KeyButton>
        </Keypad>

        <Button
          variant="primary"
          fullWidth
          disabled={pin.length < PIN_LENGTH || selectedMemberId === null || loading}
          onClick={handleSubmit}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </Button>
      </Card>
    </Page>
  );
}
