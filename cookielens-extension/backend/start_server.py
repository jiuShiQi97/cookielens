#!/usr/bin/env python3
"""
Start the CookieLens backend server using app.py
"""

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("🍪 Starting CookieLens Backend Server...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📋 API Documentation: http://localhost:8000/docs")
    print("🔍 Test endpoint: http://localhost:8000/scan-with-compliance")
    print("\n" + "="*50)
    
    # Import and run the app directly
    from app import app
    import uvicorn
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
