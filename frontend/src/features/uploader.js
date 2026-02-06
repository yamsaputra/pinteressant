import { $ } from "../lib/dom.js";
import { loadGallery, saveGallery } from "../lib/galleryStore.js";
import { filesToDataUrls, fileToDataUrl } from "../lib/files.js";
import { apiDeletePhoto, apiUploadImageDataUrl } from "../api/photos.js";
import { applyUserPrefs } from "./prefs.js";

// Upload + Galerie.
//
// Was hier drin steckt:
// - Pending-Auswahl (ein Bild auswählen -> Preview)
// - Upload (Base64 -> POST /api/upload)
// - Galerie-Rendering aus localStorage
// - Löschen (lokal + optional Backend wenn publicID vorhanden)
//
// Das HTML selbst kommt aus ui/templates/uploader.js.

// Pending selection (ein Foto, bis es hochgeladen wird)
let pendingFiles = [];
let pendingPreviews = [];

// Setzt die aktuelle Auswahl zurück und leert auch das file-input.
function clearPending() {
  pendingFiles = [];
  pendingPreviews = [];
  const input = $("#imgInput");
  if (input) input.value = "";
}

// Rendert die Galerie aus localStorage.
// In der Liste können sowohl Strings (alte Version) als auch Objekte liegen.
function renderGallery() {
  const galleryEl = $("#gallery");
  if (!galleryEl) return;

  const imgs = loadGallery();
  if (!imgs.length) {
    galleryEl.innerHTML = `<div class="hint">Noch keine Bilder in deiner Galerie.</div>`;
    return;
  }

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

  // Delete-Buttons verdrahten
  galleryEl.querySelectorAll(".xmini").forEach((btn) => {
    btn.onclick = async () => {
      const i = Number(btn.dataset.i);
      const publicID = btn.dataset.pid;

      // Wenn publicID vorhanden: auch Backend / Cloudinary löschen
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

// Rendert die Pending-Auswahl (Preview vom aktuell ausgewählten Bild)
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

// Wird nach dem Render aufgerufen (nur wenn user eingeloggt).
// Hier hängen wir alle Events an die Buttons/Inputs.
export function initUploader({ user }) {
  const input = $("#imgInput");
  const btnAdd = $("#addSelected");
  const btnClearPending = $("#clearPending");
  const btnClearGallery = $("#clearGallery");
  const toggleBtn = $("#toggleUploader");
  const panel = $("#uploaderPanel");

  if (
    !input ||
    !btnAdd ||
    !btnClearPending ||
    !btnClearGallery ||
    !toggleBtn ||
    !panel
  ) {
    return;
  }

  // Panel auf/zu (damit die Seite nicht direkt so voll aussieht)
  toggleBtn.onclick = () => {
    panel.classList.toggle("hidden");
    toggleBtn.textContent = panel.classList.contains("hidden")
      ? "Bild hochladen"
      : "Schließen";
  };

  renderGallery();
  renderPending();

  // Sobald der User eine Datei auswählt, erzeugen wir ein Preview.
  // Wir lassen aktuell nur 1 Bild zu, damit es simpel bleibt.
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

    pendingFiles = [files[0]];
    pendingPreviews = await filesToDataUrls(pendingFiles);
    renderPending();

    btnAdd.disabled = pendingPreviews.length === 0;
    btnClearPending.disabled = pendingPreviews.length === 0;

    // Layout-Prefs auch auf pending anwenden
    applyUserPrefs(user);
  };

  // Upload starten: Base64 erzeugen -> an Backend senden -> Ergebnis in localStorage packen
  btnAdd.onclick = async () => {
    const file = pendingFiles?.[0];
    if (!file) return;

    try {
      btnAdd.disabled = true;
      btnClearPending.disabled = true;
      btnAdd.textContent = "Upload…";

      const dataUrl = await fileToDataUrl(file);

      const uploaded = await apiUploadImageDataUrl({
        dataUrl,
        title: file.name,
      });

      // Backend kann leicht unterschiedlich antworten,
      // deshalb lesen wir mehrere mögliche Felder aus.
      const url =
        uploaded?.imageURL ||
        uploaded?.photo?.imageURL ||
        uploaded?.photo?.image?.url ||
        uploaded?.url ||
        uploaded?.thumbnailURL;

      const publicID =
        uploaded?.publicID ||
        uploaded?.photo?.publicID ||
        uploaded?.photo?.image?.publicID;

      if (!url) {
        console.error("Upload response:", uploaded);
        throw new Error("Backend hat keine Bild-URL zurückgegeben.");
      }

      const current = loadGallery();
      saveGallery([{ imageURL: url, publicID: publicID || null }, ...current]);
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

  // Auswahl zurücksetzen
  btnClearPending.onclick = () => {
    // Auswahl zurücksetzen (Preview + FileInput leeren)
    clearPending();
    renderPending();
    btnAdd.disabled = true;
    btnClearPending.disabled = true;
  };

  // Alles aus der localStorage-Galerie löschen (Backend löschen wir hier bewusst nicht)
  btnClearGallery.onclick = () => {
    // Nur lokal leeren (Backend bleibt wie es ist).
    // Wenn man später "alles löschen" serverseitig möchte,
    // bräuchte man dafür eine eigene Route.
    saveGallery([]);
    renderGallery();
  };
}