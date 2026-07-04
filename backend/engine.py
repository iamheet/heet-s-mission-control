from dotenv import load_dotenv
import os
import itertools
import threading

try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    print("[!] ollama package not found. Run: pip install ollama")
    OLLAMA_AVAILABLE = False

try:
    from google import genai
    from google.genai import types as genai_types
    GEMINI_AVAILABLE = True
except ImportError:
    try:
        # Fallback: old package still installed
        import google.generativeai as genai_legacy
        GEMINI_AVAILABLE = False  # We won't use the old API
        print("[!] Only old google-generativeai found. Run: pip install google-genai>=1.0.0")
    except ImportError:
        pass
    GEMINI_AVAILABLE = False
    print("[!] google-genai not found. Run: pip install google-genai>=1.0.0")

load_dotenv()

# --- Configurable Ollama Host ---
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://host.docker.internal:11434")

if OLLAMA_AVAILABLE:
    try:
        ollama_client = ollama.Client(host=OLLAMA_HOST)
        print(f"[+] Ollama client initialized with host: {OLLAMA_HOST}")
    except Exception as e:
        print(f"[!] Failed to initialize Ollama client: {e}")
        OLLAMA_AVAILABLE = False
else:
    ollama_client = None

MODEL_FAST   = os.getenv("OLLAMA_MODEL_FAST",  "llama3.2:3b")
MODEL_SMART  = os.getenv("OLLAMA_MODEL_SMART", "llama3.2:3b")
MODEL_TECH   = os.getenv("OLLAMA_MODEL_TECH",  "llama3.2:3b")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_KEYS  = [k for k in [
    os.getenv("GEMINI_API_KEY_1"),
    os.getenv("GEMINI_API_KEY_2"),
] if k and k.strip() not in ("", "your_gemini_api_key_here")]

MAX_INPUT_CHARS  = 500
MAX_TOKENS_SHORT = 200
MAX_TOKENS_LONG  = 400

# --- Routing strategy ----------------------------------------------------------
# PRIMARY  -> Gemini 2.5 Flash (all query types: greetings, recruiter, projects, devops, navigation)
# FALLBACK -> Ollama llama3.2:3b (if Gemini fails, quota exhausted, or timeout)
# classify_query() is retained for logging/analytics but does NOT drive model selection.

COMPLEX_KEYWORDS = [
    "explain", "detail", "how does", "compare", "difference",
    "architecture", "describe", "elaborate", "in depth", "tell me more",
    "walk me through", "how did", "analysis", "evaluate", "qualification",
]

TECH_KEYWORDS = [
    "devops", "kubernetes", "k8s", "docker", "cloud", "aws", "gcp", "azure",
    "terraform", "ansible", "cicd", "ci/cd", "pipeline", "nginx", "prometheus",
    "grafana", "container", "pod", "cluster", "deployment", "infrastructure",
    "telemetry", "metric", "scaling", "routing", "domain", "dns", "vpc", "ec2",
    "s3", "iam", "database", "postgres", "postgresql", "mongodb", "redis", "mysql",
    "linux", "server", "microservice", "orchestration", "ingress"
]

MEDIUM_KEYWORDS = [
    "who", "what", "where", "when", "skills", "project", "experience",
    "background", "resume", "work", "tech", "stack", "contact", "hire",
]

