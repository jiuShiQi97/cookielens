# CookieLens Backend

Scans websites for cookies and checks privacy compliance.

## Setup

```bash
pip install -r requirements.txt
playwright install chromium
```

## Run

```bash
python api.py
```

Server starts at `http://localhost:8000`

## Endpoints

### POST /scan
Scan a website for cookies, localStorage, and trackers.

```bash
curl -X POST http://localhost:8000/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### POST /scan/compliance
Scan + compliance analysis (GDPR, CCPA).

```bash
curl -X POST http://localhost:8000/scan/compliance \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "frameworks": ["gdpr", "ccpa"]}'
```

## Config

Set environment variables:
- `BEDROCK_API_KEY` - AWS Bedrock API key for AI analysis
- `AWS_REGION` - AWS region (default: us-east-1)

## Architecture

- `scanner.py` - Playwright browser automation
- `compliance.py` - Framework checks and rules
- `workflow.py` - LangGraph state machine
- `api.py` - FastAPI endpoints
- `config.py` - Settings

