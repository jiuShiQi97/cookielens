import json
import boto3
import os
import requests
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse
from datetime import datetime

def analyze_with_claude(scan_data):
    """Use AWS Bedrock Claude model to analyze scan results and generate a human-readable privacy report"""
    try:
        # Authenticate using Bedrock API Key
        api_key = os.getenv('BEDROCK_API_KEY','ABSKTGktYXQtNDQwNzQ0MjUwNzIwOlRxQkJLWEFIRWFKaGZaU0lsZjF5SlRza1NEK1FIMk9aS1hqUGVyOEhWcVpzTHlzL0t1YnBLKzI4VnZVPQ==')
        if not api_key:
            return "Error: BEDROCK_API_KEY environment variable not set. Please run: export BEDROCK_API_KEY='your_api_key'"
        
        region = os.getenv('AWS_REGION', 'us-east-1')
        
        # Build analysis prompt
        prompt = f"""Please analyze the following website privacy scan results and generate a concise and easy-to-understand privacy analysis report.

Scan data:
{json.dumps(scan_data, indent=2)}

Please analyze from the following dimensions:
1. **Cookie Security**: Check security attributes such as httpOnly, secure, sameSite, etc.
2. **Data Storage**: What data is stored in localStorage
3. **Third-party Services**: Identify and explain the purpose of detected third-party domains
4. **Privacy Risk Rating**: Low/Medium/High, and explain the reason
5. **Improvement Recommendations**: If there are security risks, provide specific suggestions

Please answer clearly in English, using markdown format, suitable for non-technical readers."""

        # Call Bedrock API using HTTP request
        url = f"https://bedrock-runtime.{region}.amazonaws.com/model/anthropic.claude-3-sonnet-20240229-v1:0/invoke"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        
        # Parse response
        response_data = response.json()
        analysis = response_data['content'][0]['text']
        
        return analysis
        
    except requests.exceptions.RequestException as e:
        print(f"Bedrock API request failed: {e}")
        return f"API call failed: {str(e)}"
    except Exception as e:
        print(f"Bedrock analysis failed: {e}")
        return f"Analysis failed: {str(e)}"

def scan_website(url):
    """Core website scanning logic that can be reused by both Lambda and FastAPI"""
    print(f"Scanning {url}")
    
    with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
            context = browser.new_context()
            page = context.new_page()

            third_parties = set()

            def on_request(request):
                try:
                    host = urlparse(request.url).hostname or ""
                    base_host = urlparse(url).hostname or ""
                    if not host.endswith(base_host):
                        third_parties.add(host)
                except:
                    pass

            page.on("request", on_request)
            page.goto(url, wait_until="load", timeout=60000)

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

            scan = {
                "url": url,
                "scannedAt": datetime.utcnow().isoformat(),
                "cookies": cookies,
                "localStorage": local_storage,
                "thirdParties": list(third_parties)
            }

            browser.close()

    # Analyze scan results with Claude
    print("Analyzing with Claude...")
    scan["humanReadableAnalysis"] = analyze_with_claude(scan)

    # Upload to S3 (optional)
    if os.getenv("S3_BUCKET"):
        s3 = boto3.client("s3")
        key = f"scans/{datetime.utcnow().isoformat()}_scan.json"
        s3.put_object(
            Bucket=os.getenv("S3_BUCKET"),
            Key=key,
            Body=json.dumps(scan, indent=2),
            ContentType="application/json"
        )
        scan["s3Path"] = f"s3://{os.getenv('S3_BUCKET')}/{key}"

    return scan

def lambda_handler(event, context):
    """AWS Lambda handler function"""
    try:
        # Get body from API Gateway event
        body = json.loads(event.get("body", "{}"))
        url = body.get("url", "https://example.com")
        
        # Call core scanning logic
        scan = scan_website(url)
        
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(scan, indent=2)
        }

    except Exception as e:
        print("Error:", e)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }

# For local debugging
if __name__ == "__main__":
    event = {"body": json.dumps({"url": "https://openai.com"})}
    result = lambda_handler(event, None)
    print("\n" + "="*80)
    print("Scan Results:")
    print("="*80)
    response = json.loads(result['body'])
    if 'humanReadableAnalysis' in response:
        print("\n📊 Claude AI Analysis Report:")
        print(response['humanReadableAnalysis'])
    else:
        print(json.dumps(response, indent=2, ensure_ascii=False))
