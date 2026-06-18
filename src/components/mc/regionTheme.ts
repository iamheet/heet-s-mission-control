/**
 * regionTheme.ts
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for AWS Region visual themes AND
 * live metric profiles used by all dashboard components.
 *
 * Color philosophy:
 *  Cyan  / Blue  → Stable Operations   (N. Virginia)
 *  Amber / Gold  → Medium Utilization  (Ireland)
 *  Orange/ Warm  → Heavy Traffic       (Mumbai)
 *  Pure red is NEVER used unless representing a critical outage.
 */

import { createContext, useContext, useMemo } from "react";

export type RegionId = "us-east-1" | "eu-west-1" | "ap-south-1";
export type SimSpeed = 0.1 | 1 | 2 | 5;

// ─── Metric Profile ──────────────────────────────────────────────────────────

export interface RegionMetrics {
  /** Base CPU % for this region */
  cpu: number;
  /** Base Memory % */
  memory: number;
  /** Baseline latency in ms */
  latencyMs: number;
  /** Requests per minute */
  requestsPerMin: number;
  /** Infra health % */
  infraHealth: number;
  /** Active containers */
  containers: number;
  /** Deploy success rate % */
  deploySuccess: number;
  /** Active monitoring probes */
  probes: number;
  /** Node load offsets indexed to InfraMap nodes */
  nodeLoadOffsets: number[];
  /** Observability chart base values [cpu, ram, net, latency, errors, k8s] */
  chartBases: number[];
}

// ─── Region Theme ─────────────────────────────────────────────────────────────

export interface RegionTheme {
  id: RegionId;
  label: string;
  shortLabel: string;
  flag: string;
  status: "healthy" | "moderate" | "high-load";
  statusLabel: string;
  statusMeaning: string;
  statusDesc: string;

  /** Primary accent — used for reactor core, borders, active states */
  primary: string;
  secondary: string;

  reactorCore: string;
  reactorRing: string;
  packetFill: string;
  nodeFill: string;
  nodeStroke: string;

  /** Per-chart colors [cpu, ram, net, latency, errors, k8s] */
  chartColors: string[];

  badgeBorder: string;
  badgeBg: string;
  badgeText: string;
  glowShadow: string;
  throughputColor: string;
  pipelineActive: string;
  pipelineFinished: string;

  /** Ambient backdrop particle hue (0–360) */
  particleHue: number;
  /** Secondary particle hue */
  particleHue2: number;
  /** Body atmospheric gradient colors */
  bgAtmo1: string;
  bgAtmo2: string;

  /** Hero cinematic identity config */
  hero: {
    regionCode: string;
    operationLabel: string;
    statusLines: string[];
    tagline: string;
    glowIntensity: "subtle" | "moderate" | "intense";
    /** Live HUD stats shown in floating right panel */
    hudStats: {
      systemStatus: string;
      activeRequests: string;
      errorRate: string;
      latency: string;
      throughput: string;
    };
    /** Mini terminal line shown at bottom of right panel */
    terminalLine: string;
    /** HUD coordinates */
    coordinates: string;
    /** Cinematic subject image for this region */
    image: string;
    /** Accessibility label for the subject */
    imageAlt: string;
  };

  /** Live metric profile */
  metrics: RegionMetrics;
}

// ─── Region Definitions ─────────────────────────────────────────────────────

