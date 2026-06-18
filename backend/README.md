# Jarvis Mission Control Backend (Python)

This is the high-performance Python backend for Jarvis, enabling dynamic AI conversations using local LLMs.

## Prerequisites
- Python 3.9+
- [Llama-cpp-python](https://github.com/abetlen/llama-cpp-python) (installed via requirements.txt)

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Download a Model**:
   Place a GGUF model (e.g., [Llama-3.2-1B-Instruct-GGUF](https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF)) in the `models/` directory.
   Rename it to `model.gguf` or update the `.env` file.

3. **Run the Server**:
   ```bash
   python main.py
   ```
   The backend will start on `http://localhost:8000`.

## "No Lag" Implementation
- **Streaming Tokens**: Tokens are streamed via Server-Sent Events (SSE) directly to the React frontend.
- **Local Inference**: Running the model locally avoids round-trip delays to external APIs.
- **FastAPI**: Asynchronous processing ensures the server can handle multiple requests efficiently.

## Configuration (.env)
```env
MODEL_PATH=models/model.gguf
USE_GPU=false
```
