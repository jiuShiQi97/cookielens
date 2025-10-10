# CookieLens FastAPI Usage Guide

## Installation

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
playwright install chromium
```

## Running the Server

Start the FastAPI server:
```bash
python start_server.py
```

Or run app.py directly:
```bash
python app.py
```

Or use uvicorn directly:
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The server will start on `http://localhost:8000`

## API Endpoints

### 1. Health Check
```bash
GET /
```

Response:
```json
{
  "status": "ok",
  "message": "CookieLens API is running",
  "version": "1.0.0"
}
```

### 2. Scan Website
```bash
POST /scan
```

Request body:
```json
{
  "web_link": "https://example.com"
}
```

Response:
```json
{
  "url": "https://example.com",
  "scannedAt": "2025-10-10T12:00:00.000000",
  "cookies": [...],
  "localStorage": {...},
  "thirdParties": [...],
  "humanReadableAnalysis": "..."
}
```

## Frontend Integration Example

```javascript
// Example: Calling the scan endpoint from frontend
async function scanWebsite(webLink) {
  try {
    const response = await fetch('http://localhost:8000/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        web_link: webLink
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Scan results:', data);
    return data;
    
  } catch (error) {
    console.error('Scan failed:', error);
    throw error;
  }
}

// Usage
scanWebsite('https://openai.com')
  .then(results => {
    console.log('Analysis:', results.humanReadableAnalysis);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

## Testing with cURL

```bash
curl -X POST "http://localhost:8000/scan" \
  -H "Content-Type: application/json" \
  -d '{"web_link": "https://openai.com"}'
```

## Interactive API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

