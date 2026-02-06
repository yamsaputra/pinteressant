// HTML für den Uploader-Bereich.
// Wenn kein User eingeloggt ist, zeigen wir nur einen kleinen Hinweis.

export function uploaderHtml(user) {
  if (!user) {
    return `
      <div class="uploader">
        <p>Bitte einloggen, um Bilder anzuzeigen oder hochzuladen.</p>
      </div>
    `;
  }

  return `
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
  `;
}