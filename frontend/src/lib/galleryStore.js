
// - Neu: [{ imageURL: "https://...", publicID: "..." }]
//
// Format ist wichtig fürs Lösch-Feature, weil wir dafür die publicID brauchen.

const GALLERY_KEY = "myGalleryImages";

export function loadGallery() {
  try {
    return JSON.parse(localStorage.getItem(GALLERY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveGallery(arr) {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(arr));
}