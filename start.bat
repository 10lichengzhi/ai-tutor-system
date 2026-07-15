@echo off
chcp 65001 >nul
title AI智师导学系统 - 启动器
echo ========================================
echo    🤖 AI智师导学系统 - 一键启动
echo ========================================
echo.

:: 检查Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到Node.js，请先安装Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] 检查前端依赖...
cd /d "%~dp0frontend"
if not exist node_modules (
    echo 首次运行，正在安装npm依赖（使用国内镜像）...
    call npm install --registry=https://registry.npmmirror.com
    if %errorlevel% neq 0 (
        echo [错误] npm依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
    echo 依赖安装完成！
) else (
    echo 前端依赖已存在，跳过安装
)

echo.
echo [2/3] 启动后端AI代理服务 (端口 8000)...
cd /d "%~dp0"
start "AI智师-后端代理" cmd /k "node proxy-server.js"

:: 等待后端启动
timeout /t 2 /nobreak >nul

echo [3/3] 启动前端开发服务器 (端口 5182)...
cd /d "%~dp0frontend"
start "AI智师-前端" cmd /k "npm run dev"

:: 等待前端启动
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo    ✅ 启动完成！
echo ========================================
echo.
echo  📱 前端地址: http://localhost:5182
echo  🔧 后端服务: http://localhost:8000
echo.
echo  💡 提示:
echo     - 关闭两个命令行窗口即可停止服务
echo     - 首次启动可能需要等待几秒编译
echo     - 浏览器会自动打开，如果没有请手动访问
echo.
echo ========================================
echo.

:: 打开浏览器
timeout /t 3 /nobreak >nul
start http://localhost:5182

exit /b 0