export const REGION_THEMES: Record<RegionId, RegionTheme> = {
  "us-east-1": {
    id: "us-east-1",
    label: "N. Virginia",
    shortLabel: "US-E1",
    flag: "🇺🇸",
    status: "healthy",
    statusLabel: "HEALTHY",
    statusMeaning: "Stable Operations",
    statusDesc: "All systems nominal. Low utilization across all nodes.",

    primary: "oklch(0.78 0.16 210)",
    secondary: "oklch(0.72 0.18 240)",

    reactorCore: "oklch(0.78 0.16 210)",
    reactorRing: "oklch(0.72 0.18 240)",
    packetFill: "oklch(0.78 0.16 210)",
    nodeFill: "oklch(0.78 0.16 210 / 0.65)",
    nodeStroke: "oklch(0.78 0.16 210 / 0.35)",

    chartColors: [
      "oklch(0.78 0.16 210)",  // cpu  — cyan
      "oklch(0.7 0.22 295)",   // ram  — purple
      "oklch(0.75 0.18 155)",  // net  — green
      "oklch(0.8 0.17 75)",    // lat  — amber
      "oklch(0.65 0.24 25)",   // err  — warm
      "oklch(0.78 0.16 210)",  // k8s  — cyan
    ],

    badgeBorder: "oklch(0.78 0.16 210 / 0.4)",
    badgeBg: "oklch(0.78 0.16 210 / 0.08)",
    badgeText: "oklch(0.78 0.16 210)",
    glowShadow: "0 0 24px oklch(0.78 0.16 210 / 0.35), 0 0 60px oklch(0.78 0.16 210 / 0.1)",
    throughputColor: "oklch(0.78 0.16 210)",
    pipelineActive: "oklch(0.78 0.16 210)",
    pipelineFinished: "oklch(0.78 0.16 210 / 0.4)",

    particleHue: 210,
    particleHue2: 240,
    bgAtmo1: "oklch(0.25 0.10 230 / 0.40)",
    bgAtmo2: "oklch(0.22 0.08 260 / 0.25)",

    hero: {
      regionCode: "US-EAST-1",
      operationLabel: "OPTIMAL OPERATIONS",
      statusLines: ["Infrastructure Stable", "Latency Nominal", "Systems Online"],
      tagline: "Primary Cloud Operations Center",
      glowIntensity: "subtle",
      hudStats: {
        systemStatus: "OPTIMAL OPERATIONS",
        activeRequests: "1.2K /s",
        errorRate: "0.01%",
        latency: "28ms",
        throughput: "1.1TB/s",
      },
      terminalLine: "All systems nominal. Uptime 99.97%.",
      coordinates: "38.9072° N, 77.0369° W",
      image: "https://images.pexels.com/photos/7672253/pexels-photo-7672253.jpeg",
      imageAlt: "Futuristic male operator in blue-lit mission control",
    },


    metrics: {
      cpu: 32,
      memory: 45,
      latencyMs: 28,
      requestsPerMin: 1200,
      infraHealth: 99.97,
      containers: 47,
      deploySuccess: 99.1,
      probes: 128,
      nodeLoadOffsets: [0, 0, 0, 0, 0, 0, 0],
      chartBases: [32, 45, 38, 28, 2, 96],
    },
  },

  "eu-west-1": {
    id: "eu-west-1",
    label: "Ireland",
    shortLabel: "EU-W1",
    flag: "🇮🇪",
    status: "moderate",
    statusLabel: "MODERATE",
    statusMeaning: "Medium Utilization",
    statusDesc: "Elevated load. Scaling in progress. Monitoring active.",

    primary: "oklch(0.82 0.18 72)",
    secondary: "oklch(0.78 0.20 58)",

    reactorCore: "oklch(0.82 0.18 72)",
    reactorRing: "oklch(0.78 0.20 58)",
    packetFill: "oklch(0.82 0.18 72)",
    nodeFill: "oklch(0.82 0.18 72 / 0.65)",
    nodeStroke: "oklch(0.82 0.18 72 / 0.35)",

    chartColors: [
      "oklch(0.82 0.18 72)",   // cpu  — amber
      "oklch(0.78 0.20 58)",   // ram  — gold
      "oklch(0.75 0.18 155)",  // net  — green
      "oklch(0.85 0.16 88)",   // lat  — warm yellow
      "oklch(0.72 0.18 45)",   // err  — orange-amber
      "oklch(0.82 0.18 72)",   // k8s  — amber
    ],

    badgeBorder: "oklch(0.82 0.18 72 / 0.4)",
    badgeBg: "oklch(0.82 0.18 72 / 0.08)",
    badgeText: "oklch(0.82 0.18 72)",
    glowShadow: "0 0 24px oklch(0.82 0.18 72 / 0.35), 0 0 60px oklch(0.82 0.18 72 / 0.1)",
    throughputColor: "oklch(0.82 0.18 72)",
    pipelineActive: "oklch(0.82 0.18 72)",
    pipelineFinished: "oklch(0.82 0.18 72 / 0.4)",

    particleHue: 72,
    particleHue2: 55,
    bgAtmo1: "oklch(0.28 0.12 72 / 0.35)",
    bgAtmo2: "oklch(0.24 0.10 55 / 0.22)",

    hero: {
      regionCode: "EU-WEST-1",
      operationLabel: "REGIONAL LOAD ACTIVE",
      statusLines: ["Balanced Traffic", "Resource Allocation Active", "Scaling In Progress"],
      tagline: "European Regional Operations",
      glowIntensity: "moderate",
      hudStats: {
        systemStatus: "BALANCED LOAD",
        activeRequests: "4.3K /s",
        errorRate: "0.04%",
        latency: "67ms",
        throughput: "1.8TB/s",
      },
      terminalLine: "Scaling active. Resource allocation in progress.",
      coordinates: "53.3498° N, 6.2603° W",
      image: "https://images.pexels.com/photos/6940104/pexels-photo-6940104.jpeg",
      imageAlt: "DevOps lead with amber holographic visor",
    },


    metrics: {
      cpu: 58,
      memory: 61,
      latencyMs: 67,
      requestsPerMin: 2600,
      infraHealth: 98.3,
      containers: 63,
      deploySuccess: 96.4,
      probes: 142,
      nodeLoadOffsets: [18, 22, 20, 25, 18, 15, 12],
      chartBases: [58, 61, 62, 67, 8, 88],
    },
  },

  "ap-south-1": {
    id: "ap-south-1",
    label: "Mumbai",
    shortLabel: "AP-S1",
    flag: "🇮🇳",
    status: "high-load",
    statusLabel: "HIGH LOAD",
    statusMeaning: "Heavy Traffic",
    statusDesc: "Critical load. Auto-scaling engaged. Manual review recommended.",

    primary: "oklch(0.75 0.20 38)",
    secondary: "oklch(0.68 0.22 25)",

    reactorCore: "oklch(0.75 0.20 38)",
    reactorRing: "oklch(0.68 0.22 25)",
    packetFill: "oklch(0.75 0.20 38)",
    nodeFill: "oklch(0.75 0.20 38 / 0.65)",
    nodeStroke: "oklch(0.75 0.20 38 / 0.35)",

    chartColors: [
      "oklch(0.75 0.20 38)",   // cpu  — orange
      "oklch(0.68 0.22 25)",   // ram  — warm orange-red
      "oklch(0.72 0.18 50)",   // net  — amber-orange
      "oklch(0.78 0.20 42)",   // lat  — orange
      "oklch(0.68 0.22 25)",   // err  — deep orange
      "oklch(0.75 0.20 38)",   // k8s  — orange
    ],

    badgeBorder: "oklch(0.75 0.20 38 / 0.4)",
    badgeBg: "oklch(0.75 0.20 38 / 0.08)",
    badgeText: "oklch(0.75 0.20 38)",
    glowShadow: "0 0 24px oklch(0.75 0.20 38 / 0.35), 0 0 60px oklch(0.75 0.20 38 / 0.1)",
    throughputColor: "oklch(0.75 0.20 38)",
    pipelineActive: "oklch(0.75 0.20 38)",
    pipelineFinished: "oklch(0.75 0.20 38 / 0.4)",

    particleHue: 38,
    particleHue2: 22,
    bgAtmo1: "oklch(0.30 0.16 38 / 0.38)",
    bgAtmo2: "oklch(0.26 0.14 22 / 0.24)",

    hero: {
      regionCode: "AP-SOUTH-1",
      operationLabel: "PEAK TRAFFIC EVENT",
      statusLines: ["High Throughput", "Heavy Request Volume", "Auto-Scaling Engaged"],
      tagline: "Asia Pacific High-Demand Node",
      glowIntensity: "intense",
      hudStats: {
        systemStatus: "PEAK TRAFFIC\nHIGH LOAD",
        activeRequests: "12.4K /s",
        errorRate: "0.02%",
        latency: "38ms",
        throughput: "2.7TB/s",
      },
      terminalLine: "Building the future, one deployment at a time.",
      coordinates: "19.0760° N, 72.8777° E",
      image: "https://images.pexels.com/photos/12969342/pexels-photo-12969342.jpeg",
      imageAlt: "Mission commander in high-energy VR environment",
    },


    metrics: {
      cpu: 83,
      memory: 78,
      latencyMs: 121,
      requestsPerMin: 5200,
      infraHealth: 94.1,
      containers: 89,
      deploySuccess: 91.7,
      probes: 168,
      nodeLoadOffsets: [36, 38, 42, 45, 35, 28, 22],
      chartBases: [83, 78, 85, 121, 18, 72],
    },
  },
};

