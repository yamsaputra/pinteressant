// HTML für das Login/Register Popup.
// Die ganze Logik (Tabs, Submit etc.) hängt danach in features/authPopup.js.

export function loginPopupHtml() {
  return `
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
  `;
}