SYSTEM_PROMPT = """You are JARVIS, the AI assistant embedded in Heet Chokshi's DevOps portfolio at iamheet.in.

ABOUT HEET CHOKSHI:
- Software & DevOps Engineer with professional experience at Softedge Infotech
- Based in Ahmedabad, Gujarat, India
- Available for new opportunities

TECHNICAL SKILLS:
- Cloud: AWS (EC2, VPC, S3, IAM, Route53), Azure
- DevOps: Docker, Kubernetes, GitHub Actions, Nginx, Linux Administration
- Monitoring: Prometheus, Grafana
- Backend: Node.js, Python, FastAPI
- Frontend: React, Next.js, TanStack
- Databases: MongoDB, PostgreSQL, MySQL, Supabase, Redis
- AI/ML: OpenAI APIs, LLM integration

PROJECTS:
1. Mission OS (iamheet.in) - This portfolio. Interactive DevOps Mission Control built with React/TanStack, Docker, deployed on AWS EC2.
2. CryptoNexusAI (crypto-nexus.in) - AI cryptocurrency analytics with OpenAI integration, Next.js, Docker, AWS EC2.
3. Royal Stay (royalstay.me) - Hotel booking platform, React, Node.js, MongoDB, hosted on Azure.
4. LearnWithH - Financial blogging platform, React, Supabase.

INSTRUCTIONS:
- You are concise, technical, and professional like a real AI assistant
- Answer recruiter questions about Heet's skills, experience, and projects
- Keep responses under 3 sentences unless more detail is explicitly needed
- Never make up information not listed above
- Speak in first person as JARVIS ("I can confirm...", "Accessing records...")
"""


def classify_query(user_input: str) -> str:
    """
    Returns 'short', 'medium', 'tech', or 'complex'.
    short   -> Ollama fast (greeting, one-liners)
    medium  -> Ollama smart (general info queries)
    tech    -> Ollama tech (DevOps / Kubernetes / Cloud operations)
    complex -> Gemini (deep explanations, comparisons)
    """
    lower = user_input.lower().strip()
    length = len(lower)

    if any(kw in lower for kw in COMPLEX_KEYWORDS) or length > 120:
        return "complex"
    if any(kw in lower for kw in TECH_KEYWORDS):
        return "tech"
    if any(kw in lower for kw in MEDIUM_KEYWORDS) or length > 40:
        return "medium"
    return "short"


def sanitize_input(user_input: str) -> str:
    return user_input.strip()[:MAX_INPUT_CHARS]


