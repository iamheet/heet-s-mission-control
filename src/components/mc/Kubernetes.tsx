import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader, Panel, StatusDot } from "./primitives";
import { useState, useEffect } from "react";
import { AlertCircle, Trash2, Cpu, HardDrive, RefreshCw } from "lucide-react";
import { useJarvisHighlight } from "@/hooks/useJarvisHighlight";

interface Pod {
  id: string;
  name: string;
  status: "Running" | "Terminating" | "Pending";
  cpu: number;
  mem: number;
  restarts: number;
}

interface Node {
  id: string;
  pods: Pod[];
}

const INITIAL_NODES: Node[] = [
  { 
    id: "node-1", 
    pods: [
      { id: "n1-nginx", name: "nginx-ingress", status: "Running", cpu: 12, mem: 45, restarts: 0 },
      { id: "n1-app", name: "app-v3-f2a1", status: "Running", cpu: 42, mem: 68, restarts: 1 },
      { id: "n1-redis", name: "redis-cache", status: "Running", cpu: 8, mem: 32, restarts: 0 }
    ] 
  },
  { 
    id: "node-2", 
    pods: [
      { id: "n2-app", name: "app-v3-x9b3", status: "Running", cpu: 38, mem: 65, restarts: 0 },
      { id: "n2-work", name: "worker-process", status: "Running", cpu: 55, mem: 74, restarts: 2 },
      { id: "n2-exp", name: "node-exporter", status: "Running", cpu: 5, mem: 12, restarts: 0 }
    ] 
  },
  { 
    id: "node-3", 
    pods: [
      { id: "n3-pg", name: "postgres-db", status: "Running", cpu: 28, mem: 80, restarts: 0 },
      { id: "n3-app", name: "app-v3-l8p1", status: "Running", cpu: 45, mem: 70, restarts: 0 },
      { id: "n3-cron", name: "cron-cleaner", status: "Running", cpu: 2, mem: 18, restarts: 0 }
    ] 
  },
];

