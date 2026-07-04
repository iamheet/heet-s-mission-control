import { getEnv } from "@/lib/env";

const DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB"; // Adam (ElevenLabs preset)

// In-memory cache for decoded AudioBuffers
const audioCache = new Map<string, AudioBuffer>();

let audioCtx: AudioContext | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;

// ─── Speech Queue ────────────────────────────────────────────────────────────
type QueuedUtterance = { text: string; onStart?: () => void; onEnd?: () => void; onError?: (err: any) => void };
const speechQueue: QueuedUtterance[] = [];
let isSpeaking = false;

function processQueue() {
  if (isSpeaking || speechQueue.length === 0) return;
  const item = speechQueue.shift()!;
  isSpeaking = true;
  _speakNow(item.text, item.onStart, () => { isSpeaking = false; item.onEnd?.(); processQueue(); }, item.onError);
}

export function enqueueSpeak(text: string, onStart?: () => void, onEnd?: () => void, onError?: (err: any) => void) {
  speechQueue.push({ text, onStart, onEnd, onError });
  processQueue();
}

export function clearQueue() {
  speechQueue.length = 0;
  isSpeaking = false;
}

// Cached selected voice — set once by initVoice(), reused by all speak() calls
let cachedVoice: SpeechSynthesisVoice | null = null;
let voiceInitialized = false;

// ─── Timing Profiling ────────────────────────────────────────────────────────

let mountTime = 0;
const timings: { Event: string; "Time since mount (ms)": string }[] = [];

export function setMountTime() {
  mountTime = performance.now();
}

export function recordTiming(event: string) {
  if (mountTime === 0) {
    mountTime = performance.now();
  }
  const elapsed = performance.now() - mountTime;
  timings.push({ Event: event, "Time since mount (ms)": `+${elapsed.toFixed(1)}ms` });
  console.log(`[JARVIS TIMING] +${elapsed.toFixed(1)}ms — ${event}`);
}

export function printTimingTable() {
  console.log("%c[JARVIS TIMING FLOW]", "color: cyan; font-weight: bold; font-size: 11px;");
  console.table(timings);
}

// ─── Voice Initialization ──────────────────────────────────────────────────

/**
 * Initializes the speech synthesis engine.
 * Waits for voices to load, selects the best English voice, caches it.
 * Performs a silent SpeechSynthesis warmup to pre-initialize the browser engine.
 * Must be called once on app mount.
 */
