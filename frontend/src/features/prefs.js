import { $ } from "../lib/dom.js";

// Theme + Layout Einstellungen.
//
// Die Werte kommen aus user.portfolioSettings (vom Backend gespeichert).
// Wir verwenden CSS-Variablen (--gallery-cols / --gallery-gap), damit man
// im CSS easy reagieren kann.

// Theme (light/dark) einfach am <html> hängen, damit CSS reagieren kann.
export function applyTheme(theme) {
  const t = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = t;
}

// Layout für die Galerien (Spalten + Abstand). Wird über CSS-Variablen gelöst.
export function applyGalleryLayout({ cols, gap }) {
  const root = document.documentElement;

  const nCols = Number(cols);
  const nGap = Number(gap);

  const useCols =
    Number.isFinite(nCols) && nCols >= 1 && nCols <= 6 ? nCols : null;
  const useGap = Number.isFinite(nGap) && nGap >= 0 && nGap <= 80 ? nGap : null;

  if (useGap !== null) root.style.setProperty("--gallery-gap", `${useGap}px`);
  else root.style.removeProperty("--gallery-gap");

  // pending + main gallery (kann beim ersten Render noch nicht existieren)
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

// Kombi: Theme + Layout aus dem User-Objekt.
export function applyUserPrefs(user) {
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

// Für Live-Preview im Profil-Popup.
export function readPrefsFromFormForPreview() {
  const theme = $("#p_theme")?.value || "light";
  const cols = Number($("#p_cols")?.value);
  const gap = Number($("#p_gap")?.value);
  return { theme, cols, gap };
}