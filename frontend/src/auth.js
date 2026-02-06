const TOKEN_KEY = "accessToken";
const USER_ID_KEY = "userId";

/**
 * @title Get Token
 * @description Ruft den gespeicherten Access Token aus dem localStorage ab.
 * @returns {String} Access Token oder leerer String falls keiner vorhanden
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

/**
 * @title Set Token
 * @description Speichert den Access Token im localStorage oder entfernt ihn, falls kein Token übergeben wird.
 * @param {String} token - JWT Access Token
 */
export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * @title Clear Token
 * @description Entfernt den Access Token aus dem localStorage.
 */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * @title Get User ID
 * @description Ruft die gespeicherte User-ID aus dem localStorage ab.
 * @returns {String} User-ID oder leerer String falls keine vorhanden
 */
export function getUserId() {
  return localStorage.getItem(USER_ID_KEY) || "";
}

/**
 * @title Set User ID
 * @description Speichert die User-ID im localStorage.
 * @param {String} id - MongoDB User-ID
 */
export function setUserId(id) {
  if (id) localStorage.setItem(USER_ID_KEY, id);
}

/**
 * @title Clear User ID
 * @description Entfernt die User-ID aus dem localStorage.
 */
export function clearUserId() {
  localStorage.removeItem(USER_ID_KEY);
}

/**
 * @title Parse Response
 * @description Parst eine Fetch-Response als JSON oder Text, abhängig vom Content-Type Header.
 * @param {Response} res - Fetch API Response-Objekt
 * @returns {Object} Objekt mit ok (Boolean), status (Number) und data (Object|String)
 */
async function parseResponse(res) {
  const type = res.headers.get("content-type") || "";
  const data = type.includes("application/json") ? await res.json() : await res.text();
  return { ok: res.ok, status: res.status, data };
}

/**
 * @title Register
 * @description Registriert einen neuen Benutzer über die API, speichert Access Token und User-ID bei Erfolg.
 * @param {String} email - E-Mail-Adresse des Benutzers
 * @param {String} username - Gewünschter Benutzername
 * @param {String} password - Passwort des Benutzers
 * @param {String} displayName - Anzeigename des Benutzers
 * @throws Error bei fehlgeschlagener Registrierung (z.B. Benutzer existiert bereits)
 * @returns {Object} API-Antwort mit accessToken und user-Objekt
 */
// Register braucht: username + email + password + displayName
export async function register({ email, username, password, displayName }) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, username, password, displayName }),
  });

  const { ok, data } = await parseResponse(res);
  if (!ok) throw new Error(typeof data === "string" ? data : JSON.stringify(data));

  if (data?.accessToken) setToken(data.accessToken);
  if (data?.user?.id) setUserId(data.user.id);

  return data;
}

/**
 * @title Login
 * @description Meldet einen bestehenden Benutzer über E-Mail und Passwort an, speichert Access Token und User-ID.
 * @param {String} email - E-Mail-Adresse des Benutzers
 * @param {String} password - Passwort des Benutzers
 * @throws Error bei ungültigen Anmeldedaten oder Serverfehler
 * @returns {Object} API-Antwort mit accessToken und user-Objekt
 */
// Login braucht: email + password (NICHT username)
export async function login({ email, password }) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const { ok, data } = await parseResponse(res);
  if (!ok) throw new Error(typeof data === "string" ? data : JSON.stringify(data));

  if (data?.accessToken) setToken(data.accessToken);
  if (data?.user?.id) setUserId(data.user.id);

  return data;
}

/**
 * @title Refresh Token
 * @description Erneuert den Access Token mithilfe des Refresh Tokens (Cookie). Löscht lokale Auth-Daten bei Fehler.
 * @throws Error wenn keine userId verfügbar oder Refresh fehlgeschlagen
 * @returns {String} Neuer Access Token
 */
export async function refresh() {
  try {
    let userId = getUserId();
    const token = getToken();

    if (!userId && token) {
      userId = getUserIdFromAccessToken(token);
      if (userId) setUserId(userId);
    }

    if (!userId) {
      clearToken();
      clearUserId();
      throw new Error("Kein userId verfügbar – bitte neu einloggen.");
    }

    const res = await apiPost("/api/auth/refresh", { userId });
    if (!res?.accessToken) {
      clearToken();
      clearUserId();
      throw new Error("Refresh hat kein accessToken geliefert.");
    }

    setToken(res.accessToken);
    return res.accessToken;

  } catch (err) {
    clearToken();
    clearUserId();
    throw err;
  }
}



/**
 * @title Get Current User
 * @description Ruft das Profil des aktuell eingeloggten Benutzers von der API ab.
 * @throws Error wenn kein Token vorhanden oder API-Anfrage fehlschlägt
 * @returns {Object} User-Objekt mit allen Profilfeldern
 */
export async function me() {
  const token = getToken();
  if (!token) throw new Error("No token");

  const res = await fetch("/api/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });

  const { ok, data } = await parseResponse(res);
  if (!ok) throw new Error(typeof data === "string" ? data : JSON.stringify(data));
  return data;
}

/**
 * @title Logout
 * @description Meldet den Benutzer ab. Sendet Logout-Request an die API und löscht Token und User-ID lokal.
 */
export async function logout() {
  const token = getToken();

  // Versuche Backend-Logout (optional), aber selbst wenn es scheitert: lokal raus.
  if (token) {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
    } catch (_) {}
  }

  clearToken();
  clearUserId();
}