export function Kubernetes() {
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null);
  const [simSpeed, setSimSpeed] = useState(1);

  // Listen to sim speed
  useEffect(() => {
    const handleSpeed = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.speed === "number") {
        setSimSpeed(customEvent.detail.speed);
      }
    };
    window.addEventListener("sim-speed-change", handleSpeed);
    return () => window.removeEventListener("sim-speed-change", handleSpeed);
  }, []);

  const dispatchTerminalLog = (msg: string) => {
    window.dispatchEvent(new CustomEvent("terminal-output", { detail: { text: msg } }));
  };

  const handlePodSelect = (pod: Pod) => {
    setSelectedPod(pod);
  };

  const terminatePod = async (nodeId: string, podId: string, name: string) => {
    if (!selectedPod || selectedPod.status !== "Running") return;
    
    // 1. Set status to Terminating
    dispatchTerminalLog(`[k8s] kubectl delete pod ${name} --force`);
    dispatchTerminalLog(`[k8s] Scheduling termination sequence for container: ${name}...`);

    setNodes(prev => prev.map(n => {
      if (n.id !== nodeId) return n;
      return {
        ...n,
        pods: n.pods.map(p => p.id === podId ? { ...p, status: "Terminating" as const } : p)
      };
    }));

    if (selectedPod.id === podId) {
      setSelectedPod(prev => prev ? { ...prev, status: "Terminating" } : null);
    }

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms / simSpeed));

    // Wait and then schedule a new pod in "Pending" status
    await delay(1600);

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const newPodName = `${name.split("-").slice(0, 2).join("-")}-${randomSuffix}`;
    const newPodId = `${nodeId}-heal-${randomSuffix}`;

    dispatchTerminalLog(`[k8s] Pod ${name} evicted successfully.`);
    dispatchTerminalLog(`[k8s] ReplicaSet controller: deploying self-healing replica: ${newPodName}`);

    // Remove old pod, insert new pending pod on the same node
    setNodes(prev => prev.map(n => {
      if (n.id !== nodeId) return n;
      return {
        ...n,
        pods: [
          ...n.pods.filter(p => p.id !== podId),
          { id: newPodId, name: newPodName, status: "Pending" as const, cpu: 0, mem: 10, restarts: 0 }
        ]
      };
    }));

    if (selectedPod.id === podId) {
      setSelectedPod({ id: newPodId, name: newPodName, status: "Pending", cpu: 0, mem: 10, restarts: 0 });
    }

    // Wait and switch pending to Running
    await delay(2000);

    dispatchTerminalLog(`[k8s] ReplicaSet scheduler: ${newPodName} successfully bound to host node: ${nodeId}`);
    dispatchTerminalLog(`[k8s] Container engine: initialized volume mounts for replica.`);

    setNodes(prev => prev.map(n => {
      if (n.id !== nodeId) return n;
      return {
        ...n,
        pods: n.pods.map(p => p.id === newPodId ? { ...p, status: "Running" as const, cpu: 15 + Math.floor(Math.random()*30), mem: 50 + Math.floor(Math.random()*20) } : p)
      };
    }));

    // Update active panel if still selected
    setSelectedPod(prev => {
      if (prev && prev.id === newPodId) {
        return { ...prev, status: "Running", cpu: 32, mem: 64 };
      }
      return prev;
    });
    
    dispatchTerminalLog(`[k8s] ✓ Pod ${newPodName} running. All replicas nominal.`);
  };

  const highlighted = useJarvisHighlight("k8s");
  return (
    <section style={highlighted ? { outline: "1.5px solid color-mix(in oklch, var(--rp) 70%, transparent)", outlineOffset: "8px", boxShadow: "0 0 20px color-mix(in oklch, var(--rp) 20%, transparent)", borderRadius: "0.75rem", transition: "all 0.4s ease" } : { transition: "all 0.4s ease" }}>
      <SectionHeader 
        id="k8s" 
        kicker="// section 06" 
        title="Kubernetes Operations" 
        desc="Production cluster replica map. Click any pod to inspect diagnostic stats, or terminate a container to audit self-healing scheduling." 
      />
      
      <div className="flex flex-col gap-4">
        {/* Nodes Grid */}
        <div>
          <Panel 
            title="Cluster Grid Topology // heet-prod" 
            badge={<span className="text-success flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold tracking-widest text-glow-success select-none"><StatusDot /> Ready</span>}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 font-mono text-[10px] uppercase tracking-wider select-none bg-black/10 py-2 border border-border/20 rounded flex-wrap">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded r-bg-md border r-border r-text">Ingress Router</div>
                <Arrow />
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple/15 border border-purple/30 text-purple">Load Balancer Service</div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                {nodes.map(n => (
                  <div key={n.id} className="rounded-lg border border-border/40 bg-black/15 p-3 flex flex-col justify-between group">
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider mb-3 select-none">
                      <span className="r-text font-bold">▣ {n.id}</span>
                      <span className="text-success font-semibold tracking-widest text-glow-success">Ready</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {n.pods.map((p, i) => {
                        const statusColor = p.status === "Running" ? "r-border r-bg-md r-text hover:r-border" : 
                                            p.status === "Terminating" ? "border-warning/50 bg-warning/10 text-warning hover:border-warning animate-pulse" :
                                            "border-yellow-500/40 bg-yellow-500/10 text-yellow-500 hover:border-yellow-500 animate-pulse";
                        
                        return (
                          <motion.div 
                            key={p.id}
                            onClick={() => handlePodSelect(p)}
                            whileHover={{ scale: 1.05, y: -2 }}
                            className={`relative aspect-square rounded flex flex-col items-center justify-center font-mono text-[9px] text-center border cursor-pointer transition-all duration-300 ${statusColor}`}
                          >
                            <StatusIcon status={p.status} />
                            <span className="truncate w-full px-1 mt-1.5 font-bold">{p.name.split("-")[0]}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        {/* Diagnostic Panel */}
        <div>
          <Panel title="Replica Telemetry Diagnostics" id="k8s-diagnostics-panel">
            <AnimatePresence mode="wait">
              {selectedPod ? (
                <motion.div
                  key={selectedPod.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 font-mono text-xs select-none"
                >
                  <div className="border-b border-border/20 pb-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-foreground font-display tracking-tight uppercase">{selectedPod.name}</div>
                      <div className="text-[9px] text-muted-foreground/60 mt-0.5">CONTAINER SPECIFICATIONS</div>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded text-[9px] border font-bold ${
                      selectedPod.status === "Running" ? "r-border r-bg-md r-text r-text-glow" :
                      selectedPod.status === "Terminating" ? "border-warning/60 bg-warning/10 text-warning" :
                      "border-yellow-500/60 bg-yellow-500/10 text-yellow-500"
                    }`}>
                      {selectedPod.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground/60 flex items-center gap-1.5"><Cpu size={12} /> CPU Usage:</span>
                      <span className="text-foreground font-bold">{selectedPod.cpu}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground/60 flex items-center gap-1.5"><HardDrive size={12} /> RAM Usage:</span>
                      <span className="text-foreground font-bold">{selectedPod.mem}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground/60 flex items-center gap-1.5"><RefreshCw size={12} /> Restarts:</span>
                      <span className="text-foreground font-bold">{selectedPod.restarts}</span>
                    </div>
                  </div>

                  {/* Self Healing Action Trigger */}
                  <div className="pt-4 border-t border-border/10">
                    <button
                      onClick={() => {
                        // Find node containing this pod
                        const parentNode = nodes.find(n => n.pods.some(p => p.id === selectedPod.id));
                        if (parentNode) {
                          terminatePod(parentNode.id, selectedPod.id, selectedPod.name);
                        }
                      }}
                      disabled={selectedPod.status !== "Running"}
                      className="w-full flex items-center justify-center gap-2 rounded border border-destructive/60 hover:border-destructive bg-destructive/10 hover:bg-destructive/20 py-2.5 text-destructive font-mono text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 cursor-pointer shadow-glow-destructive"
                    >
                      <Trash2 size={12} className="led text-destructive" /> Terminate replica (Kill Pod)
                    </button>
                    <div className="text-[8px] text-muted-foreground/45 text-center mt-2 uppercase tracking-wide">
                      TRIGGERS K8S SELF-HEALING SCHEDULER PROTOCOL
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-muted-foreground/40 font-mono text-[10px] leading-relaxed text-center py-16 select-none"
                >
                  <AlertCircle size={20} className="mx-auto text-muted-foreground/30 mb-3" />
                  SELECT ANY POD FROM THE CLUSTER GRID MATRIX TO FETCH DIAGNOSTIC METRICS AND RUN SYSTEM TERMINATION TESTING
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>
        </div>
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <svg width="24" height="10" viewBox="0 0 24 10" className="opacity-60 select-none">
      <motion.path 
        d="M2 5 H22 M18 1 L22 5 L18 9" 
        stroke="var(--rp)" 
        strokeWidth="1" 
        fill="none" 
        animate={{ opacity: [0.3, 1, 0.3] }} 
        transition={{ duration: 1.5, repeat: Infinity }} 
      />
    </svg>
  );
}

function StatusIcon({ status }: { status: "Running" | "Terminating" | "Pending" }) {
  if (status === "Running") {
    return (
      <svg className="w-5 h-5 r-text led" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    );
  }
  return (
    <div className="h-2 w-2 rounded-full led animate-ping bg-current" />
  );
}
