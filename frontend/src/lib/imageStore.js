import { storage } from "./storage.js";

const key = (teamId) => `heroImage:${teamId}`;
const MAX_CHARS = 900_000; // about 650 KB of image; browsers allow roughly 5 MB of settings in total

// Only real pictures: an uploaded file (data:image/...) or an https/http link. No quotes or spaces,
// because the value is placed inside a CSS url("...").
export function isAllowedImageSrc(src) {
  if (typeof src !== "string" || /["\s]/.test(src)) return false;
  return /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(src) || /^https?:\/\//i.test(src);
}

export function loadHeroImage(teamId) {
  const value = storage.get(key(teamId));
  return value && isAllowedImageSrc(value) ? value : null;
}

// Returns true when saved.
export function saveHeroImage(teamId, src) {
  return isAllowedImageSrc(src) && storage.set(key(teamId), src);
}

export function removeHeroImage(teamId) {
  storage.remove(key(teamId));
}

// Shrinks an uploaded picture so it fits in browser storage.
// Tries a few sizes and qualities until it is small enough.
export async function fileToCompressedDataUrl(file) {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't an image.");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("That image couldn't be read. Try a JPG or PNG.");
  });

  const attempts = [
    [1280, 0.82],
    [1280, 0.65],
    [960, 0.6],
  ];
  for (const [maxWidth, quality] of attempts) {
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= MAX_CHARS) {
      bitmap.close?.();
      return dataUrl;
    }
  }
  bitmap.close?.();
  throw new Error("That image is too detailed to store. Try a smaller one.");
}
