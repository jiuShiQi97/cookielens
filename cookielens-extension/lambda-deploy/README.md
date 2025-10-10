# CookieLens Lambda 部署指南

这个目录包含了将CookieLens项目部署到AWS Lambda的完整配置和脚本。

## 📁 文件结构

```
lambda-deploy/
├── lambda_function.py      # 主要的Lambda函数代码
├── requirements.txt       # Python依赖
├── serverless.yml         # Serverless Framework配置
├── template.yaml          # AWS SAM模板
├── package.json           # Node.js依赖（用于Serverless）
├── deploy.sh              # Serverless部署脚本
├── deploy-aws-cli.sh      # AWS CLI部署脚本
└── README.md              # 本文件
```

## 🚀 部署选项

### 选项1: 使用AWS CLI（推荐）

这是最简单快速的部署方式：

```bash
# 1. 确保已安装AWS CLI并配置好凭证
aws configure

# 2. 运行部署脚本
./deploy-aws-cli.sh
```

### 选项2: 使用Serverless Framework

如果你熟悉Serverless Framework：

```bash
# 1. 安装Node.js依赖
npm install

# 2. 运行部署脚本
./deploy.sh
```

### 选项3: 使用AWS SAM

如果你使用AWS SAM：

```bash
# 1. 安装AWS SAM CLI
# 2. 构建和部署
sam build
sam deploy --guided
```

## 🔧 部署前准备

### 1. AWS凭证配置

确保你的AWS凭证已正确配置：

```bash
aws configure
```

需要提供：
- AWS Access Key ID
- AWS Secret Access Key
- Default region (推荐: us-east-1)
- Default output format (推荐: json)

### 2. 权限要求

你的AWS账户需要以下权限：
- Lambda函数创建和管理
- IAM角色和策略创建
- API Gateway创建和管理
- S3存储桶创建
- Bedrock模型调用权限

### 3. 环境要求

- Python 3.9+
- AWS CLI 2.0+
- Node.js 18+ (如果使用Serverless Framework)

## 📋 部署后的资源

部署完成后，你将获得：

1. **Lambda函数**: `cookielens-scanner`
2. **API Gateway**: 提供HTTP端点
3. **S3存储桶**: 存储扫描结果
4. **IAM角色**: 包含必要的权限

## 🧪 测试部署

### 1. 使用curl测试

```bash
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/scan \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com"}'
```

### 2. 使用AWS CLI测试

```bash
aws lambda invoke \
  --function-name cookielens-scanner \
  --payload '{"body": "{\"url\": \"https://example.com\"}"}' \
  response.json
```

### 3. 查看日志

```bash
aws logs tail /aws/lambda/cookielens-scanner --follow
```

## 🔍 功能说明

### API端点

- `POST /scan` - 扫描网站隐私信息
- `GET /health` - 健康检查

### 请求格式

```json
{
  "url": "https://example.com"
}
```

### 响应格式

```json
{
  "url": "https://example.com",
  "scannedAt": "2024-01-01T00:00:00Z",
  "cookies": [...],
  "localStorage": {...},
  "thirdParties": [...],
  "humanReadableAnalysis": "AI分析结果...",
  "s3Path": "s3://bucket/path"
}
```

## 🛠️ 故障排除

### 常见问题

1. **权限错误**
   - 确保IAM角色有正确的权限
   - 检查Bedrock访问权限

2. **超时错误**
   - Lambda函数默认超时时间是5分钟
   - 如果网站加载慢，可能需要增加超时时间

3. **内存不足**
   - Playwright需要较多内存
   - 默认设置为1024MB，可根据需要调整

4. **依赖问题**
   - 确保所有Python依赖都正确安装
   - Playwright需要额外的浏览器二进制文件

### 查看日志

```bash
# 查看Lambda日志
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/cookielens

# 实时查看日志
aws logs tail /aws/lambda/cookielens-scanner --follow
```

## 💰 成本估算

- **Lambda**: 按请求和计算时间计费
- **API Gateway**: 按请求数量计费
- **S3**: 按存储和请求计费
- **Bedrock**: 按AI模型调用计费

预计每月成本（1000次扫描）: $5-15

## 🔄 更新部署

要更新Lambda函数：

```bash
# 重新打包
zip -r cookielens-lambda.zip . -x "*.git*" "*.DS_Store*"

# 更新函数代码
aws lambda update-function-code \
  --function-name cookielens-scanner \
  --zip-file fileb://cookielens-lambda.zip
```

## 🗑️ 清理资源

要删除所有创建的资源：

```bash
# 删除Lambda函数
aws lambda delete-function --function-name cookielens-scanner

# 删除API Gateway
aws apigateway delete-rest-api --rest-api-id YOUR_API_ID

# 删除S3存储桶
aws s3 rb s3://your-bucket-name --force

# 删除IAM角色
aws iam detach-role-policy --role-name cookielens-lambda-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name cookielens-lambda-role
```

## 📞 支持

如果遇到问题，请检查：
1. AWS凭证是否正确配置
2. 是否有足够的权限
3. 网络连接是否正常
4. Lambda函数日志中的错误信息
