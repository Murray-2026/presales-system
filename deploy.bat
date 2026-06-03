@echo off
REM 部署到GitHub Pages - 请按顺序执行

echo ========================================
echo  售前项目管理系统 - 部署脚本
echo ========================================

REM 第一步: 安装前端依赖
echo [1/5] 安装前端依赖...
cd /d %~dp0frontend
call npx.cmd npm install
if %ERRORLEVEL% NEQ 0 (
    echo npm install失败，请手动执行: cd frontent && npm install
    pause
    exit /b 1
)

REM 第二步: 构建前端
echo [2/5] 构建前端...
call npx.cmd vite build
if %ERRORLEVEL% NEQ 0 (
    echo 构建失败，请检查代码
    pause
    exit /b 1
)

REM 第三步: 初始化Git并推送到GitHub
echo [3/5] 初始化Git仓库...
cd /d %~dp0
git init
git add -A
git commit -m "售前项目管理系统 MVP"

echo [4/5] 创建GitHub仓库...
gh repo create murray-2026/presales-system --public --description "售前项目管理系统"

echo [5/5] 推送到GitHub...
git remote add origin https://github.com/murray-2026/presales-system.git
git branch -M main
git push -u origin main

echo ========================================
echo  部署完成！
echo  部署后访问: https://murray-2026.github.io/presales-system/
echo ========================================
pause
