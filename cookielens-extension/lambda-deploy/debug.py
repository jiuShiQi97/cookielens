#!/usr/bin/env python3
"""
Check Lambda function logs
"""

import boto3
import json
from datetime import datetime, timedelta

def check_lambda_logs(function_name, region='us-east-1'):
    """Check Lambda function logs"""
    print(f"📊 Checking logs for Lambda function: {function_name}")
    
    try:
        # Create CloudWatch Logs client
        logs_client = boto3.client('logs', region_name=region)
        
        # Get log group name
        log_group_name = f"/aws/lambda/{function_name}"
        
        # Check if log group exists
        try:
            logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
            print(f"✅ Log group found: {log_group_name}")
        except logs_client.exceptions.ResourceNotFoundException:
            print(f"❌ Log group not found: {log_group_name}")
            return
        
        # Get recent log streams
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=1)
        
        response = logs_client.describe_log_streams(
            logGroupName=log_group_name,
            orderBy='LastEventTime',
            descending=True,
            limit=5
        )
        
        if not response['logStreams']:
            print("ℹ️  No log streams found")
            return
        
        print(f"📋 Found {len(response['logStreams'])} recent log streams")
        
        # Get events from the most recent log stream
        latest_stream = response['logStreams'][0]
        stream_name = latest_stream['logStreamName']
        print(f"📝 Latest log stream: {stream_name}")
        
        # Get log events
        events_response = logs_client.get_log_events(
            logGroupName=log_group_name,
            logStreamName=stream_name,
            startTime=int(start_time.timestamp() * 1000),
            endTime=int(end_time.timestamp() * 1000),
            limit=50
        )
        
        print(f"\n📋 Recent log events:")
        print("-" * 60)
        
        for event in events_response['events']:
            timestamp = datetime.fromtimestamp(event['timestamp'] / 1000)
            message = event['message']
            print(f"[{timestamp.strftime('%H:%M:%S')}] {message}")
        
        print("-" * 60)
        
    except Exception as e:
        print(f"❌ Error checking logs: {e}")
        import traceback
        traceback.print_exc()

def test_lambda_directly(function_name, region='us-east-1'):
    """Test Lambda function directly"""
    print(f"\n🧪 Testing Lambda function directly...")
    
    try:
        lambda_client = boto3.client('lambda', region_name=region)
        
        # Test payload
        test_payload = {
            "body": json.dumps({"url": "https://example.com"})
        }
        
        print("📤 Invoking Lambda function...")
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_payload)
        )
        
        print(f"📊 Status code: {response['StatusCode']}")
        
        if 'Payload' in response:
            payload = json.loads(response['Payload'].read())
            print(f"📋 Response:")
            print(json.dumps(payload, indent=2))
        
        if 'FunctionError' in response:
            print(f"❌ Function error: {response['FunctionError']}")
        
    except Exception as e:
        print(f"❌ Error testing Lambda: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Main function"""
    function_name = "cookielens-scanner"
    region = "us-east-1"
    
    print("🔍 CookieLens Lambda Debugging")
    print("=" * 50)
    
    # Check logs
    check_lambda_logs(function_name, region)
    
    # Test directly
    test_lambda_directly(function_name, region)

if __name__ == "__main__":
    main()
