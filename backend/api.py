from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from scanner import scan_website
from workflow import run_compliance_scan

app = FastAPI(title="CookieLens", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


class ScanRequest(BaseModel):
    url: str


class ComplianceRequest(BaseModel):
    url: str
    frameworks: Optional[list] = None


@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/scan")
def scan(req: ScanRequest):
    try:
        return scan_website(req.url)
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/scan/compliance")
def scan_compliance(req: ComplianceRequest):
    try:
        return run_compliance_scan(req.url, req.frameworks)
    except Exception as e:
        raise HTTPException(500, str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

