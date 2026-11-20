export type Theme = "dark" | "light";
const KEY = "finpilot-theme";

export function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* storage may be blocked */ }
  try {
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  } catch { /* ignore */ }
  return "dark";
}

export function applyTheme(theme: Theme, persist = false): void {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#f5f7fb" : "#0b1020");
  if (persist) {
    try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
  }
}
