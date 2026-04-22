'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { colors, font, radius } from '@/styles/tokens';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 56px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.bg,
        gap: '12px',
        fontFamily: 'inherit',
      }}
    >
      <span style={{ fontSize: '48px', fontWeight: font.weight.bold, color: colors.borderStrong }}>Oops</span>
      <p style={{ fontSize: font.size.xl, color: colors.textSecondary, margin: 0 }}>Something went wrong</p>
      <p style={{ fontSize: font.size.base, color: colors.textMuted, margin: 0, maxWidth: '400px', textAlign: 'center' }}>
        {error.message || 'An unexpected error occurred. Try refreshing the page.'}
      </p>
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          onClick={reset}
          style={{
            padding: '8px 20px',
            background: colors.primary,
            color: colors.surface,
            border: 'none',
            borderRadius: radius.md,
            cursor: 'pointer',
            fontSize: font.size.base,
            fontWeight: font.weight.medium,
          }}
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          style={{
            padding: '8px 20px',
            background: colors.surface,
            color: colors.textSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            textDecoration: 'none',
            fontSize: font.size.base,
            fontWeight: font.weight.medium,
          }}
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
