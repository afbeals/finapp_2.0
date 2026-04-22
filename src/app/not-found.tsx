import Link from 'next/link';
import { colors, font, radius } from '@/styles/tokens';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.bg,
        gap: '12px',
        fontFamily: 'inherit',
      }}
    >
      <span style={{ fontSize: '48px', fontWeight: font.weight.bold, color: colors.borderStrong }}>404</span>
      <p style={{ fontSize: font.size.xl, color: colors.textSecondary, margin: 0 }}>Page not found</p>
      <p style={{ fontSize: font.size.base, color: colors.textMuted, margin: 0 }}>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link
        href="/dashboard"
        style={{
          marginTop: '8px',
          padding: '8px 20px',
          background: colors.primary,
          color: colors.surface,
          borderRadius: radius.md,
          textDecoration: 'none',
          fontSize: font.size.base,
          fontWeight: font.weight.medium,
        }}
      >
        Go to dashboard
      </Link>
    </div>
  );
}
