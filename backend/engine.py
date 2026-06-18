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
    import google.generativeai as genai
    from google.generativeai.types import GenerationConfig
    GEMINI_AVAILABLE = True
except ImportError:
    print("[!] google-generativeai not found. Run: pip install google-generativeai")
    GEMINI_AVAILABLE = False

load_dotenv()

MODEL_FAST   = os.getenv("OLLAMA_MODEL_FAST",  "llama3.2:1b")
MODEL_SMART  = os.getenv("OLLAMA_MODEL_SMART", "llama3.2:3b")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
GEMINI_KEYS  = [k for k in [
    os.getenv("GEMINI_API_KEY_1"),
    os.getenv("GEMINI_API_KEY_2"),
] if k and k.strip() not in ("", "your_gemini_api_key_here")]

MAX_INPUT_CHARS  = 500
MAX_TOKENS_SHORT = 200
MAX_TOKENS_LONG  = 400

# --- Routing thresholds --------------------------------------------------------
# SHORT  (<= 40 chars, no technical keywords) -> Ollama fast model (llama3.2:1b)
# MEDIUM (41-100 chars or light keywords)    -> Ollama smart model (llama3.2:3b)
# COMPLEX (>100 chars or deep keywords)      -> Gemini (advanced reasoning)

COMPLEX_KEYWORDS = [
    "explain", "detail", "how does", "compare", "difference",
    "architecture", "describe", "elaborate", "in depth", "tell me more",
    "walk me through", "how did", "analysis", "evaluate", "qualification",
]

