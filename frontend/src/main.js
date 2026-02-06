import "./style.css";
import { login, register, refresh, me, logout, getToken } from "./auth.js";

const LOGO_PATH = "/Pinteressant_Probe_Logo.png";
const PROFILE_ICON_PATH = "/profile_icon.png"; // -> /frontend/public/profile_icon.png

/**
 * @title Query Selector Shortcut
 * @description Kurzform für document.querySelector, gibt das erste passende DOM-Element zurück.
 * @param {String} sel - CSS-Selektor
 * @returns {HTMLElement|null} Gefundenes DOM-Element oder null
 */
const $ = (sel) => document.querySelector(sel);

/**
 * @title Escape HTML
 * @description Escaped einen String für sichere HTML-Ausgabe (verhindert XSS). Ersetzt &, <, >, ", ' durch HTML-Entities.
 * @param {String} str - Zu escapender String
 * @returns {String} HTML-sicherer String
 */
function esc(str) {
  return (str ?? "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** ========= Gallery (LOCAL list) =========
 * - Bilddateien werden per API hochgeladen (Cloudinary).
 * - Liste der Bild-URLs speichern wir vorerst lokal (localStorage),
 *   bis ihr später eine API "meine Bilder" habt.
 */
const GALLERY_KEY = "myGalleryImages";

/**
 * @title Load Gallery
 * @description Lädt die Galerie-Daten (Bild-URLs und PublicIDs) aus dem localStorage.
 * @returns {Array} Array von Galerie-Einträgen (Objekte mit imageURL/publicID oder Strings)
 */
function loadGallery() {
  try {
    return JSON.parse(localStorage.getItem(GALLERY_KEY) || "[]");
  } catch {
    return [];
  }
}
/**
 * @title Save Gallery
 * @description Speichert die Galerie-Daten als JSON-Array im localStorage.
 * @param {Array} arr - Array von Galerie-Einträgen zum Speichern
 */
function saveGallery(arr) {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(arr));
}

/**
 * @title Apply Theme
 * @description Setzt das Farbthema (light/dark) auf dem HTML-Root-Element.
 * @param {String} theme - "light" oder "dark"
 */
function applyTheme(theme) {
  const t = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = t;
}

/**
 * @title Apply Gallery Layout
 * @description Setzt CSS-Custom-Properties für Spaltenanzahl und Abstand der Galerie und wendet sie auf Gallery-Elemente an.
 * @param {Object} options - Layout-Optionen
 * @param {Number|null} options.cols - Anzahl der Spalten (1–6) oder null für Auto-Layout
 * @param {Number|null} options.gap - Abstand in Pixeln (0–80) oder null für Standard
 */
function applyGalleryLayout({ cols, gap }) {
  const root = document.documentElement;

  const nCols = Number(cols);
  const nGap = Number(gap);

  const useCols =
    Number.isFinite(nCols) && nCols >= 1 && nCols <= 6 ? nCols : null;
  const useGap = Number.isFinite(nGap) && nGap >= 0 && nGap <= 80 ? nGap : null;

  if (useGap !== null) root.style.setProperty("--gallery-gap", `${useGap}px`);
  else root.style.removeProperty("--gallery-gap");

  // pending + main gallery
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

/**
 * @title Apply User Preferences
 * @description Wendet Theme und Gallery-Layout basierend auf den portfolioSettings des Benutzers an. Setzt Standardwerte wenn nicht eingeloggt.
 * @param {Object|null} user - User-Objekt mit portfolioSettings oder null
 */
function applyUserPrefs(user) {
  if (!user) {
    // nicht eingeloggt -> immer light und Standardlayout
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

/**
 * @title Files to Data URLs
 * @description Konvertiert eine FileList in ein Array von Base64-Data-URLs. Filtert nur Bilddateien.
 * @param {FileList} fileList - Liste von Dateien aus einem File-Input
 * @returns {Promise<String[]>} Array von Base64-Data-URL-Strings
 */
async function filesToDataUrls(fileList) {
  const files = Array.from(fileList || []).filter((f) =>
    f.type.startsWith("image/"),
  );
  const readers = files.map(
    (file) =>
      new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      }),
  );
  return Promise.all(readers);
}

/**
 * @title File to Data URL
 * @description Konvertiert eine einzelne Datei in eine Base64-Data-URL.
 * @param {File} file - Datei-Objekt zum Konvertieren
 * @returns {Promise<String>} Base64-Data-URL der Datei
 */
async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result); // data:image/...;base64,...
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/**
 * @title API Upload Image
 * @description Lädt ein Bild als Base64-Data-URL über die Backend-API hoch (POST /api/upload). Sendet Titel und imageURL als JSON.
 * @param {Object} options - Upload-Optionen
 * @param {String} options.dataUrl - Base64-Data-URL des Bildes
 * @param {String} [options.title="Upload"] - Titel des Bildes
 * @throws Error bei fehlgeschlagenem Upload oder ungültiger Server-Antwort
 * @returns {Object} Upload-Antwort mit photo-Objekt (inkl. image.url, image.publicID)
 */
async function apiUploadImageDataUrl({ dataUrl, title }) {
  console.log("DEV api/upload: Uploading image via /api/upload");

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken(),
    },
    body: JSON.stringify({
      title: title || "Upload",
      description: "",
      imageURL: dataUrl,
    }),
  });

  const text = await res.text();
  console.log("DEV api/upload: Upload response text:", text);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Upload hat kein JSON geliefert (Status ${res.status}). Antwort beginnt mit: ${text.slice(0, 60)}`,
    );
  }

  if (!res.ok) throw new Error(data?.error || data?.details || "Upload failed");
  return data;
}
/**
 * @title API Delete Photo
 * @description Löscht ein Foto über die Backend-API anhand der Cloudinary publicID (DELETE /api/photos/:publicID).
 * @param {String} publicID - Cloudinary Public ID des Bildes (z.B. "portfolio/user123/abc")
 * @throws Error bei fehlgeschlagener Löschung
 * @returns {Boolean} true bei erfolgreicher Löschung
 */
async function apiDeletePhoto(publicID) {
  const deleteAPI = `/api/photos/${encodeURIComponent(publicID)}`;
  console.log("DEV apiDeletePhoto: Deleting photo via", deleteAPI);
  const res = await fetch(deleteAPI, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + getToken(),
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Löschen fehlgeschlagen");
  }
  return true;
}

/** ========= Pending selection ========= */
let pendingFiles = [];
let pendingPreviews = [];

/**
 * @title Render Gallery
 * @description Rendert die Galerie mit den Bildern aus loadGallery() und bindet die Lösch-Buttons ein. Beim Klick auf Löschen wird das Bild aus der Galerie entfernt und, falls es eine publicID hat, auch über die API gelöscht.
 */
function renderGallery() {
  const galleryEl = $("#gallery");
  if (!galleryEl) return;

  const imgs = loadGallery();
  if (!imgs.length) {
    galleryEl.innerHTML = `<div class="hint">Noch keine Bilder in deiner Galerie.</div>`;
    return;
  }

  // Support both old format (string URLs) and new format (objects)
  galleryEl.innerHTML = imgs
    .map((item, i) => {
      const src = typeof item === "string" ? item : item.imageURL;
      const pid = typeof item === "string" ? "" : item.publicID || "";
      return `
        <div class="thumb">
          <img src="${src}" alt="upload ${i}" />
          <button class="xmini" data-i="${i}" data-pid="${pid}" title="Bild löschen">×</button>
        </div>
      `;
    })
    .join("");

  galleryEl.querySelectorAll(".xmini").forEach((btn) => {
    btn.onclick = async () => {
      // ← Added async here
      const i = Number(btn.dataset.i);
      const publicID = btn.dataset.pid;
      console.log(`DEV btn.dataset: ${btn.dataset}`)
      console.log("DEV Deleting photo with publicID:", publicID);

      // Delete from backend if we have a publicID
      if (publicID) {
        try {
          btn.disabled = true;
          btn.textContent = "…";
          await apiDeletePhoto(publicID);
        } catch (e) {
          alert("Löschen fehlgeschlagen: " + e.message);
          btn.disabled = false;
          btn.textContent = "×";
          return;
        }
      }

      const next = loadGallery().filter((_, idx) => idx !== i);
      saveGallery(next);
      renderGallery();
    };
  });
}

/**
 * @title Render Pending Selection
 * @description Rendert die Pending-Auswahl mit Vorschaubildern und bindet die Entfernen-Buttons ein. Beim Klick auf Entfernen wird das Bild aus der Pending-Auswahl entfernt.
 */
function renderPending() {
  const wrap = $("#pending");
  const btnAdd = $("#addSelected");
  const btnClearPending = $("#clearPending");
  if (!wrap || !btnAdd || !btnClearPending) return;

  if (!pendingPreviews.length) {
    wrap.innerHTML = `<div class="hint">Noch keine Auswahl. Wähle Dateien aus.</div>`;
    btnAdd.disabled = true;
    btnClearPending.disabled = true;
    return;
  }

  btnAdd.disabled = false;
  btnClearPending.disabled = false;

  wrap.innerHTML = pendingPreviews
    .map(
      (src, i) => `
        <div class="thumb pendingThumb">
          <img src="${src}" alt="pending ${i}" />
          <button class="xmini" data-p="${i}" title="Auswahl entfernen">×</button>
        </div>
      `,
    )
    .join("");

  wrap.querySelectorAll(".xmini").forEach((btn) => {
    btn.onclick = () => {
      const i = Number(btn.dataset.p);
      pendingFiles = pendingFiles.filter((_, idx) => idx !== i);
      pendingPreviews = pendingPreviews.filter((_, idx) => idx !== i);
      renderPending();
    };
  });
}

/**
 * @title Clear Pending Selection
 * @description Löscht die aktuelle Pending-Auswahl, leert die pendingFiles und pendingPreviews Arrays und aktualisiert die UI entsprechend.
 */
function clearPending() {
  pendingFiles = [];
  pendingPreviews = [];
  const input = $("#imgInput");
  if (input) input.value = "";
}

/**
 * @title API Update Profile
 * @description Sendet aktualisierte Profildaten an die Backend-API (PUT /api/auth/profile).
 * @param {Object} payload - Zu aktualisierende Profilfelder (z.B. displayName, socialLinks, portfolioSettings)
 * @throws Error bei fehlgeschlagenem Update oder Server-Fehler
 * @returns {Object} API-Antwort mit aktualisiertem user-Objekt
 */
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
  if (!res.ok)
    throw new Error(
      data?.error || data?.details || "Profil konnte nicht gespeichert werden.",
    );
  return data;
}

/**
 * @title Set Profile Status
 * @description Setzt den Status-Text und -Typ im Profil-Popup (z.B. Erfolg, Fehler, Info).
 * @param {String} text - Anzuzeigender Status-Text
 * @param {String} [type="info"] - Status-Typ: "info", "success" oder "error"
 */
function setProfileStatus(text, type = "info") {
  const el = $("#profileStatus");
  if (!el) return;
  el.textContent = text || "";
  el.dataset.type = type;
}

/**
 * @title Fill Profile Form
 * @description Befüllt das Profil-Formular mit den Daten des übergebenen User-Objekts.
 * @param {Object} user - User-Objekt mit Profildaten (username, email, displayName, socialLinks, portfolioSettings)
 */
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

/**
 * @title Read Profile Form
 * @description Liest die aktuellen Werte aus dem Profil-Formular und gibt sie als strukturiertes Objekt zurück.
 * @returns {Object} Profilfelder-Objekt mit displayName, socialLinks und portfolioSettings
 */
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

/**
 * @title Read Preferences for Preview
 * @description Liest die aktuellen Theme-, Spalten- und Abstandswerte aus dem Formular für die Live-Vorschau.
 * @returns {Object} Objekt mit theme (String), cols (Number) und gap (Number)
 */
function readPrefsFromFormForPreview() {
  const theme = $("#p_theme")?.value || "light";
  const cols = Number($("#p_cols")?.value);
  const gap = Number($("#p_gap")?.value);
  return { theme, cols, gap };
}

/**
 * @title Render UI
 * @description Haupt-Render-Funktion: Baut das komplette UI (Header, Galerie, Upload-Bereich, Login/Profil-Popups) und bindet alle Event-Handler.
 * @param {Object|null} user - Eingeloggter User oder null für nicht-eingeloggten Zustand
 */
function render(user) {
  // Theme/Layout sofort anwenden
  applyUserPrefs(user);

  const who = user?.displayName || user?.username || user?.email || "";

  $("#app").innerHTML = `
    <div class="header">
      <div class="title">PINTERESSANT</div>

      <div class="right">
        ${
          user
            ? `
              <button class="iconbtn" id="profileBtn" title="Profil">
                <img class="iconimg" src="${PROFILE_ICON_PATH}" alt="Profil" />
              </button>
              <div class="loggedin">Eingeloggt als <b>${esc(who)}</b></div>
              <button class="linkbtn" id="logoutBtn">Logout</button>
            `
            : `<button class="linkbtn" id="loginBtn">Login</button>`
        }
        <img class="logo" src="${LOGO_PATH}" alt="Logo" />
      </div>
    </div>

    ${
      user
        ? `
      <div class="uploader">
        <div class="uploaderTop">
          <div class="uploaderTitle">
            <h2>Bilder</h2>
          </div>

          <div class="uploaderActions">
            <button class="linkbtn" id="toggleUploader">Bild hochladen</button>
          </div>
        </div>

        <div id="uploaderPanel" class="uploaderPanel hidden">
          <div class="row">
            <input id="imgInput" type="file" accept="image/*" />
            <button class="linkbtn" id="addSelected" disabled>Hinzufügen</button>
            <button class="linkbtn" id="clearPending" disabled>Auswahl leeren</button>
          </div>

          <div class="subhead">Auswahl</div>
          <div id="pending" class="gallery gallery--pending"></div>
        </div>

        <div class="uploaderGalleryHead">
          <div class="subhead">Galerie</div>
          <button class="linkbtn" id="clearGallery">Galerie leeren</button>
        </div>

        <div id="gallery" class="gallery gallery--main"></div>
      </div>
      `
        : `
      <div class="uploader">
        <p>Bitte einloggen, um Bilder anzuzeigen oder hochzuladen.</p>
      </div>
      `
    }

    <!-- Login Popup -->
    <div class="pop" id="pop" aria-hidden="true">
      <div class="popcard">
        <div class="pophead">
          <div class="poptitle" id="popTitle">Login</div>
          <button class="xbtn" id="closePop">×</button>
        </div>

        <div class="tabs">
          <button class="tab active" id="tabLogin">Login</button>
          <button class="tab" id="tabRegister">Registrieren</button>
        </div>

        <div class="form" id="loginForm">
          <input id="l_email" placeholder="email" />
          <input id="l_pass" placeholder="password" type="password" />
          <button id="doLogin">Login</button>
        </div>

        <div class="form hidden" id="registerForm">
          <input id="r_email" placeholder="email" />
          <input id="r_display" placeholder="display name" />
          <input id="r_user" placeholder="username" />
          <input id="r_pass" placeholder="password" type="password" />
          <button id="doRegister">Registrieren</button>
        </div>

        <div class="msg" id="msg"></div>
      </div>
    </div>

    <!-- Profile Popup -->
    <div class="profilePop" id="profilePop" aria-hidden="true">
      <div class="profilePopCard">
        <div class="profilePopHead">
          <div class="poptitle">Profil</div>
          <button class="xbtn" id="closeProfile">×</button>
        </div>

        <div id="profileStatus" class="profileStatus"></div>

        <div class="profileGrid">
          <div class="field">
            <label>Username</label>
            <input id="p_username" disabled />
          </div>

          <div class="field">
            <label>Email</label>
            <input id="p_email" disabled />
          </div>

          <div class="field">
            <label>Display Name</label>
            <input id="p_displayName" placeholder="z.B. Philipp Ehrich" />
          </div>

          <div class="field">
            <label>Instagram</label>
            <input id="p_instagram" placeholder="https://instagram.com/…" />
          </div>

          <div class="field">
            <label>Twitter / X</label>
            <input id="p_twitter" placeholder="https://x.com/…" />
          </div>

          <div class="field">
            <label>Website</label>
            <input id="p_website" placeholder="https://…" />
          </div>

          <div class="field">
            <label>Kontakt-Email (öffentlich)</label>
            <input id="p_publicEmail" placeholder="contact@…" />
          </div>

          <div class="field">
            <label>Theme</label>
            <select id="p_theme">
              <option value="light">light</option>
              <option value="dark">dark</option>
            </select>
          </div>

          <div class="field">
            <label>Default Columns</label>
            <input id="p_cols" type="number" min="1" max="6" />
          </div>

          <div class="field">
            <label>Default Gap</label>
            <input id="p_gap" type="number" min="0" max="80" />
          </div>
        </div>

        <div class="profileActions">
          <button class="linkbtn" id="saveProfile">Profil speichern</button>
        </div>
      </div>
    </div>
  `;

  // ===== Login Popup wiring =====
  const pop = $("#pop");
  const msg = $("#msg");

  const openPop = () => {
    pop.classList.add("open");
    pop.setAttribute("aria-hidden", "false");
    msg.textContent = "";
  };
  const closePop = () => {
    pop.classList.remove("open");
    pop.setAttribute("aria-hidden", "true");
    msg.textContent = "";
  };

  const loginBtn = $("#loginBtn");
  if (loginBtn) loginBtn.onclick = openPop;

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

  $("#closePop").onclick = closePop;

  const tabLogin = $("#tabLogin");
  const tabRegister = $("#tabRegister");
  const loginForm = $("#loginForm");
  const registerForm = $("#registerForm");
  const popTitle = $("#popTitle");

  tabLogin.onclick = () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    popTitle.textContent = "Login";
    msg.textContent = "";
  };

  tabRegister.onclick = () => {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    popTitle.textContent = "Registrieren";
    msg.textContent = "";
  };

  $("#doLogin").onclick = async () => {
    msg.textContent = "Login…";
    try {
      await login({
        email: $("#l_email").value.trim(),
        password: $("#l_pass").value.trim(),
      });
      closePop();
      await bootstrap();
    } catch (e) {
      console.error("Login Fehler:", e);
      msg.textContent = "Fehler ❌ " + (e?.message || String(e));
    }
  };

  $("#doRegister").onclick = async () => {
    msg.textContent = "Registrieren…";
    try {
      await register({
        email: $("#r_email").value.trim(),
        displayName: $("#r_display").value.trim(),
        username: $("#r_user").value.trim(),
        password: $("#r_pass").value.trim(),
      });
      closePop();
      await bootstrap();
    } catch (e) {
      console.error("Register Fehler:", e);
      msg.textContent = "Fehler ❌ " + (e?.message || String(e));
    }
  };

  // ===== Uploader + Profile wiring (nur wenn user) =====
  if (user) {
    // nach dem Render: Layout nochmal auf die neuen gallery Elemente anwenden
    applyUserPrefs(user);

    // --- Profile popup open/close
    const profilePop = $("#profilePop");
    const profileBtn = $("#profileBtn");
    const closeProfileBtn = $("#closeProfile");

    const openProfile = () => {
      profilePop.classList.add("open");
      profilePop.setAttribute("aria-hidden", "false");
      setProfileStatus("");
      fillProfileForm(user);

      // live preview (theme/cols/gap) ohne speichern
      const { theme, cols, gap } = readPrefsFromFormForPreview();
      applyTheme(theme);
      applyGalleryLayout({ cols, gap });
    };

    const closeProfile = () => {
      profilePop.classList.remove("open");
      profilePop.setAttribute("aria-hidden", "true");
      setProfileStatus("");

      // wenn schließen ohne speichern: wieder auf User-Prefs zurück
      applyUserPrefs(user);
    };

    if (profileBtn) profileBtn.onclick = openProfile;
    if (closeProfileBtn) closeProfileBtn.onclick = closeProfile;

    profilePop.onclick = (e) => {
      if (e.target === profilePop) closeProfile();
    };

    // live preview: on change
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

    // Save profile
    const saveBtn = $("#saveProfile");
    if (saveBtn) {
      saveBtn.onclick = async () => {
        try {
          saveBtn.disabled = true;
          setProfileStatus("Speichere…", "info");

          const payload = readProfileForm();
          await apiUpdateProfile(payload);

          setProfileStatus("✅ Profil gespeichert", "success");

          // neu laden -> Theme/Layout kommt jetzt aus der API (persist)
          await bootstrap();
        } catch (e) {
          setProfileStatus("❌ " + (e?.message || String(e)), "error");
        } finally {
          saveBtn.disabled = false;
        }
      };
    }

    // --- Uploader
    const input = $("#imgInput");
    const btnAdd = $("#addSelected");
    const btnClearPending = $("#clearPending");
    const btnClearGallery = $("#clearGallery");
    const toggleBtn = $("#toggleUploader");
    const panel = $("#uploaderPanel");

    toggleBtn.onclick = () => {
      panel.classList.toggle("hidden");
      toggleBtn.textContent = panel.classList.contains("hidden")
        ? "Bild hochladen"
        : "Schließen";
    };

    renderGallery();
    renderPending();

    input.onchange = async (e) => {
      const files = Array.from(e.target.files || []).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (!files.length) {
        pendingFiles = [];
        pendingPreviews = [];
        renderPending();
        return;
      }

      // 1 Foto
      pendingFiles = [files[0]];
      pendingPreviews = await filesToDataUrls(pendingFiles);
      renderPending();

      btnAdd.disabled = pendingPreviews.length === 0;
      btnClearPending.disabled = pendingPreviews.length === 0;

      // Layout-Prefs auch auf pending anwenden
      applyUserPrefs(user);
    };

    btnAdd.onclick = async () => {
      const file = pendingFiles?.[0];
      if (!file) return;

      console.log("Bild hinzugefügt:", file);

      try {
        btnAdd.disabled = true;
        btnClearPending.disabled = true;
        btnAdd.textContent = "Upload…";

        const dataUrl = await fileToDataUrl(file);

        // ✅ FIX: sende title + imageURL als JSON (Backend req.body ist dann nicht undefined)
        const uploaded = await apiUploadImageDataUrl({
          dataUrl,
          title: file.name,
        });

        // je nachdem wie backend antwortet: photo.imageURL oder imageURL
        const url =
          uploaded?.imageURL ||
          uploaded?.photo?.imageURL ||
          uploaded?.photo?.image?.url ||
          uploaded?.url ||
          uploaded?.thumbnailURL;

        // PublicID speichern für Lösch-Feature
        const publicID =
          uploaded?.publicID ||
          uploaded?.photo?.publicID ||
          uploaded?.photo?.image?.publicID;

        if (!url) {
          console.error("btnAdd.onclick: Upload response:", uploaded);
          throw new Error("Backend hat keine Bild-URL zurückgegeben.");
        }
        const current = loadGallery();
        saveGallery([
          { imageURL: url, publicID: publicID || null },
          ...current,
        ]);
        renderGallery();

        clearPending();
        renderPending();
      } catch (e) {
        alert("Upload Fehler: " + (e?.message || String(e)));
      } finally {
        btnAdd.textContent = "Hinzufügen";
        btnAdd.disabled = true;
        btnClearPending.disabled = true;
      }
    };

    btnClearPending.onclick = () => {
      clearPending();
      renderPending();
      btnAdd.disabled = true;
      btnClearPending.disabled = true;
    };

    btnClearGallery.onclick = () => {
      saveGallery([]);
      renderGallery();
    };
  }
}

/**
 * @title Bootstrap
 * @description Initialisiert die Anwendung: Versucht den Benutzer über vorhandenen Token oder Refresh Token zu authentifizieren und rendert anschließend das UI.
 */
async function bootstrap() {
  let user = null;

  try {
    const token = getToken();
    if (token) user = await me();
  } catch {}

  if (!user) {
    try {
      await refresh();
      user = await me();
    } catch {}
  }

  render(user);
}

bootstrap();
