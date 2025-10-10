# 使用 Playwright 官方 Python 基础镜像（含 Chromium 及依赖）
FROM mcr.microsoft.com/playwright/python:v1.45.0-jammy

# 安装 Lambda 运行时与 AWS SDK
RUN pip install --no-cache-dir awslambdaric boto3

# 复制函数代码到 /var/task（Lambda 默认工作目录）
COPY lambda_function.py /var/task/

# 入口：启动 Lambda Runtime Interface Client
ENTRYPOINT ["/usr/bin/python", "-m", "awslambdaric"]
CMD ["lambda_function.lambda_handler"]
