# CookieLens - Lambda Deployment Version

This repository contains the complete CookieLens project snapshot, optimized and ready for AWS Lambda deployment.

## 🚀 Project Overview

CookieLens is a comprehensive cookie compliance analysis tool that combines a browser extension frontend with a Python backend deployed on AWS Lambda. This version is specifically configured for serverless deployment with all necessary dependencies and configurations.

## 📁 Project Structure

```
cookieLen/
├── cookielens-extension/          # Main project directory
│   ├── backend/                   # Python backend for Lambda
│   │   ├── lambda_function.py     # Main Lambda handler
│   │   ├── compliance_analyzer.py # Cookie compliance analysis
│   │   ├── vanta_client.py       # Vanta integration
│   │   ├── requirements.txt      # Python dependencies
│   │   └── ...                   # AWS SDK and dependencies
│   ├── frontend/                 # Chrome extension
│   │   ├── manifest.json         # Extension manifest
│   │   ├── content/             # Content scripts
│   │   ├── background/           # Service worker
│   │   └── options/             # Options page
│   ├── lambda-deploy/            # Deployment scripts
│   │   ├── deploy.py            # Main deployment script
│   │   ├── deploy.sh            # Shell deployment script
│   │   ├── template.yaml        # CloudFormation template
│   │   └── serverless.yml       # Serverless framework config
│   └── cookielens-lambda/       # Alternative Lambda setup
└── README.md                    # This file
```

## 🛠️ Features

### Backend (AWS Lambda)
- **Cookie Compliance Analysis**: Automated analysis of cookie compliance with GDPR, CCPA, and other regulations
- **Vanta Integration**: Seamless integration with Vanta for compliance reporting
- **AWS Services**: Full integration with AWS services (Bedrock, DynamoDB, S3)
- **Serverless Architecture**: Optimized for AWS Lambda deployment
- **CORS Support**: Proper CORS handling for browser extension integration

### Frontend (Chrome Extension)
- **Real-time Cookie Analysis**: Live analysis of cookies on web pages
- **Compliance Reporting**: Detailed compliance reports and recommendations
- **User-friendly Interface**: Clean and intuitive user interface
- **Background Processing**: Efficient background processing of cookie data

## 🚀 Deployment

### Prerequisites
- AWS CLI configured with appropriate permissions
- Python 3.9+ (for local development)
- Node.js (for frontend development)

### Quick Deployment

1. **Using AWS CLI**:
   ```bash
   cd cookielens-extension/lambda-deploy
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Using Python Script**:
   ```bash
   cd cookielens-extension/lambda-deploy
   python deploy.py
   ```

3. **Using Serverless Framework**:
   ```bash
   cd cookielens-extension/lambda-deploy
   npm install
   serverless deploy
   ```

### Manual Deployment Steps

1. **Package Lambda Function**:
   ```bash
   cd cookielens-extension/backend
   pip install -r requirements.txt -t .
   zip -r lambda-deployment.zip .
   ```

2. **Deploy to AWS**:
   ```bash
   aws lambda create-function \
     --function-name cookielens-compliance \
     --runtime python3.9 \
     --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
     --handler lambda_function.lambda_handler \
     --zip-file fileb://lambda-deployment.zip
   ```

## 🔧 Configuration

### Environment Variables
- `VANTA_API_KEY`: Vanta API key for compliance reporting
- `AWS_REGION`: AWS region for deployment
- `DYNAMODB_TABLE`: DynamoDB table name for data storage

### CORS Configuration
The Lambda function is configured with proper CORS headers to work with the browser extension:
```python
headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

## 📊 API Endpoints

- `POST /analyze`: Analyze cookies for compliance
- `GET /compliance-report`: Get compliance report
- `POST /vanta-sync`: Sync data with Vanta

## 🧪 Testing

### Backend Testing
```bash
cd cookielens-extension/backend
python -m pytest
```

### Integration Testing
```bash
cd cookielens-extension
python test-integration.py
```

## 📝 Documentation

- [API Usage Guide](cookielens-extension/backend/API_USAGE.md)
- [Compliance Usage Guide](cookielens-extension/backend/COMPLIANCE_USAGE.md)
- [Deployment Guide](cookielens-extension/lambda-deploy/DEPLOYMENT_REPORT.md)
- [Debug Guide](cookielens-extension/DEBUG_GUIDE.md)
- [Final Deployment Guide](cookielens-extension/FINAL_DEPLOYMENT_GUIDE.md)

## 🔒 Security

- All API keys and sensitive data are handled securely
- CORS is properly configured for browser extension integration
- AWS IAM roles are used for secure service access

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](cookielens-extension/LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions, please refer to the documentation files in the project or create an issue in this repository.

---

**Note**: This is a Lambda deployment snapshot created on $(date). All dependencies and configurations are included for immediate deployment to AWS Lambda.
