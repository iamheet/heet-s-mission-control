import { motion } from "framer-motion";
import { SectionHeader, Panel, StatusDot } from "./primitives";

const CHANNELS = [
  { k: "email", v: "heet.chokshi@example.com", href: "mailto:heet.chokshi@example.com" },
  { k: "github", v: "github.com/heetchokshi", href: "https://github.com" },
  { k: "linkedin", v: "linkedin.com/in/heetchokshi", href: "https://linkedin.com" },
  { k: "phone", v: "+91 ·· ···· ····", href: "tel:+91" },
  { k: "resume", v: "download · heet-cv.pdf", href: "#" },
];

export function Contact() {
  return (
    <section>
      <SectionHeader id="contact" kicker="// section 10" title="Communication Channel" desc="Encrypted link · open for collaboration, missions and full-time roles." />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Panel title="channels">
            <ul className="divide-y divide-border/60">
              {CHANNELS.map(c => (
                <li key={c.k}>
                  <a href={c.href} className="flex items-center justify-between py-3 group">
                    <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground w-24">{c.k}</span>
                    <span className="flex-1 text-foreground group-hover:text-cyan transition-colors">{c.v}</span>
                    <span className="text-muted-foreground group-hover:text-cyan transition-colors">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <div>
          <Panel title="signal">
            <div className="flex flex-col items-center text-center py-6">
              <div className="relative h-24 w-24">
                {[0, 1, 2].map(i => (
                  <motion.span key={i} className="absolute inset-0 rounded-full border border-success/60"
                    animate={{ scale: [0.6, 1.6], opacity: [0.8, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6 }} />
                ))}
                <span className="absolute inset-0 m-auto h-3 w-3 rounded-full bg-success led" />
              </div>
              <div className="mt-4 font-mono text-xs text-success flex items-center gap-2"><StatusDot /> AVAILABLE FOR OPPORTUNITIES</div>
              <div className="mt-1 text-[11px] text-muted-foreground">response time · within 24h IST</div>
            </div>
          </Panel>
        </div>
      </div>
      <footer className="mt-10 border-t border-border/60 pt-4 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground">
        <span>© {new Date().getFullYear()} HEET·OS — operated by Heet Chokshi</span>
        <span>build · stable · region ap-south-1</span>
      </footer>
    </section>
  );
}