MEDIUM_KEYWORDS = [
    "who", "what", "where", "when", "skills", "project", "experience",
    "background", "resume", "work", "tech", "stack", "devops", "aws",
    "docker", "kubernetes", "contact", "hire",
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
    Returns 'short', 'medium', or 'complex'.
    short   -> Ollama fast (greeting, one-liners)
    medium  -> Ollama smart (general info queries)
    complex -> Gemini (deep explanations, comparisons)
    """
    lower = user_input.lower().strip()
    length = len(lower)

    if any(kw in lower for kw in COMPLEX_KEYWORDS) or length > 100:
        return "complex"
    if any(kw in lower for kw in MEDIUM_KEYWORDS) or length > 40:
        return "medium"
    return "short"


def sanitize_input(user_input: str) -> str:
    return user_input.strip()[:MAX_INPUT_CHARS]


class JarvisEngine:
    def __init__(self):
        self.ollama_ready   = False
        self.gemini_clients = []
        self._gemini_robin  = None
        self._ollama_fast_ready  = False
        self._ollama_smart_ready = False
        self._lock          = threading.Lock()

        self._check_ollama()
        self._init_gemini()
        self._print_routing_table()

    def _check_ollama(self):
        if not OLLAMA_AVAILABLE:
            print("[!] Ollama not installed.")
            return
        try:
            models = ollama.list()
            names = [m.model for m in models.models]
            for m in [MODEL_FAST, MODEL_SMART]:
                if any(m in n for n in names):
                    print(f"[+] Ollama model ready: {m}")
                    if m == MODEL_FAST:
                        self._ollama_fast_ready = True
                    else:
                        self._ollama_smart_ready = True
                else:
                    print(f"[!] Ollama model not found: {m} - run: ollama pull {m}")
            self.ollama_ready = self._ollama_fast_ready or self._ollama_smart_ready
        except Exception as e:
            print(f"[!] Ollama not running: {e}")

    def _init_gemini(self):
        if not GEMINI_AVAILABLE:
            print("[!] Gemini package not installed.")
            return
        if not GEMINI_KEYS:
            print("[!] Gemini disabled - GEMINI_API_KEY_1/2 not set in .env")
            return

        print(f"[*] Initializing Gemini with {len(GEMINI_KEYS)} key(s)...")
        for i, key in enumerate(GEMINI_KEYS):
            print(f"[*] Gemini key {i+1}: {key[:8]}...{key[-4:]} (len={len(key)})")
            try:
                genai.configure(api_key=key)
                client = genai.GenerativeModel(
                    model_name=GEMINI_MODEL,
                    system_instruction=SYSTEM_PROMPT,
                    generation_config=GenerationConfig(
                        max_output_tokens=MAX_TOKENS_SHORT,
                        temperature=0.7,
                    ),
                )
                # Test the client with a minimal ping to verify key works
                test = client.generate_content("hi", stream=False)
                _ = test.text  # will raise if key is invalid
                self.gemini_clients.append(client)
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
        print("\n[JARVIS] --- Routing Table ---------------------------------")
        print(f"  short   (greetings, <=40 chars)  -> {'Ollama fast (' + MODEL_FAST + ')' if self._ollama_fast_ready else 'Gemini (Ollama fast unavailable)'}")
        print(f"  medium  (info queries, 41-100)   -> {'Ollama smart (' + MODEL_SMART + ')' if self._ollama_smart_ready else 'Gemini (Ollama smart unavailable)'}")
        print(f"  complex (deep analysis, >100)    -> {'Gemini' if self.gemini_clients else 'Ollama smart fallback'}")
        print(f"  Gemini keys active: {len(self.gemini_clients)}")
        print(f"  Ollama fast ready:  {self._ollama_fast_ready}")
        print(f"  Ollama smart ready: {self._ollama_smart_ready}")
        print("------------------------------------------------------------\n")

    def _next_gemini(self) -> int:
        with self._lock:
            return next(self._gemini_robin)

    def _stream_gemini(self, client_index: int, user_input: str):
        client = self.gemini_clients[client_index]
        print(f"[ROUTE] Provider=Gemini | Key={client_index+1} | Reason=short query | Input={user_input[:50]!r}")
        response = client.generate_content(user_input, stream=True)
        for chunk in response:
            if chunk.text:
                yield chunk.text
        print(f"[ROUTE] Gemini key {client_index+1} stream complete")

    def _stream_ollama(self, model: str, user_input: str, reason: str):
        max_tokens = MAX_TOKENS_LONG if model == MODEL_SMART else MAX_TOKENS_SHORT
        print(f"[ROUTE] Provider=Ollama | Model={model} | Reason={reason} | Input={user_input[:50]!r}")
        stream = ollama.chat(
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

        # --- SHORT: Ollama fast first, fallback Gemini -------------------------
        if query_type == "short":
            if self._ollama_fast_ready:
                try:
                    yield from self._stream_ollama(MODEL_FAST, user_input, "short-query")
                    return
                except Exception as e:
                    print(f"[ROUTE] Ollama fast failed: {e} - falling back to Gemini")

            if self.gemini_clients:
                idx = self._next_gemini()
                try:
                    yield from self._stream_gemini(idx, user_input)
                    return
                except Exception as e:
                    print(f"[ROUTE] Gemini fallback failed: {e}")

        # --- MEDIUM: Ollama smart first, fallback Gemini ------------------------
        elif query_type == "medium":
            if self._ollama_smart_ready:
                try:
                    yield from self._stream_ollama(MODEL_SMART, user_input, "medium-query")
                    return
                except Exception as e:
                    print(f"[ROUTE] Ollama smart failed: {e} - falling back to Gemini")

            if self.gemini_clients:
                idx = self._next_gemini()
                try:
                    yield from self._stream_gemini(idx, user_input)
                    return
                except Exception as e:
                    print(f"[ROUTE] Gemini fallback also failed: {e}")

        # --- COMPLEX: Gemini first, fallback Ollama smart, then Ollama fast ----
        else:
            if self.gemini_clients:
                idx = self._next_gemini()
                try:
                    yield from self._stream_gemini(idx, user_input)
                    return
                except Exception as e:
                    print(f"[ROUTE] Gemini failed: {e} - falling back to Ollama smart")

            if self._ollama_smart_ready:
                try:
                    yield from self._stream_ollama(MODEL_SMART, user_input, "gemini-unavailable-fallback")
                    return
                except Exception as e:
                    print(f"[ROUTE] Ollama smart failed: {e} - falling back to Ollama fast")

            if self._ollama_fast_ready:
                try:
                    yield from self._stream_ollama(MODEL_FAST, user_input, "smart-unavailable-fallback")
                    return
                except Exception as e:
                    print(f"[ROUTE] Ollama fast failed: {e}")

        yield "JARVIS is temporarily unavailable. Please try again shortly."


# Singleton
jarvis_engine = JarvisEngine()
