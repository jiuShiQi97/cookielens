import json
import requests
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse
from datetime import datetime
from config import BEDROCK_API_KEY, AWS_REGION, BROWSER_TIMEOUT, API_TIMEOUT, MAX_TOKENS, BROWSER_ARGS


def scan_website(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=BROWSER_ARGS)
        context = browser.new_context()
        page = context.new_page()
        
        third_parties = set()
        
        def track_requests(request):
            try:
                host = urlparse(request.url).hostname or ""
                base_host = urlparse(url).hostname or ""
                if not host.endswith(base_host):
                    third_parties.add(host)
            except:
                pass
        
        page.on("request", track_requests)
        page.goto(url, wait_until="load", timeout=BROWSER_TIMEOUT)
        
        cookies = context.cookies()
        local_storage = page.evaluate("""
            () => {
                const data = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    data[key] = localStorage.getItem(key);
                }
                return data;
            }
        """)
        
        browser.close()
    
    scan_data = {
        "url": url,
        "scannedAt": datetime.utcnow().isoformat(),
        "cookies": cookies,
        "localStorage": local_storage,
        "thirdParties": list(third_parties)
    }
    
    scan_data["aiAnalysis"] = analyze_with_ai(scan_data)
    
    return scan_data


def analyze_with_ai(scan_data):
    if not BEDROCK_API_KEY:
        return "AI analysis unavailable (no API key)"
    
    try:
        prompt = f"""Analyze this privacy scan (max 100 words):

{json.dumps(scan_data, indent=2)}

Format:
**Risk Level**: [Low/Medium/High]
**Key Findings**: (2-3 bullets)
- Issue 1
- Issue 2

**Recommendations**: (2-3 actions)
- Action 1
- Action 2"""

        url = f"https://bedrock-runtime.{AWS_REGION}.amazonaws.com/model/anthropic.claude-3-sonnet-20240229-v1:0/invoke"
        
        response = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {BEDROCK_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": MAX_TOKENS,
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=API_TIMEOUT
        )
        response.raise_for_status()
        
        return response.json()['content'][0]['text']
    
    except Exception as e:
        return f"AI analysis failed: {str(e)}"

