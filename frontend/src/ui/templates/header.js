import { LOGO_PATH, PROFILE_ICON_PATH } from "../../constants.js";
import { esc } from "../../lib/dom.js";

// Baut den Header oben zusammen.
// (Links Titel, rechts Login/Profile + Logo)
export function headerHtml(user, who) {
  return `
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
  `;
}