'use client';

import { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
  theme: 'dark';
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'dark' });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  
  useEffect(() => {
    // Al cargar la página, inyectamos la clase 'dark' a la fuerza en el HTML
    document.documentElement.classList.add('dark');
    // Le decimos al navegador que el fondo general será oscuro (para el scrollbar)
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);