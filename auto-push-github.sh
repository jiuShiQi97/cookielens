#!/bin/bash

# CookieLens Lambda部署版本 - 自动GitHub仓库创建和推送脚本

echo "🚀 正在准备GitHub仓库创建..."
echo ""

# 检查Git状态
echo "📋 检查Git状态..."
git status --porcelain
if [ $? -eq 0 ]; then
    echo "✅ Git状态正常"
else
    echo "❌ Git状态异常"
    exit 1
fi

echo ""
echo "🔗 自动打开GitHub仓库创建页面..."

# 尝试打开GitHub仓库创建页面
if command -v open >/dev/null 2>&1; then
    open "https://github.com/new"
    echo "✅ 已打开GitHub仓库创建页面"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "https://github.com/new"
    echo "✅ 已打开GitHub仓库创建页面"
else
    echo "⚠️  请手动访问: https://github.com/new"
fi

echo ""
echo "📝 请按照以下信息创建仓库："
echo "   仓库名称: cookielens-lambda-deployment"
echo "   描述: CookieLens Lambda Deployment Version - Complete snapshot ready for AWS deployment"
echo "   可见性: Public 或 Private (你的选择)"
echo "   ⚠️  不要勾选任何初始化选项"
echo ""

# 等待用户确认
echo "⏳ 请创建仓库后按任意键继续..."
read -n 1 -s

echo ""
echo "📤 正在推送代码到GitHub..."

# 尝试推送
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 成功！Lambda部署版本已上传到GitHub！"
    echo "🔗 仓库地址: https://github.com/jiuShiQi97/cookielens-lambda-deployment"
    echo ""
    echo "📊 项目统计："
    echo "   - 提交数: $(git rev-list --count HEAD)"
    echo "   - 文件数: $(git ls-files | wc -l)"
    echo "   - 分支: $(git branch --show-current)"
    echo ""
    echo "✨ 你的CookieLens Lambda部署版本快照现在可以在GitHub上访问了！"
else
    echo ""
    echo "❌ 推送失败。可能的原因："
    echo "   1. 仓库还未创建"
    echo "   2. 需要身份验证"
    echo "   3. 网络问题"
    echo ""
    echo "🔧 请检查："
    echo "   1. 确保已在GitHub上创建了仓库"
    echo "   2. 确保有推送权限"
    echo "   3. 如果需要身份验证，请配置GitHub token"
    echo ""
    echo "📞 如果问题持续，请手动运行: git push -u origin main"
fi
