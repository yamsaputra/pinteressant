import { $ } from "../lib/dom.js";
import { login, register } from "../auth.js";

// Login/Register Popup.
//
// Verantwortlich für:
// - Popup öffnen/schließen
// - Tabs (Login vs Registrieren)
// - Submit der beiden Formulare
//
// Wichtig: das HTML kommt aus ui/templates/loginPopup.js.
export function initAuthPopup({ bootstrap }) {
  const pop = $("#pop");
  const msg = $("#msg");
  if (!pop || !msg) return;

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

  const closeBtn = $("#closePop");
  if (closeBtn) closeBtn.onclick = closePop;

  // Tabs umschalten
  const tabLogin = $("#tabLogin");
  const tabRegister = $("#tabRegister");
  const loginForm = $("#loginForm");
  const registerForm = $("#registerForm");
  const popTitle = $("#popTitle");

  if (tabLogin && tabRegister && loginForm && registerForm && popTitle) {
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
  }

  // Login
  const doLogin = $("#doLogin");
  if (doLogin) {
    doLogin.onclick = async () => {
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
  }

  // Register
  const doRegister = $("#doRegister");
  if (doRegister) {
    doRegister.onclick = async () => {
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
}