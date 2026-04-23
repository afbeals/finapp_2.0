'use client';

import React, { useEffect, useCallback } from 'react';
import { Overlay, Dialog, ModalHeader, ModalTitle, CloseButton, ModalBody, ModalFooter } from './Modal.styles';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, width }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Dialog width={width} role="dialog" aria-modal>
        {title != null && (
          <ModalHeader>
            <ModalTitle>{title}</ModalTitle>
            <CloseButton onClick={onClose} aria-label="Close modal">✕</CloseButton>
          </ModalHeader>
        )}
        <ModalBody>{children}</ModalBody>
        {footer != null && <ModalFooter>{footer}</ModalFooter>}
      </Dialog>
    </Overlay>
  );
}
