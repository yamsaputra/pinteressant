// uploader.js
// -> Bild auswählen, Vorschau anzeigen, Upload per API
// -> KEIN localStorage: Galerie existiert nur im RAM (bis Reload)
// -> Für "echte Galerie" braucht ihr später eine GET-Liste vom Backend

import { getToken } from "../auth.js";
import { $ } from "../main.js";
import { applyUserPrefs } from "./prefs.js";

// -------------------------------
// // In-Memory Galerie (nur Session)
// -------------------------------
let sessionGallery = []; // Array<string> (Cloudinary URLs)

// -------------------------------
// // Pending Auswahl (1 Bild) + Preview
// -------------------------------
let pendingFile = null;
let pendingPreview = "";

// -------------------------------
// // FileReader helper
// -------------------------------
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// -------------------------------
// // Upload API Call: POST /api/upload { imageURL: dataURL }
// -------------------------------
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

  // -> wenn HTML kommt (404/proxy), lieber sauberer Fehler
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Upload hat kein JSON geliefert (Status ${res.status}). Antwort beginnt mit: ${text.slice(0, 60)}`
    );
  }

  if (!res.ok) throw new Error(data?.error || data?.details || "Upload failed");
  return data; // erwartet: { imageURL: "https://..." }
}

// -------------------------------
// // Galerie rendern (nur Session)
// -------------------------------
export function renderGallery() {
  const galleryEl = $("#gallery");
  if (!galleryEl) return;

  if (!sessionGallery.length) {
    galleryEl.innerHTML = `<div class="hint">Noch keine Bilder.</div>`;
    return;
  }

  galleryEl.innerHTML = sessionGallery
    .map(
      (src, i) => `
        <div class="thumb">
          <img src="${src}" alt="upload ${i}" />
          <button class="xmini" data-i="${i}" title="Bild entfernen">×</button>
        </div>
      `
    )
    .join("");

  // -> Bild aus Session entfernen
  galleryEl.querySelectorAll(".xmini").forEach((btn) => {
    btn.onclick = () => {
      const i = Number(btn.dataset.i);
      sessionGallery = sessionGallery.filter((_, idx) => idx !== i);
      renderGallery();
    };
  });
}

// -------------------------------
// // Pending rendern (Vorschau)
// -------------------------------
function renderPending() {
  const wrap = $("#pending");
  const btnAdd = $("#addSelected");
  const btnClear = $("#clearPending");

  if (!wrap || !btnAdd || !btnClear) return;

  if (!pendingPreview) {
    wrap.innerHTML = `<div class="hint">Noch keine Auswahl. Wähle eine Datei aus.</div>`;
    btnAdd.disabled = true;
    btnClear.disabled = true;
    return;
  }

  wrap.innerHTML = `
    <div class="thumb pendingThumb">
      <img src="${pendingPreview}" alt="pending" />
      <button class="xmini" id="removePending" title="Auswahl entfernen">×</button>
    </div>
  `;

  btnAdd.disabled = false;
  btnClear.disabled = false;

  $("#removePending").onclick = () => {
    clearPending();
    renderPending();
  };
}

// -------------------------------
// // Pending reset
// -------------------------------
function clearPending() {
  pendingFile = null;
  pendingPreview = "";
  const input = $("#imgInput");
  if (input) input.value = "";
}

// -------------------------------
// // OPTIONAL: spätere Backend-Liste
// -------------------------------
// async function loadGalleryFromApi() {
//   // -> Wenn ihr später sowas habt wie GET /api/upload/my
//   // -> dann hier fetchen und sessionGallery setzen
// }

// -------------------------------
// // Wiring: Events
// -------------------------------
export function wireUploader(user) {
  if (!user) return;

  const input = $("#imgInput");
  const btnAdd = $("#addSelected");
  const btnClearPending = $("#clearPending");
  const btnClearGallery = $("#clearGallery");
  const toggleBtn = $("#toggleUploader");
  const panel = $("#uploaderPanel");

  // -> Panel auf/zu
  toggleBtn.onclick = () => {
    panel.classList.toggle("hidden");
    toggleBtn.textContent = panel.classList.contains("hidden") ? "Bild hochladen" : "Schließen";
  };

  // -> initial
  renderGallery();
  renderPending();
  applyUserPrefs(user);

  // -> Datei auswählen
  input.onchange = async (e) => {
    const file = Array.from(e.target.files || []).find((f) => f.type.startsWith("image/"));
    if (!file) {
      clearPending();
      renderPending();
      return;
    }

    pendingFile = file;
    pendingPreview = await fileToDataUrl(file);
    renderPending();
    applyUserPrefs(user);
  };

  // -> Upload bestätigen
  btnAdd.onclick = async () => {
    if (!pendingFile) return;

    try {
      btnAdd.disabled = true;
      btnClearPending.disabled = true;
      btnAdd.textContent = "Upload…";

      const dataUrl = await fileToDataUrl(pendingFile);
      const uploaded = await apiUploadImageDataUrl(dataUrl);

      // -> Cloudinary URL nur in Session merken
      sessionGallery = [uploaded.imageURL, ...sessionGallery];
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

  // -> Auswahl leeren
  btnClearPending.onclick = () => {
    clearPending();
    renderPending();
    btnAdd.disabled = true;
    btnClearPending.disabled = true;
  };

  // -> Galerie leeren (nur Session)
  btnClearGallery.onclick = () => {
    sessionGallery = [];
    renderGallery();
  };
}
