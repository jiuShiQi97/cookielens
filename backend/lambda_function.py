import json
import boto3
import os
import requests
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse
from datetime import datetime

def analyze_with_claude(scan_data):
    """使用AWS Bedrock Claude模型分析扫描结果，生成人类可读的隐私报告"""
    try:
        # 使用Bedrock API Key认证
        api_key = os.getenv('BEDROCK_API_KEY','ABSKTGktYXQtNDQwNzQ0MjUwNzIwOlRxQkJLWEFIRWFKaGZaU0lsZjF5SlRza1NEK1FIMk9aS1hqUGVyOEhWcVpzTHlzL0t1YnBLKzI4VnZVPQ==')
        if not api_key:
            return "错误：未设置BEDROCK_API_KEY环境变量。请运行: export BEDROCK_API_KEY='your_api_key'"
        
        region = os.getenv('AWS_REGION', 'us-east-1')
        
        # 构建分析prompt
        prompt = f"""请分析以下网站隐私扫描结果，生成一份简洁易懂的隐私分析报告。

扫描数据：
{json.dumps(scan_data, indent=2)}

请从以下几个维度进行分析：
1. **Cookie安全性**：检查httpOnly、secure、sameSite等安全属性
2. **数据存储**：localStorage中存储了哪些数据
3. **第三方服务**：识别并说明检测到的第三方域名用途
4. **隐私风险评级**：低/中/高，并说明原因
5. **改进建议**：如果有安全隐患，提供具体建议

请用清晰的中文回答，使用markdown格式，适合非技术人员阅读。"""

        # 使用HTTP请求调用Bedrock API
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
        
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        # 解析响应
        response_data = response.json()
        analysis = response_data['content'][0]['text']
        
        return analysis
        
    except requests.exceptions.RequestException as e:
        print(f"Bedrock API request failed: {e}")
        return f"API调用失败：{str(e)}"
    except Exception as e:
        print(f"Bedrock analysis failed: {e}")
        return f"分析失败：{str(e)}"

def lambda_handler(event, context):
    try:
        # 从 API Gateway 事件中取 body
        body = json.loads(event.get("body", "{}"))
        url = body.get("url", "https://example.com")
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

        # 使用Claude分析扫描结果
        print("Analyzing with Claude...")
        scan["humanReadableAnalysis"] = analyze_with_claude(scan)

        # 上传到 S3（可选）
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

# 本地调试用
if __name__ == "__main__":
    event = {"body": json.dumps({"url": "https://openai.com"})}
    result = lambda_handler(event, None)
    print("\n" + "="*80)
    print("扫描结果：")
    print("="*80)
    response = json.loads(result['body'])
    if 'humanReadableAnalysis' in response:
        print("\n📊 Claude AI 分析报告：")
        print(response['humanReadableAnalysis'])
    else:
        print(json.dumps(response, indent=2, ensure_ascii=False))
