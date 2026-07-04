import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import { Mic, MicOff, X, Volume2, VolumeX, ChevronDown, Zap } from "lucide-react";
import { useSimulation } from "./regionTheme";
import * as jarvisTTS from "./jarvisTTS";
import { SYSTEMS } from "./Systems";
import { getEnv, initEnv } from "@/lib/env";
import { useClusterMetrics, type ClusterMetricsState } from "@/hooks/useClusterMetrics";
import type { ClusterMetrics } from "@/lib/metrics.api";

// â”€â”€â”€ Web Speech API type declarations (not in default TS lib) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionResultItem;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult:  ((event: SpeechRecognitionEvent) => void) | null;
  onerror:   ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend:     (() => void) | null;
}
declare var SpeechRecognition: { new(): SpeechRecognition };
declare global {
  interface Window {
    SpeechRecognition:        { new(): SpeechRecognition };
    webkitSpeechRecognition:  { new(): SpeechRecognition };
  }
}

// â”€â”€â”€ Types & Interfaces â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Message {
  id: string;
  sender: "jarvis" | "user";
  text: string;
  timestamp: Date;
}

interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

interface RecruiterState {
  isActive: boolean;
  step: number; // 0: offered, 1: intro, 2: projects, 3: devops, 4: contact
}

type VoiceState = "idle" | "listening" | "speaking" | "processing";

interface JarvisAssistantProps {
  onScreenChange?: (screen: string) => void;
  booted?: boolean;
  voiceReady?: boolean;
  externalOpen?: boolean;
  onExternalOpenHandled?: () => void;
}

interface SimData {
  regionId: string;
  regionName: string;
  flag: string;
  status: string;
  cpu: number;
  memory: number;
  latency: number;
  requestsPerMin: number;
  containers: number;
  probes: number;
  health: number;
}

interface EngineResult {
  response: string;
  navScreen?: string;
  scrollTo?: string;
  followUps: string[];
  topic: string;
  nextRecruiterState: RecruiterState;
}


interface TourState {
  isActive: boolean;
  step: number;
}

// Portfolio Tour Steps
const PORTFOLIO_TOUR: { screen: string; title: string; speech: string; scrollTo?: string }[] = [
  { screen: "mission", title: "Mission Control", speech: "We are on Mission Control, the main dashboard. The Hero section shows Heet's name and title as a Software and DevOps Engineer. On the right is a live orbital system showing his core technologies: AWS, Kubernetes, Docker, IAM, Prometheus, and GitHub." },
  { screen: "mission", title: "Mission Control Overview", speech: "The Overview section shows real-time infrastructure telemetry including CPU load, container count, deployment success rate, and a live request throughput chart with active system alerts.", scrollTo: "overview" },
  { screen: "mission", title: "Deployment Center", speech: "The Deployment panel visualizes Heet's CI/CD pipeline. Every git commit triggers GitHub Actions to build, test, containerize with Docker, and deploy to AWS EC2 with zero downtime.", scrollTo: "deploy" },
  { screen: "mission", title: "Observability Center", speech: "The Observability panel is a Grafana-style real-time monitoring simulation displaying time-series graphs for CPU, memory, and network throughput, showing how Heet uses Prometheus and Grafana with alerting thresholds.", scrollTo: "observe" },
  { screen: "infra", title: "Infrastructure Topology", speech: "Now in the Infrastructure section. The left panel shows an AWS architecture map with a Virtual Private Cloud, EC2 instances running Docker containers, Nginx reverse proxy, Route 53 DNS routing, and S3 storage.", scrollTo: "infra" },
  { screen: "infra", title: "Kubernetes Operations", speech: "The Kubernetes panel shows a live cluster with pod health indicators, Deployments, Services, ConfigMaps, and readiness probes. This reflects Heet's actual container orchestration setup in production.", scrollTo: "k8s" },
  { screen: "projects", title: "Production Systems", speech: "The Projects section showcases Heet's live production systems. Mission OS is this portfolio built with React and TypeScript. CryptoNexusAI is an AI cryptocurrency analytics platform on AWS EC2. Royal Stay is a hotel booking platform on Microsoft Azure.", scrollTo: "systems" },
  { screen: "projects", title: "Mission History", speech: "The History panel shows Heet's development timeline with key milestones, technologies used, and project evolution. Each entry links to the live deployment or GitHub repository.", scrollTo: "history" },
  { screen: "operator", title: "Technology Matrix", speech: "The Technology Matrix lists 16 tools across three categories. Infrastructure: AWS, Docker, Kubernetes, Linux, Nginx, GitHub Actions, Prometheus, Grafana. Code: Node.js, Next.js, React, OpenAI. Databases: MongoDB, MySQL, PostgreSQL, Supabase.", scrollTo: "stack" },
  { screen: "terminal", title: "Operator Terminal and Contact", speech: "Finally, the Terminal and Contact section. The left panel is an interactive developer terminal. The right panel has Heet's email, resume download, GitHub, and LinkedIn. Heet is actively open to new Software Engineer and DevOps opportunities. That completes the full portfolio tour, feel free to ask me anything!", scrollTo: "terminal" }
];

