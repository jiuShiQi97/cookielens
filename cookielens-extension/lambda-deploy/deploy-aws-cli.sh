#!/bin/bash

# CookieLens Lambda Deployment Script (AWS CLI Version)
# This script creates and deploys the CookieLens Lambda function using AWS CLI

set -e

echo "🚀 Starting CookieLens Lambda deployment with AWS CLI..."

# Configuration
FUNCTION_NAME="cookielens-scanner"
REGION="us-east-1"
ROLE_NAME="cookielens-lambda-role"
POLICY_NAME="cookielens-lambda-policy"
BUCKET_NAME="cookielens-scans-$(date +%s)"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account: $AWS_ACCOUNT"
echo "✅ AWS Region: $REGION"

# Create IAM role for Lambda
echo "🔧 Creating IAM role..."
cat > trust-policy.json << EOF
{
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
EOF

aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document file://trust-policy.json \
    --region $REGION || echo "Role may already exist"

# Create IAM policy for Lambda
echo "🔧 Creating IAM policy..."
cat > lambda-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:${REGION}::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    }
  ]
}
EOF

aws iam create-policy \
    --policy-name $POLICY_NAME \
    --policy-document file://lambda-policy.json \
    --region $REGION || echo "Policy may already exist"

# Attach policies to role
echo "🔧 Attaching policies to role..."
aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
    --region $REGION || echo "Basic execution policy already attached"

aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::${AWS_ACCOUNT}:policy/${POLICY_NAME} \
    --region $REGION || echo "Custom policy already attached"

# Create S3 bucket
echo "🪣 Creating S3 bucket..."
aws s3 mb s3://$BUCKET_NAME --region $REGION || echo "Bucket may already exist"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt -t .

# Create deployment package
echo "📦 Creating deployment package..."
zip -r cookielens-lambda.zip . -x "*.git*" "*.DS_Store*" "deploy-*.sh" "*.md" "*.yaml" "*.yml" "*.json" "layers/*"

# Wait for role to be ready
echo "⏳ Waiting for IAM role to be ready..."
sleep 10

# Create Lambda function
echo "🚀 Creating Lambda function..."
aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime python3.9 \
    --role arn:aws:iam::${AWS_ACCOUNT}:role/${ROLE_NAME} \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://cookielens-lambda.zip \
    --timeout 300 \
    --memory-size 1024 \
    --environment Variables="{AWS_REGION=${REGION},MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0,S3_BUCKET=${BUCKET_NAME}}" \
    --region $REGION || echo "Function may already exist, updating..."

# Update function code if it exists
if [ $? -ne 0 ]; then
    echo "🔄 Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://cookielens-lambda.zip \
        --region $REGION
    
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout 300 \
        --memory-size 1024 \
        --environment Variables="{AWS_REGION=${REGION},MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0,S3_BUCKET=${BUCKET_NAME}}" \
        --region $REGION
fi

# Create API Gateway
echo "🌐 Creating API Gateway..."
API_ID=$(aws apigateway create-rest-api \
    --name cookielens-api \
    --description "CookieLens API Gateway" \
    --region $REGION \
    --query 'id' \
    --output text)

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[0].id' \
    --output text)

# Create /scan resource
SCAN_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part scan \
    --region $REGION \
    --query 'id' \
    --output text)

# Create POST method
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $SCAN_RESOURCE_ID \
    --http-method POST \
    --authorization-type NONE \
    --region $REGION

# Set up Lambda integration
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $SCAN_RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${REGION}:${AWS_ACCOUNT}:function:${FUNCTION_NAME}/invocations \
    --region $REGION

# Add Lambda permission for API Gateway
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${AWS_ACCOUNT}:${API_ID}/*/*" \
    --region $REGION || echo "Permission may already exist"

# Deploy API
DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $REGION \
    --query 'id' \
    --output text)

API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod"

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  Function Name: $FUNCTION_NAME"
echo "  API URL: $API_URL/scan"
echo "  S3 Bucket: $BUCKET_NAME"
echo "  Region: $REGION"
echo ""
echo "🧪 Test your deployment:"
echo "curl -X POST $API_URL/scan \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"url\": \"https://example.com\"}'"
echo ""
echo "📊 View logs:"
echo "aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"
echo ""
echo "🎉 Your CookieLens Lambda function is now deployed!"

# Clean up temporary files
rm -f trust-policy.json lambda-policy.json cookielens-lambda.zip
