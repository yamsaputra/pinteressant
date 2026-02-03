import "./style.css";
import { login, register, refresh, me, logout, getToken } from "./auth.js";
import { wireUploader } from "./features/uploader.js";
import { wireProfilePopup } from "./features/profile.js";
import { applyUserPrefs } from "./features/prefs.js";

const LOGO_PATH = "/Pinteressant_Probe_Logo.png";
const PROFILE_ICON_PATH = "/profile_icon.png";

// -------------------------------
// // Mini helper: querySelector
// -------------------------------
export const $ = (sel) => document.querySelector(sel);

// -------------------------------
// // Mini helper: HTML escapen
// -------------------------------
function esc(str) {
  return (str ?? "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// -------------------------------
// // UI rendern
// -------------------------------
function renderApp(user) {
  // -> Theme/Layout direkt anwenden
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
        <p>Bitte einloggen, um Bilder hochzuladen.</p>
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

  wireAuthUi();

  // -> nur eingeloggt: uploader + profile
  if (user) {
    wireUploader(user);
    wireProfilePopup(user, { onSaved: bootstrap });
  }
}

// -------------------------------
// // Login/Register/Logout wiring
// -------------------------------
function wireAuthUi() {
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
}

// -------------------------------
// // Bootstrap: token -> me() -> refresh() -> me()
// -------------------------------
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

  renderApp(user);
}

bootstrap();