// â”€â”€â”€ Knowledge Base (Personality Overhaul with Response Variants) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const KB: Record<string, { keywords: string[]; variants: string[]; detailed: string[] }> = {
  identity: {
    keywords: ["who", "heet", "chokshi", "introduce", "about", "yourself", "name"],
    variants: [
      "I am Jarvis, Heet Chokshi's AI assistant. He is a Software & DevOps Engineer based in India, specializing in cloud infrastructure, containerization, and full-stack development. He's currently open to new opportunities!",
      "Hello! I am Jarvis, the virtual assistant for Heet's command center. Heet is a DevOps and software engineer who loves automating deployment pipelines and building high-performance web systems. What would you like to know about him?",
      "Greetings. I am Jarvis, an AI interface designed to guide you through Heet's portfolio. Heet is an engineer who builds robust frontends and deploys them securely on the cloud. Are you looking to hire, or just browsing?"
    ],
    detailed: [
      "Heet Chokshi is a highly motivated Software & DevOps Engineer with a Master of Computer Applications. He bridges the gap between clean code and reliable infrastructure, specializing in React, Node.js, AWS, and Docker. He enjoys designing automated pipelines that take code from commit to production with zero downtime."
    ]
  },
  devops: {
    keywords: ["devops", "cicd", "ci cd", "pipeline", "automation", "github actions", "deployment"],
    variants: [
      "Heet focuses heavily on infrastructure automation. He designs CI/CD pipelines using GitHub Actions to automate container builds, testing, and zero-downtime deployments. What part of his DevOps workflow would you like to hear about?",
      "DevOps is Heet's core strength. He uses Docker for containerization, Nginx for reverse proxies, and automated rollback strategies to ensure production applications remain secure and stable. Should I navigate you to the infrastructure view?"
    ],
    detailed: [
      "Heet's DevOps practices are built around continuous automation. Every git commit triggers a GitHub Actions pipeline that runs security audits, executes tests, builds a multi-stage Docker image, and deploys it to AWS EC2 behind Nginx. He monitors everything using Prometheus and Grafana, keeping system uptime close to 100%."
    ]
  },
  aws: {
    keywords: ["aws", "amazon", "cloud", "ec2", "s3", "route53", "vpc", "lambda", "rds"],
    variants: [
      "Heet is AWS-certified and has deployed production applications on EC2 using VPC configurations, Route 53 for DNS, and S3 for object storage. Would you like to check out his cloud projects?",
      "Heet manages production environments on AWS. He handles IAM user privileges, security groups, and VPC setups, ensuring applications are highly secure and cost-efficient. What AWS services are you interested in?"
    ],
    detailed: [
      "Heet has hands-on experience designing AWS architectures. He builds virtual private networks (VPCs) with public and private subnets, runs containerized applications on EC2, maps domains with Route 53, and serves static files from S3. He adheres strictly to security best practices, using minimal IAM roles and automated security group configurations."
    ]
  },
  docker: {
    keywords: ["docker", "container", "containerization", "image", "compose", "registry"],
    variants: [
      "Heet uses Docker as his primary containerization engine. He writes optimized multi-stage Dockerfiles to minimize image sizes and security vulnerabilities. Would you like to see how he configures containerized projects?",
      "Every project Heet builds is fully containerized. He uses Docker Compose to manage multi-container environments locally, ensuring consistency between development and production."
    ],
    detailed: [
      "Heet has containerized all his production systems. He is skilled at writing multi-stage Dockerfiles that cache dependencies efficiently, reducing build times. By packaging applications into lightweight Docker containers, he ensures they run reliably on AWS EC2, Azure, or local machines without system conflicts."
    ]
  },
  kubernetes: {
    keywords: ["kubernetes", "k8s", "orchestration", "pods", "helm", "cluster"],
    variants: [
      "Heet has hands-on experience with Kubernetes. He configures Deployments, Services, ConfigMaps, and Secrets to manage container orchestration. Would you like to view the simulated Kubernetes cluster in our Infrastructure tab?",
      "Heet understands K8s concepts like pod scheduling, resource limits, and service discovery. We actually have a live simulation of a K8s topology on the Infrastructure screen. Shall I switch to it?"
    ],
    detailed: [
      "Heet uses Kubernetes for container orchestration. He is comfortable writing manifests for Deployments, Services, and Ingress routing. He configures liveness and readiness probes to automate pod self-healing and uses ConfigMaps/Secrets for environment management. Check out the Infrastructure page to see a visual simulation."
    ]
  },
  missionos: {
    keywords: ["mission os", "mission control", "portfolio", "this", "website", "heetor", "heet os"],
    variants: [
      "You are currently exploring HEETÂ·OS Mission Control, Heet's flagship DevOps portfolio. It's built on React, TypeScript, and Framer Motion, running on Vite. It simulates a real DevOps dashboard. How do you like the design?",
      "Welcome to Mission Control! Heet created this system to act as a futuristic DevOps command center, integrating live telemetry, deployment simulations, and me, Jarvis. What would you like to inspect first?"
    ],
    detailed: [
      "HEETÂ·OS Mission Control is Heet's custom-built portfolio application. It demonstrates frontend engineering with React, TypeScript, TanStack Router, and Framer Motion. He designed it to show how DevOps concepts like infrastructure mapping, deployment status, and real-time monitoring can be visualized in a premium dashboard. It is deployed at iamheet.in."
    ]
  },
  skills: {
    keywords: ["skills", "tech", "stack", "technologies", "tools", "know", "languages", "expertise"],
    variants: [
      "Heet is proficient in TypeScript, React, Next.js, and Node.js. For DevOps, he uses AWS, Docker, Kubernetes, Nginx, and GitHub Actions. What part of his skillset are you evaluating?",
      "Heet's capabilities cover frontend interface design, backend APIs, and cloud deployments. He works with databases like MongoDB, PostgreSQL, and Redis. Shall I show you his Operator Profile for a complete look?"
    ],
    detailed: [
      "Heet's core tech stack is: Languages: JavaScript, TypeScript, Python. Frontend: React, Next.js, Tailwind CSS, Framer Motion. Backend: Node.js, Express. Databases: MongoDB, PostgreSQL, Redis, Supabase. Infrastructure: AWS (certified), Docker, Kubernetes, Nginx, Git, Linux. Observability: Prometheus and Grafana. He excels at deploying and scaling React/Node applications."
    ]
  },
  education: {
    keywords: ["education", "college", "university", "degree", "study", "studied", "qualification", "bca", "mca"],
    variants: [
      "Heet holds a Master of Computer Applications (MCA) degree. He has a solid foundation in algorithms, systems design, and database administration. Would you like to look at his professional experience?",
      "Heet studied computer science, earning his BCA and MCA. His education reinforced his problem-solving skills and software engineering fundamentals. Shall I walk you through his work history?"
    ],
    detailed: [
      "Heet holds a Master of Computer Applications (MCA) in Computer Science. His academic coursework focused on data structures, algorithms, object-oriented design, operating systems, and network security. He has combined this formal education with practical, hands-on cloud deployment experience."
    ]
  },
  experience: {
    keywords: ["experience", "job", "work", "company", "softedge", "professional", "career", "employed"],
    variants: [
      "Heet worked as a Software and DevOps Engineer at Softedge Infotech. He designed cloud architectures on AWS, automated CI/CD pipelines, containerized applications, and configured system monitoring. Would you like to hear about his accomplishments there?",
      "At Softedge Infotech, Heet managed cloud deployments, optimized Nginx routes, containerized applications with Docker, and set up Prometheus/Grafana monitoring. Want details on his work?"
    ],
    detailed: [
      "At Softedge Infotech, Heet operated as a Software & DevOps Engineer. His day-to-day involved writing APIs, migrating legacy systems to Docker containers, configuring secure AWS environments, and building GitHub Actions pipelines. He also set up metrics collection to alert the team of potential issues before they hit production."
    ]
  },
  contact: {
    keywords: ["contact", "email", "reach", "hire", "available", "linkedin", "github", "connect"],
    variants: [
      "You can contact Heet by email at iamheetchokshi@gmail.com, or connect on LinkedIn at linkedin.com/in/iamheetchokshi. His GitHub profile is github.com/iamheet. Shall I open the Terminal & Contact screen?",
      "Heet's primary contact email is iamheetchokshi@gmail.com. You can also view his open-source work on GitHub at github.com/iamheet. Would you like me to switch you over to his Contact section?"
    ],
    detailed: [
      "Heet is responsive to inquiries and open to software and DevOps roles. You can reach out directly via email at iamheetchokshi@gmail.com, find him on LinkedIn under 'iamheetchokshi', or browse his code repositories on GitHub. I can also navigate you directly to his Terminal & Contact screen if you are ready to uplink."
    ]
  },
  monitoring: {
    keywords: ["monitoring", "prometheus", "grafana", "observability", "metrics", "logs", "alerts"],
    variants: [
      "Heet uses Prometheus to scrape metrics and Grafana to build dashboards for tracking memory, CPU, and network health. We have a telemetry dashboard simulator here in Mission Control â€” want to see it?",
      "Heet is experienced with observability. He sets up Prometheus monitoring and Grafana dashboards to track application and server metrics. Shall we navigate to the Observability tab?"
    ],
    detailed: [
      "Heet believes that a system isn't finished until it's monitored. He deploys Prometheus to collect performance metrics and Grafana to visualize them in real-time. He configures alerts for disk space, response times, and container crashes. You can see a live simulation of this telemetry by visiting the Observability section in Mission Control."
    ]
  },
  greeting: {
    keywords: ["hello", "hi", "hey", "good", "morning", "afternoon", "evening", "greet"],
    variants: [
      "Good day! I am Jarvis, Heet's virtual assistant. I can show you his skills, walk you through his projects, or answer questions about his cloud engineering. What shall we talk about?",
      "Hello there! Jarvis is online. I'm here to brief you on Heet's software and DevOps skills, or help you navigate his command center. How can I help you today?",
      "Welcome, operator. Jarvis is at your service. If you are a recruiter, I can run a quick briefing on Heet's profile. What would you like to explore?"
    ],
    detailed: [
      "System initialization complete. Jarvis is ready. I am trained on Heet Chokshi's portfolio, professional experience, education, and tech stack. Feel free to ask me questions like 'Why hire Heet?', 'What are his AWS skills?', or 'Navigate to the projects page'."
    ]
  },
  hire: {
    keywords: ["hire", "recruit", "opportunity", "available", "job", "position", "candidate", "looking for"],
    variants: [
      "Heet is actively open to Software Engineer and DevOps roles. He has experience deploying containerized apps to AWS, writing robust React frontends, and automating workflows. Would you like his contact details?",
      "Heet is looking for new opportunities where he can deploy high-performance applications and automate CI/CD systems. I can take you to the Contact tab if you'd like to get in touch."
    ],
    detailed: [
      "You should hire Heet because he brings a rare combination of frontend and infrastructure skills. He doesn't just write React code; he also packages it, runs it securely in AWS, builds automated deployment pipelines, and monitors it in production. He is currently looking for roles where he can make an immediate impact."
    ]
  }
};

// â”€â”€â”€ Navigation Intents â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const NAV_INTENTS: { keywords: string[]; screen: string; label: string }[] = [
  { keywords: ["mission control", "dashboard", "home", "main"], screen: "mission", label: "Mission Control" },
  { keywords: ["infra", "infrastructure", "kubernetes", "network"], screen: "infra", label: "Infrastructure" },
  { keywords: ["project", "systems", "apps", "applications", "portfolio"], screen: "projects", label: "Project Systems" },
  { keywords: ["operator", "profile", "skills", "tech matrix", "dossier"], screen: "operator", label: "Operator Profile" },
  { keywords: ["terminal", "contact", "uplink", "reach"], screen: "terminal", label: "Terminal & Contact" },
];

const FOLLOWUP_INTENTS = ["more", "explain", "elaborate", "tell me more", "go on", "details", "what about it", "continue"];
const uid = () => Math.random().toString(36).slice(2, 9);

function detectEmotion(input: string): "neutral" | "frustrated" | "excited" | "curious" | "confused" {
  const lower = input.toLowerCase();
  if (
    lower.includes("confused") ||
    lower.includes("don't understand") ||
    lower.includes("what do you mean") ||
    lower.includes("unclear") ||
    lower.includes("stuck") ||
    lower.includes("broken") ||
    lower.includes("doesn't work")
  ) {
    return "frustrated";
  }
  if (
    lower.includes("wow") ||
    lower.includes("amazing") ||
    lower.includes("love") ||
    lower.includes("impressive") ||
    lower.includes("cool") ||
    lower.includes("great") ||
    lower.includes("awesome") ||
    lower.includes("excellent")
  ) {
    return "excited";
  }
  if (
    lower.startsWith("how") ||
    lower.startsWith("why") ||
    lower.startsWith("what") ||
    lower.startsWith("explain") ||
    lower.startsWith("tell me about") ||
    lower.startsWith("can you explain")
  ) {
    return "curious";
  }
  if (lower.includes("?") && (lower.length < 15 || lower.split("?").length > 2)) {
    return "confused";
  }
  return "neutral";
}

function generateFollowUps(topic: string): string[] {
  switch (topic) {
    case "identity":
      return ["Tell me about your projects", "What are your core skills?"];
    case "devops":
      return ["Explain your AWS infrastructure", "How do you monitor systems?"];
    case "aws":
      return ["Tell me about CryptoNexusAI", "Show your DevOps pipelines"];
    case "docker":
      return ["What is your Kubernetes experience?", "Tell me about Royal Stay"];
    case "kubernetes":
      return ["Go to Infrastructure page", "How do you configure CI/CD?"];
    case "missionos":
      return ["What projects are on here?", "Go to Operator Profile"];
    case "projects":
      return ["Tell me about CryptoNexusAI", "Show your AWS skills"];
    case "skills":
      return ["Tell me about your experience", "Why should I hire Heet?"];
    case "education":
      return ["Tell me about your experience", "How can I contact Heet?"];
    case "experience":
      return ["What AWS services do you know?", "Why should I hire you?"];
    case "contact":
      return ["Tell me about your skills", "Show your top projects"];
    case "monitoring":
      return ["Go to Infrastructure page", "Explain DevOps pipeline"];
    case "greeting":
      return ["Who is Heet?", "What projects did he build?"];
    case "hire":
      return ["How can I contact Heet?", "What are his DevOps skills?"];
    default:
      return ["Who is Heet?", "Tell me about his projects"];
  }
}

