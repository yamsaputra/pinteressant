// profile.js
// -> Profil-Popup öffnen/schließen
// -> Profil speichern (PUT /api/auth/profile)
// -> Live Preview: Theme + Columns/Gap sofort beim Ändern

import { getToken } from "../auth.js";
import { $ } from "../main.js";
import { applyUserPrefs } from "./prefs.js";

// -------------------------------
// // API: Profil speichern
// -------------------------------
async function apiUpdateProfile(payload) {
  const res = await fetch("/api/auth/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken(),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.details || "Profil konnte nicht gespeichert werden.");
  return data;
}

// -------------------------------
// // Statusanzeige im Popup
// -------------------------------
function setProfileStatus(text, type = "info") {
  const el = $("#profileStatus");
  if (!el) return;
  el.textContent = text || "";
  el.dataset.type = type;
}

// -------------------------------
// // Form füllen
// -------------------------------
function fillProfileForm(user) {
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

// -------------------------------
// // Form lesen
// -------------------------------
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

// -------------------------------
// // Live Preview (ohne speichern)
// -------------------------------
function livePreviewFromForm() {
  const fakeUser = {
    portfolioSettings: {
      theme: $("#p_theme")?.value || "light",
      defaultColumns: Number($("#p_cols")?.value),
      defaultGap: Number($("#p_gap")?.value),
    },
  };

  // -> Theme/Layout sofort anwenden
  applyUserPrefs(fakeUser);
}

// -------------------------------
// // Wiring Profil Popup
// -------------------------------
export function wireProfilePopup(user, { onSaved }) {
  if (!user) return;

  const profilePop = $("#profilePop");
  const profileBtn = $("#profileBtn");
  const closeBtn = $("#closeProfile");

  // -> öffnen
  const open = () => {
    profilePop.classList.add("open");
    profilePop.setAttribute("aria-hidden", "false");
    setProfileStatus("");
    fillProfileForm(user);
    livePreviewFromForm();
  };

  // -> schließen
  const close = () => {
    profilePop.classList.remove("open");
    profilePop.setAttribute("aria-hidden", "true");
    setProfileStatus("");
    // -> zurück auf echte User-Prefs (API)
    applyUserPrefs(user);
  };

  if (profileBtn) profileBtn.onclick = open;
  if (closeBtn) closeBtn.onclick = close;

  // -> Klick außerhalb schließt
  profilePop.onclick = (e) => {
    if (e.target === profilePop) close();
  };

  // -> Live Preview Events
  $("#p_theme").onchange = livePreviewFromForm;
  $("#p_cols").oninput = livePreviewFromForm;
  $("#p_gap").oninput = livePreviewFromForm;

  // -> speichern
  const saveBtn = $("#saveProfile");
  saveBtn.onclick = async () => {
    try {
      saveBtn.disabled = true;
      setProfileStatus("Speichere…", "info");

      const payload = readProfileForm();
      await apiUpdateProfile(payload);

      setProfileStatus("✅ Profil gespeichert", "success");

      // -> App neu bootstrappen (holt neuen User)
      if (onSaved) await onSaved();
    } catch (e) {
      setProfileStatus("❌ " + (e?.message || String(e)), "error");
    } finally {
      saveBtn.disabled = false;
    }
  };
}
