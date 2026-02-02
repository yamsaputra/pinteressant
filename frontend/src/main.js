import "./style.css";
import { login, register, refresh, me, logout, getToken } from "./auth.js";

const LOGO_PATH = "/Pinteressant_Probe_Logo.png";
const PROFILE_ICON_PATH = "/profile_icon.png"; // -> /frontend/public/profile_icon.png

const $ = (sel) => document.querySelector(sel);

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

function loadGallery() {
  try {
    return JSON.parse(localStorage.getItem(GALLERY_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveGallery(arr) {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(arr));
}

/** ===== Theme/Layout Apply ===== */
function applyTheme(theme) {
  const t = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = t;
}

function applyGalleryLayout({ cols, gap }) {
  const root = document.documentElement;

  const nCols = Number(cols);
  const nGap = Number(gap);

  const useCols = Number.isFinite(nCols) && nCols >= 1 && nCols <= 6 ? nCols : null;
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

/** ===== Helpers: previews ===== */
async function filesToDataUrls(fileList) {
  const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
  const readers = files.map(
    (file) =>
      new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      })
  );
  return Promise.all(readers);
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** ===== API upload ===== */
async function apiUploadImageDataUrl(dataUrl) {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken(),
    },
    body: JSON.stringify({ imageURL: dataUrl }),
  });

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Upload hat kein JSON geliefert (Status ${res.status}). Antwort beginnt mit: ${text.slice(0, 60)}`
    );
  }

  if (!res.ok) throw new Error(data?.error || data?.details || "Upload failed");
  return data;
}

/** ========= Pending selection ========= */
let pendingFiles = [];
let pendingPreviews = [];

function renderGallery() {
  const galleryEl = $("#gallery");
  if (!galleryEl) return;

  const imgs = loadGallery();
  if (!imgs.length) {
    galleryEl.innerHTML = `<div class="hint">Noch keine Bilder in deiner Galerie.</div>`;
    return;
  }

  galleryEl.innerHTML = imgs
    .map(
      (src, i) => `
        <div class="thumb">
          <img src="${src}" alt="upload ${i}" />
          <button class="xmini" data-i="${i}" title="Bild löschen">×</button>
        </div>
      `
    )
    .join("");

  galleryEl.querySelectorAll(".xmini").forEach((btn) => {
    btn.onclick = () => {
      const i = Number(btn.dataset.i);
      const next = loadGallery().filter((_, idx) => idx !== i);
      saveGallery(next);
      renderGallery();
    };
  });
}

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
      `
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

function clearPending() {
  pendingFiles = [];
  pendingPreviews = [];
  const input = $("#imgInput");
  if (input) input.value = "";
}

/* ===== Profile API + helpers ===== */
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

function setProfileStatus(text, type = "info") {
  const el = $("#profileStatus");
  if (!el) return;
  el.textContent = text || "";
  el.dataset.type = type;
}

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

function readPrefsFromFormForPreview() {
  const theme = $("#p_theme")?.value || "light";
  const cols = Number($("#p_cols")?.value);
  const gap = Number($("#p_gap")?.value);
  return { theme, cols, gap };
}

/** ========= UI ========= */
function render(user) {
  // direkt nach Render: Theme/Layout anwenden (nur logged-in anhand API)
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
      toggleBtn.textContent = panel.classList.contains("hidden") ? "Bild hochladen" : "Schließen";
    };

    renderGallery();
    renderPending();

    input.onchange = async (e) => {
      const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
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

      try {
        btnAdd.disabled = true;
        btnClearPending.disabled = true;
        btnAdd.textContent = "Upload…";

        const dataUrl = await fileToDataUrl(file);
        const uploaded = await apiUploadImageDataUrl(dataUrl);

        const current = loadGallery();
        saveGallery([uploaded.imageURL, ...current]);
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

/** ========= bootstrap ========= */
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
