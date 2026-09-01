import FingerprintJS from "@fingerprintjs/fingerprintjs";

import { supabase } from "@/integrations/supabase/client";
import { getHardwareFingerprint } from "@/lib/hardware-fingerprint";


const LEGACY_KEY = "kajo_device_id";
const CACHE_KEY = "kajo_fp";

/** Admin device fingerprints allowed to open the admin page. */
export const ADMIN_DEVICE_IDS = [
  "HeDxAvC2QwMgdF0iFP2g",
  "uzmzG0FZ0vRLVrNeqYfC",
  "d8d942c440e9b77050595839121d7d93",
];

let fpPromise: Promise<string> | null = null;

/**
 * Real hardware/OS level device fingerprint (FingerprintJS visitorId).
 * Stays the same across network changes, incognito, and cache clears;
 * changes only when the device itself changes.
 */
export function getDeviceId(): Promise<string> {
  if (typeof window === "undefined") return Promise.resolve("");
  if (!fpPromise) {
    fpPromise = (async () => {
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
  return fpPromise;
}

export function getLegacyDeviceId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LEGACY_KEY);
}

export type DeviceInfo = {
  /** Current device fingerprint. */
  deviceId: string;
  /** Every id this device may already own rows under (fingerprint + legacy id). */
  candidates: string[];
  isAdmin: boolean;
};

/**
 * Resolves the device fingerprint and whether it is an admin device.
 * Admin devices are stored server-side, so a recognised device stays admin
 * even after switching browser or network.
 */
export async function resolveDevice(): Promise<DeviceInfo> {
  const deviceId = await getDeviceId();
  const legacy = getLegacyDeviceId();
  const candidates = [deviceId, legacy].filter((v): v is string => !!v);

  let isAdmin = candidates.some((c) => ADMIN_DEVICE_IDS.includes(c));

  if (candidates.length) {
    const { data } = await supabase
      .from("admin_devices")
      .select("fingerprint")
      .in("fingerprint", candidates);
    if (data && data.length > 0) isAdmin = true;

    // Persist the real fingerprint for a known admin device.
    if (isAdmin && deviceId && !data?.some((r) => r.fingerprint === deviceId)) {
      await supabase.from("admin_devices").insert({ fingerprint: deviceId });
    }
  }

  return { deviceId, candidates, isAdmin };
}

export function isValidPlayerId(value: string): boolean {
  return /^17\d{7,10}$/.test(value);
}
