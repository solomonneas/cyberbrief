import React, { createContext, useContext } from 'react';

export interface VariantTheme {
  id: string;
  name: string;
  className: string;
}

const ThemeContext = createContext<VariantTheme>({
  id: '1',
  name: 'SOC Operator',
  className: '',
});

export const useVariantTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ theme: VariantTheme; children: React.ReactNode }> = ({ theme, children }) => (
  <ThemeContext.Provider value={theme}>
    {children}
  </ThemeContext.Provider>
);