// â”€â”€â”€ Async Engine Abstraction (Gemini/OpenAI ready & Dynamic Telemetry aware) â”€
async function jarvisEngine(
  query: string,
  context: ConversationTurn[],
  recruiterState: RecruiterState,
  emotion: "neutral" | "frustrated" | "excited" | "curious" | "confused",
  lastTopic: string,
  sim: SimData,
  liveMetrics: ClusterMetrics | null
): Promise<EngineResult> {
  const lower = query.toLowerCase().trim();

  // 1. Recruiter Briefing Flow Check
  if (recruiterState.isActive) {
    if (lower.includes("skip") || lower.includes("contact") || lower.includes("reach") || lower.includes("uplink")) {
      return {
        response: `Heet is currently open to new software and DevOps engineering roles. You can reach him directly at iamheetchokshi@gmail.com, or view his profiles on LinkedIn and GitHub. I am also switching your view to the Terminal & Contact screen for your convenience.`,
        navScreen: "terminal",
        followUps: ["Ask another question", "Show all skills"],
        topic: "recruiter_contact",
        nextRecruiterState: { isActive: false, step: 4 }
      };
    }

    if (lower.includes("stop") || lower.includes("cancel") || lower.includes("exit") || lower.includes("no")) {
      return {
        response: "Understood. Exiting the briefing. Let me know if you want to explore Heet's skills, projects, or experience instead.",
        followUps: ["Show projects", "Show skills"],
        topic: "greeting",
        nextRecruiterState: { isActive: false, step: 0 }
      };
    }

    const nextStep = recruiterState.step + 1;
    if (nextStep === 1) {
      return {
        response: "Heet Chokshi is a Software and DevOps Engineer based in India. He specializes in full-stack development with React and Node.js, and cloud infrastructure automation with AWS, Docker, and GitHub Actions. He excels at bridging the gap between writing clean code and deploying it reliably at scale. Shall I tell you about his projects next?",
        followUps: ["Tell me about his projects", "Skip to contact"],
        topic: "recruiter_step_1",
        nextRecruiterState: { isActive: true, step: 1 }
      };
    } else if (nextStep === 2) {
      const projectsList = SYSTEMS.map(s => s.name).join(", ");
      return {
        response: `Heet has built several production-grade projects: ${projectsList}. He also designed and built this entire HEETÂ·OS Mission Control command center. Shall I outline his DevOps capabilities?`,
        followUps: ["Show DevOps highlights", "Skip to contact"],
        topic: "recruiter_step_2",
        nextRecruiterState: { isActive: true, step: 2 }
      };
    } else if (nextStep === 3) {
      return {
        response: `Heet's DevOps highlights include AWS cloud architecture, containerization via Docker, and automation pipelines. In fact, if you look at the dashboard right now, our active cluster is running on ${sim.containers} container nodes with a latency of ${sim.latency}ms, fully monitored. Shall we pull up his contact details?`,
        followUps: ["Get contact info", "Ask another question"],
        topic: "recruiter_step_3",
        nextRecruiterState: { isActive: true, step: 3 }
      };
    } else if (nextStep === 4) {
      return {
        response: `Heet is currently open to new software and DevOps engineering roles. You can reach him directly at iamheetchokshi@gmail.com, or view his profiles on LinkedIn and GitHub. I am also switching your view to the Terminal & Contact screen for your convenience.`,
        navScreen: "terminal",
        followUps: ["Ask another question", "Show all skills"],
        topic: "recruiter_contact",
        nextRecruiterState: { isActive: false, step: 4 }
      };
    } else {
      return {
        response: "Briefing complete. What would you like to explore next? You can ask about Heet's projects, technical stack, or education.",
        followUps: ["Show projects", "Show skills"],
        topic: "greeting",
        nextRecruiterState: { isActive: false, step: 0 }
      };
    }
  }

  // 2. Check if query triggers Recruiter Briefing start
  const recruiterKeywords = ["recruiter", "hiring", "hr", "talent", "looking for", "candidate", "resume", "cv", "job", "position"];
  const isRecruiterQuery = recruiterKeywords.some(kw => lower.includes(kw));

  if (isRecruiterQuery) {
    return {
      response: "Hello! I've detected that you might be looking to hire Heet. I can take you through a quick, structured briefing on his skills, projects, and availability. Would you like to start the briefing?",
      followUps: ["Start briefing", "No, thanks"],
      topic: "recruiter_offer",
      nextRecruiterState: { isActive: true, step: 0 }
    };
  }

  if (recruiterState.step === 0 && (lower.includes("yes") || lower.includes("start") || lower.includes("brief") || lower.includes("sure") || lower.includes("ok"))) {
    return {
      response: "Heet Chokshi is a Software and DevOps Engineer based in India. He specializes in full-stack development with React and Node.js, and cloud infrastructure automation with AWS, Docker, and GitHub Actions. He excels at bridging the gap between writing clean code and deploying it reliably at scale. Shall I tell you about his projects next?",
      followUps: ["Tell me about his projects", "Skip to contact"],
      topic: "recruiter_step_1",
      nextRecruiterState: { isActive: true, step: 1 }
    };
  } else if (recruiterState.step === 0 && (lower.includes("no") || lower.includes("skip") || lower.includes("thanks"))) {
    return {
      response: "No problem. Feel free to ask me anything about Heet's DevOps experience, AWS work, Docker containerization, or skills. How can I help you?",
      followUps: ["Show projects", "Show skills"],
      topic: "greeting",
      nextRecruiterState: { isActive: false, step: 0 }
    };
  }

  // 3. Dynamic Telemetry / Live Metrics Queries
  const isLive = liveMetrics !== null;
  const liveTag = isLive ? " [LIVE]" : "";

  if (lower.includes("cpu") || lower.includes("processor") || lower.includes("utilization")) {
    const cpuVal = isLive ? liveMetrics!.cpu.toFixed(1) : sim.cpu;
    return {
      response: isLive
        ? `Live cluster CPU utilization is currently at ${cpuVal}%.${liveTag}`
        : `The active CPU utilization in ${sim.flag} ${sim.regionName} is currently running at ${cpuVal}%. All cores are operating within expected limits.`,
      followUps: ["Check memory load", "What is the disk usage?"],
      topic: "metrics",
      nextRecruiterState: recruiterState
    };
  }

  if (lower.includes("memory") || lower.includes("ram") || lower.includes("consumption")) {
    const memVal = isLive ? liveMetrics!.memory.toFixed(1) : sim.memory;
    return {
      response: isLive
        ? `Live cluster memory usage is at ${memVal}% of total capacity.${liveTag}`
        : `System memory allocation in ${sim.flag} ${sim.regionName} is at ${memVal}% of cluster capacity, with garbage collection running optimally.`,
      followUps: ["Check CPU load", "What is the disk usage?"],
      topic: "metrics",
      nextRecruiterState: recruiterState
    };
  }

  if (lower.includes("disk") || lower.includes("storage") || lower.includes("filesystem")) {
    if (isLive) {
      return {
        response: `Live disk utilization on the root filesystem is at ${liveMetrics!.disk.toFixed(1)}%.${liveTag}`,
        followUps: ["Check CPU load", "Check memory load"],
        topic: "metrics",
        nextRecruiterState: recruiterState
      };
    }
  }

  if (lower.includes("network") || lower.includes("bandwidth") || lower.includes("traffic")) {
    if (isLive) {
      const rxMBps = (liveMetrics!.networkRxBytesPerSec / 1024 / 1024).toFixed(2);
      return {
        response: `Live inbound network throughput is ${rxMBps} MB/s across all interfaces.${liveTag}`,
        followUps: ["Check CPU load", "Check disk usage"],
        topic: "metrics",
        nextRecruiterState: recruiterState
      };
    }
  }

  if (lower.includes("latency") || lower.includes("ping") || lower.includes("response time") || lower.includes("lag")) {
    return {
      response: `The current round-trip network latency to our ${sim.regionName} endpoint is resting at ${sim.latency} milliseconds. Packet routing is operating optimally.`,
      followUps: ["Check infrastructure health", "Check active region"],
      topic: "metrics",
      nextRecruiterState: recruiterState
    };
  }

  if (lower.includes("health") || lower.includes("uptime") || (lower.includes("status") && (lower.includes("infra") || lower.includes("server") || lower.includes("system")))) {
    if (isLive) {
      const days = Math.floor(liveMetrics!.uptimeSeconds / 86400);
      const hours = Math.floor((liveMetrics!.uptimeSeconds % 86400) / 3600);
      return {
        response: `Live cluster status: CPU ${liveMetrics!.cpu.toFixed(1)}%, Memory ${liveMetrics!.memory.toFixed(1)}%, Disk ${liveMetrics!.disk.toFixed(1)}%. Node uptime: ${days}d ${hours}h. Running ${liveMetrics!.podCount} pods across ${liveMetrics!.containerCount} containers.${liveTag}`,
        followUps: ["Check CPU details", "Check memory details"],
        topic: "metrics",
        nextRecruiterState: recruiterState
      };
    }
    return {
      response: `Our infrastructure health is reporting at ${sim.health}% uptime. The active region ${sim.flag} ${sim.regionName} is under ${sim.status} load, operating without active alerts.`,
      followUps: ["How many containers are active?", "Check memory load"],
      topic: "metrics",
      nextRecruiterState: recruiterState
    };
  }

  if (lower.includes("container") || lower.includes("pod") || lower.includes("node") || lower.includes("probe")) {
    if (isLive) {
      return {
        response: `Live cluster is running ${liveMetrics!.podCount} pods with ${liveMetrics!.containerCount} active containers.${liveTag}`,
        followUps: ["Check CPU load", "Check system health"],
        topic: "metrics",
        nextRecruiterState: recruiterState
      };
    }
    return {
      response: `Our active Kubernetes cluster has ${sim.containers} container nodes running right now, with telemetry reporting from ${sim.probes} active monitoring probes.`,
      followUps: ["Check CPU load", "What is the latency?"],
      topic: "metrics",
      nextRecruiterState: recruiterState
    };
  }

  if (lower.includes("active region") || lower.includes("what region") || lower.includes("active zone") || lower.includes("active theme") || (lower.includes("location") && lower.includes("where"))) {
    return {
      response: `We are currently operating in region ${sim.flag} ${sim.regionName} (${sim.regionId}) under ${sim.status} load. The current traffic rate is ${sim.requestsPerMin} requests per minute.`,
      followUps: ["What is the latency?", "Check system status"],
      topic: "metrics",
      nextRecruiterState: recruiterState
    };
  }

  // 4. Specific Projects / Systems Lookup
  const matchedSystem = SYSTEMS.find(s => lower.includes(s.name.toLowerCase()));
  if (matchedSystem) {
    return {
      response: `${matchedSystem.name} is classified as a "${matchedSystem.tag}". ${matchedSystem.desc} Nodes in this structure: ${matchedSystem.nodes.join(" âž” ")}. Status: live and nominal.`,
      followUps: [`Go to Projects`, `Ask about AWS`],
      topic: "projects",
      nextRecruiterState: recruiterState
    };
  }

  // 5. Navigation intents check
  for (const intent of NAV_INTENTS) {
    if (intent.keywords.some((kw) => lower.includes(kw))) {
      if (
        lower.includes("go") ||
        lower.includes("open") ||
        lower.includes("navigate") ||
        lower.includes("show") ||
        lower.includes("take me") ||
        lower.includes("switch")
      ) {
        return {
          response: `Acknowledged navigation request. Transitioning view to the ${intent.label} panel.`,
          navScreen: intent.screen,
          followUps: generateFollowUps(intent.screen),
          topic: intent.screen,
          nextRecruiterState: recruiterState
        };
      }
    }
  }

  // 6. Follow-up intents (elaborating on last topic)
  const isFollowUp = FOLLOWUP_INTENTS.some(fi => lower.includes(fi)) && lastTopic;
  let topic = isFollowUp ? lastTopic : "";

  // 7. Detect match in Knowledge Base
  if (!topic) {
    for (const [key, entry] of Object.entries(KB)) {
      if (entry.keywords.some((kw) => lower.includes(kw))) {
        topic = key;
        break;
      }
    }
  }

  if (topic === "projects") {
    const projectsList = SYSTEMS.map(s => s.name).join(", ");
    return {
      response: `Heet has deployed ${SYSTEMS.length} main production systems: ${projectsList}. He also built LearnWithH (a Supabase blog) and this entire DevOps command center. Which system would you like to inspect?`,
      followUps: SYSTEMS.map(s => `Show ${s.name}`),
      topic,
      nextRecruiterState: recruiterState
    };
  }

  if (topic && KB[topic]) {
    const entry = KB[topic];
    let response = "";
    if (isFollowUp || lower.includes("explain") || lower.includes("detail") || lower.includes("tell me more")) {
      response = entry.detailed[Math.floor(Math.random() * entry.detailed.length)];
    } else {
      response = entry.variants[Math.floor(Math.random() * entry.variants.length)];
    }

    if (emotion === "frustrated") {
      response = "I understand. Let me simplify this. " + response;
    } else if (emotion === "excited") {
      response = "It's really exciting! " + response;
    } else if (emotion === "confused") {
      response = "Apologies for any confusion. Let me explain: " + response;
    }

    return {
      response,
      followUps: generateFollowUps(topic),
      topic,
      nextRecruiterState: recruiterState
    };
  }

  // 8. Tour trigger
  if (
    lower.includes("tour") || lower.includes("walk me through") || lower.includes("guide me") ||
    lower.includes("show me everything") || lower.includes("explain everything") ||
    lower.includes("explain the portfolio") || lower.includes("full tour") ||
    lower.includes("show me around")
  ) {
    return {
      response: "Excellent! I will take you on a complete guided tour of this portfolio. Starting with the Mission Control dashboard. " + PORTFOLIO_TOUR[0].speech,
      navScreen: PORTFOLIO_TOUR[0].screen,
      scrollTo: PORTFOLIO_TOUR[0].scrollTo,
      followUps: ["Next section \u2192", "Skip tour"],
      topic: "tour_step_0",
      nextRecruiterState: recruiterState
    };
  }

  // 9. Tour step advancement
  if (lower.includes("next section") || lower.includes("next step") || lower.includes("continue tour")) {
    const stepMatch = lastTopic.match(/tour_step_(\d+)/);
    const currentStep = stepMatch ? parseInt(stepMatch[1], 10) : -1;
    const nextStep = currentStep + 1;
    if (nextStep < PORTFOLIO_TOUR.length) {
      const t = PORTFOLIO_TOUR[nextStep];
      return {
        response: "Section " + (nextStep + 1) + " of " + PORTFOLIO_TOUR.length + ": " + t.title + ". " + t.speech,
        navScreen: t.screen,
        scrollTo: t.scrollTo,
        followUps: nextStep < PORTFOLIO_TOUR.length - 1 ? ["Next section \u2192", "Skip tour"] : ["Ask me anything", "Contact Heet"],
        topic: "tour_step_" + nextStep,
        nextRecruiterState: recruiterState
      };
    } else {
      return {
        response: "That completes the full portfolio tour! You have seen all 10 sections of Heet's portfolio. Feel free to ask me anything about his skills, projects, or experience.",
        followUps: ["Why hire Heet?", "How to contact Heet?"],
        topic: "tour_end",
        nextRecruiterState: recruiterState
      };
    }
  }

  if (lower.includes("skip tour")) {
    return {
      response: "Tour skipped. Feel free to ask me anything about Heet's skills, projects, or DevOps experience.",
      followUps: ["Who is Heet?", "Show projects", "Show skills"],
      topic: "greeting",
      nextRecruiterState: recruiterState
    };
  }

  // 10. Fallback
  return {
    response: `I've registered your query. While I don't have an exact match for "${query}" in my matrix, Heet is highly skilled in AWS cloud solutions, Docker, React, and CI/CD pipelines. You can ask me about these topics, or ask to navigate to his Profile or Contact page.`,
    followUps: ["Who is Heet?", "Show skills"],
    topic: "fallback",
    nextRecruiterState: recruiterState
  };
}

