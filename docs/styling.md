# Styling

The app uses **styled-components** with a centralized design token system.

---

## Design Tokens

All colors, spacing, font sizes, shadows, and other design values live in one file:

```
src/styles/tokens.ts
```

Import and destructure only what you need:

```typescript
import { theme } from '@/styles/tokens';

const { colors, font, spacing, radius, shadow, transition, semanticColors } = theme;
```

### Token categories

| Token group | What it contains |
|-------------|-----------------|
| `colors` | Brand colors, text, borders, backgrounds, success/danger/warning |
| `semanticColors` | Higher-level color aliases (infoBg, warningBorderStrong, successText, etc.) |
| `font.size` | xs, sm, base, md, lg, xl, 2xl, 3xl |
| `font.weight` | normal, medium, semibold, bold |
| `spacing` | 0–16 scale as CSS strings ("4px", "8px", "16px", etc.) |
| `radius` | sm, md, lg, xl, full |
| `shadow` | sm, md, lg |
| `transition` | fast, base |
| `bp` | Breakpoints (sm, md, lg) |

---

## Co-located Styles Pattern

Every component with **more than 20 lines** of styled-components code uses a sibling `.styles.ts` file:

```
Button.tsx           ← imports from Button.styles.ts, contains logic + JSX only
Button.styles.ts     ← all styled.* definitions
```

Components with fewer than ~20 lines of styled code may keep them inline in the `.tsx` file.

### Example styles file

```typescript
// Card.styles.ts
import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, radius, shadow, spacing } = theme;

export const CardWrap = styled.div<{ padding?: 'sm' | 'md' | 'lg' }>`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.sm};
  padding: ${({ padding }) => padding === 'lg' ? spacing[8] : padding === 'md' ? spacing[6] : spacing[4]};
`;
```

### Importing in the component

```typescript
// Card.tsx
import { CardWrap } from './Card.styles';

export function Card({ children, padding = 'md' }) {
  return <CardWrap padding={padding}>{children}</CardWrap>;
}
```

---

## Styled-components Patterns

### Transient props ($ prefix)

Props used only for styling (not passed to the DOM) should use the `$` prefix:

```typescript
const Banner = styled.div<{ $editing: boolean }>`
  background: ${({ $editing }) => $editing ? 'red' : 'blue'};
`;

// Usage — $ prop is filtered from the DOM automatically
<Banner $editing={isEditMode} />
```

### shouldForwardProp (for non-HTML props without $ prefix)

For legacy or non-prefixed custom props, use `withConfig`:

```typescript
const NetChange = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'positive',
})<{ positive: boolean }>`
  color: ${({ positive }) => positive ? 'green' : 'red'};
`;
```

Both approaches prevent the "unknown prop" React warning in the console.

### Extending a component

```typescript
const ActiveCard = styled(Card)`
  border-left: 4px solid ${colors.primary};
`;
```

### Conditional styles with css helper

```typescript
import styled, { css } from 'styled-components';

const Button = styled.button<{ fullWidth?: boolean }>`
  display: inline-flex;
  ${({ fullWidth }) => fullWidth && css`width: 100%;`}
`;
```

---

## Global Styles

`src/styles/GlobalStyles.tsx` contains the CSS reset and base styles. It is mounted once in `src/app/layout.tsx`.

---

## Server-Side Rendering

`src/lib/StyledComponentsRegistry.tsx` wraps the app to collect styled-component styles on the server and inject them into the HTML. This prevents a flash of unstyled content on first load.

It is mounted in `src/app/layout.tsx`:

```tsx
<StyledComponentsRegistry>
  <GlobalStyles />
  {children}
</StyledComponentsRegistry>
```

---

## Adding a New Styled Component

1. If your component already has a `.styles.ts` file, add the export there.
2. If not, add it inline in the `.tsx` file. If you exceed ~20 lines of styled code, create a new `.styles.ts`.
3. Always import from `@/styles/tokens` — never hard-code color hex values or spacing numbers.
4. Use transient props (`$`) for style-only props to prevent DOM warnings.
