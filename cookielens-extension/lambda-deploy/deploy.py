#!/usr/bin/env python3
"""
CookieLens Lambda Deployment Script using boto3
This script deploys the CookieLens Lambda function to AWS without requiring AWS CLI
"""

import boto3
import json
import zipfile
import os
import time
import sys
from datetime import datetime

def create_zip_package():
    """Create deployment package"""
    print("📦 Creating deployment package...")
    
    # Files to include in the package
    files_to_include = [
        'lambda_function.py',
        'requirements.txt'
    ]
    
    # Create zip file
    with zipfile.ZipFile('cookielens-lambda.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file in files_to_include:
            if os.path.exists(file):
                zipf.write(file)
                print(f"  ✅ Added {file}")
            else:
                print(f"  ❌ File not found: {file}")
    
    print("✅ Deployment package created: cookielens-lambda.zip")
    return 'cookielens-lambda.zip'

def create_iam_role(session, role_name):
    """Create IAM role for Lambda"""
    print(f"🔧 Creating IAM role: {role_name}")
    
    iam = session.client('iam')
    
    # Trust policy for Lambda
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }
    
    try:
        # Create role
        role = iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description='Role for CookieLens Lambda function'
        )
        print(f"  ✅ Created role: {role['Role']['Arn']}")
        
        # Attach basic execution policy
        iam.attach_role_policy(
            RoleName=role_name,
            PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        )
        print("  ✅ Attached basic execution policy")
        
        # Create custom policy for Bedrock and S3
        policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "bedrock:InvokeModel"
                    ],
                    "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:PutObjectAcl"
                    ],
                    "Resource": "arn:aws:s3:::cookielens-scans-*/*"
                }
            ]
        }
        
        policy = iam.create_policy(
            PolicyName=f'{role_name}-policy',
            PolicyDocument=json.dumps(policy_document),
            Description='Custom policy for CookieLens Lambda'
        )
        
        iam.attach_role_policy(
            RoleName=role_name,
            PolicyArn=policy['Policy']['Arn']
        )
        print("  ✅ Attached custom policy")
        
        return role['Role']['Arn']
        
    except iam.exceptions.EntityAlreadyExistsException:
        print(f"  ℹ️  Role {role_name} already exists")
        return f"arn:aws:iam::{session.client('sts').get_caller_identity()['Account']}:role/{role_name}"
    except Exception as e:
        print(f"  ❌ Error creating role: {e}")
        return None

def create_s3_bucket(session, bucket_name):
    """Create S3 bucket for scan results"""
    print(f"🪣 Creating S3 bucket: {bucket_name}")
    
    s3 = session.client('s3')
    
    try:
        # Get region
        region = session.region_name or 'us-east-1'
        
        if region == 'us-east-1':
            s3.create_bucket(Bucket=bucket_name)
        else:
            s3.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={'LocationConstraint': region}
            )
        
        print(f"  ✅ Created bucket: {bucket_name}")
        return bucket_name
        
    except s3.exceptions.BucketAlreadyExists:
        print(f"  ℹ️  Bucket {bucket_name} already exists")
        return bucket_name
    except Exception as e:
        print(f"  ❌ Error creating bucket: {e}")
        return None

def deploy_lambda_function(session, function_name, role_arn, zip_file):
    """Deploy Lambda function"""
    print(f"🚀 Deploying Lambda function: {function_name}")
    
    lambda_client = session.client('lambda')
    
    try:
        # Read zip file
        with open(zip_file, 'rb') as f:
            zip_content = f.read()
        
        # Create function
        function = lambda_client.create_function(
            FunctionName=function_name,
            Runtime='python3.9',
            Role=role_arn,
            Handler='lambda_function.lambda_handler',
            Code={'ZipFile': zip_content},
            Description='CookieLens website privacy scanner',
            Timeout=300,
            MemorySize=1024,
            Environment={
                'Variables': {
                    'MODEL_ID': 'anthropic.claude-3-5-sonnet-20240620-v1:0',
                    'S3_BUCKET': f'cookielens-scans-{int(time.time())}'
                }
            }
        )
        
        print(f"  ✅ Created function: {function['FunctionArn']}")
        return function['FunctionArn']
        
    except lambda_client.exceptions.ResourceConflictException:
        print(f"  ℹ️  Function {function_name} already exists, updating...")
        
        # Update function code
        lambda_client.update_function_code(
            FunctionName=function_name,
            ZipFile=zip_content
        )
        
        # Update function configuration
        lambda_client.update_function_configuration(
            FunctionName=function_name,
            Timeout=300,
            MemorySize=1024,
            Environment={
                'Variables': {
                    'MODEL_ID': 'anthropic.claude-3-5-sonnet-20240620-v1:0',
                    'S3_BUCKET': f'cookielens-scans-{int(time.time())}'
                }
            }
        )
        
        print(f"  ✅ Updated function: {function_name}")
        return f"arn:aws:lambda:{session.region_name or 'us-east-1'}:{session.client('sts').get_caller_identity()['Account']}:function:{function_name}"
    except Exception as e:
        print(f"  ❌ Error deploying function: {e}")
        return None

