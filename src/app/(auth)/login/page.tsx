'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/styles/tokens';
import {
  Page, Card, Header, Logo, Title, Subtitle,
  SectionLabel, MemberGrid, MemberButton, Avatar, MemberName,
  PinLabel, PinDots, PinDot, Keypad, KeyButton, ErrorMessage,
} from './LoginPage.styles';
import { Button } from '@/components/ui/Button';
import type { Member } from '@/types/entities';

const { colors } = theme;

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
