/**
 * JARVIS Mission OS — centralized mock data.
 *
 * Every widget reads from the exports here. To wire real metrics later
 * (GCP VM `heet-mission-os` / Prometheus / K3s), replace these constants
 * with fetched values of the same shape — the components stay untouched.
 */

import type { AccentKey } from "./theme";

/* ── Identity ───────────────────────────────────────────────────────────── */
export const OWNER = {
  name: "HEET CHOKSHI",
  role: "System Owner",
  avatar: "https://avatars.githubusercontent.com/u/9919?s=200", // swap for real avatar
} as const;

export const SYSTEM = {
  product: "MISSION OS",
  version: "v2.0.0 | JARVIS CORE",
  center: "JARVIS CONTROL CENTER",
  centerCaption: "AI Command Interface",
} as const;

/* ── Sidebar navigation ─────────────────────────────────────────────────── */
export type NavItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: string; // lucide icon name (resolved in Sidebar)
  accent?: AccentKey;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "core", title: "JARVIS CORE", subtitle: "AI Command Center", icon: "Cpu", accent: "cyan" },
  { id: "dashboard", title: "DASHBOARD", subtitle: "Mission Overview", icon: "LayoutDashboard" },
  { id: "assistant", title: "AI ASSISTANT", subtitle: "Jarvis AI Chat", icon: "Bot" },
  { id: "devops", title: "DEVOPS HUB", subtitle: "Deploy & Automate", icon: "GitBranch" },
  { id: "cloud", title: "CLOUD MATRIX", subtitle: "Multi-Cloud Control", icon: "Cloud" },
  { id: "k8s", title: "KUBERNETES", subtitle: "Cluster Management", icon: "Boxes" },
  { id: "monitoring", title: "MONITORING", subtitle: "System & Logs", icon: "Activity" },
  { id: "analytics", title: "ANALYTICS", subtitle: "Insights & Reports", icon: "BarChart3" },
  { id: "files", title: "FILES CENTER", subtitle: "Data & Storage", icon: "FolderTree" },
  { id: "automation", title: "AUTOMATION", subtitle: "Smart Workflows", icon: "Workflow" },
  { id: "settings", title: "SETTINGS", subtitle: "System Settings", icon: "Settings" },
];

/* ── Global network hotspots ────────────────────────────────────────────── */
export type Hotspot = {
  id: string;
  name: string;
  traffic: "High Traffic" | "Medium Traffic" | "Low Traffic";
  accent: AccentKey;
  /** Normalised 0–1 position on the world map (x=lon, y=lat). */
  x: number;
  y: number;
};

export const HOTSPOTS: Hotspot[] = [
  { id: "us-east", name: "Virginia, USA", traffic: "High Traffic", accent: "cyan", x: 0.27, y: 0.42 },
  { id: "eu-west", name: "Ireland, EU", traffic: "Medium Traffic", accent: "amber", x: 0.46, y: 0.34 },
  { id: "ap-south", name: "Mumbai, India", traffic: "High Traffic", accent: "red", x: 0.66, y: 0.52 },
  { id: "ap-se", name: "Singapore, SEA", traffic: "Low Traffic", accent: "green", x: 0.76, y: 0.63 },
];

export const NETWORK_ARCS: Array<[string, string]> = [
  ["us-east", "eu-west"],
  ["eu-west", "ap-south"],
  ["ap-south", "ap-se"],
  ["us-east", "ap-se"],
];

/* ── System health (row 1 card) ─────────────────────────────────────────── */
export type HealthStat = { label: string; value: number; accent: AccentKey };

export const HEALTH_STATS: HealthStat[] = [
  { label: "CPU USAGE", value: 63, accent: "blue" },
  { label: "MEMORY", value: 42, accent: "purple" },
  { label: "DISK SPACE", value: 71, accent: "amber" },
  { label: "NETWORK", value: 89, accent: "cyan" },
  { label: "GPU LOAD", value: 58, accent: "green" },
];

/* ── Circular gauges (row 2) ────────────────────────────────────────────── */
export type Gauge = { id: string; label: string; value: number; accent: AccentKey; caption: string };

export const GAUGES: Gauge[] = [
  { id: "cpu", label: "CPU", value: 63, accent: "cyan", caption: "8 Core" },
  { id: "mem", label: "MEMORY", value: 42, accent: "pink", caption: "13.2 / 32 GB" },
  { id: "net", label: "NETWORK", value: 89, accent: "green", caption: "↑ 22.4 MB/s   ↓ 41.8 MB/s" },
  { id: "gpu", label: "GPU", value: 89, accent: "teal", caption: "NVIDIA RTX" },
  { id: "storage", label: "STORAGE", value: 71, accent: "purple", caption: "512 / 1 TB" },
];

