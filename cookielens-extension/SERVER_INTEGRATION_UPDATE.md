# CookieLens 服务器启动方式更新

## 🚀 修改内容

已将服务器启动方式从 `start_server.py` 改为直接使用 `app.py`，确保前端正确整合到后端。

## 📋 启动方式

### 方式一：使用 start_server.py（推荐）
```bash
cd cookielens-extension/backend
python start_server.py
```

### 方式二：直接运行 app.py
```bash
cd cookielens-extension/backend
python app.py
```

### 方式三：使用新的 run.py 脚本
```bash
cd cookielens-extension/backend
python run.py
```

### 方式四：使用 uvicorn 直接启动
```bash
cd cookielens-extension/backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## 🔗 前端整合

前端扩展已正确配置为调用后端API：
- **API端点**: `http://localhost:8000/scan-with-compliance`
- **请求格式**: `{"web_link": "网站URL"}`
- **响应格式**: 包含扫描结果和合规性分析

## ✅ 验证步骤

1. **启动后端服务器**:
   ```bash
   cd cookielens-extension/backend
   python start_server.py
   ```

2. **测试API**:
   ```bash
   python test_api.py
   ```

3. **安装Chrome扩展**:
   - 加载 `cookielens-extension/frontend/` 文件夹
   - 访问任何网站测试功能

## 📊 服务器信息

- **地址**: http://localhost:8000
- **API文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/
- **扫描端点**: http://localhost:8000/scan-with-compliance

## 🛠️ 技术细节

- 所有启动方式都直接导入并运行 `app.py` 中的 FastAPI 应用
- 前端通过 `fetch()` 调用本地API
- 支持热重载，代码修改后自动重启
- 包含完整的错误处理和日志记录

