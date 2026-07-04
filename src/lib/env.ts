/**
 * Runtime Environment Configuration
 *
 * In production (Docker), API keys are injected at container start via
 * environment variables and fetched from the server at runtime.
 *
 * In development, falls back to Vite's import.meta.env.VITE_* from .env.local.
 *
 * Usage:
 *   import { getEnv, initEnv } from "@/lib/env";
 *   await initEnv();              // call once at app boot
 *   const key = getEnv("ELEVENLABS_API_KEY");  // read anytime after init
 */

import { getClientConfig } from "./config.api";

// Available runtime config keys
export type EnvKey =
  | "API_URL"
  | "ELEVENLABS_STT_KEY"
  | "ELEVENLABS_TTS_KEY_1"
  | "ELEVENLABS_TTS_KEY_2"
  | "ELEVENLABS_TTS_KEY_3"
  | "ELEVENLABS_TTS_KEY_4"
  | "ELEVENLABS_TTS_KEY_5"
  | "ELEVENLABS_TTS_KEY_6"
  | "ELEVENLABS_TTS_KEY_7"
  | "ELEVENLABS_TTS_KEY_8"
  | "ELEVENLABS_TTS_KEY_9"
  | "ELEVENLABS_TTS_KEY_10"
  | "ELEVENLABS_VOICE_ID"
  | "PROMETHEUS_URL";

// Cached runtime config — populated by initEnv()
let runtimeConfig: Record<string, string> | null = null;
let initPromise: Promise<void> | null = null;
let initDone = false;

/**
 * Fetches runtime config from the server.
 * Call this once at app boot (before TTS or chat components mount).
 * Safe to call multiple times — deduplicates concurrent calls.
 */
export async function initEnv(): Promise<void> {
  if (initDone) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const config = await getClientConfig();
      runtimeConfig = config;
      console.log("[ENV] Runtime config loaded from server");
    } catch (err) {
      console.warn("[ENV] Failed to fetch runtime config, falling back to import.meta.env:", err);
      runtimeConfig = null;
    } finally {
      initDone = true;
    }
  })();

  return initPromise;
}

/**
 * Map from our EnvKey names to the VITE_ prefixed equivalents in import.meta.env.
 * Used as fallback when runtime config is unavailable (dev mode, fetch failure).
 */
const VITE_FALLBACK_MAP: Partial<Record<EnvKey, string>> = {
  API_URL: "VITE_API_URL",
  ELEVENLABS_VOICE_ID: "VITE_ELEVENLABS_VOICE_ID",
  PROMETHEUS_URL: "VITE_PROMETHEUS_URL",
};

/**
 * Default values for each key (used when neither runtime nor build-time value exists).
 */
const DEFAULTS: Partial<Record<EnvKey, string>> = {
  API_URL: "http://localhost:8000",
  ELEVENLABS_VOICE_ID: "pNInz6obpgDQGcFmaJgB",
  PROMETHEUS_URL: "http://prometheus-svc:9090",
};

/**
 * Returns the value for the given environment key.
 *
 * Priority:
 *  1. Runtime config (fetched from server via initEnv)
 *  2. Vite build-time import.meta.env.VITE_* (dev mode)
 *  3. Hardcoded defaults
 */
export function getEnv(key: EnvKey): string {
  // 1. Runtime config (production)
  if (runtimeConfig && runtimeConfig[key]) {
    return runtimeConfig[key];
  }

  // 2. Vite build-time fallback (dev mode)
  const viteKey = VITE_FALLBACK_MAP[key];
  if (viteKey) {
    const viteVal = (import.meta.env as Record<string, string | undefined>)[viteKey];
    if (viteVal) return viteVal;
  }

  // 3. Defaults
  return DEFAULTS[key] || "";
}