export function initVoice(onReady: () => void): Promise<string | null> {
  recordTiming("Voice initialization start");

  // Check if ElevenLabs is configured (API Key present)
  // Check if ElevenLabs is configured (API Key present)
  const apiKey = getEnv("ELEVENLABS_TTS_KEY_1") || getEnv("ELEVENLABS_TTS_KEY_2");
  if (apiKey) {
    recordTiming("ElevenLabs API Key detected. Initializing Web Audio API context.");
    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
    } catch (e) {
      console.warn("[JarvisTTS] AudioContext warmup warning:", e);
    }

    // Set up global user gesture listeners to unlock AudioContext on mobile
    if (typeof window !== "undefined") {
      const unlock = () => {
        const ctx = getAudioContext();
        if (ctx.state === "suspended") ctx.resume();
        window.removeEventListener("click", unlock);
        window.removeEventListener("touchstart", unlock);
        window.removeEventListener("pointerdown", unlock);
      };
      window.addEventListener("click", unlock, { passive: true });
      window.addEventListener("touchstart", unlock, { passive: true });
      window.addEventListener("pointerdown", unlock, { passive: true });
    }

    recordTiming("Voices loaded (ElevenLabs)");
    recordTiming("Speech warmup complete (ElevenLabs)");
    voiceInitialized = true;
    onReady();
    return Promise.resolve("ElevenLabs");
  }

  if (typeof window === "undefined" || !window.speechSynthesis) {
    console.warn("[JarvisTTS] speechSynthesis not available — text-only mode");
    voiceInitialized = true;
    onReady();
    return Promise.resolve(null);
  }

  return new Promise<string | null>((resolve) => {
    const trySelect = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return false;

        const PREFERRED = [
          "microsoft ryan",
          "microsoft guy",
          "microsoft david",
          "google uk english male",
          "daniel",
          "alex",
        ];

        // Safe checks: ensure v is defined, and lang/name are strings before manipulating them
        const englishVoices = voices.filter(
          (v) => v && typeof v.lang === "string" && v.lang.toLowerCase().startsWith("en")
        );
        const localEnglish = englishVoices.filter((v) => v.localService === true);
        const remoteEnglish = englishVoices.filter((v) => v.localService !== true);

        let chosen: SpeechSynthesisVoice | undefined;

        for (const name of PREFERRED) {
          chosen = localEnglish.find(
            (v) => v && typeof v.name === "string" && v.name.toLowerCase().includes(name)
          );
          if (chosen) break;
        }

        if (!chosen) {
          chosen = localEnglish.find(
            (v) =>
              v &&
              typeof v.name === "string" &&
              (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("man"))
          );
        }

        if (!chosen) chosen = localEnglish[0];

        if (!chosen) {
          for (const name of PREFERRED) {
            chosen = remoteEnglish.find(
              (v) => v && typeof v.name === "string" && v.name.toLowerCase().includes(name)
            );
            if (chosen) break;
          }
        }

        if (!chosen) {
          chosen = remoteEnglish.find(
            (v) =>
              v &&
              typeof v.name === "string" &&
              (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("man"))
          );
        }

        if (!chosen) chosen = remoteEnglish[0] ?? voices[0];

        cachedVoice = chosen ?? null;
        voiceInitialized = true;

        recordTiming("Voices loaded");
        recordTiming("Speech warmup start");

        // Perform silent speech warmup
        const warmup = new SpeechSynthesisUtterance(" ");
        warmup.volume = 0;

        let warmupTimeout = setTimeout(() => {
          recordTiming("Speech warmup complete (timeout fallback)");
          onReady();
          resolve(cachedVoice?.name ?? null);
        }, 300);

        warmup.onstart = () => {
          clearTimeout(warmupTimeout);
          recordTiming("Speech warmup complete");
          onReady();
          resolve(cachedVoice?.name ?? null);
        };

        warmup.onerror = (e) => {
          clearTimeout(warmupTimeout);
          recordTiming(`Speech warmup failed: ${e.error}`);
          onReady();
          resolve(cachedVoice?.name ?? null);
        };

        try {
          window.speechSynthesis.speak(warmup);
        } catch (err) {
          clearTimeout(warmupTimeout);
          recordTiming(`Speech warmup exception: ${err}`);
          onReady();
          resolve(cachedVoice?.name ?? null);
        }

        return true;
      } catch (err) {
        console.error("[JarvisTTS] Error in trySelect:", err);
        voiceInitialized = true;
        cachedVoice = null;
        recordTiming(`Voice selection failed: ${err}`);
        onReady();
        resolve(null);
        return true;
      }
    };

    let cleanupDone = false;
    const cleanup = () => {
      if (cleanupDone) return;
      cleanupDone = true;
      clearInterval(pollInterval);
      if (window.speechSynthesis) {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      }
    };

    // Voices may already be available (Chrome desktop often loads them sync)
    try {
      if (trySelect()) return;
    } catch (e) {
      console.error("[JarvisTTS] Initial trySelect crashed:", e);
    }

    // Wait for voiceschanged event
    const onVoicesChanged = () => {
      try {
        if (trySelect()) {
          cleanup();
        }
      } catch (e) {
        console.error("[JarvisTTS] trySelect in voiceschanged crashed:", e);
        cleanup();
      }
    };

    if (window.speechSynthesis) {
      window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
    }

    // Polling fallback to check every 50ms (in case event is missed or not fired)
    const pollInterval = setInterval(() => {
      try {
        if (trySelect()) {
          cleanup();
        }
      } catch (e) {
        console.error("[JarvisTTS] trySelect in polling crashed:", e);
        cleanup();
      }
    }, 50);

    // Hard timeout fallback
    setTimeout(() => {
      if (!voiceInitialized) {
        cleanup();
        voiceInitialized = true;
        cachedVoice = null;
        recordTiming("Voices loaded (timeout fallback)");
        recordTiming("Speech warmup complete (timeout fallback)");
        onReady();
        resolve(null);
      }
    }, 2000);
  });
}

/**
 * Normalizes text to ensure robust cache keys (handles whitespace/case changes)
 */
export function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Gets the current greeting text based on time of day
 */
export function getCurrentGreetingText(): string {
  const hours = new Date().getHours();
  let timeGreeting = "Good morning";
  if (hours >= 12 && hours < 17) {
    timeGreeting = "Good afternoon";
  } else if (hours >= 17 || hours < 5) {
    timeGreeting = "Good evening";
  }
  return `${timeGreeting}, and welcome to Heet Chokshi's portfolio. I am Jarvis, online and ready to assist you. I can walk you through his cloud engineering work, outline his full-stack projects, or switch you to his contact panel. How may I assist you today?`;
}

/**
 * Gets or initializes the Web Audio Context
 */
