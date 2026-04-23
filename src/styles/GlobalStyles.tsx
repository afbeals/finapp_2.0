'use client';

import { createGlobalStyle } from 'styled-components';
import { theme } from './tokens';

const { colors, font } = theme;

const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 14px;
    -webkit-text-size-adjust: 100%;
  }

  body {
    font-family: ${font.family};
    font-size: ${font.size.base};
    font-weight: ${font.weight.normal};
    line-height: ${font.lineHeight.normal};
    color: ${colors.textPrimary};
    background-color: ${colors.bg};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  a {
    color: ${colors.primary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  button {
    font-family: inherit;
    cursor: pointer;
  }

  input, select, textarea {
    font-family: inherit;
    font-size: inherit;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: ${font.weight.semibold};
    line-height: ${font.lineHeight.tight};
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: ${colors.borderStrong};
    border-radius: 3px;

    &:hover {
      background: ${colors.textDisabled};
    }
  }
`;

export default GlobalStyles;
