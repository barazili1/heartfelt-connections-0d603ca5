import FingerprintJS from "@fingerprintjs/fingerprintjs";

import { supabase } from "@/integrations/supabase/client";
import { getHardwareFingerprint } from "@/lib/hardware-fingerprint";

const LEGACY_KEY = "kajo_device_id";
const CACHE_KEY = "kajo_fp";
const ADMIN_KEY = "kajo_admin_ok";

/** Admin device fingerprints allowed to open the admin page. */
export const ADMIN_DEVICE_IDS = [
  "HeDxAvC2QwMgdF0iFP2g",
  "uzmzG0FZ0vRLVrNeqYfC",
  "d8d942c440e9b77050595839121d7d93",
];

let browserFpPromise: Promise<string> | null = null;

/**
 * Browser fingerprint used only as a compatibility/admin candidate.
 */
async function getBrowserFingerprint(): Promise<string> {
  if (typeof window === "undefined") return Promise.resolve("");
  if (!browserFpPromise) {
    browserFpPromise = (async () => {
      try {
        const agent = await FingerprintJS.load();
        const { visitorId } = await agent.get();
        window.localStorage.setItem(CACHE_KEY, visitorId);
        return visitorId;
      } catch {
        return window.localStorage.getItem(CACHE_KEY) ?? getLegacyDeviceId() ?? "";
      }
    })();
  }
  return browserFpPromise;
}

/** Telegram identity is retained only to detect submissions made by older app versions. */
function getTelegramId(): string {
  if (typeof window === "undefined") return "";
  const tg = (
    window as unknown as {
      Telegram?: { WebApp?: { initDataUnsafe?: { user?: { id?: number } } } };
    }
  ).Telegram;
  const id = tg?.WebApp?.initDataUnsafe?.user?.id;
  return id ? `tg${id}` : "";
}

/**
 * Hardware-derived id used to enforce one submission per physical device.
 * It deliberately excludes Telegram identity, cookies, localStorage, IP and
 * browser fingerprints, so changing account/browser/network does not reset it.
 */
export async function getDeviceId(): Promise<string> {
  if (typeof window === "undefined") return "";
  return getHardwareFingerprint()
    .then((result) => result.id)
    .catch(() => "");
}

export function getLegacyDeviceId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LEGACY_KEY);
}

/** Marks this browser as admin (after typing the admin player ID). */
export function grantAdminAccess(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ADMIN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function hasAdminAccess(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ADMIN_KEY) === "1";
  } catch {
    return false;
  }
}

export type DeviceInfo = {
  /** Current device fingerprint. */
  deviceId: string;
  browserId: string;
  /** Every id this device may already own rows under (fingerprint + legacy id). */
  candidates: string[];
  isAdmin: boolean;
};

/**
 * Resolves the device fingerprint and whether it is an admin device.
 */
export async function resolveDevice(): Promise<DeviceInfo> {
  const [deviceId, browserId] = await Promise.all([getDeviceId(), getBrowserFingerprint()]);
  const legacy = getLegacyDeviceId();
  const telegram = getTelegramId();
  const candidates = [
    ...new Set([deviceId, telegram, browserId, legacy].filter((v): v is string => !!v)),
  ];

  let isAdmin = hasAdminAccess() || candidates.some((c) => ADMIN_DEVICE_IDS.includes(c));

  if (!isAdmin && candidates.length) {
    const { data } = await supabase
      .from("admin_devices")
      .select("fingerprint")
      .in("fingerprint", candidates);
    if (data && data.length > 0) isAdmin = true;
  }

  return { deviceId, browserId, candidates, isAdmin };
}

export function isValidPlayerId(value: string): boolean {
  return /^17\d{7,10}$/.test(value);
}
