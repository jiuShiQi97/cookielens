#!/usr/bin/env python3
"""
Test script for CookieLens backend API
"""

import requests
import json
import sys

def test_api():
    """Test the scan-with-compliance endpoint"""
    
    # API endpoint
    url = "http://localhost:8000/scan-with-compliance"
    
    # Test data
    test_data = {
        "web_link": "https://www.yami.com/en"
    }
    
    print("🍪 Testing CookieLens Backend API")
    print("="*50)
    print(f"📍 Testing URL: {url}")
    print(f"🔗 Test website: {test_data['web_link']}")
    print("\n⏳ Sending request...")
    
    try:
        # Send POST request
        response = requests.post(
            url,
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=60  # 60 second timeout
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Request successful!")
            
            # Parse response
            data = response.json()
            
            # Display key information
            print("\n📋 Response Summary:")
            print("-" * 30)
            
            if 'scan_results' in data:
                scan_results = data['scan_results']
                print(f"🌐 Website: {scan_results.get('url', 'N/A')}")
                print(f"📅 Scanned: {scan_results.get('scannedAt', 'N/A')}")
                print(f"🍪 Cookies found: {len(scan_results.get('cookies', []))}")
                print(f"🔗 Third parties: {len(scan_results.get('thirdParties', []))}")
                
                # Human readable analysis
                analysis = scan_results.get('humanReadableAnalysis', '')
                if analysis:
                    print(f"\n📝 Human Readable Analysis:")
                    print("-" * 30)
                    print(analysis[:200] + "..." if len(analysis) > 200 else analysis)
            
            if 'compliance_analysis' in data:
                compliance = data['compliance_analysis']
                print(f"\n⚖️ Compliance Analysis:")
                print("-" * 30)
                for framework, analysis in compliance.items():
                    print(f"📊 {framework.upper()}: {analysis.get('score', 0)}% ({analysis.get('status', 'unknown')})")
            
            if 'overall_summary' in data:
                summary = data['overall_summary']
                print(f"\n📈 Overall Summary:")
                print("-" * 30)
                print(f"Overall Score: {summary.get('overall_score', 0)}%")
                print(f"Frameworks: {summary.get('frameworks_analyzed', 0)}")
                print(f"Passed: {summary.get('total_passed', 0)}")
                print(f"Failed: {summary.get('total_failed', 0)}")
            
            # Save full response to file
            with open('test_response.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"\n💾 Full response saved to: test_response.json")
            
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed! Make sure the backend server is running.")
        print("💡 Start the server with: python start_server.py")
        
    except requests.exceptions.Timeout:
        print("❌ Request timed out! The analysis is taking too long.")
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def test_health():
    """Test the health endpoint"""
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code == 200:
            print("✅ Backend server is running!")
            return True
        else:
            print(f"⚠️ Backend server responded with status {response.status_code}")
            return False
    except:
        print("❌ Backend server is not running!")
        return False

if __name__ == "__main__":
    print("🔍 Checking backend server health...")
    if test_health():
        print("\n" + "="*50)
        test_api()
    else:
        print("\n💡 To start the backend server:")
        print("   cd cookielens-extension/backend")
        print("   python start_server.py")
