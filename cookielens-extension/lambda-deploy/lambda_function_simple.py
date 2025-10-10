import json
import os
import boto3
import requests
from urllib.parse import urlparse
from datetime import datetime
import re

# AWS Configuration
REGION = os.getenv("AWS_REGION", "us-east-1")
MODEL_ID = os.getenv("MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT",
    "你是CookieLens合规助手。请用清晰中文、Markdown输出，面向非技术读者。语气客观、简洁。"
)

# Initialize Bedrock client
bedrock = boto3.client("bedrock-runtime", region_name=REGION)

def analyze_with_claude(scan_data: dict) -> str:
    """
    通过 Amazon Bedrock 调用 Claude Messages API 进行隐私分析
    """
    prompt = (
        "请分析以下网站隐私扫描数据，输出 Markdown，包含：\n"
        "1) Cookie安全性（逐条指出 httpOnly/secure/sameSite 问题）\n"
        "2) 本地存储(localStorage)中存了什么，是否敏感\n"
        "3) 第三方域名用途与潜在数据流向\n"
        "4) 风险评级：低/中/高，并用一句话解释\n"
        "5) 具体改进建议（最多5条，按重要性排序）\n\n"
        f"扫描数据(JSON)：\n{json.dumps(scan_data, ensure_ascii=False)[:120000]}"
    )

    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "system": SYSTEM_PROMPT,
        "max_tokens": 1200,
        "temperature": 0.2,
        "messages": [
            {
                "role": "user",
                "content": [{"type": "text", "text": prompt}]
            }
        ],
    }

    try:
        resp = bedrock.invoke_model(
            modelId=MODEL_ID,
            accept="application/json",
            contentType="application/json",
            body=json.dumps(body),
        )
        payload = json.loads(resp["body"].read())

        text_out = ""
        for part in payload.get("content", []):
            if part.get("type") == "text":
                text_out += part.get("text", "")
        return text_out
    except Exception as e:
        print(f"Bedrock analysis failed: {e}")
        return f"AI分析失败: {str(e)}"

def _parse_event(event):
    """Parse Lambda event to extract request data"""
    if "body" in event:
        body = event["body"]
        if event.get("isBase64Encoded"):
            import base64
            body = base64.b64decode(body).decode("utf-8")
        try:
            return json.loads(body or "{}")
        except:
            return {}
    return event or {}

def extract_cookies_from_headers(headers):
    """Extract cookies from HTTP headers"""
    cookies = []
    set_cookie_headers = headers.get('Set-Cookie', [])
    if isinstance(set_cookie_headers, str):
        set_cookie_headers = [set_cookie_headers]
    
    for cookie_header in set_cookie_headers:
        cookie_parts = cookie_header.split(';')
        if cookie_parts:
            name_value = cookie_parts[0].split('=', 1)
            if len(name_value) == 2:
                cookie = {
                    'name': name_value[0].strip(),
                    'value': name_value[1].strip(),
                    'domain': '',
                    'path': '/',
                    'expires': '',
                    'httpOnly': False,
                    'secure': False,
                    'sameSite': ''
                }
                
                # Parse cookie attributes
                for part in cookie_parts[1:]:
                    part = part.strip().lower()
                    if part == 'httponly':
                        cookie['httpOnly'] = True
                    elif part == 'secure':
                        cookie['secure'] = True
                    elif part.startswith('domain='):
                        cookie['domain'] = part[7:]
                    elif part.startswith('path='):
                        cookie['path'] = part[5:]
                    elif part.startswith('expires='):
                        cookie['expires'] = part[8:]
                    elif part.startswith('samesite='):
                        cookie['sameSite'] = part[9:]
                
                cookies.append(cookie)
    
    return cookies

def extract_third_parties_from_content(content, base_url):
    """Extract third-party domains from HTML content"""
    third_parties = set()
    
    # Extract URLs from various HTML attributes
    url_patterns = [
        r'src=["\']([^"\']+)["\']',
        r'href=["\']([^"\']+)["\']',
        r'action=["\']([^"\']+)["\']',
        r'url\(["\']?([^"\']+)["\']?\)',
        r'https?://([^/\s\'"<>]+)',
    ]
    
    base_domain = urlparse(base_url).hostname
    
    for pattern in url_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for match in matches:
            try:
                parsed = urlparse(match if match.startswith('http') else f'https://{match}')
                domain = parsed.hostname
                if domain and domain != base_domain and not domain.endswith(f'.{base_domain}'):
                    third_parties.add(domain)
            except:
                pass
    
    return list(third_parties)

def scan_website_simple(url: str) -> dict:
    """Simple website scanning using requests (no browser)"""
    print(f"[CookieLens] Scanning: {url}")
    
    try:
        # Make HTTP request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=30, allow_redirects=True)
        response.raise_for_status()
        
        # Extract cookies from response headers
        cookies = extract_cookies_from_headers(response.headers)
        
        # Extract third parties from content
        third_parties = extract_third_parties_from_content(response.text, url)
        
        # Simulate localStorage (we can't access it without a browser)
        # This is a limitation of the simple approach
        local_storage = {
            "note": "localStorage无法通过简单HTTP请求获取，需要浏览器环境"
        }
        
        scan = {
            "url": url,
            "scannedAt": datetime.utcnow().isoformat() + "Z",
            "cookies": cookies,
            "localStorage": local_storage,
            "thirdParties": sorted(third_parties),
            "method": "simple_http",
            "limitations": [
                "无法获取JavaScript动态生成的内容",
                "无法访问localStorage",
                "无法执行JavaScript代码",
                "可能遗漏动态加载的第三方服务"
            ]
        }
        
        return scan
        
    except requests.exceptions.RequestException as e:
        print(f"HTTP request failed: {e}")
        return {
            "url": url,
            "scannedAt": datetime.utcnow().isoformat() + "Z",
            "cookies": [],
            "localStorage": {},
            "thirdParties": [],
            "error": str(e),
            "method": "simple_http"
        }

def lambda_handler(event, context):
    """
    AWS Lambda handler function
    Supports both direct invocation and API Gateway events
    """
    try:
        # Parse the event
        data = _parse_event(event)
        url = data.get("url") or data.get("web_link")
        
        if not url:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({"error": "URL is required"}, ensure_ascii=False),
            }

        # Scan the website (simple method)
        scan = scan_website_simple(url)
        
        # Analyze with Claude
        print("Analyzing with Claude...")
        analysis = analyze_with_claude(scan)
        scan["humanReadableAnalysis"] = analysis

        # Optional: Save to S3
        bucket = os.getenv("S3_BUCKET")
        if bucket:
            s3 = boto3.client("s3", region_name=REGION)
            key = f"scans/{datetime.utcnow().strftime('%Y%m%dT%H%M%S')}_scan.json"
            s3.put_object(
                Bucket=bucket,
                Key=key,
                Body=json.dumps(scan, ensure_ascii=False).encode("utf-8"),
                ContentType="application/json",
            )
            scan["s3Path"] = f"s3://{bucket}/{key}"

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
            "body": json.dumps(scan, ensure_ascii=False),
        }

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({"error": str(e)}, ensure_ascii=False),
        }

# For local testing
if __name__ == "__main__":
    test_event = {
        "body": json.dumps({"url": "https://example.com"})
    }
    result = lambda_handler(test_event, None)
    print(json.dumps(json.loads(result['body']), indent=2, ensure_ascii=False))
