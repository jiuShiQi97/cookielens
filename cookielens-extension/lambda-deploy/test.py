#!/usr/bin/env python3
"""
Test script for CookieLens Lambda function
"""

import requests
import json
import time

def test_lambda_function(api_url, test_url="https://example.com"):
    """Test the deployed Lambda function"""
    print(f"🧪 Testing CookieLens Lambda function...")
    print(f"API URL: {api_url}")
    print(f"Test URL: {test_url}")
    
    # Test data
    test_data = {
        "url": test_url
    }
    
    try:
        print("\n📤 Sending request...")
        start_time = time.time()
        
        response = requests.post(
            api_url,
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=300  # 5 minutes timeout
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"⏱️  Response time: {duration:.2f} seconds")
        print(f"📊 Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ Test successful!")
            print(f"📋 Response summary:")
            print(f"  URL scanned: {result.get('url', 'N/A')}")
            print(f"  Scanned at: {result.get('scannedAt', 'N/A')}")
            print(f"  Cookies found: {len(result.get('cookies', []))}")
            print(f"  Third parties: {len(result.get('thirdParties', []))}")
            print(f"  Analysis available: {'humanReadableAnalysis' in result}")
            
            if 'humanReadableAnalysis' in result:
                print(f"\n🤖 AI Analysis Preview:")
                analysis = result['humanReadableAnalysis']
                # Show first 200 characters
                preview = analysis[:200] + "..." if len(analysis) > 200 else analysis
                print(f"  {preview}")
            
            if 's3Path' in result:
                print(f"\n💾 S3 Path: {result['s3Path']}")
                
        else:
            print(f"❌ Test failed with status code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.Timeout:
        print("⏰ Request timed out (5 minutes)")
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse JSON response: {e}")
        print(f"Raw response: {response.text}")

def test_health_endpoint(api_url):
    """Test the health endpoint"""
    health_url = api_url.replace('/scan', '/health')
    print(f"\n🏥 Testing health endpoint: {health_url}")
    
    try:
        response = requests.get(health_url, timeout=30)
        print(f"Status code: {response.status_code}")
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print(f"❌ Health check failed: {response.text}")
    except Exception as e:
        print(f"❌ Health check error: {e}")

def main():
    """Main test function"""
    # API URL from deployment
    api_url = "https://kr9knqhdha.execute-api.us-east-1.amazonaws.com/prod/scan"
    
    print("🚀 CookieLens Lambda Function Test")
    print("=" * 50)
    
    # Test with a simple website first
    test_lambda_function(api_url, "https://example.com")
    
    # Test health endpoint
    test_health_endpoint(api_url)
    
    print("\n" + "=" * 50)
    print("🎉 Testing completed!")

if __name__ == "__main__":
    main()
