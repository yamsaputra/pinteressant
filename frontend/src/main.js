import "./style.css";
import { login, register, refresh, me, logout, getToken } from "./auth.js";

const LOGO_PATH = "/Pinteressant_Probe_Logo.png"; // ggf. anpassen

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

function render(user) {
  const who = user?.displayName || user?.username || user?.email || "";

  $("#app").innerHTML = `
    <div class="header">
      <div class="title">PINTERESSANT</div>

      <div class="right">
        ${
          user
            ? `<div class="loggedin">Eingeloggt als <b>${esc(who)}</b></div>
               <button class="linkbtn" id="logoutBtn">Logout</button>`
            : `<button class="linkbtn" id="loginBtn">Login</button>`
        }
        <img class="logo" src="${LOGO_PATH}" alt="Logo" />
      </div>
    </div>

    <div class="content">
      <pre id="out">…</pre>
    </div>

    <div class="notification" id="notification" style="display:none;">
      <div class="notif-card" id="notifContent"></div>
    </div>

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

        <!-- Login: email + password -->
        <div class="form" id="loginForm">
          <input id="l_email" placeholder="email" />
          <input id="l_pass" placeholder="password" type="password" />
          <button id="doLogin">Login</button>
        </div>

        <!-- Register: email + displayName + username + password -->
        <div class="form hidden" id="registerForm">
          <input id="r_email" placeholder="email" />
          <input id="r_display" placeholder="display name (z.B. Philipp Ehrich)" />
          <input id="r_user" placeholder="username (ohne Leerzeichen)" />
          <input id="r_pass" placeholder="password" type="password" />
          <button id="doRegister">Registrieren</button>
        </div>

        <div class="msg" id="msg"></div>
      </div>
    </div>
  `;

  const pop = $("#pop");
  const msg = $("#msg");
  const out = $("#out");

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

  // Header Buttons
  const loginBtn = $("#loginBtn");
  if (loginBtn) loginBtn.onclick = openPop;

  const logoutBtn = $("#logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      out.textContent = "Logout…";
      try {
        await logout();
        out.textContent = "Logout OK ✅";
        await bootstrap(); // UI neu rendern -> zeigt wieder Login
      } catch (e) {
        out.textContent = "Fehler ❌ " + (e?.message || String(e));
      }
    };
  }

  // Popup Controls
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

  const showNotification = (message) => {
    const notif = $("#notification");
    const notifContent = $("#notifContent");
    notifContent.textContent = message;
    notif.style.display = "flex";
    setTimeout(() => {
      notif.style.display = "none";
    }, 15000);
  };

  // Actions
  $("#doLogin").onclick = async () => {
    msg.textContent = "Login…";
    try {
      const data = await login({
        email: $("#l_email").value.trim(),
        password: $("#l_pass").value.trim(),
      });
      msg.textContent = "Login OK ✅";
      closePop();
      
      console.log("Login erfolgreich, Token:", data?.accessToken?.substring(0, 20) + "...");
      await new Promise(r => setTimeout(r, 500));
      await bootstrap();
      
      // Notification NACH bootstrap
      const notif = $("#notification");
      if (notif) {
        $("#notifContent").textContent = "✅ Erfolgreich eingeloggt als: " + (data?.displayName || data?.username || data?.email);
        notif.style.display = "flex";
        setTimeout(() => { notif.style.display = "none"; }, 15000);
      }
    } catch (e) {
      console.error("Login Fehler:", e);
      msg.textContent = "Fehler ❌ " + (e?.message || String(e));
    }
  };

  $("#doRegister").onclick = async () => {
    msg.textContent = "Registrieren…";
    try {
      const data = await register({
        email: $("#r_email").value.trim(),
        displayName: $("#r_display").value.trim(),
        username: $("#r_user").value.trim(),
        password: $("#r_pass").value.trim(),
      });
      closePop();
      
      console.log("Register erfolgreich, bootstrap wird aufgerufen...");
      await new Promise(r => setTimeout(r, 300));
      await bootstrap();
      
      // Notification NACH bootstrap
      const notif = $("#notification");
      if (notif) {
        $("#notifContent").textContent = "✅ Erfolgreich registriert als: " + (data?.displayName || data?.username || data?.email);
        notif.style.display = "flex";
        setTimeout(() => { notif.style.display = "none"; }, 15000);
      }
    } catch (e) {
      console.error("Register Fehler:", e);
      msg.textContent = "Fehler ❌ " + (e?.message || String(e));
    }
  };
}

// Beim Start: wenn Token da -> me(); sonst refresh() -> me()
async function bootstrap() {
  let user = null;

  try {
    const token = getToken();
    console.log("Token vorhanden:", !!token);
    if (token) {
      user = await me();
      console.log("User von me():", user);
    }
  } catch (e) {
    console.error("me() Fehler:", e.message);
  }

  if (!user) {
    try {
      console.log("Versuche refresh()...");
      await refresh();
      user = await me();
      console.log("User nach refresh:", user);
    } catch (e) {
      console.error("refresh() Fehler:", e.message);
    }
  }

  console.log("Final user object:", user);
  render(user);
}

bootstrap();
