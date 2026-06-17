import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lấy cấu hình mặc định từ localStorage, nếu chưa có thì mặc định là dark
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem("cinestream:theme") as Theme) || "dark"
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove("light", "dark");
    // Thêm class hiện tại vào thẻ html
    root.classList.add(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("cinestream:theme", newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}