export const REGION_ORDER: RegionId[] = ["us-east-1", "eu-west-1", "ap-south-1"];

// ─── Split contexts — prevents full re-render cascade on region switch ────────
// Problem: SimContext.Provider in Home() re-creates its value object on every
// render, causing ALL consumers (Hero, Overview, Observability, InfraMap…) to
// re-render simultaneously when regionId or simSpeed changes.
//
// Solution: split into two stable contexts:
//   SimMetaContext  — regionId + setters only (changes rarely, small update)
//   SimThemeContext — theme + metrics objects (derived from regionId, stable ref)
//
// Components that only need metrics (Overview, Observability) subscribe to
// SimThemeContext and do NOT re-render when simSpeed changes.
// Components that only need setters (TopBar) subscribe to SimMetaContext.

export interface SimMetaContextValue {
  regionId: RegionId;
  simSpeed: SimSpeed;
  setRegion: (id: RegionId) => void;
  setSimSpeed: (s: SimSpeed) => void;
}

export interface SimThemeContextValue {
  theme: RegionTheme;
  metrics: RegionMetrics;
  regionId: RegionId;
}

export const SimMetaContext = createContext<SimMetaContextValue>({
  regionId: "ap-south-1",
  simSpeed: 1,
  setRegion: () => {},
  setSimSpeed: () => {},
});

