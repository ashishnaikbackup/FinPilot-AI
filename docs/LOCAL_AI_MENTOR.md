# Optional local AI Mentor (Ollama)

FinPilot's public GitHub Pages site is static and does not host a generative AI model. The AI Mentor can optionally connect from your browser to a small Ollama model running on the **same computer**. This avoids a paid API key and keeps prompts on that computer.

## Requirements

- A computer that can run Ollama and Python 3.11+.
- Node.js 22+ only if running the frontend locally.
- Enough RAM/storage for the selected model. The example below downloads several GB; choose a smaller compatible model if your device is limited.

## Setup

1. Install Ollama from https://ollama.com/.
2. Open a terminal and download the configured model:

   ~~~bash
   ollama pull llama3.2:3b
   ~~~

3. Start the Ollama service. The default local service is http://127.0.0.1:11434.
4. In a second terminal, start FinPilot's API:

   ~~~bash
   cd FinPilot-AI/backend
   python -m venv .venv
   # Windows: .venv\Scripts\activate
   # macOS/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --host 127.0.0.1 --port 8000
   ~~~

5. In a third terminal, run the frontend locally:\n\n   ~~~bash\n   cd FinPilot-AI/frontend\n   npm install\n   npm run dev\n   ~~~\n\n6. Open http://localhost:5173 and visit **AI Mentor**. The connection indicator checks http://127.0.0.1:8000/api/mentor/status.

For local AI chat, run the frontend locally at http://localhost:5173. The API CORS allowlist intentionally permits only that local development origin by default. If you use a different local frontend origin, set FRONTEND_ORIGINS in backend/.env to that exact trusted origin. Keep the API bound to 127.0.0.1; do not expose it to the public internet. The public GitHub Pages site remains a static dashboard and does not itself host or proxy the model.

## Privacy and limitations

- Prompts go from your browser to the local FinPilot API and then to Ollama on the same computer. They are not sent to OpenAI or another hosted model provider by this feature.
- Chat history exists only in the current page session and is not saved to FinPilot.
- The model has no live market-data or news connection. It cannot verify current prices, vacancies, tax rates, regulations or official announcements.
- Model responses can be wrong or outdated. Check important claims against official sources.
- The system prompt asks the model to avoid guaranteed returns, personalised buy/sell orders, leverage, credential collection and trade execution. This is a safety layer, not a guarantee.
- Do not enter account numbers, passwords, OTPs, private keys, identity documents or confidential records.
- No broker or exchange integration is present. The mentor cannot place orders.

## API

- GET /api/mentor/status — reports whether Ollama and the configured model are available.
- POST /api/mentor/chat — accepts a short sequence of user/assistant messages and returns one model response.

Configuration lives in backend/.env.example:

- OLLAMA_BASE_URL=http://127.0.0.1:11434
- OLLAMA_MODEL=llama3.2:3b
- FRONTEND_ORIGINS=http://localhost:5173

For safety, FinPilot refuses non-loopback Ollama URLs. This feature is optional; the rest of the public dashboard works without it.
