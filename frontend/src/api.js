export async function apiGet(path) {
  const res = await fetch(path, { credentials: "include" });

  // Wenn Backend JSON schickt -> res.json(), sonst Text
  const type = res.headers.get("content-type") || "";
  const data = type.includes("application/json") ? await res.json() : await res.text();

  // Wenn Status nicht ok (z.B. 404/500), Fehler werfen
  if (!res.ok) throw new Error(typeof data === "string" ? data : JSON.stringify(data));

  return data;
}