export function getAudioContext(): AudioContext {
  if (typeof window === "undefined") {
    throw new Error("AudioContext is only available in the browser.");
  }
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Checks if a specific text is already cached in memory
 */
export function isCached(text: string): boolean {
  return audioCache.has(normalizeText(text));
}

/**
 * Stops all currently playing audio and clears the queue
 */
export function stop() {
  clearQueue();
  if (activeSourceNode) {
    try { activeSourceNode.stop(); } catch (e) {}
    activeSourceNode = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  activeUtterance = null;
}

/**
 * TTS Cooldown Cache: Tracks keys that failed (e.g. quota exceeded).
 * key -> timestamp of failure.
 */
const failedKeys = new Map<string, number>();
const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Helper to fetch, decode, and cache speech from ElevenLabs
 * Supports automatic 9-tier key rotation with a 15-minute cooldown.
 */
async function fetchAndDecode(text: string): Promise<AudioBuffer> {
  const allKeys = [
    getEnv("ELEVENLABS_TTS_KEY_1"),
    getEnv("ELEVENLABS_TTS_KEY_2"),
    getEnv("ELEVENLABS_TTS_KEY_3"),
    getEnv("ELEVENLABS_TTS_KEY_4"),
    getEnv("ELEVENLABS_TTS_KEY_5"),
    getEnv("ELEVENLABS_TTS_KEY_6"),
    getEnv("ELEVENLABS_TTS_KEY_7"),
    getEnv("ELEVENLABS_TTS_KEY_8"),
    getEnv("ELEVENLABS_TTS_KEY_9"),
    getEnv("ELEVENLABS_TTS_KEY_10"),
  ].filter(Boolean) as string[];

  if (allKeys.length === 0) {
    throw new Error("No ElevenLabs TTS keys configured.");
  }

  const voiceId = getEnv("ELEVENLABS_VOICE_ID") || DEFAULT_VOICE_ID;
  const normalized = normalizeText(text);
  const cached = audioCache.get(normalized);
  if (cached) return cached;

  const now = Date.now();
  
  // Filter out keys that are in cooldown
  const keys = allKeys.filter(k => {
    const failedAt = failedKeys.get(k);
    if (!failedAt) return true;
    if (now - failedAt > COOLDOWN_MS) {
      failedKeys.delete(k); // cooldown expired
      return true;
    }
    return false;
  });

  if (keys.length === 0) {
    throw new Error("All available ElevenLabs TTS keys are currently in cooldown.");
  }

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const keyIndex = allKeys.indexOf(key) + 1; // 1-indexed for logging
    console.log(`[TTS] Using key #${keyIndex} for: "${text.substring(0, 30)}..."`);

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": key,
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_flash_v2_5",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        failedKeys.set(key, Date.now()); // Mark key as failed
        
        if (i < keys.length - 1) {
          const nextKeyIndex = allKeys.indexOf(keys[i + 1]) + 1;
          console.warn(`[TTS] Key #${keyIndex} failed (${response.status}) – switching to key #${nextKeyIndex}`);
          continue;
        }
        
        console.warn(`[TTS] All ElevenLabs keys unavailable – using SpeechSynthesis fallback`);
        throw new Error(`ElevenLabs API returned ${response.status}: ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const ctx = getAudioContext();
      // Use standard Promise wrapper for decodeAudioData to support Safari
      const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
        ctx.decodeAudioData(arrayBuffer, resolve, reject);
      });
      
      audioCache.set(normalized, audioBuffer);
      return audioBuffer;
    } catch (err) {
      // Mark network errors as failures too
      failedKeys.set(key, Date.now());
      
      if (i < keys.length - 1) {
        const nextKeyIndex = allKeys.indexOf(keys[i + 1]) + 1;
        console.warn(`[TTS] Key #${keyIndex} failed (Network/Other) – switching to key #${nextKeyIndex}`);
        continue;
      }
      console.warn(`[TTS] All ElevenLabs keys unavailable – using SpeechSynthesis fallback`);
      throw err;
    }
  }

  throw new Error("Unexpected failure in fetchAndDecode");
}

/**
 * Preloads the greeting message during boot sequence
 */
export async function preloadGreeting(text: string): Promise<void> {
  const apiKey = getEnv("ELEVENLABS_TTS_KEY_1") || getEnv("ELEVENLABS_TTS_KEY_2");
  if (!apiKey) {
    console.warn("[JarvisTTS] Missing ElevenLabs API key, preloading skipped. Falling back to browser SpeechSynthesis.");
    return;
  }

  try {
    await fetchAndDecode(text);
    console.log("[JarvisTTS] Greeting preloaded successfully.");
  } catch (err) {
    console.error("[JarvisTTS] Preloading greeting failed:", err);
  }
}

