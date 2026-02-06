import { logout } from "../auth.js";
import { $ } from "../lib/dom.js";
import { applyUserPrefs } from "../features/prefs.js";

import { initAuthPopup } from "../features/authPopup.js";
import { initUploader } from "../features/uploader.js";
import { initProfilePopup } from "../features/profile.js"; 

import {
  headerHtml,
  uploaderHtml,
  loginPopupHtml,
  profilePopupHtml,
} from "../ui/templates/index.js";

// Haupt-Renderer.
//
// Was macht diese Datei?
// - Baut das Grund-HTML (Header, Uploader, Popups)
// - hängt danach die Event-Handler dran (Login, Profil, Upload etc.)
//
// Warum so?
// - HTML ist hier zentral und die Feature-Logik bleibt in /features.

export function render({ user, bootstrap }) {
  // Theme/Layout direkt setzen (damit es nicht kurz flackert).
  applyUserPrefs(user);

  const who = user?.displayName || user?.username || user?.email || "";

  const app = $("#app");
  if (!app) return;

  // Erst mal alles ins DOM schreiben.
  // Danach können wir entspannt querySelecten und Events setzen.
  app.innerHTML = `
    ${headerHtml(user, who)}
    ${uploaderHtml(user)}
    ${loginPopupHtml()}
    ${profilePopupHtml()}
  `;

  // Logout ist im Header, daher hier direkt verdrahten.
  const logoutBtn = $("#logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      try {
        await logout();
        await bootstrap();
      } catch (e) {
        console.error("Logout Fehler:", e);
      }
    };
  }

  // Login/Register Popup ist immer im DOM.
  initAuthPopup({ bootstrap });

  // Alles weitere nur wenn eingeloggt.
  if (user) {
    // nach dem Render: Layout nochmal auf die neuen Gallery-Elemente anwenden
    applyUserPrefs(user);

    initUploader({ user });
    initProfilePopup({ user, bootstrap });
  }
}