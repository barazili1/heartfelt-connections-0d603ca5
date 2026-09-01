const STORAGE_KEY = "kajo_device_id";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Admin device fingerprints allowed to open the admin page. */
export const ADMIN_DEVICE_IDS = ["HeDxAvC2QwMgdF0iFP2g", "uzmzG0FZ0vRLVrNeqYfC"];

function generateId() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Stable per-device fingerprint (browser only). */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateId();
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function isAdminDevice(deviceId: string): boolean {
  return ADMIN_DEVICE_IDS.includes(deviceId);
}

export function isValidPlayerId(value: string): boolean {
  return /^17\d{7,10}$/.test(value);
}
