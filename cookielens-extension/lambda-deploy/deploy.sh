#!/bin/bash

# CookieLens Lambda Deployment Script
# This script deploys the CookieLens Lambda function to AWS

set -e

echo "🚀 Starting CookieLens Lambda deployment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if serverless is installed globally
if ! command -v serverless &> /dev/null; then
    echo "📦 Installing Serverless Framework..."
    npm install -g serverless
fi

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# Get AWS account info
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)
echo "✅ AWS Account: $AWS_ACCOUNT"
echo "✅ AWS Region: $AWS_REGION"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create Playwright layer directory
echo "🎭 Setting up Playwright layer..."
mkdir -p layers/playwright/python

# Install Playwright in the layer
cd layers/playwright
pip install playwright -t python/
cd python
playwright install chromium
cd ../../..

# Deploy to AWS
echo "🚀 Deploying to AWS Lambda..."
serverless deploy

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Test your Lambda function:"
echo "   serverless invoke -f scanWebsite --data '{\"body\":\"{\\\"url\\\":\\\"https://example.com\\\"}\"}'"
echo ""
echo "2. View logs:"
echo "   serverless logs -f scanWebsite"
echo ""
echo "3. Get API endpoint:"
echo "   serverless info"
echo ""
echo "🎉 Your CookieLens Lambda function is now deployed!"
