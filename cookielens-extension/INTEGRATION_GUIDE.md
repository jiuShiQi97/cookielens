# CookieLens 前后端集成指南

## 🚀 快速开始

### 1. 启动后端服务

```bash
cd cookielens-extension/backend
python start_server.py
```

后端服务将在 `http://localhost:8000` 启动。

### 2. 安装前端扩展

1. 打开 Chrome/Edge 浏览器
2. 访问 `chrome://extensions` 或 `edge://extensions`
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `cookielens-extension/frontend` 文件夹

### 3. 测试集成

```bash
cd cookielens-extension/backend
python test_api.py
```

## 📋 API 接口说明

### 扫描网站合规性
- **URL**: `POST http://localhost:8000/scan-with-compliance`
- **请求体**:
```json
{
  "web_link": "https://www.yami.com/en"
}
```

- **响应格式**:
```json
{
  "scan_results": {
    "url": "https://www.yami.com/en",
    "scannedAt": "2024-01-01T00:00:00Z",
    "cookies": [...],
    "thirdParties": [...],
    "humanReadableAnalysis": "详细的人工可读分析..."
  },
  "compliance_analysis": {
    "gdpr": {
      "framework": "GDPR",
      "score": 75.0,
      "status": "needs_improvement",
      "passed_controls": [...],
      "failed_controls": [...],
      "warnings": [...],
      "recommendations": [...]
    },
    "ccpa": {
      "framework": "CCPA",
      "score": 80.0,
      "status": "compliant",
      "passed_controls": [...],
      "failed_controls": [...],
      "warnings": [...],
      "recommendations": [...]
    }
  },
  "third_party_risks": [...],
  "overall_summary": {
    "overall_score": 77.5,
    "frameworks_analyzed": 2,
    "total_passed": 8,
    "total_failed": 3,
    "total_warnings": 2
  }
}
```

## 🎯 前端功能

### 弹窗显示内容

1. **隐私分析摘要** - 显示 `humanReadableAnalysis`
2. **合规分析** - 可展开显示 `compliance_analysis`
   - 总体合规摘要
   - 各框架详细分析 (GDPR, CCPA)
   - 通过/失败的控件
   - 警告和建议
3. **Cookie 分析** - 显示检测到的 Cookie 详情
4. **第三方服务** - 显示第三方服务列表

### 使用方法

1. 访问任何网站
2. CookieLens 会自动显示分析弹窗
3. 输入要分析的网址（默认为当前页面）
4. 点击"Analyze Privacy & Compliance"
5. 查看详细的分析报告

## 🔧 开发说明

### 后端依赖
- FastAPI
- Playwright (网页抓取)
- Boto3 (AWS 服务)
- Pydantic (数据验证)

### 前端技术
- Chrome Extension Manifest V3
- Shadow DOM (避免样式冲突)
- Fetch API (HTTP 请求)

### 文件结构
```
cookielens-extension/
├── backend/
│   ├── app.py                 # FastAPI 应用
│   ├── compliance_analyzer.py # 合规分析器
│   ├── lambda_function.py    # 核心扫描逻辑
│   ├── start_server.py       # 启动脚本
│   └── test_api.py           # API 测试脚本
└── frontend/
    ├── content/
    │   └── content.js        # 主要前端逻辑
    ├── manifest.json         # 扩展配置
    └── ...
```

## 🐛 故障排除

### 后端无法启动
1. 检查 Python 依赖是否安装: `pip install -r requirements.txt`
2. 检查端口 8000 是否被占用
3. 查看控制台错误信息

### 前端无法连接后端
1. 确认后端服务正在运行
2. 检查浏览器控制台是否有 CORS 错误
3. 确认 API URL 正确 (`http://localhost:8000`)

### 分析失败
1. 检查网络连接
2. 确认目标网站可访问
3. 查看后端日志了解详细错误

## 📞 支持

如有问题，请检查：
1. 后端服务日志
2. 浏览器开发者工具控制台
3. 网络请求状态

## 🔄 更新日志

- ✅ 集成后端 `/scan-with-compliance` API
- ✅ 显示 `humanReadableAnalysis` 在弹窗中
- ✅ 添加可展开的 `compliance_analysis` 部分
- ✅ 支持 GDPR 和 CCPA 合规分析
- ✅ 改进用户界面和用户体验
