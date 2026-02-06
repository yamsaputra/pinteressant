import { getToken } from "../auth.js";

// API calls rund um Fotos (Upload + Delete).
// Wir halten das absichtlich als kleine Funktionen, damit die Feature-Logik
// in features/uploader.js nicht voller fetch()-Details ist.

// Upload: Backend erwartet JSON mit title/description/imageURL.
export async function apiUploadImageDataUrl({ dataUrl, title }) {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken(),
    },
    body: JSON.stringify({
      title: title || "Upload",
      description: "",
      imageURL: dataUrl,
    }),
  });

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Upload hat kein JSON geliefert (Status ${res.status}). Antwort beginnt mit: ${text.slice(0, 60)}`,
    );
  }

  if (!res.ok) throw new Error(data?.error || data?.details || "Upload failed");
  return data;
}

// Delete: Löscht ein Foto über die publicID (Cloudinary).
export async function apiDeletePhoto(publicID) {
  const deleteAPI = `/api/photos/${encodeURIComponent(publicID)}`;

  const res = await fetch(deleteAPI, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + getToken(),
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Löschen fehlgeschlagen");
  }

  return true;
}