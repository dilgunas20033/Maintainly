// Central design tokens & helpers for consistent styling
export const palette = {
  primary: '#00B1F2',
  primaryDark: '#0084b5',
  bg: '#ffffff',
  bgAlt: '#f5fbfe',
  text: '#062029',
  textDim: '#5b6b74',
  border: '#c7e9f7',
  danger: '#d9534f',
  warn: '#f0ad4e',
  info: '#5bc0de',
};

export const spacing = (n: number) => n * 4;

export const radius = {
  sm: 6,
  md: 10,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
};
