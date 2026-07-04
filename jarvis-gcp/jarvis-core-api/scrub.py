"""
Secret scrubbing — strip tokens, keys, and passwords from log lines BEFORE they
are ever stored, streamed to the dashboard, or emailed.

Used by the log tailer and the notifier. Deliberately conservative: it would
rather redact a harmless string than leak a credential.
"""
from __future__ import annotations

import re

_REDACTED = "«redacted»"

# Order matters — more specific patterns first.
_PATTERNS = [
    # key=value / key: value where the key looks sensitive
    re.compile(
        r"(?i)\b(password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|"
        r"authorization|auth|bearer|client[_-]?secret|private[_-]?key)\b"
        r"\s*[:=]\s*\"?([^\s\"'&]+)\"?"
    ),
    # Bearer tokens in headers
    re.compile(r"(?i)\bbearer\s+[A-Za-z0-9\-\._~\+\/]+=*"),
    # JWTs (three base64url segments)
    re.compile(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"),
    # AWS access key IDs
    re.compile(r"\b(AKIA|ASIA)[0-9A-Z]{16}\b"),
    # Generic long hex/base64 secrets (32+ chars)
    re.compile(r"\b[A-Za-z0-9+/]{40,}={0,2}\b"),
    # Google / Gemini style keys
    re.compile(r"\bAIza[0-9A-Za-z\-_]{20,}\b"),
    # OpenAI / Anthropic style
    re.compile(r"\b(sk|xoxb|ghp|gho|glpat)-[A-Za-z0-9\-_]{10,}\b"),
]


def scrub(text: str) -> str:
    """Return `text` with any credential-looking substrings redacted."""
    if not text:
        return text
    out = text
    # first pattern captures a key + value; keep the key, redact the value
    out = _PATTERNS[0].sub(lambda m: f"{m.group(1)}={_REDACTED}", out)
    for pat in _PATTERNS[1:]:
        out = pat.sub(_REDACTED, out)
    return out
