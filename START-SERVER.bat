@echo off
title Student Management System - Server
color 0A

echo.
echo ========================================================
echo   STUDENT MANAGEMENT SYSTEM - Starting Server...
echo ========================================================
echo.

cd /d "%~dp0"

echo Checking if Node.js is installed...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Then run this file again.
    echo.
    pause
    exit /b 1
)

echo Node.js found!
echo.

echo Checking if dependencies are installed...
if not exist "node_modules\" (
    echo Dependencies not found. Installing...
    echo This will take about 30 seconds...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to install dependencies!
        echo.
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
    echo.
)

echo Starting server...
echo.
echo The server will start shortly.
echo After it starts, open your browser and go to:
echo http://localhost:3000
echo.
echo Press Ctrl+C to stop the server when you're done.
echo.
echo ========================================================
echo.

call npm start

pause

