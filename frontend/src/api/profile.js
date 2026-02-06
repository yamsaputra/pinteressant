import { getToken } from "../auth.js";

// API call fürs Profil.
// Das Backend speichert die Felder am User (displayName, socialLinks, portfolioSettings).

export async function apiUpdateProfile(payload) {
  const res = await fetch("/api/auth/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken(),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data?.error || data?.details || "Profil konnte nicht gespeichert werden.",
    );
  }

  return data;
}