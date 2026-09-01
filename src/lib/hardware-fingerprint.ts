/**
 * Advanced hardware fingerprint collector.
 *
 * Collects low-level physical device traits (GPU, canvas raster, audio DSP,
 * CPU/screen specs) and hashes them into a single stable id. These traits do
 * not depend on the browser profile, IP address, cookies or private mode, so
 * the resulting id survives browser switches, VPNs and incognito windows.
 */

export type HardwareTraits = {
  gpuVendor: string;
  gpuRenderer: string;
  canvasHash: string;
  audioHash: string;
  cpuCores: number;
  colorDepth: number;
  devicePixelRatio: number;
  screen: string;
  platform: string;
  timezone: string;
  fonts: string;
};

export type HardwareFingerprint = {
  id: string;
  traits: HardwareTraits;
};

const FONT_CANDIDATES = [
  "Arial",
  "Courier New",
  "Georgia",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
  "Tahoma",
  "Segoe UI",
  "Roboto",
  "Helvetica Neue",
  "Cairo",
  "Noto Naskh Arabic",
];

async function sha256(input: string): Promise<string> {
  try {
    const bytes = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // Non-crypto fallback (insecure contexts).
    let h1 = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      h1 ^= input.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193) >>> 0;
    }
    return h1.toString(16).padStart(8, "0").repeat(4);
  }
}

function collectGpu(): { gpuVendor: string; gpuRenderer: string } {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return { gpuVendor: "unsupported", gpuRenderer: "unsupported" };
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const gpuVendor = info
      ? String(gl.getParameter(info.UNMASKED_VENDOR_WEBGL))
      : String(gl.getParameter(gl.VENDOR));
    const gpuRenderer = info
      ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
    return { gpuVendor, gpuRenderer };
  } catch {
    return { gpuVendor: "unavailable", gpuRenderer: "unavailable" };
  }
}

async function collectCanvas(): Promise<string> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 90;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "unsupported";

    const gradient = ctx.createLinearGradient(0, 0, 300, 90);
    gradient.addColorStop(0, "#ffcc44");
    gradient.addColorStop(0.5, "#101010");
    gradient.addColorStop(1, "#22aaff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 90);

    ctx.globalCompositeOperation = "multiply";
    ctx.beginPath();
    ctx.arc(70, 45, 34, 0, Math.PI * 2, true);
    ctx.fillStyle = "rgba(255,0,128,0.6)";
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.font = "18px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f0f0f0";
    ctx.fillText("KAJO~Arena_117 مرحبا 😀", 8, 62);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.strokeText("KAJO~Arena_117 مرحبا 😀", 9, 63);

    return await sha256(canvas.toDataURL());
  } catch {
    return "unavailable";
  }
}

async function collectAudio(): Promise<string> {
  try {
    const Ctx =
      window.OfflineAudioContext ??
      (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
        .webkitOfflineAudioContext;
    if (!Ctx) return "unsupported";

    const ctx = new Ctx(1, 44100, 44100);
    const oscillator = ctx.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.value = 10000;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    oscillator.connect(compressor);
    compressor.connect(ctx.destination);
    oscillator.start(0);

    const buffer = await ctx.startRendering();
    const channel = buffer.getChannelData(0);
    let sum = 0;
    for (let i = 4500; i < 5000; i++) sum += Math.abs(channel[i] ?? 0);
    return await sha256(sum.toFixed(8));
  } catch {
    return "unavailable";
  }
}

function collectFonts(): string {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "unsupported";
    const baseline = (font: string) => {
      ctx.font = `16px ${font}`;
      return Math.round(ctx.measureText("mmmmmmmmmmlliWWWأبجد").width);
    };
    const fallback = baseline("monospace");
    return FONT_CANDIDATES.filter((f) => baseline(`'${f}', monospace`) !== fallback).join(",");
  } catch {
    return "unavailable";
  }
}

let cached: Promise<HardwareFingerprint> | null = null;

/** Collects hardware traits and returns a stable SHA-256 device id. */
export function getHardwareFingerprint(force = false): Promise<HardwareFingerprint> {
  if (typeof window === "undefined") {
    return Promise.resolve({
      id: "",
      traits: {
        gpuVendor: "",
        gpuRenderer: "",
        canvasHash: "",
        audioHash: "",
        cpuCores: 0,
        colorDepth: 0,
        devicePixelRatio: 0,
        screen: "",
        platform: "",
        timezone: "",
        fonts: "",
      },
    });
  }
  if (force) cached = null;
  if (!cached) {
    cached = (async () => {
      // Yield to the browser so collection never blocks first paint.
      await new Promise((r) => setTimeout(r, 0));
      const { gpuVendor, gpuRenderer } = collectGpu();
      const [canvasHash, audioHash] = await Promise.all([collectCanvas(), collectAudio()]);
      const traits: HardwareTraits = {
        gpuVendor,
        gpuRenderer,
        canvasHash,
        audioHash,
        cpuCores: navigator.hardwareConcurrency ?? 0,
        colorDepth: window.screen.colorDepth ?? 0,
        devicePixelRatio: window.devicePixelRatio ?? 1,
        screen: `${window.screen.width}x${window.screen.height}`,
        platform:
          (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData
            ?.platform ?? navigator.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
        fonts: collectFonts(),
      };
      const id = await sha256(
        [
          traits.gpuVendor,
          traits.gpuRenderer,
          traits.canvasHash,
          traits.audioHash,
          traits.cpuCores,
          traits.colorDepth,
          traits.devicePixelRatio,
          traits.screen,
          traits.platform,
          traits.fonts,
        ].join("|"),
      );
      return { id, traits };
    })();
  }
  return cached;
}
