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

interface EnableEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function EnableEditModal({ isOpen, onClose, onConfirm }: EnableEditModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enable Editing"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>
            Yes, Enable Editing
          </Button>
        </>
      }
    >
      <Body>
        This review has been completed. Enabling editing will allow you to modify
        entries, but the completion date will be preserved. Are you sure you want
        to continue?
      </Body>
    </Modal>
  );
}
