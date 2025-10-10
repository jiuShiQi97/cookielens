from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from lambda_function import scan_website
from vanta_client import VantaClient
from compliance_analyzer import ComplianceAnalyzer
import traceback
from datetime import datetime

app = FastAPI(title="CookieLens API", version="1.0.0")

# Initialize Vanta client
vanta_client = VantaClient()
compliance_analyzer = ComplianceAnalyzer(vanta_client)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanRequest(BaseModel):
    web_link: HttpUrl

class ScanWithComplianceRequest(BaseModel):
    web_link: HttpUrl
    frameworks: Optional[List[str]] = None  # e.g., ["gdpr", "ccpa"]

class ScanResponse(BaseModel):
    url: str
    scannedAt: str
    cookies: list
    localStorage: dict
    thirdParties: list
    humanReadableAnalysis: str
    s3Path: str = None

@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "CookieLens API is running",
        "version": "1.0.0"
    }

@app.post("/scan", response_model=ScanResponse)
def scan_endpoint(request: ScanRequest):
    """
    Scan a website for cookies, localStorage, and third-party services
    
    - **web_link**: The URL of the website to scan
    """
    try:
        # Convert HttpUrl to string
        url = str(request.web_link)
        
        # Call the core scanning logic
        result = scan_website(url)
        
        return result
        
    except Exception as e:
        print(f"Scan error: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Scan failed: {str(e)}"
        )

@app.post("/scan-with-compliance")
def scan_with_compliance_endpoint(request: ScanWithComplianceRequest):
    """
    Scan a website and analyze compliance with privacy frameworks
    
    - **web_link**: The URL of the website to scan
    - **frameworks**: Optional list of frameworks to check (e.g., ["gdpr", "ccpa"]). Defaults to ["gdpr", "ccpa"]
    
    Returns scan results + compliance analysis including:
    - Compliance score per framework
    - Passed/failed controls
    - Recommendations for improvement
    - Third-party risk assessment
    """
    try:
        # Convert HttpUrl to string
        url = str(request.web_link)
        
        print("="*60)
        print(f"🔍 Starting compliance analysis for: {url}")
        print("="*60)
        
        # Step 1: Scan the website
        print(f"📡 Step 1: Scanning website {url}...")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        scan_results = scan_website(url)
        print(f"✅ Website scan completed!")
        print(f"🍪 Found {len(scan_results.get('cookies', []))} cookies")
        print(f"🔗 Detected {len(scan_results.get('thirdParties', []))} third-party services")
        
        # Step 2: Analyze compliance
        frameworks = request.frameworks or ['gdpr', 'ccpa']
        print(f"⚖️ Step 2: Analyzing compliance for frameworks: {frameworks}")
        compliance_results = compliance_analyzer.analyze_compliance(
            scan_results,
            frameworks=frameworks
        )
        
        print(f"✅ Compliance analysis completed!")
        print(f"📊 Overall score: {compliance_results.get('overall_summary', {}).get('overall_score', 0)}%")
        print(f"⏰ Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)
        
        return compliance_results
        
    except Exception as e:
        print(f"❌ Compliance scan error: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Compliance scan failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

