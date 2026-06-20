import { SectionHeader, Panel } from "./primitives";

const CHANNELS = [
  { k: "email", v: "iamheetchokshi@gmail.com", href: "mailto:iamheetchokshi@gmail.com" },
  { k: "github", v: "github.com/iamheet", href: "https://github.com/iamheet" },
  { k: "linkedin", v: "linkedin.com/in/iamheetchokshi", href: "https://www.linkedin.com/in/iamheetchokshi/" },
  { k: "phone", v: "+91 90996 66950", href: "tel:+919099666950" },
  { k: "resume", v: "download · Heet_Chokshi_Resume.pdf", href: "/resume/Heet_Chokshi_Resume.pdf" },
];

export function Contact() {

  return (
    <section>
      <SectionHeader 
        id="contact" 
        kicker="// section 10" 
        title="Communication Channel" 
        desc="Establish encrypted connection channels. Transmit messages directly to Heet's core interface." 
      />
      
      <div className="grid lg:grid-cols-12 gap-4">
        {/* Core links */}
        <div className="lg:col-span-12">
          <Panel title="Direct Channels">
            <ul className="divide-y divide-border/20 font-mono">
              {CHANNELS.map(c => (
                <li key={c.k}>
                  <a 
                    href={c.href} 
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    className="flex items-center justify-between py-3.5 group hover:px-1 transition-all"
                  >
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 w-16 sm:w-24 shrink-0 select-none">
                      {c.k}
                    </span>
                    <span className="flex-1 text-xs text-foreground/80 group-hover:r-text transition-colors break-all">
                      {c.v}
                    </span>
                    <span className="text-muted-foreground/45 group-hover:r-text group-hover:translate-x-0.5 transition-all text-sm select-none">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Panel>
        </div>


      </div>

      {/* Footer credits */}
      <footer className="mt-12 border-t border-border/20 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[9px] text-muted-foreground/45 select-none">
        <span>© {new Date().getFullYear()} HEET·OS — ALL TRADEMARKS OPERATED BY HEET CHOKSHI</span>
        <span className="flex items-center gap-3">
          <span>BUILD: STABLE_V2.4</span>
          <span className="h-3 w-px bg-border/20" />
          <span>REGION: AWS_AP_SOUTH_1 · Mumbai</span>
        </span>
      </footer>
    </section>
  );
}
