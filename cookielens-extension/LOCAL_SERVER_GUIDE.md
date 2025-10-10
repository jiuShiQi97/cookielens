# CookieLens 本地服务器使用指南

## 🚀 快速启动

### 1. 启动本地服务器
```bash
cd cookielens-extension/backend
python start_server.py
```

或者直接运行 app.py：
```bash
cd cookielens-extension/backend
python app.py
```

服务器将在 `http://localhost:8000` 启动

### 2. 测试API
```bash
# 健康检查
curl http://localhost:8000/

# 扫描网站合规性
curl -X POST "http://localhost:8000/scan-with-compliance" \
  -H "Content-Type: application/json" \
  -d '{"web_link": "https://www.yami.com/en"}'
```

### 3. 查看API文档
访问 `http://localhost:8000/docs` 查看完整的API文档

## 📋 API 端点

### 健康检查
- **GET** `/` - 检查服务器状态

### 扫描端点
- **POST** `/scan` - 基础网站扫描
- **POST** `/scan-with-compliance` - 带合规分析的扫描

## 🔧 前端集成

前端扩展已经配置为调用本地服务器：
- API URL: `http://localhost:8000/scan-with-compliance`
- 请求格式: `{"web_link": "网站URL"}`

## 📊 响应格式

```json
{
  "scan_results": {
    "url": "https://www.yami.com/en",
    "scannedAt": "2025-01-01T00:00:00Z",
    "cookies": [...],
    "thirdParties": [...],
    "humanReadableAnalysis": "AI生成的分析报告..."
  },
  "compliance_analysis": {
    "gdpr": {...},
    "ccpa": {...}
  },
  "overall_summary": {...}
}
```

## 🛠️ 故障排除

### 端口被占用
```bash
# 查找占用端口的进程
lsof -i :8000

# 杀死进程
lsof -ti:8000 | xargs kill -9
```

### 依赖问题
```bash
# 安装依赖
pip install -r requirements.txt
```

## ✅ 验证成功

服务器启动后，你应该看到：
- ✅ 健康检查返回 `{"status":"ok"}`
- ✅ API调用返回完整的扫描结果
- ✅ 前端扩展可以正常调用API
