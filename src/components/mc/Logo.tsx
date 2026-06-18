import { motion } from "framer-motion";
import { useSimulation } from "./regionTheme";

interface LogoProps {
  variant?: "full" | "navbar" | "loader";
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Logo({ variant = "full", size = 32, className = "", style }: LogoProps) {
  // Common split-hexagon geometry coordinates centered on (150, 150)
  const outerLeft = "M 142,40 L 54.74,91 L 54.74,209 L 142,260";
  const outerRight = "M 158,40 L 245.26,91 L 245.26,209 L 158,260";
  
  const innerLeft = "M 142,49 L 63.4,96 L 63.4,204 L 142,251";
  const innerRight = "M 158,49 L 236.6,96 L 236.6,204 L 158,251";

  // Coordinates for the 6 nodes in loader variant
  const nodes = [
    { x: 150, y: 78 },   // Top (AWS)
    { x: 212, y: 114 },  // Top-Right (Docker)
    { x: 212, y: 186 },  // Bottom-Right (Kubernetes)
    { x: 150, y: 222 },  // Bottom (Prometheus)
    { x: 88, y: 186 },   // Bottom-Left (Actions)
    { x: 88, y: 114 },   // Top-Left (Nginx)
  ];

  if (variant === "navbar") {
    return (
      <svg
        viewBox="0 0 300 300"
        width={size}
        height={size}
        className={`${className} overflow-visible`}
        fill="none"
        style={style}
      >
        <defs>
          <radialGradient id="navCoreGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="var(--rcore)" />
            <stop offset="70%" stopColor="var(--rring)" />
            <stop offset="100%" stopColor="oklch(0.22 0.08 210)" />
          </radialGradient>
        </defs>

        {/* Stable Double Hexagon Frame */}
        <g stroke="var(--rp)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
          <path d={outerLeft} />
          <path d={outerRight} />
        </g>
        <g stroke="var(--rs)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
          <path d={innerLeft} />
          <path d={innerRight} />
        </g>

        {/* Breathing Core */}
        <motion.circle
          cx="150"
          cy="150"
          r="38"
          fill="url(#navCoreGrad)"
          style={{ transformOrigin: "150px 150px" }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{
            duration: 7.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
    );
  }

  if (variant === "loader") {
    return (
      <svg
        viewBox="0 0 300 300"
        width={size}
        height={size}
        className={`${className} overflow-visible`}
        fill="none"
      >
        <defs>
          <radialGradient id="loaderCoreGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="var(--rcore)" />
            <stop offset="65%" stopColor="var(--rring)" />
            <stop offset="100%" stopColor="oklch(0.22 0.08 210)" />
          </radialGradient>
          <radialGradient id="loaderNodeGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#e0f7fa" />
            <stop offset="35%" stopColor="var(--rp)" />
            <stop offset="100%" stopColor="var(--rs)" />
          </radialGradient>
        </defs>

        {/* Outer concentric HUD rings fading in */}
        <motion.circle
          cx="150"
          cy="150"
          r="86"
          stroke="color-mix(in oklch, var(--rp) 6%, transparent)"
          strokeWidth="1.5"
          strokeDasharray="10 8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* Double Hexagon splits fading in */}
        <motion.g
          stroke="var(--rp)"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.95 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Outer Bevel */}
          <path d={outerLeft} strokeWidth="10" />
          <path d={outerRight} strokeWidth="10" />
          {/* Inner Bevel */}
          <path d={innerLeft} strokeWidth="4" opacity="0.4" />
          <path d={innerRight} strokeWidth="4" opacity="0.4" />
        </motion.g>

        {/* Connector lines to nodes */}
        <g stroke="color-mix(in oklch, var(--rp) 18%, transparent)" strokeWidth="1.5" strokeDasharray="3 3">
          {nodes.map((n, idx) => (
            <motion.line
              key={idx}
              x1="150"
              y1="150"
              x2={n.x}
              y2={n.y}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 + idx * 0.08 }}
            />
          ))}
        </g>

        {/* 6 Nodes illuminating sequentially */}
        {nodes.map((n, idx) => (
          <motion.circle
            key={idx}
            cx={n.x}
            cy={n.y}
            r="8"
            fill="url(#loaderNodeGrad)"
            className="led"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 12, delay: 0.8 + idx * 0.12 }}
          />
        ))}

        {/* Central Core activating and starting breath cycle */}
        <motion.circle
          cx="150"
          cy="150"
          r="32"
          fill="url(#loaderCoreGrad)"
          className="led"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.1, 1], opacity: 1 }}
          transition={{ 
            scale: { duration: 0.7, delay: 0.3, ease: "easeOut" },
            opacity: { duration: 0.4, delay: 0.3 }
          }}
        >
          {/* Continuous breathing scale */}
          <motion.circle
            cx="150"
            cy="150"
            r="32"
            fill="url(#loaderCoreGrad)"
            className="led"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{
              duration: 7.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.0,
            }}
          />
        </motion.circle>
      </svg>
    );
  }

  // Variant "full" - default
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 300 300"
        width={size}
        height={size}
        className="overflow-visible"
        fill="none"
        style={style}
      >
        <defs>
          <radialGradient id="fullCoreGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="var(--rcore)" />
            <stop offset="70%" stopColor="var(--rring)" />
            <stop offset="100%" stopColor="oklch(0.22 0.08 210)" />
          </radialGradient>
        </defs>

        {/* Stable Double Hexagon Frame */}
        <g stroke="var(--rp)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
          <path d={outerLeft} />
          <path d={outerRight} />
        </g>
        <g stroke="var(--rs)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
          <path d={innerLeft} />
          <path d={innerRight} />
        </g>

        {/* Breathing Core */}
        <motion.circle
          cx="150"
          cy="150"
          r="38"
          fill="url(#fullCoreGrad)"
          className="led"
          style={{ transformOrigin: "150px 150px" }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{
            duration: 7.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>

      <div className="flex flex-col font-mono select-none">
        <span className="text-foreground font-bold tracking-widest text-xs md:text-sm leading-none">HEET·OS</span>
        <span className="text-[8px] md:text-[9px] text-muted-foreground/50 tracking-widest uppercase mt-0.5">// mission-control</span>
      </div>
    </div>
  );
}
