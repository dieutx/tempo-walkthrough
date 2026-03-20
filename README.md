# Tempo CLI Walkthrough

A practical walkthrough of setting up and using [Tempo](https://tempo.xyz) — a CLI for calling APIs with automatic micropayment handling via USDC.

## Setup

### Install Tempo CLI

```bash
curl -fsSL https://tempo.xyz/install | bash
```

> **Note:** Tempo v1.4.3+ requires glibc 2.38+. On Ubuntu 22.04 (glibc 2.35), use a Docker wrapper — see [docker-wrapper.sh](docker-wrapper.sh).

### Login

```bash
tempo wallet login
```

Authenticates via browser/passkey. Verify with:

```bash
tempo wallet -t whoami
```

### Install Extensions

```bash
tempo add wallet
```

## Usage

### Service Discovery

```bash
# Search for services
tempo wallet -t services --search "parallel"

# Get service details & endpoints
tempo wallet -t services <SERVICE_ID>
```

### Making Requests

```bash
# GET request
tempo request -t -X GET <SERVICE_URL>/<ENDPOINT_PATH>

# POST request with JSON body
tempo request -t -X POST --json '{"key":"value"}' <SERVICE_URL>/<ENDPOINT_PATH>

# Preview cost without paying
tempo request --dry-run -t -X POST --json '...' <SERVICE_URL>/<ENDPOINT_PATH>
```

### Wallet Management

```bash
# Check balance
tempo wallet -t whoami

# List active payment sessions
tempo wallet -t sessions list

# Close a session to unlock funds
tempo wallet sessions close <CHANNEL_ID>

# Fund wallet
tempo wallet fund
```

## Examples

### 1. Web Search & Extraction (Parallel)

```bash
# Search the web
tempo request -t -X POST --json '{"query":"Stripe documentation"}' \
  https://parallelmpp.dev/api/search

# Extract page content
tempo request -t -X POST --json '{"urls":["https://stripe.com/docs"]}' \
  https://parallelmpp.dev/api/extract
```

### 2. AI Chat (Anthropic Claude Haiku — cheapest)

```bash
tempo request -t -X POST --json '{
  "model":"claude-haiku-4-5-20251001",
  "max_tokens":150,
  "messages":[{"role":"user","content":"Hello"}]
}' https://anthropic.mpp.tempo.xyz/v1/messages
```

### 3. AI Chat (OpenAI GPT-4o-mini — cheapest)

```bash
tempo request -t -X POST --json '{
  "model":"gpt-4o-mini",
  "messages":[{"role":"user","content":"Hello"}],
  "max_tokens":150
}' https://openai.mpp.tempo.xyz/v1/chat/completions
```

### 4. Weather (OpenWeather)

```bash
tempo request -t -X POST --json '{"lat":21.0285,"lon":105.8542,"units":"metric"}' \
  https://weather.mpp.paywithlocus.com/openweather/current-weather
```

### 5. Daily Hanoi Weather Forecast to Telegram

See [hanoi-weather.sh](hanoi-weather.sh) — fetches weather via Tempo, translates to Vietnamese using GPT-4o-mini, and sends to a Telegram group.

```bash
# Run manually
bash hanoi-weather.sh

# Schedule via crontab (6am UTC+7 = 23:00 UTC)
# 3 23 * * * /path/to/hanoi-weather.sh
```

## Available Services (55+)

Browse all at `https://mpp.dev/services/llms.txt` or:

```bash
tempo wallet -t services --search "<query>"
```

| Category | Services |
|----------|----------|
| **AI** | Anthropic, OpenAI, OpenRouter, Gemini, fal.ai, Replicate, Perplexity, Stability AI |
| **Search** | Parallel, Exa, SerpApi, SpyFu |
| **Web** | Firecrawl, Browserbase, Oxylabs, Browser Use |
| **Data** | Allium, Dune, Codex, Alchemy, EDGAR, OpenWeather, Google Maps |
| **Media** | StableStudio, Suno |
| **Storage** | Object Storage, StableUpload, Code Storage |
| **Social** | AgentMail, StableEmail, StablePhone, StableSocial |
| **Travel** | StableTravel, FlightAPI, AviationStack |

## Pricing

- All payments in USDC on Tempo network
- Session-based (AI models) or per-request pricing
- Typical costs: $0.001–$0.01 per request
- Use `--dry-run` to preview costs

## Tips

- Always use full paths: `"$HOME/.local/bin/tempo"` or `"$HOME/.tempo/bin/tempo"`
- Use `--dry-run` before expensive requests
- Close idle sessions to unlock funds: `tempo wallet sessions close <ID>`
- Check endpoint docs with `tempo wallet -t services <SERVICE_ID>` when getting 422 errors
