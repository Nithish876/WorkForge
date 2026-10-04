import { createTheme, MantineColorsTuple } from '@mantine/core';

// Signature Upwork Green Palette
const upworkGreen: MantineColorsTuple = [
  '#f2fbf2',
  '#e0f7e0',
  '#bfeec0',
  '#8de08f',
  '#4fcb52',
  '#14a800', // Signature Upwork Emerald Green
  '#108a00', // Hover
  '#0d7200', // Dark
  '#0a5a00',
  '#074500',
];

// Deep Forest Dark Mode Palette
const upworkDark: MantineColorsTuple = [
  '#f3fbf6',
  '#d5ede0',
  '#aed6c0',
  '#82b99b',
  '#599774',
  '#3a7455',
  '#203f31', // Subtle border
  '#152d22', // Card surface
  '#0f2219', // Elevated surface
  '#091610', // Deep app background
];

export const theme = createTheme({
  primaryColor: 'green',
  primaryShade: { light: 5, dark: 5 },
  colors: {
    green: upworkGreen,
    dark: upworkDark,
  },
  fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '600',
  },
  defaultRadius: 'md',
  cursorType: 'pointer',
  components: {
    Button: {
      defaultProps: {
        radius: 'xl',
        color: 'green',
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        padding: 'md',
      },
    },
    Paper: {
      defaultProps: {
        radius: 'lg',
      },
    },
    Badge: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    PasswordInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    Textarea: {
      defaultProps: {
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});
