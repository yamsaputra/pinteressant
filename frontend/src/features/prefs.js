// prefs.js
// -> Wendet Theme (light/dark) und Galerie-Layout (Columns/Gap) an

import { $ } from "../main.js"; // wir exportieren $ aus main.js, damit du keine extra ui.js brauchst

export function applyTheme(theme) {
  // -> setzt html[data-theme="dark"] oder light
  const t = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = t;
}

export function applyGalleryLayout({ cols, gap }) {
  // -> setzt CSS Variablen für Spalten/Abstand
  const root = document.documentElement;

  const nCols = Number(cols);
  const nGap = Number(gap);

  const useCols = Number.isFinite(nCols) && nCols >= 1 && nCols <= 6 ? nCols : null;
  const useGap = Number.isFinite(nGap) && nGap >= 0 && nGap <= 80 ? nGap : null;

  // -> Abstand
  if (useGap !== null) root.style.setProperty("--gallery-gap", `${useGap}px`);
  else root.style.removeProperty("--gallery-gap");

  // -> Spalten (auf #gallery und #pending)
  const galleries = [$("#gallery"), $("#pending")].filter(Boolean);
  galleries.forEach((g) => {
    if (useCols) {
      root.style.setProperty("--gallery-cols", String(useCols));
      g.classList.add("fixedCols");
    } else {
      g.classList.remove("fixedCols");
    }
  });
}

export function applyUserPrefs(user) {
  // -> nur wenn eingeloggt: Theme/Layout aus API-User anwenden
  if (!user) {
    applyTheme("light");
    applyGalleryLayout({ cols: null, gap: null });
    return;
  }

  const theme = user?.portfolioSettings?.theme || "light";
  const cols = user?.portfolioSettings?.defaultColumns ?? null;
  const gap = user?.portfolioSettings?.defaultGap ?? null;

  applyTheme(theme);
  applyGalleryLayout({ cols, gap });
}