def create_api_gateway(session, function_name):
    """Create API Gateway for Lambda function"""
    print("🌐 Creating API Gateway...")
    
    apigateway = session.client('apigateway')
    
    try:
        # Create REST API
        api = apigateway.create_rest_api(
            name='cookielens-api',
            description='CookieLens API Gateway',
            endpointConfiguration={'types': ['REGIONAL']}
        )
        
        api_id = api['id']
        print(f"  ✅ Created API: {api_id}")
        
        # Get root resource
        resources = apigateway.get_resources(restApiId=api_id)
        root_resource_id = resources['items'][0]['id']
        
        # Create /scan resource
        scan_resource = apigateway.create_resource(
            restApiId=api_id,
            parentId=root_resource_id,
            pathPart='scan'
        )
        
        scan_resource_id = scan_resource['id']
        print("  ✅ Created /scan resource")
        
        # Create POST method
        apigateway.put_method(
            restApiId=api_id,
            resourceId=scan_resource_id,
            httpMethod='POST',
            authorizationType='NONE'
        )
        print("  ✅ Created POST method")
        
        # Get account ID
        account_id = session.client('sts').get_caller_identity()['Account']
        region = session.region_name or 'us-east-1'
        
        # Set up Lambda integration
        apigateway.put_integration(
            restApiId=api_id,
            resourceId=scan_resource_id,
            httpMethod='POST',
            type='AWS_PROXY',
            integrationHttpMethod='POST',
            uri=f'arn:aws:apigateway:{region}:lambda:path/2015-03-31/functions/arn:aws:lambda:{region}:{account_id}:function:{function_name}/invocations'
        )
        print("  ✅ Set up Lambda integration")
        
        # Add Lambda permission for API Gateway
        lambda_client = session.client('lambda')
        lambda_client.add_permission(
            FunctionName=function_name,
            StatementId='apigateway-invoke',
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=f'arn:aws:execute-api:{region}:{account_id}:{api_id}/*/*'
        )
        print("  ✅ Added Lambda permission")
        
        # Deploy API
        deployment = apigateway.create_deployment(
            restApiId=api_id,
            stageName='prod'
        )
        print("  ✅ Deployed API")
        
        api_url = f"https://{api_id}.execute-api.{region}.amazonaws.com/prod"
        print(f"  🌐 API URL: {api_url}/scan")
        
        return api_url
        
    except Exception as e:
        print(f"  ❌ Error creating API Gateway: {e}")
        return None

def main():
    """Main deployment function"""
    print("🚀 Starting CookieLens Lambda deployment...")
    
    # Configuration
    function_name = "cookielens-scanner"
    role_name = "cookielens-lambda-role"
    bucket_name = f"cookielens-scans-{int(time.time())}"
    
    try:
        # Create AWS session
        print("🔐 Initializing AWS session...")
        session = boto3.Session()
        
        # Verify credentials
        sts = session.client('sts')
        identity = sts.get_caller_identity()
        print(f"✅ AWS Account: {identity['Account']}")
        print(f"✅ AWS Region: {session.region_name or 'us-east-1'}")
        
        # Create deployment package
        zip_file = create_zip_package()
        
        # Create IAM role
        role_arn = create_iam_role(session, role_name)
        if not role_arn:
            print("❌ Failed to create IAM role")
            return
        
        # Wait for role to be ready
        print("⏳ Waiting for IAM role to be ready...")
        time.sleep(10)
        
        # Create S3 bucket
        bucket = create_s3_bucket(session, bucket_name)
        if not bucket:
            print("❌ Failed to create S3 bucket")
            return
        
        # Deploy Lambda function
        function_arn = deploy_lambda_function(session, function_name, role_arn, zip_file)
        if not function_arn:
            print("❌ Failed to deploy Lambda function")
            return
        
        # Create API Gateway
        api_url = create_api_gateway(session, function_name)
        if not api_url:
            print("❌ Failed to create API Gateway")
            return
        
        print("\n" + "="*60)
        print("✅ Deployment completed successfully!")
        print("="*60)
        print(f"📋 Deployment Summary:")
        print(f"  Function Name: {function_name}")
        print(f"  Function ARN: {function_arn}")
        print(f"  API URL: {api_url}/scan")
        print(f"  S3 Bucket: {bucket}")
        print(f"  Region: {session.region_name or 'us-east-1'}")
        print("\n🧪 Test your deployment:")
        print(f"curl -X POST {api_url}/scan \\")
        print("  -H 'Content-Type: application/json' \\")
        print("  -d '{\"url\": \"https://example.com\"}'")
        print("\n📊 View logs:")
        print(f"aws logs tail /aws/lambda/{function_name} --follow")
        print("\n🎉 Your CookieLens Lambda function is now deployed!")
        
    except Exception as e:
        print(f"❌ Deployment failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    finally:
        # Clean up
        if os.path.exists('cookielens-lambda.zip'):
            os.remove('cookielens-lambda.zip')
            print("🧹 Cleaned up deployment package")

if __name__ == "__main__":
    main()