// â”€â”€â”€ StreamingText: typewriter effect component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StreamingText({
  text,
  onComplete,
  onCharacterTyped,
  speed = 18,
}: {
  text: string;
  onComplete?: () => void;
  onCharacterTyped?: () => void;
  speed?: number;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const finishImmediately = useCallback(() => {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    setDisplayedText(text);
    setIsDone(true);
    if (onComplete) onComplete();
    if (onCharacterTyped) onCharacterTyped();
  }, [text, onComplete, onCharacterTyped]);

  useEffect(() => {
    setDisplayedText("");
    setIsDone(false);
    if (intervalRef.current) clearTimeout(intervalRef.current);

    let currentIndex = 0;
    const chars = Array.from(text);

    const tick = () => {
      if (currentIndex < chars.length) {
        const nextChar = chars[currentIndex];
        setDisplayedText((prev) => prev + nextChar);
        currentIndex++;
        if (onCharacterTyped) onCharacterTyped();

        let delay = speed;
        if (nextChar === "." || nextChar === "!" || nextChar === "?") {
          delay = 140;
        } else if (nextChar === "," || nextChar === ";" || nextChar === "â€”") {
          delay = 70;
        }

        intervalRef.current = window.setTimeout(tick, delay);
      } else {
        setIsDone(true);
        if (onComplete) onComplete();
      }
    };

    tick();

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [text, speed, onComplete, onCharacterTyped]);

  return (
    <span onClick={finishImmediately} className="cursor-pointer select-none" title="Click to skip typing effect">
      {displayedText}
      {!isDone && <span className="jarvis-stream-cursor" />}
    </span>
  );
}

// â”€â”€â”€ VoiceWaveEnhanced: AnalyserNode + Canvas wave visualizer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function VoiceWaveEnhanced({
  active,
  voiceState,
  color = "var(--rp)",
}: {
  active: boolean;
  voiceState: "idle" | "listening" | "speaking" | "processing";
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (voiceState !== "listening") {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      return;
    }

    let isCancelled = false;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;
      } catch (err) {
        console.warn("Could not retrieve mic input for visualizer:", err);
      }
    }

    initAudio();

    return () => {
      isCancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, [voiceState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bars = 12;
    const barWidth = 2;
    const gap = 2;
    canvas.width = bars * (barWidth + gap) - gap;
    canvas.height = 24;

    const dataArray = new Uint8Array(bars);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (voiceState === "listening" && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else if (voiceState === "speaking") {
        const time = Date.now() * 0.007;
        for (let i = 0; i < bars; i++) {
          const wave = Math.sin(time + i * 0.4) * Math.cos(time * 0.8 - i * 0.2);
          dataArray[i] = Math.max(0, Math.floor((wave + 1) * 110));
        }
      } else if (voiceState === "processing") {
        const time = Date.now() * 0.012;
        for (let i = 0; i < bars; i++) {
          const val = Math.sin(time - i * 0.35) * 0.5 + 0.5;
          dataArray[i] = Math.floor(val * 90);
        }
      } else {
        dataArray.fill(15);
      }

      ctx.fillStyle = color;
      for (let i = 0; i < bars; i++) {
        const percent = dataArray[i] / 255;
        const minHeight = 3;
        const barHeight = percent * (canvas.height - minHeight) + minHeight;

        const x = i * (barWidth + gap);
        const y = (canvas.height - barHeight) / 2;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, 1);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [voiceState, color]);

  return <canvas ref={canvasRef} className="h-5 block" style={{ imageRendering: "pixelated" }} />;
}

// â”€â”€â”€ AnimatedStatusBadge: premium HUD multi-state status indicator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AnimatedStatusBadge({ state }: { state: VoiceState }) {
  const badgeConfig = {
    idle: {
      color: "var(--rp)",
      text: "READY",
      dotClass: "bg-[var(--rp)] animate-pulse",
    },
    listening: {
      color: "oklch(0.65 0.24 25)",
      text: "LISTENING",
      dotClass: "bg-[oklch(0.65 0.24 25)]",
    },
    processing: {
      color: "oklch(0.8 0.17 75)",
      text: "THINKING",
      dotClass: "bg-[oklch(0.8 0.17 75)] animate-bounce",
    },
    speaking: {
      color: "oklch(0.75 0.18 155)",
      text: "SPEAKING",
      dotClass: "bg-[oklch(0.75 0.18 155)]",
    },
  };

  const cfg = badgeConfig[state];

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[8px] border transition-all duration-300"
      style={{
        background: `color-mix(in oklch, ${cfg.color} 10%, transparent)`,
        borderColor: `color-mix(in oklch, ${cfg.color} 25%, transparent)`,
        color: cfg.color,
      }}
    >
      <span className="relative flex h-1.5 w-1.5">
        {state === "listening" && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dotClass}`}></span>
      </span>
      <span>{cfg.text}</span>
    </div>
  );
}

// â”€â”€â”€ JarvisOrb: Animated SVG Visual Core â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function JarvisOrb({
  state,
  onClick,
  size = 80,
}: {
  state: "idle" | "listening" | "speaking" | "processing";
  onClick: () => void;
  size?: number;
}) {
  const center = size / 2;
  const r1 = size * 0.35;
  const r2 = size * 0.44;

  const orbColors = {
    idle: { core: "#00d4ff", ring: "#0066cc", glow: "oklch(0.78 0.16 210)" },
    listening: { core: "#ff3366", ring: "#cc0044", glow: "oklch(0.65 0.24 25)" },
    speaking: { core: "#00ff88", ring: "#00cc66", glow: "oklch(0.75 0.18 155)" },
    processing: { core: "#ff9900", ring: "#cc7700", glow: "oklch(0.8 0.17 75)" },
  };
  const c = orbColors[state];

  return (
    <button
      id="jarvis-orb-btn"
      onClick={onClick}
      className="relative flex items-center justify-center focus:outline-none group"
      style={{ width: size, height: size }}
      aria-label={state === "listening" ? "Stop listening" : "Activate JARVIS voice"}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: `1px solid ${c.ring}`, boxShadow: `0 0 20px ${c.glow}` }}
        animate={
          state === "listening"
            ? { scale: [1, 1.15, 1], opacity: [0.8, 0.3, 0.8] }
            : state === "speaking"
              ? { scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }
              : { scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }
        }
        transition={{ duration: state === "listening" ? 0.8 : state === "speaking" ? 0.5 : 2, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute rounded-full"
        style={{
          inset: "10%",
          border: `1px solid ${c.core}40`,
        }}
        animate={state !== "idle" ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      <svg width={size * 0.7} height={size * 0.7} viewBox={`0 0 ${size} ${size}`} className="relative z-10">
        <defs>
          <radialGradient id={`jarvis-core-${state}`} cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="40%" stopColor={c.core} stopOpacity="0.85" />
            <stop offset="100%" stopColor={c.ring} stopOpacity="0.4" />
          </radialGradient>
          <filter id="jarvis-glow-filter">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={r1}
          fill={`url(#jarvis-core-${state})`}
          filter="url(#jarvis-glow-filter)"
        />
        <circle cx={center} cy={center} r={r2} fill="none" stroke={c.core} strokeWidth="0.5" strokeOpacity="0.3" strokeDasharray="4 6" />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center z-20">
        {state === "idle" && (
          <Mic size={size * 0.22} style={{ color: c.core }} className="opacity-80 group-hover:opacity-100 transition-opacity" />
        )}
        {state === "listening" && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          >
            <MicOff size={size * 0.22} style={{ color: c.core }} />
          </motion.div>
        )}
        {state === "speaking" && (
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <Volume2 size={size * 0.22} style={{ color: c.core }} />
          </motion.div>
        )}
        {state === "processing" && (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Zap size={size * 0.22} style={{ color: c.core }} />
          </motion.div>
        )}
      </div>
    </button>
  );
}
// Computed lazily: after initEnv() runs during boot, getEnv returns runtime values.
// In dev mode, falls back to import.meta.env.VITE_API_URL from .env.local.
function getApiBase() {
  const API_BASE =
    (window as any).RUNTIME_CONFIG?.API_URL ||
    getEnv("API_URL") ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000";

  console.log("Runtime API URL:", (window as any).RUNTIME_CONFIG?.API_URL || getEnv("API_URL"));
  console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
  console.log("API_BASE:", API_BASE);

  return API_BASE;
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ——— LiveMetricsWidget: mini HUD inside Jarvis panel ———————————————————————
function LiveMetricsWidget({ metrics }: { metrics: ClusterMetricsState }) {
  const [collapsed, setCollapsed] = useState(true);
  const { data, isLive, lastUpdated } = metrics;

  const uptimeStr = data
    ? `${Math.floor(data.uptimeSeconds / 86400)}d ${Math.floor((data.uptimeSeconds % 86400) / 3600)}h`
    : "--";

  return (
    <div
      className="border-b select-none"
      style={{
        borderColor: "color-mix(in oklch, var(--rp) 15%, transparent)",
        background: isLive
          ? "color-mix(in oklch, var(--rp) 3%, transparent)"
          : "oklch(0.08 0.01 260 / 0.5)",
      }}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-2 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            {isLive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "oklch(0.75 0.18 155)" }} />
            )}
            <span
              className="relative inline-flex rounded-full h-1.5 w-1.5"
              style={{ background: isLive ? "oklch(0.75 0.18 155)" : "oklch(0.5 0.05 260)" }}
            />
          </span>
          <span
            className="text-[8px] font-bold uppercase tracking-[0.2em]"
            style={{ color: isLive ? "oklch(0.75 0.18 155)" : "oklch(0.5 0.05 260)" }}
          >
            {isLive ? "CLUSTER LIVE" : "CLUSTER OFFLINE"}
          </span>
          {isLive && data && (
            <span className="text-[8px] text-muted-foreground/40 ml-1">
              CPU {data.cpu.toFixed(0)}% · MEM {data.memory.toFixed(0)}%
            </span>
          )}
        </div>
        <ChevronDown
          size={10}
          className="text-muted-foreground/40"
          style={{
            transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2">
              {isLive && data ? (
                <>
                  <MetricBar label="CPU" value={data.cpu} color="oklch(0.78 0.16 210)" />
                  <MetricBar label="MEM" value={data.memory} color="oklch(0.7 0.22 295)" />
                  <MetricBar label="DISK" value={data.disk} color="oklch(0.75 0.18 155)" />
                  <div className="flex items-center justify-between text-[9px] font-mono pt-1">
                    <div className="text-muted-foreground/50">
                      PODS: <span className="text-foreground font-bold">{data.podCount}</span>
                    </div>
                    <div className="text-muted-foreground/50">
                      CONTAINERS: <span className="text-foreground font-bold">{data.containerCount}</span>
                    </div>
                    <div className="text-muted-foreground/50">
                      UPTIME: <span className="text-foreground font-bold">{uptimeStr}</span>
                    </div>
                  </div>
                  <div className="text-[7px] text-muted-foreground/30 text-right">
                    {lastUpdated && `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`}
                  </div>
                </>
              ) : (
                <div className="text-[9px] text-muted-foreground/40 text-center py-2">
                  Prometheus not reachable. Metrics unavailable.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-2">
      <span className="text-[8px] font-bold tracking-wider text-muted-foreground/60 w-8 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="text-[9px] font-bold tabular-nums w-10 text-right" style={{ color }}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

export function JarvisAssistant({ onScreenChange, booted, voiceReady = false, externalOpen, onExternalOpenHandled }: JarvisAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);

  // New UI states
  const [inputText, setInputText] = useState("");
  const [isVoiceReady, setIsVoiceReady] = useState(false);
  const voiceReadyEffective = voiceReady || isVoiceReady;
  const [liveTranscript, setLiveTranscript] = useState("");
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPythonStreaming, setIsPythonStreaming] = useState(false);
  const [isPythonBackendReady, setIsPythonBackendReady] = useState(false);
  const [recruiterState, setRecruiterState] = useState<RecruiterState>({ isActive: false, step: 0 });
  const [tourState, setTourState] = useState<TourState>({ isActive: false, step: 0 });
  const [showTourOffer, setShowTourOffer] = useState(false);
  const tourStateRef = useRef<TourState>({ isActive: false, step: 0 });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reference hooks to avoid stale closures in Web Speech callbacks
  const conversationContextRef = useRef<ConversationTurn[]>([]);
  const lastTopicRef = useRef<string>("");
  const recruiterStateRef = useRef<RecruiterState>({ isActive: false, step: 0 });
  const voiceStateRef = useRef<VoiceState>("idle");
  const isListeningRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const transcriptGeneratedRef = useRef(false);
  const hasInteractedRef = useRef(false);
  const pendingSpeechRef = useRef<string | null>(null);
  const pendingOnStartRef = useRef<(() => void) | null>(null);
  const pendingOnEndRef = useRef<(() => void) | null>(null);

  // Fetch simulation metrics dynamically
  const sim = useSimulation();
  const simRef = useRef(sim);

  // Live cluster metrics from Prometheus
  const clusterMetrics = useClusterMetrics();
  const clusterMetricsRef = useRef(clusterMetrics);

  // Initialize voice timing profiling and engine warmup
  useEffect(() => {
    console.log("VITE_API_URL =", import.meta.env.VITE_API_URL);
    console.log("API_BASE =", getApiBase());
    jarvisTTS.setMountTime();
    jarvisTTS.recordTiming("Component mount");
    jarvisTTS.initVoice(() => {
      jarvisTTS.recordTiming("Voice initialization complete");
      setIsVoiceReady(true);
    });

    // Check if Python backend is available - retry 3x to avoid mount race condition
    const checkBackend = async (attempts = 3, delay = 400): Promise<void> => {
      await initEnv();
      fetch(`${getApiBase()}/status`)
        .then(res => res.json())
        .then(data => {
          if (data.ready === true) {
            setIsPythonBackendReady(true);
            console.log("[Jarvis] Python backend ready:", data.model);
          } else if (attempts > 1) {
            setTimeout(() => checkBackend(attempts - 1, delay), delay);
          }
        })
        .catch(() => {
          if (attempts > 1) setTimeout(() => checkBackend(attempts - 1, delay), delay);
          else console.log("[Jarvis] Python backend not reachable. Using local KB.");
        });
    };
    checkBackend();
  }, []);
  // â”€â”€ TTS Normalizer â€” converts written text to phonetically smooth speech â”€â”€â”€â”€â”€â”€
  function toSpokenText(raw: string): string {
    return raw
      .replace(/HEET[Â·â€¢\-]?OS/gi,        "Heet OS")
      .replace(/HEET[Â·â€¢\-]?AI/gi,        "Heet AI")
      .replace(/HEET\.AI/gi,             "Heet AI")
      .replace(/HEETÂ·OS/gi,              "Heet OS")
      .replace(/J\.A\.R\.V\.I\.S/gi,     "Jarvis")
      .replace(/JARVIS/g,                "Jarvis")
      .replace(/CryptoNexusAI/gi,        "Crypto Nexus AI")
      .replace(/CryptoNexus/gi,          "Crypto Nexus")
      .replace(/LearnWithH/gi,           "Learn With H")
      .replace(/Royal Stay/gi,           "Royal Stay")
      .replace(/DevOps/gi,               "Dev Ops")
      .replace(/TanStack/gi,             "Tan Stack")
      .replace(/TailwindCSS/gi,          "Tailwind CSS")
      .replace(/Framer Motion/gi,        "Framer Motion")
      .replace(/Next\.js/gi,             "Next JS")
      .replace(/Node\.js/gi,             "Node JS")

      .replace(/\bCI\/CD\b/gi,           "CI CD")
      .replace(/\bAWS\b/g,               "AWS")
      .replace(/\bVPC\b/g,               "V P C")
      .replace(/\bEC2\b/g,               "E C 2")
      .replace(/\bS3\b/g,                "S 3")
      .replace(/\bIAM\b/g,               "I A M")
      .replace(/\bK8s\b/gi,              "Kubernetes")
      .replace(/\bk8s\b/gi,              "Kubernetes")
      .replace(/\bDNS\b/g,               "D N S")
      .replace(/\bCPU\b/g,               "CPU")
      .replace(/\bMCA\b/g,               "M C A")
      .replace(/\bBCA\b/g,               "B C A")
      .replace(/\bMongoDB\b/gi,          "Mongo D B")
      .replace(/\bPostgreSQL\b/gi,       "Postgres SQL")
      .replace(/\bRedis\b/gi,            "Redis")
      .replace(/\bNginx\b/gi,            "Engine X")
      .replace(/\bRoute 53\b/gi,         "Route 53")
      .replace(/\bRoute53\b/gi,          "Route 53")
      .replace(/\bMulti-AZ\b/gi,         "multi availability zone")

      .replace(/https?:\/\//gi,          "")
      .replace(/iamheetchokshi@gmail\.com/gi, "iamheetchokshi at gmail dot com")
      .replace(/iamheet\.in/gi,          "iamheet dot in")
      .replace(/crypto-nexus\.in/gi,     "crypto nexus dot in")
      .replace(/royalstay\.me/gi,        "royalstay dot me")
      .replace(/github\.com\/iamheet/gi, "github dot com slash iamheet")
      .replace(/linkedin\.com\/in\/iamheetchokshi/gi, "linkedin dot com slash in slash iamheetchokshi")
      .replace(/github\.com/gi,          "github dot com")
      .replace(/linkedin\.com/gi,        "linkedin dot com")

      .replace(/â€”/g,   ", ")
      .replace(/â€“/g,   ", ")
      .replace(/Â·/g,   " ")
      .replace(/â€¢/g,   ", ")
      .replace(/\.\.\./g, "... ")
      .replace(/\//g,  " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  // â”€â”€ Stop speaking, processing, and streaming immediately â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const stopEverything = useCallback(() => {
    jarvisTTS.stop();
    pendingSpeechRef.current = null;
    setVoiceState("idle");
    setIsStreaming(false);
    window.dispatchEvent(new CustomEvent("jarvis-highlight", { detail: { id: "clear-all" } }));
  }, []);

  // â”€â”€ Speak function â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const speak = useCallback((text: string, customOnStart?: () => void, customOnEnd?: () => void) => {
    if (isMuted) {
      customOnStart?.();
      return;
    }

    if (!hasInteractedRef.current) {
      pendingSpeechRef.current = text;
      pendingOnStartRef.current = customOnStart || null;
      pendingOnEndRef.current = customOnEnd || null;
      return;
    }

    setVoiceState("speaking");
    jarvisTTS.speak(
      text,
      () => {
        setVoiceState("speaking");
        customOnStart?.();
      },
      () => {
        setVoiceState("idle");
        customOnEnd?.();
      },
      (err) => {
        console.error("[JarvisAssistant] TTS error:", err);
        setVoiceState("idle");
        customOnStart?.();
      }
    );
  }, [isMuted]);

  // â”€â”€ Add message helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addMessage = useCallback((sender: "jarvis" | "user", text: string) => {
    const msg: Message = { id: uid(), sender, text, timestamp: new Date() };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  // â”€â”€ Handle user query â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleUserQuery = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      stopEverything();
      setLiveTranscript("");
      setFollowUps([]);
      setVoiceState("processing");

      const userMsg = addMessage("user", trimmed);

      // Add a placeholder message for Jarvis that we will update iteratively
      const jarvisMsgId = uid();
      setMessages(prev => [...prev, { id: jarvisMsgId, sender: "jarvis", text: "", timestamp: new Date() }]);

      const currentRecruiter = recruiterStateRef.current;
      const context = conversationContextRef.current;
      const emotion = detectEmotion(trimmed);
      const lastTopic = lastTopicRef.current;

      const currentSim = simRef.current;
      const simData = {
        regionId: currentSim.regionId,
        regionName: currentSim.theme.label,
        flag: currentSim.theme.flag,
        status: currentSim.theme.statusLabel,
        cpu: currentSim.metrics.cpu,
        memory: currentSim.metrics.memory,
        latency: currentSim.metrics.latencyMs,
        requestsPerMin: currentSim.metrics.requestsPerMin,
        containers: currentSim.metrics.containers,
        probes: currentSim.metrics.probes,
        health: currentSim.metrics.infraHealth,
      };

      const currentLiveMetrics = clusterMetricsRef.current.data;

      let finalResponse = "";
      let result: EngineResult | null = null;

      const lower = trimmed.toLowerCase();
      const isTourCommand =
        lower.includes("tour") || lower.includes("next section") || lower.includes("skip tour") ||
        lower.includes("next step") || lower.includes("continue tour") || lower.includes("walk me through") ||
        lower.includes("guide me") || lower.includes("show me everything") || lower.includes("full tour") ||
        lower.includes("show me around") || lower.includes("explain the portfolio");
      const isNavCommand = (lower.includes("go to") || lower.includes("navigate") || lower.includes("take me") || lower.includes("switch to")) &&
        (lower.includes("page") || lower.includes("screen") || lower.includes("panel") || lower.includes("tab"));
      const isMetricQuery = /\b(cpu|memory|ram|latency|uptime|containers|pods|active region|active zone|disk|storage|network|bandwidth|health|status)\b/.test(lower);
      const useLocalEngine = isTourCommand || isNavCommand || isMetricQuery || currentRecruiter.isActive;

      if (isPythonBackendReady && !useLocalEngine) {
        try {
          setIsPythonStreaming(true);
          const response = await fetch(`${getApiBase()}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: trimmed })
          });
          if (!response.body) throw new Error("No response body");
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            finalResponse += chunk;
            setMessages(prev => prev.map(m => m.id === jarvisMsgId ? { ...m, text: finalResponse } : m));
            chatEndRef.current?.scrollIntoView({ behavior: "instant" });
          }
          setIsPythonStreaming(false);
          result = {
            response: finalResponse,
            followUps: ["Tell me more", "Explain details"],
            topic: "ai_chat",
            nextRecruiterState: currentRecruiter
          };
        } catch (err) {
          console.error("[Jarvis] Backend stream failed:", err);
          setIsPythonStreaming(false);
          result = await jarvisEngine(trimmed, context, currentRecruiter, emotion, lastTopic, simData, currentLiveMetrics);
          setMessages(prev => prev.map(m => m.id === jarvisMsgId ? { ...m, text: result!.response } : m));
        }
      } else {
        // Local engine: tour, nav, metrics, recruiter
        result = await jarvisEngine(trimmed, context, currentRecruiter, emotion, lastTopic, simData, currentLiveMetrics);
        setMessages(prev => prev.map(m => m.id === jarvisMsgId ? { ...m, text: result!.response } : m));
      }
      if (result) {
        conversationContextRef.current.push({ role: "user", content: trimmed });
        conversationContextRef.current.push({ role: "assistant", content: result.response });
        if (conversationContextRef.current.length > 10) conversationContextRef.current.shift();
        lastTopicRef.current = result.topic;
        recruiterStateRef.current = result.nextRecruiterState;
        setRecruiterState(result.nextRecruiterState);
        setFollowUps(result.followUps);
        if (result.topic !== "ai_chat") setIsStreaming(true);

        const runPipeline = async () => {
          if (result.navScreen && onScreenChange) {
            const currentScreen = (window as any).__jarvisCurrentScreen || "mission";
            const isSameScreen = result.navScreen === currentScreen;
            onScreenChange(result.navScreen);
            (window as any).__jarvisCurrentScreen = result.navScreen;
            if (!isSameScreen) {
              window.scrollTo({ top: 0, behavior: "instant" });
              await new Promise(r => setTimeout(r, 400));
            }
          }
          if (result.scrollTo) {
            const el = document.getElementById(result.scrollTo);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            window.dispatchEvent(new CustomEvent("jarvis-highlight", { detail: { id: result.scrollTo } }));
          }
          if (result.topic.startsWith("tour_step_")) {
            const stepNum = parseInt(result.topic.replace("tour_step_", ""), 10);
            const newTourState = { isActive: true, step: stepNum };
            tourStateRef.current = newTourState;
            setTourState(newTourState);
            speak(result.response, undefined, () => {
              window.dispatchEvent(new CustomEvent("jarvis-highlight", { detail: { id: "clear-all" } }));
              const nextStep = stepNum + 1;
              if (nextStep < PORTFOLIO_TOUR.length) {
                setTimeout(() => handleUserQuery("next section"), 800);
              } else {
                setTimeout(() => {
                  setTourState({ isActive: false, step: 0 });
                  tourStateRef.current = { isActive: false, step: 0 };
                  setTimeout(() => setIsOpen(false), 1500);
                }, 800);
              }
            });
          } else if (result.topic === "tour_end") {
            tourStateRef.current = { isActive: false, step: 0 };
            setTourState({ isActive: false, step: 0 });
            speak(result.response, undefined, () => {
              window.dispatchEvent(new CustomEvent("jarvis-highlight", { detail: { id: "clear-all" } }));
              setTimeout(() => setIsOpen(false), 1500);
            });
          } else {
            speak(result.response, undefined, () => {
              if (result.scrollTo) {
                window.dispatchEvent(new CustomEvent("jarvis-highlight", { detail: { id: "clear-all" } }));
              }
            });
          }
        };
        runPipeline();
      }
    },
    [addMessage, speak, onScreenChange, stopEverything, isPythonBackendReady]
  );

  // â”€â”€ Handle Send from Text Input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSend = () => {
    if (!inputText.trim()) return;
    handleUserQuery(inputText);
    setInputText("");
  };

  // â”€â”€ Toggle microphone â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toggleListening = useCallback(async () => {
    if (isListeningRef.current) {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      isListeningRef.current = false;
      setVoiceState("idle");
      // Don't clear liveTranscript immediately so user can see what was caught
      setTimeout(() => setLiveTranscript(""), 2000);
    } else {
      stopEverything();
      
      transcriptGeneratedRef.current = false;
      audioChunksRef.current = [];

      // Start MediaRecorder (ElevenLabs Fallback)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          // Clean up tracks
          stream.getTracks().forEach(track => track.stop());

          // If browser SpeechRecognition successfully generated a transcript, we don't need ElevenLabs STT
          if (transcriptGeneratedRef.current) return;

          // Otherwise, fall back to ElevenLabs STT
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          if (audioBlob.size === 0) return;

          const sttKey = getEnv("ELEVENLABS_STT_KEY");
          if (!sttKey) {
            console.warn("[Jarvis STT] No ELEVENLABS_STT_KEY found, cannot process fallback speech.");
            return;
          }

          setVoiceState("thinking");
          try {
            const formData = new FormData();
            formData.append("file", audioBlob, "audio.webm");
            formData.append("model_id", "scribe_v1");

            const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
              method: "POST",
              headers: { "xi-api-key": sttKey },
              body: formData,
            });

            if (!res.ok) throw new Error("ElevenLabs STT API error");
            const data = await res.json();
            
            if (data.text && data.text.trim()) {
              handleUserQuery(data.text.trim());
            } else {
              setVoiceState("idle");
            }
          } catch (err) {
            console.error("[Jarvis STT] Fallback failed:", err);
            setVoiceState("idle");
          }
        };

        mediaRecorder.start();
      } catch (err) {
        console.warn("[Jarvis STT] MediaRecorder init failed:", err);
      }

      // Start Browser SpeechRecognition (Primary)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Ignored if already listening
        }
      }

      isListeningRef.current = true;
      setVoiceState("listening");
      setLiveTranscript("");
    }
  }, [stopEverything, handleUserQuery]);

  // â”€â”€ Stop speaking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const stopSpeaking = useCallback(() => {
    jarvisTTS.stop();
    setVoiceState("idle");
    window.dispatchEvent(new CustomEvent("jarvis-highlight", { detail: { id: "clear-all" } }));
  }, []);

  // ——— Toggle mute —————————————————————————————————————————————————————————————
  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      if (!m) jarvisTTS.stop();
      return !m;
    });
  }, []);

  // ——— Handle first user gesture to unlock autoplay speech ——————————————————————
  useEffect(() => {
    if (hasInteractedRef.current) return;

    const handleFirstInteraction = () => {
      hasInteractedRef.current = true;
      if (pendingSpeechRef.current) {
        speak(
          pendingSpeechRef.current,
          pendingOnStartRef.current || undefined,
          pendingOnEndRef.current || undefined
        );
        pendingSpeechRef.current = null;
        pendingOnStartRef.current = null;
        pendingOnEndRef.current = null;
      }
      window.removeEventListener("click", handleFirstInteraction, true);
      window.removeEventListener("keydown", handleFirstInteraction, true);
      window.removeEventListener("touchstart", handleFirstInteraction, true);
    };
    window.addEventListener("click", handleFirstInteraction, true);
    window.addEventListener("keydown", handleFirstInteraction, true);
    window.addEventListener("touchstart", handleFirstInteraction, true);
    return () => {
      window.removeEventListener("click", handleFirstInteraction, true);
      window.removeEventListener("keydown", handleFirstInteraction, true);
      window.removeEventListener("touchstart", handleFirstInteraction, true);
    };
  }, [speak]);

  // â”€â”€ Sync refs and simulation triggers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    simRef.current = sim;
  }, [sim]);

  useEffect(() => {
    clusterMetricsRef.current = clusterMetrics;
  }, [clusterMetrics]);

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  useEffect(() => {
    recruiterStateRef.current = recruiterState;
  }, [recruiterState]);

  useEffect(() => {
    tourStateRef.current = tourState;
  }, [tourState]);

  useEffect(() => {
    if (tourState.isActive) setIsOpen(true);
  }, [tourState.isActive]);

  useEffect(() => {
    if (externalOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      onExternalOpenHandled?.();
    }
  }, [externalOpen, onExternalOpenHandled]);

  // â”€â”€ Initialize speech APIs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setLiveTranscript(interim || final);
      if (final) {
        setLiveTranscript("");
        transcriptGeneratedRef.current = true;
        handleUserQuery(final.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn("Speech recognition error:", event.error);
      setVoiceState("idle");
      isListeningRef.current = false;
      setLiveTranscript("");
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      if (voiceStateRef.current === "listening") {
        setVoiceState("idle");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [handleUserQuery]);

  // ── Auto-scroll to bottom ──────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Welcome message on boot ────────────────────────────────────────────────
  useEffect(() => {
    if (booted && voiceReadyEffective) {
      setIsOpen(true);

      const welcomeText = jarvisTTS.getCurrentGreetingText();
      jarvisTTS.recordTiming("Greeting trigger");

      const triggerGreeting = () => {
        let messageStarted = false;

        const startMessageRun = () => {
          if (messageStarted) return;
          messageStarted = true;

          const welcome: Message = {
            id: uid(),
            sender: "jarvis",
            text: welcomeText,
            timestamp: new Date(),
          };
          setMessages([welcome]);
          setIsStreaming(true);
        };

        const safetyTimeout = setTimeout(() => {
          startMessageRun();
        }, 3000);

        speak(
          welcomeText,
          () => {
            clearTimeout(safetyTimeout);
            startMessageRun();
          },
          () => {
            setTimeout(() => {
              jarvisTTS.printTimingTable();
            }, 1000);
            setTimeout(() => {
              speak(
                "Hey recruiter! Would you like me to take you on a complete guided tour of this portfolio?",
                undefined,
                () => setTimeout(() => setShowTourOffer(true), 300)
              );
            }, 200);
          }
        );
      };

      const openDelay = setTimeout(triggerGreeting, 500);
      return () => {
        clearTimeout(openDelay);
      };
    }
  }, [booted, voiceReadyEffective, speak]);

  // ── Focus input when panel opens ──────────────────────────────────────────
  useEffect(() => {
    if (isOpen && !isMinimized) {
      if (window.innerWidth > 768) {
        setTimeout(() => inputRef.current?.focus(), 300);
      }
    }
  }, [isOpen, isMinimized]);

  return (
    <>
      {/* â”€â”€ Floating Orb Button (always visible when closed) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        id="jarvis-float-btn"
        className="fixed bottom-24 right-6 z-[100]"
        style={{ filter: "drop-shadow(0 0 20px var(--rp))" }}
      >
        <AnimatePresence>
          {!isOpen && voiceReadyEffective && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <motion.div
                className="absolute right-full mr-3 top-1/2 -translate-y-1/2 pointer-events-none"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                <div className="glass rounded-md border r-border px-3 py-1.5 whitespace-nowrap hidden md:block">
                  <span className="font-mono text-[9px] uppercase tracking-widest r-text font-bold">JARVIS ONLINE</span>
                </div>
              </motion.div>

              <JarvisOrb
                state={voiceState}
                onClick={() => setIsOpen(true)}
                size={56}
              />

              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-success border-2 border-background animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ––– Main Chat Panel ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="jarvis-panel"
            initial={{ opacity: 0, scale: 0.9, y: 30, x: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20, x: 10 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="fixed bottom-6 right-6 z-[100] font-mono"
            style={{ width: "min(420px, calc(100vw - 1.5rem))" }}
          >
            <div
              className="rounded-xl overflow-hidden border shadow-2xl flex flex-col"
              style={{
                background: "linear-gradient(160deg, oklch(0.10 0.03 260 / 0.97), oklch(0.07 0.02 260 / 0.99))",
                borderColor: "color-mix(in oklch, var(--rp) 35%, transparent)",
                boxShadow: "0 0 40px color-mix(in oklch, var(--rp) 15%, transparent), 0 25px 60px oklch(0.04 0.02 260 / 0.9)",
                backdropFilter: "blur(16px)",
                maxHeight: isMinimized ? "60px" : "min(85vh, 600px)",
                transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {/* HUD Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-0">
                <div className="absolute inset-0 hudo-grid opacity-[0.04]" />
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[var(--rp)]/5 to-transparent" />
              </div>

              {/* Header */}
              <div
                className="relative z-10 flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: "color-mix(in oklch, var(--rp) 20%, transparent)", background: "oklch(0.08 0.025 260 / 0.8)" }}
              >
                <div className="flex items-center gap-3">
                  <JarvisOrb state={voiceState} onClick={toggleListening} size={40} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] r-text r-text-glow">
                        J.A.R.V.I.S
                      </span>
                      <AnimatedStatusBadge state={voiceState} />
                    </div>
                    <div className="text-[8px] text-muted-foreground/50 uppercase tracking-widest mt-0.5">
                      {voiceState === "listening"
                        ? "// INCOMING TRANSLATION"
                        : voiceState === "speaking"
                          ? "// TRANSMITTING VOICE"
                          : voiceState === "processing"
                            ? "// SCANNING KNOWLEDGE MATRIX"
                            : "// HEETÂ·OS CORE INTERFACE"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    id="jarvis-mute-btn"
                    onClick={toggleMute}
                    title={isMuted ? "Unmute" : "Mute"}
                    className="p-1.5 rounded hover:bg-white/5 transition-colors text-muted-foreground/60 hover:text-foreground"
                  >
                    {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </button>
                  <button
                    id="jarvis-minimize-btn"
                    onClick={() => setIsMinimized((m) => !m)}
                    title={isMinimized ? "Expand" : "Minimize"}
                    className="p-1.5 rounded hover:bg-white/5 transition-colors text-muted-foreground/60 hover:text-foreground"
                  >
                    <ChevronDown
                      size={13}
                      style={{ transform: isMinimized ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}
                    />
                  </button>
                  <button
                    id="jarvis-close-btn"
                    onClick={() => {
                      jarvisTTS.stop();
                      setIsOpen(false);
                      setVoiceState("idle");
                      window.dispatchEvent(new CustomEvent("jarvis-highlight", { detail: { id: "clear-all" } }));
                    }}
                    title="Close"
                    className="p-1.5 rounded hover:bg-white/5 transition-colors text-muted-foreground/60 hover:text-destructive"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Body */}
              {!isMinimized && (
                <div className="relative z-10 flex flex-col flex-1 overflow-hidden" style={{ minHeight: 0 }}>

                  {/* Live Cluster Metrics Widget */}
                  <LiveMetricsWidget metrics={clusterMetrics} />

                  {/* Voice State Banner */}
                  <AnimatePresence>
                    {voiceState !== "idle" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-b overflow-hidden"
                        style={{ borderColor: "color-mix(in oklch, var(--rp) 20%, transparent)", background: "color-mix(in oklch, var(--rp) 5%, transparent)" }}
                      >
                        <div className="flex items-center justify-between px-4 py-2">
                          <div className="flex items-center gap-2">
                            <VoiceWaveEnhanced
                              active={voiceState === "listening" || voiceState === "speaking" || voiceState === "processing"}
                              voiceState={voiceState}
                              color={
                                voiceState === "listening"
                                  ? "oklch(0.65 0.24 25)"
                                  : voiceState === "speaking"
                                    ? "oklch(0.75 0.18 155)"
                                    : "var(--rp)"
                              }
                            />
                            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60">
                              {voiceState === "listening"
                                ? "Microphone active..."
                                : voiceState === "speaking"
                                  ? "JARVIS speaking..."
                                  : "Scanning matrix..."}
                            </span>
                          </div>
                          {voiceState === "speaking" && (
                            <button
                              onClick={stopSpeaking}
                              className="text-[8px] uppercase tracking-wider px-2 py-0.5 rounded border border-border/40 text-muted-foreground/50 hover:text-foreground hover:border-border/80 transition-all"
                            >
                              STOP
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
                    {messages.map((msg, index) => {
                      const isLatestJarvis = msg.sender === "jarvis" && index === messages.length - 1;
                      const isUser = msg.sender === "user";

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          {!isUser && (
                            <div className="w-5 h-5 rounded-full flex-shrink-0 mt-1 flex items-center justify-center border r-border r-bg">
                              <div className="w-2 h-2 rounded-full r-led" />
                            </div>
                          )}

                          <div className="group relative max-w-[82%]">
                            <div
                              className="rounded-xl px-3 py-2 text-[11px] leading-relaxed relative break-words"
                              style={
                                isUser
                                  ? {
                                      background: "color-mix(in oklch, var(--rp) 15%, transparent)",
                                      border: "1px solid color-mix(in oklch, var(--rp) 30%, transparent)",
                                      color: "oklch(0.95 0.01 240)",
                                    }
                                  : {
                                      background: "oklch(0.11 0.02 260 / 0.8)",
                                      border: "1px solid oklch(0.27 0.03 260 / 30%)",
                                      color: "oklch(0.9 0.01 240)",
                                    }
                              }
                            >
                              {!isUser && (
                                <div className="text-[7px] r-text opacity-70 uppercase tracking-[0.25em] mb-1 font-bold">
                                  JARVIS
                                </div>
                              )}
                              {isLatestJarvis && (isStreaming || isPythonStreaming) ? (
                                isPythonStreaming ? (
                                  <span>{msg.text}</span>
                                ) : (
                                  <StreamingText
                                    text={msg.text}
                                    onComplete={() => setIsStreaming(false)}
                                    onCharacterTyped={() => {
                                      chatEndRef.current?.scrollIntoView({ behavior: "instant" });
                                    }}
                                  />
                                )
                              ) : (
                                <span>{msg.text}</span>
                              )}
                            </div>
                            <div
                              className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[7px] text-muted-foreground/40 px-2 whitespace-nowrap"
                              style={{ right: isUser ? "105%" : "auto", left: isUser ? "auto" : "105%" }}
                            >
                              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {voiceState === "processing" && messages[messages.length - 1]?.sender !== "jarvis" && (
                      <div className="flex justify-start items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full flex-shrink-0 mt-1 flex items-center justify-center border r-border r-bg">
                          <div className="w-2 h-2 rounded-full r-led" />
                        </div>
                        <div
                          className="rounded-xl px-3 py-2 flex items-center gap-2"
                          style={{
                            background: "oklch(0.11 0.02 260 / 0.8)",
                            border: "1px solid oklch(0.27 0.03 260 / 30%)",
                          }}
                        >
                          <span className="text-[7px] r-text opacity-70 uppercase tracking-widest font-bold">JARVIS</span>
                          <div className="flex items-end gap-0.5 h-3">
                            {[1, 2, 3].map((b) => (
                              <span
                                key={b}
                                className="w-1 h-1 r-led rounded-full jarvis-think-dot"
                                style={{ animationDelay: `${b * 0.15}s` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Tour Offer */}
                  <AnimatePresence>
                    {showTourOffer && !tourState.isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="px-4 py-3 border-t"
                        style={{ borderColor: "color-mix(in oklch, var(--rp) 15%, transparent)", background: "color-mix(in oklch, var(--rp) 4%, transparent)" }}
                      >
                        <p className="font-mono text-[10px] text-foreground/80 mb-2.5 leading-relaxed">
                          Would you like a <span className="r-text font-bold">full guided tour</span> of this portfolio?
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setShowTourOffer(false); setIsMinimized(true); handleUserQuery("give me a full tour"); }}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-200"
                            style={{ background: "color-mix(in oklch, var(--rp) 20%, transparent)", border: "1px solid color-mix(in oklch, var(--rp) 50%, transparent)", color: "var(--rp)" }}
                          >
                            ✓ Yes, show me
                          </button>
                          <button
                            onClick={() => { setShowTourOffer(false); setFollowUps(["Who is Heet?", "Show me the projects", "Why hire Heet?"]); }}
                            className="px-4 py-1.5 rounded font-mono text-[10px] uppercase tracking-wider transition-all duration-200 text-muted-foreground/50 hover:text-foreground/80"
                            style={{ border: "1px solid oklch(0.27 0.03 260 / 40%)" }}
                          >
                            No thanks
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Dynamic Follow-up Suggestions */}
                  <AnimatePresence>
                    {followUps.length > 0 && !isStreaming && voiceState === "idle" && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="px-4 py-2 flex flex-wrap gap-1.5"
                      >
                        {followUps.map((chipText) => (
                          <button
                            key={chipText}
                            onClick={() => {
                              handleUserQuery(chipText);
                              setFollowUps([]);
                            }}
                            className="text-[9px] px-2.5 py-1 rounded-full border transition-all duration-200"
                            style={{
                              borderColor: "color-mix(in oklch, var(--rp) 30%, transparent)",
                              background: "color-mix(in oklch, var(--rp) 5%, transparent)",
                              color: "var(--rp)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "color-mix(in oklch, var(--rp) 15%, transparent)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "color-mix(in oklch, var(--rp) 5%, transparent)";
                            }}
                          >
                            {chipText}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Live Transcription Bubble */}
                  <AnimatePresence>
                    {voiceState === "listening" && liveTranscript && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        className="px-4 py-1.5 flex justify-center pointer-events-none"
                      >
                        <div className="glass rounded-lg border border-white/10 px-3 py-1 max-w-[90%] shadow-lg">
                          <p className="text-[9px] text-foreground font-mono leading-tight italic truncate">
                            "{liveTranscript}"
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Unified Input Footer */}
                  <div
                    className="border-t px-3 py-2.5 flex items-center gap-2"
                    style={{ borderColor: "color-mix(in oklch, var(--rp) 15%, transparent)", background: "oklch(0.07 0.02 260 / 0.8)" }}
                  >
                    <button
                      id="jarvis-mic-btn"
                      onClick={toggleListening}
                      disabled={!isSpeechSupported || voiceState === "processing"}
                      className="relative flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 focus:outline-none disabled:opacity-40 disabled:pointer-events-none flex-shrink-0"
                      style={{
                        background:
                          voiceState === "listening"
                            ? "color-mix(in oklch, oklch(0.65 0.24 25) 20%, transparent)"
                            : "color-mix(in oklch, var(--rp) 10%, transparent)",
                        borderColor:
                          voiceState === "listening"
                            ? "oklch(0.65 0.24 25)"
                            : "color-mix(in oklch, var(--rp) 30%, transparent)",
                        boxShadow:
                          voiceState === "listening"
                            ? "0 0 12px oklch(0.65 0.24 25 / 0.4)"
                            : "0 0 8px color-mix(in oklch, var(--rp) 15%, transparent)",
                      }}
                      title={voiceState === "listening" ? "Stop listening" : "Start voice input"}
                    >
                      {voiceState === "listening" ? (
                        <MicOff size={13} style={{ color: "oklch(0.65 0.24 25)" }} />
                      ) : (
                        <Mic size={13} style={{ color: "var(--rp)" }} />
                      )}

                      {voiceState === "listening" && (
                        <motion.span
                          className="absolute inset-0 rounded-full border"
                          style={{ borderColor: "oklch(0.65 0.24 25 / 0.5)" }}
                          animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        />
                      )}
                    </button>

                    <input
                      type="text"
                      ref={inputRef}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value.slice(0, 150))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={
                        !isSpeechSupported
                          ? "Type a query..."
                          : voiceState === "listening"
                            ? "Listening to voice input..."
                            : "Ask Jarvis or type query..."
                      }
                      className="flex-1 bg-white/5 border rounded px-3 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-[var(--rp)]/60 placeholder:text-muted-foreground/30 font-mono transition-colors min-w-0"
                      style={{
                        borderColor: "oklch(0.27 0.03 260 / 40%)",
                      }}
                      disabled={voiceState === "listening" || voiceState === "processing"}
                    />

                    <button
                      onClick={handleSend}
                      disabled={!inputText.trim() || voiceState === "listening" || voiceState === "processing"}
                      className="p-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--rp)]/30 text-muted-foreground disabled:opacity-40 transition-all flex items-center justify-center flex-shrink-0"
                      title="Send query"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3.5 h-3.5"
                        style={{ color: inputText.trim() ? "var(--rp)" : "inherit" }}
                      >
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