class JarvisEngine:
    def __init__(self):
        self.ollama_ready   = False
        self.gemini_clients = []  # list of (api_key, client) tuples
        self._gemini_robin  = None
        self._lock          = threading.Lock()

        self._check_ollama()
        self._init_gemini()
        self._print_routing_table()

    def _check_ollama(self):
        """Check if the unified Ollama fallback model (llama3.2:3b) is available."""
        if not OLLAMA_AVAILABLE or ollama_client is None:
            print("[!] Ollama client not available (fallback disabled).")
            return

        print(f"[+] Ollama host configured: {OLLAMA_HOST}")
        try:
            models_response = ollama_client.list()
            names = [m.model for m in models_response.models]
            fallback_model = MODEL_SMART  # unified fallback: llama3.2:3b
            if any(fallback_model in n for n in names):
                print(f"[+] Ollama fallback model ready: {fallback_model}")
                self.ollama_ready = True
            else:
                print(f"[!] Ollama fallback model not found: {fallback_model} - run: ollama pull {fallback_model}")
        except Exception as e:
            print(f"[!] Ollama not running or host unreachable at {OLLAMA_HOST}: {e}")

    def _init_gemini(self):
        if not GEMINI_AVAILABLE:
            print("[!] Gemini package not installed. Run: pip install google-genai>=1.0.0")
            return
        if not GEMINI_KEYS:
            print("[!] Gemini disabled - GEMINI_API_KEY_1/2 not set in .env")
            return

        print(f"[*] Initializing Gemini ({GEMINI_MODEL}) with {len(GEMINI_KEYS)} key(s)...")
        for i, key in enumerate(GEMINI_KEYS):
            print(f"[*] Gemini key {i+1}: {key[:8]}...{key[-4:]} (len={len(key)})")
            try:
                client = genai.Client(api_key=key)
                # Quick validation ping
                resp = client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents="hi",
                    config=genai_types.GenerateContentConfig(max_output_tokens=5)
                )
                _ = resp.text  # raises if key/model invalid
                self.gemini_clients.append((key, client))
                print(f"[+] Gemini key {i+1} verified and ready: {GEMINI_MODEL}")
            except Exception as e:
                print(f"[!] Gemini key {i+1} FAILED validation: {e}")
                print(f"    -> This key will NOT be used for routing.")

        if self.gemini_clients:
            self._gemini_robin = itertools.cycle(range(len(self.gemini_clients)))
            print(f"[+] Gemini pool ready: {len(self.gemini_clients)} active key(s)")
        else:
            print("[!] No valid Gemini keys - all requests will use Ollama only")

    def _print_routing_table(self):
        gemini_ok = bool(self.gemini_clients)
        print("\n[JARVIS] --- Routing Table ---------------------------------")
        print(f"  PRIMARY  (all queries)           -> {'Gemini (' + GEMINI_MODEL + ')' if gemini_ok else 'Ollama fallback (Gemini unavailable)'}")
        print(f"  FALLBACK (Gemini fail/quota)      -> {'Ollama (' + MODEL_SMART + ')' if self.ollama_ready else 'NONE (Ollama also unavailable)'}")
        print(f"  Provider=Gemini | Fallback=Ollama {MODEL_SMART}")
        print(f"  Gemini keys active: {len(self.gemini_clients)}")
        print(f"  Ollama host:        {OLLAMA_HOST}")
        print(f"  Ollama ready:       {self.ollama_ready}")
        print("------------------------------------------------------------\n")

    def _next_gemini_idx(self) -> int:
        with self._lock:
            return next(self._gemini_robin)

    def _stream_gemini(self, idx: int, user_input: str):
        key, client = self.gemini_clients[idx]
        print(f"[ROUTE] Provider=Gemini | Key={idx+1} | Model={GEMINI_MODEL} | Input={user_input[:50]!r}")
        stream = client.models.generate_content_stream(
            model=GEMINI_MODEL,
            contents=[
                genai_types.Content(role="user", parts=[genai_types.Part(text=user_input)])
            ],
            config=genai_types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                max_output_tokens=MAX_TOKENS_LONG,
                temperature=0.7,
            )
        )
        for chunk in stream:
            if chunk.text:
                yield chunk.text
        print(f"[ROUTE] Gemini key {idx+1} stream complete")

    def _stream_ollama(self, model: str, user_input: str, reason: str):
        if model == MODEL_TECH:
            max_tokens = MAX_TOKENS_LONG
        else:
            max_tokens = MAX_TOKENS_LONG if model == MODEL_SMART else MAX_TOKENS_SHORT
        print(f"[ROUTE] Provider=Ollama | Model={model} | Reason={reason} | Input={user_input[:50]!r}")
        stream = ollama_client.chat(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": user_input},
            ],
            stream=True,
            options={
                "num_ctx":     2048,
                "num_predict": max_tokens,
                "temperature": 0.7,
            }
        )
        for chunk in stream:
            token = chunk["message"]["content"]
            if token:
                yield token
        print(f"[ROUTE] Ollama {model} stream complete")

    def generate_stream(self, user_input: str):
        user_input = sanitize_input(user_input)
        if not user_input:
            yield "Please provide a valid query."
            return

        query_type = classify_query(user_input)
        print(f"[ROUTE] Query classified as: {query_type!r} | length={len(user_input)}")

        # === PRIMARY: Gemini for ALL query types ==============================
        if self.gemini_clients:
            idx = self._next_gemini_idx()
            try:
                print(f"[ROUTE] Provider=Gemini | Fallback=Ollama {MODEL_SMART} | QueryType={query_type}")
                yield from self._stream_gemini(idx, user_input)
                return
            except Exception as e:
                print(f"[ROUTE] Gemini failed: {e} — falling back to Ollama")

        # === FALLBACK: Ollama llama3.2:3b (unified) ===========================
        if self.ollama_ready:
            try:
                yield from self._stream_ollama(MODEL_SMART, user_input, "gemini-unavailable-ollama-fallback")
                return
            except Exception as e:
                print(f"[ROUTE] Ollama fallback also failed: {e}")

        yield "JARVIS is temporarily unavailable. Please try again shortly."


# Singleton
jarvis_engine = JarvisEngine()
