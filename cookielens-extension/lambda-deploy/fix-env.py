#!/usr/bin/env python3
"""
Update Lambda function environment variables
"""

import boto3

def update_lambda_environment():
    """Update Lambda function environment variables"""
    print("🔧 Updating Lambda function environment variables...")
    
    try:
        lambda_client = boto3.client('lambda')
        
        # Get current function configuration
        function_config = lambda_client.get_function_configuration(
            FunctionName='cookielens-scanner'
        )
        
        print(f"📋 Current environment variables:")
        current_env = function_config.get('Environment', {}).get('Variables', {})
        for key, value in current_env.items():
            print(f"  {key}: {value}")
        
        # Update environment variables (remove S3_BUCKET to avoid errors)
        new_env = {
            'MODEL_ID': 'anthropic.claude-3-5-sonnet-20240620-v1:0'
            # Remove S3_BUCKET to avoid bucket not found errors
        }
        
        # Update function configuration
        response = lambda_client.update_function_configuration(
            FunctionName='cookielens-scanner',
            Environment={
                'Variables': new_env
            }
        )
        
        print(f"✅ Lambda function environment updated")
        print(f"📋 New environment variables:")
        for key, value in new_env.items():
            print(f"  {key}: {value}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to update Lambda function environment: {e}")
        return False

def main():
    """Main function"""
    print("🔧 Updating Lambda function environment...")
    
    success = update_lambda_environment()
    if success:
        print("\n✅ Lambda function environment updated successfully!")
        print("🧪 You can now test the function again.")
    else:
        print("\n❌ Failed to update Lambda function environment")

if __name__ == "__main__":
    main()
