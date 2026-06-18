import { motion } from "framer-motion";
import { X, ShieldAlert, Cpu, Network, Radio, FileText, Send, Github, Linkedin, Mail } from "lucide-react";

interface BriefingProps {
  onClose: () => void;
}

// Data for custom SVG Radar Chart
const RADAR_AXES = [
  { label: "CI/CD & Automation", val: 95, angle: 0 },
  { label: "DevOps Orchestration", val: 92, angle: 72 },
  { label: "Cloud Scale (AWS)", val: 88, angle: 144 },
  { label: "Observability Plane", val: 85, angle: 216 },
  { label: "Fullstack Engineering", val: 80, angle: 288 }
];

export function RecruiterBriefing({ onClose }: BriefingProps) {
  // Center is (120, 120), Max Radius is 80
  const getRadarPoint = (val: number, angleDegrees: number) => {
    const r = (val / 100) * 80;
    const angleRad = (angleDegrees - 90) * (Math.PI / 180); // Rotate 90deg counter-clockwise to start at top
    const x = 120 + r * Math.cos(angleRad);
    const y = 120 + r * Math.sin(angleRad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  // Generate paths for grid lines
  const gridPolygons = [25, 50, 75, 100].map(pct => {
    return RADAR_AXES.map(a => getRadarPoint(pct, a.angle)).join(" ") + " Z";
  });

  // Active skill fill path
  const skillPath = RADAR_AXES.map(a => getRadarPoint(a.val, a.angle)).join(" ") + " Z";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-background/95 backdrop-blur-md overflow-y-auto select-none"
    >
      {/* Immersive background layouts */}
      <div className="absolute inset-0 hudo-grid scanline opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-purple/10 via-transparent to-(--rp)/10 pointer-events-none" />
      
      {/* Hologram scanline */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-(--rp)/5 to-transparent hudo-scan pointer-events-none opacity-20" />

      {/* HUD Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass w-full max-w-5xl rounded-lg border r-border shadow-glow relative z-10 flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden"
      >
        {/* Border corner markers */}
        <span className="absolute top-2 left-2 font-mono text-[8px] r-text opacity-40">HUD_SYS_V2.4</span>
        <span className="absolute top-2 right-12 font-mono text-[8px] r-text opacity-40">SECURE_LINK // OK</span>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:r-text hover:r-border border border-border/40 p-1.5 rounded bg-black/30 transition-colors z-20"
        >
          <X size={16} />
        </button>

        {/* Header Title */}
        <div className="border-b border-border/40 bg-black/40 px-6 py-4 flex items-center gap-3">
          <ShieldAlert className="r-text led h-5 w-5 animate-pulse" />
          <div>
            <h1 className="text-lg md:text-xl font-bold font-display uppercase tracking-widest r-text-glow r-text">
              RECRUITER BRIEFING
            </h1>
            <p className="font-mono text-[9px] text-muted-foreground/60">
              OPERATIONAL COMMAND BRIEFING • AUTHORIZED PERSONNEL ONLY
            </p>
          </div>
        </div>

        {/* Dossier Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-12 gap-6">
          
          {/* Left Column: Summary & Skill Matrix (ColSpan 7) */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Sector 1: Executive Summary */}
            <div className="space-y-2 border-l-2 r-border pl-4">
              <div className="font-mono text-[10px] r-text uppercase tracking-widest flex items-center gap-1.5">
                <Cpu size={12} /> // sector 01 · profile overview
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground font-display">Heet Chokshi</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Software &amp; DevOps Engineer with professional experience at Softedge Infotech. Hands-on experience with AWS EC2, Docker, GitHub Actions, Linux Administration, Nginx, Prometheus, Grafana, Kubernetes, React.js, Next.js, Node.js, MongoDB, MySQL, PostgreSQL, and OpenAI APIs. Focused on practical deployment, automation, observability, and full-stack application development.
              </p>
            </div>

            {/* Sector 2: Core Competencies Grid */}
            <div className="grid grid-cols-2 gap-3">
              
              <div className="border border-border/40 rounded p-3 bg-black/20">
                <div className="font-mono text-[9px] text-purple uppercase tracking-widest flex items-center gap-1">
                  <Network size={10} /> Cloud &amp; Containers
                </div>
                <div className="text-lg font-bold text-foreground/90 mt-1">AWS &amp; Docker</div>
                <div className="text-[10px] text-muted-foreground mt-1">Managed AWS EC2 deployments, configured Nginx proxy gates, and built Docker containers.</div>
              </div>

              <div className="border border-border/40 rounded p-3 bg-black/20">
                <div className="font-mono text-[9px] text-success uppercase tracking-widest flex items-center gap-1">
                  <Radio size={10} /> Observability &amp; CI/CD
                </div>
                <div className="text-lg font-bold text-foreground/90 mt-1">Prometheus</div>
                <div className="text-[10px] text-muted-foreground mt-1">Monitored systems using Prometheus/Grafana and built actions pipelines.</div>
              </div>

            </div>

            {/* Sector 3: DevOps Achievements */}
            <div className="space-y-2.5">
              <div className="font-mono text-[9px] text-muted-foreground/60 uppercase tracking-widest">
                // core engineering focus areas
              </div>
              <ul className="space-y-2 font-mono text-[11px]">
                <li className="flex items-start gap-2 text-muted-foreground">
                  <span className="r-text">▸</span>
                  <span><b className="text-foreground">Cloud Deployments:</b> Managed AWS EC2 hosting and configured Nginx reverse proxies.</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <span className="r-text">▸</span>
                  <span><b className="text-foreground">CI/CD &amp; Containers:</b> Created automation pipelines with GitHub Actions and built Docker containers.</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <span className="r-text">▸</span>
                  <span><b className="text-foreground">Observability:</b> Monitored infrastructure services using Prometheus and Grafana.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Right Column: Interactive Radar Skill Map & Contact (ColSpan 5) */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-6">
            
            {/* Skill Radar Mesh */}
            <div className="border border-border/40 rounded-lg p-4 bg-black/25 flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-2 left-3 font-mono text-[8px] text-muted-foreground/40 uppercase">
                RADAR_VECTOR_MAP
              </div>
              
              {/* Pentagonal Custom SVG Radar Map */}
              <svg viewBox="0 0 240 240" className="w-48 h-48 md:w-56 md:h-56 mt-4">
                {/* Background Concentric Polygons */}
                {gridPolygons.map((poly, idx) => (
                  <polygon
                    key={idx}
                    points={poly}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="0.6"
                    strokeDasharray={idx === 3 ? "none" : "2 2"}
                  />
                ))}

                {/* Axes Lines */}
                {RADAR_AXES.map((a, idx) => {
                  const pt = getRadarPoint(100, a.angle);
                  return (
                    <line
                      key={idx}
                      x1="120"
                      y1="120"
                      x2={pt.split(",")[0]}
                      y2={pt.split(",")[1]}
                      stroke="var(--border)"
                      strokeWidth="0.6"
                    />
                  );
                })}

                {/* Active Skill Area Shape */}
                <motion.polygon
                  points={skillPath}
                  fill="color-mix(in oklch, var(--rp) 18%, transparent)"
                  stroke="var(--rp)"
                  strokeWidth="1.2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />

                {/* Axis Labels */}
                {RADAR_AXES.map((a, idx) => {
                  const labelPt = getRadarPoint(120, a.angle);
                  const x = parseFloat(labelPt.split(",")[0]);
                  const y = parseFloat(labelPt.split(",")[1]);
                  const textAnchor = x > 125 ? "start" : x < 115 ? "end" : "middle";
                  return (
                    <text
                      key={idx}
                      x={x}
                      y={y + (y > 120 ? 4 : -2)}
                      textAnchor={textAnchor}
                      fontSize="6.8"
                      className="r-fill font-mono uppercase font-bold opacity-60"
                    >
                      {a.label}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Direct Channel Communications */}
            <div className="border border-border/40 rounded-lg p-4 bg-black/25 space-y-3 font-mono">
              <div className="text-[9px] text-muted-foreground/40 uppercase">
                ESTABLISH ENCRYPTED UPLINK
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <a
                  href="mailto:iamheetchokshi@gmail.com"
                  className="flex items-center gap-2 border border-border/60 hover:r-border rounded px-2 py-1.5 hover:r-bg transition-all text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Mail size={12} className="r-text" /> Email Direct
                </a>
                <a
                  href="/resume/Heet_Chokshi_Resume.pdf"
                  target="_blank"
                  download="Heet_Chokshi_Resume.pdf"
                  className="flex items-center gap-2 border border-border/60 hover:border-purple/60 rounded px-2 py-1.5 hover:bg-purple/5 transition-all text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <FileText size={12} className="text-purple" /> CV PDF File
                </a>
                <a
                  href="https://github.com/iamheet"
                  target="_blank"
                  className="flex items-center gap-2 border border-border/60 hover:border-success/60 rounded px-2 py-1.5 hover:bg-success/5 transition-all text-muted-foreground hover:text-foreground"
                >
                  <Github size={12} className="text-success" /> GitHub Vault
                </a>
                <a
                  href="https://www.linkedin.com/in/iamheetchokshi/"
                  target="_blank"
                  className="flex items-center gap-2 border border-border/60 hover:r-border rounded px-2 py-1.5 hover:r-bg transition-all text-muted-foreground hover:text-foreground"
                >
                  <Linkedin size={12} className="r-text" /> LinkedIn Link
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* Footer info logs */}
        <div className="border-t border-border/40 bg-black/40 px-6 py-3 font-mono text-[9px] text-muted-foreground/60 flex justify-between items-center select-none">
          <span>REGION: AP-SOUTH-1 // CLUSTER_STATUS: ONLINE</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success led" />
            SECURE BRIEFING LINK TERMINATION NOMINAL
          </span>
        </div>

      </motion.div>
    </motion.div>
  );
}
