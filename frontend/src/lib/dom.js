// Mini DOM-Helpers, damit es im restlichen Code nicht so noisy wird.
//
// -> $ ist einfach nur querySelector.
// -> esc nutzen wir für alles was aus User-Daten ins HTML kommt.

// Kurzform für document.querySelector.
export const $ = (sel, root = document) => root.querySelector(sel);

// Escape für sichere HTML-Ausgabe (XSS vermeiden).
export function esc(str) {
  return (str ?? "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}