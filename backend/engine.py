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

MAX_INPUT_CHARS  = 500   # max user input length
MAX_TOKENS_SHORT = 150   # gemini short response cap
MAX_TOKENS_LONG  = 300   # ollama long response cap
OLLAMA_TIMEOUT   = 30    # seconds

COMPLEX_KEYWORDS = [
    "explain", "detail", "how does", "why", "compare", "difference",
    "architecture", "describe", "elaborate", "in depth", "tell me more",
    "walk me through", "what is the", "how did", "analysis", "evaluate",
    "project", "experience", "background", "qualification", "resume"
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


def is_complex_query(user_input: str) -> bool:
    lower = user_input.lower().strip()
    return len(lower) > 60 or any(kw in lower for kw in COMPLEX_KEYWORDS)


def sanitize_input(user_input: str) -> str:
    """Trim and cap input length to prevent unbounded consumption."""
    return user_input.strip()[:MAX_INPUT_CHARS]


class JarvisEngine:
    def __init__(self):
        self.ollama_ready    = False
        self.gemini_clients  = []
        self._gemini_robin   = None
        self._ollama_robin   = None
        self._lock           = threading.Lock()  # thread-safe rotation

        self._check_ollama()
        self._init_gemini()
        self._build_pools()

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
                else:
                    print(f"[!] Ollama model not found: {m} — run: ollama pull {m}")
            self.ollama_ready = True
        except Exception as e:
            print(f"[!] Ollama not running: {e}")

    def _init_gemini(self):
        if not GEMINI_AVAILABLE or not GEMINI_KEYS:
            print("[!] Gemini disabled — no valid keys found.")
            return
        for i, key in enumerate(GEMINI_KEYS):
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
                self.gemini_clients.append(client)
                print(f"[+] Gemini key {i+1} ready: {GEMINI_MODEL}")
            except Exception as e:
                print(f"[!] Gemini key {i+1} init error: {e}")

    def _build_pools(self):
        if self.gemini_clients:
            self._gemini_robin = itertools.cycle(range(len(self.gemini_clients)))
            names = [f"gemini-key{i+1}" for i in range(len(self.gemini_clients))]
            print(f"[+] Short query pool: {' → '.join(names)}")

        if self.ollama_ready and OLLAMA_AVAILABLE:
            self._ollama_robin = itertools.cycle([MODEL_FAST, MODEL_SMART])
            print(f"[+] Long query pool: ollama-fast → ollama-smart")

    def _next_gemini(self) -> int:
        with self._lock:
            return next(self._gemini_robin)

    def _next_ollama(self) -> str:
        with self._lock:
            return next(self._ollama_robin)

    def _stream_gemini(self, client_index: int, user_input: str):
        client = self.gemini_clients[client_index]
        print(f"[*] Gemini key {client_index+1} (short): {user_input[:60]}")
        response = client.generate_content(user_input, stream=True)
        for chunk in response:
            if chunk.text:
                yield chunk.text
        print(f"[+] Gemini key {client_index+1} complete")

    def _stream_ollama(self, model: str, user_input: str):
        max_tokens = MAX_TOKENS_LONG if is_complex_query(user_input) else MAX_TOKENS_SHORT
        print(f"[*] Ollama {model} (long): {user_input[:60]}")
        stream = ollama.chat(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": user_input},
            ],
            stream=True,
            options={
                "num_ctx":     1024,
                "num_predict": max_tokens,
                "temperature": 0.7,
            }
        )
        for chunk in stream:
            token = chunk["message"]["content"]
            if token:
                yield token
        print(f"[+] Ollama {model} complete")

    def _try_gemini_pool(self, user_input: str):
        for _ in range(len(self.gemini_clients)):
            idx = self._next_gemini()
            try:
                yield from self._stream_gemini(idx, user_input)
                return
            except Exception as e:
                print(f"[!] Gemini key {idx+1} failed: {e}")
        raise RuntimeError("All Gemini keys failed")

    def _try_ollama_pool(self, user_input: str):
        for _ in range(2):
            model = self._next_ollama()
            try:
                yield from self._stream_ollama(model, user_input)
                return
            except Exception as e:
                print(f"[!] Ollama {model} failed: {e}")
        raise RuntimeError("All Ollama models failed")

    def generate_stream(self, user_input: str):
        # Sanitize input before hitting any LLM
        user_input = sanitize_input(user_input)
        if not user_input:
            yield "Please provide a valid query."
            return

        complex_q = is_complex_query(user_input)

        if complex_q:
            print("[~] Complex query → Ollama pool")
            if self._ollama_robin:
                try:
                    yield from self._try_ollama_pool(user_input)
                    return
                except Exception as e:
                    print(f"[!] Ollama pool exhausted: {e} — falling back to Gemini")
            if self._gemini_robin:
                try:
                    yield from self._try_gemini_pool(user_input)
                    return
                except Exception as e:
                    print(f"[!] Gemini pool also exhausted: {e}")
        else:
            print("[~] Simple query → Gemini pool")
            if self._gemini_robin:
                try:
                    yield from self._try_gemini_pool(user_input)
                    return
                except Exception as e:
                    print(f"[!] Gemini pool exhausted: {e} — falling back to Ollama")
            if self._ollama_robin:
                try:
                    yield from self._try_ollama_pool(user_input)
                    return
                except Exception as e:
                    print(f"[!] Ollama pool also exhausted: {e}")

        yield "JARVIS is temporarily unavailable. Please try again shortly."


# Singleton
jarvis_engine = JarvisEngine()
