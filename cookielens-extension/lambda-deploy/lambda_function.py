import json
import os
import boto3
from urllib.parse import urlparse
from datetime import datetime
from playwright.sync_api import sync_playwright

# AWS Configuration
REGION = os.getenv("AWS_REGION", "us-east-1")
MODEL_ID = os.getenv("MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")
SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT",
    "你是CookieLens合规助手。请用清晰中文、Markdown输出，面向非技术读者。语气客观、简洁。"
)

# Initialize Bedrock client
bedrock = boto3.client("bedrock-runtime", region_name=REGION)

def _same_site(host: str, base: str) -> bool:
    """Check if host is same site as base"""
    if not host or not base:
        return True
    return host == base or host.endswith("." + base)

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

def scan_website(url: str) -> dict:
    """Core website scanning logic"""
    print(f"[CookieLens] Scanning: {url}")
    base_host = (urlparse(url).hostname or "").lower()
    third_parties = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--single-process",
                "--no-zygote"
            ],
        )
        browser_context = browser.new_context()
        page = browser_context.new_page()

        def on_request(request):
            try:
                host = (urlparse(request.url).hostname or "").lower()
                if not _same_site(host, base_host):
                    third_parties.add(host)
            except Exception:
                pass

        page.on("request", on_request)
        page.goto(url, wait_until="load", timeout=60000)

        cookies = browser_context.cookies()
        local_storage = page.evaluate(
            """() => {
                const d = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    d[k] = localStorage.getItem(k);
                }
                return d;
            }"""
        )

        scan = {
            "url": url,
            "scannedAt": datetime.utcnow().isoformat() + "Z",
            "cookies": cookies,
            "localStorage": local_storage,
            "thirdParties": sorted(third_parties),
        }

        browser_context.close()
        browser.close()

    return scan

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

        # Scan the website
        scan = scan_website(url)
        
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