/* ── Active processes (right column) ────────────────────────────────────── */
export type ProcessTile = { count: string; label: string; accent: AccentKey; icon: string };

export const PROCESSES: ProcessTile[] = [
  { count: "12", label: "Docker Running", accent: "cyan", icon: "Container" },
  { count: "08", label: "K8s Pods Healthy", accent: "purple", icon: "Boxes" },
  { count: "03", label: "Services Active", accent: "green", icon: "Server" },
  { count: "02", label: "Jobs Running", accent: "amber", icon: "Cog" },
];

/* ── Live logs (right column) ───────────────────────────────────────────── */
export type LogLevel = "INFO" | "SUCCESS" | "WARNING" | "ERROR";
export type LogRow = { time: string; level: LogLevel; message: string };

export const LOGS: LogRow[] = [
  { time: "21:04:12", level: "INFO", message: "Container mission-os-api started" },
  { time: "21:03:58", level: "SUCCESS", message: "Deployment completed · v2.0.0" },
  { time: "21:02:31", level: "WARNING", message: "High memory usage detected on node-3" },
  { time: "21:01:19", level: "INFO", message: "AI model response generated (412ms)" },
  { time: "20:59:47", level: "SUCCESS", message: "Database backup completed · 2.1 GB" },
  { time: "20:58:05", level: "ERROR", message: "Failed login attempt detected · 84.12.x.x" },
];

export const LOG_ACCENT: Record<LogLevel, AccentKey> = {
  INFO: "blue",
  SUCCESS: "green",
  WARNING: "amber",
  ERROR: "red",
};

/* ── Notifications (right column) ───────────────────────────────────────── */
export type Notification = { text: string; time: string; icon: string; accent: AccentKey };

export const NOTIFICATIONS: Notification[] = [
  { text: "Deployment Successful", time: "2m ago", icon: "Rocket", accent: "green" },
  { text: "Container Restarted", time: "11m ago", icon: "RefreshCw", accent: "cyan" },
  { text: "Health Check Passed", time: "26m ago", icon: "HeartPulse", accent: "purple" },
  { text: "New User Login", time: "43m ago", icon: "UserPlus", accent: "amber" },
];

/* ── DevOps pipeline (row 3) ────────────────────────────────────────────── */
export type PipelineStage = {
  id: string;
  title: string;
  status: string;
  icon: string;
  accent: AccentKey;
  state: "done" | "active" | "queued";
};

export const PIPELINE: PipelineStage[] = [
  { id: "code", title: "Code", status: "Commit", icon: "GitCommit", accent: "purple", state: "done" },
  { id: "build", title: "Build", status: "In Progress", icon: "Hammer", accent: "cyan", state: "active" },
  { id: "test", title: "Test", status: "Passed", icon: "FlaskConical", accent: "green", state: "done" },
  { id: "deploy", title: "Deploy", status: "Success", icon: "Rocket", accent: "green", state: "done" },
];

export const PIPELINE_META = {
  project: "Mission Control",
  detail: "main branch · Deployed 2 min ago",
} as const;

/* ── Terminal (row 3) ───────────────────────────────────────────────────── */
export const TERMINAL_PROMPT = "missionos@jarvis:~$";
export const TERMINAL_LINES: Array<{ text: string; kind: "cmd" | "info" | "ok" }> = [
  { text: "deploy mission-os backend --env production", kind: "cmd" },
  { text: "JARVIS: Initializing deployment...", kind: "info" },
  { text: "Checking infrastructure", kind: "ok" },
  { text: "Pulling latest image", kind: "ok" },
  { text: "Running health checks", kind: "ok" },
  { text: "Deployment successful!", kind: "ok" },
];

/* ── Quick actions (row 3) ──────────────────────────────────────────────── */
export type QuickAction = { id: string; label: string; icon: string; accent: AccentKey };

export const QUICK_ACTIONS: QuickAction[] = [
  { id: "deploy", label: "Deploy App", icon: "Rocket", accent: "cyan" },
  { id: "scan", label: "Scan System", icon: "ScanLine", accent: "purple" },
  { id: "backup", label: "Backup Now", icon: "DatabaseBackup", accent: "green" },
  { id: "cache", label: "Clear Cache", icon: "Trash2", accent: "amber" },
  { id: "restart", label: "Restart Services", icon: "RotateCw", accent: "pink" },
  { id: "ai", label: "AI Analyze", icon: "Sparkles", accent: "teal" },
];

/* ── Assistant greeting ─────────────────────────────────────────────────── */
export const ASSISTANT = {
  greeting: "Good Evening, Heet 👋",
  status: "All systems are operational and running smoothly.",
  prompt: "How may I assist you today?",
} as const;
