// HTML für das Profil-Popup.
// Speichern + Live-Preview wird danach in features/profile.js verdrahtet.

export function profilePopupHtml() {
  return `
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
}