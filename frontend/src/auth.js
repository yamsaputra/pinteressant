const TOKEN_KEY = "accessToken";
const USER_ID_KEY = "userId";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getUserId() {
  return localStorage.getItem(USER_ID_KEY) || "";
}

export function setUserId(id) {
  if (id) localStorage.setItem(USER_ID_KEY, id);
}

export function clearUserId() {
  localStorage.removeItem(USER_ID_KEY);
}

async function parseResponse(res) {
  const type = res.headers.get("content-type") || "";
  const data = type.includes("application/json") ? await res.json() : await res.text();
  return { ok: res.ok, status: res.status, data };
}

// ✅ Register braucht: username + email + password + displayName
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

// ✅ Login braucht: email + password (NICHT username)
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

// ✅ Refresh braucht userId im Body
export async function refresh() {
  const userId = getUserId();
  if (!userId) throw new Error("No userId saved (login/register first)");

  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userId }),
  });

  const { ok, data } = await parseResponse(res);
  if (!ok) throw new Error(typeof data === "string" ? data : JSON.stringify(data));

  if (data?.accessToken) setToken(data.accessToken);
  return data;
}

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
