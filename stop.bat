@echo off
chcp 65001 >nul
echo ========================================
echo    🛑 停止AI智师导学系统服务
echo ========================================
echo.

echo 正在停止Node.js服务...
taskkill /f /im node.exe >nul 2>nul

echo 正在关闭命令行窗口...
for /f "tokens=2" %%a in ('tasklist /v ^| findstr /c:"AI智师-后端代理"') do (
    taskkill /f /pid %%a >nul 2>nul
)
for /f "tokens=2" %%a in ('tasklist /v ^| findstr /c:"AI智师-前端"') do (
    taskkill /f /pid %%a >nul 2>nul
)

echo.
echo ✅ 所有服务已停止
echo ========================================
timeout /t 2 >nul