export const SimThemeContext = createContext<SimThemeContextValue>({
  regionId: "ap-south-1",
  theme: REGION_THEMES["ap-south-1"],
  metrics: REGION_THEMES["ap-south-1"].metrics,
});

// Backwards-compat alias — existing components using SimContext still work
export const SimContext = SimMetaContext;

// Combined value type kept for useSimulation() return
export interface SimContextValue {
  regionId: RegionId;
  theme: RegionTheme;
  metrics: RegionMetrics;
  simSpeed: SimSpeed;
  setRegion: (id: RegionId) => void;
  setSimSpeed: (s: SimSpeed) => void;
}

export function useSimulation(): SimContextValue {
  const { regionId, simSpeed, setRegion, setSimSpeed } = useContext(SimMetaContext);
  const { theme, metrics } = useContext(SimThemeContext);
  return useMemo(
    () => ({ regionId, theme, metrics, simSpeed, setRegion, setSimSpeed }),
    [regionId, theme, metrics, simSpeed, setRegion, setSimSpeed]
  );
}

/** @deprecated Use useSimulation() instead */
export function useRegionTheme() {
  return useSimulation();
}

// Helper: apply theme values as CSS variables on :root for global consumption
export function withAlpha(color: string, alpha: number) {
  // If color already contains a slash alpha (e.g. 'oklch(... / 0.18)') just return
  if (/\/\s*\d/.test(color)) return color;
  // Insert ` / <alpha>` before the trailing ')', if present
  const m = color.match(/^(.*)\)\s*$/);
  if (m) return `${m[1]} / ${alpha})`;
  // Fallback: return color unchanged
  return color;
}

export function applyRegionVars(theme: RegionTheme, duration = 800) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const s = root.style;
  // theme duration in ms
  s.setProperty("--theme-transition", `${duration}ms`);

  s.setProperty("--primary", theme.primary);
  s.setProperty("--secondary", theme.secondary);
  s.setProperty("--accent", theme.pipelineActive || theme.primary);
  s.setProperty("--glow-shadow", theme.glowShadow || "none");

  s.setProperty("--pipeline-active", theme.pipelineActive);
  s.setProperty("--pipeline-finished", theme.pipelineFinished);

  s.setProperty("--reactor-core", theme.reactorCore);
  s.setProperty("--reactor-ring", theme.reactorRing);
  s.setProperty("--packet-fill", theme.packetFill);
  s.setProperty("--node-fill", theme.nodeFill);
  s.setProperty("--node-stroke", theme.nodeStroke);

  // shorthand vars used by CSS file
  s.setProperty("--rp", theme.primary);
  s.setProperty("--rs", theme.secondary);
  s.setProperty("--rcore", theme.reactorCore);
  s.setProperty("--rring", theme.reactorRing);
  theme.chartColors.forEach((c, i) => s.setProperty(`--rc${i}`, c));

  s.setProperty("--badge-border", theme.badgeBorder);
  s.setProperty("--badge-bg", theme.badgeBg);
  s.setProperty("--badge-text", theme.badgeText);

  // chart palette
  theme.chartColors.forEach((c, i) => s.setProperty(`--chart-${i}`, c));

  // convenience alpha variants used throughout the codebase
  s.setProperty("--primary-08", withAlpha(theme.primary, 0.08));
  s.setProperty("--primary-12", withAlpha(theme.primary, 0.12));
  s.setProperty("--primary-14", withAlpha(theme.primary, 0.14));
  s.setProperty("--primary-18", withAlpha(theme.primary, 0.18));
  s.setProperty("--primary-22", withAlpha(theme.primary, 0.22));
  s.setProperty("--primary-28", withAlpha(theme.primary, 0.28));
  s.setProperty("--primary-30", withAlpha(theme.primary, 0.30));
  s.setProperty("--primary-38", withAlpha(theme.primary, 0.38));
  s.setProperty("--primary-40", withAlpha(theme.primary, 0.40));

  // status helpers
  s.setProperty("--throughput", theme.throughputColor || theme.primary);

  // Sweep overlay tuning: slightly subtler for healthy regions, stronger for high-load
  const sweepOpacityMap: Record<string, string> = {
    healthy: "0.6",
    moderate: "0.85",
    "high-load": "0.95",
  };
  s.setProperty("--region-sweep-opacity", sweepOpacityMap[theme.status] || "0.9");
  s.setProperty("--region-sweep-easing", "cubic-bezier(.22,.9,.25,1)");

  // Atmospheric background vars
  s.setProperty("--region-particle-hue", String(theme.particleHue));
  s.setProperty("--region-particle-hue2", String(theme.particleHue2));
  s.setProperty("--region-bg-atmo1", theme.bgAtmo1);
  s.setProperty("--region-bg-atmo2", theme.bgAtmo2);

  // Data attribute on root for CSS selectors
  root.setAttribute("data-region", theme.id);
}