/**
 * Falls back to browser Web Speech API (SpeechSynthesis)
 */
function speakWithSpeechSynthesis(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onError?.(new Error("SpeechSynthesis is not supported in this environment."));
    return;
  }

  try {
    recordTiming("speechSynthesis.speak()");
    // DO NOT cancel here — queue handles sequencing

    const spokenText = text
      .replace(/HEET[·•\-]?OS/gi, "Heet OS")
      .replace(/J\.A\.R\.V\.I\.S/gi, "Jarvis")
      .replace(/DevOps/gi, "Dev Ops")
      .replace(/Next\.js/gi, "Next JS")
      .replace(/CI\/CD\b/gi, "CI CD")
      .replace(/\bAWS\b/g, "AWS")
      .replace(/\bK8s\b/gi, "Kubernetes")
      .replace(/\bNginx\b/gi, "Engine X")
      .replace(/—/g, ", ");

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate   = 0.98;
    utterance.pitch  = 1.0;
    utterance.volume = 1.0;

    // Use the pre-selected cached voice — no re-selection overhead
    if (cachedVoice) {
      utterance.voice = cachedVoice;
    }

    utterance.onstart = () => {
      recordTiming("speechSynthesis.onstart");
      recordTiming("First audible audio");
      onStart?.();
    };
    utterance.onend   = () => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
        onEnd?.();
      }
    };
    utterance.onerror = (e) => {
      console.error("[JarvisTTS] SpeechSynthesisUtterance error:", e);
      if (activeUtterance === utterance) {
        activeUtterance = null;
        onError?.(e);
      }
    };

    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    onError?.(err);
  }
}

/**
 * Synthesizes and plays the text using ElevenLabs, with automatic cache resolution
 * and automatic fallback to browser SpeechSynthesis.
 */
// Internal: plays immediately without queueing (used by queue processor)
function _speakNow(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
) {
  const apiKey = getEnv("ELEVENLABS_TTS_KEY_1") || getEnv("ELEVENLABS_TTS_KEY_2");
  if (!apiKey) {
    speakWithSpeechSynthesis(text, onStart, onEnd, onError);
    return;
  }
  const normalized = normalizeText(text);
  const cachedBuffer = audioCache.get(normalized);
  const startPlayback = (buffer: AudioBuffer) => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") ctx.resume();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => { if (activeSourceNode === source) { activeSourceNode = null; onEnd?.(); } };
      activeSourceNode = source;
      onStart?.();
      source.start(0);
    } catch (err) {
      speakWithSpeechSynthesis(text, onStart, onEnd, onError);
    }
  };
  if (cachedBuffer) { startPlayback(cachedBuffer); }
  else {
    fetchAndDecode(text)
      .then(startPlayback)
      .catch(() => speakWithSpeechSynthesis(text, onStart, onEnd, onError));
  }
}

export function speak(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
) {
  stop();

  const apiKey = getEnv("ELEVENLABS_TTS_KEY_1") || getEnv("ELEVENLABS_TTS_KEY_2");

  // Fallback if no key is configured
  if (!apiKey) {
    speakWithSpeechSynthesis(text, onStart, onEnd, onError);
    return;
  }

  // Attempt to play from cache, or fetch and play
  const normalized = normalizeText(text);
  const cachedBuffer = audioCache.get(normalized);

  const startPlayback = (buffer: AudioBuffer) => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      source.onended = () => {
        if (activeSourceNode === source) {
          activeSourceNode = null;
          onEnd?.();
        }
      };

      activeSourceNode = source;
      recordTiming("First audible audio (ElevenLabs)");
      onStart?.();
      source.start(0);
    } catch (err) {
      console.error("[JarvisTTS] Failed to play decoded audio buffer:", err);
      // fallback if playing buffer fails
      speakWithSpeechSynthesis(text, onStart, onEnd, onError);
    }
  };

  recordTiming("ElevenLabs speak() called");
  if (cachedBuffer) {
    console.log(`[JarvisTTS] Playing from cache: "${text.substring(0, 30)}..."`);
    startPlayback(cachedBuffer);
  } else {
    console.log(`[JarvisTTS] Cache miss. Fetching from ElevenLabs: "${text.substring(0, 30)}..."`);
    recordTiming("ElevenLabs API fetch start");
    fetchAndDecode(text)
      .then((buffer) => {
        recordTiming("ElevenLabs API fetch complete");
        startPlayback(buffer);
      })
      .catch((err) => {
        console.error("[JarvisTTS] ElevenLabs call failed, falling back to Web Speech:", err);
        speakWithSpeechSynthesis(text, onStart, onEnd, onError);
      });
  }
}
