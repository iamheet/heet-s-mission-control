import { createServerFn } from "@tanstack/react-start";

/**
 * Server function that reads environment variables at REQUEST time (not build time).
 * This enables runtime injection of API keys via Docker -e flags.
 *
 * The handler body runs server-only — it is never shipped to the client bundle.
 * It checks both non-prefixed names (Docker convention) and VITE_ prefixed names
 * (dev mode fallback from .env.local).
 */
export const getClientConfig = createServerFn({ method: "GET" }).handler(
  async () => {
    // Use dynamic import to access process in the server context
    const env = typeof process !== "undefined" ? process.env : ({} as Record<string, string | undefined>);

    return {
      API_URL: env.VITE_API_URL || env.API_URL || "http://localhost:8000",
      ELEVENLABS_STT_KEY: env.ELEVENLABS_STT_KEY || "",
      ELEVENLABS_TTS_KEY_1: env.ELEVENLABS_TTS_KEY_1 || "",
      ELEVENLABS_TTS_KEY_2: env.ELEVENLABS_TTS_KEY_2 || "",
      ELEVENLABS_TTS_KEY_3: env.ELEVENLABS_TTS_KEY_3 || "",
      ELEVENLABS_TTS_KEY_4: env.ELEVENLABS_TTS_KEY_4 || "",
      ELEVENLABS_TTS_KEY_5: env.ELEVENLABS_TTS_KEY_5 || "",
      ELEVENLABS_TTS_KEY_6: env.ELEVENLABS_TTS_KEY_6 || "",
      ELEVENLABS_TTS_KEY_7: env.ELEVENLABS_TTS_KEY_7 || "",
      ELEVENLABS_TTS_KEY_8: env.ELEVENLABS_TTS_KEY_8 || "",
      ELEVENLABS_TTS_KEY_9: env.ELEVENLABS_TTS_KEY_9 || "",
      ELEVENLABS_TTS_KEY_10: env.ELEVENLABS_TTS_KEY_10 || "",
      ELEVENLABS_VOICE_ID: env.ELEVENLABS_VOICE_ID || env.VITE_ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB",
      PROMETHEUS_URL: env.PROMETHEUS_URL || env.VITE_PROMETHEUS_URL || "http://prometheus-svc:9090",
    };
  }
);
