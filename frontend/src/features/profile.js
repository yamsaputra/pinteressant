import { $ } from "../lib/dom.js";
import { apiUpdateProfile } from "../api/profile.js";
import {
  applyTheme,
  applyGalleryLayout,
  applyUserPrefs,
  readPrefsFromFormForPreview,
} from "./prefs.js";

// Profil-Popup Logik.
//
// Hier passiert:
// - Formular mit Userdaten füllen
// - Live-Preview für Theme/Columns/Gap (ohne direkt zu speichern)
// - Speichern über /api/auth/profile
//
// Das HTML dafür kommt aus ui/templates/profilePopup.js.

// Zeigt eine kleine Statuszeile oben im Profil-Popup.
// type landet als data-attribute am Element, damit CSS das einfärben kann.
function setProfileStatus(text, type = "info") {
  const el = $("#profileStatus");
  if (!el) return;
  el.textContent = text || "";
  el.dataset.type = type;
}

// Füllt das Formular mit den Daten aus dem aktuellen User.
// Die username/email Felder sind disabled und nur zur Info da.
function fillProfileForm(user) {
  if (!user) return;

  $("#p_username").value = user?.username || "";
  $("#p_email").value = user?.email || "";
  $("#p_displayName").value = user?.displayName || "";

  $("#p_instagram").value = user?.socialLinks?.instagram || "";
  $("#p_twitter").value = user?.socialLinks?.twitter || "";
  $("#p_website").value = user?.socialLinks?.website || "";
  $("#p_publicEmail").value = user?.socialLinks?.email || "";

  $("#p_theme").value = user?.portfolioSettings?.theme || "light";
  $("#p_cols").value = user?.portfolioSettings?.defaultColumns ?? 2;
  $("#p_gap").value = user?.portfolioSettings?.defaultGap ?? 20;
}

// Liest die Werte aus dem Formular und baut ein sauberes Payload-Objekt.
// Das schicken wir dann 1:1 ans Backend.
function readProfileForm() {
  const cols = Number($("#p_cols").value);
  const gap = Number($("#p_gap").value);

  return {
    displayName: $("#p_displayName").value.trim(),
    socialLinks: {
      instagram: $("#p_instagram").value.trim(),
      twitter: $("#p_twitter").value.trim(),
      website: $("#p_website").value.trim(),
      email: $("#p_publicEmail").value.trim(),
    },
    portfolioSettings: {
      theme: $("#p_theme").value,
      defaultColumns: Number.isFinite(cols) ? cols : 2,
      defaultGap: Number.isFinite(gap) ? gap : 20,
    },
  };
}

// Wird nach dem Render aufgerufen und hängt alle Profile-Events an.
// (öffnet/schließt das Popup und verdrahtet live preview + save)
export function initProfilePopup({ user, bootstrap }) {
  const profilePop = $("#profilePop");
  const profileBtn = $("#profileBtn");
  const closeProfileBtn = $("#closeProfile");

  if (!profilePop || !profileBtn || !closeProfileBtn) return;

  const openProfile = () => {
    profilePop.classList.add("open");
    profilePop.setAttribute("aria-hidden", "false");
    setProfileStatus("");
    fillProfileForm(user);

    // Live-Preview direkt beim Öffnen
    const { theme, cols, gap } = readPrefsFromFormForPreview();
    applyTheme(theme);
    applyGalleryLayout({ cols, gap });
  };

  const closeProfile = () => {
    profilePop.classList.remove("open");
    profilePop.setAttribute("aria-hidden", "true");
    setProfileStatus("");

    // Schließen ohne speichern -> wieder auf gespeicherte User-Prefs zurück.
    applyUserPrefs(user);
  };

  profileBtn.onclick = openProfile;
  closeProfileBtn.onclick = closeProfile;

  // Klick in die dunkle Fläche -> zu
  profilePop.onclick = (e) => {
    if (e.target === profilePop) closeProfile();
  };

  // Live-Preview: sobald sich was ändert
  const themeSel = $("#p_theme");
  const colsInp = $("#p_cols");
  const gapInp = $("#p_gap");

  const live = () => {
    const { theme, cols, gap } = readPrefsFromFormForPreview();
    applyTheme(theme);
    applyGalleryLayout({ cols, gap });
  };

  if (themeSel) themeSel.onchange = live;
  if (colsInp) colsInp.oninput = live;
  if (gapInp) gapInp.oninput = live;

  // Save
  const saveBtn = $("#saveProfile");
  if (saveBtn) {
    saveBtn.onclick = async () => {
      try {
        saveBtn.disabled = true;
        setProfileStatus("Speichere…", "info");

        const payload = readProfileForm();
        await apiUpdateProfile(payload);

        setProfileStatus("✅ Profil gespeichert", "success");

        // Neu laden -> Settings kommen danach aus der API
        await bootstrap();
      } catch (e) {
        setProfileStatus("❌ " + (e?.message || String(e)), "error");
      } finally {
        saveBtn.disabled = false;
      }
    };
  }
}