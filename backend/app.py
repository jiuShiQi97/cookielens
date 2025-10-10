from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from lambda_function import scan_website
import traceback

app = FastAPI(title="CookieLens API", version="1.0.0")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

