#!/usr/bin/env python3
"""
Simple runner script for CookieLens backend
This script directly imports and runs app.py
"""

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

