// FileReader-Kram (Bilder als Base64 für Preview/Upload).
//
// Warum Base64?
// - Preview im Browser ist super easy
// - Upload kann dann als JSON laufen (Backend nimmt imageURL als DataURL)

export async function filesToDataUrls(fileList) {
  const files = Array.from(fileList || []).filter((f) =>
    f.type.startsWith("image/"),
  );

  const readers = files.map(
    (file) =>
      new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      }),
  );

  return Promise.all(readers);
}

export async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result); // data:image/...;base64,...
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}