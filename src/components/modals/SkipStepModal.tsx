'use client';

import React from 'react';
import styled from 'styled-components';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { colors, font } from '@/styles/tokens';

const Body = styled.p`
  font-size: ${font.size.base};
  color: ${colors.textSecondary};
  line-height: 1.6;
`;

interface SkipStepModalProps {
  isOpen: boolean;
  stepName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function SkipStepModal({ isOpen, stepName, onClose, onConfirm }: SkipStepModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Skip ${stepName}?`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Go Back</Button>
          <Button variant="ghost" onClick={() => { onConfirm(); onClose(); }}>
            Skip This Step
          </Button>
        </>
      }
    >
      <Body>
        You can skip this step and come back to it later. The review will continue
        to the next step. Skipped steps are marked and can be completed any time
        before finalizing.
      </Body>
    </Modal>
  );
}
